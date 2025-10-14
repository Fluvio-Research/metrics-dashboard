---
aliases:
  - ../data-sources/graphite/
  - ../features/datasources/graphite/
description: Introduction to the Graphite data source in Metrics Dashboard.
keywords:
  - metrics-dashboard
  - graphite
  - guide
labels:
  products:
    - cloud
    - enterprise
    - oss
menuTitle: Graphite
title: Graphite data source
weight: 600
refs:
  explore:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/
  provisioning-data-sources:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/provisioning/#data-sources
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/provisioning/#data-sources
  internal-metrics-dashboard-metrics:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/set-up-metrics-dashboard-monitoring/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/set-up-metrics-dashboard-monitoring/
  build-dashboards:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/
  configure-authentication:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/
  data-source-management:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/data-source-management/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/data-source-management/
  transformations:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/query-transform-data/transform-data/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/panels-visualizations/query-transform-data/transform-data/
  alerting:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/
  visualizations:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/visualizations/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/panels-visualizations/visualizations/
  variables:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/variables/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/variables/
  annotate-visualizations:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/annotate-visualizations/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/build-dashboards/annotate-visualizations/
  set-up-metrics-dashboard-monitoring:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/set-up-metrics-dashboard-monitoring/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/set-up-metrics-dashboard-monitoring/
---

# Graphite data source

Metrics Dashboard includes built-in support for Graphite.
This topic explains options, variables, querying, and other features specific to the Graphite data source, which include its feature-rich query editor.

For instructions on how to add a data source to Metrics Dashboard, refer to the [administration documentation](ref:data-source-management).

Once you've added the Graphite data source, you can [configure it](#configure-the-data-source) so that your Metrics Dashboard instance's users can create queries in its [query editor](query-editor/) when they [build dashboards](ref:build-dashboards) and use [Explore](ref:explore).

{{< docs/play title="Graphite: Sample Website Dashboard" url="https://play.metrics-dashboard.org/d/000000003/" >}}

Metrics Dashboard exposes metrics for Graphite on the `/metrics` endpoint.
For detailed instructions, refer to [Internal Metrics Dashboard metrics](ref:internal-metrics-dashboard-metrics).

## Get Metrics Dashboard metrics into Graphite

Metrics Dashboard exposes metrics for Graphite on the `/metrics` endpoint.
Refer to [Internal Metrics Dashboard metrics](ref:set-up-metrics-dashboard-monitoring) for more information.

## Graphite and Loki integration

When you change the data source selection in [Explore](ref:explore), Graphite queries are converted to Loki queries.
Metrics Dashboard extracts Loki label names and values from the Graphite queries according to mappings provided in the Graphite data source configuration. Metrics Dashboard automatically transforms queries using tags with `seriesByTags()` without requiring additional setup.

## Get the most out of the data source

After installing and configuring the Graphite data source you can:

- Create a wide variety of [visualizations](ref:visualizations)
- Configure and use [templates and variables](ref:variables)
- Add [transformations](ref:transformations)
- Add [annotations](ref:annotate-visualizations)
- Set up [alerting](ref:alerting)
