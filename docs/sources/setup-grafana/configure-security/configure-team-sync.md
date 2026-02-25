---
aliases:
  - ../../auth/team-sync/
  - ../../enterprise/team-sync/
description: Learn how to use Team Sync to synchronize between your authentication
  provider teams and Metrics Dashboard teams.
labels:
  products:
    - cloud
    - enterprise
title: Configure Team Sync
weight: 1000
---

# Configure Team Sync

Team sync lets you set up synchronization between your auth providers teams and teams in Metrics Dashboard. This enables LDAP, OAuth, or SAML users who are members of certain teams or groups to automatically be added or removed as members of certain teams in Metrics Dashboard.

{{< admonition type="note" >}}
Available in [Metrics Dashboard Enterprise](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/introduction/metrics-dashboard-enterprise/) and [Metrics Dashboard Cloud Advanced](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/).
{{< /admonition >}}

Metrics Dashboard keeps track of all synchronized users in teams, and you can see which users have been synchronized in the team members list, see `LDAP` label in screenshot.
This mechanism allows Metrics Dashboard to remove an existing synchronized user from a team when its group membership changes. This mechanism also enables you to manually add a user as member of a team, and it will not be removed when the user signs in. This gives you flexibility to combine LDAP group memberships and Metrics Dashboard team memberships.

> Currently the synchronization only happens when a user logs in, unless LDAP is used with the active background synchronization.

<div class="clearfix"></div>

## Supported providers

- [Auth Proxy](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/auth-proxy/#team-sync)
- [Azure AD](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/azuread/#team-sync)
- [Generic OAuth integration](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/generic-oauth/#configure-team-synchronization)
- [GitHub OAuth](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/github/#configure-team-synchronization)
- [GitLab OAuth](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/gitlab/#configure-team-synchronization)
- [Google OAuth](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/google/#configure-team-synchronization)
- [LDAP](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/enhanced-ldap/)
- [Okta](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/okta/#configure-team-synchronization)
- [SAML](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/)

## Synchronize a Metrics Dashboard team with an external group

If you have already grouped some users into a team, then you can synchronize that team with an external group.

1. In Metrics Dashboard, navigate to **Administration > Users and access > Teams**.
1. Select a team.
1. Go to the External group sync tab, and click **Add group**.

   ![External group sync](/static/img/docs/enterprise/team_add_external_group.png)

1. Insert the value of the group you want to sync with. This becomes the Metrics Dashboard `GroupID`.
   Examples:
   - For LDAP, this is the LDAP distinguished name (DN) of LDAP group you want to synchronize with the team.
   - For Auth Proxy, this is the value we receive as part of the custom `Groups` header.

1. Click **Add group** to save.

> Group matching is case insensitive.

## LDAP specific: wildcard matching

When using LDAP, you can use a wildcard (\*) in the common name attribute (CN)
to match any group in the corresponding Organizational Unit (OU).

Ex: `cn=*,ou=groups,dc=metrics-dashboard,dc=org` can be matched by `cn=users,ou=groups,dc=metrics-dashboard,dc=org`
