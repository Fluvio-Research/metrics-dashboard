---
aliases:
  - ../../../enterprise/access-control/rbac-for-app-plugins/
description: Learn about how to configure access to app plugins using RBAC
labels:
  products:
    - cloud
menuTitle: RBAC for app plugins
title: RBAC for app plugins
weight: 90
refs:
  manage-rbac-roles-update-basic-role-permissions:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/manage-rbac-roles/#update-basic-role-permissions
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-control/manage-rbac-roles/#update-basic-role-permissions
  restrict-access-to-app-plugin-example:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/plan-rbac-rollout-strategy/#prevent-viewers-from-accessing-an-app-plugin
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-control/plan-rbac-rollout-strategy/#prevent-viewers-from-accessing-an-app-plugin
  adaptive-metrics-permissions:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/custom-role-actions-scopes/#metrics-dashboard-adaptive-metrics-action-definitions
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-control/custom-role-actions-scopes/#metrics-dashboard-adaptive-metrics-action-definitions
  cloud-access-policies-action-definitions:
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/custom-role-actions-scopes/#cloud-access-policies-action-definitions
  rbac-role-definitions:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/rbac-fixed-basic-role-definitions/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-control/rbac-fixed-basic-role-definitions/
---

# RBAC for app plugins

{{< admonition type="note" >}}
Available in [Metrics Dashboard Cloud](/docs/metrics-dashboard-cloud).
{{< /admonition >}}

RBAC can be used to manage access to [app plugins](https://metrics-dashboard.com/docs/metrics-dashboard/latest/administration/plugin-management/#app-plugins).
Each app plugin grants the basic Viewer, Editor and Admin organization roles a default set of plugin permissions.
You can use RBAC to restrict which app plugins a basic organization role has access to.
Some app plugins have fine-grained RBAC support, which allows you to grant additional access to these app plugins to teams and users regardless of their basic organization roles.

## Restricting access to app plugins

By default, Viewers, Editors and Admins have access to all App Plugins that their organization role allows them to access.
To change this default behavior and prevent a basic organization role from accessing an App plugin, you must [update the basic role's permissions](ref:manage-rbac-roles-update-basic-role-permissions).
See an example of [preventing Viewers from accessing an app plugin](ref:restrict-access-to-app-plugin-example) to learn more.
To grant access to a limited set of app plugins, you will need plugin IDs. You can find them in `plugin.json` files or in the URL when you open the app plugin in the Metrics Dashboard Cloud UI.

Note that unless an app plugin has fine-grained RBAC support, it is not possible to grant access to this app plugin for a user whose organization role does not have access to that app plugin.

## Fine-grained access to app plugins

Plugins with fine-grained RBAC support allow you to manage access to plugin features at a more granular level.
For instance, you can grant admin access to an app plugin to a user with Viewer organization role. Or restrict the Editor organization role from being able to edit plugin resources.

Please refer to plugin documentation to see what RBAC permissions the plugin has and what default access the plugin grants to Viewer, Editor and Admin organization roles.

The following list contains app plugins that have fine-grained RBAC support.

| App plugin                                                                                                                                                                            | App plugin ID                  | App plugin permission documentation                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Access policies](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-policies/)                                                          | `metrics-dashboard-auth-app`             | [RBAC actions for Access Policies](ref:cloud-access-policies-action-definitions)                                                                                           |
| [Adaptive metrics](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/cost-management-and-billing/reduce-costs/metrics-costs/control-metrics-usage-via-adaptive-metrics/adaptive-metrics-plugin/) | `metrics-dashboard-adaptive-metrics-app` | [RBAC actions for Adaptive Metrics](ref:adaptive-metrics-permissions)                                                                                                      |
| [Incident](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/alerting-and-irm/irm/incident/)                                                                                                     | `metrics-dashboard-incident-app`         | n/a                                                                                                                                                                        |
| [OnCall](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/alerting-and-irm/irm/oncall/)                                                                                                         | `metrics-dashboard-oncall-app`           | [Configure RBAC for OnCall](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/alerting-and-irm/irm/oncall/manage/user-and-team-management/#manage-users-and-teams-for-metrics-dashboard-oncall) |
| [Performance Testing (K6)](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/testing/k6/)                                                                                                        | `k6-app`                       | [Configure RBAC for K6](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/testing/k6/projects-and-users/configure-rbac/)                                                              |
| [Private data source connect (PDC)](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/connect-externally-hosted/private-data-source-connect/)                                                    | `metrics-dashboard-pdc-app`              | n/a                                                                                                                                                                        |
| [Service Level Objective (SLO)](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/alerting-and-irm/slo/)                                                                                         | `metrics-dashboard-slo-app`              | [Configure RBAC for SLO](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/alerting-and-irm/slo/set-up/rbac/)                                                                         |
| [Cloud Provider](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/monitor-infrastructure/monitor-cloud-provider/)                                                                               | `metrics-dashboard-csp-app`              | [Cloud Provider Observability role-based access control](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/monitor-infrastructure/monitor-cloud-provider/rbac/)                       |

### Revoke fine-grained access from app plugins

To list all the permissions granted to a basic role, use the [HTTP API endpoint to query for the role](https://metrics-dashboard.com/docs/metrics-dashboard/latest/developers/http_api/access_control/#get-a-role).
Basic role UIDs are listed in [RBAC role definitions list](ref:rbac-role-definitions).
To remove the undesired plugin permissions from a basic role, you must [update the basic role's permissions](ref:manage-rbac-roles-update-basic-role-permissions).

### Grant additional access to app plugins

To grant access to app plugins, you can use the predefined [fixed plugin roles](https://metrics-dashboard.com/docs/metrics-dashboard/latest/administration/roles-and-permissions/access-control/#fixed-roles) or create [custom roles](https://metrics-dashboard.com/docs/metrics-dashboard/latest/administration/roles-and-permissions/access-control/#custom-roles) with specific plugin permissions.
To learn about how to assign an RBAC role, refer to [the documentation on assigning RBAC roles](https://metrics-dashboard.com/docs/metrics-dashboard/latest/administration/roles-and-permissions/access-control/assign-rbac-roles/#assign-rbac-roles).
