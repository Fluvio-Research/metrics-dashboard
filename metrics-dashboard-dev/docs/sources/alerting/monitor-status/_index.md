---
aliases:
  - ./manage-notifications/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/manage-notifications/
canonical: https://metrics-dashboard.com/docs/metrics-dashboard/latest/alerting/monitor-status/
description: Detect and respond for day-to-day triage and analysis of what’s going on and action you need to take
keywords:
  - metrics-dashboard
  - detect
  - respond
labels:
  products:
    - cloud
    - enterprise
    - oss
title: Monitor alerts
weight: 130
refs:
  configure-alert-rules:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/
  configure-notifications:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/configure-notifications/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/configure-notifications/
---

# Monitor alerts

Alerts and alert notifications should provide key information to help alert responders and incident participants understand what happened in their system and how to respond.

Metrics Dashboard Alerting offers the ability to monitor your alerts and manage your alerting setup. You can get an overview of your alerts, track the history of alert states, and monitor notification statuses. These can help you start investigating alert issues within Metrics Dashboard and improve the reliability of your alerting implementation.

{{< figure src="/media/docs/alerting/alert-history-page.png" max-width="750px" alt="History page in Metrics Dashboard Alerting" >}}

The previous sections explain how to [configure alert rules](ref:configure-alert-rules) and [configure notifications](ref:configure-notifications) to generate alerts and send their notifications.

This section focuses on finding and understanding the state of your alert rules, alert instances, and their notifications. For more details, refer to:

{{< section >}}
