---
aliases:
  - ../administration/set-up-for-high-availability/
  - ../tutorials/ha_setup/
description: Learn how to set up Metrics Dashboard to be highly available.
keywords:
  - metrics-dashboard
  - tutorials
  - HA
  - high availability
labels:
  products:
    - enterprise
    - oss
menuTitle: Set up HA
title: Set up Metrics Dashboard for high availability
weight: 900
---

# Set up Metrics Dashboard for high availability

{{< admonition type="note" >}}
To prevent duplicate alerts in Metrics Dashboard high availability, additional steps are required.

Please refer to [Alerting high availability](#alerting-high-availability) for more information.
{{< /admonition >}}

Metrics Dashboard uses an embedded sqlite3 database to store users, dashboards, and other persistent data by default. For high availability, you must use a shared database to store this data. This shared database can be either MySQL or Postgres.

<div class="text-center">
  <img src="/static/img/docs/tutorials/metrics-dashboard-high-availability.png"  max-width= "800px" class="center" />
</div>

## Architecture

Your Metrics Dashboard high availability environment will consist of two or more Metrics Dashboard servers (cluster nodes) served by a load balancing reverse proxy. The cluster uses an active-active architecture with the load balancer allocating traffic between nodes and re-allocating traffic to surviving nodes should there be failures. You need to configure your load balancer with a listener that responds to a shared cluster hostname. The shared name is the hostname your users use to access Metrics Dashboard.

For ease of use, we recommend you configure your load balancer to provide SSL termination. The shared Metrics Dashboard database tracks session information, so your load balancer won't need to provide session affinity services. See your load balancer's documentation for details on its configuration and operations.

## Before you begin

Before you complete the following tasks, configure a MySQL or Postgres database to be highly available. Configuring the MySQL or Postgres database for high availability is out of the scope of this guide, but you can find instructions online for each database.

## Configure multiple Metrics Dashboard servers to use the same database

Once you have a Postgres or MySQL database available, you can configure your multiple Metrics Dashboard instances to use a shared backend database. Metrics Dashboard has default and custom configuration files, and you can update the database settings by updating your custom configuration file as described in the [[database]](../configure-metrics-dashboard/#database). Once configured to use a shared database, your multiple Metrics Dashboard instances will persist all long-term data in that database.

## Metrics Dashboard Enterprise only: License your Metrics Dashboard servers

If you're using Metrics Dashboard Enterprise:

1. Get a license token in the name of your cluster's shared hostname.
1. Edit the [`root_url`](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#root_url) setting in each node's `metrics-dashboard.ini` configuration file to reflect the cluster's shared hostname.
1. Install the license key as normal. For more information on installing your license key, refer to [Add your license to a Metrics Dashboard instance](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/enterprise-licensing/#step-2-add-your-license-to-a-metrics-dashboard-instance).

## Alerting high availability

Metrics Dashboard Alerting provides a high availability mode. It preserves the semantics of legacy dashboard alerting by executing all alerts on every server and by sending notifications only once per alert. Load distribution between servers is not supported at this time.

For further information and instructions on setting up alerting high availability, refer to [Enable alerting high availability](../../alerting/set-up/configure-high-availability/).

**Legacy dashboard alerts**

Legacy Metrics Dashboard Alerting supports a limited form of high availability. In this model, alert notifications are deduplicated when running multiple servers. This means all alerts are executed on every server, but alert notifications are only sent once per alert. Metrics Dashboard does not support load distribution between servers.

## Metrics Dashboard Live

Metrics Dashboard Live works with limitations in highly available setup. For details, refer to the [Configure Metrics Dashboard Live HA setup](../set-up-metrics-dashboard-live/#configure-metrics-dashboard-live-ha-setup).

## User sessions

Metrics Dashboard uses auth token strategy with database by default. This means that a load balancer can send a user to any Metrics Dashboard server without having to log in on each server.
