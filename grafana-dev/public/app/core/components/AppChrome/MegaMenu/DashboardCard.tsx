import { css } from '@emotion/css';
import { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { DashboardSearchItem } from 'app/features/search/types';
import { locationService } from '@grafana/runtime';
import kbn from 'app/core/utils/kbn';

interface DashboardCardProps {
  dashboard: DashboardSearchItem;
  onClick?: () => void;
}

export function DashboardCard({ dashboard, onClick }: DashboardCardProps) {
  const styles = useStyles2(getStyles);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Generate iframe URL for dashboard preview
  const getIframeUrl = (uid: string) => {
    const params = new URLSearchParams({
      kiosk: 'tv',             // TV mode - cleaner than kiosk=true
      theme: 'light',          // Use light theme for consistency
      refresh: '5m',           // Refresh every 5 minutes
      from: 'now-6h',          // Show more data for better preview
      to: 'now',
      // Force specific viewport dimensions to ensure full dashboard is visible
      width: '1400',
      height: '1050',
    });
    return `/d/${uid}?${params.toString()}`;
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onClick) {
      onClick();
    }
    
    if (dashboard.uid && dashboard.title) {
      // Navigate directly to the dashboard using its UID and slug
      const slug = kbn.slugifyForUrl(dashboard.title);
      const dashboardUrl = `/d/${dashboard.uid}/${slug}`;
      locationService.push(dashboardUrl);
    } else if (dashboard.uid) {
      // Fallback to just UID if no title
      const dashboardUrl = `/d/${dashboard.uid}`;
      locationService.push(dashboardUrl);
    } else if (dashboard.url) {
      // Fallback to the provided URL if no UID
      locationService.push(dashboard.url);
    }
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  // Render dashboard iframe preview
  const renderDashboardPreview = () => {
    if (!dashboard.uid) {
      return (
        <div className={styles.previewDefault}>
          <div className={styles.previewIcon}>📊</div>
          <div className={styles.fallbackText}>Dashboard</div>
        </div>
      );
    }

    const iframeUrl = getIframeUrl(dashboard.uid);

    return (
      <div className={styles.iframeContainer}>
        {!iframeError && (
          <iframe
            src={iframeUrl}
            className={styles.dashboardIframe}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ opacity: iframeLoaded ? 1 : 0 }}
            title={`${dashboard.title} preview`}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
        
        {(!iframeLoaded || iframeError) && (
          <div className={styles.previewDefault}>
            <div className={styles.previewIcon}>📊</div>
            <div className={styles.fallbackText}>
              {iframeError ? 'Preview unavailable' : 'Loading...'}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  };

  return (
    <div 
      className={styles.card} 
      onClick={handleClick} 
      onKeyDown={handleKeyDown}
      role="button" 
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.previewContainer}>
        {renderDashboardPreview()}
        
        {/* Overlay for hover effect */}
        <div className={styles.overlay}>
          <div className={styles.playIcon}>▶</div>
        </div>
      </div>
      
      <div className={styles.title}>
        {dashboard.title}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDarkTheme = theme.colors.mode === 'dark';
  
  return {
    card: css({
      display: 'flex',
      flexDirection: 'column',
      margin: theme.spacing(0.5, 0.5, 1, 0.5),
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      backgroundColor: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
      
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows.z3,
        borderColor: theme.colors.border.medium,
      },
      
      '&:focus': {
        outline: `2px solid ${theme.colors.primary.border}`,
        outlineOffset: '2px',
      },
      
      ...(false && {
        backgroundColor: 'rgba(26, 74, 107, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        
        '&:hover': {
          backgroundColor: 'rgba(26, 74, 107, 0.5)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        },
      }),
      
      ...(isDarkTheme && {
        backgroundColor: theme.colors.background.primary,
        borderColor: theme.colors.border.medium,
      }),
    }),
    
    previewContainer: css({
      position: 'relative',
      width: '100%',
      height: '80px',
      overflow: 'hidden',
      backgroundColor: theme.colors.background.canvas,
      
      ...(false && {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }),
      
      ...(isDarkTheme && {
        backgroundColor: theme.colors.background.secondary,
      }),
    }),
    
    iframeContainer: css({
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: theme.colors.background.canvas,
      
      // Ensure the scaled iframe fits properly
      '& iframe': {
        maxWidth: 'none',
        maxHeight: 'none',
      },
      
      ...(false && {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }),
      
      ...(isDarkTheme && {
        backgroundColor: theme.colors.background.secondary,
      }),
    }),
    
    dashboardIframe: css({
      width: '1400px', // Larger width to capture full dashboard
      height: '1050px', // Larger height to capture full dashboard
      border: 'none',
      borderRadius: '4px 4px 0 0',
      transition: 'opacity 0.3s ease-in-out',
      // Use both transform and zoom for better compatibility
      transform: 'scale(0.285)', // Scale down to fit: ~400px/1400px ≈ 0.285
      zoom: '0.285', // Alternative scaling method for better iframe support
      transformOrigin: 'top left',
      pointerEvents: 'none', // Prevent interaction with iframe content
      position: 'absolute',
      top: 0,
      left: 0,
      overflow: 'hidden',
      // Force iframe to render at full size before scaling
      minWidth: '1400px',
      minHeight: '1050px',
    }),
    
    previewLoading: css({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.canvas,
      gap: theme.spacing(0.5),
      
      ...(false && {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }),
    }),
    
    loadingSpinner: css({
      fontSize: '16px',
      animation: 'spin 1s linear infinite',
      '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
    }),
    
    previewDefault: css({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.canvas,
      gap: theme.spacing(0.5),
      
      ...(false && {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }),
      
      ...(isDarkTheme && {
        backgroundColor: theme.colors.background.secondary,
      }),
    }),
    
    loadingText: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      
      ...(false && {
        color: 'rgba(255, 255, 255, 0.8)',
      }),
    }),
    
    fallbackText: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing(0.5),
      
      ...(false && {
        color: 'rgba(255, 255, 255, 0.8)',
      }),
    }),
    
    previewIcon: css({
      fontSize: '24px',
      opacity: 0.6,
    }),
    
    overlay: css({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'opacity 0.2s ease-in-out',
      pointerEvents: 'none', // Allow clicks to pass through
      
      '.card:hover &': {
        opacity: 1,
      },
    }),
    
    playIcon: css({
      color: 'white',
      fontSize: '20px',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
    }),
    
    title: css({
      padding: theme.spacing(0.75, 0.75, 0.75, 0.75),
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
      textAlign: 'center',
      lineHeight: '1.2',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      minHeight: '2.4em', // Ensure consistent height for 2 lines
      
      ...(false && {
        color: '#FFFFFF',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
      }),
    }),
  };
};
