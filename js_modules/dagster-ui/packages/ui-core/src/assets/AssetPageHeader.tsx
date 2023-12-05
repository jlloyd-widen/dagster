// eslint-disable-next-line no-restricted-imports
import {BreadcrumbProps, Breadcrumbs} from '@blueprintjs/core';
import {
  Box,
  PageHeader,
  Heading,
  Icon,
  Tooltip,
  IconWrapper,
  colorLinkDefault,
  colorTextLight,
  colorAccentGray,
  colorAccentGrayHover,
  colorTextLighter,
} from '@dagster-io/ui-components';
import React from 'react';
import {Link} from 'react-router-dom';
import styled from 'styled-components';

import {showSharedToaster} from '../app/DomUtils';
import {useCopyToClipboard} from '../app/browser';

type Props = {assetKey: {path: string[]}} & Partial<React.ComponentProps<typeof PageHeader>>;

export const AssetPageHeader = ({assetKey, ...extra}: Props) => {
  const copy = useCopyToClipboard();
  const copyableString = assetKey.path.join('/');
  const [didCopy, setDidCopy] = React.useState(false);
  const iconTimeout = React.useRef<NodeJS.Timeout>();

  const performCopy = React.useCallback(async () => {
    if (iconTimeout.current) {
      clearTimeout(iconTimeout.current);
    }

    copy(copyableString);
    setDidCopy(true);
    await showSharedToaster({
      icon: 'done',
      intent: 'primary',
      message: 'Copied asset key!',
    });

    iconTimeout.current = setTimeout(() => {
      setDidCopy(false);
    }, 2000);
  }, [copy, copyableString]);

  const breadcrumbs = React.useMemo(() => {
    const list: BreadcrumbProps[] = [{text: 'Assets', href: '/assets'}];

    assetKey.path.reduce((accum: string, elem: string) => {
      const href = `${accum}/${encodeURIComponent(elem)}`;
      list.push({text: elem, href});
      return href;
    }, '/assets');

    return list;
  }, [assetKey.path]);

  return (
    <PageHeader
      title={
        <Box
          flex={{alignItems: 'center', gap: 4}}
          style={{maxWidth: '600px', overflow: 'hidden', marginBottom: 4}}
        >
          <BreadcrumbsWithSlashes
            items={breadcrumbs}
            currentBreadcrumbRenderer={({text}) => <Heading>{text}</Heading>}
            breadcrumbRenderer={({text, href}) => (
              <Heading>
                <BreadcrumbLink to={href || '#'}>{text}</BreadcrumbLink>
              </Heading>
            )}
          />
          <Tooltip placement="bottom" content="Copy asset key">
            <CopyButton onClick={performCopy}>
              <Icon
                name={didCopy ? 'copy_to_clipboard_done' : 'copy_to_clipboard'}
                color={colorAccentGray()}
              />
            </CopyButton>
          </Tooltip>
        </Box>
      }
      {...extra}
    />
  );
};

const CopyButton = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 3px;
  margin-top: 2px;

  :focus {
    outline: none;
  }

  ${IconWrapper} {
    transition: background-color 100ms linear;
  }

  :hover ${IconWrapper} {
    background-color: ${colorAccentGrayHover()};
  }
`;

export const AssetGlobalLineageLink = () => (
  <Link to="/asset-groups">
    <Box flex={{gap: 4}}>
      <Icon color={colorLinkDefault()} name="schema" />
      View global asset lineage
    </Box>
  </Link>
);

const BreadcrumbsWithSlashes = styled(Breadcrumbs)`
  & li:not(:first-child)::after {
    background: none;
    font-size: 20px;
    font-weight: bold;
    color: ${colorTextLighter()};
    content: '/';
    width: 8px;
    line-height: 16px;
  }
`;

const BreadcrumbLink = styled(Link)`
  color: ${colorTextLight()};

  :hover,
  :active {
    color: ${colorTextLight()};
  }
`;
