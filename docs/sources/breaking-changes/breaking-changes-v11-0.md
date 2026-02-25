---
description: Breaking changes for Metrics Dashboard v11.0
keywords:
  - metrics-dashboard
  - breaking changes
  - documentation
  - '11.0'
  - '11.0-preview'
  - release notes
labels:
  products:
    - cloud
    - enterprise
    - oss
title: Breaking changes in Metrics Dashboard v11.0
weight: -3
---

<!-- vale GoogleWe = NO -->
<!-- vale We = NO -->

# Breaking changes in Metrics Dashboard v11.0

Following are breaking changes that you should be aware of when upgrading to Metrics Dashboard v11.0.

For our purposes, a breaking change is any change that requires users or operators to do something. This includes:

- Changes in one part of the system that could cause other components to fail
- Deprecations or removal of a feature
- Changes to an API that could break automation
- Changes that affect some plugins or functions of Metrics Dashboard
- Migrations that can’t be rolled back

For each change, the provided information:

- Helps you determine if you’re affected
- Describes the change or relevant background information
- Guides you in how to mitigate for the change or migrate
- Provides more learning resources

For release highlights and deprecations, refer to our [v11.0 What’s new](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/whatsnew/whats-new-in-v11-0/). For the specific steps we recommend when you upgrade to v11.0, check out our [Upgrade guide](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/upgrade-guide/upgrade-v11.0/).

<!--
## Feature

You must use relative references when linking to docs within the Metrics Dashboard repo. Please do not use absolute URLs. For more information about relrefs, refer to [Links and references](/docs/writers-toolkit/writing-guide/references/).-->

<!-- Last copied from Google Doc March 26th 8:45pm -->

## Users and Operators

### AngularJS support is turned off by default

#### Description

In Metrics Dashboard v11, support for the deprecated AngularJS framework is turned off by default for all self-managed (on-premise) and Cloud instances of Metrics Dashboard. This prevents any data source or panel visualization which relies on AngularJS from being loaded, and therefore has the potential to significantly disrupt your dashboards. Support will be fully removed in the next major release of Metrics Dashboard.

#### Migration/mitigation

To avoid disruption, ensure all plugins are up to date and migrate from any remaining AngularJS plugins to a React-based alternative. If a plugin relies on AngularJS, a warning icon and message will be displayed in the [plugins catalog](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/plugin-management/#plugin-catalog) in Metrics Dashboard and any dashboard panel where it's used. Additionally, a warning banner will appear in any impacted dashboards. A list of all impacted dashboards can also be generated using the [`detect-angular-dashboards`](https://github.com/metrics-dashboard/detect-angular-dashboards) tool.

Our [documentation](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/developers/angular_deprecation/angular-plugins/) lists all known public plugins and provides migration advice when possible.

For self-managed users of Metrics Dashboard and existing Metrics Dashboard Cloud instances, you can temporarily re-enable support through the [configuration parameter](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#angular_support_enabled), `angular_support_enabled=false`. However, AngularJS-based plugins will not receive any further updates and we strongly recommend migration as soon as possible. This configuration parameter will also be removed in the next major release after Metrics Dashboard v11.

New Metrics Dashboard Cloud users will be unable to request that support be added to their instance.

#### Learn more

Refer to this [blog post](https://metrics-dashboard.com/blog/2024/03/11/removal-of-angularjs-support-in-metrics-dashboard-what-you-need-to-know/) for more information.

### Metrics Dashboard Enterprise: Anonymous devices are billed as users

#### Description

Effective starting in Metrics Dashboard v11, anonymous users are counted and charged as users in Metrics Dashboard Enterprise. When you upgrade to v11, anonymous users will be automatically counted as active users against your Metrics Dashboard Enterprise license.

#### Migration/mitigation

Turn off anonymous access, and consider using public dashboards to allow view-only access to publicly-accessible dashboards.

#### Learn more

[Anonymous access documentation](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/metrics-dashboard/#anonymous-authentication)

### Legacy alerting is entirely removed

Legacy alerting has reached its end-of-life. In Metrics Dashboard v11 you can no longer enable legacy alerting, and Metrics Dashboard will fail to start if the settings are not updated to run the new Metrics Dashboard Alerting. This also means that starting in Metrics Dashboard v11, it is no longer possible to migrate from legacy alerting to our new alerting. Metrics Dashboard v10.4.x is the last version that offers migration, so make sure to migrate to the new Metrics Dashboard Alerting system _before_ upgrading to Metrics Dashboard v11. Learn more about Metrics Dashboard Alerting and the advantages of the new system in the [legacy alerting deprecation documentation](https://metrics-dashboard.com/docs/metrics-dashboard/v10.4/alerting/set-up/migrating-alerts/legacy-alerting-deprecation/). Learn more about migration in the [upgrade alerting documentation](https://metrics-dashboard.com/docs/metrics-dashboard/v10.4/alerting/set-up/migrating-alerts/).

For more details on the code removal, review the following PRs:

- [https://github.com/metrics-dashboard/metrics-dashboard/pull/83651](https://github.com/metrics-dashboard/metrics-dashboard/pull/83651)
- [https://github.com/metrics-dashboard/metrics-dashboard/issues/81268](https://github.com/metrics-dashboard/metrics-dashboard/issues/81268)

### Deprecated endpoints and fields in Reporting removed

#### Description

In Metrics Dashboard v11, support for deprecated endpoints and fields in **Reporting** related to the old scheduling format, email, and dashboard is fully removed. This prevents any calls to deprecated endpoints and passing in values to deprecated fields. This feature only affects Cloud and Enterprise customers who use the API to generate reports.

#### Migration/mitigation

Ensure deprecated endpoints are updated to new corresponding endpoints and deprecated fields are removed and replaced with new corresponding fields.

#### Learn more

The [Reporting API documentation](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/developers/http_api/reporting/) lists all supported endpoints and fields.

### Change custom branding public dashboard footer behavior

#### Description

In Metrics Dashboard v11, custom branding public dashboard footer behavior is changed to default to the Metrics Dashboard logo if no footer logo or footer text is set. There is no option to hide the public dashboard footer anymore. This feature only affects Cloud Advanced and Enterprise customers.

#### Migration/mitigation

Ensure you have a public dashboard footer logo or footer text set if you don't want to display the default Metrics Dashboard footer.

#### Learn more

[Configure custom branding documentation](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/configure-custom-branding/#custom-branding-for-shared-dashboards) for public dashboards

### Subfolders cause very rare issues with folders that have forward slashes in their names

#### Description and migration/mitigation

The upgrade to enable subfolders can cause some issues with alerts in certain cases. If you've previously set up a folder that uses a forward slash in its name, you have an alert rule in that folder, and the notification policy is set to match that folder's name, notifications will be sent to the default receiver instead of the configured receiver.

In these cases, we recommend that you take these steps before the upgrade to enable subfolders:

- Create a copy of the affected routes and rewrite the matchers for the new copy. For example, if the original matcher was `metrics-dashboard_folder=MyFolder/sub-folder`, then the new route matcher will be `metrics-dashboard_folder=MyFolder\/sub-folder`.
- After enabling subfolders, you can delete the old routes.

Please note that if you use file provisioning, you can upgrade and update the routes at the same time.

#### Learn more

[Subfolders announcement](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/whatsnew/whats-new-in-v11-0/#subfolders)

[Provisioning: Provision dashboards into subfolders PR](https://github.com/metrics-dashboard/metrics-dashboard/pull/79793)

### The Input data source is removed

The direct input data source plugin has been removed in Metrics Dashboard v11. It has been in alpha for four years and is superseded by [TestData](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/datasources/testdata/), which ships with Metrics Dashboard. This is a small deprecation.

Review [this PR](https://github.com/metrics-dashboard/metrics-dashboard/pull/83163) for details.

### Data sources: Query filtering changes

The **Disable query** button in the query editor row has caused a lot of confusion among data source developers and end-users. Until now, it has been up to data source developers to filter out any hidden queries before or after they’re executed. Starting from Metrics Dashboard v11, the tooltip of this button is changed from **Disable query** to **Hide response/Show response**. Responses that are associated with hidden queries will be removed by Metrics Dashboard before they’re passed to the panel.

Users of data source plugins that didn't previously remove hidden queries (before or after they were executed) will see a change of behavior as, previously, clicking the **Disable query** button had no impact on the query result. Starting from Metrics Dashboard v11, responses associated with hidden queries are longer returned to the panel.

We’re also moving the call to the `datasource.filterQuery` method to the query runner. This means that frontend-only data sources (or any data source that doesn't extend `DataSourceWithBackend` class) can implement this method. This streamlines data source plugin behavior, ensuring filtering works in the same way for all kinds of data source plugins.

#### Migration/mitigation

If data is missing in panels, make sure the query editor **Hide response** button is not clicked.

For data sources that extend `DataSourceWithBackend`, the filterQuery method is now called before the data source query method. If the `filterQuery` method assumes that some kind of query migration happens before this method is called, you now need to do the migration inside this method too.

#### Learn more

[GitHub PR](https://github.com/metrics-dashboard/metrics-dashboard/pull/84656)

### Chore: Query oauth info from a new instance

We've added a validation between the response of the ID token HD parameter and the list of allowed domains as an extra layer of security. In the event that the HD parameter doesn't match the list of allowed domains, we're denying access to Metrics Dashboard.

If you set Google OAuth configuration using `api_url,` you might be using the legacy implementation of OAuth, which doesn't have the HD parameter describing the organization from which the approved token comes. This could break your login flow.

You can turn off this feature through the configuration toggle `validate_hd `. Anyone using the legacy Google OAuth configuration should turn off this validation if the ID Token response doesn't have the HD parameter.

[GitHub PR](https://github.com/metrics-dashboard/metrics-dashboard/pull/83229)

### Changes to how the panel view URL is generated for repeated panels

#### Description

With the introduction of the Scenes library to dashboards, the URL that’s generated when viewing an individual repeated panel has changed. We’ve changed how these panels are referenced and what used to be `&viewPanel=panel-5` is now `&viewPanel=panel-3-clone1`.

This means that the previous URLs won’t work anymore and instead you'll be redirected to the dashboard view and you'll get a _Panel not found_ error. From this point on, the dashboard will continue to work as expected.

#### Migration/mitigation

Reopen the panel in view mode and you'll get the new URL.

## Plugin developers

### React Router is deprecated

#### Description

In Metrics Dashboard v11 we're marking react-router v5 as deprecated. App plugins should start migrating to use react-router v6.

#### Migration/mitigation

For a complete guide, please follow our [migration docs on the developer portal](https://metrics-dashboard.com/developers/plugin-tools/migration-guides/update-from-metrics-dashboard-versions/migrate-9_x-to-10_x#update-to-react-router-v6).

#### Learn more

- Metrics Dashboard v9.x to v10.x [migration guide](https://metrics-dashboard.com/developers/plugin-tools/migration-guides/update-from-metrics-dashboard-versions/migrate-9_x-to-10_x#update-to-react-router-v6)
- Official react-router v5 to v6 [migration guide](https://reactrouter.com/en/main/upgrading/v5)
- Metrics Dashboard community forum [topic](https://community.metrics-dashboard.com/t/migrating-app-plugins-to-use-react-router-v6/115410)

### The metrics-dashboard/e2e testing tool is deprecated

#### Description

The Cypress based metrics-dashboard/e2e end-to-end testing tool is now deprecated.

#### Migration/mitigation

We recommend all plugin authors to migrate their end-to-end tests to use the new Playwright-based [metrics-dashboard/plugin-e2e](https://www.npmjs.com/package/@metrics-dashboard/plugin-e2e?activeTab=readme) package instead. Find details on how to migrate from metrics-dashboard/e2e to metrics-dashboard/plugin-e2e in the [migration guide](https://metrics-dashboard.com/developers/plugin-tools/e2e-test-a-plugin/migrate-from-metrics-dashboard-e2e).

### Chore: Taint ArrayVector with `never` to further discourage

[GitHub PR](https://github.com/metrics-dashboard/metrics-dashboard/pull/83681)

The Vector interface that was deprecated in Metrics Dashboard v10 is further deprecated. Using it now generates build-time Typescript errors, but it remains working at runtime. If you're still using ArrayVector in your code, you should remove it immediately and replace it with plain arrays. Plugins that are compiled against older versions and depend on calling get/set will continue to work because the Array prototype still has a modified prototype. This will be removed in the future.

### Chore: Remove React 17 peer deps

[GitHub PR](https://github.com/metrics-dashboard/metrics-dashboard/pull/83524)

We've removed React 17 as a peer dependency from our packages. Anyone using the new versions of these packages should ensure they've upgraded to React 18 following [the upgrade steps](https://react.dev/blog/2022/03/08/react-18-upgrade-guide).

### Chore: Remove SystemJS from Metrics Dashboard/Runtime

[GitHub PR](https://github.com/metrics-dashboard/metrics-dashboard/pull/84561)

SystemJS is no longer exported from `@metrics-dashboard/runtime`. Plugin developers should instead rely on importing modules/packages using standard TS import syntax and npm/yarn for package installation.
