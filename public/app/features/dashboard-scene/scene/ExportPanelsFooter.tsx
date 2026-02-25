import { css, cx } from '@emotion/css';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { useState, useCallback, useEffect } from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { VizPanel } from '@grafana/scenes';
import { Button, Icon, Modal, Select, Text, useStyles2, useTheme2, RadioButtonGroup, Spinner } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';

import { getPanelIdForVizPanel } from '../utils/utils';

import { DashboardScene } from './DashboardScene';
import { DashboardGridItem } from './layout-default/DashboardGridItem';

interface PanelOption extends SelectableValue<string> {
  panelRef: VizPanel;
  size: number;
  width: number;
  height: number;
  sizeCategory: 'XL' | 'Large' | 'Medium' | 'Small' | 'XS';
  originalTitle: string;
  displayLabel: string;
  panelKey: string;
  panelId: number;
}

interface Props {
  dashboard: DashboardScene;
}

const formatOptions = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
];

const qualityOptions = [
  { label: '1x', value: '1' },
  { label: '2x', value: '2' },
  { label: '3x', value: '3' },
];

export function ExportPanelsFooter({ dashboard }: Props) {
  // Temporarily disabled (feature toggle off by default).
  // Re-enable by setting `feature_toggles = exportPanelsFooter` in Grafana config.
  if (!config.featureToggles?.exportPanelsFooter) {
    return null;
  }

  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const { body } = dashboard.useState();
  const selectPortalTarget = typeof document !== 'undefined' ? document.body : undefined;
  const [selectedPanel, setSelectedPanel] = useState<PanelOption | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState('2');
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Check if user is admin - if admin, don't show this footer
  const isAdmin = contextSrv.hasRole('Admin') || contextSrv.isGrafanaAdmin;

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Get all panels from the dashboard, sorted by size (biggest first)
  const panelOptions: PanelOption[] = (() => {
    const options: PanelOption[] = [];
    const seenKeys = new Set<string>();
    
    // Use the layout manager's getVizPanels() which works with all layout types
    const panels = body.getVizPanels();

    for (const panel of panels) {
      const panelKey = panel.state.key || '';

      // Prevent duplicates when layouts repeat panels
      if (!panelKey || seenKeys.has(panelKey)) {
        continue;
      }
      seenKeys.add(panelKey);

      const panelId = getPanelIdForVizPanel(panel);
      const hasTitle = panel.state.title && panel.state.title.trim().length > 0;
      const originalTitle = panel.state.title || '';
      
      // Get size from parent grid item if available
      let width = 12;
      let height = 8;
      if (panel.parent instanceof DashboardGridItem) {
        width = panel.parent.state.width ?? 12;
        height = panel.parent.state.height ?? 8;
      }
      const size = width * height;
      
      // Create a clear display label: "Title (ID: X)" or "Panel ID: X" for untitled
      const displayLabel = hasTitle
        ? `${panel.state.title} (ID: ${panelId})`
        : `Panel ID: ${panelId}`;

      options.push({
        label: displayLabel,
        displayLabel,
        value: panelKey,
        panelRef: panel,
        panelKey,
        panelId,
        size,
        width,
        height,
        sizeCategory: getSizeCategory(size),
        originalTitle,
        description: `${width}×${height} • ${getSizeLabel(size)}`,
      });
    }

    // Sort by size (biggest first)
    return options.sort((a, b) => b.size - a.size);
  })();

  // Find panel element by key
  const findPanelElement = useCallback((panelKey: string, panelTitle: string): HTMLElement | null => {
    // Strategy 1: Try to find by data-export-key (most reliable)
    let element = document.querySelector(`[data-export-key="${panelKey}"]`) as HTMLElement;
    if (element) {
      return element;
    }

    // Strategy 2: Try to find by data-viz-panel-key
    element = document.querySelector(`[data-viz-panel-key="${panelKey}"]`) as HTMLElement;
    if (element) {
      return element;
    }

    // Strategy 3: Try to find by data-testid with panel title
    element = document.querySelector(`[data-testid="data-testid Panel ${panelTitle}"]`) as HTMLElement;
    if (element) {
      return element;
    }

    // Strategy 4: Find panel by looking for panel chrome sections with matching title
    const allPanels = document.querySelectorAll('[data-testid^="data-testid Panel"]');
    for (const el of allPanels) {
      const testId = el.getAttribute('data-testid') || '';
      if (testId.includes(panelTitle)) {
        return el as HTMLElement;
      }
    }

    // Strategy 5: Find panel chrome sections by content
    const panelSections = document.querySelectorAll('section[aria-labelledby]');
    for (const section of panelSections) {
      const titleElement = section.querySelector('h2');
      if (titleElement && titleElement.textContent?.trim() === panelTitle) {
        return section as HTMLElement;
      }
    }

    // Strategy 6: Find by panel wrapper in grid layout
    const gridItems = document.querySelectorAll('.react-grid-item');
    for (const item of gridItems) {
      const titleEl = item.querySelector('h2');
      if (titleEl && titleEl.textContent?.trim() === panelTitle) {
        const panelChrome = item.querySelector('section') || item;
        return panelChrome as HTMLElement;
      }
    }

    return null;
  }, []);

  // Build Grafana render endpoint URL (preferred capture path)
  const buildRenderUrl = useCallback(
    (panelKey: string, opts?: { width?: number; height?: number; theme?: 'dark' | 'light' }) => {
      try {
        const { origin, pathname, search } = window.location;
        const parts = pathname.split('/');
        const dIndex = parts.indexOf('d');
        const panel = body.getVizPanels().find((p) => p.state.key === panelKey);
        const panelId = panel ? getPanelIdForVizPanel(panel) : '';

        const extraParams: string[] = [];
        if (opts?.width) {
          extraParams.push(`width=${encodeURIComponent(String(opts.width))}`);
        }
        if (opts?.height) {
          extraParams.push(`height=${encodeURIComponent(String(opts.height))}`);
        }
        if (opts?.theme) {
          extraParams.push(`theme=${encodeURIComponent(opts.theme)}`);
        }

        if (dIndex !== -1 && parts.length > dIndex + 1) {
          const uid = parts[dIndex + 1];
          const slug = parts[dIndex + 2] || 'dashboard';
          const baseQs = search ? `${search}&panelId=${panelId}` : `?panelId=${panelId}`;
          const qs = extraParams.length ? `${baseQs}&${extraParams.join('&')}` : baseQs;
          return `${origin}/render/d-solo/${uid}/${slug}${qs}`;
        }
        if ((dashboard as any).state?.meta?.uid) {
          const uid = (dashboard as any).state.meta.uid;
          const slug = dashboard.state.title
            ? dashboard.state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            : 'dashboard';
          const baseQs = `?panelId=${panelId}`;
          const qs = extraParams.length ? `${baseQs}&${extraParams.join('&')}` : baseQs;
          return `${origin}/render/d-solo/${uid}/${slug}${qs}`;
        }
      } catch {
        return null;
      }
      return null;
    },
    [body, dashboard]
  );

  // Capture screenshot of the panel
  const captureScreenshot = useCallback(async (panelKey: string, panelTitle: string): Promise<Blob> => {
    const element = findPanelElement(panelKey, panelTitle);
    
    if (!element) {
      throw new Error(`Could not find panel "${panelTitle}" in the dashboard. Please ensure the panel is visible.`);
    }

    const scale = parseInt(exportQuality, 10);

    // Scroll into view to ensure panel has rendered at final size (canvas, images, etc.)
    element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const rect = element.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    // Prefer server-side renderer: fixes CORS-blocked tiles/images and is pixel-perfect.
    // Fall back to html2canvas only if renderer is unavailable.
    const renderUrl = buildRenderUrl(panelKey, {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      theme: theme.isDark ? 'dark' : 'light',
    });

    const validateAndMaybeConvertRendererBlob = async (blob: Blob): Promise<Blob> => {
      const expectedW = Math.round(width * scale);
      const expectedH = Math.round(height * scale);

      // When the image renderer plugin is not installed, Grafana returns a small placeholder PNG
      // ("No image renderer available/installed"). Detect that by validating dimensions.
      const bitmap = await createImageBitmap(blob);
      const tooSmall = bitmap.width < expectedW * 0.6 || bitmap.height < expectedH * 0.6;
      if (tooSmall) {
        throw new Error('Renderer returned unexpected size (likely missing renderer plugin)');
      }

      if (exportFormat !== 'jpeg') {
        return blob;
      }

      const c = document.createElement('canvas');
      c.width = bitmap.width;
      c.height = bitmap.height;
      const ctx = c.getContext('2d');
      if (!ctx) {
        return blob;
      }
      ctx.drawImage(bitmap, 0, 0);

      const jpegBlob = await new Promise<Blob | null>((resolve) => c.toBlob((b) => resolve(b), 'image/jpeg', 0.95));
      return jpegBlob ?? blob;
    };

    if (renderUrl) {
      try {
        const response = await fetch(renderUrl, { credentials: 'include' });
        if (response.ok) {
          const blob = await response.blob();
          return await validateAndMaybeConvertRendererBlob(blob);
        }
      } catch {
        // ignore and fallback
      }
    }

    // Client-side fallback. Note: panels relying on cross-origin images/tiles may render without those assets.
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: theme.isDark ? '#1f1f1f' : '#ffffff',
      logging: false,
      imageTimeout: 15000,
      removeContainer: true,
      width,
      height,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      onclone: (doc) => {
        // Neutralize grid/layout transforms in the cloned DOM (common cause of "only a corner" captures).
        const style = doc.createElement('style');
        style.textContent = `
          .react-grid-item { transform: none !important; will-change: auto !important; }
          .react-grid-layout { transform: none !important; will-change: auto !important; }
        `;
        doc.head.appendChild(style);

        const el = doc.querySelector(`[data-export-key="${panelKey}"]`) as HTMLElement | null;
        if (el) {
          let cur: HTMLElement | null = el;
          let depth = 0;
          while (cur && depth < 12) {
            cur.style.transform = 'none';
            cur.style.willChange = 'auto';
            depth++;
            cur = cur.parentElement;
          }
        }
      },
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
        exportFormat === 'jpeg' ? 0.95 : 1.0
      );
    });

    if (!blob) {
      throw new Error('Failed to create image blob');
    }
    return blob;
  }, [buildRenderUrl, findPanelElement, exportFormat, exportQuality, theme.isDark]);

  // Handle export button click - capture first, then show preview
  const handleExport = async () => {
    if (!selectedPanel) {
      return;
    }
    
    setIsCapturing(true);
    setCaptureError(null);
    
    try {
      const blob = await captureScreenshot(selectedPanel.panelKey, selectedPanel.originalTitle);
      setCapturedBlob(blob);
      
      // Create preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Failed to capture panel');
    } finally {
      setIsCapturing(false);
    }
  };

  // Re-capture with new settings
  const handleRecapture = async () => {
    if (!selectedPanel) {
      return;
    }
    
    setIsCapturing(true);
    setCaptureError(null);
    
    try {
      const blob = await captureScreenshot(selectedPanel.panelKey, selectedPanel.originalTitle);
      setCapturedBlob(blob);
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Failed to capture panel');
    } finally {
      setIsCapturing(false);
    }
  };

  // Download the captured image
  const handleDownload = () => {
    if (!capturedBlob || !selectedPanel) {
      return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const panelName = selectedPanel.displayLabel.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${panelName}_${timestamp}.${exportFormat}`;
    
    saveAs(capturedBlob, filename);
  };

  // Close preview modal
  const handleClosePreview = () => {
    setShowPreview(false);
    setCapturedBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Don't render for admin users
  if (isAdmin) {
    return null;
  }

  // Custom option renderer with size indicator and ID
  const formatOptionLabel = (item: SelectableValue<string>) => {
    const option = item as PanelOption;
    const sizeCategoryStyles: Record<string, string> = {
      XL: styles.sizeXL,
      Large: styles.sizeLarge,
      Medium: styles.sizeMedium,
      Small: styles.sizeSmall,
      XS: styles.sizeXS,
    };
    return (
      <div className={styles.optionContainer}>
        <div className={styles.optionMain}>
          <span className={styles.panelIdBadge}>#{option.panelId}</span>
          <Icon name="graph-bar" className={styles.panelIcon} />
          <span className={styles.optionLabel}>
            {option.originalTitle || 'Untitled Panel'}
          </span>
        </div>
        <div className={styles.optionMeta}>
          <span className={cx(styles.sizeBadge, sizeCategoryStyles[option.sizeCategory])}>
            {getSizeLabel(option.size)}
          </span>
          <span className={styles.dimensions}>{option.width}×{option.height}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.footerContainer}>
        {!isExpanded ? (
          <div className={styles.collapsedContent}>
            <Button
              variant="secondary"
              size="sm"
              icon="download-alt"
              onClick={() => setIsExpanded(true)}
              className={styles.expandButton}
            >
              <Trans i18nKey="export-panels-footer.expand">Export Panels</Trans>
            </Button>
          </div>
        ) : (
          <div className={styles.footerContent}>
            <div className={styles.header}>
              <div className={styles.headerMain}>
                <div className={styles.iconWrapper}>
                  <Icon name="download-alt" size="lg" />
                </div>
                <div className={styles.headerText}>
                  <Text variant="h5" weight="bold">
                    <Trans i18nKey="export-panels-footer.title">Export Panel</Trans>
                  </Text>
                  <Text variant="bodySmall" color="secondary">
                    <Trans i18nKey="export-panels-footer.subtitle">
                      Select a panel to export as an image
                    </Trans>
                  </Text>
                </div>
              </div>
              <Button
                variant="secondary"
                fill="outline"
                size="sm"
                icon="angle-down"
                onClick={() => setIsExpanded(false)}
                className={styles.collapseButton}
              />
            </div>
            
            <div className={styles.controls}>
              <div className={styles.selectWrapper}>
                <Select
                  options={panelOptions}
                  value={selectedPanel}
                  onChange={(value) => setSelectedPanel(value as PanelOption | null)}
                  placeholder={t('export-panels-footer.placeholder', 'Select a panel to export...')}
                  isClearable
                  formatOptionLabel={formatOptionLabel}
                  className={styles.select}
                  menuPlacement="auto"
                  menuPosition="fixed"
                  menuPortalTarget={selectPortalTarget}
                  maxMenuHeight={250}
                  noOptionsMessage={t('export-panels-footer.no-panels', 'No panels available')}
                  menuShouldScrollIntoView={true}
                />
              </div>

              <div className={styles.formatQualityRow}>
                <RadioButtonGroup
                  options={formatOptions}
                  value={exportFormat}
                  onChange={setExportFormat}
                  size="sm"
                />
                <RadioButtonGroup
                  options={qualityOptions}
                  value={exportQuality}
                  onChange={setExportQuality}
                  size="sm"
                />
              </div>
              
              <Button
                variant="primary"
                size="md"
                icon={isCapturing ? undefined : 'camera'}
                onClick={handleExport}
                disabled={!selectedPanel || isCapturing}
                className={styles.exportButton}
              >
                {isCapturing ? (
                  <>
                    <Spinner size="sm" inline />{' '}
                    <Trans i18nKey="export-panels-footer.capturing">Capturing...</Trans>
                  </>
                ) : (
                  <Trans i18nKey="export-panels-footer.export">Capture</Trans>
                )}
              </Button>
            </div>

            {captureError && (
              <div className={styles.errorMessage}>
                <Icon name="exclamation-triangle" />
                <Text color="error">{captureError}</Text>
              </div>
            )}

            {panelOptions.length > 0 && (
              <div className={styles.hint}>
                <Icon name="info-circle" size="sm" />
                <Text variant="bodySmall" color="secondary">
                  <Trans i18nKey="export-panels-footer.hint">
                    Panels are sorted by size — larger panels appear first
                  </Trans>
                </Text>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        title={t('export-panels-footer.modal-title', 'Export: {{panel}}', {
          panel: selectedPanel?.displayLabel || t('export-panels-footer.modal-title-fallback', 'Panel'),
        })}
        isOpen={showPreview}
        onDismiss={handleClosePreview}
        className={styles.previewModal}
      >
        <div className={styles.previewContent}>
          {previewUrl && (
            <div className={styles.previewImageContainer}>
              <img
                src={previewUrl}
                alt={t('export-panels-footer.preview-alt', 'Panel preview')}
                className={styles.previewImage}
              />
            </div>
          )}
          
          <div className={styles.previewInfo}>
            <Text variant="bodySmall" color="secondary">
              <Trans i18nKey="export-panels-footer.preview-meta">
                Format: {exportFormat.toUpperCase()} • Quality: {exportQuality}x
              </Trans>
            </Text>
          </div>

          <div className={styles.previewActions}>
            <Button variant="secondary" onClick={handleRecapture} disabled={isCapturing}>
              <Icon name="sync" /> <Trans i18nKey="export-panels-footer.recapture">Recapture</Trans>
            </Button>
            <Button variant="primary" onClick={handleDownload} icon="download-alt" disabled={isCapturing || !capturedBlob}>
              <Trans i18nKey="export-panels-footer.download">Download</Trans>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function getSizeLabel(size: number): string {
  if (size >= 144) {
    return 'XL';
  }
  if (size >= 96) {
    return 'Large';
  }
  if (size >= 48) {
    return 'Medium';
  }
  if (size >= 24) {
    return 'Small';
  }
  return 'XS';
}

function getSizeCategory(size: number): 'XL' | 'Large' | 'Medium' | 'Small' | 'XS' {
  if (size >= 144) {
    return 'XL';
  }
  if (size >= 96) {
    return 'Large';
  }
  if (size >= 48) {
    return 'Medium';
  }
  if (size >= 24) {
    return 'Small';
  }
  return 'XS';
}

function getStyles(theme: GrafanaTheme2) {
  const isDark = theme.isDark;

  return {
    footerContainer: css({
      width: '100%',
      padding: theme.spacing(4, 2),
      marginTop: theme.spacing(4),
      borderTop: `1px solid ${theme.colors.border.weak}`,
    }),

    footerContent: css({
      maxWidth: '900px',
      margin: '0 auto',
      padding: theme.spacing(3),
      borderRadius: theme.shape.radius.default,
      background: isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
      boxShadow: isDark
        ? '0 -8px 32px rgba(0, 0, 0, 0.4), 0 -4px 16px rgba(59, 130, 246, 0.15)'
        : '0 -8px 32px rgba(15, 23, 42, 0.1), 0 -4px 16px rgba(59, 130, 246, 0.08)',
      backdropFilter: 'blur(12px)',
    }),

    header: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(2.5),
    }),

    headerMain: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
    }),

    collapsedContent: css({
      display: 'flex',
      justifyContent: 'center',
      padding: theme.spacing(1),
    }),

    expandButton: css({
      borderRadius: theme.shape.radius.pill,
      padding: theme.spacing(0.5, 3),
      background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
      boxShadow: theme.shadows.z2,
      [theme.transitions.handleMotion('no-preference', 'reduce')]: {
        transition: 'all 0.2s ease',
      },

      '&:hover': {
        background: isDark ? 'rgba(30, 41, 59, 1)' : 'rgba(255, 255, 255, 1)',
        transform: 'translateY(-2px)',
        borderColor: theme.colors.primary.main,
      },
    }),

    collapseButton: css({
      color: theme.colors.text.secondary,
      '&:hover': {
        color: theme.colors.text.primary,
      },
    }),

    iconWrapper: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
      borderRadius: theme.shape.radius.default,
      background: isDark
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
      color: theme.colors.primary.main,
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
    }),

    headerText: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),

    controls: css({
      display: 'flex',
      gap: theme.spacing(2),
      alignItems: 'center',
      flexWrap: 'wrap',

      [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        alignItems: 'stretch',
      },
    }),

    selectWrapper: css({
      flex: 1,
      minWidth: '250px',
    }),

    select: css({
      width: '100%',
    }),

    formatQualityRow: css({
      display: 'flex',
      gap: theme.spacing(1),
      alignItems: 'center',
    }),

    exportButton: css({
      minWidth: '130px',
      height: '38px',
      fontSize: '14px',
      fontWeight: 600,
      borderRadius: theme.shape.radius.default,
      background: isDark
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%)',
      boxShadow: isDark
        ? '0 4px 16px rgba(59, 130, 246, 0.35)'
        : '0 4px 16px rgba(59, 130, 246, 0.25)',
      [theme.transitions.handleMotion('no-preference', 'reduce')]: {
        transition: 'all 0.2s ease',
      },

      '&:hover:not(:disabled)': {
        transform: 'translateY(-1px)',
        boxShadow: isDark
          ? '0 6px 20px rgba(59, 130, 246, 0.45)'
          : '0 6px 20px rgba(59, 130, 246, 0.35)',
      },

      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    }),

    errorMessage: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginTop: theme.spacing(2),
      padding: theme.spacing(1.5),
      borderRadius: theme.shape.radius.default,
      background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`,
      color: theme.colors.error.text,
    }),

    hint: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginTop: theme.spacing(2),
      padding: theme.spacing(1.5),
      borderRadius: theme.shape.radius.default,
      background: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}`,
      color: theme.colors.text.secondary,
    }),

    // Preview modal styles
    previewModal: css({
      maxWidth: '800px',
      width: '90vw',
    }),

    previewContent: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    }),

    previewImageContainer: css({
      maxHeight: '60vh',
      overflow: 'auto',
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${theme.colors.border.weak}`,
      background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
    }),

    previewImage: css({
      width: '100%',
      height: 'auto',
      display: 'block',
    }),

    previewInfo: css({
      textAlign: 'center',
      padding: theme.spacing(1),
    }),

    previewActions: css({
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing(2),
      paddingTop: theme.spacing(2),
      borderTop: `1px solid ${theme.colors.border.weak}`,
    }),

    // Option styles
    optionContainer: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: theme.spacing(0.5, 0),
    }),

    optionMain: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      flex: 1,
      minWidth: 0,
    }),

    panelIcon: css({
      color: theme.colors.primary.main,
      flexShrink: 0,
    }),

    panelIdBadge: css({
      background: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
      color: isDark ? '#93c5fd' : '#1d4ed8',
      padding: theme.spacing(0.25, 0.75),
      borderRadius: theme.shape.radius.default,
      fontSize: '11px',
      fontWeight: 700,
      fontFamily: 'monospace',
      flexShrink: 0,
    }),

    optionLabel: css({
      fontWeight: 500,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),

    optionHint: css({
      marginLeft: theme.spacing(1),
      color: theme.colors.text.secondary,
      fontSize: '11px',
      fontStyle: 'italic',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '180px',
    }),

    optionMeta: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      marginLeft: theme.spacing(2),
      flexShrink: 0,
    }),

    sizeBadge: css({
      padding: theme.spacing(0.25, 1),
      borderRadius: theme.shape.radius.default,
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }),

    sizeXL: css({
      background: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
      color: isDark ? '#4ade80' : '#16a34a',
      border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.25)'}`,
    }),

    sizeLarge: css({
      background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
      color: isDark ? '#60a5fa' : '#2563eb',
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
    }),

    sizeMedium: css({
      background: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.15)',
      color: isDark ? '#c084fc' : '#9333ea',
      border: `1px solid ${isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.25)'}`,
    }),

    sizeSmall: css({
      background: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.15)',
      color: isDark ? '#fbbf24' : '#d97706',
      border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.25)'}`,
    }),

    sizeXS: css({
      background: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(156, 163, 175, 0.15)',
      color: isDark ? '#9ca3af' : '#6b7280',
      border: `1px solid ${isDark ? 'rgba(156, 163, 175, 0.3)' : 'rgba(156, 163, 175, 0.25)'}`,
    }),

    dimensions: css({
      fontSize: '12px',
      color: theme.colors.text.secondary,
      fontFamily: 'monospace',
    }),
  };
}










