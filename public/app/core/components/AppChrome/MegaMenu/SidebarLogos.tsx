import { css, keyframes } from '@emotion/css';
import { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
// Import logos using webpack - this ensures they are properly bundled
import mainSiwisLogo from 'img/MAIN_SIWIS.png';
import siwisWaterLogo from 'img/logo.svg';
import fluvioWebp from 'img/fluvio.webp';
import australianAidLogo from './australian-aid.png';

export function SidebarLogos() {
  const styles = useStyles2(getStyles);
  const [clickedCard, setClickedCard] = useState<string | null>(null);
  const [enlargedCard, setEnlargedCard] = useState<string | null>(null);

  const handleCardClick = (cardId: string, url?: string) => {
    setClickedCard(cardId);
    setEnlargedCard(cardId);
    setTimeout(() => setClickedCard(null), 600);

    // Open URL in new tab if provided
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardMouseLeave = () => {
    setEnlargedCard(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.partnerSection}>
        {/* Row 1: WRD / Water Resources Division */}
        <div
          className={`${styles.logoCard} ${clickedCard === 'logo1' ? styles.shineActive : ''} ${enlargedCard === 'logo1' ? styles.enlarged : ''}`}
          onClick={() => handleCardClick('logo1')}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className={styles.logoCardInner}>
            <img src={siwisWaterLogo} alt="Water Resources Division" className={styles.partnerLogoLarge} />
          </div>
        </div>

        {/* Row 2: Solomon Islands Government */}
        <div
          className={`${styles.logoCard} ${clickedCard === 'logo2' ? styles.shineActive : ''} ${enlargedCard === 'logo2' ? styles.enlarged : ''}`}
          onClick={() => handleCardClick('logo2')}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className={styles.logoCardInner}>
            <img src={mainSiwisLogo} alt="Solomon Islands Government" className={styles.partnerLogoLarge} />
          </div>
        </div>

        {/* "Supported By" Label */}
        <div className={styles.partnerLabel}>
          <span className={styles.labelText}>Supported By</span>
        </div>

        {/* Row 3: Fluvio */}
        <div
          className={`${styles.logoCard} ${clickedCard === 'logo3' ? styles.shineActive : ''} ${enlargedCard === 'logo3' ? styles.enlarged : ''}`}
          onClick={() => handleCardClick('logo3', 'https://fluvio.com.au/')}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className={styles.logoCardInner}>
            <img src={fluvioWebp} alt="Fluvio" className={styles.partnerLogo} />
          </div>
        </div>

        {/* Row 4: Australian Aid */}
        <div
          className={`${styles.logoCard} ${clickedCard === 'logo4' ? styles.shineActive : ''} ${enlargedCard === 'logo4' ? styles.enlarged : ''}`}
          onClick={() => handleCardClick('logo4', 'https://waterpartnership.org.au/')}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className={styles.logoCardInner}>
            <img src={australianAidLogo} alt="Australian Aid" className={styles.australianAidLogo} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Shine animation keyframes
const shineAnimation = keyframes`
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
`;

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;

  return {
    container: css({
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      padding: theme.spacing(0.5, 0.75),
      marginTop: theme.spacing(0.5),
      marginBottom: theme.spacing(0.5),
    }),

    partnerSection: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.75),
      width: '100%',
    }),

    partnerLabel: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: theme.spacing(0.125),
      marginBottom: theme.spacing(0.25),
      position: 'relative',

      '&::before, &::after': {
        content: '""',
        flex: 1,
        height: '1px',
        background: isDark
          ? 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.35), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(100, 116, 139, 0.2), transparent)',
      },

      '&::before': { marginRight: theme.spacing(1) },
      '&::after': { marginLeft: theme.spacing(1) },
    }),

    labelText: css({
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.6px',
      textTransform: 'uppercase',
      color: isDark ? 'rgba(148, 163, 184, 0.9)' : 'rgba(71, 85, 105, 0.6)',
      whiteSpace: 'nowrap',
    }),

    // Single unified card style — full width, stacked one per row
    logoCard: css({
      position: 'relative',
      width: '100%',
      borderRadius: theme.shape.radius.default,
      overflow: 'hidden',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',

      background: isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.75) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.7) 100%)',

      border: `1px solid ${isDark ? 'rgba(98, 165, 212, 0.20)' : 'rgba(203, 213, 225, 0.25)'}`,

      boxShadow: isDark
        ? '0 1px 4px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(98, 165, 212, 0.12)'
        : '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.03)',

      '&:hover': {
        transform: 'translateY(-1px)',
        borderColor: isDark ? 'rgba(98, 165, 212, 0.35)' : 'rgba(36, 122, 190, 0.2)',
        boxShadow: isDark
          ? '0 4px 8px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(98, 165, 212, 0.2)'
          : '0 4px 8px rgba(15, 23, 42, 0.1), 0 2px 4px rgba(36, 122, 190, 0.06)',
        background: isDark
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.85) 100%)',
      },

      // Shine effect overlay (hidden by default)
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: isDark
          ? 'linear-gradient(90deg, transparent, rgba(98, 165, 212, 0.3), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
        zIndex: 2,
        pointerEvents: 'none',
      },
    }),

    shineActive: css({
      '&::before': {
        animation: `${shineAnimation} 0.6s ease-out`,
      },
    }),

    enlarged: css({
      zIndex: 10,
      '& img': {
        transform: 'scale(1.4)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    }),

    logoCardInner: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(1.25, 1.5),
      minHeight: '56px',
      position: 'relative',
      zIndex: 1,
    }),

    // Large logos: WRD + SIWIS Coat of Arms
    partnerLogoLarge: css({
      maxWidth: '100%',
      maxHeight: '64px',
      width: 'auto',
      height: 'auto',
      objectFit: 'contain',
      display: 'block',
      margin: '0 auto',
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease',
      transform: 'scale(1)',
      filter: isDark
        ? 'brightness(1.15) contrast(1.1) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3))'
        : 'brightness(1) contrast(1) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))',
    }),

    // Partner logos: Fluvio
    partnerLogo: css({
      maxWidth: '100%',
      maxHeight: '48px',
      width: 'auto',
      height: 'auto',
      objectFit: 'contain',
      display: 'block',
      margin: '0 auto',
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease',
      transform: 'scale(1)',
      filter: isDark
        ? 'brightness(1.15) contrast(1.1) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3))'
        : 'brightness(1) contrast(1) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))',
    }),

    // Australian Aid logo — larger and high clarity
    australianAidLogo: css({
      maxWidth: '100%',
      maxHeight: '110px',
      width: 'auto',
      height: 'auto',
      objectFit: 'contain',
      display: 'block',
      margin: '0 auto',
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease',
      transform: 'scale(1)',
      filter: isDark
        ? 'brightness(1.25) contrast(1.15) drop-shadow(0 1px 4px rgba(0, 0, 0, 0.4))'
        : 'brightness(1.05) contrast(1.1) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12))',
    }),
  };
};
