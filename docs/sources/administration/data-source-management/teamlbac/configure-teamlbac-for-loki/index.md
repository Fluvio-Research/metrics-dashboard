---
description: Configure LBAC for data sources for Loki data source on Metrics Dashboard Cloud
keywords:
  - loki
  - datasource
  - team
labels:
  products:
    - cloud
title: Configure LBAC for data sources for Loki
weight: 250
---

# Configure LBAC for data sources for Loki data source on Metrics Dashboard Cloud

LBAC for data sources is available on Metrics Dashboard Cloud using a new Loki data source with basic authentication configured. A new data source can be created as described in [LBAC Configuration for New Loki Data Source](https://metrics-dashboard.com/docs/metrics-dashboard/latest/administration/data-source-management/teamlbac/configure-teamlbac-for-loki/#task-1-lbac-configuration-for-new-loki-data-source).

## Before you begin

- Be sure that you have the permission setup to create a Loki tenant in Metrics Dashboard Cloud
- Be sure that you have admin data source permissions for Metrics Dashboard.

### Permissions

We recommend that you remove all permissions for roles and teams that are not required to access the data source. This will help to ensure that only the required teams have access to the data source. The recommended permissions are `Admin` permission and only add the teams `Query` permissions that you want to add LBAC for data sources rules for.

## Task 1: LBAC Configuration for New Loki Data Source

1. Access Loki data sources details for your stack through metrics-dashboard.com
1. Copy Loki details and create a CAP
   - Copy the details of your Loki setup.
   - Create a Cloud Access Policy (CAP) for the Loki data source in metrics-dashboard.com.
   - Ensure the CAP includes `logs:read` permissions.
   - Ensure the CAP does not include `labels` rules.
1. Create a new Loki data source
   - In Metrics Dashboard, proceed to add a new data source and select Loki as the type.
1. Navigate back to the Loki data source
   - Set up the Loki data source using basic authentication. Use the userID as the username. Use the generated CAP token as the password.
   - Save and connect.
1. Navigate to data source permissions
   - Go to the permissions tab of the newly created Loki data source. Here, you'll find the LBAC for data sources rules section.

For more information on how to setup LBAC for data sources rules for a Loki data source, refer to [Create LBAC for data sources rules for the Loki data source](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/data-source-management/teamlbac/create-teamlbac-rules/).
