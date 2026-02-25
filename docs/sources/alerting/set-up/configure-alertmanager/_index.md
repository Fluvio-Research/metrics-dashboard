---
aliases:
  - ../../configure-alertmanager/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/configure-alertmanager/
  - ../unified-alerting/fundamentals/alertmanager/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/unified-alerting/fundamentals/alertmanager/
  - ../manage-notifications/alertmanager/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/manage-notifications/alertmanager/
  - ../fundamentals/alertmanager/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/fundamentals/alertmanager/
  - ../fundamentals/notifications/alertmanager/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/fundamentals/notifications/alertmanager
canonical: https://metrics-dashboard.com/docs/metrics-dashboard/latest/alerting/set-up/configure-alertmanager/
description: Learn about Alertmanagers and set up Alerting to use other Alertmanagers
keywords:
  - metrics-dashboard
  - alerting
  - set up
  - configure
  - external Alertmanager
labels:
  products:
    - cloud
    - enterprise
    - oss
title: Configure Alertmanagers
weight: 200
refs:
  configure-metrics-dashboard-alerts-notifications:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/alerting-rules/create-metrics-dashboard-managed-rule/#configure-notifications
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/create-metrics-dashboard-managed-rule/#configure-notifications
  configure-notification-policies:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/configure-notifications/create-notification-policy/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/configure-notifications/create-notification-policy/
  alertmanager-contact-point:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/configure-notifications/manage-contact-points/integrations/configure-alertmanager/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/configure-notifications/manage-contact-points/integrations/configure-alertmanager/
  alertmanager-data-source:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/alertmanager/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/connect-externally-hosted/data-sources/alertmanager/
  notifications:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/fundamentals/notifications/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/fundamentals/notifications/
---

# Configure Alertmanagers

Metrics Dashboard Alerting is based on the architecture of the Prometheus alerting system. Metrics Dashboard sends firing and resolved alerts to an Alertmanager, which is responsible for [handling notifications](ref:notifications). This architecture decouples alert rule evaluation from notification handling, improving scalability.

{{< figure src="/media/docs/alerting/alerting-alertmanager-architecture.png" max-width="750px" alt="A diagram with the alert generator and alert manager architecture" >}}

Metrics Dashboard includes a built-in **Metrics Dashboard Alertmanager** to handle notifications. This guide shows you how to:

- Use different [types of Alertmanagers](#types-of-alertmanagers-in-metrics-dashboard) with Metrics Dashboard
- [Add other Alertmanager](#add-an-alertmanager) and [enable it to receive all Metrics Dashboard-managed alerts](#enable-an-alertmanager-to-receive-metrics-dashboard-managed-alerts)
- Use an [Alertmanager as a contact point]() to route specific alerts

## Alertmanager resources

It’s important to note that each Alertmanager manages its own independent alerting resources, such as:

- Contact points and notification templates
- Notification policies and mute timings
- Silences
- Active notifications

Use the `Choose Alertmanager` dropdown on these pages to switch between Alertmanagers and view or manage their resources.

{{< figure src="/media/docs/alerting/alerting-choose-alertmanager.png" max-width="750px" alt="A screenshot choosing an Alertmanager in the notification policies UI" >}}

## Types of Alertmanagers in Metrics Dashboard

Metrics Dashboard can be configured to handle alert notifications using various Alertmanagers.

- **Metrics Dashboard Alertmanager**: Metrics Dashboard includes a built-in Alertmanager that extends the [Prometheus Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/). This is the default Alertmanager and is referred to as "Metrics Dashboard" in the user interface. It can only handle Metrics Dashboard-managed alerts.

- **Cloud Alertmanager**: Each Metrics Dashboard Cloud instance comes preconfigured with an additional Alertmanager (`metrics-dashboardcloud-STACK_NAME-ngalertmanager`) from the Mimir (Prometheus) instance running in the Metrics Dashboard Cloud Stack.

  The Cloud Alertmanager is available exclusively in Metrics Dashboard Cloud and can handle both Metrics Dashboard-managed and data source-managed alerts.

- **Other Alertmanagers**: Metrics Dashboard Alerting also supports sending alerts to other Alertmanagers, such as the [Prometheus Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/), which can handle both Metrics Dashboard-managed and data source-managed alerts.

Metrics Dashboard Alerting supports using a combination of Alertmanagers and can [enable other Alertmanagers to receive Metrics Dashboard-managed alerts](#enable-an-alertmanager-to-receive-metrics-dashboard-managed-alerts). The decision often depends on your alerting setup and where your alerts are generated.

For example, if you already have an Alertmanager running in your on-premises or cloud infrastructure to handle Prometheus alerts, you can forward Metrics Dashboard-managed alerts to the same Alertmanager for unified notification handling.

## Add an Alertmanager

Alertmanagers should be configured as data sources using Metrics Dashboard Configuration from the main Metrics Dashboard navigation menu. To add an Alertmanager, complete the following steps.

{{< docs/shared lookup="alerts/add-alertmanager-ds.md" source="metrics-dashboard" version="<METRICS_DASHBOARD_VERSION>" >}}

For provisioning instructions, refer to the [Alertmanager data source documentation](ref:alertmanager-data-source).

After adding an Alertmanager, you can use the Metrics Dashboard Alerting UI to manage notification policies, contact points, silences, and other alerting resources from within Metrics Dashboard.

{{< admonition type="note" >}}
When using Prometheus, you can manage silences in the Metrics Dashboard Alerting UI. However, other Alertmanager resources such as contact points, notification policies, and templates are read-only because the Prometheus Alertmanager HTTP API does not support updates for these resources.
{{< /admonition >}}

When using multiple Alertmanagers, use the `Choose Alertmanager` dropdown to switch between Alertmanagers.

## Enable an Alertmanager to receive Metrics Dashboard-managed alerts

After enabling **Receive Metrics Dashboard Alerts** in the Data Source Settings, you must also configure the Alertmanager in the Alerting Settings page. Metrics Dashboard supports enabling one or multiple Alertmanagers to receive all generated Metrics Dashboard-managed alerts.

1. In the left-side menu, click **Alerts & IRM** and then **Alerting**.
1. Click **Settings** to view the list of configured Alertmanagers.
1. For the selected Alertmanager, click the **Enable/Disable** button to toggle receiving Metrics Dashboard-managed alerts. When activated, the Alertmanager displays `Receiving Metrics Dashboard-managed alerts`.

{{< figure src="/media/docs/alerting/metrics-dashboard-alerting-settings.png" max-width="750px" alt="Metrics Dashboard Alerting Settings page" >}}

All Metrics Dashboard-managed alerts are forwarded to Alertmanagers marked as `Receiving Metrics Dashboard-managed alerts`.

{{< admonition type="note" >}}
Metrics Dashboard Alerting does not support forwarding Metrics Dashboard-managed alerts to the AlertManager in Amazon Managed Service for Prometheus. For more details, refer to [this GitHub issue](https://github.com/metrics-dashboard/metrics-dashboard/issues/64064).
{{< /admonition >}}

## Use an Alertmanager as a contact point to receive specific alerts

The previous instructions enable sending **all** Metrics Dashboard-managed alerts to an Alertmanager.

To send **specific** alerts to an Alertmanager, configure the Alertmanager as a contact point. You can then assign this contact point to notification policies or individual alert rules.

For detailed instructions, refer to:

- [Alertmanager contact point](ref:alertmanager-contact-point)
- [Configure Metrics Dashboard-managed alert rules](ref:configure-metrics-dashboard-alerts-notifications)
- [Configure notification policies](ref:configure-notification-policies)

## Manage Alertmanager configurations

On the Settings page, you can also manage your Alertmanager configurations.

- Manage version snapshots for the built-in Alertmanager, which allows administrators to roll back unintentional changes or mistakes in the Alertmanager configuration.
- Compare the historical snapshot with the latest configuration to see which changes were made.
