---
description: Migrate from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud using the Metrics Dashboard Cloud Migration Assistant
keywords:
  - Metrics Dashboard Cloud
  - Metrics Dashboard Enterprise
  - Metrics Dashboard OSS
menuTitle: Migrate to Metrics Dashboard Cloud using the Metrics Dashboard Cloud Migration Assistant
title: Migrate from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud using the Metrics Dashboard Cloud Migration Assistant
weight: 400
---

# Metrics Dashboard Cloud Migration Assistant

The Metrics Dashboard Cloud Migration Assistant, generally available from Metrics Dashboard v12.0, automatically migrates resources from your Metrics Dashboard OSS/Enterprise instance to Metrics Dashboard Cloud. It provides the following functionality:

- Securely connect your self-managed instance to a Metrics Dashboard Cloud instance.
- Seamlessly migrate resources such as dashboards, data sources, and folders to your cloud instance in a few easy steps.
- View the migration status of your resources in real-time.

Some of the benefits of the migration assistant are:

Ease of use
: Follow the steps provided by the UI to easily migrate all your resources to Metrics Dashboard Cloud without using Metrics Dashboard APIs or scripts.

Security
: Encrypt and securely migrate your resources to your connected Metrics Dashboard Cloud instance.

Speed
: Migrate all of your resources in minutes and accelerate your transition to Metrics Dashboard Cloud.

## Supported resources

The following resources are supported by the migration assistant:

- Dashboards
- Folders
- Data sources
- App Plugins
- Panel Plugins
- Library Panels
- Metrics Dashboard Alerting resources

## Before you begin

To use the Metrics Dashboard migration assistant, you need:

- Metrics Dashboard v11.2 or above with the `onPremToCloudMigrations` feature toggle enabled. In Metrics Dashboard 11.5, this is enabled by default. For more information on how to enable a feature toggle, refer to [Configure feature toggles](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/feature-toggles/#configure-feature-toggles).
- A [Metrics Dashboard Cloud Stack](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/get-started/) you intend to migrate your resources to.
- [`Admin`](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/cloud-roles/) access to the Metrics Dashboard Cloud Stack. To check your access level, go to `https://metrics-dashboard.com/orgs/<YOUR-ORG-NAME>/members`.
- [Metrics Dashboard server administrator](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/#metrics-dashboard-server-administrators) access to your existing Metrics Dashboard OSS/Enterprise instance. To check your access level, go to `https://<METRICS_DASHBOARD-ONPREM-URL>/admin/users`.
- Internet access from your existing Metrics Dashboard OSS/Enterprise instance.
- If you are running Metrics Dashboard in a [highly-available setup](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/set-up-for-high-availability/), we recommend scaling Metrics Dashboard down to one replica to avoid a [known bug](https://github.com/metrics-dashboard/metrics-dashboard/issues/107264).
- If your network requires external services to be on an allowlist to allow access, add the following IPs and URLs to your allowlist:
  - [Hosted Metrics Dashboard](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/security-and-account-management/allow-list/#hosted-metrics-dashboard)
  - [Hosted Alerts](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/security-and-account-management/allow-list/#hosted-alerts)
  - [AWS IP address ranges](https://docs.aws.amazon.com/en_us/vpc/latest/userguide/aws-ip-ranges.html) for the S3 service
  - `*.metrics-dashboard.net`

## Access the migration assistant

In Metrics Dashboard OSS, access to the migration assistant is limited to the server administrator.

In Metrics Dashboard Enterprise, the server administrator has access to the migration assistant by default. It is also possible to grant access to other Admins using a role-based access control (RBAC) role that enables other admins on the Metrics Dashboard instance to view, build snapshots, and upload resources to Metrics Dashboard Cloud.

### Grant access in Metrics Dashboard Enterprise

{{< admonition type="important">}}
You must [configure RBAC](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/configure-rbac/) before you can grant other administrators access to the Metrics Dashboard Migration Assistant.
{{< /admonition >}}

To grant other Admins access to the migration assistant in Metrics Dashboard Enterprise:

1. Sign in to Metrics Dashboard as a server administrator.
1. Navigate to **Home** > **Administration** > **Users and access** > **Users** in the Metrics Dashboard sidebar.
1. Click an Admin.
1. In the **Organizations** section, click **Change role**.
1. Select **Organization resource migrator** from the role selector menu under **Migration Assistant**.

   ![The Organization resource migrator role in the role picker](/media/docs/metrics-dashboard-cloud/account-management/screenshot-grant-migration-assistant-access.png)

1. Click **Apply**.

## Use the migration assistant

You can use the migration assistant to generate a migration token on your Metrics Dashboard Cloud instance, use that token to connect your self-managed Metrics Dashboard instance to your Metrics Dashboard Cloud instance, build snapshots of your self-managed Metrics Dashboard instance, and upload these snapshots to Metrics Dashboard Cloud.

### Generate a migration token on the destination cloud instance:

1. Navigate to **Home** > **Administration** > **General** > **Migrate to Metrics Dashboard Cloud** in the cloud instance where you intend to migrate your resources.
1. Click on the **Generate a migration token** button.
1. Make a copy of the migration token by copying to clipboard. The token is required to authenticate your self-managed instance with the Metrics Dashboard Cloud Stack.

### Connect your self-managed Metrics Dashboard instance to the Metrics Dashboard Cloud Stack

1. On your self-managed Metrics Dashboard instance, navigate to **Home** > **Administration** > **General** > **Migrate to Metrics Dashboard Cloud**.

1. Click the **Migrate this instance to Cloud** button.

1. Enter your token in the **Migration token** field and click **Connect to this Stack**.

### Build a snapshot

After connecting to the cloud stack, this is the empty state of the migration assistant. You need to create a snapshot of the self-managed Metrics Dashboard instance to upload it to the cloud stack.

1. From Metrics Dashboard v12.0, select the checkbox next to each resource you want to migrate to your cloud stack.

   {{< admonition type="note" >}}
   Some resources can't be uploaded to your cloud stack alone because they rely on other resources:
   | Desired resource | Requires |
   | :---- | :---- |
   | Dashboards | <ul><li>Library Elements</li> <li>Data Sources</li> <li>Plugins</li> <li>Folders</li></ul> |
   | Library Elements | Folders |
   | Data Sources | Plugins |
   | Plugins | Nothing else |
   | Folders | Nothing else |
   | All Alert rule groups | All other resources |
   | Alert Rules | <ul><li>Dashboards</li> <li>Library Elements</li> <li>Data Sources</li> <li>Plugins</li> <li>Folders</li> <li>Notification Policies</li> <li>Notification Templates</li> <li>Contact Points</li> <li>Mute Timings</li></ul> |
   | Notification Policies | <ul><li>Notification Templates</li> <li>Contact Points</li> <li>Mute Timings</li></ul> |
   | Notification Templates | Nothing else |
   | Contact Points | Notification Templates |
   | Mute Timings | Nothing else |
   {{< /admonition >}}

   In Metrics Dashboard v11.2 to v11.6, you can't select specific resources to include in the snapshot, such as only dashboards. All supported resources are included by default.

1. Click **Build snapshot**

   ![A list of resources selected for migration and the Build snapshot button](/media/docs/metrics-dashboard/screenshot-metrics-dashboard-12-select-resources.png)

### Upload resources to the cloud

After a snapshot is created, a list of resources appears with resource Type and Status populated with **Not yet uploaded**.

1. Click on **Upload snapshot** to copy the resources to the Metrics Dashboard Cloud instance.

1. Use the assistant's real-time progress tracking to monitor the migration. The status changes to 'Uploaded to cloud' for resources successfully copied to the cloud.

   From Metrics Dashboard v12.0, you can group and sort resources during and after the migration:
   - Click **Name** to sort resources alphabetically.
   - Click **Type** to group and sort by resource type.
   - Click **Status** to group and sort by upload status (pending upload, uploaded successfully, or experienced errors).

   The Snapshot information also updates to inform the user of total resources, errors, and total number of successfully migrated resources.

   ![An updates list of resources with snapshots built after attempting to upload them to Metrics Dashboard Cloud](/media/docs/metrics-dashboard/screenshot-metrics-dashboard-12-updated-snapshot-page.png)

1. Review error details for any issues that need manual resolution.

## Snapshots created by the migration assistant

The migration assistant currently supports a subset of all resources available in Metrics Dashboard. Refer to [Supported Resources](#supported-resources) for more details.

When you create a snapshot, the migration assistant makes a copy of all the resources you select and saves them in the snapshot. The snapshot reflects the current state of the resources when the snapshot is built and is stored locally on your instance, ready to be uploaded in the last stage.

{{< admonition type="note" >}}
In Metrics Dashboard v11.2 to v11.6, you can't select specific resources to include in the snapshot, such as only dashboards. All supported resources are included by default.
{{< /admonition >}}

Resources saved in the snapshot are strictly limited to the resources stored within an organization. This is important to note if there are multiple organizations used in your Metrics Dashboard instance. If you want to migrate multiple organizations, refer to [Migrate multiple organizations](#migrate-multiple-organizations) for more information and guidance.

## Resource migration details

During a migration, resource UIDs are preserved, allowing you to correlate your local and cloud resources. If you perform the same migration multiple times, resources in your Metrics Dashboard Cloud stack that were previously migrated are updated. The assistant never modifies your self-managed resources or cloud resources that didn't come from a snapshot.

### Dashboards and folders

Dashboard names and UIDs are preserved along with references to data sources. Folder hierarchy is also preserved, so you can find your dashboards and other resources saved in identical folder locations.

### Data sources

Your data sources, including credentials, are migrated securely and seamlessly to your Metrics Dashboard Cloud instance, so you don't need to find and enter all your data source credentials again.

### Plugins

The migration assistant supports any plugins found in the plugins catalog. As long as the plugin is signed or is a core plugin built into Metrics Dashboard, it can be migrated. Due to security reasons, unsigned plugins are not supported in Metrics Dashboard Cloud. If you are using any unsigned private plugins, Metrics Dashboard recommends you seek an alternative plugin from the catalog or work on a strategy to deprecate certain functionality from your self-managed instance.

Upgrade any plugins you intend to migrate before using the migration assistant as any migrated plugins will be configured on the Metrics Dashboard Cloud instance as the latest version of that plugin.

{{< admonition type="caution">}}
If you want to migrate Enterprise plugins, check what type of plan your Metrics Dashboard Cloud instance is on and whether or not this plan requires an Enterprise plugin add-on.
{{< /admonition >}}

### Metrics Dashboard Alerting resources

The migration assistant can migrate the majority of Metrics Dashboard Alerting resources to your Metrics Dashboard Cloud instance. These include:

- Alert rules
- Notifications
- Contact points
- Mute timings
- Notification policy tree
- Notification templates

{{< admonition type="note">}}
The `metrics-dashboard-default-email` contact point that's provisioned with every new Metrics Dashboard instance doesn't have a UID by default and won't be migrated unless you edit or update and save it. You do not need to change the contact point for a UID to be generated when saved.
{{< /admonition >}}

This is sufficient to have your Alerting configuration up and running in Metrics Dashboard Cloud with minimal effort.

#### Migration assistant limitations on Metrics Dashboard Alerting resources

Migration of Silences is not supported by the migration assistant and needs to be configured manually. Alert History is also not available for migration.

Attempting to migrate a large number of alert rules might result in the following error:

```
Maximum number of alert rule groups reached: Delete some alert rule groups or upgrade your plan and try again.
```

To avoid this, refer to the [Alert rule limits in Metrics Dashboard Cloud](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/alerting-and-irm/alerting/alerting-rules/create-metrics-dashboard-managed-rule/#alert-rule-limits-in-metrics-dashboard-cloud) when migrating alert rules.

#### Prevent duplicated alert notifications

Successfully migrating Alerting resources to your Metrics Dashboard Cloud instance could result in 2 sets of notifications being generated:

1. From your OSS/Enterprise instance

1. From the newly migrated alerts in your Metrics Dashboard Cloud instance

To avoid double notifications, a new `alert_rules_state` configuration option in the `custom.ini` or `metrics-dashboard.ini` file controls how Alert Rules are migrated to the Metrics Dashboard Cloud instance and is set to `paused` by default so you can review and test your Alerting resources in your Metrics Dashboard Cloud instance without duplicate notifications.

The available options for `alert_rule_state` are:

`paused`
: Creates all Alert rules in paused state on the Cloud instance. This is helpful to avoid double notifications.

`unchanged`
: The Alert rules maintain their original state coming from the source instance.

When you are ready to start using your alert rules and notifications from your Metrics Dashboard Cloud instance, run the migration again with `alert_rules_state = unchanged`.

### Resource permissions

Because the migration assistant does not yet migrate teams or RBAC permissions, your resources are migrated with default permissions. Ensure that you reconfigure permissions in your cloud stack as needed following a migration. For more information, refer to [Metrics Dashboard Cloud user roles and permissions](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/cloud-roles/).

## Migrate multiple organizations

If you are using the [organizations](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/organization-management/#about-organizations) feature on your Metrics Dashboard Instance and intend to migrate to Metrics Dashboard Cloud, you need to plan this aspect of the migration carefully.

The organizations feature is not supported in Metrics Dashboard Cloud, but folders and RBAC can be used to protect and grant permissions to resources instead. The recommended path is to migrate multiple organizations to a single cloud stack. This is the simplest option and provides the best user experience.

The migration assistant creates and uploads snapshots based on the resources within a specific organization. There is no option to migrate an entire Metrics Dashboard instance with multiple organizations at once. You need to run the migration process for each organization you want to migrate.

The Metrics Dashboard server administrator is granted access to the migration assistant by default. The server administrator can perform the migration by switching organizations and running the migration assistant each time. The Metrics Dashboard server administrator can also grant access to the migration assistant to organization administrators who are members using the RBAC **Migration Assistant:Organization resource migrator** role. This allows those organization administrators to run the migration process for their respective organizations.

### Access Control and managing resources in the Cloud Instance

The main driver for setting up organizations in the first place is resource isolation. In order to achieve this in Metrics Dashboard Cloud, you can organize resources into folders and set up teams and permissions that correspond to your organizations.

For more information about configuring teams and permissions, refer to [Configure Metrics Dashboard Teams](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/team-management/configure-metrics-dashboard-teams/).
