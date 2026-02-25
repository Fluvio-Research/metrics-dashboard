import { css, cx } from '@emotion/css';
import React, { useCallback, useMemo, useState } from 'react';

import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import { getTemplateSrv } from 'app/features/templating/template_srv';

import { ImageDisplayMode, ImageFit, Options } from './panelcfg.gen';

export interface Props extends PanelProps<Options> {}

export function ImagePanel(props: Props) {
  const { data, width, height, options } = props;
  const styles = useStyles2(getStyles);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Extract image URLs from data
  const imageUrls = useMemo(() => {
    const urls: string[] = [];
    
    if (!data?.series || data.series.length === 0) {
      return urls;
    }

    const frame = data.series[0];
    if (!frame || !frame.fields || frame.fields.length === 0) {
      return urls;
    }

    // Find the URL field
    const urlFieldName = options.imageSource?.urlField || '';
    let urlField = frame.fields.find(
      (f) => f.name === urlFieldName || f.config.displayName === urlFieldName
    );

    // If no field specified or found, use the first field
    if (!urlField) {
      urlField = frame.fields[0];
    }

    // Ensure urlField and values exist
    if (!urlField || !urlField.values || urlField.values.length === 0) {
      return urls;
    }

    // Check if there are multiple rows - if so, return empty to show nothing
    if (urlField.values.length > 1) {
      return urls;
    }

    // Get the first row's value (assuming single row with image URLs)
    const value = urlField.values[0];
    
    // If value is null, undefined, or empty string, return empty array to trigger fallback
    if (value === null || value === undefined || value === '') {
      return urls;
    }

    // Handle array of URLs
    if (Array.isArray(value)) {
      urls.push(...value.filter((url) => url && typeof url === 'string' && url.trim() !== ''));
    }
    // Handle JSON string array
    else if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          urls.push(...parsed.filter((url) => url && typeof url === 'string' && url.trim() !== ''));
        } else {
          // Single URL string - only add if not empty
          if (value.trim() !== '') {
            urls.push(value);
          }
        }
      } catch {
        // Not JSON, treat as single URL - only add if not empty
        if (value.trim() !== '') {
          urls.push(value);
        }
      }
    }

    return urls;
  }, [data, options.imageSource?.urlField]);

  // Reset failed images when data changes
  React.useEffect(() => {
    setFailedImages(new Set());
  }, [data.structureRev]);

  // Handle click to filter
  const handleImageClick = useCallback(
    (index: number) => {
      const clickToFilter = options.clickToFilter;
      
      if (!clickToFilter?.enabled || !clickToFilter.targetVariable) {
        return;
      }

      // Safely check for data
      if (!data?.series || data.series.length === 0) {
        return;
      }

      const frame = data.series[0];
      if (!frame || !frame.fields || frame.fields.length === 0) {
        return;
      }
      
      // Find the source field
      let sourceFieldIndex = 0;
      if (clickToFilter.sourceField) {
        const fieldIndex = frame.fields.findIndex(
          (f) => f.name === clickToFilter.sourceField || 
                 (f.config.displayName && f.config.displayName === clickToFilter.sourceField)
        );
        if (fieldIndex >= 0) {
          sourceFieldIndex = fieldIndex;
        }
      }

      const sourceField = frame.fields[sourceFieldIndex];
      if (!sourceField || !sourceField.values || sourceField.values.length === 0) {
        return;
      }

      // Don't allow click-to-filter if there are multiple rows
      if (sourceField.values.length > 1) {
        return;
      }

      const value = sourceField.values[0];
      const stringValue = value != null ? String(value) : '';

      // Get current variable value using template service
      const templateSrv = getTemplateSrv();
      const currentValue = templateSrv.replace(`$${clickToFilter.targetVariable}`);
      
      // Check if the variable reference was resolved
      const variableNotFound = currentValue === `$${clickToFilter.targetVariable}`;

      // Toggle mode: clear if same value is clicked again
      let newValue = stringValue;
      if (clickToFilter.toggleMode && !variableNotFound && currentValue === stringValue) {
        newValue = '';
      }

      // Update the variable using locationService
      locationService.partial({
        [`var-${clickToFilter.targetVariable}`]: newValue || undefined,
      }, true);
    },
    [options.clickToFilter, data]
  );

  // Handle lightbox
  const openLightbox = useCallback((url: string) => {
    if (options.layout?.enableLightbox) {
      setLightboxImage(url);
    }
  }, [options.layout?.enableLightbox]);

  const closeLightbox = useCallback(() => {
    setLightboxImage(null);
  }, []);

  // If no data or no images, use fallback URL or show placeholder
  const fallbackUrl = options.imageSource?.fallbackUrl;
  
  // Handle image load errors - replace failed images with fallback
  const handleImageError = useCallback((url: string) => {
    setFailedImages((prev) => new Set(prev).add(url));
  }, []);

  // Replace failed images with fallback URL
  const getImageUrl = useCallback((url: string) => {
    if (failedImages.has(url) && fallbackUrl) {
      return fallbackUrl;
    }
    return url;
  }, [failedImages, fallbackUrl]);

  const finalImageUrls = imageUrls.length > 0 ? imageUrls : (fallbackUrl ? [fallbackUrl] : []);

  // Carousel navigation
  const nextImage = useCallback(() => {
    setCurrentCarouselIndex((prev) => (prev + 1) % finalImageUrls.length);
  }, [finalImageUrls.length]);

  const prevImage = useCallback(() => {
    setCurrentCarouselIndex((prev) => (prev - 1 + finalImageUrls.length) % finalImageUrls.length);
  }, [finalImageUrls.length]);

  // Auto-rotate carousel
  React.useEffect(() => {
    const interval = options.layout?.autoRotateInterval || 0;
    if (interval > 0 && options.layout?.displayMode === ImageDisplayMode.Carousel && finalImageUrls.length > 1) {
      const timer = setInterval(nextImage, interval);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [options.layout?.autoRotateInterval, options.layout?.displayMode, finalImageUrls.length, nextImage]);

  if (finalImageUrls.length === 0) {
    if (options.imageSource?.showPlaceholder) {
      return (
        <div className={styles.placeholder}>
          <div className={styles.placeholderText}>
            {options.imageSource?.placeholderText || 'No images available'}
          </div>
        </div>
      );
    }
    return null;
  }

  const displayMode = options.layout?.displayMode || ImageDisplayMode.Grid;
  const imageFit = options.layout?.imageFit || ImageFit.Cover;
  const clickToFilterEnabled = options.clickToFilter?.enabled;
  const showClickableIndicator = options.clickToFilter?.showClickableIndicator;

  // Render single image
  if (displayMode === ImageDisplayMode.Single) {
    const url = finalImageUrls[0];
    return (
      <div className={styles.container} style={{ width, height }}>
        <div
          className={cx(styles.imageWrapper, {
            [styles.clickable]: clickToFilterEnabled && showClickableIndicator,
          })}
          onClick={() => {
            handleImageClick(0);
            openLightbox(url);
          }}
          style={{
            cursor: clickToFilterEnabled ? options.clickToFilter?.cursorStyle || 'pointer' : 'default',
          }}
        >
          <img
            src={getImageUrl(url)}
            alt="Panel image"
            className={styles.image}
            style={{
              objectFit: imageFit,
              borderRadius: imageFit === ImageFit.Cover ? 0 : (options.layout?.borderRadius || 0),
            }}
            onError={() => handleImageError(url)}
          />
        </div>
        {options.layout?.showImageCounter && (
          <div className={styles.counter}>1 / {finalImageUrls.length}</div>
        )}
        {lightboxImage && (
          <div className={styles.lightbox} onClick={closeLightbox}>
            <img src={lightboxImage} alt="Lightbox" className={styles.lightboxImage} />
          </div>
        )}
      </div>
    );
  }

  // Render carousel
  if (displayMode === ImageDisplayMode.Carousel) {
    const url = finalImageUrls[currentCarouselIndex];
    return (
      <div className={styles.container} style={{ width, height }}>
        <div className={styles.carouselWrapper}>
          <button className={cx(styles.carouselButton, styles.carouselButtonPrev)} onClick={prevImage}>
            ‹
          </button>
          <div
            className={cx(styles.imageWrapper, {
              [styles.clickable]: clickToFilterEnabled && showClickableIndicator,
            })}
            onClick={() => {
              handleImageClick(0);
              openLightbox(url);
            }}
            style={{
              cursor: clickToFilterEnabled ? options.clickToFilter?.cursorStyle || 'pointer' : 'default',
            }}
          >
            <img
              src={getImageUrl(url)}
              alt={`Image ${currentCarouselIndex + 1}`}
              className={styles.image}
              style={{
                objectFit: imageFit,
                borderRadius: imageFit === ImageFit.Cover ? 0 : (options.layout?.borderRadius || 0),
              }}
              onError={() => handleImageError(url)}
            />
          </div>
          <button className={cx(styles.carouselButton, styles.carouselButtonNext)} onClick={nextImage}>
            ›
          </button>
        </div>
        {options.layout?.showImageCounter && (
          <div className={styles.counter}>
            {currentCarouselIndex + 1} / {finalImageUrls.length}
          </div>
        )}
        {lightboxImage && (
          <div className={styles.lightbox} onClick={closeLightbox}>
            <img src={lightboxImage} alt="Lightbox" className={styles.lightboxImage} />
          </div>
        )}
      </div>
    );
  }

  // Render grid
  const gridColumns = options.layout?.gridColumns || 3;
  const gap = imageFit === ImageFit.Cover ? 0 : (options.layout?.gap || 8);

  return (
    <div className={styles.container} style={{ width, height }}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: `${gap}px`,
        }}
      >
        {finalImageUrls.map((url, index) => (
          <div
            key={index}
            className={cx(styles.gridItem, {
              [styles.clickable]: clickToFilterEnabled && showClickableIndicator,
            })}
            onClick={() => {
              handleImageClick(0);
              openLightbox(url);
            }}
            style={{
              cursor: clickToFilterEnabled ? options.clickToFilter?.cursorStyle || 'pointer' : 'default',
            }}
          >
            <img
              src={getImageUrl(url)}
              alt={`Image ${index + 1}`}
              className={styles.image}
              style={{
                objectFit: imageFit,
                borderRadius: imageFit === ImageFit.Cover ? 0 : (options.layout?.borderRadius || 0),
              }}
              onError={() => handleImageError(url)}
            />
          </div>
        ))}
      </div>
      {options.layout?.showImageCounter && (
        <div className={styles.counter}>{finalImageUrls.length} image{finalImageUrls.length !== 1 ? 's' : ''}</div>
      )}
      {lightboxImage && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <img src={lightboxImage} alt="Lightbox" className={styles.lightboxImage} />
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    padding: 0,
    margin: 0,
  }),
  imageWrapper: css({
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
  }),
  image: css({
    width: '100%',
    height: '100%',
    display: 'block',
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
  }),
  grid: css({
    display: 'grid',
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
  }),
  gridItem: css({
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'scale(1.02)',
    },
  }),
  clickable: css({
    boxShadow: `0 0 0 2px ${theme.colors.primary.border}`,
    '&:hover': {
      boxShadow: `0 0 0 2px ${theme.colors.primary.main}`,
    },
  }),
  counter: css({
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    boxShadow: theme.shadows.z2,
  }),
  placeholder: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    color: theme.colors.text.secondary,
  }),
  placeholderText: css({
    fontSize: theme.typography.h5.fontSize,
  }),
  carouselWrapper: css({
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
  }),
  carouselButton: css({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '24px',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.primary.border,
    },
  }),
  carouselButtonPrev: css({
    left: theme.spacing(2),
  }),
  carouselButtonNext: css({
    right: theme.spacing(2),
  }),
  lightbox: css({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    cursor: 'pointer',
  }),
  lightboxImage: css({
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
  }),
});

