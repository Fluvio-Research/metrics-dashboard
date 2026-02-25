---
aliases:
  - ../../features/panels/text/
  - ../../panels/visualizations/text-panel/
  - ../../reference/alertlist/
  - ../../visualizations/text-panel/
keywords:
  - metrics-dashboard
  - text
  - documentation
  - panel
labels:
  products:
    - cloud
    - enterprise
    - oss
description: Configure options for Metrics Dashboard's text visualization
title: Text
weight: 100
refs:
  disable-sanitize-html:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#disable_sanitize_html
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#disable_sanitize_html
  variables:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/variables/variable-syntax/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/variables/variable-syntax/
---

# Text

Text visualizations let you include text or HTML in your dashboards.
This can be used to add contextual information and descriptions or embed complex HTML.

For example, if you want to display important links on your dashboard, you can use a text visualization to add these links:

{{< figure src="/media/docs/metrics-dashboard/panels-visualizations/screenshot-text-visualization-v11.6.png" max-width="750px" alt="A text panel showing important links" >}}

{{< docs/play title="Text Panel" url="https://play.metrics-dashboard.org/d/adl33bxy1ih34b/" >}}

Use a text visualization when you need to:

- Add important links or useful annotations.
- Provide instructions or guidance on how to interpret different panels, configure settings, or take specific actions based on the displayed data.
- Announce any scheduled maintenance or downtime that might impact your dashboards.

## Configuration options

{{< docs/shared lookup="visualizations/config-options-intro.md" source="metrics-dashboard" version="<METRICS_DASHBOARD_VERSION>" >}}

### Panel options

{{< docs/shared lookup="visualizations/panel-options.md" source="metrics-dashboard" version="<METRICS_DASHBOARD_VERSION>" >}}

### Text options

Use the following options to refine your text visualization.

<!-- prettier-ignore-start -->

| Option | Description |
| ------ | ----------- |
| Mode | Determines how embedded content appears. Choose from:<ul><li>**Markdown** - Formats the content as [markdown](https://en.wikipedia.org/wiki/Markdown).</li><li>**HTML** - Renders the content as [sanitized](https://github.com/metrics-dashboard/metrics-dashboard/blob/main/packages/metrics-dashboard-data/src/text/sanitize.ts) HTML. If you require more direct control over the output, you can set the [disable_sanitize_html](ref:disable-sanitize-html) flag which enables you to directly enter HTML.</li><li>**Code** - Renders content inside a read-only code editor. [Variables](ref:variables) in the content are expanded for display.</li></ul><p>To allow embedding of iframes and other websites, you need set `allow_embedding = true` in your Metrics Dashboard `config.ini` or environment variables (depending on your employment).</p> |
| Language | When you choose **Code** as your text mode, select an appropriate language to apply syntax highlighting to the embedded text. |
| Show line numbers | Displays line numbers in the panel preview when you choose **Code** as your text mode. |
| Show mini map | Displays a small outline of the embedded text in the panel preview when you choose **Code** as your text mode. |

<!-- prettier-ignore-end -->
