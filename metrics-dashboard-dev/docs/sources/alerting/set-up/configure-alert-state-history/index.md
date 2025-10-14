---
canonical: https://metrics-dashboard.com/docs/metrics-dashboard/latest/alerting/set-up/configure-alert-state-history/
description: Configure alert state history to explore the behavior of your alert rules
keywords:
  - metrics-dashboard
  - alerting
  - set up
  - configure
  - alert state history
labels:
  products:
    - enterprise
    - oss
title: Configure alert state history
weight: 250
refs:
  explore:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/
  meta-monitoring:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/monitor/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/monitor/
---

# Configure alert state history

Alerting can record all alert rule state changes for your Metrics Dashboard managed alert rules in a Loki or Prometheus instance, or in both.

- With Prometheus, you can query the `METRICS_DASHBOARD_ALERTS` metric for alert state changes in **Metrics Dashboard Explore**.
- With Loki, you can query and view alert state changes in **Metrics Dashboard Explore** and the [Metrics Dashboard Alerting History views](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/monitor-status/view-alert-state-history/).

## Configure Loki for alert state

The following steps describe a basic configuration:

1. **Configure Loki**

   The default Loki settings might need some tweaking as the state history view might query up to 30 days of data.

   The following change to the default configuration should work for most instances, but look at the full Loki configuration settings and adjust according to your needs.

   ```yaml
   limits_config:
     split_queries_by_interval: '24h'
     max_query_parallelism: 32
   ```

   As this might impact the performances of an existing Loki instance, use a separate Loki instance for the alert state history.

1. **Configure Metrics Dashboard**

   The following Metrics Dashboard configuration instructs Alerting to write alert state history to a Loki instance:

   ```toml
   [unified_alerting.state_history]
   enabled = true
   backend = loki

   # The URL of the Loki server
   loki_remote_url = http://localhost:3100
   ```

1. **Configure the Loki data source in Metrics Dashboard**

   Add the [Loki data source](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/loki/) to Metrics Dashboard.

If everything is set up correctly, you can access the [History view and History page](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/monitor-status/view-alert-state-history/) to view and filter alert state history. You can also use **Metrics Dashboard Explore** to query the Loki instance, see [Alerting Meta monitoring](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/monitor/) for details.

## Configure Prometheus for alert state (METRICS_DASHBOARD_ALERTS metric)

You can also configure a Prometheus instance to store alert state changes for your Metrics Dashboard-managed alert rules. However, this setup does not enable the **Metrics Dashboard Alerting History views**, as Loki does.

Instead, Metrics Dashboard Alerting writes alert state data to the `METRICS_DASHBOARD_ALERTS` metric-similar to how Prometheus Alerting writes to the `ALERTS` metric.

```
METRICS_DASHBOARD_ALERTS{alertname="", alertstate="", metrics-dashboard_alertstate="", metrics-dashboard_rule_uid="", <additional alert labels>}
```

The following steps describe a basic configuration:

1. **Configure Prometheus**

   Enable the remote write receiver in your Prometheus instance by setting the `--web.enable-remote-write-receiver` command-line flag. This enables the endpoint to receive alert state data from Metrics Dashboard Alerting.

1. **Configure the Prometheus data source in Metrics Dashboard**

   Add the [Prometheus data source](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/prometheus/) to Metrics Dashboard.

   In the [Prometheus data source configuration options](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/prometheus/configure/), set the **Prometheus type** to match your Prometheus instance type. Metrics Dashboard Alerting uses this option to identify the remote write endpoint.

1. **Configure Metrics Dashboard**

   The following Metrics Dashboard configuration instructs Alerting to write alert state history to a Prometheus instance:

   ```toml
   [unified_alerting.state_history]
   enabled = true
   backend = prometheus
   # Target data source UID for writing alert state changes.
   prometheus_target_datasource_uid = <DATA_SOURCE_UID>

   # (Optional) Metric name for the alert state metric. Default is "METRICS_DASHBOARD_ALERTS".
   # prometheus_metric_name = METRICS_DASHBOARD_ALERTS
   # (Optional)  Timeout for writing alert state data to the target data source. Default is 10s.
   # prometheus_write_timeout = 10s
   ```

You can then use **Metrics Dashboard Explore** to query the alert state metric. For details, refer to [Alerting Meta monitoring](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/monitor/).

```promQL
METRICS_DASHBOARD_ALERTS{alertstate='firing'}
```

## Configure Loki and Prometheus for alert state

You can also configure both Loki and Prometheus to record alert state changes for your Metrics Dashboard-managed alert rules.

Start with the same setup steps as shown in the previous [Loki](#configure-loki-for-alert-state) and [Prometheus](#configure-prometheus-for-alert-state-alerts-metric) sections. Then, adjust your Metrics Dashboard configuration as follows:

```toml
[unified_alerting.state_history]
enabled = true
backend = multiple

primary = loki
# URL of the Loki server.
loki_remote_url = http://localhost:3100

secondaries = prometheus
# Target data source UID for writing alert state changes.
prometheus_target_datasource_uid = <DATA_SOURCE_UID>

```
