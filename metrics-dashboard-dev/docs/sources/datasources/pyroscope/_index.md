---
aliases:
  - ../features/datasources/phlare/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/features/datasources/phlare/
  - ../features/datasources/metrics-dashboard-pyroscope/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/features/datasources/metrics-dashboard-pyroscope/
  - ../datasources/metrics-dashboard-pyroscope/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/metrics-dashboard-pyroscope/
description: Horizontally-scalable, highly-available, multi-tenant continuous profiling
  aggregation system. OSS profiling solution from Metrics Dashboard Labs.
keywords:
  - phlare
  - guide
  - profiling
  - pyroscope
labels:
  products:
    - cloud
    - enterprise
    - oss
title: Pyroscope
weight: 1350
refs:
  flame-graph:
    - pattern: /docs/metrics-dashboard/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/visualizations/flame-graph/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard-cloud/visualizations/panels-visualizations/visualizations/flame-graph/
  configure-tempo-data-source:
    - pattern: /docs/metrics-dashboard/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/tempo/configure-tempo-data-source/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard-cloud/connect-externally-hosted/data-sources/tempo/configure-tempo-data-source/
  explore:
    - pattern: /docs/metrics-dashboard/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/
  provisioning-data-sources:
    - pattern: /docs/metrics-dashboard/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/provisioning/#datasources
    - pattern: /docs/metrics-dashboard-cloud/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/provisioning/#datasources
  flame-graph-panel:
    - pattern: /docs/metrics-dashboard/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/visualizations/flame-graph/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: https://metrics-dashboard.com/docs/metrics-dashboard-cloud/visualizations/panels-visualizations/visualizations/flame-graph/
---

# Metrics Dashboard Pyroscope data source

Metrics Dashboard Pyroscope is a horizontally scalable, highly available, multi-tenant, OSS, continuous profiling aggregation system.
Add a Pyroscope data source to query your profiles in [Explore](ref:explore).

Refer to [Introduction to Pyroscope](https://metrics-dashboard.com/docs/pyroscope/<PYROSCOPE_VERSION>/introduction/) to understand profiling and Pyroscope.

To use profiling data, you should:

- [Configure your application to send profiles](/docs/pyroscope/<PYROSCOPE_VERSION>/configure-client/)
- [Configure the Metrics Dashboard Pyroscope data source](./configure-pyroscope-data-source/).
- [View and query profiling data using Profiles Drilldown or the query editor ](./query-profile-data/)

## Continuous profiling

While code profiling has been a long-standing practice, continuous profiling represents a modern and more advanced approach to performance monitoring.

This technique adds two critical dimensions to traditional profiles:

Time
: Profiling data is collected _continuously_, providing a time-centric view that allows querying performance data from any point in the past.

Metadata
: Profiles are enriched with metadata, adding contextual depth to the performance data.

These dimensions, coupled with the detailed nature of performance profiles, make continuous profiling a uniquely valuable tool.

### Flame graphs

<!-- vale Metrics Dashboard.We = NO -->

Flame graphs help you visualize resource allocation and performance bottlenecks, and you even get suggested recommendations and performance fixes via AI-driven flame graph analysis, as well as line-level insights from our GitHub integration.

<!-- vale Metrics Dashboard.We = YES -->

On views with a flame graph, you can use **Explain flame graph** to provide an AI flame graph analysis that explains the performance bottleneck, root cause, and recommended fix.
For more information, refer to [Flame graph AI](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/monitor-applications/profiles/flamegraph-ai/).

## Integrate profiles into dashboards

Using the Pyroscope data source, you can integrate profiles into your dashboards.
For example, you can embed flame graphs using the [flame graph panel](ref:flame-graph-panel).

In this case, the screenshot shows memory profiles alongside panels for logs and metrics to be able to debug out of memory (OOM) errors alongside the associated logs and metrics.

![dashboard](https://metrics-dashboard.com/static/img/pyroscope/metrics-dashboard-pyroscope-dashboard-2023-11-30.png)

## Visualize traces and profiles data using Traces to profiles

You can link profile and tracing data using your Pyroscope data source with the Tempo data source.
To learn more about how profiles and tracing can work together, refer to [Profiling and tracing synergies](./profiling-and-tracing/).

Combined traces and profiles let you see granular line-level detail when available for a trace span. This allows you pinpoint the exact function that's causing a bottleneck in your application as well as a specific request.

![trace-profiler-view](https://metrics-dashboard.com/static/img/pyroscope/pyroscope-trace-profiler-view-2023-11-30.png)

For more information, refer to the [Traces to profile section](ref:configure-tempo-data-source) and [Link tracing and profiling with span profiles](https://metrics-dashboard.com/docs/pyroscope/<PYROSCOPE_VERSION>/configure-client/trace-span-profiles/).

{{< youtube id="AG8VzfFMLxo" >}}

## Provision the Pyroscope data source

You can modify the Metrics Dashboard configuration files to provision the Pyroscope data source.
To learn more, and to view the available provisioning settings, refer to [provisioning documentation](ref:provisioning-data-sources).

Here is an example configuration:

```yaml
apiVersion: 1

datasources:
  - name: Metrics Dashboard Pyroscope
    type: metrics-dashboard-pyroscope-datasource
    url: http://localhost:4040
    jsonData:
      minStep: '15s'
```
