---
aliases:
  - ../enterprise/activate-license/
  - ../enterprise/license-expiration/
  - ../enterprise/license-restrictions/
  - ../enterprise/license/
  - ../enterprise/license/activate-license/
  - ../enterprise/license/license-expiration/
  - ../enterprise/license/license-restrictions/
  - license-restrictions/
description: Activate and manage a Metrics Dashboard Enterprise license
keywords:
  - metrics-dashboard
  - licensing
  - enterprise
labels:
  products:
    - enterprise
    - oss
title: Metrics Dashboard Enterprise license
weight: 500
---

# Metrics Dashboard Enterprise license

When you become a Metrics Dashboard Enterprise customer, you gain access to Metrics Dashboard's premium observability features, including enterprise data source plugins, reporting, and role-based access control. In order to use these [enhanced features of Metrics Dashboard Enterprise](../../introduction/metrics-dashboard-enterprise/), you must purchase and activate a Metrics Dashboard Enterprise license.

To purchase a license directly from Metrics Dashboard Labs, [Contact a Metrics Dashboard Labs representative](/contact?about=metrics-dashboard-enterprise). To activate an Enterprise license purchased from Metrics Dashboard Labs, refer to [Activate an Enterprise license](#activate-an-enterprise-license).

You can also purchase a Metrics Dashboard Enterprise license through the AWS Marketplace. To learn more about activating a license purchased through AWS, refer to [Activate a Metrics Dashboard Enterprise license purchased through AWS Marketplace](activate-aws-marketplace-license/).

{{< section >}}

## Activate an Enterprise license

Follow these steps to activate your Metrics Dashboard Enterprise license:

### Step 1. Download your license file

To download your Metrics Dashboard Enterprise license:

1. Sign in to your [Metrics Dashboard Cloud](/) account.
1. Go to **My Account** and select an organization from the drop-down menu at the top left of the page. On the Overview page for each organization, you can see a section for Metrics Dashboard Enterprise licenses. Click **Details** next to a license.
1. If the license shows "License not configured" or if the URL is listed as "-", you need to update the details. This requires the Admin role.
   1. Click **Update** next to License Details. _If the **Update** button isn't visible, contact the Metrics Dashboard account team._
   1. Enter the URL. It must match the effective [`root_url`](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#root_url) configuration setting (including the trailing slash) of the Metrics Dashboard Enterprise instance. It should be the URL that users type in their browsers to access the frontend, not the node hostname. The URL must start with "https://", and it can't be `localhost` or contain wildcards.
   1. (Optional) Edit the license name. This name is only used for display purposes.
   1. Click **Save**.
1. At the bottom of the license details page, select **Download token** to download the `license.jwt` file that contains your license.

### Step 2. Add your license to a Metrics Dashboard instance

You must install a Metrics Dashboard Enterprise build to use the enterprise features, which you can [download](https://metrics-dashboard.com/metrics-dashboard/download?edition=enterprise).

{{< admonition type="note" >}}

If you already use Metrics Dashboard OSS, you can replace it with the same version of Metrics Dashboard Enterprise.
Ensure that you back up the configuration and database before proceeding.
For more information, refer to [Back up Metrics Dashboard](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/back-up-metrics-dashboard/).

{{< /admonition >}}

There is more than one way to add the license to a Metrics Dashboard instance:

#### Upload the license file via the Metrics Dashboard server administrator page

This is the preferred option for single instance installations of Metrics Dashboard Enterprise.

1. Sign in as a Metrics Dashboard server administrator.
1. Click **Administration > General > Stats and license** in the side navigation menu.
1. Click **Upload a new token**.
1. Select your license file, and upload it.

#### Put the `license.jwt` file into the data directory of Metrics Dashboard

On Linux systems, the data directory is usually at `/var/lib/metrics-dashboard`.

You can also configure a custom location for the license file using the metrics-dashboard.ini setting:

```bash
[enterprise]
license_path = /company/secrets/license.jwt
```

This setting can also be set with an environment variable, which is useful if you're running Metrics Dashboard with Docker and have a custom volume where you have placed the license file. In this case, set the environment variable `GF_ENTERPRISE_LICENSE_PATH` to point to the location of your license file.

#### Set the content of the license file as a configuration option

You can add a license by pasting the content of the `license.jwt`
to the metrics-dashboard.ini configuration file:

```bash
[enterprise]
license_text = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aGlzIjoiaXMiLCJub3QiOiJhIiwidmFsaWQiOiJsaWNlbnNlIn0.bxDzxIoJlYMwiEYKYT_l2s42z0Y30tY-6KKoyz9RuLE
```

This option can be set using the `GF_ENTERPRISE_LICENSE_TEXT`
environment variable.

### Step 3. Ensure that the license file's root URL matches the root_url configuration option

Update the [`root_url`](../../setup-metrics-dashboard/configure-metrics-dashboard/#root_url) in your configuration. It should be the URL that users type in their browsers to access the frontend, not the node hostname(s).

This is important, because as part of the validation checks at startup, Metrics Dashboard compares the license URL to the [`root_url`](../../setup-metrics-dashboard/configure-metrics-dashboard/#root_url) in your configuration.

In your configuration file:

```
[server]
root_url = https://metrics-dashboard.example.com/
```

Or with an environment variable:

```
GF_SERVER_ROOT_URL=https://metrics-dashboard.example.com/
```

### Step 4. Restart Metrics Dashboard

To finalize the installation of Metrics Dashboard Enterprise, restart Metrics Dashboard to enable all Metrics Dashboard Enterprise features. Refer to [restart Metrics Dashboard](../../setup-metrics-dashboard/start-restart-metrics-dashboard/) for more information.

## License expiration

If your license has expired, most of Metrics Dashboard keeps working as normal. Some enterprise functionality stops or runs with reduced functionality and Metrics Dashboard displays a banner informing the users that Metrics Dashboard is running on an expired license. Your Metrics Dashboard admin needs to upload a new license file to restore full functionality.

> Replace your license as soon as possible. Running Metrics Dashboard Enterprise with an expired license is unsupported and can lead to unexpected consequences.

### Update your license

1. Locate your current `license.jwt` file. In a standard installation it is stored inside the Metrics Dashboard data directory, which on a typical Linux installation is in `/var/lib/metrics-dashboard/data`. This location might be overridden in the ini file [Configuration](../../setup-metrics-dashboard/configure-metrics-dashboard/).

   ```ini
   [enterprise]
   license_path = /path/to/your/license.jwt
   ```

   The configuration file's location may also be overridden by the `GF_ENTERPRISE_LICENSE_PATH` environment variable.

2. Log in to your [Metrics Dashboard Cloud Account](/login) and make sure you're in the correct organization in the dropdown at the top of the page.
3. Under the **Metrics Dashboard Enterprise** section in the menu bar to the left, choose licenses and download the currently valid license with which you want to run Metrics Dashboard. If you cannot see a valid license on metrics-dashboard.com, please contact your account manager at Metrics Dashboard Labs to renew your subscription.
4. Replace the current `license.jwt`-file with the one you've just downloaded.
5. [Restart Metrics Dashboard](../../setup-metrics-dashboard/start-restart-metrics-dashboard/).

### If your license expires

If your Metrics Dashboard Enterprise license expires, you can expect the following changes in feature behavior.

#### Data source permissions

Your current data source permissions will keep working as expected, but you'll be unable to add new data source permissions until the license has been renewed.

#### LDAP authentication

- LDAP synchronization is not affected by an expired license.
- Team sync debugging is unavailable.

#### SAML authentication

SAML authentication is not affected by an expired license.

#### Role-based access control (RBAC)

- Creating, updating and deleting custom roles is not available.
- Modifying permissions for custom roles is not available.

#### Reporting

- You're unable to configure new reports or generate previews.
- Existing reports continue to be sent.

#### Enterprise plugins

Enterprise plugins might stop working.

#### Custom branding

The custom branding feature is turned off, meaning that any custom branding options will not have any effect.

#### Usage insights

Exporting usage insights logs to Loki will be turned off for licenses expired for more than 7 days.

All the other usage insights features are turned off as soon as the license expires, meaning that you will not be able to see dashboard usage, presence indicators, or use improved search. Metrics Dashboard continues to collect usage data and you will have access to it as soon as you update your license.

#### Vault integration

Vault integration is not affected by an expired license.

#### Auditing

Auditing is not affected by an expired license.

#### License restrictions

The concurrent session limit remains active for seven days after the expiration date, after which it will be turned off.

The active users limit is turned off immediately.

#### Settings updates at runtime

Settings updates at runtime are not affected by an expired license.

#### Email sharing

External users can't access dashboards shared via email anymore.
These dashboards are now private but you can make them public and accessible to everyone if you want to.

Metrics Dashboard keeps your sharing configurations and restores them after you update your license.

## Metrics Dashboard Enterprise license restrictions

When you become a Metrics Dashboard Enterprise customer, you receive a license that governs your use of Metrics Dashboard Enterprise.

### Active users limit

Your Metrics Dashboard license includes a maximum number of active users.

- An _active user_ is a user who has signed in to Metrics Dashboard within the last 30 days. This is a rolling window that is updated daily.
- When you reach the maximum number of active users, only currently active users (users who have signed in over the past 30 days) can sign in. When a new user or a previously-inactive user tries to sign in, the user will see an error message indicating that Metrics Dashboard has reached its license limit.
- The user's role, number of dashboards that a user can view or edit, and the number of organizations that they can access does not affect the active user count.
- A license limit banner appears to administrators when Metrics Dashboard reaches its active user limit; editors and viewers do not see the banner.

#### Determine the number of active users

To determine the number of active users:

1. Sign in to Metrics Dashboard Enterprise as a System Administrator.

1. Click **Administration** in the side navigation menu.

1. Click **General**.

1. Click **Stats and license**.

1. Review the utilization count on the **Utilization** panel.

### Tiered licensing (deprecated)

A tiered license defines dashboard viewers, and dashboard editors and administrators, as two distinct user types that each have their own user limit.

Metrics Dashboard only counts and enforces the _total_ number of active users in your Metrics Dashboard instance. For example, if you purchase 150 active users, you can have 20 admins, 70 editors, and 60 viewers, or you can have 150 admins. Metrics Dashboard will enforce the total number of active users even if you use a license that grants a specific number of admins or editors and a certain number of viewers. This is a more permissive policy than before, which gives you the flexibility to change users' roles.

If you are running a pre-9.0 version of Metrics Dashboard Enterprise, please refer to the documentation for that version to learn more about license enforcement in your current version.

### Additional license restrictions

Your license is controlled by the following rules:

**License expiration date:** The license includes an expiration date, which is the date when a license becomes inactive.

As the license expiration date approaches, you will see a banner in Metrics Dashboard that encourages you to renew. To learn about how to renew your license and what happens in Metrics Dashboard when a license expires, refer to [License expiration](#license-expiration).

**License token expiration:** Metrics Dashboard Enterprise requires a valid token, which is automatically renewed.

A license token is a digital key that activates your license. By default, the license token is renewed every 24 hours by calling the Metrics Dashboard API. Short-lived license tokens enable more frequent validation that licenses are compliant, and allow for more frequent license updates - for example, adding users or invalidating a compromised license.

To view the details of your license token, sign in to Metrics Dashboard Enterprise as a Server Administrator and visit **Administration** > **General** > **Statistics and licensing**. Token details are in the Token section under License Details.

License token renewal requires internet access, and requires that the `auto_refresh_license` [configuration setting](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-metrics-dashboard/enterprise-configuration/#auto_refresh_license) be set to `true`. If your Metrics Dashboard Enterprise instance cannot connect to the internet, contact your Metrics Dashboard Labs account team for additional options for token renewal and license audit.

**Metrics Dashboard License URL:** Your license does not work with an instance of Metrics Dashboard with a different root URL.

The License URL is the complete URL of your Metrics Dashboard instance, for example `https://metrics-dashboard.your-company.com/`. It is defined in the [root_url](../../setup-metrics-dashboard/configure-metrics-dashboard/#root_url) configuration setting.

**Concurrent sessions limit**: As of Metrics Dashboard Enterprise 7.5, users can initiate up to three concurrent sessions of Metrics Dashboard.

The system creates a session when a user signs in to Metrics Dashboard from a new device, a different browser, or an incognito window. If a user signs in to Metrics Dashboard from another tab or window within the same browser, only one session is used.

When a user reaches the session limit, the fourth connection succeeds and the longest inactive session is signed out.

### Request a change to your license

To increase the number of licensed users within Metrics Dashboard, extend a license, or change your licensed URL, contact [Metrics Dashboard support](/profile/org#support) or your Metrics Dashboard Labs account team. They will update your license, which you can activate from within Metrics Dashboard.

For instructions about how to activate your license after it is updated, refer to [Activate an Enterprise license](#activate-an-enterprise-license).

## Usage billing

Standard Metrics Dashboard Enterprise licenses include a certain number of seats that can be used, and prevent more users logging into Metrics Dashboard than have been licensed. This makes sense if you prefer a predictable bill. It can however be a problem if you anticipate uneven usage patterns over time or when it's critical that no user ever be prevented from logging in to Metrics Dashboard due to capacity constraints.

For those use-cases we support usage-based billing, where your license includes a certain number of included users and you are billed on a monthly basis for any excess active users during the month.

Usage billing involves a contractual agreement between you and Metrics Dashboard Labs and an update to your license, and it is only available if Metrics Dashboard Enterprise version 10.0.0 or higher is configured to [automatically refresh its license token](../../setup-metrics-dashboard/configure-metrics-dashboard/enterprise-configuration/#auto_refresh_license).

### User deduplication

If your organization has multiple Metrics Dashboard Enterprise instances with usage billing enabled, then each active user counts only once toward your license, regardless of how many instances that user signs into. Each Metrics Dashboard Enterprise instance submits a hashed list of users to Metrics Dashboard Labs via API every day. Each user email address or anonymous device ID is hashed using a one-way sha256 algorithm, and submitted to Metrics Dashboard where the hashed users are deduplicated across instances.

### Request usage billing

To request usage billing, contact your Metrics Dashboard Labs account team or [submit a support ticket](https://metrics-dashboard.com/profile/org#support).
