import { css } from '@emotion/css';
import { useState, useMemo } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconName, IconButton, Input, Modal, useStyles2, Tooltip } from '@grafana/ui';
import { availableIconsIndex } from '@grafana/data';

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
}

// Get all available icon names
const allIcons = Object.keys(availableIconsIndex) as IconName[];

// Categorize icons for better UX
const iconCategories = {
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
  'All': allIcons,
};

export const IconPicker = ({ value, onChange, placeholder }: IconPickerProps) => {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof iconCategories>('Common');

  const filteredIcons = useMemo(() => {
    const categoryIcons = iconCategories[selectedCategory];
    if (!searchQuery) {
      return categoryIcons;
    }
    const query = searchQuery.toLowerCase();
    return categoryIcons.filter((icon) => icon.toLowerCase().includes(query));
  }, [searchQuery, selectedCategory]);

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery('');
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
            value && /^[a-z0-9_-]+$/i.test(value.trim()) ? (
              <Icon name={value.trim() as IconName} />
            ) : value ? (
              <span className={styles.emojiPreview}>{value}</span>
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
              {(Object.keys(iconCategories) as Array<keyof typeof iconCategories>).map((category) => (
                <button
                  key={category}
                  className={`${styles.categoryTab} ${selectedCategory === category ? styles.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className={styles.iconGrid}>
              {filteredIcons.length === 0 ? (
                <div className={styles.noResults}>No icons found matching "{searchQuery}"</div>
              ) : (
                filteredIcons.map((iconName) => (
                  <Tooltip content={iconName} key={iconName} placement="top">
                    <button
                      className={`${styles.iconButton} ${value === iconName ? styles.iconButtonActive : ''}`}
                      onClick={() => handleIconSelect(iconName)}
                    >
                      <Icon name={iconName as IconName} size="lg" />
                    </button>
                  </Tooltip>
                ))
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

