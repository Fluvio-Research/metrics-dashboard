/**
 * Custom marker SVG generator for Google Maps-style pins
 * Creates pin markers with dual colors: fixed outline + dynamic inner circle
 */

export interface PinMarkerConfig {
  pinColor?: string;          // Outline/pin color (default: dark gray)
  circleColor: string;         // Inner circle color (dynamic)
  size?: number;               // Marker size (default: 40)
  borderWidth?: number;        // Pin outline width (default: 2)
}

/**
 * Generates an SVG data URL for a Google Maps-style pin marker
 */
export function generatePinMarkerSVG(config: PinMarkerConfig): string {
  const {
    pinColor = '#2c3e50',
    circleColor,
    size = 40,
    borderWidth = 2,
  } = config;

  const width = size;
  const height = size * 1.4; // Pin is taller than it is wide
  const circleRadius = (size * 0.35);
  const circleCenterX = width / 2;
  const circleCenterY = size * 0.35;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Pin shadow -->
      <path 
        d="M ${width/2} ${height - 4} 
           Q ${width/2} ${height * 0.7}, ${width/2} ${size * 0.7}
           A ${size * 0.4} ${size * 0.4} 0 1 1 ${width/2} ${size * 0.7}
           Q ${width/2} ${height * 0.7}, ${width/2} ${height - 4} Z"
        fill="rgba(0,0,0,0.2)"
        filter="url(#shadow)"
      />
      
      <!-- Pin outline -->
      <path 
        d="M ${width/2} ${height - 4} 
           Q ${width/2} ${height * 0.7}, ${width/2} ${size * 0.7}
           A ${size * 0.4} ${size * 0.4} 0 1 1 ${width/2} ${size * 0.7}
           Q ${width/2} ${height * 0.7}, ${width/2} ${height - 4} Z"
        fill="${pinColor}"
        stroke="${pinColor}"
        stroke-width="${borderWidth}"
      />
      
      <!-- Inner white circle background -->
      <circle 
        cx="${circleCenterX}" 
        cy="${circleCenterY}" 
        r="${circleRadius + borderWidth}" 
        fill="white"
      />
      
      <!-- Colored inner circle -->
      <circle 
        cx="${circleCenterX}" 
        cy="${circleCenterY}" 
        r="${circleRadius}" 
        fill="${circleColor}"
        stroke="white"
        stroke-width="1.5"
      />
      
      <!-- Subtle highlight -->
      <circle 
        cx="${circleCenterX - circleRadius * 0.3}" 
        cy="${circleCenterY - circleRadius * 0.3}" 
        r="${circleRadius * 0.25}" 
        fill="rgba(255,255,255,0.4)"
      />
    </svg>
  `.trim();

  // Convert SVG to data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a simplified pin marker SVG (lighter weight)
 */
export function generateSimplePinSVG(config: PinMarkerConfig): string {
  const {
    pinColor = '#2c3e50',
    circleColor,
    size = 40,
  } = config;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 40 56">
  <!-- Pin shadow -->
  <ellipse cx="20" cy="53" rx="16" ry="3" fill="rgba(0,0,0,0.15)"/>
  <!-- Pin body -->
  <path d="M20 52 Q20 44, 20 28 A16 16 0 1 1 20 28 Q20 44, 20 52 Z" fill="${pinColor}" stroke="${pinColor}" stroke-width="1"/>
  <!-- Inner circle background -->
  <circle cx="20" cy="14" r="11" fill="white"/>
  <!-- Colored circle -->
  <circle cx="20" cy="14" r="9" fill="${circleColor}" stroke="white" stroke-width="1.5"/>
  <!-- Shine effect -->
  <circle cx="17" cy="11" r="3" fill="rgba(255,255,255,0.5)"/>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Color schemes for different categories
 */
export const markerColorSchemes = {
  status: {
    active: '#10b981',    // Green
    inactive: '#ef4444',  // Red
    warning: '#f59e0b',   // Orange
    unknown: '#6b7280',   // Gray
  },
  priority: {
    high: '#dc2626',      // Red
    medium: '#f59e0b',    // Orange
    low: '#3b82f6',       // Blue
    none: '#9ca3af',      // Gray
  },
  category: {
    A: '#8b5cf6',         // Purple
    B: '#3b82f6',         // Blue
    C: '#10b981',         // Green
    D: '#f59e0b',         // Orange
    E: '#ef4444',         // Red
  },
  default: [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Deep Orange
  ],
};

/**
 * Get color for a value from a color scheme
 */
export function getColorForValue(
  value: string | number,
  scheme: 'status' | 'priority' | 'category' | 'default' = 'default'
): string {
  const schemeMap = markerColorSchemes[scheme];
  
  if (Array.isArray(schemeMap)) {
    // For default array, hash the value to get consistent color
    const hash = String(value).split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return schemeMap[Math.abs(hash) % schemeMap.length];
  }
  
  const key = String(value).toLowerCase();
  const colorMap = schemeMap as Record<string, string>;
  return colorMap[key] || colorMap[Object.keys(colorMap)[0]] || '#3b82f6';
}

