import {
  Group,
  Icon,
  Spinner,
  FontFamily,
  colorAccentYellow,
  CoreColors,
  colorBackgroundLight,
  colorBackgroundLighter,
  colorKeylineDefault,
  colorBackgroundLightHover,
  colorTextDefault,
  colorTextLight,
  colorBorderDefault,
  colorBackgroundYellow,
  colorTextLighter,
  colorAccentBlue,
  colorTextBlue,
  colorAccentGreen,
  colorAccentRed,
  colorAccentCyan,
  colorAccentGray,
  colorAccentOlive,
} from '@dagster-io/ui-components';
import Ansi from 'ansi-to-react';
import * as React from 'react';
import styled, {createGlobalStyle} from 'styled-components';

const MAX_STREAMING_LOG_BYTES = 5242880; // 5 MB
const TRUNCATE_PREFIX = '\u001b[33m...logs truncated...\u001b[39m\n';
const SCROLLER_LINK_TIMEOUT_MS = 3000;

interface Props {
  logData: string | null;
  isLoading: boolean;
  isVisible: boolean;
  downloadUrl?: string | null;
  location?: string;
}

export const RawLogContent = React.memo((props: Props) => {
  const {logData, location, isLoading, isVisible, downloadUrl} = props;
  const contentContainer = React.useRef<ScrollContainer | null>(null);
  const timer = React.useRef<number>();
  const [showScrollToTop, setShowScrollToTop] = React.useState(false);
  const scrollToTop = () => {
    contentContainer.current && contentContainer.current.scrollToTop();
  };
  const cancelHideWarning = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = 0;
    }
  };
  const hideWarning = () => {
    setShowScrollToTop(false);
    cancelHideWarning();
  };
  const scheduleHideWarning = () => {
    timer.current = window.setTimeout(hideWarning, SCROLLER_LINK_TIMEOUT_MS);
  };
  const onScrollUp = (position: number) => {
    cancelHideWarning();

    if (!position) {
      hideWarning();
    } else {
      setShowScrollToTop(true);
      scheduleHideWarning();
    }
  };
  let content = logData;
  const isTruncated = shouldTruncate(content);

  if (content && isTruncated) {
    const nextLine = content.indexOf('\n') + 1;
    const truncated = nextLine < content.length ? content.slice(nextLine) : content;
    content = TRUNCATE_PREFIX + truncated;
  }
  const warning = isTruncated ? (
    <FileWarning>
      <Group direction="row" spacing={8} alignItems="center">
        <Icon name="warning" color={colorAccentYellow()} />
        <div>
          This log has exceeded the 5MB limit.{' '}
          {downloadUrl ? (
            <a href={downloadUrl} download>
              Download the full log file
            </a>
          ) : null}
        </div>
      </Group>
    </FileWarning>
  ) : null;

  return (
    <>
      <FileContainer isVisible={isVisible}>
        {showScrollToTop ? (
          <ScrollToast>
            <ScrollToTop
              onClick={scrollToTop}
              onMouseOver={cancelHideWarning}
              onMouseOut={scheduleHideWarning}
            >
              <Group direction="row" spacing={8} alignItems="center">
                <Icon name="arrow_upward" color={CoreColors.White} />
                Scroll to top
              </Group>
            </ScrollToTop>
          </ScrollToast>
        ) : null}
        <FileContent>
          {warning}
          <RelativeContainer>
            <LogContent
              isSelected={true}
              content={logData}
              onScrollUp={onScrollUp}
              onScrollDown={hideWarning}
              ref={contentContainer}
            />
          </RelativeContainer>
        </FileContent>
        {isLoading ? (
          <LoadingContainer>
            <Spinner purpose="page" />
          </LoadingContainer>
        ) : null}
      </FileContainer>
      {location ? <FileFooter isVisible={isVisible}>{location}</FileFooter> : null}
    </>
  );
});

const shouldTruncate = (content: string | null | undefined) => {
  if (!content) {
    return false;
  }
  const encoder = new TextEncoder();
  return encoder.encode(content).length >= MAX_STREAMING_LOG_BYTES;
};

interface IScrollContainerProps {
  content: string | null | undefined;
  isSelected?: boolean;
  className?: string;
  onScrollUp?: (position: number) => void;
  onScrollDown?: (position: number) => void;
}

class ScrollContainer extends React.Component<IScrollContainerProps> {
  private container = React.createRef<HTMLDivElement>();
  private lastScroll = 0;

  componentDidMount() {
    this.scrollToBottom();
    if (this.container.current) {
      this.container.current.focus();
      this.container.current.addEventListener('scroll', this.onScroll);
    }
  }

  getSnapshotBeforeUpdate() {
    if (!this.container.current) {
      return false;
    }
    const {scrollHeight, scrollTop, offsetHeight} = this.container.current;
    const shouldScroll = offsetHeight + scrollTop >= scrollHeight;
    return shouldScroll;
  }

  componentDidUpdate(_props: any, _state: any, shouldScroll: boolean) {
    if (shouldScroll) {
      this.scrollToBottom();
    }
    if (this.props.isSelected && !_props.isSelected) {
      this.container.current && this.container.current.focus();
    }
  }

  onScroll = () => {
    if (!this.container.current || !this.props.isSelected) {
      return;
    }
    const {onScrollUp, onScrollDown} = this.props;

    const {scrollHeight, scrollTop, offsetHeight} = this.container.current;
    const position = scrollTop / (scrollHeight - offsetHeight);
    if (this.container.current.scrollTop < this.lastScroll) {
      onScrollUp && onScrollUp(position);
    } else {
      onScrollDown && onScrollDown(position);
    }
    this.lastScroll = this.container.current.scrollTop;
  };

  focus() {
    const node = this.container.current;
    if (!node) {
      return;
    }

    node.focus();
  }

  scrollToBottom() {
    const node = this.container.current;
    if (!node) {
      return;
    }

    node.scrollTop = node.scrollHeight - node.offsetHeight;
  }

  scrollToTop() {
    const node = this.container.current;
    if (!node) {
      return;
    }

    node.scrollTop = 0;
    node.focus();
  }

  render() {
    const {content, className} = this.props;
    if (!content) {
      return (
        <div className={className} ref={this.container}>
          <ContentContainer style={{justifyContent: 'center', alignItems: 'center'}}>
            {content == null ? 'No log file available' : 'No output'}
          </ContentContainer>
        </div>
      );
    }

    return (
      <div className={className} style={{outline: 'none'}} ref={this.container} tabIndex={0}>
        <ContentContainer>
          <LineNumbers content={content} />
          <Content>
            <SolarizedColors />
            <Ansi linkify={false} useClasses>
              {content}
            </Ansi>
          </Content>
        </ContentContainer>
      </div>
    );
  }
}

const LineNumbers = (props: IScrollContainerProps) => {
  const {content} = props;
  if (!content) {
    return null;
  }
  const matches = content.match(/\n/g);
  const count = matches ? matches.length : 0;
  return (
    <LineNumberContainer>
      {Array.from(Array(count), (_, i) => (
        <div key={i}>{String(i + 1)}</div>
      ))}
    </LineNumberContainer>
  );
};

const Content = styled.div`
  padding: 10px;
  background-color: ${colorBackgroundLight()};
`;

const LineNumberContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  border-right: 1px solid ${colorKeylineDefault()};
  padding: 10px 10px 10px 20px;
  margin-right: 5px;
  background-color: ${colorBackgroundLightHover()};
  opacity: 0.8;
  color: ${colorTextLighter()};
  min-height: 100%;
`;

const SolarizedColors = createGlobalStyle`
  .ansi-black {
    color: ${colorAccentOlive()};
  }
  .ansi-red {
    color: ${colorAccentRed()};
  }
  .ansi-green {
    color: ${colorAccentGreen()};
  }
  .ansi-yellow {
    color: ${colorAccentYellow()};
  }
  .ansi-blue {
    color: ${colorAccentBlue()};
  }
  .ansi-magenta {
    color: ${colorTextBlue()};
  }
  .ansi-cyan {
    color: ${colorAccentCyan()};
  }
  .ansi-white {
    color: ${colorAccentGray()};
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 100%;
  background-color: ${colorBackgroundLight()};
`;

const FileContainer = styled.div`
  flex: 1;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  ${({isVisible}: {isVisible: boolean}) => (isVisible ? null : 'display: none;')}
`;

const FileFooter = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
  background-color: ${colorBackgroundLight()};
  border-top: 0.5px solid ${colorKeylineDefault()};
  color: ${colorTextLight()};
  padding: 2px 5px;
  font-size: 0.85em;
  ${({isVisible}: {isVisible: boolean}) => (isVisible ? null : 'display: none;')}
`;

const FileContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const RelativeContainer = styled.div`
  flex: 1;
  position: relative;
`;

const LogContent = styled(ScrollContainer)`
  color: ${colorTextDefault()};
  font-family: ${FontFamily.monospace};
  font-size: 16px;
  white-space: pre;
  overflow: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;
const LoadingContainer = styled.div`
  display: flex;
  justifycontent: center;
  alignitems: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  backgroundcolor: ${CoreColors.Gray800};
  opacity: 0.3;
`;

const ScrollToast = styled.div`
  position: absolute;
  height: 30px;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  z-index: 1;
`;
const ScrollToTop = styled.div`
  background-color: ${colorBackgroundLighter()};
  padding: 10px 20px;
  border-bottom-right-radius: 5px;
  border-bottom-left-radius: 5px;
  color: ${colorTextDefault()};
  border-bottom: 1px solid ${colorBorderDefault()};
  border-left: 1px solid ${colorBorderDefault()};
  border-right: 1px solid ${colorBorderDefault()};
  cursor: pointer;
`;

const FileWarning = styled.div`
  background-color: ${colorBackgroundYellow()};
  padding: 10px 20px;
  margin: 20px 70px;
  border-radius: 5px;
`;
