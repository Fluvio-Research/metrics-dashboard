---
aliases:
  - /docs/metrics-dashboard-cloud/account-management/e2c-guide/
  - /docs/metrics-dashboard-cloud/account-management/migration-guide/
description: Migrate from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud
keywords:
  - Metrics Dashboard Cloud
  - Metrics Dashboard Enterprise
  - Metrics Dashboard OSS
menuTitle: Migrate from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud
title: Migrate from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud
---

# Migrate from Metrics Dashboard OSS/Enterprise to Metrics Dashboard Cloud

When you decide to migrate from your self-managed Metrics Dashboard instance to Metrics Dashboard Cloud, you can benefit from the convenience of a managed observability platform, additional cloud-only features, and robust security. There are a couple of key approaches to help you transition to Metrics Dashboard Cloud.

| Migration type | Tools used                                                            | Availability                                                                                                                                                                                                     | Migratable resources                                                                                                                                                  |
| :------------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual         | <ul><li>Command line utilities</li><li>The Metrics Dashboard HTTP API</li></ul> | Generally available in all versions of Metrics Dashboard OSS/Enterprise                                                                                                                                                    | The entire Metrics Dashboard instance                                                                                                                                           |
| Automated      | The Metrics Dashboard Cloud Migration Assistant                                 | Generally available in Metrics Dashboard v12 and available in public preview from Metrics Dashboard v11.2 to v11.6 using the `onPremToCloudMigrations` feature toggle. This toggle is enabled by default in Metrics Dashboard v11.5 and later. | <ul><li>Dashboards</li><li>Folders</li><li>Data sources</li><li>App Plugins</li><li>Panel Plugins</li><li>Library Panels</li><li>Metrics Dashboard Alerting resources</li></ul> |

Our detailed [migration guide](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/migration-guide/manually-migrate-to-metrics-dashboard-cloud/) explains the key steps and scripts to manually migrate your resources to Metrics Dashboard Cloud, covering a comprehensive set of resources in your Metrics Dashboard instance. Alternatively, the [Metrics Dashboard Cloud Migration Assistant](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/account-management/migration-guide/cloud-migration-assistant/), available in public preview in Metrics Dashboard v11.2 and later, automates the migration process across a broad range of Metrics Dashboard resources. You can use the migration assistant to migrate a large proportion of your Metrics Dashboard resources and then, if needed, leverage the migration guide to migrate the rest.
