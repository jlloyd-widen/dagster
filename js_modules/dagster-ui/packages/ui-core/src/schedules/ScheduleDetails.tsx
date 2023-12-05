import {
  Box,
  ButtonLink,
  Group,
  MetadataTableWIP,
  PageHeader,
  Tag,
  Code,
  Heading,
  Mono,
  Tooltip,
  Button,
  colorTextLight,
  colorTextDefault,
} from '@dagster-io/ui-components';
import * as React from 'react';

import {QueryRefreshCountdown, QueryRefreshState} from '../app/QueryRefresh';
import {useCopyToClipboard} from '../app/browser';
import {InstigationStatus} from '../graphql/types';
import {RepositoryLink} from '../nav/RepositoryLink';
import {PipelineReference} from '../pipelines/PipelineReference';
import {EvaluateScheduleDialog} from '../ticks/EvaluateScheduleDialog';
import {TickStatusTag} from '../ticks/TickStatusTag';
import {isThisThingAJob, useRepository} from '../workspace/WorkspaceContext';
import {RepoAddress} from '../workspace/types';

import {SchedulePartitionStatus} from './SchedulePartitionStatus';
import {ScheduleSwitch} from './ScheduleSwitch';
import {TimestampDisplay} from './TimestampDisplay';
import {humanCronString} from './humanCronString';
import {ScheduleFragment} from './types/ScheduleUtils.types';

const TIME_FORMAT = {showSeconds: false, showTimezone: true};

export const ScheduleDetails = (props: {
  schedule: ScheduleFragment;
  repoAddress: RepoAddress;
  refreshState: QueryRefreshState;
}) => {
  const {repoAddress, schedule, refreshState} = props;
  const {cronSchedule, executionTimezone, futureTicks, name, partitionSet, pipelineName} = schedule;
  const copyToClipboard = useCopyToClipboard();

  const repo = useRepository(repoAddress);
  const isJob = isThisThingAJob(repo, pipelineName);

  const [copyText, setCopyText] = React.useState('Click to copy');

  // Restore the tooltip text after a delay.
  React.useEffect(() => {
    let token: any;
    if (copyText === 'Copied!') {
      token = setTimeout(() => {
        setCopyText('Click to copy');
      }, 2000);
    }
    return () => {
      token && clearTimeout(token);
    };
  }, [copyText]);

  const {scheduleState} = schedule;
  const {status, id, ticks} = scheduleState;
  const latestTick = ticks.length > 0 ? ticks[0] : null;

  const copyId = () => {
    copyToClipboard(id);
    setCopyText('Copied!');
  };

  const running = status === InstigationStatus.RUNNING;

  const [showTestTickDialog, setShowTestTickDialog] = React.useState(false);

  return (
    <>
      <PageHeader
        title={
          <Box flex={{direction: 'row', alignItems: 'center', gap: 12}}>
            <Heading>{name}</Heading>
            <ScheduleSwitch repoAddress={repoAddress} schedule={schedule} />
          </Box>
        }
        tags={
          <>
            <Tag icon="schedule">
              Schedule in <RepositoryLink repoAddress={repoAddress} />
            </Tag>
            {futureTicks.results[0] && running ? (
              <Tag icon="timer">
                Next tick:{' '}
                <TimestampDisplay
                  timestamp={futureTicks.results[0].timestamp!}
                  timezone={executionTimezone}
                  timeFormat={TIME_FORMAT}
                />
              </Tag>
            ) : null}
            <Box flex={{display: 'inline-flex'}} margin={{top: 2}}>
              <Tooltip content={copyText}>
                <ButtonLink
                  color={{link: colorTextLight(), hover: colorTextDefault()}}
                  onClick={copyId}
                >
                  <Mono>{`id: ${id.slice(0, 8)}`}</Mono>
                </ButtonLink>
              </Tooltip>
            </Box>
          </>
        }
        right={
          <Box flex={{direction: 'row', alignItems: 'center', gap: 8}}>
            <QueryRefreshCountdown refreshState={refreshState} />
            <Button
              onClick={() => {
                setShowTestTickDialog(true);
              }}
            >
              Test Schedule
            </Button>
          </Box>
        }
      />
      <EvaluateScheduleDialog
        key={showTestTickDialog ? '1' : '0'} // change key to reset dialog state
        isOpen={showTestTickDialog}
        onClose={() => {
          setShowTestTickDialog(false);
        }}
        name={schedule.name}
        repoAddress={repoAddress}
        jobName={pipelineName}
      />
      <MetadataTableWIP>
        <tbody>
          {schedule.description ? (
            <tr>
              <td>Description</td>
              <td>{schedule.description}</td>
            </tr>
          ) : null}
          <tr>
            <td>Latest tick</td>
            <td>
              {latestTick ? (
                <Group direction="row" spacing={8} alignItems="center">
                  <TimestampDisplay
                    timestamp={latestTick.timestamp}
                    timezone={executionTimezone}
                    timeFormat={TIME_FORMAT}
                  />
                  <TickStatusTag tick={latestTick} />
                </Group>
              ) : (
                'Schedule has never run'
              )}
            </td>
          </tr>
          <tr>
            <td>{isJob ? 'Job' : 'Pipeline'}</td>
            <td>
              <PipelineReference
                pipelineName={pipelineName}
                pipelineHrefContext={repoAddress}
                isJob={isJob}
              />
            </td>
          </tr>
          <tr>
            <td>Partition set</td>
            <td>
              {partitionSet ? (
                <SchedulePartitionStatus schedule={schedule} repoAddress={repoAddress} />
              ) : (
                'None'
              )}
            </td>
          </tr>
          <tr>
            <td>Schedule</td>
            <td>
              {cronSchedule ? (
                <Group direction="row" spacing={8}>
                  <span>{humanCronString(cronSchedule, executionTimezone || 'UTC')}</span>
                  <Code>({cronSchedule})</Code>
                </Group>
              ) : (
                <div>&mdash;</div>
              )}
            </td>
          </tr>
          {executionTimezone ? (
            <tr>
              <td>Execution timezone</td>
              <td>{executionTimezone}</td>
            </tr>
          ) : null}
        </tbody>
      </MetadataTableWIP>
    </>
  );
};
