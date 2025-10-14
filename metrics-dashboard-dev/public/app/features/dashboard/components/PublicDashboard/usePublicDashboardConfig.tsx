import { css } from '@emotion/css';
import * as React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import metricsTextLogoDarkSvg from 'img/metrics_text_logo_dark.svg';
import metricsTextLogoLightSvg from 'img/metrics_text_logo_light.svg';

const FOOTER_URL = 'https://metrics-dashboard.dev/?src=metrics-dashboard&cnt=public-dashboards';
const METRICS_LOGO_LIGHT_URL = metricsTextLogoLightSvg;
const METRICS_LOGO_DARK_URL = metricsTextLogoDarkSvg;
const METRICS_LOGO_DEFAULT_VALUE = 'metrics-dashboard-logo';

export interface PublicDashboardCfg {
  footerHide: boolean;
  footerText: React.ReactNode;
  footerLogo: string;
  footerLink: string;
  headerLogoHide: boolean;
}
const useGetConfig = (cfg?: PublicDashboardCfg) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const { footerHide, footerText, footerLink, footerLogo, headerLogoHide } = cfg || {
    footerHide: false,
    footerText: 'Powered by',
    footerLogo: METRICS_LOGO_DEFAULT_VALUE,
    footerLink: FOOTER_URL,
    headerLogoHide: false,
  };

  return {
    footerHide,
    footerText: <span className={styles.text}>{footerText}</span>,
    footerLogo:
      footerLogo === METRICS_LOGO_DEFAULT_VALUE
        ? theme.isDark
          ? METRICS_LOGO_LIGHT_URL
          : METRICS_LOGO_DARK_URL
        : footerLogo,
    footerLink,
    headerLogoHide,
  };
};
export let useGetPublicDashboardConfig = (): PublicDashboardCfg => useGetConfig();

export function setPublicDashboardConfigFn(cfg: PublicDashboardCfg) {
  useGetPublicDashboardConfig = (): PublicDashboardCfg => useGetConfig(cfg);
}

const getStyles = (theme: GrafanaTheme2) => ({
  text: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body.fontSize,
  }),
});
