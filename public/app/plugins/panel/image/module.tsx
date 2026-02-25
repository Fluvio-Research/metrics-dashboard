import { FieldOverrideContext, getFieldDisplayName, PanelPlugin } from '@grafana/data';
import { t } from '@grafana/i18n';

import { ImagePanel } from './ImagePanel';
import {
  defaultClickToFilter,
  defaultImageSource,
  defaultLayout,
  ImageDisplayMode,
  ImageFit,
  Options,
} from './panelcfg.gen';

export const plugin = new PanelPlugin<Options>(ImagePanel).setPanelOptions((builder) => {
  const imageSourceCategory = [t('image.category-source', 'Image Source')];
  const layoutCategory = [t('image.category-layout', 'Layout')];
  const clickToFilterCategory = [t('image.category-click-filter', 'Click to Filter')];

  builder
    // Image Source Options
    .addSelect({
      path: 'imageSource.urlField',
      name: t('image.name-url-field', 'URL field'),
      category: imageSourceCategory,
      description: t('image.description-url-field', 'The field containing image URLs (arrays or single values)'),
      settings: {
        allowCustomValue: true,
        options: [],
        getOptions: async (context: FieldOverrideContext) => {
          const options = [{ value: '', label: t('image.url-field-first', '(First field)') }];
          if (context && context.data && context.data.length > 0) {
            const frame = context.data[0];
            for (const field of frame.fields) {
              const name = getFieldDisplayName(field, frame, context.data);
              options.push({ value: field.name, label: name });
            }
          }
          return options;
        },
      },
      defaultValue: defaultImageSource.urlField,
    })
    .addTextInput({
      path: 'imageSource.fallbackUrl',
      name: t('image.name-fallback-url', 'Fallback URL'),
      category: imageSourceCategory,
      description: t('image.description-fallback-url', 'Image URL to show when data is null or empty'),
      defaultValue: defaultImageSource.fallbackUrl,
    })
    .addBooleanSwitch({
      path: 'imageSource.showPlaceholder',
      name: t('image.name-show-placeholder', 'Show placeholder'),
      category: imageSourceCategory,
      description: t('image.description-show-placeholder', 'Show a placeholder message when no images available'),
      defaultValue: defaultImageSource.showPlaceholder,
    })
    .addTextInput({
      path: 'imageSource.placeholderText',
      name: t('image.name-placeholder-text', 'Placeholder text'),
      category: imageSourceCategory,
      description: t('image.description-placeholder-text', 'Text to display in placeholder'),
      defaultValue: defaultImageSource.placeholderText,
      showIf: (cfg) => cfg.imageSource?.showPlaceholder === true,
    })

    // Layout Options
    .addRadio({
      path: 'layout.displayMode',
      name: t('image.name-display-mode', 'Display mode'),
      category: layoutCategory,
      settings: {
        options: [
          { value: ImageDisplayMode.Single, label: t('image.display-mode-single', 'Single (first image)') },
          { value: ImageDisplayMode.Grid, label: t('image.display-mode-grid', 'Grid') },
          { value: ImageDisplayMode.Carousel, label: t('image.display-mode-carousel', 'Carousel') },
        ],
      },
      defaultValue: defaultLayout.displayMode,
    })
    .addSelect({
      path: 'layout.imageFit',
      name: t('image.name-image-fit', 'Image fit'),
      category: layoutCategory,
      description: t('image.description-image-fit', 'How images should fit in their container'),
      settings: {
        options: [
          { value: ImageFit.Contain, label: t('image.fit-contain', 'Contain') },
          { value: ImageFit.Cover, label: t('image.fit-cover', 'Cover') },
          { value: ImageFit.Fill, label: t('image.fit-fill', 'Fill') },
          { value: ImageFit.ScaleDown, label: t('image.fit-scale-down', 'Scale down') },
        ],
      },
      defaultValue: defaultLayout.imageFit,
    })
    .addSliderInput({
      path: 'layout.gridColumns',
      name: t('image.name-grid-columns', 'Grid columns'),
      category: layoutCategory,
      description: t('image.description-grid-columns', 'Number of columns in grid layout'),
      defaultValue: defaultLayout.gridColumns,
      settings: {
        min: 1,
        max: 8,
        step: 1,
      },
      showIf: (cfg) => cfg.layout?.displayMode === ImageDisplayMode.Grid,
    })
    .addSliderInput({
      path: 'layout.gap',
      name: t('image.name-gap', 'Gap (pixels)'),
      category: layoutCategory,
      description: t('image.description-gap', 'Space between images'),
      defaultValue: defaultLayout.gap,
      settings: {
        min: 0,
        max: 32,
        step: 2,
      },
      showIf: (cfg) => cfg.layout?.displayMode === ImageDisplayMode.Grid,
    })
    .addSliderInput({
      path: 'layout.borderRadius',
      name: t('image.name-border-radius', 'Border radius (pixels)'),
      category: layoutCategory,
      description: t('image.description-border-radius', 'Corner rounding for images'),
      defaultValue: defaultLayout.borderRadius,
      settings: {
        min: 0,
        max: 24,
        step: 2,
      },
    })
    .addBooleanSwitch({
      path: 'layout.showImageCounter',
      name: t('image.name-show-counter', 'Show image counter'),
      category: layoutCategory,
      description: t('image.description-show-counter', 'Display image count or current position'),
      defaultValue: defaultLayout.showImageCounter,
    })
    .addBooleanSwitch({
      path: 'layout.enableLightbox',
      name: t('image.name-enable-lightbox', 'Enable lightbox'),
      category: layoutCategory,
      description: t('image.description-enable-lightbox', 'Open images in full-screen lightbox on click'),
      defaultValue: defaultLayout.enableLightbox,
    })
    .addSliderInput({
      path: 'layout.autoRotateInterval',
      name: t('image.name-auto-rotate', 'Auto-rotate interval (ms)'),
      category: layoutCategory,
      description: t('image.description-auto-rotate', 'Automatic rotation interval for carousel (0 = disabled)'),
      defaultValue: defaultLayout.autoRotateInterval,
      settings: {
        min: 0,
        max: 10000,
        step: 1000,
      },
      showIf: (cfg) => cfg.layout?.displayMode === ImageDisplayMode.Carousel,
    })

    // Click to Filter Options
    .addBooleanSwitch({
      path: 'clickToFilter.enabled',
      name: t('image.name-click-filter-enabled', 'Enable click to filter'),
      category: clickToFilterCategory,
      description: t(
        'image.description-click-filter-enabled',
        'Click on images to set a dashboard variable value'
      ),
      defaultValue: defaultClickToFilter.enabled,
    })
    .addSelect({
      path: 'clickToFilter.sourceField',
      name: t('image.name-click-filter-source', 'Source field'),
      category: clickToFilterCategory,
      description: t('image.description-click-filter-source', 'The column to use as the filter value'),
      settings: {
        allowCustomValue: true,
        options: [],
        getOptions: async (context: FieldOverrideContext) => {
          const options = [{ value: '', label: t('image.source-field-first', '(First column)') }];
          if (context && context.data && context.data.length > 0) {
            const frame = context.data[0];
            for (const field of frame.fields) {
              const name = getFieldDisplayName(field, frame, context.data);
              options.push({ value: field.name, label: name });
            }
          }
          return options;
        },
      },
      showIf: (cfg) => cfg.clickToFilter?.enabled === true,
    })
    .addTextInput({
      path: 'clickToFilter.targetVariable',
      name: t('image.name-click-filter-target', 'Target variable'),
      category: clickToFilterCategory,
      description: t('image.description-click-filter-target', 'Dashboard variable name to update (without $)'),
      settings: {
        placeholder: 'e.g., siteId',
      },
      showIf: (cfg) => cfg.clickToFilter?.enabled === true,
    })
    .addBooleanSwitch({
      path: 'clickToFilter.toggleMode',
      name: t('image.name-click-filter-toggle', 'Toggle mode'),
      category: clickToFilterCategory,
      description: t('image.description-click-filter-toggle', 'Click same value again to clear the filter'),
      defaultValue: defaultClickToFilter.toggleMode,
      showIf: (cfg) => cfg.clickToFilter?.enabled === true,
    })
    .addBooleanSwitch({
      path: 'clickToFilter.showClickableIndicator',
      name: t('image.name-click-filter-indicator', 'Show clickable indicator'),
      category: clickToFilterCategory,
      description: t('image.description-click-filter-indicator', 'Highlight images with a border when clickable'),
      defaultValue: defaultClickToFilter.showClickableIndicator,
      showIf: (cfg) => cfg.clickToFilter?.enabled === true,
    })
    .addSelect({
      path: 'clickToFilter.cursorStyle',
      name: t('image.name-click-filter-cursor', 'Cursor style'),
      category: clickToFilterCategory,
      description: t('image.description-click-filter-cursor', 'Mouse cursor when hovering over clickable images'),
      settings: {
        options: [
          { value: 'pointer', label: t('image.cursor-pointer', 'Pointer') },
          { value: 'default', label: t('image.cursor-default', 'Default') },
          { value: 'crosshair', label: t('image.cursor-crosshair', 'Crosshair') },
        ],
      },
      defaultValue: defaultClickToFilter.cursorStyle,
      showIf: (cfg) => cfg.clickToFilter?.enabled === true,
    });

  return builder;
});

