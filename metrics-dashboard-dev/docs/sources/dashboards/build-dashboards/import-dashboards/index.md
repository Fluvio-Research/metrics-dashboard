---
aliases:
  - ../../reference/export_import/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/reference/export_import/
  - ../export-import/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/export-import/
canonical: https://metrics-dashboard.com/docs/metrics-dashboard/latest/dashboards/build-dashboards/import-dashboards/
keywords:
  - metrics-dashboard
  - dashboard
  - import
labels:
  products:
    - cloud
    - enterprise
    - oss
menuTitle: Import dashboards
title: Import dashboards
description: Learn how to import dashboards and about Metrics Dashboard's preconfigured dashboards
weight: 5
refs:
  share-dashboards-and-panels:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/share-dashboards-panels/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/share-dashboards-panels/
  http-api:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/developers/http_api/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/developer-resources/api-reference/http-api/
---

# Import dashboards

You can import preconfigured dashboards into your Metrics Dashboard instance or Cloud stack using the UI or the [HTTP API](ref:http-api).

## Import a dashboard

To import a dashboard, follow these steps:

1. Click **Dashboards** in the primary menu.
1. Click **New** and select **Import** in the drop-down menu.
1. Perform one of the following steps:
   - Upload a dashboard JSON file.
   - Paste a [metrics-dashboard.com dashboard](#discover-dashboards-on-metrics-dashboardcom) URL or ID into the field provided.
   - Paste dashboard JSON text directly into the text area.

1. (Optional) Change the dashboard name, folder, or UID, and specify metric prefixes, if the dashboard uses any.
1. Select a data source, if required.
1. Click **Import**.

## Discover dashboards on metrics-dashboard.com

The [Dashboards page](https://metrics-dashboard.com/metrics-dashboard/dashboards/) on metrics-dashboard.com provides you with dashboards for common server applications. Browse our library of official and community-built dashboards and import them to quickly get up and running.

{{< figure src="/media/docs/metrics-dashboard/dashboards/screenshot-gcom-dashboards.png" alt="Preconfigured dashboards on metrics-dashboard.com">}}

You can also add to this library by exporting one of your own dashboards. For more information, refer to [Share dashboards and panels](ref:share-dashboards-and-panels).

## More examples

Your Metrics Dashboard Cloud stack comes with several default dashboards in the **Metrics Dashboard Cloud** folder in **Dashboards**. If you're running your own installation of Metrics Dashboard, you can find more example dashboards in the `public/dashboards/` directory.
