---
aliases:
  - /docs/metrics-dashboard/v1.1/
  - /docs/metrics-dashboard/v3.1/
  - guides/reference/admin/
cascade:
  LOKI_VERSION: latest
  TEMPO_VERSION: latest
  ONCALL_VERSION: latest
  PYROSCOPE_VERSION: latest
description: Find answers to your technical questions and learn how to use Metrics Dashboard OSS and Enterprise products.
keywords:
  - metrics-dashboard
  - get started
  - documentation
labels:
  products:
    - enterprise
    - oss
menuTitle: Metrics Dashboard documentation
title: Metrics Dashboard OSS and Enterprise
hero:
  title: Metrics Dashboard OSS and Enterprise
  level: 1
  width: 100
  image: /media/docs/metrics-dashboard-cloud/infrastructure/metrics-dashboardlogo.svg
  height: 100
  description: Query, visualize, alert on, and explore your metrics, logs, and traces wherever they are stored.
cards:
  title_class: pt-0 lh-1
  items:
    - title: What's new
      href: ./whatsnew/
      description: Browse release highlights, deprecations, and breaking changes in Metrics Dashboard releases.
      height: 24
    - title: Introduction
      href: ./fundamentals/
      description: Learn about observability topics in general and some of the products included in Metrics Dashboard.
      height: 24
    - title: Set up
      href: ./setup-metrics-dashboard/
      description: Get up and running with Metrics Dashboard.
      height: 24
    - title: Data sources
      href: ./datasources/
      description: Manage data sources and how to configure or query the built-in data sources.
      height: 24
    - title: Dashboards
      href: ./dashboards/
      description: Query, transform, visualize, and understand your data no matter where it's stored.
      height: 24
    - title: Panels and Visualizations
      href: ./panels-visualizations/
      description: Easily collect, correlate, and visualize data to make informed decisions in real-time.
      height: 24
    - title: Explore
      href: ./explore/
      description: Explore your data using a query instead of creating a dashboard.
      height: 24
    - title: Alerting
      href: ./alerting/
      description: Learn about problems in your systems moments after they occur.
      height: 24
    - title: Administration
      href: ./administration/
      description: Perform administrative tasks such as configuring user management and roles and permissions.
      height: 24
    - title: Troubleshooting
      href: ./troubleshooting/
      description: Troubleshoot common Metrics Dashboard issues.
      height: 24
    - title: Upgrade
      href: ./upgrade-guide/
      description: Upgrade Metrics Dashboard to stay current with the latest fixes and enhancements.
      height: 24
---

{{< docs/hero-simple key="hero" >}}

---

## Overview

_Metrics Dashboard Open Source Software (OSS)_ enables you to query, visualize, alert on, and explore your metrics, logs, and traces wherever they're stored. Metrics Dashboard data source plugins enable you to query data sources including time series databases like Prometheus and CloudWatch, logging tools like Loki and Elasticsearch, NoSQL/SQL databases like Postgres, CI/CD tooling like GitHub, and many more. Metrics Dashboard OSS provides you with tools to display that data on live dashboards with insightful graphs and visualizations.

_Metrics Dashboard Enterprise_ is a commercial edition of Metrics Dashboard that includes exclusive data source plugins and additional features not found in the open source version. You also get 24x7x365 support and training from the core Metrics Dashboard team.
To learn more about these features, refer to [Enterprise features](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/introduction/metrics-dashboard-enterprise/#enterprise-features-in-metrics-dashboard-cloud).

## Guidance and help

{{< guide name="whichmetrics-dashboard" title="Which Metrics Dashboard is right for you?" text="Answer a few questions and Grot will help you decide." >}}

## Learn

{{< card-grid key="cards" type="simple" >}}
