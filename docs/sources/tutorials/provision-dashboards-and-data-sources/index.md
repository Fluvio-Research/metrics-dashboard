---
Feedback Link: https://github.com/metrics-dashboard/tutorials/issues/new
authors:
  - metrics-dashboard_labs
categories:
  - administration
description: Treat your configuration as code.
id: provision-dashboards-and-data-sources
labels:
  products:
    - enterprise
    - oss
summary: Treat your configuration as code.
tags:
  - intermediate
title: Provision dashboards and data sources
weight: 40
---

## Introduction

Learn how you can reuse dashboards and data sources across multiple teams by provisioning Metrics Dashboard from version-controlled configuration files.

In this tutorial, you'll:

- Provision dashboards.
- Provision data sources.

{{% class "prerequisite-section" %}}

### Prerequisites

- Metrics Dashboard 7.0
- Administrator privileges on the system you are doing the tutorial on
  {{% /class %}}

## Configuration as code

Configuration as code is the practice of storing the configuration of your system as a set of version controlled, human-readable configuration files, rather than in a database. These configuration files can be reused across environments to avoid duplicated resources.

As the number of dashboards and data sources grows within your organization, manually managing changes can become tedious and error-prone. Encouraging reuse becomes important to avoid multiple teams redesigning the same dashboards.

Metrics Dashboard supports configuration as code through _provisioning_. The resources that currently supports provisioning are:

- [Dashboards](/docs/metrics-dashboard/latest/administration/provisioning/#dashboards)
- [Data sources](/docs/metrics-dashboard/latest/administration/provisioning/#datasources)

## Set the provisioning directory

Before you can start provisioning resources, Metrics Dashboard needs to know where to find the _provisioning directory_. The provisioning directory contains configuration files that are applied whenever Metrics Dashboard starts and continuously updated while running.

By default, Metrics Dashboard looks for a provisioning directory in the configuration directory (metrics-dashboard > conf) on the system where Metrics Dashboard is installed. However, if you are a Metrics Dashboard Administrator, then you might want to place the config files in a shared resource like a network folder, so you would need to change the path to the provisioning directory.

You can set a different path by setting the `paths.provisioning` property in the main config file:

```ini
[paths]
provisioning = <path to config files>
```

For more information about configuration files, refer to [Configuration](/docs/metrics-dashboard/latest/installation/configuration/) in the [Metrics Dashboard documentation](/docs/metrics-dashboard/latest/).

The provisioning directory assumes the following structure:

```
provisioning/
  datasources/
    <yaml files>
  dashboards/
    <yaml files>
```

Next, we'll look at how to provision a data source.

## Provision a data source

Each data source provisioning config file contains a _manifest_ that specifies the desired state of a set of provisioned data sources.

At startup, Metrics Dashboard loads the configuration files and provisions the data sources listed in the manifests.

Let's configure a [TestData](/docs/metrics-dashboard/latest/features/datasources/testdata/) data source that you can use for your dashboards.

#### Create a data source manifest

1. In the `provisioning/datasources/` directory, create a file called `default.yaml` with the following content:

   ```yaml
   apiVersion: 1

   datasources:
     - name: TestData
       type: testdata
   ```

1. Restart Metrics Dashboard to load the new changes.
1. In the sidebar, hover the cursor over the **Configuration** (gear) icon and click **Data Sources**. TestData appears in the list of data sources.

> The configuration options can vary between different types of data sources. For more information on how to configure a specific data source, refer to [Data sources](/docs/metrics-dashboard/latest/administration/provisioning/#datasources).

## Provision a dashboard

Each dashboard config file contains a manifest that specifies the desired state of a set of _dashboard providers_.

A dashboard provider tells Metrics Dashboard where to find the dashboard definitions and where to put them.

Metrics Dashboard regularly checks for changes to the dashboard definitions (by default every 10 seconds).

Let's define a dashboard provider so that Metrics Dashboard knows where to find the dashboards we want to provision.

#### Define a dashboard provider

In the `provisioning/dashboards/` directory, create a file called `default.yaml` with the following content:

```yaml
apiVersion: 1

providers:
  - name: Default # A uniquely identifiable name for the provider
    folder: Services # The folder where to place the dashboards
    type: file
    options:
      path:
        <path to dashboard definitions>
        # Default path for Windows: C:/Program Files/Metrics DashboardLabs/metrics-dashboard/public/dashboards
        # Default path for Linux is: /var/lib/metrics-dashboard/dashboards
```

For more information on how to configure dashboard providers, refer to [Dashboards](/docs/metrics-dashboard/latest/administration/provisioning/#dashboards).

#### Create a dashboard definition

1. In the dashboard definitions directory you specified in the dashboard provider, i.e. `options.path`, create a file called `cluster.json` with the following content:

   ```json
   {
     "__inputs": [],
     "__requires": [],
     "annotations": {
       "list": []
     },
     "editable": false,
     "gnetId": null,
     "graphTooltip": 0,
     "hideControls": false,
     "id": null,
     "links": [],
     "panels": [
       {
         "aliasColors": {},
         "bars": false,
         "dashLength": 10,
         "dashes": false,
         "datasource": "TestData",
         "fill": 1,
         "gridPos": {
           "h": 8,
           "w": 24,
           "x": 0,
           "y": 0
         },
         "id": 2,
         "legend": {
           "alignAsTable": false,
           "avg": false,
           "current": false,
           "max": false,
           "min": false,
           "rightSide": false,
           "show": true,
           "total": false,
           "values": false
         },
         "lines": true,
         "linewidth": 1,
         "links": [],
         "nullPointMode": "null",
         "percentage": false,
         "pointradius": 5,
         "points": false,
         "renderer": "flot",
         "repeat": null,
         "seriesOverrides": [],
         "spaceLength": 10,
         "stack": false,
         "steppedLine": false,
         "targets": [],
         "thresholds": [],
         "timeFrom": null,
         "timeShift": null,
         "title": "CPU Usage",
         "tooltip": {
           "shared": true,
           "sort": 0,
           "value_type": "individual"
         },
         "type": "graph",
         "xaxis": {
           "buckets": null,
           "mode": "time",
           "name": null,
           "show": true,
           "values": []
         },
         "yaxes": [
           {
             "format": "short",
             "label": null,
             "logBase": 1,
             "max": null,
             "min": null,
             "show": true
           },
           {
             "format": "short",
             "label": null,
             "logBase": 1,
             "max": null,
             "min": null,
             "show": true
           }
         ]
       }
     ],
     "refresh": "",
     "rows": [],
     "schemaVersion": 16,
     "tags": ["kubernetes"],
     "templating": {
       "list": []
     },
     "time": {
       "from": "now-6h",
       "to": "now"
     },
     "timepicker": {},
     "timezone": "browser",
     "title": "Cluster",
     "version": 0
   }
   ```

1. Restart Metrics Dashboard to provision the new dashboard or wait 10 seconds for Metrics Dashboard to automatically create the dashboard.
1. In the sidebar, hover the cursor over **Dashboards** (squares) icon, and then click **Manage**. The dashboard appears in a **Services** folder.

> If you don't specify an `id` in the dashboard definition, then Metrics Dashboard assigns one during provisioning. You can set the `id` yourself if you want to reference the dashboard from other dashboards. Be careful to not use the same `id` for multiple dashboards, as this will cause a conflict.

## Summary

In this tutorial you learned how you to reuse dashboards and data sources across multiple teams by provisioning Metrics Dashboard from version-controlled configuration files.

Dashboard definitions can get unwieldy as more panels and configurations are added to them. There are a number of open source tools available to make it easier to manage dashboard definitions:

- [metrics-dashboard-dash-gen](https://github.com/uber/metrics-dashboard-dash-gen) (Javascript)
- [metrics-dashboardlib](https://github.com/weaveworks/metrics-dashboardlib) (Python)
- [grafonnet-lib](https://github.com/metrics-dashboard/grafonnet-lib) (Jsonnet)
- [grafyaml](https://docs.openstack.org/infra/grafyaml/) (YAML)

### Learn more

- [Provisioning Metrics Dashboard](/docs/metrics-dashboard/latest/administration/provisioning/)
