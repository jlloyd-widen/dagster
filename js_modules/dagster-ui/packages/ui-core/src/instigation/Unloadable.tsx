import {useMutation} from '@apollo/client';
import {
  Alert,
  Box,
  Checkbox,
  Group,
  Table,
  Subheading,
  Tooltip,
  colorTextLight,
} from '@dagster-io/ui-components';
import * as React from 'react';

import {useConfirmation} from '../app/CustomConfirmationProvider';
import {DEFAULT_DISABLED_REASON} from '../app/Permissions';
import {InstigationStatus} from '../graphql/types';
import {
  displayScheduleMutationErrors,
  STOP_SCHEDULE_MUTATION,
} from '../schedules/ScheduleMutations';
import {humanCronString} from '../schedules/humanCronString';
import {
  StopScheduleMutation,
  StopScheduleMutationVariables,
} from '../schedules/types/ScheduleMutations.types';
import {displaySensorMutationErrors, STOP_SENSOR_MUTATION} from '../sensors/SensorMutations';
import {
  StopRunningSensorMutation,
  StopRunningSensorMutationVariables,
} from '../sensors/types/SensorMutations.types';
import {TickStatusTag} from '../ticks/TickStatusTag';
import {InstigatorSelectorInformation} from '../workspace/RepositoryInformation';

import {InstigatedRunStatus} from './InstigationUtils';
import {InstigationStateFragment} from './types/InstigationUtils.types';

export const UnloadableSensors = ({
  sensorStates,
  showSubheading = true,
}: {
  sensorStates: InstigationStateFragment[];
  showSubheading?: boolean;
}) => {
  if (!sensorStates.length) {
    return null;
  }
  return (
    <>
      <Box padding={{vertical: 16, horizontal: 20}}>
        {showSubheading ? <Subheading>Unloadable sensors</Subheading> : null}
        <UnloadableSensorInfo />
      </Box>
      <Table>
        <thead>
          <tr>
            <th style={{maxWidth: '60px'}}></th>
            <th>Sensor name</th>
            <th style={{width: '100px'}}>Last tick</th>
            <th>Last run</th>
          </tr>
        </thead>
        <tbody>
          {sensorStates.map((sensorState) => (
            <SensorStateRow sensorState={sensorState} key={sensorState.id} />
          ))}
        </tbody>
      </Table>
    </>
  );
};

export const UnloadableSchedules = ({
  scheduleStates,
  showSubheading = true,
}: {
  scheduleStates: InstigationStateFragment[];
  showSubheading?: boolean;
}) => {
  if (!scheduleStates.length) {
    return null;
  }
  return (
    <>
      <Box padding={{vertical: 16, horizontal: 20}}>
        {showSubheading ? <Subheading>Unloadable schedules</Subheading> : null}
        <UnloadableScheduleInfo />
      </Box>
      <Table>
        <thead>
          <tr>
            <th style={{maxWidth: '60px'}}></th>
            <th>Schedule name</th>
            <th style={{width: '150px'}}>Schedule</th>
            <th style={{width: '100px'}}>Last tick</th>
            <th>Last run</th>
            <th>Partition set status</th>
          </tr>
        </thead>
        <tbody>
          {scheduleStates.map((scheduleState) => (
            <ScheduleStateRow scheduleState={scheduleState} key={scheduleState.id} />
          ))}
        </tbody>
      </Table>
    </>
  );
};

const UnloadableSensorInfo = () => (
  <Alert
    intent="warning"
    title={
      <div>
        Note: You can turn off any of the following sensors, but you cannot turn them back on.{' '}
      </div>
    }
    description={
      <div>
        The following sensors were previously started but now cannot be loaded. They may be part of
        a different workspace or from a sensor or code location that no longer exists in code. You
        can turn them off, but you cannot turn them back on since they can’t be loaded.
      </div>
    }
  />
);

const UnloadableScheduleInfo = () => (
  <Alert
    intent="warning"
    title={
      <div>
        Note: You can turn off any of the following schedules, but you cannot turn them back on.
      </div>
    }
    description={
      <div>
        The following schedules were previously started but now cannot be loaded. They may be part
        of a different workspace or from a schedule or code location that no longer exists in code.
        You can turn them off, but you cannot turn them back on since they can’t be loaded.
      </div>
    }
  />
);

const SensorStateRow = ({sensorState}: {sensorState: InstigationStateFragment}) => {
  const {id, selectorId, name, status, ticks, hasStopPermission} = sensorState;

  const [stopSensor, {loading: toggleOffInFlight}] = useMutation<
    StopRunningSensorMutation,
    StopRunningSensorMutationVariables
  >(STOP_SENSOR_MUTATION, {
    onCompleted: displaySensorMutationErrors,
  });
  const confirm = useConfirmation();

  const onChangeSwitch = async () => {
    if (status === InstigationStatus.RUNNING) {
      await confirm({
        title: 'Are you sure you want to turn off this sensor?',
        description:
          'The definition for this sensor is not available. ' +
          'If you turn it off, you will not be able to turn it back on from ' +
          'the currently loaded workspace.',
      });
      stopSensor({variables: {jobOriginId: id, jobSelectorId: selectorId}});
    }
  };

  const lacksPermission = status === InstigationStatus.RUNNING && !hasStopPermission;
  const latestTick = ticks.length ? ticks[0] : null;

  const checkbox = () => {
    const element = (
      <Checkbox
        format="switch"
        disabled={toggleOffInFlight || status === InstigationStatus.STOPPED || lacksPermission}
        checked={status === InstigationStatus.RUNNING}
        onChange={onChangeSwitch}
      />
    );

    return lacksPermission ? (
      <Tooltip content={DEFAULT_DISABLED_REASON}>{element}</Tooltip>
    ) : (
      element
    );
  };

  return (
    <tr key={name}>
      <td style={{width: 60}}>{checkbox()}</td>
      <td>
        <Group direction="row" spacing={8} alignItems="center">
          {name}
        </Group>
        <InstigatorSelectorInformation instigatorState={sensorState} />
      </td>
      <td>
        {latestTick ? (
          <TickStatusTag tick={latestTick} />
        ) : (
          <span style={{color: colorTextLight()}}>None</span>
        )}
      </td>
      <td>
        <div style={{display: 'flex'}}>
          <InstigatedRunStatus instigationState={sensorState} />
        </div>
      </td>
    </tr>
  );
};

const ScheduleStateRow = ({scheduleState}: {scheduleState: InstigationStateFragment}) => {
  const [stopSchedule, {loading: toggleOffInFlight}] = useMutation<
    StopScheduleMutation,
    StopScheduleMutationVariables
  >(STOP_SCHEDULE_MUTATION, {
    onCompleted: displayScheduleMutationErrors,
  });
  const confirm = useConfirmation();
  const {id, selectorId, name, ticks, status, typeSpecificData} = scheduleState;
  const latestTick = ticks.length > 0 ? ticks[0] : null;
  const cronSchedule =
    typeSpecificData && typeSpecificData.__typename === 'ScheduleData'
      ? typeSpecificData.cronSchedule
      : null;
  const onChangeSwitch = async () => {
    if (status === InstigationStatus.RUNNING) {
      await confirm({
        title: 'Are you sure you want to stop this schedule?',
        description:
          'The definition for this schedule is not available. ' +
          'If you turn it off, you will not be able to turn it back on from ' +
          'the currently loaded workspace.',
      });
      stopSchedule({variables: {scheduleOriginId: id, scheduleSelectorId: selectorId}});
    }
  };

  const lacksPermission = status === InstigationStatus.RUNNING && !scheduleState.hasStopPermission;
  const checkbox = () => {
    const element = (
      <Checkbox
        format="switch"
        checked={status === InstigationStatus.RUNNING}
        disabled={status !== InstigationStatus.RUNNING || toggleOffInFlight || lacksPermission}
        onChange={onChangeSwitch}
      />
    );

    return lacksPermission ? (
      <Tooltip content={DEFAULT_DISABLED_REASON}>{element}</Tooltip>
    ) : (
      element
    );
  };

  return (
    <tr key={name}>
      <td style={{width: 60}}>{checkbox()}</td>
      <td>
        <Group direction="row" spacing={8} alignItems="center">
          <div>{name}</div>
        </Group>
        <InstigatorSelectorInformation instigatorState={scheduleState} />
      </td>
      <td style={{maxWidth: 150}}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            whiteSpace: 'pre-wrap',
            display: 'block',
          }}
        >
          {cronSchedule ? (
            <Tooltip position="bottom" content={cronSchedule}>
              {humanCronString(cronSchedule)}
            </Tooltip>
          ) : (
            <div>&mdash;</div>
          )}
        </div>
      </td>
      <td>{latestTick ? <TickStatusTag tick={latestTick} /> : null}</td>
      <td>
        <InstigatedRunStatus instigationState={scheduleState} />
      </td>
      <td>
        <div style={{display: 'flex'}}>&mdash;</div>
      </td>
    </tr>
  );
};
