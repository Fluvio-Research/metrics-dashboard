---
aliases:
  - ../../enterprise/access-control/
  - ../../enterprise/access-control/about-rbac/
  - ../../enterprise/access-control/roles/
description: Role-based access control (RBAC) provides a standardized way of granting,
  changing, and revoking access so that users can view and modify Metrics Dashboard resources,
  such as users and reports.
labels:
  products:
    - cloud
    - enterprise
menuTitle: Role-based access control (RBAC)
title: Metrics Dashboard Role-based access control (RBAC)
weight: 120
refs:
  api-rbac:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/developers/http_api/access_control/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/developer-resources/api-reference/http-api/access_control/
  rbac-role-definitions:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/rbac-fixed-basic-role-definitions/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-control/rbac-fixed-basic-role-definitions/
  rbac-role-definitions-basic-role-assignments:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/rbac-fixed-basic-role-definitions/#basic-role-assignments
    - pattern: /docs/metrics-dashboard-cloud/
  rbac-manage-rbac-roles:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/manage-rbac-roles/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-control/manage-rbac-roles/
  rbac-assign-rbac-roles:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/assign-rbac-roles/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-control/assign-rbac-roles/
  rbac-basic-role-uid-mapping:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/manage-rbac-roles/#list-permissions-associated-with-roles
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-control/manage-rbac-roles/#list-permissions-associated-with-roles
  service-accounts:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/service-accounts/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/service-accounts/
  alerting:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/
  data-sources:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/connect-externally-hosted/data-sources/
  roles-and-permissions:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/cloud-roles/
  dashboards:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/
  dashboards-annotate-visualizations:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/annotate-visualizations/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/build-dashboards/annotate-visualizations/
  dashboards-create-reports:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/create-reports/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/create-reports/
  dashboards-manage-library-panels:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/build-dashboards/manage-library-panels/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/build-dashboards/manage-library-panels/
  dashboards-create-a-dashboard-folder:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/manage-dashboards/#create-a-dashboard-folder
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/manage-dashboards/#create-a-dashboard-folder
  folder-permissions:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/manage-dashboards/#folder-permissions
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/visualizations/dashboards/manage-dashboards/#folder-permissions
  migrate-api-keys:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/service-accounts/migrate-api-keys/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/service-accounts/migrate-api-keys/
---

# Role-based access control (RBAC)

{{< admonition type="note" >}}
Available in [Metrics Dashboard Enterprise](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/introduction/metrics-dashboard-enterprise/) and [Metrics Dashboard Cloud](/docs/metrics-dashboard-cloud).
{{< /admonition >}}

RBAC provides a standardized way of granting, changing, and revoking access when it comes to viewing and modifying Metrics Dashboard resources, such as dashboards, reports, and administrative settings.

{{< section >}}

## About RBAC

Role-based access control (RBAC) provides a standardized way of granting, changing, and revoking access so that users can view and modify Metrics Dashboard resources, such as users and reports.
RBAC extends Metrics Dashboard basic roles that are included in Metrics Dashboard OSS, and enables more granular control of users’ actions.

By using RBAC you can provide users with permissions that extend the permissions available with basic roles. For example, you can use RBAC to:

- Modify existing basic roles: for example, enable an editor to create reports
- Assign fixed roles to users and teams: for example, grant an engineering team the ability to create data sources
- Create custom roles: for example, a role that allows users to create and edit dashboards, but not delete them

RBAC roles contain multiple permissions, each of which has an action and a scope:

- **Role:** `fixed:datasources:reader`
  - **Permission:**
    - **Action:** `datasources:read`
    - **Scope:** `datasources:*`

For information on the RBAC API refer to [RBAC API](ref:api-rbac).

### Basic roles

Basic roles are the standard roles that are available in Metrics Dashboard OSS. If you have purchased a Metrics Dashboard Enterprise license, you can still use basic roles.

Metrics Dashboard includes the following basic roles:

- Metrics Dashboard administrator
- Organization administrator
- Editor
- Viewer
- None

Each basic role is comprised of a number of _permissions_. For example, the viewer basic role contains the following permissions among others:

- `Action: datasources.id:read, Scope: datasources:*`: Enables the viewer to see the ID of a data source.
- `Action: orgs:read`: Enables the viewer to see their organization details
- `Action: annotations:read, Scope: annotations:*`: Enables the viewer to see annotations that other users have added to a dashboard.
- `Action: annotations:create, Scope: annotations:type:dashboard`: Enables the viewer to add annotations to a dashboard.
- `Action: annotations:write, Scope: annotations:type:dashboard`: Enables the viewer to modify annotations of a dashboard.
- `Action: annotations:delete, Scope: annotations:type:dashboard`: Enables the viewer to remove annotations from a dashboard.

{{< admonition type="note" >}}
You can't have a Metrics Dashboard user without a basic role assigned. The `None` role contains no permissions.
{{< /admonition >}}

#### Basic role modification

You can use RBAC to modify the permissions associated with any basic role, which changes what viewers, editors, or admins can do. You can't delete basic roles.

Note that any modification to any of these basic role is not propagated to the other basic roles.
For example, if you modify Viewer basic role and grant additional permission, Editors or Admins won't have that additional grant.

For more information about the permissions associated with each basic role, refer to [Basic role definitions](ref:rbac-role-definitions-basic-role-assignments).
To interact with the API and view or modify basic roles permissions, refer to [the table](ref:rbac-basic-role-uid-mapping) that maps basic role names to the associated UID.

{{< admonition type="note" >}}
You cannot use a service account to modify basic roles via the RBAC API. To update basic roles, you must be a Metrics Dashboard administrator and use basic authentication with the request.
{{< /admonition >}}

For Cloud customers, contact Support to reset roles.

### Fixed roles

Metrics Dashboard Enterprise includes the ability for you to assign discrete fixed roles to users, teams, and service accounts. This gives you fine-grained control over user permissions than you would have with basic roles alone. These roles are called "fixed" because you cannot change or delete fixed roles. You can also create _custom_ roles of your own; see more information in the [custom roles section](#custom-roles) below.

Assign fixed roles when the basic roles do not meet your permission requirements. For example, you might want a user with the basic viewer role to also edit dashboards. Or, you might want anyone with the editor role to also add and manage users. Fixed roles provide users more granular access to create, view, and update the following Metrics Dashboard resources:

- [Alerting](ref:alerting)
- [Annotations](ref:dashboards-annotate-visualizations)
- [API keys](ref:migrate-api-keys)
- [Dashboards and folders](ref:dashboards)
- [Data sources](ref:data-sources)
- [Explore](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/explore/)
- [Feature Toggles](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/feature-toggles/)
- [Folders](ref:dashboards-create-a-dashboard-folder)
- [LDAP](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/ldap/)
- [Library panels](ref:dashboards-manage-library-panels)
- [Licenses](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/stats-and-license/)
- [Organizations](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/organization-management/)
- [Provisioning](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/provisioning/)
- [Reports](ref:dashboards-create-reports)
- [Roles](ref:roles-and-permissions)
- [Service accounts](ref:service-accounts)
- [Settings](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/settings-updates-at-runtime/)
- [Teams](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/team-management/)
- [Users](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/user-management/)

To learn more about the permissions you can grant for each resource, refer to [RBAC role definitions](ref:rbac-role-definitions).

### Custom roles

If you are a Metrics Dashboard Enterprise customer, you can create custom roles to manage user permissions in a way that meets your security requirements.

Custom roles contain unique combinations of permissions _actions_ and _scopes_. An action defines the action a use can perform on a Metrics Dashboard resource. For example, the `teams.roles:read` action allows a user to see a list of roles associated with each team.

A scope describes where an action can be performed. For example, the `teams:id:1` scope restricts the user's action to the team with ID `1`. When paired with the `teams.roles:read` action, this permission prohibits the user from viewing the roles for teams other than team `1`.

Consider creating a custom role when fixed roles do not meet your permissions requirements.

#### Custom role creation

You can use either of the following methods to create, assign, and manage custom roles:

- Metrics Dashboard provisioning: You can use a YAML file to configure roles. For more information about using provisioning to create custom roles, refer to [Manage RBAC roles](ref:rbac-manage-rbac-roles). For more information about using provisioning to assign RBAC roles to users or teams, refer to [Assign RBAC roles](ref:rbac-assign-rbac-roles).
- RBAC API: As an alternative, you can use the Metrics Dashboard HTTP API to create and manage roles. For more information about the HTTP API, refer to [RBAC API](ref:api-rbac).

### Limitation

If you have created a folder with the name `General` or `general`, you cannot manage its permissions with RBAC.

If you set [folder permissions](ref:folder-permissions) for a folder named `General` or `general`, the system disregards the folder when RBAC is enabled.
