import * as React from 'react';
import styled from 'styled-components';

import {colorTextDefault, colorTextLight} from '../theme/color';

import {Box} from './Box';
import {Table, TableProps} from './Table';

export type MetadataTableRow = {key: string; label?: React.ReactNode; value: React.ReactNode};

interface Props {
  dark?: boolean;
  rows: (MetadataTableRow | null | undefined)[];
  spacing: 0 | 2 | 4;
}

export const MetadataTable = (props: Props) => {
  const {rows, spacing, dark = false} = props;

  return (
    <StyledTable>
      <tbody>
        {rows.map((pair: MetadataTableRow | null | undefined) => {
          if (!pair) {
            return null;
          }
          const {key, label, value} = pair;
          return (
            <tr key={key}>
              <td>
                <Box padding={{vertical: spacing, right: 32}}>
                  <MetadataKey $dark={dark}>{label ?? key}</MetadataKey>
                </Box>
              </td>
              <td>
                <Box padding={{vertical: spacing}}>{value}</Box>
              </td>
            </tr>
          );
        })}
      </tbody>
    </StyledTable>
  );
};

MetadataTable.defaultProps = {
  spacing: 4,
};

export const StyledTable = styled.table`
  border-spacing: 0;
  td {
    vertical-align: top;
  }

  td .bp4-control {
    margin-bottom: 0;
  }
`;

const MetadataKey = styled.div<{$dark: boolean}>`
  color: ${({$dark}) => ($dark ? colorTextDefault() : colorTextLight())};
  font-weight: 400;
`;

export const MetadataTableWIP = styled(Table)<TableProps>`
  td:first-child {
    white-space: nowrap;
    width: 1px;
    max-width: 400px;
    word-break: break-word;
    overflow: hidden;
    padding-right: 24px;
    text-overflow: ellipsis;
  }
`;
