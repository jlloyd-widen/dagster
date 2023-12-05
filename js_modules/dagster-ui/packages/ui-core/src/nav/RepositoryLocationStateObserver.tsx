import {gql, useApolloClient, useSubscription} from '@apollo/client';
import {
  ButtonLink,
  Group,
  Icon,
  Caption,
  colorBackgroundLight,
  colorAccentGray,
  colorTextLight,
  colorTextLighter,
} from '@dagster-io/ui-components';
import * as React from 'react';

import {LocationStateChangeEventType} from '../graphql/types';
import {WorkspaceContext} from '../workspace/WorkspaceContext';

import {
  LocationStateChangeSubscription,
  LocationStateChangeSubscriptionVariables,
} from './types/RepositoryLocationStateObserver.types';

const LOCATION_STATE_CHANGE_SUBSCRIPTION = gql`
  subscription LocationStateChangeSubscription {
    locationStateChangeEvents {
      event {
        message
        locationName
        eventType
        serverId
      }
    }
  }
`;

export const RepositoryLocationStateObserver = () => {
  const client = useApolloClient();
  const {locationEntries, refetch} = React.useContext(WorkspaceContext);
  const [updatedLocations, setUpdatedLocations] = React.useState<string[]>([]);
  const totalMessages = updatedLocations.length;

  useSubscription<LocationStateChangeSubscription, LocationStateChangeSubscriptionVariables>(
    LOCATION_STATE_CHANGE_SUBSCRIPTION,
    {
      fetchPolicy: 'no-cache',
      onSubscriptionData: ({subscriptionData}) => {
        const changeEvents = subscriptionData.data?.locationStateChangeEvents;
        if (!changeEvents) {
          return;
        }

        const {locationName, eventType, serverId} = changeEvents.event;

        switch (eventType) {
          case LocationStateChangeEventType.LOCATION_ERROR:
            refetch();
            setUpdatedLocations((s) => s.filter((name) => name !== locationName));
            return;
          case LocationStateChangeEventType.LOCATION_UPDATED:
            const matchingRepositoryLocation = locationEntries.find((n) => n.name === locationName);
            if (
              matchingRepositoryLocation &&
              matchingRepositoryLocation.locationOrLoadError?.__typename === 'RepositoryLocation' &&
              matchingRepositoryLocation.locationOrLoadError?.serverId !== serverId
            ) {
              setUpdatedLocations((s) => [...s, locationName]);
            }
            return;
        }
      },
    },
  );

  if (!totalMessages) {
    return null;
  }

  return (
    <Group background={colorBackgroundLight()} direction="column" spacing={0}>
      {updatedLocations.length > 0 ? (
        <Group padding={{vertical: 8, horizontal: 12}} direction="row" spacing={8}>
          <Icon name="warning" color={colorAccentGray()} />
          <Caption color={colorTextLight()}>
            {updatedLocations.length === 1
              ? `Code location ${updatedLocations[0]} has been updated,` // Be specific when there's only one code location updated
              : 'One or more code locations have been updated,'}
            {' and new data is available. '}
            <ButtonLink
              color={{
                link: colorTextLight(),
                hover: colorTextLighter(),
                active: colorTextLighter(),
              }}
              underline="always"
              onClick={() => {
                setUpdatedLocations([]);
                client.refetchQueries({include: 'active'});
              }}
            >
              Update data
            </ButtonLink>
          </Caption>
        </Group>
      ) : null}
    </Group>
  );
};
