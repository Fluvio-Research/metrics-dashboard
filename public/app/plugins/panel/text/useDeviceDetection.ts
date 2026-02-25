import { useMemo } from 'react';

/**
 * Device detection result interface
 */
export interface DeviceInfo {
  /** True if running on any iOS device (iPhone, iPad, iPod) */
  isIOS: boolean;
  /** True if running specifically on iPhone */
  isIPhone: boolean;
  /** True if running on iPad */
  isIPad: boolean;
  /** True if running on any mobile device */
  isMobile: boolean;
  /** True if running on Apple mobile devices (iOS) */
  isAppleMobile: boolean;
}

/**
 * Detects if the current device is an iOS/Apple mobile device
 * Uses multiple detection strategies for reliability:
 * 1. User Agent string parsing (primary)
 * 2. Platform detection (fallback)
 * 3. Touch/screen detection for iPad (iPadOS 13+ reports as Mac)
 * 
 * Industry-standard approach following best practices from:
 * - MDN Web Docs
 * - Web.dev responsive design guidelines
 */
function detectDevice(): DeviceInfo {
  // Server-side rendering safety
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isIPhone: false,
      isIPad: false,
      isMobile: false,
      isAppleMobile: false,
    };
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const platform = navigator.platform || '';

  // Primary detection via User Agent
  const isIPhoneUA = /iPhone/i.test(userAgent);
  const isIPodUA = /iPod/i.test(userAgent);
  const isIPadUA = /iPad/i.test(userAgent);
  
  // iPadOS 13+ detection (reports as Mac in UA, but has touch)
  // This is the industry-standard way to detect iPad on iPadOS 13+
  const isIPadOS13Plus = 
    /Macintosh/i.test(userAgent) && 
    navigator.maxTouchPoints !== undefined && 
    navigator.maxTouchPoints > 1;

  // Platform-based detection (fallback)
  const isIOSPlatform = /iPhone|iPad|iPod/.test(platform);

  // Combine all detection methods
  const isIPhone = isIPhoneUA;
  const isIPad = isIPadUA || isIPadOS13Plus;
  const isIOS = isIPhoneUA || isIPodUA || isIPadUA || isIPadOS13Plus || isIOSPlatform;
  
  // General mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
    isIPadOS13Plus ||
    (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 1 && /Macintosh/i.test(userAgent));

  // Apple mobile = iOS devices
  const isAppleMobile = isIOS;

  return {
    isIOS,
    isIPhone,
    isIPad,
    isMobile,
    isAppleMobile,
  };
}

/**
 * React hook for device detection
 * Memoized to prevent unnecessary recalculations
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isIPhone, isAppleMobile } = useDeviceDetection();
 *   
 *   if (isAppleMobile) {
 *     return <MobileOptimizedContent />;
 *   }
 *   return <DesktopContent />;
 * }
 * ```
 */
export function useDeviceDetection(): DeviceInfo {
  return useMemo(() => detectDevice(), []);
}

/**
 * Non-hook version for use outside React components
 * Useful for conditional logic in non-component code
 */
export function getDeviceInfo(): DeviceInfo {
  return detectDevice();
}
