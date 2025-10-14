---
aliases:
  - ../fundamentals/alert-rules/recording-rules/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/fundamentals/alert-rules/recording-rules/
  - ../unified-alerting/alerting-rules/create-cortex-loki-managed-recording-rule/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/unified-alerting/alerting-rules/create-cortex-loki-managed-recording-rule/
  - ../unified-alerting/alerting-rules/create-mimir-loki-managed-recording-rule/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/unified-alerting/alerting-rules/create-mimir-loki-managed-recording-rule/
  - ../alerting-rules/create-mimir-loki-managed-recording-rule/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/create-mimir-loki-managed-recording-rule/
canonical: https://metrics-dashboard.com/docs/metrics-dashboard/latest/alerting/alerting-rules/create-recording-rules/
description: Recording rules allow you to pre-compute frequently needed or computationally expensive expressions and save the results as a new set of time series. Querying precomputed results is faster and can reduce system load.
keywords:
  - metrics-dashboard
  - alerting
  - guide
  - rules
  - recording rules
  - configure
labels:
  products:
    - cloud
    - enterprise
    - oss
title: Create recording rules
weight: 400
refs:
  metrics-dashboard-managed-recording-rules:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/create-recording-rules/create-metrics-dashboard-managed-recording-rules/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/create-recording-rules/create-metrics-dashboard-managed-recording-rules/
  data-source-managed-recording-rules:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/create-recording-rules/create-data-source-managed-recording-rules/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/create-recording-rules/create-data-source-managed-recording-rules/
---

# Configure recording rules

Recording rules allows you to periodically pre-compute frequently used or computationally expensive queries, saving the results as a new time series metric.

For instance, you can create a recording rule generating a new metric, `error_9001_count`, which counts occurrences of a specific log error within one minute. Then, query the `error_9001_count` metric in dashboards and alert rules.

Recording rules can be helpful in various scenarios, such as:

- **Faster queries** are needed: Performing heavy aggregations or querying large data sets is quicker with precomputed results than real-time queries.
- **Reducing system load:** Precomputing specific queries in advance can reduce system overload caused by multiple simultaneous queries.
- **Simplifying complex aggregations:** Create a new metric from complex aggregations to facilitate alert and dashboard setup.
- **Reusing queries across alerts:** Improve efficiency by reusing the same query across similar alert rules and dashboards.

The evaluation group of the recording rule determines how often the metric is pre-computed.

Similar to alert rules, Metrics Dashboard supports two types of recording rules:

1. [Metrics Dashboard-managed recording rules](ref:metrics-dashboard-managed-recording-rules), which can query any Metrics Dashboard data source supported by alerting. It's the recommended option.
2. [Data source-managed recording rules](ref:data-source-managed-recording-rules), which can query Prometheus-based data sources like Mimir or Loki.
