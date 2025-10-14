---
aliases:
  - ../../../enterprise/access-control/configure-rbac/
description: Learn how to configure RBAC.
labels:
  products:
    - cloud
    - enterprise
menuTitle: Configure RBAC
title: Configure RBAC in Metrics Dashboard
weight: 30
---

# Configure RBAC in Metrics Dashboard

{{< admonition type="note" >}}
Available in [Metrics Dashboard Enterprise](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/introduction/metrics-dashboard-enterprise/) and [Metrics Dashboard Cloud](/docs/metrics-dashboard-cloud).
{{< /admonition >}}

The table below describes all RBAC configuration options. Like any other Metrics Dashboard configuration, you can apply these options as [environment variables](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#override-configuration-with-environment-variables).

| Setting                         | Required | Description                                                                                                                                                                                                                                                                                                                     | Default |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `permission_cache`              | No       | Enable to use in memory cache for loading and evaluating users' permissions.                                                                                                                                                                                                                                                    | `true`  |
| `permission_validation_enabled` | No       | Metrics Dashboard enforces validation for permissions when a user creates or updates a role. The system checks the internal list of scopes and actions for each permission to determine they are valid. By default, if a scope or action is not recognized, Metrics Dashboard logs a warning message. When set to `true`, Metrics Dashboard returns an error. | `true`  |
| `reset_basic_roles`             | No       | Reset Metrics Dashboard's basic roles' (Viewer, Editor, Admin, Metrics Dashboard Admin) permissions to their default. Warning, if this configuration option is left to `true` this will be done on every reboot.                                                                                                                                    | `true`  |

## Example RBAC configuration

```bash
[rbac]

permission_cache = true
```
