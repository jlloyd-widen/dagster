import {Popover, Spinner} from '@dagster-io/ui-components';
import * as React from 'react';
import styled, {css, keyframes} from 'styled-components';

import {RunStatus} from '../graphql/types';

import {RunStats} from './RunStats';
import {RUN_STATUS_COLORS} from './RunStatusTag';
import {inProgressStatuses, queuedStatuses} from './RunStatuses';

export const RunStatusWithStats = React.memo(
  ({
    runId,
    ...rest
  }: RunStatusProps & {
    runId: string;
  }) => (
    <Popover
      position="bottom"
      interactionKind="hover"
      content={<RunStats runId={runId} />}
      hoverOpenDelay={100}
    >
      <RunStatusIndicator {...rest} />
    </Popover>
  ),
);

interface RunStatusProps {
  status: RunStatus | 'SCHEDULED';
  size?: number;
}

export const RunStatusIndicator = React.memo(({status, size}: RunStatusProps) => {
  if (status === 'STARTED' || status === 'CANCELING') {
    return <Spinner purpose="caption-text" />;
  }
  if (status === 'SCHEDULED') {
    return <RunStatusDot status={status} size={size || 12} />;
  }
  return (
    <RunStatusDot
      status={status}
      size={size || 12}
      pulse={inProgressStatuses.has(status) || queuedStatuses.has(status)}
    />
  );
});

const pulseAnimation = keyframes`
  0% {
    filter: brightness(1);
  }

  50% {
    filter: brightness(0.6);
  }

  100% {
    filter: brightness(1);
  }
`;

export const RunStatusDot = styled.div<{
  status: RunStatus | 'SCHEDULED';
  size: number;
  pulse?: boolean;
}>`
  width: ${({size}) => size}px;
  height: ${({size}) => size}px;
  border-radius: ${({size}) => size / 2}px;
  transition: filter 200ms linear;
  ${({pulse}) =>
    pulse
      ? css`
          animation: ${pulseAnimation} 2s infinite;
        `
      : null}

  background: ${({status}) => RUN_STATUS_COLORS[status]};
  &:hover {
    animation: none;
    filter: brightness(0.6);
  }
`;
