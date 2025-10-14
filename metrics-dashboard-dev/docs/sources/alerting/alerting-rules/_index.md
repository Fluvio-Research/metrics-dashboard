---
aliases:
  - rules/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/rules/
  - unified-alerting/alerting-rules/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/unified-alerting/alerting-rules/
  - ./create-alerts/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/create-alerts/
canonical: https://metrics-dashboard.com/docs/metrics-dashboard/latest/alerting/alerting-rules/
description: Configure alert rules
labels:
  products:
    - cloud
    - enterprise
    - oss
title: Configure alert rules
weight: 120
refs:
  alert-rules:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/fundamentals/alert-rules/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/fundamentals/alert-rules/
  configure-metrics-dashboard-alerts:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/create-metrics-dashboard-managed-rule/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/create-metrics-dashboard-managed-rule/
  configure-ds-alerts:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/create-data-source-managed-rule/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/create-data-source-managed-rule/
  recording-rules:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/create-recording-rules/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/create-recording-rules/
  import-to-metrics-dashboard-managed:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/alerting-migration/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/alerting-migration/
  comparison-ds-metrics-dashboard-rules:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/create-data-source-managed-rule/#comparison-with-metrics-dashboard-managed-rules
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/create-data-source-managed-rule/#comparison-with-metrics-dashboard-managed-rules
---

# Configure alert rules

[Alert rules](ref:alert-rules) are the central component of your alerting system.

An alert rule consists of one or more queries and expressions that select the data you want to measure. It contains a condition to trigger the alert, an evaluation period that determines how often the rule is evaluated, and additional options to manage alert events and their notifications.

Metrics Dashboard supports two types of alert rules:

1. **Metrics Dashboard-managed alert rules** — the recommended option. They can query backend data sources—including Prometheus-based ones—and offer a [richer feature set](ref:comparison-ds-metrics-dashboard-rules).
1. **Data source-managed alert rules** — supported for Prometheus-based data sources (such as Mimir, Loki, and Prometheus), with rules stored in the data source itself.

   You can [convert and import data source-managed rules into Metrics Dashboard-managed rules](ref:import-to-metrics-dashboard-managed) to let Metrics Dashboard Alerting manage them.

Both types of alert rules can be configured in Metrics Dashboard using the **+ New alert rule** flow. For step-by-step instructions, refer to:

- [Configure Metrics Dashboard-managed alert rules](ref:configure-metrics-dashboard-alerts)
- [Configure data source-managed alert rules](ref:configure-ds-alerts)

In Metrics Dashboard Alerting, you can also [configure recording rules](ref:recording-rules), which pre-compute queries and save the results as new time series metrics for use in other alert rules or dashboard queries.
