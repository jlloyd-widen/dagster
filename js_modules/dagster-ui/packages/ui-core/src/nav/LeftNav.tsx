import {colorBackgroundDefault, colorKeylineDefault} from '@dagster-io/ui-components';
import * as React from 'react';
import styled from 'styled-components';

import {LayoutContext} from '../app/LayoutProvider';

import {LeftNavRepositorySection} from './LeftNavRepositorySection';

export const LeftNav = () => {
  const {nav} = React.useContext(LayoutContext);

  return (
    <LeftNavContainer $open={nav.isOpen} $smallScreen={nav.isSmallScreen}>
      <LeftNavRepositorySection />
    </LeftNavContainer>
  );
};

export const LEFT_NAV_WIDTH = 332;

const LeftNavContainer = styled.div<{$open: boolean; $smallScreen: boolean}>`
  position: fixed;
  z-index: 2;
  top: 64px;
  bottom: 0;
  left: 0;
  width: ${LEFT_NAV_WIDTH}px;
  display: ${({$open, $smallScreen}) => ($open || $smallScreen ? 'flex' : 'none')};
  flex-shrink: 0;
  flex-direction: column;
  justify-content: start;
  background: ${colorBackgroundDefault()};
  box-shadow: 1px 0px 0px ${colorKeylineDefault()};

  ${(p) =>
    p.$smallScreen
      ? `
        transform: translateX(${p.$open ? '0' : `-${LEFT_NAV_WIDTH}px`});
        transition: transform 150ms ease-in-out;
      `
      : ``}
`;
