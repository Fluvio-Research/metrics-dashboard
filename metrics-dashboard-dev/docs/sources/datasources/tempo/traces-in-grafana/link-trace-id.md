---
description: Link to trace IDs from logs and metrics
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
menuTitle: Link to a trace ID
title: Link to a trace ID
weight: 800
aliases:
  - ../link-trace-id/ # /docs/metrics-dashboard/latest/datasources/tempo/link-trace-id/

refs:
  configure-metrics-dashboard-feature-toggles:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#feature_toggles
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#feature_toggles
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
  exemplars:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/fundamentals/exemplars/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/fundamentals/exemplars/
  variable-syntax:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/variables/variable-syntax/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/variables/variable-syntax/
  explore-trace-integration:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/trace-integration/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/trace-integration/
  node-graph:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/visualizations/node-graph/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/visualizations/node-graph/
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
---

# Link to a trace ID

You can link to Tempo traces from logs or metrics.

## Link to a trace ID from logs

You can link to Tempo traces from logs in Loki, Elasticsearch, Splunk, and other logs data sources by configuring an internal link.

To configure this feature, refer to the [Derived fields](../../../loki#configure-derived-fields) section of the Loki data source docs or the [Data links](../../../elasticsearch#data-links) section of the Elasticsearch or Splunk data source docs.

## Link to a trace ID from metrics

You can link to Tempo traces from metrics in Prometheus data sources by configuring an exemplar.

To configure this feature, refer to the [Exemplars](ref:exemplars) documentation.
