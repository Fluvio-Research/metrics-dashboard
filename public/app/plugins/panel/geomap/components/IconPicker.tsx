import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2, availableIconsIndex } from '@grafana/data';
import { Icon, IconName, IconButton, Input, Modal, useStyles2, Tooltip, Button } from '@grafana/ui';

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
}

const CUSTOM_ICON_STORAGE_KEY = 'geomap-iconpicker-custom-icons';

// Get all available icon names
const allIcons = Object.keys(availableIconsIndex) as IconName[];

// Categorize Grafana icons for better UX
const grafanaIconCategories = {
  'Common': ['star', 'heart', 'bell', 'check', 'times', 'plus', 'minus', 'search', 'info', 'question-circle'],
  'Arrows': ['arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'arrow-random', 'arrows-h', 'arrows-v'],
  'Social': ['google', 'github', 'gitlab', 'slack', 'discord', 'microsoft', 'amazon'],
  'Data': ['database', 'chart-line', 'graph-bar', 'table', 'dashboard', 'gf-logs', 'gf-traces'],
  'Files': ['file-alt', 'file-blank', 'file-copy-alt', 'file-download', 'folder', 'folder-open', 'folder-plus'],
  'UI': ['eye', 'eye-slash', 'cog', 'edit', 'trash-alt', 'lock', 'unlock', 'shield'],
  'Navigation': ['home', 'compass', 'map-marker', 'layers', 'sitemap', 'apps'],
  'Media': ['play', 'pause', 'forward', 'backward', 'camera', 'book', 'image'],
  'Communication': ['comment-alt', 'comments-alt', 'envelope', 'message', 'at'],
  'Status': ['check-circle', 'times-circle', 'exclamation-circle', 'exclamation-triangle', 'info-circle'],
  'All Grafana': allIcons,
};

export const IconPicker = ({ value, onChange, placeholder }: IconPickerProps) => {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof grafanaIconCategories | 'Custom uploads'>('Common');
  const [customIcons, setCustomIcons] = useState<string[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load persisted custom icons from localStorage once
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_ICON_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomIcons(parsed.filter((v) => typeof v === 'string'));
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const persistCustomIcons = (icons: string[]) => {
    setCustomIcons(icons);
    try {
      localStorage.setItem(CUSTOM_ICON_STORAGE_KEY, JSON.stringify(icons));
    } catch {
      // ignore persistence errors (e.g., storage full)
    }
  };

  const categories = useMemo(() => {
    const base = { ...grafanaIconCategories } as Record<string, string[]>;
    if (customIcons.length) {
      base['Custom uploads'] = customIcons;
    }
    return base;
  }, [customIcons]);

  // Ensure selected category stays valid if custom uploads disappear
  useEffect(() => {
    const keys = Object.keys(categories);
    if (!keys.includes(selectedCategory)) {
      setSelectedCategory((keys[0] as typeof selectedCategory) ?? 'Common');
    }
  }, [categories, selectedCategory]);

  const filteredIcons = useMemo(() => {
    const categoryIcons = categories[selectedCategory] ?? [];
    if (!searchQuery) {
      return categoryIcons;
    }
    const query = searchQuery.toLowerCase().trim();
    
    // Filter icons based on search query
    return categoryIcons.filter((icon) => {
      const iconName = icon.startsWith('mui:') ? icon.substring(4) : icon;
      return iconName.toLowerCase().includes(query);
    });
  }, [categories, searchQuery, selectedCategory]);

  const handleCustomIconSelect = (iconValue: string) => {
    const nextIcons = Array.from(new Set([iconValue, ...customIcons])).slice(0, 50);
    persistCustomIcons(nextIcons);
    handleIconSelect(iconValue);
  };

  const renderIcon = (iconName: string, size: 'sm' | 'md' | 'lg' | 'xl' = 'lg') => {
    const trimmed = iconName.trim();

    // Handle data URLs, HTTP/HTTPS URLs or local file paths (images)
    if (
      /^data:image\//i.test(trimmed) ||
      /^https?:\/\//i.test(trimmed) ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('./') ||
      /\.(svg|png|jpg|jpeg|gif|webp|ico)(\?.*)?$/i.test(trimmed)
    ) {
      const iconSize = size === 'lg' ? '28px' : size === 'md' ? '24px' : size === 'sm' ? '20px' : '32px';
      return (
        <img 
          src={trimmed} 
          alt="icon" 
          style={{ 
            width: iconSize, 
            height: iconSize, 
            objectFit: 'contain',
            display: 'block'
          }} 
        />
      );
    }
    
    // Handle Grafana icon names (simple alphanumeric with underscores/hyphens)
    if (/^[a-z0-9_-]+$/i.test(trimmed)) {
      return <Icon name={trimmed as IconName} size={size} />;
    }
    
    // Fallback: treat as emoji/text
    return <span style={{ fontSize: size === 'lg' ? '28px' : '24px' }}>{trimmed}</span>;
  };

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery('');
    setCustomUrl('');
    setUploadError(null);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputWrapper}>
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={placeholder || 'Icon name, emoji, or URL'}
          prefix={
            value ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                {renderIcon(value.trim(), 'sm')}
              </div>
            ) : null
          }
        />
        <IconButton
          name="apps"
          onClick={() => setIsOpen(true)}
          tooltip="Browse icons"
          className={styles.browseButton}
        />
      </div>

      {isOpen && (
        <Modal title="Select Icon" isOpen={isOpen} onDismiss={() => setIsOpen(false)} className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.searchSection}>
              <Input
                prefix={<Icon name="search" />}
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                autoFocus
              />
            </div>

            <div className={styles.categoryTabs}>
              {Object.keys(categories).map((category) => (
                <button
                  key={category}
                  className={`${styles.categoryTab} ${selectedCategory === category ? styles.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory(category as typeof selectedCategory)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className={styles.customSection}>
              <div className={styles.customInputRow}>
                <Input
                  placeholder="https://example.com/icon.png or data:image/... "
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.currentTarget.value)}
                  spellCheck={false}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!customUrl.trim()}
                  onClick={() => handleCustomIconSelect(customUrl.trim())}
                >
                  Use link
                </Button>
                <label className={styles.uploadLabel}>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFileInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result as string | null;
                        if (result && /^data:image\//i.test(result)) {
                          handleCustomIconSelect(result);
                          setUploadError(null);
                        } else {
                          setUploadError('Unsupported file type. Please upload an image.');
                        }
                      };
                      reader.onerror = () => setUploadError('Failed to read file.');
                      reader.readAsDataURL(file);
                      // Reset input to allow re-uploading same file
                      e.target.value = '';
                    }}
                  />
                  <span>Upload</span>
                </label>
              </div>
              <div className={styles.customHint}>
                Links or uploaded images are stored in this browser and saved with the panel config.
                {uploadError ? <span className={styles.errorText}> {uploadError}</span> : null}
              </div>
            </div>

            <div className={styles.iconGrid}>
              {filteredIcons.length === 0 ? (
                <div className={styles.noResults}>No icons found matching "{searchQuery}"</div>
              ) : (
                filteredIcons.map((iconName) => {
                  const displayName = iconName.startsWith('mui:') ? iconName.substring(4) : iconName;
                  return (
                    <Tooltip content={displayName} key={iconName} placement="top">
                    <button
                      className={`${styles.iconButton} ${value === iconName ? styles.iconButtonActive : ''}`}
                      onClick={() => handleIconSelect(iconName)}
                    >
                        {renderIcon(iconName, 'lg')}
                    </button>
                  </Tooltip>
                  );
                })
              )}
            </div>

            <div className={styles.emojiSection}>
              <div className={styles.emojiHint}>
                <Icon name="info-circle" />
                <span>
                  You can also paste emojis directly or use image URLs (starting with http:// or https://)
                </span>
              </div>
              <div className={styles.commonEmojis}>
                {['📍', '🔥', '⭐', '❤️', '📊', '🎯', '💡', '🚀', '✅', '⚠️', '📌', '🏠'].map((emoji) => (
                  <button
                    key={emoji}
                    className={styles.emojiButton}
                    onClick={() => handleIconSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.clearButton} onClick={handleClear}>
                Clear Icon
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  inputWrapper: css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
  browseButton: css({
    flexShrink: 0,
  }),
  emojiPreview: css({
    fontSize: '18px',
    lineHeight: 1,
  }),
  modal: css({
    width: '90vw',
    maxWidth: '800px',
    height: '80vh',
    maxHeight: '700px',
  }),
  modalContent: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: theme.spacing(2),
  }),
  searchSection: css({
    paddingTop: theme.spacing(1),
  }),
  categoryTabs: css({
    display: 'flex',
    gap: theme.spacing(0.5),
    overflowX: 'auto',
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    paddingBottom: theme.spacing(0.5),
  }),
  categoryTab: css({
    background: 'transparent',
    border: 'none',
    padding: theme.spacing(1, 2),
    cursor: 'pointer',
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    '&:hover': {
      color: theme.colors.text.primary,
      background: theme.colors.background.secondary,
    },
  }),
  categoryTabActive: css({
    color: theme.colors.primary.text,
    borderBottomColor: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  iconGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
    gap: theme.spacing(1),
    overflowY: 'auto',
    flex: 1,
    padding: theme.spacing(1),
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
  }),
  iconButton: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      background: theme.colors.background.canvas,
      borderColor: theme.colors.primary.border,
      transform: 'scale(1.1)',
    },
  }),
  iconButtonActive: css({
    background: theme.colors.primary.main,
    borderColor: theme.colors.primary.border,
    color: theme.colors.primary.contrastText,
  }),
  noResults: css({
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.colors.text.secondary,
  }),
  emojiSection: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    paddingTop: theme.spacing(2),
  }),
  emojiHint: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(1),
  }),
  commonEmojis: css({
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  }),
  emojiButton: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    fontSize: '24px',
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      background: theme.colors.background.canvas,
      transform: 'scale(1.1)',
    },
  }),
  customSection: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1),
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    border: `1px dashed ${theme.colors.border.weak}`,
  }),
  customInputRow: css({
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
  uploadLabel: css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(1, 2),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
    cursor: 'pointer',
    fontSize: theme.typography.size.sm,
    transition: 'all 0.2s',
    '&:hover': {
      background: theme.colors.background.canvas,
      borderColor: theme.colors.primary.border,
    },
  }),
  hiddenFileInput: css({
    display: 'none',
  }),
  customHint: css({
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
  }),
  errorText: css({
    color: theme.colors.error.text,
    marginLeft: theme.spacing(1),
  }),
  modalFooter: css({
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: theme.spacing(1),
    borderTop: `1px solid ${theme.colors.border.weak}`,
  }),
  clearButton: css({
    padding: theme.spacing(1, 2),
    background: 'transparent',
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    cursor: 'pointer',
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    transition: 'all 0.2s',
    '&:hover': {
      background: theme.colors.background.secondary,
      color: theme.colors.text.primary,
    },
  }),
});
