import {Box, Icon, colorAccentGray} from '@dagster-io/ui-components';
import * as React from 'react';
import {Link} from 'react-router-dom';

import {RepoAddress} from '../workspace/types';
import {workspacePipelinePath, workspacePipelinePathGuessRepo} from '../workspace/workspacePath';

import {PipelineSnapshotLink} from './PipelinePathUtils';

export interface Props {
  pipelineName: string;
  pipelineHrefContext: 'repo-unknown' | RepoAddress | 'no-link';
  isJob: boolean;
  snapshotId?: string | null;
  showIcon?: boolean;
  truncationThreshold?: number;
  size?: 'small' | 'normal';
}

const DEFAULT_TRUNCATION_THRESHOLD = 40;
const TRUNCATION_BUFFER = 5;

export const PipelineReference = ({
  pipelineName,
  pipelineHrefContext,
  isJob,
  snapshotId,
  showIcon,
  truncationThreshold = DEFAULT_TRUNCATION_THRESHOLD,
  size = 'normal',
}: Props) => {
  const truncatedName =
    truncationThreshold > 0 && pipelineName.length > truncationThreshold
      ? `${pipelineName.slice(0, truncationThreshold - TRUNCATION_BUFFER)}…`
      : pipelineName;

  const pipeline =
    pipelineHrefContext === 'repo-unknown' ? (
      <Link to={workspacePipelinePathGuessRepo(pipelineName)}>{truncatedName}</Link>
    ) : pipelineHrefContext === 'no-link' ? (
      <>{truncatedName}</>
    ) : (
      <Link
        to={workspacePipelinePath({
          repoName: pipelineHrefContext.name,
          repoLocation: pipelineHrefContext.location,
          pipelineName,
          isJob,
        })}
      >
        {truncatedName}
      </Link>
    );

  return (
    <Box flex={{direction: 'row', alignItems: 'center', display: 'inline-flex'}}>
      {showIcon && (
        <Box margin={{right: 8}}>
          <Icon color={colorAccentGray()} name="job" />
        </Box>
      )}
      <span>
        {pipeline}
        {snapshotId && ' @ '}
        {snapshotId && (
          <PipelineSnapshotLink snapshotId={snapshotId} pipelineName={pipelineName} size={size} />
        )}
      </span>
    </Box>
  );
};
