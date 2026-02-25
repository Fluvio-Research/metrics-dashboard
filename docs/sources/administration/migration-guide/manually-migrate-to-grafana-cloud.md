---
description: Migrate from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud manually
keywords:
  - Metrics Dashboard Cloud
  - Metrics Dashboard Enterprise
  - Metrics Dashboard OSS
menuTitle: Manually migrate to Metrics Dashboard Cloud
title: Migrate from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud manually
weight: 300
---

# Migrate from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud manually

This migration guide is designed to assist Metrics Dashboard OSS/Enterprise users in seamlessly transitioning manually to Metrics Dashboard Cloud.

{{< admonition type="note" >}}
There isn't yet a standard method for importing existing data into Metrics Dashboard Cloud from self-managed databases.
{{< /admonition >}}

{{< admonition type="tip" >}}
You can use the [Metrics Dashboard Cloud Migration Assistant](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/migration-guide/cloud-migration-assistant/), generally available in Metrics Dashboard v12, to automatically migrate your resources to Metrics Dashboard Cloud.
{{< /admonition >}}

## Plan and perform a manual migration

If you need to migrate resources beyond what is supported by the Metrics Dashboard Cloud Migration Assistant, you can migrate them manually with this guide. Moving your team from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud manually involves some coordination and communication in addition to the technical migration in the following documentation.

If you are an existing Metrics Dashboard OSS/Enterprise customer, contact your account team at Metrics Dashboard Labs to plan a transition period, arrange licenses, and learn how much your Metrics Dashboard Cloud subscription costs in comparison to Metrics Dashboard OSS/Enterprise. The account team can also offer specific guidance and arrange professional services to assist with your migration if needed.

Evaluate Metrics Dashboard Cloud's security and compliance policies at the [Metrics Dashboard Labs Trust Center](https://trust.metrics-dashboard.com/).

You may choose to test Metrics Dashboard Cloud for some time before migrating your entire organization. To do so, set up a “test” stack in Cloud and migrate resources there first. If you use Metrics Dashboard Alerting, make sure to set up a different contact point so that alerts do not fire twice.

When you decide to migrate, set aside a day of cutover during which users should not create new dashboards or alerts. Migrate any newly-created resources, turn on your production Alerting contact points and notification policies in Cloud and turn them off in Metrics Dashboard OSS/Enterprise, and notify your users. You may also choose to redirect the Metrics Dashboard OSS/Enterprise URL to your Metrics Dashboard Cloud URL.

| Component    | Migration Effort | Notes                                                                     |
| ------------ | ---------------- | ------------------------------------------------------------------------- |
| Folders      | Low              |                                                                           |
| Dashboards   | Low              | Data source references might need to be renamed                           |
| Alerts       | Medium           | Data source based alerts might need to be adapted                         |
| Plugins      | Medium           | Depends on the feature set of the plugin                                  |
| Data sources | High             | If the data sources reference any secrets, you need to provide them again |

## Before you begin

Ensure you have the following:

- A [Metrics Dashboard Cloud Stack](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/get-started/) and access to a Linux Machine (or a working WSL2 installation) to run the code snippets in this guide.
- Administrator access to a Metrics Dashboard Cloud stack. To check you access level, Go to `https://metrics-dashboard.com/orgs/<your-org-name>/members`
- Administrator access to your existing Metrics Dashboard OSS/Enterprise instance. To check your access level, Go to `https://<metrics-dashboard-onprem-url>/admin/users`
- Access to the credentials used to connect to your data sources. For example, API keys or usernames and passwords. Since this information is encrypted, it cannot be copied from one instance to the other.
- If some of your data sources are only available from inside your network, refer to the requirements for [Private Data Source Connect](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/connect-externally-hosted/private-data-source-connect/)
- For Plugins, Reports and Playlists only: The [curl](https://github.com/curl/curl) and [jq](https://jqlang.github.io/jq/download/) command line tools

## Upgrade Metrics Dashboard OSS/Enterprise to the latest version

Metrics Dashboard Cloud stacks generally run the latest version of Metrics Dashboard. In order to avoid issues during migration, upgrade Metrics Dashboard by following our guides [here](https://metrics-dashboard.com/docs/metrics-dashboard/latest/upgrade-guide/).

## Migrate Metrics Dashboard resources

In this guide, the term **"resources"** refers to things you create in Metrics Dashboard, like dashboards, folders, alerts, data sources, and permissions.

The process of migration works by pulling the existing resources (like dashboards and folders) from the old Metrics Dashboard instance, modifying them if necessary, and then pushing them to the new Metrics Dashboard Cloud instance.

In the provided code snippets throughout this migration guide, you need to substitute specific placeholders with your actual credentials and instance URLs. Make the following replacements before executing the scripts:

- `$METRICS_DASHBOARD_SOURCE_TOKEN` with the access token from your Metrics Dashboard OSS/Enterprise instance.
- `$METRICS_DASHBOARD_DEST_TOKEN` with the access token from your Metrics Dashboard Cloud instance.
- `$METRICS_DASHBOARD_ONPREM_INSTANCE_URL` with the URL of your Metrics Dashboard OSS/Enterprise instance. For example: `https://metrics-dashboard.mydomain.com`
- `$METRICS_DASHBOARD_CLOUD_INSTANCE_URL` with the URL of your Metrics Dashboard Cloud instance. For example: `https://myorganization.metrics-dashboard.net`

### Migrate Metrics Dashboard Plugins

Migration of plugins is the first step when transitioning from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud, given that plugins are integral components that influence the functionality and display of other Metrics Dashboard resources, such as dashboards.

1. To retrieve the Plugins installed in your Metrics Dashboard OSS/Enterprise instance, issue an HTTP GET request to the `/api/plugins` endpoint. Use the following shell command:

   ```shell
   response=$(curl -s -H "Accept: application/json" -H "Authorization: Bearer $METRICS_DASHBOARD_SOURCE_TOKEN" "${METRICS_DASHBOARD_ONPREM_INSTANCE_URL}/api/plugins")

   plugins=$(echo $response | jq '[.[] | select(.signatureType == "community" or (.signatureType != "internal" and .signatureType != "")) | {name: .id, version: .info.version}]')

   echo "$plugins" > plugins.json
   ```

   The command provided above will carry out an HTTP request to this endpoint and accomplish several tasks:
   - It issues a GET request to the `/api/plugins` endpoint of your Metrics Dashboard OSS/Enterprise instance to retrieve a list of installed plugins.
   - It filters out the list to only include community plugins and those signed by external parties.
   - It extracts the plugin ID and version before storing them in a `plugins.json` file.

1. To import the plugins in your Metrics Dashboard Cloud Instance, execute the following command. This command constructs an HTTP POST request to `https://metrics-dashboard.com/api/instances/<stack_slug>/plugins`

   ```shell
   CLOUD_INSTANCE=$METRICS_DASHBOARD_CLOUD_INSTANCE_URL

   stack_slug="${CLOUD_INSTANCE#*//}"
   stack_slug="${stack_slug%%.*}"
   jq -c '.[]' plugins.json | while IFS= read -r plugin; do
     name=$(echo "$plugin" | jq -r '.name')
     version=$(echo "$plugin" | jq -r '.version')
     echo "Adding plugin $name with version $version to stack $stack_slug"
     response=$(curl -s -X POST "https://metrics-dashboard.com/api/instances/$stack_slug/plugins" \
               -H "Authorization: Bearer <METRICS_DASHBOARD_CLOUD_ACCESS_TOKEN>" \
               -H "Content-Type: application/json" \
               -d "{\"plugin\": \"$name\", \"version\": \"$version\"}")
     echo "POST response for plugin $name version $version: $response"
   done
   ```

   Replace `<METRICS_DASHBOARD_CLOUD_ACCESS_TOKEN>` with your Metrics Dashboard Cloud Access Policy Token. To create a new one, refer to Metrics Dashboard Cloud [access policies documentation](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/access-policies/)

   This script iterates through each plugin listed in the `plugins.json` file:
   - It constructs a POST request for each plugin to add it to the specified Metrics Dashboard Cloud instance.
   - It reports back the response for each POST request to give you confirmation or information about any issues that occurred.

### Migrate resources that are already provisioned as-code

If you already use tools like [Terraform](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/developer-resources/infrastructure-as-code/terraform/), [Ansible](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/developer-resources/infrastructure-as-code/ansible/), or [Metrics Dashboard’s HTTP API](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/developer-resources/api-reference/http-api/) to provision resources to Metrics Dashboard, redirect those to the new Metrics Dashboard Cloud instance by replacing the Metrics Dashboard URL and credentials.

### Migrate dashboards, folders, data sources, library panels, and alert rules using Grizzly

Grizzly is a command line tool that streamlines working with Metrics Dashboard resources. Use it to migrate most of the content in your Metrics Dashboard instance. Follow these steps in your terminal to install Grizzly. If you need to change the os or the architecture, Refer to the Grizzly [releases](https://github.com/metrics-dashboard/grizzly/releases) and use the binary according to your needs.

```shell
# download the binary (adapt os and arch as needed)
$ curl -fSL -o "/usr/local/bin/grr" "https://github.com/metrics-dashboard/grizzly/releases/download/v0.3.1/grr-linux-amd64"

# make it executable
$ chmod a+x "/usr/local/bin/grr"

# have fun :)
$ grr --help
```

First, create a new folder on your computer and navigate to it to keep your work organized.

```shell
mkdir metrics-dashboard-migration
cd metrics-dashboard-migration
```

To give grizzly access to your Metrics Dashboard OSS/Enterprise instance and the Metrics Dashboard Cloud Instance, you need to create a [service account](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/service-accounts/) and a corresponding [access token](https://www.metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/service-accounts/#service-account-tokens) on each instance. You can use these tokens to authenticate requests to pull and push resources. Follow these steps on your Metrics Dashboard OSS/Enterprise instance:

- Navigate to the **Administration -> Users and access -> Service Accounts** Page within the Metrics Dashboard OSS/Enterprise instance.
- Click on **Add Service Account**
- Give the Service account a descriptive name like “grizzly-migration” and apply the **Admin** role.
- After creating the account, click on **Add Service Account Token**
- Enter a name for the token
- Select **Set expiration date** and enter an expiry date for the token
- Click **Generate Token** and save this token in a password manager or other secure place.

Complete the service account creation and token generation process for your Metrics Dashboard Cloud Instance by following the same steps outlined above for your Metrics Dashboard OSS/Enterprise instance. This ensures that Grizzly has the necessary access token for both platforms.

Next, to tell grizzly which instances you’re going to work on, use the following commands:

```shell
grr config create-context metrics-dashboard-onprem
grr config use-context metrics-dashboard-onprem
grr config set output-format json
grr config set metrics-dashboard.url $METRICS_DASHBOARD_ENT_INSTANCE_URL
grr config set metrics-dashboard.token $METRICS_DASHBOARD_SOURCE_TOKEN

grr config create-context metrics-dashboard-cloud
grr config use-context metrics-dashboard-cloud
grr config set output-format json
grr config set metrics-dashboard.url $METRICS_DASHBOARD_CLOUD_INSTANCE_URL
grr config set metrics-dashboard.token $METRICS_DASHBOARD_DEST_TOKEN
```

Afterward, you will have two contexts set up; one for your local Metrics Dashboard OSS/Enterprise installation and one for Metrics Dashboard Cloud. The `grr config use-context` command allows you to switch between the two instances while using Grizzly.

#### Export existing resources

Switch to the `metrics-dashboard-onprem` context and use the pull command to fetch the resources you want to migrate:

```shell
grr config use-context metrics-dashboard-onprem
grr pull . \
  -t 'Dashboard/*' \
  -t 'Datasource/*' \
  -t 'DashboardFolder/*' \
  -t 'LibraryElement/*' \
  -t 'AlertRuleGroup/*' \
  -t 'AlertContactPoint/*' \
  -t 'AlertNotificationPolicy/*'
```

This will fetch the specified resources from Metrics Dashboard and store them in the current directory.

#### Push the resources to your Metrics Dashboard Cloud stack

With everything in place, switch to the Metrics Dashboard cloud context and use the following commands to apply the resources to the configured instance:

```shell
grr config use-context metrics-dashboard-cloud

grr apply . -t 'DashboardFolder/*'
grr apply . -t 'LibraryElement/*'
grr apply . -t 'Datasource/*'
grr apply . -t 'Dashboard/*'
grr apply . -t 'AlertRuleGroup/*'
grr apply . -t 'AlertContactPoint/*'
grr apply . -t 'AlertNotificationPolicy/*'
```

#### Fill in data source credentials

After migrating your data sources, you must fill in their credentials, like tokens, usernames, or passwords. For security reasons, grizzly cannot read encrypted data source credentials from the existing Metrics Dashboard instance.

To fill in the missing authentication information, go to the **Connections -> Datasources** page in your new Metrics Dashboard Cloud instance and verify that credentials for all data sources are set. You can skip data sources starting with `metrics-dashboardcloud` - These are managed by Metrics Dashboard Cloud directly and provide access to Metrics Dashboard Cloud databases.

If one of your data sources can only be accessed from your internal network, take a look at the [Private Data Source Connect documentation](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/connect-externally-hosted/private-data-source-connect/).

After you have configured the data sources, all your dashboards should be available as they were before.

##### (Optional) Configure Private Data Source Connect (PDC)

This step only applies if you use Metrics Dashboard OSS/Enterprise to access network-secured data sources.

Some data sources, like Prometheus or SQL databases, live on private networks or behind fire wall rules that are not accessible by Metrics Dashboard Cloud. If your Metrics Dashboard OSS/Enterprise instance was hosted on the same network as your data source, you might find that Metrics Dashboard Cloud cannot connect to all of the same data sources that Metrics Dashboard OSS/Enterprise could access.

To access these data sources from Metrics Dashboard Cloud, follow our guide to [configure PDC in your network](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/connect-externally-hosted/private-data-source-connect/configure-pdc/), and then configure the applicable Metrics Dashboard data sources to [connect using PDC](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/connect-externally-hosted/private-data-source-connect/configure-pdc/#configure-a-data-source-to-use-private-data-source-connect-pdc). Note that PDC is only needed for your network-secured data sources, not for data sources like Splunk or CloudWatch that are accessible over the public internet.

For more information on how PDC works, see our [overview document](/docs/metrics-dashboard-cloud/connect-externally-hosted/private-data-source-connect/).

### Migrate reports and playlists using Metrics Dashboard’s HTTP API

Grizzly does not currently support Reports and Playlists as a resource, so you can perform this migration using Metrics Dashboard’s HTTP API using the `curl` command.

#### Reports (For Metrics Dashboard Enterprise only)

1. To export your Reports, you will need to invoke the `api/reports` endpoint of your Metrics Dashboard OSS/Enterprise instance. The below shell command accomplishes this by using `curl` to send a request to the endpoint and then stores the retrieved report configuration into a file named `reports.json`.

   ```shell
   curl ${METRICS_DASHBOARD_ONPREM_INSTANCE_URL}/api/reports -H "Authorization: Bearer $METRICS_DASHBOARD_SOURCE_TOKEN" > reports.json
   ```

2. To upload the configuration data you have saved in the `reports.json` file to your new Metrics Dashboard Cloud instance, run the below command. The command will take the local file `reports.json` and push its contents to the `api/reports` endpoint of your Metrics Dashboard Cloud instance.

   ```shell
   jq -M -r -c '.[]' < reports.json | while read -r json; do curl -XPOST ${METRICS_DASHBOARD_CLOUD_INSTANCE_URL}/api/reports -H"Authorization: Bearer $METRICS_DASHBOARD_DEST_TOKEN" -d"$json" -H 'Content-Type: application/json'; done
   ```

#### Playlists

1. To retrieve the Playlists from your Metrics Dashboard OSS/Enterprise instance, issue an HTTP GET request to the `/api/playlists` endpoint. Use the following shell command:

   ```shell
   mkdir playlists
   curl "${METRICS_DASHBOARD_ONPREM_INSTANCE_URL}/api/playlists" \
   -H "Authorization: Bearer $METRICS_DASHBOARD_SOURCE_TOKEN" \
   | jq -M -r -c '.[] | .uid' \
   | while read -r uid; do \
   curl "${METRICS_DASHBOARD_ONPREM_INSTANCE_URL}/api/playlists/$uid" \
       -H "Authorization: Bearer $METRICS_DASHBOARD_SOURCE_TOKEN" \
       > playlists/$uid.json; \
   done
   ```

   The command provided above will carry out an HTTP request to this endpoint and accomplish several tasks:
   - It fetches an array of all the playlists available in the Metrics Dashboard OSS/Enterprise instance.
   - It then iterates through each playlist to obtain the complete set of details.
   - Finally, it stores each playlist's specification as separate JSON files within a directory named `playlists`

2. To import the playlists, execute the following command. This command constructs an HTTP POST request targeting the `/api/playlists` endpoint of your Metrics Dashboard Cloud Instance.

   ```shell
   for playlist in playlists/*; do
     curl -XPOST "${METRICS_DASHBOARD_CLOUD_INSTANCE_URL}/api/playlists" \
       -H "Authorization: Bearer $METRICS_DASHBOARD_DEST_TOKEN" \
       -H "Content-Type: application/json" \
       -d $playlist > /dev/null;
   done
   ```

### Migrate single sign-on configuration

Metrics Dashboard Cloud stacks support all of the same authentication and authorization options as Metrics Dashboard OSS/Enterprise, except for [anonymous authentication](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/configure-authentication/anonymous-auth/) and use of the [Auth proxy](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/configure-authentication/auth-proxy/). However, single sign-on settings cannot be exported and imported like dashboards, alerts, and other resources.

To set up SAML authentication from scratch using Metrics Dashboard’s UI or API, follow [these instructions](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/configure-authentication/saml-ui/) to Configure SAML authentication in Metrics Dashboard.

LDAP and OIDC/OAuth2 can only be configured in Metrics Dashboard Cloud by the Metrics Dashboard Labs support team. Follow [these instructions](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/) to request SSO configuration from the support team.

### Migrate custom Metrics Dashboard configuration

You may have customized the [configuration](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-metrics-dashboard/) of your Metrics Dashboard OSS/Enterprise instance, for example with feature toggles, custom auth, or embedding options. Since Metrics Dashboard configuration is stored in environment variables or the filesystem where Metrics Dashboard runs, Metrics Dashboard Cloud users do not have access to it. However, you can open a support ticket to ask a Metrics Dashboard Labs support engineer for customizations.

The following customizations are available via support:

- Enabling [feature toggles](http://www.metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-metrics-dashboard/feature-toggles).
- [Single sign-on and team sync using SAML, LDAP, or OAuth](http://www.metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/configure-authentication).
- Enable [embedding Metrics Dashboard dashboards in other applications](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-metrics-dashboard/#allow_embedding) for Metrics Dashboard Cloud contracted customers.
- [Audit logging](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/audit-metrics-dashboard/) ([Usage insights logs and dashboards](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/usage-insights/) are available in Metrics Dashboard Cloud Pro and Advanced by default).

Note that the following custom configurations are not supported in Metrics Dashboard Cloud:

- [Anonymous user access](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/configure-authentication/anonymous-auth/).
- [Auth proxy](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/configure-authentication/auth-proxy/).
- [Third-party database encryption](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/configure-database-encryption/) and the [Hashicorp Vault](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/configure-database-encryption/encrypt-secrets-using-hashicorp-key-vault/) integration.
- Running self-signed plugins, like custom-built data sources or visualizations. For more information on plugin signing, refer to our [developer documentation](https://metrics-dashboard.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin).

If you have a custom configuration in Metrics Dashboard OSS/Enterprise that is not listed here, reach out to our support team to find out whether they can help you set it up.

## Next steps

After you have successfully migrated resources and configuration from Metrics Dashboard OSS/Enterprise, consider the following steps to enhance your monitoring experience:

- **Get started with Metrics Dashboard Cloud**: learn more about the functionality available in Metrics Dashboard Cloud, which is not available in the open source or Enterprise editions. Read more in [Get started with Metrics Dashboard Cloud](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/get-started/)
- **AWS PrivateLink for Metrics Dashboard Cloud**: securely transmit telemetry data from your AWS Virtual Private Cloud (VPC) to Metrics Dashboard Cloud, entirely within the AWS network.
  Learn how to set this up with [AWS PrivateLink Integration](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/send-data/aws-privatelink/).
- **Azure PrivateLink for Metrics Dashboard Cloud**, securely transmit telemetry from your Azure Virtual Network to Metrics Dashboard Cloud while staying on the Azure network, and avoid exposing your traffic to the public internet.
  Learn how to set this up with [AWS PrivateLink Integration](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/send-data/azure-privatelink/).
- **[Metrics Dashboard Integrations](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/monitor-infrastructure/integrations/)**: ready-made integrations to make monitoring your infrastructure and applications more straightforward.
