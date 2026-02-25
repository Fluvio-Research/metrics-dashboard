---
aliases:
  - ../data-sources/postgres/
  - ../features/datasources/postgres/
description: Introduction to the PostgreSQL data source in Metrics Dashboard.
keywords:
  - metrics-dashboard
  - postgresql
  - guide
labels:
  products:
    - cloud
    - enterprise
    - oss
menuTitle: PostgreSQL
title: PostgreSQL data source
weight: 1200
refs:
  annotate-visualizations:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/annotate-visualizations/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/annotate-visualizations/
  configure-postgres-data-source:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/postgres/configure/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/postgres/configure/
  postgres-query-editor:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/postgres/query-editor/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/postgres/query-editor/
  alerting:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/
  transformations:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/query-transform-data/transform-data/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/panels-visualizations/query-transform-data/transform-data/
  visualizations:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/visualizations/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/panels-visualizations/visualizations/
---

# PostgreSQL data source

Metrics Dashboard includes a built-in PostgreSQL data source plugin, enabling you to query and visualize data from any PostgreSQL-compatible database. You don't need to install a plugin to add the PostgreSQL data source to your Metrics Dashboard instance.

Metrics Dashboard offers several configuration options for this data source as well as a visual and code-based query editor.

## Get started with the PostgreSQL data source

The following documents will help you get started with the PostgreSQL data source in Metrics Dashboard:

- [Configure the PostgreSQL data source](ref:configure-postgres-data-source)
- [PostgreSQL query editor](ref:postgres-query-editor)

After you have configured the data source you can:

- Create a variety of [visualizations](ref:visualizations)
- Add [annotations](ref:annotate-visualizations)
- Set up [alerting](ref:alerting)
- Add [transformations](ref:transformations)

View a PostgreSQL overview on Metrics Dashboard Play:

{{< docs/play title="PostgreSQL Overview" url="https://play.metrics-dashboard.org/d/ddvpgdhiwjvuod/postgresql-overview" >}}
