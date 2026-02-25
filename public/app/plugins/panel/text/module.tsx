import { PanelPlugin } from '@grafana/data';
import { t } from '@grafana/i18n';

import { TextPanel } from './TextPanel';
import { TextPanelEditor } from './TextPanelEditor';
import { CodeLanguage, defaultCodeOptions, defaultOptions, Options, TextMode } from './panelcfg.gen';
import { textPanelMigrationHandler } from './textPanelMigrationHandler';

export const plugin = new PanelPlugin<Options>(TextPanel)
  .setPanelOptions((builder) => {
    const category = [t('text.category-text', 'Text')];
    const iosFallbackCategory = [t('text.category-ios-fallback', 'iOS Mobile Fallback')];
    
    builder
      .addRadio({
        path: 'mode',
        name: t('text.name-mode', 'Mode'),
        category,
        settings: {
          options: [
            { value: TextMode.Markdown, label: t('text.mode-options.label-markdown', 'Markdown') },
            { value: TextMode.HTML, label: t('text.mode-options.label-html', 'HTML') },
            { value: TextMode.Code, label: t('text.mode-options.label-code', 'Code') },
          ],
        },
        defaultValue: defaultOptions.mode,
      })
      .addSelect({
        path: 'code.language',
        name: t('text.name-language', 'Language'),
        category,
        settings: {
          options: Object.values(CodeLanguage).map((v) => ({
            value: v,
            label: v,
          })),
        },
        defaultValue: defaultCodeOptions.language,
        showIf: (v) => v.mode === TextMode.Code,
      })
      .addBooleanSwitch({
        path: 'code.showLineNumbers',
        name: t('text.name-show-line-numbers', 'Show line numbers'),
        category,
        defaultValue: defaultCodeOptions.showLineNumbers,
        showIf: (v) => v.mode === TextMode.Code,
      })
      .addBooleanSwitch({
        path: 'code.showMiniMap',
        name: t('text.name-show-mini-map', 'Show mini map'),
        category,
        defaultValue: defaultCodeOptions.showMiniMap,
        showIf: (v) => v.mode === TextMode.Code,
      })
      .addCustomEditor({
        id: 'content',
        path: 'content',
        name: t('text.name-content', 'Content'),
        category,
        editor: TextPanelEditor,
        defaultValue: defaultOptions.content,
      })
      // iOS Mobile Fallback Options
      .addBooleanSwitch({
        path: 'enableIosFallback',
        name: t('text.name-enable-ios-fallback', 'Enable iOS Fallback'),
        description: t(
          'text.description-enable-ios-fallback',
          'When enabled, displays alternative content on iPhone/iPad devices. Useful for iframes that don\'t work on Apple mobile devices.'
        ),
        category: iosFallbackCategory,
        defaultValue: false,
      })
      .addCustomEditor({
        id: 'iosMobileContent',
        path: 'iosMobileContent',
        name: t('text.name-ios-mobile-content', 'iOS Mobile Content'),
        description: t(
          'text.description-ios-mobile-content',
          'Alternative HTML/Markdown content to display on iPhone/iPad. Use this for iOS-compatible iframes or fallback content.'
        ),
        category: iosFallbackCategory,
        editor: TextPanelEditor,
        defaultValue: '',
        showIf: (v) => Boolean(v.enableIosFallback),
      });
  })
  .setMigrationHandler(textPanelMigrationHandler);
