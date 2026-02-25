// Image Panel Configuration Types

/**
 * Image display mode
 */
export enum ImageDisplayMode {
  Single = 'single',
  Grid = 'grid',
  Carousel = 'carousel',
}

/**
 * Image fit mode
 */
export enum ImageFit {
  Contain = 'contain',
  Cover = 'cover',
  Fill = 'fill',
  ScaleDown = 'scale-down',
}

/**
 * Click-to-filter options
 */
export interface ClickToFilterOptions {
  /**
   * Enable click-to-filter feature
   */
  enabled?: boolean;
  /**
   * The field/column name to use for filtering (by display name)
   */
  sourceField?: string;
  /**
   * The target variable name to update (without $)
   */
  targetVariable?: string;
  /**
   * Whether to highlight clickable images
   */
  showClickableIndicator?: boolean;
  /**
   * Cursor style when hovering over clickable images
   */
  cursorStyle?: 'pointer' | 'default' | 'crosshair';
  /**
   * Clear filter when clicking the same value again
   */
  toggleMode?: boolean;
}

export const defaultClickToFilter: ClickToFilterOptions = {
  enabled: false,
  showClickableIndicator: true,
  cursorStyle: 'pointer',
  toggleMode: true,
};

/**
 * Image source options
 */
export interface ImageSourceOptions {
  /**
   * The field containing image URLs
   */
  urlField?: string;
  /**
   * Fallback image URL when no data or null
   */
  fallbackUrl?: string;
  /**
   * Show placeholder when no images
   */
  showPlaceholder?: boolean;
  /**
   * Placeholder text
   */
  placeholderText?: string;
}

export const defaultImageSource: ImageSourceOptions = {
  urlField: '',
  fallbackUrl: '',
  showPlaceholder: false,
  placeholderText: 'No images available',
};

/**
 * Layout options
 */
export interface LayoutOptions {
  /**
   * Display mode
   */
  displayMode?: ImageDisplayMode;
  /**
   * How images should fit in container
   */
  imageFit?: ImageFit;
  /**
   * Number of columns in grid mode
   */
  gridColumns?: number;
  /**
   * Gap between images in pixels
   */
  gap?: number;
  /**
   * Border radius in pixels
   */
  borderRadius?: number;
  /**
   * Show image counter
   */
  showImageCounter?: boolean;
  /**
   * Image aspect ratio (width:height)
   */
  aspectRatio?: string;
  /**
   * Enable lightbox on click
   */
  enableLightbox?: boolean;
  /**
   * Auto-rotate interval in carousel (ms, 0 = disabled)
   */
  autoRotateInterval?: number;
}

export const defaultLayout: LayoutOptions = {
  displayMode: ImageDisplayMode.Grid,
  imageFit: ImageFit.Cover,
  gridColumns: 3,
  gap: 8,
  borderRadius: 4,
  showImageCounter: true,
  aspectRatio: '16:9',
  enableLightbox: true,
  autoRotateInterval: 0,
};

/**
 * Main panel options
 */
export interface Options {
  /**
   * Image source configuration
   */
  imageSource?: ImageSourceOptions;
  /**
   * Layout configuration
   */
  layout?: LayoutOptions;
  /**
   * Click-to-filter options
   */
  clickToFilter?: ClickToFilterOptions;
}

export const defaultOptions: Options = {
  imageSource: defaultImageSource,
  layout: defaultLayout,
  clickToFilter: defaultClickToFilter,
};

