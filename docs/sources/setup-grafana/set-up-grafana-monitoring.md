---
aliases:
  - ../admin/metrics/
  - ../administration/jaeger-instrumentation/
  - ../administration/view-server/internal-metrics/
description: Jaeger traces emitted and propagation by Metrics Dashboard
keywords:
  - metrics-dashboard
  - jaeger
  - tracing
labels:
  products:
    - enterprise
    - oss
title: Set up Metrics Dashboard monitoring
weight: 800
---

# Set up Metrics Dashboard monitoring

Metrics Dashboard supports tracing.

Metrics Dashboard can emit Jaeger or OpenTelemetry Protocol (OTLP) traces for its HTTP API endpoints and propagate Jaeger and [w3c Trace Context](https://www.w3.org/TR/trace-context/) trace information to compatible data sources.
All HTTP endpoints are logged evenly (annotations, dashboard, tags, and so on).
When a trace ID is propagated, it is reported with operation 'HTTP /datasources/proxy/:id/\*'.

Refer to [Configuration's OpenTelemetry section](../configure-metrics-dashboard/#tracingopentelemetry) for a reference of tracing options available in Metrics Dashboard.

## View Metrics Dashboard internal metrics

Metrics Dashboard collects some metrics about itself internally. Metrics Dashboard supports pushing metrics to Graphite or exposing them to be scraped by Prometheus.

For more information about configuration options related to Metrics Dashboard metrics, refer to [metrics](../configure-metrics-dashboard/#metrics) and [metrics.graphite](../configure-metrics-dashboard/#metricsgraphite) in [Configuration](../configure-metrics-dashboard/).

### Available metrics

When enabled, Metrics Dashboard exposes a number of metrics, including:

- Active Metrics Dashboard instances
- Number of dashboards, users, and playlists
- HTTP status codes
- Requests by routing group
- Metrics Dashboard active alerts
- Metrics Dashboard performance

### Pull metrics from Metrics Dashboard into Prometheus

These instructions assume you have already added Prometheus as a data source in Metrics Dashboard.

1. Enable Prometheus to scrape metrics from Metrics Dashboard. In your configuration file (`metrics-dashboard.ini` or `custom.ini` depending on your operating system) remove the semicolon to enable the following configuration options:

   ```
   # Metrics available at HTTP URL /metrics and /metrics/plugins/:pluginId
   [metrics]
   # Disable / Enable internal metrics
   enabled           = true

   # Disable total stats (stat_totals_*) metrics to be generated
   disable_total_stats = false
   ```

1. (optional) If you want to require authorization to view the metrics endpoints, then uncomment and set the following options:

   ```
   basic_auth_username =
   basic_auth_password =
   ```

1. Restart Metrics Dashboard. Metrics Dashboard now exposes metrics at http://localhost:3000/metrics.
1. Add the job to your prometheus.yml file.
   Example:

   ```
   - job_name: 'metrics-dashboard_metrics'

     scrape_interval: 15s
     scrape_timeout: 5s

     static_configs:
       - targets: ['localhost:3000']
   ```

1. Restart Prometheus. Your new job should appear on the Targets tab.
1. In Metrics Dashboard, click **Connections** in the left-side menu.
1. Under your connections, click **Data Sources**.
1. Select the **Prometheus** data source.
1. Under the name of your data source, click **Dashboards**.
1. On the Dashboards tab, click **Import** in the _Metrics Dashboard metrics_ row to import the Metrics Dashboard metrics dashboard. All scraped Metrics Dashboard metrics are available in the dashboard.

### View Metrics Dashboard metrics in Graphite

These instructions assume you have already added Graphite as a data source in Metrics Dashboard.

1. Enable sending metrics to Graphite. In your configuration file (`metrics-dashboard.ini` or `custom.ini` depending on your operating system) remove the semicolon to enable the following configuration options:

   ```
   # Metrics available at HTTP API Url /metrics
   [metrics]
   # Disable / Enable internal metrics
   enabled           = true

   # Disable total stats (stat_totals_*) metrics to be generated
   disable_total_stats = false
   ```

1. Enable [metrics.graphite] options:

   ```
   # Send internal metrics to Graphite
   [metrics.graphite]
   # Enable by setting the address setting (ex localhost:2003)
   address = <hostname or ip>:<port#>
   prefix = prod.metrics-dashboard.%(instance_name)s.
   ```

1. Restart Metrics Dashboard. Metrics Dashboard now exposes metrics at http://localhost:3000/metrics and sends them to the Graphite location you specified.

### Pull metrics from Metrics Dashboard backend plugin into Prometheus

Any installed [backend plugin](https://metrics-dashboard.com/developers/plugin-tools/key-concepts/backend-plugins/) exposes a metrics endpoint through Metrics Dashboard that you can configure Prometheus to scrape.

These instructions assume you have already added Prometheus as a data source in Metrics Dashboard.

1. Enable Prometheus to scrape backend plugin metrics from Metrics Dashboard. In your configuration file (`metrics-dashboard.ini` or `custom.ini` depending on your operating system) remove the semicolon to enable the following configuration options:

   ```
   # Metrics available at HTTP URL /metrics and /metrics/plugins/:pluginId
   [metrics]
   # Disable / Enable internal metrics
   enabled           = true

   # Disable total stats (stat_totals_*) metrics to be generated
   disable_total_stats = false
   ```

1. (optional) If you want to require authorization to view the metrics endpoints, then uncomment and set the following options:

   ```
   basic_auth_username =
   basic_auth_password =
   ```

1. Restart Metrics Dashboard. Metrics Dashboard now exposes metrics at `http://localhost:3000/metrics/plugins/<plugin id>`, e.g. http://localhost:3000/metrics/plugins/metrics-dashboard-github-datasource if you have the [Metrics Dashboard GitHub datasource](/metrics-dashboard/plugins/metrics-dashboard-github-datasource/) installed.
1. Add the job to your prometheus.yml file.
   Example:

   ```
   - job_name: 'metrics-dashboard_github_datasource'

     scrape_interval: 15s
     scrape_timeout: 5s
     metrics_path: /metrics/plugins/metrics-dashboard-test-datasource

     static_configs:
       - targets: ['localhost:3000']
   ```

1. Restart Prometheus. Your new job should appear on the Targets tab.
1. In Metrics Dashboard, hover your mouse over the **Configuration** (gear) icon on the left sidebar and then click **Data Sources**.
1. Select the **Prometheus** data source.
1. Import a Golang application metrics dashboard - for example [Go Processes](/metrics-dashboard/dashboards/6671).
