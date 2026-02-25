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
 * Generates a modern professional map pin marker
 * Features: 3D gradient effect, outer glow, inner highlight, drop shadow
 */
export function generateSimplePinSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 40,
  } = config;

  const width = size;
  const height = size * 1.6;
  const viewBoxWidth = 368.553;
  const viewBoxHeight = 368.553;
  const uniqueId = `pin-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">
  <defs>
    <!-- 3D gradient for pin body -->
    <linearGradient id="pin-gradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.4"/>
      <stop offset="30%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <!-- Outer glow -->
    <filter id="pin-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.3" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Drop shadow -->
    <filter id="pin-shadow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
      <feOffset dx="0" dy="6" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <g filter="url(#pin-shadow-${uniqueId})">
    <!-- Main pin shape with gradient -->
    <path 
      d="M184.277,0c-71.683,0-130,58.317-130,130c0,87.26,119.188,229.855,124.263,235.883c1.417,1.685,3.504,2.66,5.705,2.67c0.011,0,0.021,0,0.032,0c2.189,0,4.271-0.957,5.696-2.621c5.075-5.926,124.304-146.165,124.304-235.932C314.276,58.317,255.96,0,184.277,0z" 
      fill="url(#pin-gradient-${uniqueId})"
      filter="url(#pin-glow-${uniqueId})"
    />
    <!-- White border for definition -->
    <path 
      d="M184.277,0c-71.683,0-130,58.317-130,130c0,87.26,119.188,229.855,124.263,235.883c1.417,1.685,3.504,2.66,5.705,2.67c0.011,0,0.021,0,0.032,0c2.189,0,4.271-0.957,5.696-2.621c5.075-5.926,124.304-146.165,124.304-235.932C314.276,58.317,255.96,0,184.277,0z" 
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="5"
    />
    <!-- Inner highlight -->
    <ellipse 
      cx="140" 
      cy="80" 
      rx="40" 
      ry="30" 
      fill="white"
      opacity="0.3"
    />
    <!-- Inner white circle -->
    <circle 
      cx="184.277" 
      cy="127.5" 
      r="42" 
      fill="white"
      opacity="0.95"
    />
    <!-- Inner circle border -->
    <circle 
      cx="184.277" 
      cy="127.5" 
      r="42" 
      fill="none"
      stroke="rgba(0,0,0,0.1)"
      stroke-width="2"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern, professional circular marker
 * Features: 3D gradient effect, inner highlight, outer glow, soft shadow
 * Looks like a polished glass sphere/orb
 */
export function generateCircleMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const center = size / 2;
  const radius = (size / 2) - 1; // Slight inset for glow
  const highlightRadius = radius * 0.35;
  const highlightOffsetX = -radius * 0.25;
  const highlightOffsetY = -radius * 0.25;
  
  // Generate unique IDs based on size and color to avoid conflicts
  const uniqueId = `${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Main gradient for 3D sphere effect -->
    <radialGradient id="sphere-gradient-${uniqueId}" cx="35%" cy="35%" r="60%" fx="30%" fy="30%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.7"/>
      <stop offset="25%" style="stop-color:${circleColor};stop-opacity:0.9"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </radialGradient>
    
    <!-- Darker version for bottom edge -->
    <radialGradient id="sphere-dark-${uniqueId}" cx="50%" cy="100%" r="80%">
      <stop offset="0%" style="stop-color:black;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:black;stop-opacity:0"/>
    </radialGradient>
    
    <!-- Outer glow effect -->
    <filter id="outer-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.4" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Drop shadow -->
    <filter id="drop-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Main circle with gradient and filters -->
  <g filter="url(#drop-shadow-${uniqueId})">
    <!-- Base circle with 3D gradient -->
    <circle 
      cx="${center}" 
      cy="${center}" 
      r="${radius}" 
      fill="url(#sphere-gradient-${uniqueId})"
      filter="url(#outer-glow-${uniqueId})"
    />
    
    <!-- Dark edge overlay for depth -->
    <circle 
      cx="${center}" 
      cy="${center}" 
      r="${radius}" 
      fill="url(#sphere-dark-${uniqueId})"
    />
    
    <!-- Inner highlight for glass effect -->
    <ellipse 
      cx="${center + highlightOffsetX}" 
      cy="${center + highlightOffsetY}" 
      rx="${highlightRadius}" 
      ry="${highlightRadius * 0.7}" 
      fill="white" 
      opacity="0.5"
    />
    
    <!-- Subtle border for definition -->
    <circle 
      cx="${center}" 
      cy="${center}" 
      r="${radius - 0.5}" 
      fill="none"
      stroke="rgba(255,255,255,0.4)"
      stroke-width="1"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a simple flat circular marker (classic/default style)
 * Clean, minimal design - useful when you want a basic marker without effects
 */
export function generateDefaultCircleMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const radius = size / 2;
  const uniqueId = `dc-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="default-circle-shadow-${uniqueId}">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="1" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <circle 
    cx="${radius}" 
    cy="${radius}" 
    r="${radius - 1}" 
    fill="${circleColor}" 
    stroke="rgba(255,255,255,0.6)"
    stroke-width="1.5"
    filter="url(#default-circle-shadow-${uniqueId})"
  />
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern square marker with professional styling
 * Features: 3D gradient, inner highlight, outer glow
 */
export function generateSquareMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const margin = 2;
  const rectSize = size - margin * 2;
  const borderRadius = size * 0.15;
  const uniqueId = `sq-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="square-gradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.4"/>
      <stop offset="30%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <filter id="square-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.35" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="square-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#square-shadow-${uniqueId})">
    <rect 
      x="${margin}" 
      y="${margin}" 
      width="${rectSize}" 
      height="${rectSize}" 
      rx="${borderRadius}"
      ry="${borderRadius}"
      fill="url(#square-gradient-${uniqueId})"
      filter="url(#square-glow-${uniqueId})"
    />
    <rect 
      x="${margin + 3}" 
      y="${margin + 2}" 
      width="${rectSize * 0.4}" 
      height="${rectSize * 0.25}" 
      rx="${borderRadius * 0.5}"
      ry="${borderRadius * 0.5}"
      fill="white"
      opacity="0.4"
    />
    <rect 
      x="${margin + 0.5}" 
      y="${margin + 0.5}" 
      width="${rectSize - 1}" 
      height="${rectSize - 1}" 
      rx="${borderRadius}"
      ry="${borderRadius}"
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="1"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern diamond marker with professional styling
 * Features: 3D gradient, inner highlight, outer glow
 */
export function generateDiamondMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const center = size / 2;
  const offset = 2;
  const uniqueId = `dm-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="diamond-gradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.5"/>
      <stop offset="35%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <filter id="diamond-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.35" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="diamond-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#diamond-shadow-${uniqueId})">
    <path 
      d="M ${center} ${offset} L ${size - offset} ${center} L ${center} ${size - offset} L ${offset} ${center} Z" 
      fill="url(#diamond-gradient-${uniqueId})"
      filter="url(#diamond-glow-${uniqueId})"
    />
    <path 
      d="M ${center} ${offset + 4} L ${center + 4} ${center - 2} L ${center - 2} ${center - 2} Z" 
      fill="white"
      opacity="0.4"
    />
    <path 
      d="M ${center} ${offset + 1} L ${size - offset - 1} ${center} L ${center} ${size - offset - 1} L ${offset + 1} ${center} Z" 
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="1"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern star marker with professional styling
 * Features: 3D gradient, inner highlight, outer glow
 */
export function generateStarMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const center = size / 2;
  const outerRadius = size / 2 - 2;
  const innerRadius = outerRadius * 0.4;
  const uniqueId = `st-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // Generate star points
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="star-gradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.5"/>
      <stop offset="35%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <filter id="star-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.35" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="star-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#star-shadow-${uniqueId})">
    <polygon 
      points="${points.join(' ')}" 
      fill="url(#star-gradient-${uniqueId})"
      filter="url(#star-glow-${uniqueId})"
    />
    <circle 
      cx="${center}" 
      cy="${center - outerRadius * 0.4}" 
      r="${outerRadius * 0.2}" 
      fill="white"
      opacity="0.4"
    />
    <polygon 
      points="${points.join(' ')}" 
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="1"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern triangle marker with professional styling
 * Features: 3D gradient, inner highlight, outer glow
 */
export function generateTriangleMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const center = size / 2;
  const offset = 2;
  const uniqueId = `tr-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="triangle-gradient-${uniqueId}" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.5"/>
      <stop offset="40%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <filter id="triangle-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.35" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="triangle-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#triangle-shadow-${uniqueId})">
    <path 
      d="M ${center} ${offset} L ${size - offset} ${size - offset} L ${offset} ${size - offset} Z" 
      fill="url(#triangle-gradient-${uniqueId})"
      filter="url(#triangle-glow-${uniqueId})"
    />
    <path 
      d="M ${center} ${offset + 4} L ${center + 3} ${offset + 8} L ${center - 3} ${offset + 8} Z" 
      fill="white"
      opacity="0.4"
    />
    <path 
      d="M ${center} ${offset + 1} L ${size - offset - 1} ${size - offset - 1} L ${offset + 1} ${size - offset - 1} Z" 
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="1"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern hexagon marker with professional styling
 * Features: 3D gradient, inner highlight, outer glow
 */
export function generateHexagonMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const center = size / 2;
  const radius = size / 2 - 2;
  const uniqueId = `hx-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // Generate hexagon points
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="hexagon-gradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.5"/>
      <stop offset="35%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <filter id="hexagon-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.35" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="hexagon-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#hexagon-shadow-${uniqueId})">
    <polygon 
      points="${points.join(' ')}" 
      fill="url(#hexagon-gradient-${uniqueId})"
      filter="url(#hexagon-glow-${uniqueId})"
    />
    <ellipse 
      cx="${center - radius * 0.2}" 
      cy="${center - radius * 0.3}" 
      rx="${radius * 0.3}" 
      ry="${radius * 0.2}" 
      fill="white"
      opacity="0.4"
    />
    <polygon 
      points="${points.join(' ')}" 
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="1"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern octagon marker with professional styling
 * Features: 3D gradient, inner highlight, outer glow
 */
export function generateOctagonMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const center = size / 2;
  const radius = size / 2 - 2;
  const uniqueId = `oc-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // Generate octagon points
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="octagon-gradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.5"/>
      <stop offset="35%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <filter id="octagon-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.35" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="octagon-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#octagon-shadow-${uniqueId})">
    <polygon 
      points="${points.join(' ')}" 
      fill="url(#octagon-gradient-${uniqueId})"
      filter="url(#octagon-glow-${uniqueId})"
    />
    <ellipse 
      cx="${center - radius * 0.2}" 
      cy="${center - radius * 0.3}" 
      rx="${radius * 0.3}" 
      ry="${radius * 0.2}" 
      fill="white"
      opacity="0.4"
    />
    <polygon 
      points="${points.join(' ')}" 
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="1"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern heart marker with professional styling
 * Features: 3D gradient, inner highlight, outer glow
 */
export function generateHeartMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const uniqueId = `ht-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="heart-gradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.5"/>
      <stop offset="35%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <filter id="heart-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.35" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="heart-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#heart-shadow-${uniqueId})">
    <path 
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
      fill="url(#heart-gradient-${uniqueId})"
      filter="url(#heart-glow-${uniqueId})"
    />
    <ellipse 
      cx="7" 
      cy="7" 
      rx="2.5" 
      ry="1.5" 
      fill="white"
      opacity="0.4"
    />
    <path 
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="0.8"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern cross/plus marker with professional styling
 * Features: 3D gradient, inner highlight, outer glow
 */
export function generateCrossMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const center = size / 2;
  const armWidth = size * 0.28;
  const uniqueId = `cr-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const crossPath = `M ${center - armWidth/2} 2 L ${center + armWidth/2} 2 L ${center + armWidth/2} ${center - armWidth/2} L ${size - 2} ${center - armWidth/2} L ${size - 2} ${center + armWidth/2} L ${center + armWidth/2} ${center + armWidth/2} L ${center + armWidth/2} ${size - 2} L ${center - armWidth/2} ${size - 2} L ${center - armWidth/2} ${center + armWidth/2} L 2 ${center + armWidth/2} L 2 ${center - armWidth/2} L ${center - armWidth/2} ${center - armWidth/2} Z`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="cross-gradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.5"/>
      <stop offset="35%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <filter id="cross-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.35" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="cross-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#cross-shadow-${uniqueId})">
    <path 
      d="${crossPath}" 
      fill="url(#cross-gradient-${uniqueId})"
      filter="url(#cross-glow-${uniqueId})"
    />
    <rect 
      x="${center - armWidth/4}" 
      y="4" 
      width="${armWidth/2}" 
      height="${armWidth/2}" 
      rx="1"
      fill="white"
      opacity="0.4"
    />
    <path 
      d="${crossPath}" 
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="0.8"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern sleek pin marker
 * Features: Subtle gradient, soft glow, clean design
 */
export function generateModernPinSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 40,
  } = config;

  const width = size;
  const height = size * 1.6;
  const viewBoxWidth = 368.553;
  const viewBoxHeight = 368.553;
  const uniqueId = `mpin-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">
  <defs>
    <!-- Subtle gradient -->
    <radialGradient id="modern-pin-gradient-${uniqueId}" cx="30%" cy="30%" r="70%" fx="25%" fy="25%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.35"/>
      <stop offset="50%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </radialGradient>
    <!-- Soft outer glow -->
    <filter id="modern-pin-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.25" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Soft shadow -->
    <filter id="modern-pin-shadow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.25"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <g filter="url(#modern-pin-shadow-${uniqueId})">
    <!-- Pin body with gradient -->
    <path 
      d="M184.277,0c-71.683,0-130,58.317-130,130c0,87.26,119.188,229.855,124.263,235.883c1.417,1.685,3.504,2.66,5.705,2.67c0.011,0,0.021,0,0.032,0c2.189,0,4.271-0.957,5.696-2.621c5.075-5.926,124.304-146.165,124.304-235.932C314.276,58.317,255.96,0,184.277,0z" 
      fill="url(#modern-pin-gradient-${uniqueId})"
      filter="url(#modern-pin-glow-${uniqueId})"
    />
    <!-- Subtle border -->
    <path 
      d="M184.277,0c-71.683,0-130,58.317-130,130c0,87.26,119.188,229.855,124.263,235.883c1.417,1.685,3.504,2.66,5.705,2.67c0.011,0,0.021,0,0.032,0c2.189,0,4.271-0.957,5.696-2.621c5.075-5.926,124.304-146.165,124.304-235.932C314.276,58.317,255.96,0,184.277,0z" 
      fill="none"
      stroke="rgba(255,255,255,0.45)"
      stroke-width="4"
    />
    <!-- Inner white circle -->
    <circle 
      cx="184.277" 
      cy="127.5" 
      r="38" 
      fill="white"
      opacity="0.92"
    />
    <!-- Circle highlight -->
    <ellipse 
      cx="170" 
      cy="115" 
      rx="15" 
      ry="10" 
      fill="white"
      opacity="0.5"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a modern pentagon marker with professional styling
 * Features: 3D gradient, inner highlight, outer glow
 */
export function generatePentagonMarkerSVG(config: PinMarkerConfig): string {
  const {
    circleColor,
    size = 24,
  } = config;

  const center = size / 2;
  const radius = size / 2 - 2;
  const uniqueId = `pn-${size}-${circleColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // Generate pentagon points
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="pentagon-gradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.5"/>
      <stop offset="35%" style="stop-color:${circleColor};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${circleColor};stop-opacity:1"/>
    </linearGradient>
    <filter id="pentagon-glow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feFlood flood-color="${circleColor}" flood-opacity="0.35" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="pentagon-shadow-${uniqueId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#pentagon-shadow-${uniqueId})">
    <polygon 
      points="${points.join(' ')}" 
      fill="url(#pentagon-gradient-${uniqueId})"
      filter="url(#pentagon-glow-${uniqueId})"
    />
    <ellipse 
      cx="${center - radius * 0.15}" 
      cy="${center - radius * 0.35}" 
      rx="${radius * 0.3}" 
      ry="${radius * 0.2}" 
      fill="white"
      opacity="0.4"
    />
    <polygon 
      points="${points.join(' ')}" 
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      stroke-width="1"
    />
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Color schemes for different categories
 */
export const markerColorSchemes = {
  status: {
    // Active states
    active: '#10b981',      // Green
    online: '#10b981',      // Green
    running: '#10b981',     // Green
    enabled: '#10b981',     // Green
    success: '#10b981',     // Green
    ok: '#10b981',          // Green
    up: '#10b981',          // Green
    healthy: '#10b981',     // Green
    
    // Inactive states
    inactive: '#ef4444',    // Red
    offline: '#ef4444',     // Red
    stopped: '#ef4444',     // Red
    disabled: '#ef4444',    // Red
    error: '#ef4444',       // Red
    failed: '#ef4444',      // Red
    down: '#ef4444',        // Red
    critical: '#ef4444',    // Red
    
    // Warning states
    warning: '#f59e0b',     // Orange
    pending: '#f59e0b',     // Orange
    degraded: '#f59e0b',    // Orange
    
    // Unknown/neutral states
    unknown: '#6b7280',     // Gray
    null: '#6b7280',        // Gray
    undefined: '#6b7280',   // Gray
  },
  priority: {
    // High priority
    high: '#dc2626',        // Red
    critical: '#dc2626',    // Red
    urgent: '#dc2626',      // Red
    p1: '#dc2626',          // Red
    '1': '#dc2626',         // Red
    
    // Medium priority
    medium: '#f59e0b',      // Orange
    normal: '#f59e0b',      // Orange
    p2: '#f59e0b',          // Orange
    '2': '#f59e0b',         // Orange
    
    // Low priority
    low: '#3b82f6',         // Blue
    minor: '#3b82f6',       // Blue
    p3: '#3b82f6',          // Blue
    '3': '#3b82f6',         // Blue
    
    // No priority
    none: '#9ca3af',        // Gray
    null: '#9ca3af',        // Gray
    undefined: '#9ca3af',   // Gray
  },
  category: {
    A: '#8b5cf6',           // Purple
    B: '#3b82f6',           // Blue
    C: '#10b981',           // Green
    D: '#f59e0b',           // Orange
    E: '#ef4444',           // Red
    F: '#ec4899',           // Pink
    G: '#14b8a6',           // Teal
    H: '#f97316',           // Deep Orange
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
 * Ensures consistent color assignment for the same value
 * Supports custom color palettes
 */
export function getColorForValue(
  value: string | number | null | undefined,
  scheme: 'status' | 'priority' | 'category' | 'default' | 'custom' = 'default',
  customPalette?: string[],
  allUniqueValues?: string[]
): string {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return '#6b7280'; // Gray for null/undefined
  }

  // Use custom palette if provided and scheme is 'custom'
  if (scheme === 'custom' && customPalette && customPalette.length > 0) {
    const valueStr = String(value).trim();
    
    // Use index-based assignment with sorted unique values for stable color mapping
    // This ensures each value gets a consistent color based on its position in the sorted list
    // When values are missing, remaining values still get their correct colors
    if (allUniqueValues && allUniqueValues.length > 0) {
      // Find the value's position in the sorted unique values list
      const valueIndex = allUniqueValues.indexOf(valueStr);
      if (valueIndex >= 0) {
        const colorIndex = valueIndex % customPalette.length;
        const selectedColor = customPalette[colorIndex];
        
        // Ensure we return a valid color string
        if (selectedColor && selectedColor.trim() !== '') {
          return selectedColor.trim();
        }
      }
    }
    
    // Fallback to hash-based for values not in the unique values list
    // This handles edge cases where a value appears that wasn't in the initial data
    const hash = valueStr.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const colorIndex = Math.abs(hash) % customPalette.length;
    const selectedColor = customPalette[colorIndex];

    // Ensure we return a valid color string
    if (!selectedColor || selectedColor.trim() === '') {
      return '#3b82f6';
    }

    return selectedColor.trim();
  }

  const schemeMap = markerColorSchemes[scheme === 'custom' ? 'default' : scheme];
  
  if (Array.isArray(schemeMap)) {
    // For default array, hash the value to get consistent color
    // Convert to string and normalize to ensure consistency
    const valueStr = String(value).trim();
    const hash = valueStr.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const colorIndex = Math.abs(hash) % schemeMap.length;
    return schemeMap[colorIndex];
  }
  
  // For named schemes (status, priority, category)
  const colorMap = schemeMap as Record<string, string>;
  const valueStr = String(value).trim();
  const key = valueStr.toLowerCase();
  
  // Try exact match first
  if (colorMap[key]) {
    return colorMap[key];
  }
  
  // Try case-insensitive match
  const matchedKey = Object.keys(colorMap).find(k => k.toLowerCase() === key);
  if (matchedKey) {
    return colorMap[matchedKey];
  }
  
  // For single-letter categories (A, B, C, etc), try uppercase
  if (scheme === 'category' && valueStr.length === 1) {
    const upperKey = valueStr.toUpperCase();
    if (colorMap[upperKey]) {
      return colorMap[upperKey];
    }
  }
  
  // Fallback: use consistent hashing for unmapped values
  // This ensures any value gets a consistent color even if not in the predefined map
  const availableColors = Object.values(colorMap);
  const hash = valueStr.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const colorIndex = Math.abs(hash) % availableColors.length;
  return availableColors[colorIndex];
}

