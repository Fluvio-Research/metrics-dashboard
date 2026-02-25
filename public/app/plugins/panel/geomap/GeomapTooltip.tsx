import { useDialog } from '@react-aria/dialog';
import { useOverlay } from '@react-aria/overlays';
import { createRef, useMemo, useEffect, useCallback } from 'react';

import { Portal, VizTooltipContainer } from '@grafana/ui';
import { ComplexDataHoverView } from 'app/features/visualization/data-hover/ComplexDataHoverView';

import { GeomapHoverPayload } from './event';

interface Props {
  ttip?: GeomapHoverPayload;
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect?: (rowIndex: number) => void;
}

/**
 * GeomapTooltip - Handles tooltip display with robust close behavior
 * 
 * Industry-standard features:
 * 1. Escape key closes the tooltip
 * 2. Click outside closes the tooltip (via react-aria)
 * 3. Viewport-aware positioning
 * 4. Proper cleanup on unmount
 */
export const GeomapTooltip = ({ ttip, onClose, isOpen, onFeatureSelect }: Props) => {
  const ref = createRef<HTMLElement>();
  
  // Memoize onClose to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  
  const { overlayProps } = useOverlay({ 
    onClose: handleClose, 
    isDismissable: true, 
    isOpen,
    // Allow interaction with the tooltip content
    shouldCloseOnInteractOutside: (element) => {
      // Don't close if clicking on another marker or the map controls
      if (element.closest('.ol-control') || element.closest('.ol-overlay-container')) {
        return false;
      }
      // Close for clicks outside the tooltip and map markers
      return true;
    },
  }, ref);
  
  const { dialogProps } = useDialog({}, ref);

  // Handle Escape key at the tooltip level
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        evt.preventDefault();
        evt.stopPropagation();
        handleClose();
      }
    };
    
    // Use capture phase to handle Escape before other handlers
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen, handleClose]);

  // Adjust tooltip position when pinned to ensure it's visible in viewport
  const adjustedPosition = useMemo(() => {
    if (!ttip) {
      return { x: 0, y: 0 };
    }

    let x = ttip.pageX;
    let y = ttip.pageY;

    // When tooltip is pinned (clicked), ensure it doesn't go below viewport
    if (isOpen) {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Estimate tooltip dimensions
      const estimatedTooltipHeight = Math.min(600, viewportHeight - 100);
      const estimatedTooltipWidth = 360;
      
      // If tooltip would go below viewport, adjust y position
      if (y + estimatedTooltipHeight > viewportHeight - 20) {
        y = Math.max(20, viewportHeight - estimatedTooltipHeight - 20);
      }
      
      // If tooltip would go off right edge, adjust x position
      if (x + estimatedTooltipWidth > viewportWidth - 20) {
        x = Math.max(20, viewportWidth - estimatedTooltipWidth - 20);
      }
      
      // Ensure tooltip is not positioned too far left or top
      x = Math.max(20, x);
      y = Math.max(20, y);
    }

    return { x, y };
  }, [ttip, isOpen]);

  // Don't render if no tooltip data
  if (!ttip || !ttip.layers) {
    return null;
  }

  return (
    <Portal>
      <VizTooltipContainer 
        position={{ x: adjustedPosition.x, y: adjustedPosition.y }} 
        offset={{ x: 10, y: 10 }} 
        allowPointerEvents
      >
        <section
          ref={ref}
          data-geomap-tooltip="true"
          {...overlayProps}
          {...dialogProps}
          // Add explicit click handler as backup
          onClick={(e) => e.stopPropagation()}
        >
          <ComplexDataHoverView 
            layers={ttip.layers} 
            isOpen={isOpen} 
            onClose={handleClose}
            onFeatureSelect={onFeatureSelect}
          />
        </section>
      </VizTooltipContainer>
    </Portal>
  );
};
