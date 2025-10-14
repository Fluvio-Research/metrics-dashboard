---
description: Upgrade to Metrics Dashboard v10.0
keywords:
  - metrics-dashboard
  - configuration
  - documentation
  - upgrade
labels:
  products:
    - enterprise
    - oss
menutitle: Upgrade to v10.0
title: Upgrade to Metrics Dashboard v10.0
weight: 1700
---

# Upgrade to Metrics Dashboard v10.0

{{< docs/shared lookup="upgrade/intro.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

{{< docs/shared lookup="back-up/back-up-metrics-dashboard.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" leveloffset="+1" >}}

{{< docs/shared lookup="upgrade/upgrade-common-tasks.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

## Technical notes

### Role-based access control changes

<!-- Vardan Torosyan -->

Role-based access control (RBAC) is now always enabled and we've removed the option to disable it.

No action is required.

However, if you decide to **downgrade** for any reason and **disable RBAC**, you'll need to run through the following guide before upgrading again.

The aforementioned sequence of actions (upgrade, downgrade, disable RBAC, upgrade again) causes legacy access control and role-based access control systems to be out of sync.
As a side effect, permissions for some Metrics Dashboard resources, like dashboards, might be lost.
To prevent that from happening, before you upgrade Metrics Dashboard back again, please take the following steps:

1. Stop Metrics Dashboard.
2. In your database, run the following SQL queries:

```sql
DELETE
FROM builtin_role
where role_id IN (SELECT id
                  FROM role
                  WHERE name LIKE 'managed:%');

DELETE
FROM team_role
where role_id IN (SELECT id
                  FROM role
                  WHERE name LIKE 'managed:%');

DELETE
FROM user_role
where role_id IN (SELECT id
                  FROM role
                  WHERE name LIKE 'managed:%');

DELETE
FROM permission
where role_id IN (SELECT id
                  FROM role
                  WHERE name LIKE 'managed:%');

DELETE
FROM role
WHERE name LIKE 'managed:%';

DELETE
FROM migration_log
WHERE migration_id IN ('teams permissions migration',
                       'dashboard permissions',
                       'dashboard permissions uid scopes',
                       'data source permissions',
                       'data source uid permissions',
                       'managed permissions migration',
                       'managed folder permissions alert actions repeated migration',
                       'managed permissions migration enterprise');
```

3. Start Metrics Dashboard again.

### Case-insensitive usernames and email addresses

<!-- Vardan Torosyan -->

Usernames and email addresses are now treated as case-insensitive in Metrics Dashboard. If you're not using MySQL as a database, potential user identity conflicts may arise when users try to log in.
We recommend you resolve any potential conflicts in advance by using the [Metrics Dashboard CLI tool for managing user conflicts](/blog/2022/12/12/guide-to-using-the-new-metrics-dashboard-cli-user-identity-conflict-tool-in-metrics-dashboard-9.3/).

### Dashboard previews removal

<!-- Artur Wierzbicki -->

We've removed the Dashboard previews feature introduced behind a feature flag in Metrics Dashboard version 9.0.

No action is required.

The `dashboardPreviews` feature flag is no longer available and can be safely removed from the Metrics Dashboard server configuration.
