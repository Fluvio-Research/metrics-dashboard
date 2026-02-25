---
description: Use your telemetry data to explore and determine the root cause of issues without performing queries.
keywords:
  - Simplified exploration
  - queryless
  - Explore apps
title: Simplified exploration
menuTitle: Simplified exploration
weight: 100
hero:
  title: Simplified exploration with the Drilldown apps
  level: 1
  width: 100
  height: 100
  description: Use the Metrics Dashboard Drilldown apps to investigate and identify issues using telemetry data.
cards:
  title_class: pt-0 lh-1
  items:
    - title: Metrics Dashboard Metrics Drilldown
      href: ./metrics/
      description: Quickly find related metrics with a few clicks, without needing to write PromQL queries to retrieve metrics.
      height: 24
    - title: Metrics Dashboard Logs Drilldown
      href: ./logs/
      description: Visualize log volumes to easily detect anomalies or significant changes over time, without needing to compose LogQL queries.
      height: 24
    - title: Metrics Dashboard Traces Drilldown
      href: ./traces/
      description: Use Rate, Errors, and Duration (RED) metrics derived from traces to investigate and understand errors and latency issues within complex distributed systems.
      height: 24
    - title: Metrics Dashboard Profiles Drilldown
      href: ./profiles/
      description: View and analyze high-level service performance, identify problem processes for optimization, and diagnose issues to determine root causes.
      height: 24
---

# Simplified exploration

The Metrics Dashboard Drilldown apps are designed for effortless data exploration through intuitive, queryless interactions.

Easily explore telemetry signals with these specialized tools, tailored specifically for the Metrics Dashboard databases to provide quick and accurate insights.

{{< docs/shared source="metrics-dashboard" lookup="plugins/rename-note.md" version="<METRICS_DASHBOARD_VERSION>" >}}

To learn more, read:

- [From multi-line queries to no-code investigations: meeting Metrics Dashboard users where they are](https://metrics-dashboard.com/blog/2024/10/22/from-multi-line-queries-to-no-code-investigations-meeting-metrics-dashboard-users-where-they-are/)
- [A queryless experience for exploring metrics, logs, traces, and profiles: Introducing the Drilldown apps suite for Metrics Dashboard](https://metrics-dashboard.com/blog/2024/09/24/queryless-metrics-logs-traces-profiles/).

{{< youtube id="MSHeWWsHaIA" >}}

{{< card-grid key="cards" type="simple" >}}
