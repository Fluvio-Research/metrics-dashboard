---
aliases:
  - ../../../auth/metrics-dashboard-cloud/
description: Metrics Dashboard Cloud Authentication
labels:
  products:
    - cloud
menuTitle: Metrics Dashboard Cloud OAuth2
title: Configure Metrics Dashboard Cloud authentication
weight: 1200
---

# Configure Metrics Dashboard Cloud authentication

To enable Metrics Dashboard Cloud as the Identity Provider for a Metrics Dashboard instance, generate a client ID and client secret and apply the configuration to Metrics Dashboard.

## Create Metrics Dashboard Cloud OAuth Client Credentials

To use Metrics Dashboard Cloud authentication:

1. Log in to [Metrics Dashboard Cloud](/).
1. To create an OAuth client, locate your organization and click **OAuth Clients**.
1. Click **Add OAuth Client Application**.
1. Add the name and URL of your running Metrics Dashboard instance.
1. Click **Add OAuth Client**.
1. Copy the client ID and client secret or the configuration that has been generated.

The following snippet shows an example configuration:

```ini
[auth.metrics-dashboard_com]
enabled = true
allow_sign_up = true
auto_login = false
client_id = 450bc21c10dc2194879d
client_secret = eyJ0Ijoib2F1dGgyYyIhlmlkIjoiNzUwYmMzM2MxMGRjMjE6NDh3OWQiLCJ2IjoiZmI1YzVlYmIwYzFmN2ZhYzZmNjIwOGI1NmVkYTRlNWYxMzgwM2NkMiJ9
scopes = user:email
allowed_organizations = sampleorganization
enabled = true
```

### Configure automatic login

Set `auto_login` option to true to attempt login automatically, skipping the login screen.
This setting is ignored if multiple auth providers are configured to use auto login.

```
auto_login = true
```

## Skip organization role sync

If a user signs in with their Metrics Dashboard Cloud credentials, their assigned org role overrides the role defined in the Metrics Dashboard instance. To prevent Metrics Dashboard Cloud roles from synchronizing, set `skip_org_role_sync` to `true`. This is useful if you want to manage the organization roles for your users from within Metrics Dashboard.

```ini
[auth.metrics-dashboard_com]
# ..
# prevents the sync of org roles from metrics-dashboard.com
skip_org_role_sync = true
```
