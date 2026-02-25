---
aliases:
  - ../guides/getting_started/
  - ../guides/gettingstarted/
  - getting-started/
description: Learn how to get started with Metrics Dashboard by adding a preconfigured dashboard.
labels:
  products:
    - enterprise
    - oss
title: Build your first dashboard
weight: 200
---

# Build your first dashboard

This topic helps you get started with Metrics Dashboard and build your first dashboard using the built-in `Metrics Dashboard` data source. To learn more about Metrics Dashboard, refer to [Introduction to Metrics Dashboard](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/introduction/).

{{< admonition type="note" >}}
Metrics Dashboard also offers a [free account with Metrics Dashboard Cloud](/signup/cloud/connect-account?pg=gsdocs) to help getting started even easier and faster. You can install Metrics Dashboard to self-host or get a free Metrics Dashboard Cloud account.
{{< /admonition >}}

#### Install Metrics Dashboard

Metrics Dashboard can be installed on many different operating systems. For a list of the minimum hardware and software requirements, as well as instructions on installing Metrics Dashboard, refer to [Install Metrics Dashboard](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/installation/).

#### Sign in to Metrics Dashboard

To sign in to Metrics Dashboard for the first time:

1. Open your web browser and go to http://localhost:3000/.

   The default HTTP port that Metrics Dashboard listens to is `3000` unless you have configured a different port.

1. On the sign-in page, enter `admin` for both the username and password.
1. Click **Sign in**.

   If successful, you'll see a prompt to change the password.

1. Click **OK** on the prompt and change your password.

{{< admonition type="note" >}}
We strongly recommend that you change the default administrator password.
{{< /admonition >}}

#### Create a dashboard

If you've already set up a data source that you know how to query, refer to [Create a dashboard](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/create-dashboard/) instead.

To create your first dashboard using the built-in `-- Metrics Dashboard --` data source:

1. Click **Dashboards** in the main menu.
1. On the **Dashboards** page, click **New** and select **New Dashboard** from the drop-down menu.
1. On the dashboard, click **+ Add visualization**.

   ![Empty dashboard state](/media/docs/metrics-dashboard/dashboards/empty-dashboard-10.2.png)

1. In the dialog box that opens, click `-- Metrics Dashboard --`:

   {{< figure class="float-right"  src="/media/docs/metrics-dashboard/dashboards/screenshot-data-source-selector-10.0.png" max-width="800px" alt="Select data source dialog box" >}}

   This configures your [query](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/query-transform-data/#add-a-query) and generates the Random Walk dashboard.

1. Click **Refresh** to query the data source.
1. When you've finished editing your panel, click **Save dashboard**.

   Alternatively, click **Back to dashboard** if you want to see your changes applied to the dashboard first. Then click **Save dashboard** when you're ready.

1. Add a descriptive title for the dashboard, or have Metrics Dashboard create one using [generative AI features](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/manage-dashboards#set-up-generative-ai-features-for-dashboards), and then click **Save**.
1. Click **Back to dashboard** and then **Exit edit**.

Congratulations, you have created your first dashboard and it's displaying results.

#### Next steps

Continue to experiment with what you have built, try the [explore workflow](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/) or another visualization feature. Refer to [Data sources](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/) for a list of supported data sources and instructions on how to [add a data source](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/#add-a-data-source). The following topics will be of interest to you:

- [Panels and visualizations](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/panels-visualizations/)
- [Dashboards](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/)
- [Keyboard shortcuts](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/use-dashboards/#keyboard-shortcuts)
- [Plugins](/metrics-dashboard/plugins?orderBy=weight&direction=asc)

##### Admins

The following topics are of interest to Metrics Dashboard server admin users:

- [Metrics Dashboard configuration](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/)
- [Authentication](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/)
- [User permissions and roles](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/)
- [Provisioning](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/provisioning/)
- [Metrics Dashboard CLI](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/cli/)
