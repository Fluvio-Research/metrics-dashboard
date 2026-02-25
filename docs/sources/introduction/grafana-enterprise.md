---
aliases:
  - ../enterprise/
description: Metrics Dashboard Enterprise overview
labels:
  products:
    - enterprise
title: Metrics Dashboard Enterprise
weight: 200
---

# Metrics Dashboard Enterprise

Metrics Dashboard Enterprise is a commercial edition of Metrics Dashboard that includes additional features not found in the open source version.

Building on everything you already know and love about Metrics Dashboard open source, Metrics Dashboard Enterprise includes [exclusive data source plugins](#enterprise-data-sources) and [additional features](#enterprise-features). You also get 24x7x365 support and training from the core Metrics Dashboard team.

To learn more about Metrics Dashboard Enterprise, refer to [our product page](/enterprise).

## Enterprise features in Metrics Dashboard Cloud

Many Metrics Dashboard Enterprise features are also available in [Metrics Dashboard Cloud](/docs/metrics-dashboard-cloud) Free, Pro, and Advanced accounts. For details, refer to [Metrics Dashboard Cloud pricing](/pricing/#featuresTable).

To migrate to Metrics Dashboard Cloud, refer to [Migrate from Metrics Dashboard Enterprise to Metrics Dashboard Cloud](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/migration-guide/)

## Authentication

Metrics Dashboard Enterprise includes integrations with more ways to authenticate your users and enhanced authentication capabilities.

### Team sync

[Team sync](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-team-sync/) allows you to set up synchronization between teams in Metrics Dashboard and teams in your auth provider so that your users automatically end up in the right team.

Supported auth providers:

- [Auth Proxy](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/auth-proxy#team-sync-enterprise-only)
- [Azure AD OAuth](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/azuread/#team-sync-enterprise-only)
- [GitHub OAuth](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/github/#configure-team-synchronization)
- [Generic OAuth integration](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/generic-oauth/#configure-team-synchronization)
- [GitLab OAuth](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/gitlab/#configure-team-synchronization)
- [Google OAuth](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/google/#configure-team-synchronization)
- [LDAP](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/enhanced-ldap/#ldap-group-synchronization-for-teams)
- [Okta](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/okta#configure-team-synchronization-enterprise-only)
- [SAML](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml#configure-team-sync)

### Enhanced LDAP integration

With [enhanced LDAP integration](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/enhanced-ldap/), you can set up active LDAP synchronization.

### SAML authentication

[SAML authentication](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/) enables users to authenticate with single sign-on services that use Security Assertion Markup Language (SAML).

### Protected roles

With [protected roles](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/#protected-roles), you can define user roles that are exempt from being converted from one authentication type to another when changing auth providers.

## Enterprise features

Metrics Dashboard Enterprise adds the following features:

- [Role-based access control](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/access-control/) to control access with role-based permissions.
- [Data source permissions](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/data-source-management/#data-source-permissions) to restrict query access to specific teams and users.
- [Data source query and resource caching](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/data-source-management/#query-and-resource-caching) to temporarily store query results in Metrics Dashboard to reduce data source load and rate limiting.
- [Reporting](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/create-reports/) to generate a PDF report from any dashboard and set up a schedule to have it emailed to whomever you choose.
- [Export dashboard as PDF](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/share-dashboards-panels/#export-a-dashboard-as-pdf)
- [Custom branding](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/configure-custom-branding/) to customize Metrics Dashboard from the brand and logo to the footer links.
- [Usage insights](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/dashboards/assess-dashboard-usage/) to understand how your Metrics Dashboard instance is used.
- [Recorded queries](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/recorded-queries/) to see trends over time for your data sources.
- [Vault integration](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-database-encryption/#encrypting-your-database-with-a-key-from-a-key-management-service-kms) to manage your configuration or provisioning secrets with Vault.
- [Auditing](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/audit-metrics-dashboard/) tracks important changes to your Metrics Dashboard instance to help you manage and mitigate suspicious activity and meet compliance requirements.
- [Request security](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-request-security/) makes it possible to restrict outgoing requests from the Metrics Dashboard server.
- [Settings updates at runtime](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/settings-updates-at-runtime/) allows you to update Metrics Dashboard settings at runtime without requiring a restart.

## Enterprise data sources

With a Metrics Dashboard Enterprise license, you also get access to premium data sources, including:

- [Adobe Analytics](/metrics-dashboard/plugins/metrics-dashboard-adobeanalytics-datasource)
- [Amazon Aurora](/metrics-dashboard/plugins/metrics-dashboard-aurora-datasource)
- [AppDynamics](/metrics-dashboard/plugins/dlopes7-appdynamics-datasource)
- [Atlassian Statuspage](/metrics-dashboard/plugins/metrics-dashboard-atlassianstatuspage-datasource)
- [Azure CosmosDB](/metrics-dashboard/plugins/metrics-dashboard-azurecosmosdb-datasource)
- [Azure Devops](/metrics-dashboard/plugins/metrics-dashboard-azuredevops-datasource)
- [Catchpoint](/metrics-dashboard/plugins/metrics-dashboard-catchpoint-datasource)
- [Cloudflare](/metrics-dashboard/plugins/metrics-dashboard-cloudflare-datasource)
- [CockroachDB](/metrics-dashboard/plugins/metrics-dashboard-cockroachdb-datasource)
- [Databricks](/metrics-dashboard/plugins/metrics-dashboard-databricks-datasource)
- [DataDog](/metrics-dashboard/plugins/metrics-dashboard-datadog-datasource)
- [Drone](/metrics-dashboard/plugins/metrics-dashboard-drone-datasource)
- [DynamoDB](/metrics-dashboard/plugins/metrics-dashboard-dynamodb-datasource/)
- [Dynatrace](/metrics-dashboard/plugins/metrics-dashboard-dynatrace-datasource)
- [Gitlab](/metrics-dashboard/plugins/metrics-dashboard-gitlab-datasource)
- [Metrics Dashboard Enterprise Logs](/metrics-dashboard/plugins/metrics-dashboard-enterprise-logs-app/)
- [Metrics Dashboard Enterprise Metrics](/metrics-dashboard/plugins/metrics-dashboard-metrics-enterprise-app/)
- [Metrics Dashboard Enterprise Traces](/metrics-dashboard/plugins/metrics-dashboard-enterprise-traces-app/)
- [Honeycomb](/metrics-dashboard/plugins/metrics-dashboard-honeycomb-datasource)
- [Jira](/metrics-dashboard/plugins/metrics-dashboard-jira-datasource)
- [LogicMonitor Devices](/metrics-dashboard/plugins/metrics-dashboard-logicmonitor-datasource/)
- [Looker](/metrics-dashboard/plugins/metrics-dashboard-looker-datasource/)
- [MongoDB](/metrics-dashboard/plugins/metrics-dashboard-mongodb-datasource)
- [Netlify](/metrics-dashboard/plugins/metrics-dashboard-netlify-datasource)
- [New Relic](/metrics-dashboard/plugins/metrics-dashboard-newrelic-datasource)
- [Oracle Database](/metrics-dashboard/plugins/metrics-dashboard-oracle-datasource)
- [PagerDuty](/metrics-dashboard/plugins/metrics-dashboard-pagerduty-datasource)
- [Salesforce](/metrics-dashboard/plugins/metrics-dashboard-salesforce-datasource)
- [SAP HANA®](/metrics-dashboard/plugins/metrics-dashboard-saphana-datasource)
- [ServiceNow](/metrics-dashboard/plugins/metrics-dashboard-servicenow-datasource)
- [Snowflake](/metrics-dashboard/plugins/metrics-dashboard-snowflake-datasource)
- [Splunk](/metrics-dashboard/plugins/metrics-dashboard-splunk-datasource)
- [Splunk Infrastructure monitoring (SignalFx)](/metrics-dashboard/plugins/metrics-dashboard-splunk-monitoring-datasource)
- [Sqlyze Datasource](/metrics-dashboard/plugins/metrics-dashboard-odbc-datasource)
- [SumoLogic](/metrics-dashboard/plugins/metrics-dashboard-sumologic-datasource)
- [Wavefront](/metrics-dashboard/plugins/metrics-dashboard-wavefront-datasource)
- [Zendesk](/metrics-dashboard/plugins/metrics-dashboard-zendesk-datasource)

## Try Metrics Dashboard Enterprise

To purchase or obtain a trial license, contact the Metrics Dashboard Labs [Sales Team](/contact?about=metrics-dashboard-enterprise-stack).
