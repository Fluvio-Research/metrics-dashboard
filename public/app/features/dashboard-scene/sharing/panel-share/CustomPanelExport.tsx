import { css } from '@emotion/css';
import { useCallback, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { SceneComponentProps } from '@grafana/scenes';
import {
  Button,
  Card,
  Divider,
  Field,
  Icon,
  Stack,
  Switch,
  Text,
  Tooltip,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { DashboardInteractions } from 'app/features/dashboard-scene/utils/interactions';

import { ShareLinkTab, ShareLinkTabState } from '../ShareLinkTab';

export class CustomPanelExport extends ShareLinkTab {
  static Component = CustomPanelExportRenderer;

  constructor(state: Partial<ShareLinkTabState>) {
    super(state);
  }

  public getTabLabel() {
    return t('custom-panel-export.tab-label', 'Export Panel');
  }
}

interface ExportFormat {
  label: string;
  value: string;
  icon: string;
  description: string;
}

const exportFormats: ExportFormat[] = [
  { label: 'PNG', value: 'png', icon: 'camera', description: 'High quality, transparent background' },
  { label: 'JPEG', value: 'jpeg', icon: 'file-alt', description: 'Smaller file size, no transparency' },
];

const qualityOptions = [
  { label: 'Standard', value: '1', description: '1x' },
  { label: 'High', value: '2', description: '2x' },
  { label: 'Ultra', value: '3', description: '3x' },
];

function CustomPanelExportRenderer({ model }: SceneComponentProps<CustomPanelExport>) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const { selectedTheme, panelRef } = model.useState();

  const panelTitle = panelRef?.resolve().state.title || 'panel';

  // State for export settings
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [quality, setQuality] = useState('2');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Find panel element using multiple strategies
  const findPanelElement = useCallback((): HTMLElement | null => {
    const panel = panelRef?.resolve();
    if (!panel) return null;

    const panelKey = panel.state.key;
    const panelTitle = panel.state.title || 'Untitled Panel';

    // Strategy 1: Try to find by export key we add at render time
    let element = document.querySelector(`[data-export-key="${panelKey}"]`) as HTMLElement;
    if (element) return element;

    // Strategy 2: Try to find by data-viz-panel-key (if it exists)
    element = document.querySelector(`[data-viz-panel-key="${panelKey}"]`) as HTMLElement;
    if (element) return element;

    // Strategy 2: Try to find by data-testid with panel title
    element = document.querySelector(`[data-testid="data-testid Panel ${panelTitle}"]`) as HTMLElement;
    if (element) return element;

    // Strategy 3: Find panel by looking for panel chrome sections with matching title
    const allPanels = document.querySelectorAll('[data-testid^="data-testid Panel"]');
    for (const el of allPanels) {
      const testId = el.getAttribute('data-testid') || '';
      if (testId.includes(panelTitle)) {
        return el as HTMLElement;
      }
    }

    // Strategy 4: Find panel chrome sections by content
    const panelSections = document.querySelectorAll('section[aria-labelledby]');
    for (const section of panelSections) {
      const titleElement = section.querySelector('h2');
      if (titleElement && titleElement.textContent?.trim() === panelTitle) {
        return section as HTMLElement;
      }
    }

    // Strategy 5: Find by panel wrapper in grid layout
    const gridItems = document.querySelectorAll('.react-grid-item');
    for (const item of gridItems) {
      const titleEl = item.querySelector('h2');
      if (titleEl && titleEl.textContent?.trim() === panelTitle) {
        // Return the panel chrome container inside
        const panelChrome = item.querySelector('section') || item;
        return panelChrome as HTMLElement;
      }
    }

    return null;
  }, [panelRef]);

  // Build Grafana render endpoint URL for direct panel image download
  const buildRenderUrl = useCallback((): string | null => {
    const panel = panelRef?.resolve();
    if (!panel) return null;
    
    try {
      const scale = parseInt(quality, 10);
      const width = 1000 * scale;
      const height = 500 * scale;
      const { origin, pathname, search } = window.location;
      
      // Extract dashboard UID and slug from URL
      let dashboardUid = '';
      let dashboardSlug = 'dashboard';
      
      const parts = pathname.split('/');
      const dIndex = parts.indexOf('d');
      if (dIndex !== -1 && parts.length > dIndex + 1) {
        dashboardUid = parts[dIndex + 1];
        if (parts.length > dIndex + 2) {
          dashboardSlug = parts[dIndex + 2] || 'dashboard';
        }
      }
      
      if (!dashboardUid) return null;
      
      // Get panel ID - for scenes panels, we need to extract the numeric ID
      const panelKey = panel.state.key || '';
      let panelId = panelKey;
      
      // If key is like "panel-123", extract the number
      const match = panelKey.match(/panel-(\d+)/);
      if (match) {
        panelId = match[1];
      }
      
      // Build query string preserving time range and variables
      const params = new URLSearchParams(search);
      params.set('panelId', panelId);
      params.set('width', String(width));
      params.set('height', String(height));
      params.set('theme', config.theme2.isDark ? 'dark' : 'light');
      params.set('timeout', '60');
      
      return `${origin}/render/d-solo/${dashboardUid}/${dashboardSlug}?${params.toString()}`;
    } catch (e) {
      console.error('Error building render URL:', e);
      return null;
    }
  }, [panelRef, quality]);

  // Fetch panel image from Grafana render API
  const fetchPanelFromRenderApi = useCallback(async (): Promise<Blob> => {
    const renderUrl = buildRenderUrl();
    
    if (!renderUrl) {
      throw new Error('Could not build render URL');
    }
    
    console.log('Fetching panel from render API:', renderUrl);
    
    const response = await fetch(renderUrl, { 
      credentials: 'include',
      headers: {
        'Accept': 'image/png, image/jpeg, image/*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Render API failed (${response.status}): ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    if (!blob || blob.size === 0) {
      throw new Error('Render API returned empty response');
    }
    
    return blob;
  }, [buildRenderUrl]);

  // Capture panel using html2canvas as fallback
  const captureWithHtml2Canvas = useCallback(async (): Promise<Blob> => {
    // Find the panel element
    const panelElement = findPanelElement();
    
    if (!panelElement) {
      throw new Error('Panel element not found. Please ensure the panel is visible on the dashboard.');
    }

    // Get the scale factor
    const scale = parseInt(quality, 10);

    // Capture the panel
    const canvas = await html2canvas(panelElement, {
      scale: scale,
      useCORS: true,
      allowTaint: false, // Don't allow taint to avoid security errors
      backgroundColor: theme.isDark ? '#1f1f1f' : '#ffffff',
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
    });

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        selectedFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
        selectedFormat === 'jpeg' ? 0.95 : 1.0
      );
    });
  }, [findPanelElement, quality, selectedFormat, theme.isDark]);

  // Main capture function - tries render API first, then html2canvas
  const capturePanelScreenshot = useCallback(async (): Promise<Blob> => {
    // First, try to use Grafana's render API (works reliably for all users)
    try {
      console.log('Attempting to capture via render API...');
      const blob = await fetchPanelFromRenderApi();
      console.log('Successfully captured via render API');
      return blob;
    } catch (renderError) {
      console.warn('Render API failed, falling back to html2canvas:', renderError);
    }
    
    // Fallback to html2canvas
    try {
      console.log('Attempting to capture via html2canvas...');
      const blob = await captureWithHtml2Canvas();
      console.log('Successfully captured via html2canvas');
      return blob;
    } catch (canvasError) {
      console.error('html2canvas also failed:', canvasError);
      throw new Error('Failed to capture panel. Please ensure the panel is visible and try again.');
    }
  }, [fetchPanelFromRenderApi, captureWithHtml2Canvas]);

  // Generate image
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      DashboardInteractions.generatePanelImageClicked({
        width: 1920,
        height: 1080,
        scaleFactor: parseInt(quality, 10),
        theme: selectedTheme,
        shareResource: 'panel',
      });

      const blob = await capturePanelScreenshot();
      setGeneratedImage(blob);
      
      // Create preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      console.error('Screenshot error:', err);
      setError(err.message || 'Failed to capture panel screenshot');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download image
  const handleDownload = () => {
    if (!generatedImage) return;

    const timestamp = includeTimestamp ? `-${new Date().getTime()}` : '';
    const filename = `${panelTitle}${timestamp}.${selectedFormat}`;

    DashboardInteractions.downloadPanelImageClicked({ shareResource: 'panel' });
    saveAs(generatedImage, filename);
  };

  return (
    <div className={styles.container}>
      {/* Modern Header */}
      <div className={styles.modernHeader}>
        <Stack direction="column" gap={1}>
          <Stack direction="row" alignItems="center" gap={2}>
            <div className={styles.iconBadge}>
              <Icon name="camera" size="xl" />
            </div>
            <div>
              <div className={styles.mainTitle}>
                <Text element="h2">
                  <Trans i18nKey="custom-panel-export.title">Export Panel</Trans>
                </Text>
              </div>
              <div className={styles.subtitle}>
                <Text variant="body" color="secondary">
                  <Trans i18nKey="custom-panel-export.subtitle">
                    Capture and download your panel as a high-quality image
                  </Trans>
                </Text>
              </div>
            </div>
          </Stack>
        </Stack>
      </div>

      <Divider spacing={2} />

      {/* Main Content */}
      <Stack direction="column" gap={3}>
        {/* Modern Image Export Section */}
        <Card className={styles.modernCard}>
          <Stack direction="column" gap={3}>
            {/* Format & Quality in one row */}
            <Stack direction="row" gap={3} wrap="wrap">
              {/* Format Selection */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <Icon name="file-alt" className={styles.sectionIcon} />
                  <Text variant="h6">
                    <Trans i18nKey="custom-panel-export.format">Format</Trans>
                  </Text>
                </div>
                <div className={styles.optionGrid}>
                  {exportFormats.map((format) => (
                    <Tooltip key={format.value} content={format.description} placement="top">
                      <button
                        className={`${styles.optionCard} ${
                          selectedFormat === format.value ? styles.optionCardActive : ''
                        }`}
                        onClick={() => setSelectedFormat(format.value)}
                      >
                        <Icon name={format.icon as any} size="xl" />
                        <Text variant="body" weight="bold">
                          {format.label}
                        </Text>
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Quality Selection */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <Icon name="sliders-v-alt" className={styles.sectionIcon} />
                  <Text variant="h6">
                    <Trans i18nKey="custom-panel-export.quality">Quality</Trans>
                  </Text>
                </div>
                <div className={styles.optionGrid}>
                  {qualityOptions.map((q) => (
                    <button
                      key={q.value}
                      className={`${styles.optionCard} ${quality === q.value ? styles.optionCardActive : ''}`}
                      onClick={() => setQuality(q.value)}
                    >
                      <Text variant="h5" weight="bold">
                        {q.description}
                      </Text>
                      <Text variant="bodySmall" color="secondary">
                        {q.label}
                      </Text>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timestamp Option */}
              <Field label={t('custom-panel-export.timestamp', 'Include timestamp in filename')}>
                <Switch value={includeTimestamp} onChange={(e) => setIncludeTimestamp(e.currentTarget.checked)} />
              </Field>
            </Stack>

            {/* Error Message */}
            {error && (
              <div className={styles.errorAlert}>
                <Icon name="exclamation-triangle" size="lg" />
                <div>
                  <Text weight="bold" color="error">
                    <Trans i18nKey="custom-panel-export.error">Error</Trans>
                  </Text>
                  <Text color="error">{error}</Text>
                </div>
              </div>
            )}

            {/* Action Buttons - Modern Style */}
            <div className={styles.actionRow}>
            <Stack direction="row" gap={2}>
              <Button
                icon="camera"
                variant="primary"
                size="lg"
                disabled={isGenerating}
                onClick={handleGenerate}
                className={styles.primaryButton}
                fullWidth
              >
                {isGenerating ? (
                  <>
                    <Icon name="fa fa-spinner" className={styles.spinner} />
                    <Trans i18nKey="custom-panel-export.capturing">Capturing...</Trans>
                  </>
                ) : (
                  <Trans i18nKey="custom-panel-export.capture">Capture Screenshot</Trans>
                )}
              </Button>

              <Button
                icon="download-alt"
                variant="secondary"
                size="lg"
                disabled={!generatedImage || isGenerating}
                onClick={handleDownload}
                className={styles.secondaryButton}
                fullWidth
              >
                <Trans i18nKey="custom-panel-export.download">Download</Trans>
              </Button>
            </Stack>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className={styles.modernPreview}>
                <div className={styles.previewTitle}>
                  <Icon name="eye" />
                  <Text variant="h6">
                    <Trans i18nKey="custom-panel-export.preview">Preview</Trans>
                  </Text>
                </div>
                <div className={styles.previewContainer}>
                  <img src={previewUrl} alt="Panel preview" className={styles.previewImg} />
                </div>
              </div>
            )}
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;

  return {
    container: css({
      padding: theme.spacing(4),
      maxWidth: '1000px',
      margin: '0 auto',
      minHeight: '600px',
    }),

    modernHeader: css({
      marginBottom: theme.spacing(3),
      padding: theme.spacing(3),
      borderRadius: theme.shape.radius.default,
      background: isDark
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.03) 100%)',
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'}`,
    }),

    iconBadge: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      background: isDark
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
      border: `2px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
      color: theme.colors.primary.main,
      boxShadow: isDark
        ? '0 8px 16px rgba(59, 130, 246, 0.15)'
        : '0 8px 16px rgba(59, 130, 246, 0.1)',
    }),

    mainTitle: css({
      fontSize: '28px',
      fontWeight: 700,
      margin: 0,
      color: theme.colors.text.primary,
      letterSpacing: '-0.5px',
    }),

    subtitle: css({
      fontSize: '15px',
      marginTop: theme.spacing(0.5),
    }),

    modernCard: css({
      background: isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.6) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(203, 213, 225, 0.3)'}`,
      borderRadius: '16px',
      padding: theme.spacing(4),
      boxShadow: isDark
        ? '0 10px 40px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)'
        : '0 10px 40px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)',
    }),

    section: css({
      flex: 1,
      minWidth: '280px',
    }),

    sectionTitle: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(2),
      fontSize: '16px',
      fontWeight: 700,
      color: theme.colors.text.primary,
    }),

    sectionIcon: css({
      color: theme.colors.primary.main,
    }),

    optionGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: theme.spacing(2),
    }),

    optionCard: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(3),
      border: `2px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(203, 213, 225, 0.4)'}`,
      borderRadius: '12px',
      background: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      minHeight: '100px',

      '&:hover': {
        borderColor: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)',
        background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 1)',
        transform: 'translateY(-4px) scale(1.02)',
        boxShadow: isDark
          ? '0 12px 24px rgba(59, 130, 246, 0.2)'
          : '0 12px 24px rgba(59, 130, 246, 0.15)',
      },
    }),

    optionCardActive: css({
      borderColor: `${theme.colors.primary.main} !important`,
      background: isDark
        ? 'rgba(59, 130, 246, 0.2) !important'
        : 'rgba(59, 130, 246, 0.12) !important',
      boxShadow: `0 0 0 4px ${isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.2)'}, 0 8px 16px ${
        isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
      }`,
      transform: 'scale(1.05)',
    }),

    optionsRow: css({
      padding: theme.spacing(2),
      borderRadius: '8px',
      background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.6)',
    }),

    actionRow: css({
      marginTop: theme.spacing(2),
    }),

    primaryButton: css({
      height: '56px',
      fontSize: '16px',
      fontWeight: 700,
      borderRadius: '12px',
      background: isDark
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%)',
      border: 'none',
      boxShadow: isDark
        ? '0 8px 24px rgba(59, 130, 246, 0.4)'
        : '0 8px 24px rgba(59, 130, 246, 0.3)',
      transition: 'all 0.3s ease',

      '&:hover:not(:disabled)': {
        transform: 'translateY(-2px)',
        boxShadow: isDark
          ? '0 12px 32px rgba(59, 130, 246, 0.5)'
          : '0 12px 32px rgba(59, 130, 246, 0.4)',
      },

      '&:disabled': {
        opacity: 0.6,
        cursor: 'not-allowed',
      },
    }),

    secondaryButton: css({
      height: '56px',
      fontSize: '16px',
      fontWeight: 700,
      borderRadius: '12px',
      border: `2px solid ${theme.colors.primary.main}`,
      background: 'transparent',
      color: theme.colors.primary.main,
      transition: 'all 0.3s ease',

      '&:hover:not(:disabled)': {
        background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
        transform: 'translateY(-2px)',
      },

      '&:disabled': {
        opacity: 0.4,
        cursor: 'not-allowed',
      },
    }),

    spinner: css({
      animation: 'spin 1s linear infinite',
      '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
    }),

    modernPreview: css({
      marginTop: theme.spacing(3),
      padding: theme.spacing(3),
      borderRadius: '12px',
      background: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.6)',
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(203, 213, 225, 0.3)'}`,
    }),

    previewTitle: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(2),
      fontSize: '16px',
      fontWeight: 700,
      color: theme.colors.text.primary,
    }),

    previewContainer: css({
      width: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
      border: `2px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(203, 213, 225, 0.3)'}`,
      boxShadow: isDark
        ? '0 12px 32px rgba(0, 0, 0, 0.3)'
        : '0 12px 32px rgba(15, 23, 42, 0.12)',
    }),

    previewImg: css({
      width: '100%',
      height: 'auto',
      display: 'block',
    }),

    errorAlert: css({
      display: 'flex',
      alignItems: 'flex-start',
      gap: theme.spacing(2),
      padding: theme.spacing(2.5),
      borderRadius: '12px',
      background: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
      border: `2px solid ${isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
    }),

    advancedToggle: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      padding: theme.spacing(2),
      width: '100%',
      background: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.7)',
      border: `2px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(203, 213, 225, 0.4)'}`,
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: theme.colors.text.primary,

      '&:hover': {
        background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 1)',
        borderColor: theme.colors.primary.main,
        transform: 'translateY(-1px)',
      },
    }),

    advancedPanel: css({
      padding: theme.spacing(3),
      borderRadius: '12px',
      background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.5)',
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(203, 213, 225, 0.3)'}`,
      animation: 'slideDown 0.3s ease',

      '@keyframes slideDown': {
        from: {
          opacity: 0,
          transform: 'translateY(-10px)',
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)',
        },
      },
    }),

    backgroundGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing(2),
    }),

    backgroundCard: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(2),
      border: `2px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(203, 213, 225, 0.4)'}`,
      borderRadius: '10px',
      background: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',

      '&:hover': {
        borderColor: theme.colors.primary.main,
        transform: 'translateY(-2px)',
      },
    }),

    colorPreview: css({
      width: '48px',
      height: '48px',
      borderRadius: '8px',
      border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
    }),

    customSizeInputs: css({
      marginTop: theme.spacing(1.5),
    }),
  };
};

