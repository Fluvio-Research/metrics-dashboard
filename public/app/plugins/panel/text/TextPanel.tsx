import { css, cx } from '@emotion/css';
import DangerouslySetHtmlContent from 'dangerously-set-html-content';
import { useState, useMemo } from 'react';
import { useDebounce } from 'react-use';

import { GrafanaTheme2, PanelProps, renderTextPanelMarkdown, textUtil, InterpolateFunction } from '@grafana/data';
import { CodeEditor, ScrollContainer, useStyles2 } from '@grafana/ui';
import config from 'app/core/config';

import { defaultCodeOptions, Options, TextMode } from './panelcfg.gen';
import { useDeviceDetection } from './useDeviceDetection';

export interface Props extends PanelProps<Options> {}

export function TextPanel(props: Props) {
  const styles = useStyles2(getStyles);
  const { isAppleMobile } = useDeviceDetection();
  
  // Determine if we should use iOS fallback content
  const shouldUseIosFallback = useMemo(() => {
    const { enableIosFallback, iosMobileContent } = props.options;
    return Boolean(enableIosFallback && iosMobileContent && isAppleMobile);
  }, [props.options.enableIosFallback, props.options.iosMobileContent, isAppleMobile]);

  // Process main content
  const [processed, setProcessed] = useState<Options>({
    mode: props.options.mode,
    content: processContent(props.options, props.replaceVariables, config.disableSanitizeHtml, shouldUseIosFallback),
  });

  useDebounce(
    () => {
      const { options, replaceVariables } = props;
      const content = processContent(options, replaceVariables, config.disableSanitizeHtml, shouldUseIosFallback);
      if (content !== processed.content || options.mode !== processed.mode) {
        setProcessed({
          mode: options.mode,
          content,
        });
      }
    },
    100,
    [props, shouldUseIosFallback]
  );

  if (processed.mode === TextMode.Code) {
    const code = props.options.code ?? defaultCodeOptions;
    return (
      <CodeEditor
        key={`${code.showLineNumbers}/${code.showMiniMap}`} // will reinit-on change
        value={processed.content}
        language={code.language ?? defaultCodeOptions.language!}
        width={props.width}
        height={props.height}
        containerStyles={styles.codeEditorContainer}
        showMiniMap={code.showMiniMap}
        showLineNumbers={code.showLineNumbers}
        readOnly={true} // future
      />
    );
  }

  return (
    <div className={styles.containStrict}>
      <ScrollContainer minHeight="100%">
        <DangerouslySetHtmlContent
          allowRerender
          html={processed.content}
          className={cx('markdown-html', styles.markdownHtml)}
          data-testid="TextPanel-converted-content"
        />
      </ScrollContainer>
    </div>
  );
}

function processContent(
  options: Options, 
  interpolate: InterpolateFunction, 
  disableSanitizeHtml: boolean,
  useIosFallback: boolean = false
): string {
  let { mode, content, iosMobileContent } = options;

  // Use iOS fallback content if enabled and on Apple mobile device
  if (useIosFallback && iosMobileContent) {
    content = iosMobileContent;
  }

  // Variables must be interpolated before content is converted to markdown so using variables
  // in URLs work properly
  content = interpolate(content, {}, options.code?.language === 'json' ? 'json' : 'html');

  if (!content) {
    return ' ';
  }

  switch (mode) {
    case TextMode.Code:
      break; // nothing
    case TextMode.HTML:
      if (!disableSanitizeHtml) {
        content = textUtil.sanitizeTextPanelContent(content);
      }
      break;
    case TextMode.Markdown:
    default:
      // default to markdown
      content = renderTextPanelMarkdown(content, {
        noSanitize: disableSanitizeHtml,
      });
  }

  return content;
}

const getStyles = (theme: GrafanaTheme2) => ({
  codeEditorContainer: css({
    '.monaco-editor .margin, .monaco-editor-background': {
      backgroundColor: theme.colors.background.primary,
    },
  }),
  containStrict: css({
    contain: 'strict',
    height: '100%',
    display: 'flex',
  }),
  markdownHtml: css({
    height: '100%',
  }),
});
