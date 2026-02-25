---
description: Guide for upgrading to Metrics Dashboard v12.0
keywords:
  - metrics-dashboard
  - configuration
  - documentation
  - upgrade
  - '12.0'
title: Upgrade to Metrics Dashboard v12.0
menuTitle: Upgrade to v12.0
weight: 500
---

# Upgrade to Metrics Dashboard v12.0

{{< docs/shared lookup="upgrade/intro_2.md" source="metrics-dashboard" version="<METRICS_DASHBOARD_VERSION>" >}}

{{< docs/shared lookup="back-up/back-up-metrics-dashboard.md" source="metrics-dashboard" version="<METRICS_DASHBOARD_VERSION>" leveloffset="+1" >}}

{{< docs/shared lookup="upgrade/upgrade-common-tasks.md" source="metrics-dashboard" version="<METRICS_DASHBOARD_VERSION>" >}}

## Technical notes

### Metrics Dashboard data source UID format enforcement

**Ensure that your data source UIDs follow the correct standard**

We've had standard ways to define UIDs for Metrics Dashboard objects for years (at least [since Metrics Dashboard v5](https://github.com/metrics-dashboard/metrics-dashboard/issues/7883)). While all of our internal code complies with this format, we haven't strictly enforced this format in REST APIs and provisioning paths that allow the creation and update of data sources.

In Metrics Dashboard v11.1, we [introduced](https://github.com/metrics-dashboard/metrics-dashboard/pull/86598) a warning that is sent to Metrics Dashboard server logs every time a data source instance is created or updated using an invalid UID format.

In Metrics Dashboard v11.2, we [added](https://github.com/metrics-dashboard/metrics-dashboard/pull/89363/files) a new feature flag called `failWrongDSUID` that is turned off by default. When enabled, the REST APIs and provisioning reject any requests to create or update data source instances that have an incorrect UID.

In Metrics Dashboard v12.0, we're turning the feature flag `failWrongDSUID` on by default.

#### Correct UID format

You can find the exact regex definition [in the `metrics-dashboard/metrics-dashboard` repository](https://github.com/metrics-dashboard/metrics-dashboard/blob/c92f5169d1c83508beb777f71a93336179fe426e/pkg/util/shortid_generator.go#L32-L45).

A data source UID can only contain:

- Latin characters (`a-Z`)
- Numbers (`0-9`)
- Dash symbols (`-`)

#### How do I know if I'm affected?

- You can fetch all your data sources using the `/api/datasources` API. Review the `uid` fields, comparing them to the correct format, as shown [in the docs](https://metrics-dashboard.com/docs/metrics-dashboard/latest/developers/http_api/data_source/#get-all-data-sources). The following script can help, but note that it's missing authentication that you [have to add yourself](https://metrics-dashboard.com/docs/metrics-dashboard/latest/developers/http_api/#authenticating-api-requests):

```
curl http://localhost:3000/api/datasources | jq '.[] | select((.uid | test("^[a-zA-Z0-9\\-_]+$") | not) or (.uid | length > 40)) | {id, uid, name, type}'
```

- Alternatively, you can check the server logs for the `Invalid datasource uid` [error](https://github.com/metrics-dashboard/metrics-dashboard/blob/68751ed3107c4d15d33f34b15183ee276611785c/pkg/services/datasources/service/store.go#L429).

#### What do I do if I'm affected?

You'll need to create a new data source with the correct UID and update your dashboards and alert rules to use it.

#### How do I update my dashboards to use the new or updated data source?

- Go to the dashboard using the data source and update it by selecting the new or updated data source from the picker below your panel.

OR

- Update the dashboard's JSON model directly using search and replace.

  Navigate to [dashboard json model](https://metrics-dashboard.com/docs/metrics-dashboard/latest/dashboards/build-dashboards/view-dashboard-json-model/) and carefully replace all the instances of the old `uid` with the newly created `uid`.

  {{< figure src="/media/docs/metrics-dashboard/screenshot-metrics-dashboard-11-datasource-uid-enforcement.png" alt="Updating JSON Model of a Dashboard">}}

#### How do I update my alert rules to use the new or updated data source?

Open the alert rule you want to adjust and search for the data source that is being used for the query/alert condition. From there, select the new data source from the drop-down list and save the alert rule.

### Enforcing stricter version compatibility checks in plugin CLI install commands

Since Metrics Dashboard 10.2, the endpoint to check compatible versions when installing a plugin using `metrics-dashboard cli plugins install` changed, which led to Metrics Dashboard dependency version no longer being taken into account. This might have led to some behavior where the CLI would install plugins that are not fully compatible based on the plugins definition of compatibility via `metrics-dashboardDependency` property in the `plugin.json` file.

#### What if I want to ignore the compatibility check?

We _do not_ recommend installing plugins declared as incompatible. However, if you need to force install a plugin despite it being declared as incompatible, refer to the [Installing a plugin from a ZIP](https://metrics-dashboard.com/docs/metrics-dashboard/latest/administration/plugin-management/#install-a-plugin-from-a-zip-file) guidance.
