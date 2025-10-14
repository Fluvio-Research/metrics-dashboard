---
title: Customize navigation placement of plugin pages
description: Learn how to relocate Metrics Dashboard app plugin pages to customize the navigation menu structure.
labels:
  products:
    - enterprise
    - oss
    - cloud
keywords:
  - metrics-dashboard
  - plugins
  - plugin
  - navigation
  - customize
  - configuration
  - metrics-dashboard.ini
weight: 100
---

# Customize navigation placement of app plugin pages

By default, Metrics Dashboard app plugins and their pages appear under the "More apps" section in the navigation menu. However, as a Metrics Dashboard administrator, you might want to improve user experience by relocating specific pages or entire app plugins to more relevant sections of the navigation hierarchy. This guide shows you how to customize the placement of app plugin pages across different parts of your Metrics Dashboard navigation menu.

## Customize app and page navigation placement

You can change the location of your app plugin pages in two ways:

1. Move the entire app plugin (with all its pages) to a different section
2. Move specific pages from your app plugin to different sections

### 1. Move an entire app plugin to a different section

To relocate an entire app plugin to a different navigation section, use the `navigation.app_sections` configuration in your Metrics Dashboard configuration file:

```ini
[navigation.app_sections]
org-example-app = explore 100
```

This configuration:

- Moves the app plugin with ID `org-example-app`
- Places it in the `explore` section
- Assigns it a sort weight of `100` (determining its position within that section)

### 2. Move individual app pages to different sections

To move specific pages from an app plugin to different navigation sections, use the `navigation.app_standalone_pages` configuration:

```ini
[navigation.app_standalone_pages]
/a/org-example-app/dashboard-page = dashboards 200
/a/org-example-app/monitoring-page = alerting 50
```

This configuration:

- Moves the page with path `/a/org-example-app/dashboard-page` to the `dashboards` section with sort weight `200`
- Moves the page with path `/a/org-example-app/monitoring-page` to the `alerting` section with sort weight `50`

## Complete example

Here's a complete example that configures both the app placement and individual page placement in your Metrics Dashboard configuration:

```ini
# Move the entire app to the Explore section
[navigation.app_sections]
org-example-app = explore 50

# Move specific pages to their own sections
[navigation.app_standalone_pages]
/a/org-example-app/metrics = dashboards 100
/a/org-example-app/logs = alerting 75
```

## Understanding page paths

To move individual pages, you need to know their paths. Page paths in app plugins follow this format:
`/a/PLUGIN_ID/PAGE_PATH`

You can identify a plugin page path by visiting the page in the browser and observing the URL in the address bar.

## Troubleshooting

If your navigation changes don't appear:

1. Verify your configuration syntax is correct
2. Ensure you've restarted Metrics Dashboard after making changes
3. Check that the plugin IDs and page paths exactly match what's defined in your plugin
