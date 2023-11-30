import {Box, Spinner} from '@dagster-io/ui-components';
import uniq from 'lodash/uniq';
import React from 'react';
import {useHistory} from 'react-router-dom';
import styled from 'styled-components';

import {useFeatureFlags} from '../app/Flags';
import {AssetEdges} from '../asset-graph/AssetEdges';
import {MINIMAL_SCALE} from '../asset-graph/AssetGraphExplorer';
import {AssetGroupNode} from '../asset-graph/AssetGroupNode';
import {AssetNodeMinimal, AssetNode, AssetNodeContextMenuWrapper} from '../asset-graph/AssetNode';
import {ExpandedGroupNode} from '../asset-graph/ExpandedGroupNode';
import {AssetNodeLink} from '../asset-graph/ForeignNode';
import {GraphData, groupIdForNode, toGraphId} from '../asset-graph/Utils';
import {DEFAULT_MAX_ZOOM, SVGViewport} from '../graph/SVGViewport';
import {useAssetLayout} from '../graph/asyncGraphLayout';
import {isNodeOffscreen} from '../graph/common';
import {AssetKeyInput} from '../graphql/types';
import {getJSONForKey} from '../hooks/useStateWithStorage';

import {assetDetailsPathForKey} from './assetDetailsPathForKey';
import {AssetKey, AssetViewParams} from './types';

const LINEAGE_GRAPH_ZOOM_LEVEL = 'lineageGraphZoomLevel';

export const AssetNodeLineageGraph = ({
  assetKey,
  assetGraphData,
  params,
}: {
  assetKey: AssetKeyInput;
  assetGraphData: GraphData;
  params: AssetViewParams;
}) => {
  const {flagDAGSidebar} = useFeatureFlags();

  const assetGraphId = toGraphId(assetKey);
  const allGroups = React.useMemo(
    () => uniq(Object.values(assetGraphData.nodes).map((g) => groupIdForNode(g))),
    [assetGraphData],
  );
  const [highlighted, setHighlighted] = React.useState<string | null>(null);

  // Use the pathname as part of the key so that different deployments don't invalidate each other's cached layout
  // and so that different assets dont invalidate each others layout
  const {layout, loading} = useAssetLayout(assetGraphData, allGroups);
  const viewportEl = React.useRef<SVGViewport>();
  const history = useHistory();

  const onClickAsset = (key: AssetKey) => {
    history.push(assetDetailsPathForKey(key, {...params, lineageScope: 'neighbors'}));
  };

  React.useEffect(() => {
    if (viewportEl.current && layout) {
      const lastZoomLevel = Number(getJSONForKey(LINEAGE_GRAPH_ZOOM_LEVEL));
      viewportEl.current.autocenter(false, lastZoomLevel);
      viewportEl.current.focus();
    }
  }, [viewportEl, layout, assetGraphId]);

  if (!layout || loading) {
    return (
      <Box style={{flex: 1}} flex={{alignItems: 'center', justifyContent: 'center'}}>
        <Spinner purpose="page" />
      </Box>
    );
  }

  return (
    <SVGViewport
      ref={(r) => (viewportEl.current = r || undefined)}
      interactor={SVGViewport.Interactors.PanAndZoom}
      defaultZoom="zoom-to-fit"
      graphWidth={layout.width}
      graphHeight={layout.height}
      onDoubleClick={(e) => {
        viewportEl.current?.autocenter(true);
        e.stopPropagation();
      }}
      maxZoom={DEFAULT_MAX_ZOOM}
      maxAutocenterZoom={DEFAULT_MAX_ZOOM}
    >
      {({scale}, viewportRect) => (
        <SVGContainer width={layout.width} height={layout.height}>
          {viewportEl.current && <SVGSaveZoomLevel scale={scale} />}

          {Object.values(layout.groups)
            .filter((node) => !isNodeOffscreen(node.bounds, viewportRect))
            .sort((a, b) => a.id.length - b.id.length)
            .map((group) => (
              <foreignObject {...group.bounds} key={group.id}>
                {flagDAGSidebar ? (
                  <ExpandedGroupNode group={group} minimal={scale < MINIMAL_SCALE} />
                ) : (
                  <AssetGroupNode group={group} scale={scale} />
                )}
              </foreignObject>
            ))}

          <AssetEdges
            selected={null}
            highlighted={highlighted}
            edges={layout.edges}
            viewportRect={viewportRect}
          />

          {Object.values(layout.nodes)
            .filter((node) => !isNodeOffscreen(node.bounds, viewportRect))
            .map(({id, bounds}) => {
              const graphNode = assetGraphData.nodes[id];
              const path = JSON.parse(id);

              const contextMenuProps = {
                graphData: assetGraphData,
                node: graphNode!,
              };

              return (
                <foreignObject
                  {...bounds}
                  key={id}
                  style={{overflow: 'visible'}}
                  onMouseEnter={() => setHighlighted(id)}
                  onMouseLeave={() => setHighlighted(null)}
                  onClick={() => onClickAsset({path})}
                  onDoubleClick={(e) => {
                    viewportEl.current?.zoomToSVGBox(bounds, true, 1.2);
                    e.stopPropagation();
                  }}
                >
                  {!graphNode ? (
                    <AssetNodeLink assetKey={{path}} />
                  ) : scale < MINIMAL_SCALE ? (
                    <AssetNodeContextMenuWrapper {...contextMenuProps}>
                      <AssetNodeMinimal
                        definition={graphNode.definition}
                        selected={graphNode.id === assetGraphId}
                        height={bounds.height}
                      />
                    </AssetNodeContextMenuWrapper>
                  ) : (
                    <AssetNodeContextMenuWrapper {...contextMenuProps}>
                      <AssetNode
                        definition={graphNode.definition}
                        selected={graphNode.id === assetGraphId}
                      />
                    </AssetNodeContextMenuWrapper>
                  )}
                </foreignObject>
              );
            })}
        </SVGContainer>
      )}
    </SVGViewport>
  );
};

const SVGSaveZoomLevel = ({scale}: {scale: number}) => {
  React.useEffect(() => {
    try {
      window.localStorage.setItem(LINEAGE_GRAPH_ZOOM_LEVEL, JSON.stringify(scale));
    } catch (err) {
      // no-op
    }
  }, [scale]);
  return <></>;
};

const SVGContainer = styled.svg`
  overflow: visible;
  border-radius: 0;
`;
