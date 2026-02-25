import { getThemeById } from '@grafana/data/internal';
import { ThemeChangedEvent } from '@grafana/runtime';

import appEvents from '../app_events';
import { config } from '../config';
import { contextSrv } from '../core';

import { PreferencesService } from './PreferencesService';

export async function changeTheme(themeId: string, runtimeOnly?: boolean) {
  const oldTheme = config.theme2;

  const newTheme = getThemeById(themeId);

  // Update config.theme2 immediately so all components see the new theme
  config.theme2 = newTheme;

  // Publish theme change event to notify all subscribers
  appEvents.publish(new ThemeChangedEvent(newTheme));

  // Add css file for new theme
  if (oldTheme.colors.mode !== newTheme.colors.mode) {
    const newCssLink = document.createElement('link');
    newCssLink.rel = 'stylesheet';
    newCssLink.href = config.bootData.assets[newTheme.colors.mode];
    newCssLink.onload = () => {
      // Remove old css file
      const bodyLinks = document.getElementsByTagName('link');
      for (let i = 0; i < bodyLinks.length; i++) {
        const link = bodyLinks[i];

        if (link.href && link.href.includes(`build/grafana.${oldTheme.colors.mode}`)) {
          // Remove existing link once the new css has loaded to avoid flickering
          // If we add new css at the same time we remove current one the page will be rendered without css
          // As the new css file is loading
          link.remove();
        }
      }
    };
    document.head.insertBefore(newCssLink, document.head.firstChild);
  }

  if (runtimeOnly) {
    return;
  }

  if (!contextSrv.isSignedIn) {
    return;
  }

  // Persist new theme - wrap in try-catch to ensure theme change works
  // even if persistence fails (e.g., for non-admin users with restricted permissions)
  try {
    const service = new PreferencesService('user');
    await service.patch({
      theme: themeId,
    });
  } catch (error) {
    // Log the error but don't throw - theme change should still work visually
    console.warn('Failed to persist theme preference:', error);
  }
}

export async function toggleTheme(runtimeOnly: boolean) {
  const currentTheme = config.theme2;
  changeTheme(currentTheme.isDark ? 'light' : 'dark', runtimeOnly);
}
