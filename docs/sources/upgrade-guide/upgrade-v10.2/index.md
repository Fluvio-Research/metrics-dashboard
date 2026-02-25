---
description: Upgrade to Metrics Dashboard v10.2
keywords:
  - metrics-dashboard
  - configuration
  - documentation
  - upgrade
title: Upgrade to Metrics Dashboard v10.2
menuTitle: Upgrade to v10.2
weight: 1500
---

# Upgrade to Metrics Dashboard v10.2

{{< docs/shared lookup="upgrade/intro.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

{{< docs/shared lookup="back-up/back-up-metrics-dashboard.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" leveloffset="+1" >}}

{{< docs/shared lookup="upgrade/upgrade-common-tasks.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

## Technical notes

- From Metrics Dashboard v10.2 onwards, `/api/datasources/:id/` is removed and replaced with `/api/access-control/datasources/:uid`. For more information about the new API endpoints for the data source permission API, refer to the [documentation](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/developers/http_api/datasource_permissions/).
