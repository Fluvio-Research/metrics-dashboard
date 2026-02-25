import { css } from '@emotion/css';
import { PureComponent } from 'react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
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
  withTheme2,
  Themeable2,
} from '@grafana/ui';
import { config } from '@grafana/runtime';
import { DashboardInteractions } from 'app/features/dashboard-scene/utils/interactions';

import { ShareModalTabProps } from './types';

interface State {
  selectedFormat: string;
  quality: string;
  includeTimestamp: boolean;
  isGenerating: boolean;
  generatedImage: Blob | null;
  previewUrl: string | null;
  error: string | null;
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

class UnthemedCustomPanelExportModal extends PureComponent<ShareModalTabProps & Themeable2, State> {
  constructor(props: ShareModalTabProps & Themeable2) {
    super(props);
    this.state = {
      selectedFormat: 'png',
      quality: '2',
      includeTimestamp: true,
      isGenerating: false,
      generatedImage: null,
      previewUrl: null,
      error: null,
    };
  }

  componentWillUnmount() {
    if (this.state.previewUrl) {
      URL.revokeObjectURL(this.state.previewUrl);
    }
  }

  findPanelElement = (): HTMLElement | null => {
    const { panel } = this.props;
    if (!panel) return null;

    const panelId = panel.id;
    const panelTitle = panel.title || 'Untitled Panel';

    // Strategy 1: Try to find by export key we add at render time
    let element = document.querySelector(`[data-export-key="${panel.key}"]`) as HTMLElement;
    if (element) return element;

    // Strategy 2: Try to find by data-panelid
    element = document.querySelector(`[data-panelid="${panelId}"]`) as HTMLElement;
    if (element) return element;

    // Strategy 3: Try to find by data-testid with panel title
    element = document.querySelector(`[data-testid="data-testid Panel ${panelTitle}"]`) as HTMLElement;
    if (element) return element;

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
        // Return the panel chrome container inside
        const panelChrome = item.querySelector('section') || item;
        return panelChrome as HTMLElement;
      }
    }

    // Strategy 7: Fallback - try generic panel container
    element = document.querySelector('.panel-container') as HTMLElement;
    if (element) return element;

    return null;
  };

  // Build Grafana render endpoint URL for direct panel image download
  buildRenderUrl = (): string | null => {
    const { panel, dashboard } = this.props;
    const { quality } = this.state;
    
    if (!panel || !dashboard) return null;
    
    try {
      const panelId = panel.id;
      const scale = parseInt(quality, 10);
      const width = 1000 * scale;
      const height = 500 * scale;
      const { origin, search } = window.location;
      
      // Get dashboard UID
      let dashboardUid = '';
      if ((dashboard as any).uid) {
        dashboardUid = (dashboard as any).uid;
      } else {
        // Try to extract from URL
        const pathname = window.location.pathname;
        const parts = pathname.split('/');
        const dIndex = parts.indexOf('d');
        if (dIndex !== -1 && parts.length > dIndex + 1) {
          dashboardUid = parts[dIndex + 1];
        }
      }
      
      if (!dashboardUid) return null;
      
      // Build slug from dashboard title
      const slug = dashboard.title 
        ? dashboard.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : 'dashboard';
      
      // Build query string preserving time range and variables
      const params = new URLSearchParams(search);
      params.set('panelId', String(panelId));
      params.set('width', String(width));
      params.set('height', String(height));
      params.set('theme', config.theme2.isDark ? 'dark' : 'light');
      params.set('timeout', '60');
      
      return `${origin}/render/d-solo/${dashboardUid}/${slug}?${params.toString()}`;
    } catch (e) {
      console.error('Error building render URL:', e);
      return null;
    }
  };

  // Fetch panel image from Grafana render API
  fetchPanelFromRenderApi = async (): Promise<Blob> => {
    const renderUrl = this.buildRenderUrl();
    
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
  };

  // Capture panel using html2canvas as fallback
  captureWithHtml2Canvas = async (): Promise<Blob> => {
    const { theme } = this.props;
    const { quality, selectedFormat } = this.state;

    // Find the panel element using multiple strategies
    const panelElement = this.findPanelElement();

    if (!panelElement) {
      throw new Error('Panel element not found. Please ensure the panel is visible on the dashboard.');
    }

    const scale = parseInt(quality, 10);

    const canvas = await html2canvas(panelElement, {
      scale: scale,
      useCORS: true,
      allowTaint: false, // Don't allow taint to avoid security errors
      backgroundColor: theme.isDark ? '#1f1f1f' : '#ffffff',
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
    });

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
  };

  capturePanelScreenshot = async (): Promise<Blob> => {
    // First, try to use Grafana's render API (works reliably for all users)
    try {
      console.log('Attempting to capture via render API...');
      const blob = await this.fetchPanelFromRenderApi();
      console.log('Successfully captured via render API');
      return blob;
    } catch (renderError) {
      console.warn('Render API failed, falling back to html2canvas:', renderError);
    }
    
    // Fallback to html2canvas
    try {
      console.log('Attempting to capture via html2canvas...');
      const blob = await this.captureWithHtml2Canvas();
      console.log('Successfully captured via html2canvas');
      return blob;
    } catch (canvasError) {
      console.error('html2canvas also failed:', canvasError);
      throw new Error('Failed to capture panel. Please ensure the panel is visible and try again.');
    }
  };

  handleGenerate = async () => {
    const { quality } = this.state;

    this.setState({ isGenerating: true, error: null });

    try {
      DashboardInteractions.generatePanelImageClicked({
        width: 1920,
        height: 1080,
        scaleFactor: parseInt(quality, 10),
        theme: 'current',
        shareResource: 'panel',
      });

      const blob = await this.capturePanelScreenshot();
      
      // Cleanup old preview URL
      if (this.state.previewUrl) {
        URL.revokeObjectURL(this.state.previewUrl);
      }
      
      const url = URL.createObjectURL(blob);
      this.setState({ generatedImage: blob, previewUrl: url });
    } catch (err: any) {
      console.error('Screenshot error:', err);
      this.setState({ error: err.message || 'Failed to capture panel screenshot' });
    } finally {
      this.setState({ isGenerating: false });
    }
  };

  handleDownload = () => {
    const { panel } = this.props;
    const { generatedImage, includeTimestamp, selectedFormat } = this.state;

    if (!generatedImage) return;

    const panelTitle = panel?.title || 'panel';
    const timestamp = includeTimestamp ? `-${new Date().getTime()}` : '';
    const filename = `${panelTitle}${timestamp}.${selectedFormat}`;

    DashboardInteractions.downloadPanelImageClicked({ shareResource: 'panel' });
    saveAs(generatedImage, filename);
  };

  render() {
    const { theme } = this.props;
    const {
      selectedFormat,
      quality,
      includeTimestamp,
      isGenerating,
      generatedImage,
      previewUrl,
      error,
    } = this.state;

    const styles = getStyles(theme);

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
            <Card.Heading className={styles.cardHeading}>
              <Icon name="camera" size="xl" />
              <Text variant="h5" weight="bold">
                <Trans i18nKey="custom-panel-export.image-export">Capture Panel Image</Trans>
              </Text>
            </Card.Heading>
            <Card.Description>
              <Trans i18nKey="custom-panel-export.image-description">
                Capture your panel directly from the browser and download as a high-quality image
              </Trans>
            </Card.Description>

            <Stack direction="column" gap={2.5}>
              {/* Format Selection */}
              <div>
                <div className={styles.sectionLabel}>
                  <Text variant="h6">
                    <Trans i18nKey="custom-panel-export.format">Format</Trans>
                  </Text>
                </div>
                <div className={styles.formatGrid}>
                  {exportFormats.map((format) => (
                    <Tooltip key={format.value} content={format.description} placement="top">
                      <button
                        className={`${styles.formatCard} ${
                          selectedFormat === format.value ? styles.formatCardActive : ''
                        }`}
                        onClick={() => this.setState({ selectedFormat: format.value })}
                      >
                        <Icon name={format.icon as any} size="lg" />
                        <Text variant="bodySmall" weight="medium">
                          {format.label}
                        </Text>
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Quality Selection */}
              <div>
                <div className={styles.sectionLabel}>
                  <Text variant="h6">
                    <Trans i18nKey="custom-panel-export.quality">Quality</Trans>
                  </Text>
                </div>
                <div className={styles.qualityGrid}>
                  {qualityOptions.map((q) => (
                    <button
                      key={q.value}
                      className={`${styles.qualityCard} ${quality === q.value ? styles.qualityCardActive : ''}`}
                      onClick={() => this.setState({ quality: q.value })}
                    >
                      <Text variant="body" weight="medium">
                        {q.label}
                      </Text>
                      <Text variant="bodySmall" color="secondary">
                        {q.description}
                      </Text>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timestamp Option */}
              <Field label={t('custom-panel-export.timestamp', 'Include timestamp in filename')}>
                <Switch
                  value={includeTimestamp}
                  onChange={(e) => this.setState({ includeTimestamp: e.currentTarget.checked })}
                />
              </Field>

              {/* Error Message */}
              {error && (
                <div className={styles.error}>
                  <Icon name="exclamation-triangle" />
                  <Text color="error">{error}</Text>
                </div>
              )}

              {/* Action Buttons */}
              <Stack direction="row" gap={2}>
                <Button
                  icon={isGenerating ? 'spinner' : 'camera'}
                  variant="primary"
                  size="md"
                  disabled={isGenerating}
                  onClick={this.handleGenerate}
                  className={styles.primaryButton}
                >
                  {isGenerating ? (
                    <Trans i18nKey="custom-panel-export.capturing">Capturing...</Trans>
                  ) : (
                    <Trans i18nKey="custom-panel-export.capture">Capture Screenshot</Trans>
                  )}
                </Button>

                {generatedImage && (
                  <Button
                    icon="download-alt"
                    variant="secondary"
                    size="md"
                    disabled={isGenerating}
                    onClick={this.handleDownload}
                    className={styles.secondaryButton}
                  >
                    <Trans i18nKey="custom-panel-export.download">Download Image</Trans>
                  </Button>
                )}
              </Stack>

              {/* Preview */}
              {previewUrl && (
                <div className={styles.previewSection}>
                  <div className={styles.sectionLabel}>
                    <Text variant="h6">
                      <Trans i18nKey="custom-panel-export.preview">Preview</Trans>
                    </Text>
                  </div>
                  <div className={styles.previewContainer}>
                    <img src={previewUrl} alt="Panel preview" className={styles.previewImage} />
                  </div>
                </div>
              )}
            </Stack>
          </Card>
        </Stack>
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;

  return {
    container: css({
      padding: theme.spacing(2),
      maxWidth: '800px',
      margin: '0 auto',
    }),

    modernHeader: css({
      padding: theme.spacing(2.5),
      background: isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.6) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(203, 213, 225, 0.3)'}`,
      marginBottom: theme.spacing(2),
    }),

    iconBadge: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: isDark
        ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
      border: `2px solid ${isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
      color: theme.colors.primary.text,
    }),

    mainTitle: css({
      fontSize: '22px',
      fontWeight: 700,
      margin: 0,
      color: theme.colors.text.primary,
      letterSpacing: '-0.02em',
    }),

    subtitle: css({
      fontSize: '14px',
      marginTop: theme.spacing(0.5),
    }),

    modernCard: css({
      background: isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.5) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
      border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(203, 213, 225, 0.3)'}`,
      borderRadius: '12px',
      padding: theme.spacing(2.5),
      boxShadow: isDark
        ? '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
        : '0 4px 6px rgba(15, 23, 42, 0.05), 0 2px 4px rgba(15, 23, 42, 0.03)',
    }),

    cardHeading: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      marginBottom: theme.spacing(1),
    }),

    sectionLabel: css({
      marginBottom: theme.spacing(1.5),
      color: theme.colors.text.primary,
      fontWeight: 600,
    }),

    formatGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: theme.spacing(1.5),
      marginTop: theme.spacing(1),
    }),

    formatCard: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(2),
      border: `2px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(203, 213, 225, 0.4)'}`,
      borderRadius: theme.shape.radius.default,
      background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.6)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',

      '&:hover': {
        borderColor: isDark ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.5)',
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.9)',
        transform: 'translateY(-2px)',
        boxShadow: isDark ? '0 4px 8px rgba(0, 0, 0, 0.2)' : '0 4px 8px rgba(15, 23, 42, 0.1)',
      },
    }),

    formatCardActive: css({
      borderColor: `${theme.colors.primary.main} !important`,
      background: isDark ? 'rgba(96, 165, 250, 0.15) !important' : 'rgba(59, 130, 246, 0.1) !important',
      boxShadow: `0 0 0 3px ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
    }),

    qualityGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: theme.spacing(1.5),
      marginTop: theme.spacing(1),
    }),

    qualityCard: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: theme.spacing(1.5),
      border: `2px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(203, 213, 225, 0.4)'}`,
      borderRadius: theme.shape.radius.default,
      background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.6)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',

      '&:hover': {
        borderColor: isDark ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.5)',
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.9)',
      },
    }),

    qualityCardActive: css({
      borderColor: `${theme.colors.primary.main} !important`,
      background: isDark ? 'rgba(96, 165, 250, 0.15) !important' : 'rgba(59, 130, 246, 0.1) !important',
    }),

    fieldCompact: css({
      marginBottom: 0,
    }),

    primaryButton: css({
      flex: 1,
      minHeight: '42px',
      fontWeight: 600,
      fontSize: '15px',
      background: isDark
        ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.9) 0%, rgba(59, 130, 246, 0.85) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.9) 100%)',
      '&:hover': {
        background: isDark
          ? 'linear-gradient(135deg, rgba(96, 165, 250, 1) 0%, rgba(59, 130, 246, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 0.95) 100%)',
      },
    }),

    secondaryButton: css({
      flex: 1,
      minHeight: '42px',
      fontWeight: 600,
      fontSize: '15px',
    }),

    previewSection: css({
      marginTop: theme.spacing(2),
    }),

    previewContainer: css({
      width: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
      border: `2px solid ${isDark ? 'rgba(96, 165, 250, 0.25)' : 'rgba(203, 213, 225, 0.4)'}`,
      boxShadow: isDark
        ? '0 8px 16px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)'
        : '0 8px 16px rgba(15, 23, 42, 0.12), 0 4px 8px rgba(15, 23, 42, 0.08)',
      background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    }),

    previewImage: css({
      width: '100%',
      height: 'auto',
      display: 'block',
    }),

    error: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(1.5),
      borderRadius: '8px',
      background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.25)'}`,
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

    sectionIcon: css({
      color: theme.colors.primary.main,
    }),

    customSizeInputs: css({
      marginTop: theme.spacing(1.5),
    }),
  };
};

export const CustomPanelExportModal = withTheme2(UnthemedCustomPanelExportModal);

