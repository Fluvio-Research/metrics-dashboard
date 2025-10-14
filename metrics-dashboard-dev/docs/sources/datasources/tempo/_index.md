---
aliases:
  - ../data-sources/tempo/
  - ../features/datasources/tempo/
description: Guide for using Tempo in Metrics Dashboard
keywords:
  - metrics-dashboard
  - tempo
  - guide
  - tracing
labels:
  products:
    - cloud
    - enterprise
    - oss
menuTitle: Tempo
title: Tempo data source
weight: 1400
refs:
  data-source-management:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/data-source-management/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/data-source-management/
  build-dashboards:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/
  node-graph:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/visualizations/node-graph/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard-cloud/visualizations/panels-visualizations/visualizations/node-graph/
  configure-tempo-data-source:
    - pattern: /docs/metrics-dashboard/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/tempo/configure-tempo-data-source/#provision-the-data-source
    - pattern: /docs/metrics-dashboard-cloud/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard-cloud/connect-externally-hosted/data-sources/tempo/configure-tempo-data-source/
  exemplars:
    - pattern: /docs/metrics-dashboard/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/fundamentals/exemplars/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/fundamentals/exemplars/
  variable-syntax:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/variables/variable-syntax/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard-cloud/visualizations/dashboards/variables/variable-syntax/
  explore-trace-integration:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/trace-integration/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/trace-integration/
  configure-metrics-dashboard-feature-toggles:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#feature_toggles
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#feature_toggles
  provisioning-data-sources:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/provisioning/#data-sources
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/provisioning/#data-sources
  explore:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/
---

# Tempo data source

Metrics Dashboard ships with built-in support for [Tempo](https://metrics-dashboard.com/docs/tempo/<TEMPO_VERSION>/), a high-volume, minimal-dependency trace storage, open source tracing solution from Metrics Dashboard Labs.

To learn more about traces, refer to [Introduction to tracing](https://metrics-dashboard.com/docs/tempo/<TEMPO_VERSION>/introduction/).

To use traces, you need you have an application or service that is instrumented to emit traces.
Refer to the [Instrument for tracing](https://metrics-dashboard.com/docs/tempo/<TEMPO_VERSION>/getting-started/instrumentation/) for more information.

## Add a data source

For instructions on how to add a data source to Metrics Dashboard, refer to the [administration documentation](ref:data-source-management).
Only users with the organization administrator role can add data sources.
Administrators can also [configure the data source via YAML](ref:configure-tempo-data-source) with Metrics Dashboard's provisioning system.

This video explains how to add data sources, including Loki, Tempo, and Mimir, to Metrics Dashboard and Metrics Dashboard Cloud. Tempo data source set up starts at 4:58 in the video.

{{< youtube id="cqHO0oYW6Ic" start="298" >}}

## Learn more

After you've added the data source, you can [configure it](./configure-tempo-data-source/) so that your Metrics Dashboard instance's users can create queries in its [query editor](./query-editor/) when they [build dashboards](ref:build-dashboards) and use [Explore](ref:explore).

{{< section withDescriptions="true">}}
