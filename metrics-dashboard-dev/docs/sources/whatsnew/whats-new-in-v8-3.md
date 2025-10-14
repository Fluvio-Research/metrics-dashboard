---
_build:
  list: false
aliases:
  - ../guides/whats-new-in-v8-3/
description: Learn about new and updated features in Metrics Dashboard v8.3
keywords:
  - metrics-dashboard
  - new
  - documentation
  - '8.3'
  - release notes
labels:
  products:
    - cloud
    - enterprise
    - oss
title: What's new in Metrics Dashboard v8.3
weight: -33
---

# What's new in Metrics Dashboard v8.3

Metrics Dashboard 8.3 is an exciting release for Metrics Dashboard Labs. This release includes the new Candlestick Panel, a new visualization suggestions engine and, for enterprise users, Recorded Queries.

For Open Source users it also marks the first time Metrics Dashboard Alerting, formerly unified alerting, is enabled by default for new Metrics Dashboard installations. Metrics Dashboard Alerting in 8.3 is the flexible, single pane of glass for all your alerts. Included in this release is expanded provisioning support for notifiers, contact points, and alert rules, alongside auditing and role-based access control for our Enterprise customers.

We’ve summarized what’s new in the release here, but you might also be interested in the announcement blog post as well. If you’d like all the details you can check out the complete [CHANGELOG.md](https://github.com/metrics-dashboard/metrics-dashboard/blob/main/CHANGELOG.md).

## Metrics Dashboard OSS

### Community Contributions

Metrics Dashboard 8.3 includes many community contributions including the ability to interpolate variables in tags ([#42318](https://github.com/metrics-dashboard/metrics-dashboard/pull/42318)), fly-out sub-menu support ([#41647](https://github.com/metrics-dashboard/metrics-dashboard/pull/41647)), the addition of AWS RoboMaker & AWS Global Accelerator metrics to the AWS CloudWatch data source ([#41450](https://github.com/metrics-dashboard/metrics-dashboard/pull/41450), [#41236](https://github.com/metrics-dashboard/metrics-dashboard/pull/41236)), as well as updates to the news panel ([#41193](https://github.com/metrics-dashboard/metrics-dashboard/pull/41193)), the plugin catalog ([#40917](https://github.com/metrics-dashboard/metrics-dashboard/pull/40917)), and many more. The Metrics Dashboard Labs team is deeply grateful for all those who take the time to contribute and participate in the development of Metrics Dashboard.

### Accessibility

We’ve continued to make progress on improving Metrics Dashboard’s accessibility. In Metrics Dashboard 8.3 we’ve updated the main menu with improved keyboard navigation. We’ve also improved Metrics Dashboard’s behavior when navigating through elements with the tab key (tab stops) and finished our work to make Metrics Dashboard’s viewer roles compatible with assistive technologies such as screen readers. You can read our accessibility statement here and reach out to us with accessibility issues using our community Slack or our community forums.

### Dashboards and Visualizations

#### Panel Suggestions

Metrics Dashboard will now make suggestions for visualization types based on the current data surfaced by a query or queries in a panel. This makes seeing available, possible interpretations of your data more straightforward and can be a useful jumping-off point when building panels and dashboards with specific goals in mind.

{{< figure src="/static/img/docs/panels/panel_suggestions_8_3.png" max-width="1200px" caption="Panel suggestionss" >}}

#### Candlestick Panel (Beta)

Metrics Dashboard 8.3 includes a new Candlestick panel that is so much more. Beyond candlesticks and open, high, low, close, behaviors, it includes customizable up/down colors, bar color determined by intra-period or inter-period movement of the data, volume histogram with matching colors, and the ability to detach or create a separate volume histogram to allow for more flexible dashboard design. The candlestick panel is based upon our time series panel meaning it also has support for additional data with the same configuration options and styles.

{{< figure src="/static/img/docs/candlestick-panel/candlestick-panel-8-3.png" max-width="1200px" caption="Candlestick panel" >}}

#### Geomap updates

The Geomap panel has been updated to support multiple data layers. The panel can now be configured with multiple markers, heatmaps & GeoJSON layers. The layers can be individually configured, named, and re-ordered to create rich, multidimensional visualizations. Please see the documentation for details on how you can set up and configure these new configuration options.

{{< figure src="/static/img/docs/geomap-panel/geomap_8_3.png" max-width="1200px" caption="Geomap panel updates" >}}

### Metrics Dashboard Alerting

Metrics Dashboard Alerting is now the default alerting experience for all new Open Source installations of Metrics Dashboard 8.3. Metrics Dashboard Alerting in 8.3 includes the ability to test contact points and notification routing. Metrics Dashboard 8.3 also adds the ability to configure and use external, Prometheus-style alert managers from within the Metrics Dashboard Alerting workflow.

{{< figure src="/static/img/docs/alerting/alerting_8_0.png" max-width="1200px" caption="Metrics Dashboard Alerting" >}}

### Support for AWS CloudWatch Metrics Insights

Metrics Dashboard and Amazon Managed Metrics Dashboard now support AWS Metrics Insights – a fast, flexible, SQL-based query engine that enables you to identify trends and patterns across millions of operational metrics in real time.

You can use Metrics Insights in the AWS CloudWatch plugin. Using this new feature is as simple as selecting the Metric Query type. The Metric Query type has two different modes: a Builder mode and a Code editor mode.

The example below demonstrates using the new Metrics Insight capability to view the top 5 instances with the highest average CPU Utilization, ordered by maximum, in descending order. The code editor has built-in autocompletion support that gives suggestions throughout the composition of the query.

{{< figure src="/static/img/docs/cloudwatch/cloudwatch-code-editor-autocomplete-8.3.0.gif" max-width="1200px" caption="Metrics Dashboard Alerting" >}}

## Metrics Dashboard Enterprise

### Recorded Queries

Recorded queries turn “point in time” data into time series.

Recorded queries allow you to export the results of certain non-time series queries to the Enterprise backend in order to store data over time and allow customers to construct their own time series.

This new feature is especially helpful for Enterprise customers using plugins because many new plugins, like ServiceNow and Jira, don’t return time series so customers weren’t able to plot historical data over time. With recorded queries, now they can! For more information

### Assign role-based permissions directly to users with the new role picker (beta)

Sometimes the Viewer, Editor, and Admin roles just don’t fit what a certain user needs to do in Metrics Dashboard. Now you can assign role-based roles directly to users, so they can create reports, use Explore mode, create data sources, and perform other specific actions in Metrics Dashboard. The role picker can be access from the Metrics Dashboard Admin user management page.

{{< figure src="/static/img/docs/enterprise/enterprise_role_picker_8_3.png" max-width="1200px" caption="Metrics Dashboard Enterprise Role Picker" >}}

### Use role-based access control for Organizations and Licensing (beta)

We’ve added new permissions to role-based access control to help you specify actions that users can perform. Now you can assign permissions to manage Organizations and License functions in Metrics Dashboard, in addition to Users, Data Sources, Reports, and other resources. Role-based access control remains in beta and we will continue to add new permissions until all of Metrics Dashboard’s endpoints are covered. For a complete list of the actions you can permit using role-based access control, see the [reference](/docs/metrics-dashboard/next/enterprise/access-control/fine-grained-access-control-references/).

### Get your encryption key from a Key Management Service

Metrics Dashboard’s database contains secrets, like the credentials used to query data sources, send alert notifications and perform other functions within Metrics Dashboard. These secrets are encrypted using keys, which are usually stored in Metrics Dashboard’s configuration file. Now you can get your encryption key from Amazon KMS, Azure Key Vault, or Hashicorp Vault. This allows you to centrally manage your Metrics Dashboard encryption key and reduce the chances it will leak.

In order to support this, we’ve upgraded Metrics Dashboard Enterprise to use envelope encryption, which complements the KMS integration by adding a layer of indirection to the encryption process. Instead of encrypting all secrets with a single key, Metrics Dashboard uses a set of keys called data encryption keys (DEKs) to encrypt them. These data encryption keys are themselves encrypted with a single key encryption key (KEK). With envelope encryption, you can store a KEK in your KMS, and still quickly encrypt and decrypt data using DEKs stored within the Metrics Dashboard database.

### Pay the same for all users, regardless of their permissions

Are you tired of managing user permissions because your license only allows a certain number of Viewers and Editors or Admins? So were we. We’ve added support for combined user pricing, where all users cost the same and fall into the same license bucket in Metrics Dashboard Enterprise. This is a specific license option and must be updated in your contract. To learn more, refer to our [licensing docs](/docs/metrics-dashboard/latest/enterprise/license/license-restrictions/). To switch to combined user pricing, contact your Metrics Dashboard Labs account team.

{{< figure src="/static/img/docs/enterprise/enterprise_users_8_3.png" max-width="1200px" caption="Metrics Dashboard Enterprise User Pricing" >}}

### Author dashboards faster with resource caching

Your query editor just became faster. [Query caching](/docs/metrics-dashboard/latest/enterprise/query-caching/) improves query performance and sometimes reduces cost, by reducing the number of repetitive queries performed against data sources. Resource caching does the same thing but for resource calls, like retrieving the list of applications in the AppDynamics editor, the list of metrics from Datadog, or the list of values in a template variable dropdown. This makes for a zippier user experience for everyone writing queries in Metrics Dashboard.

### Review audit logs for more services, like alerting

[Audit logs](/docs/metrics-dashboard/latest/enterprise/auditing/) are a record of the actions users perform in Metrics Dashboard, which you can investigate in case of a security incident or to understand Metrics Dashboard usage better. We’ve added audit logs for new actions performed against plugins, data sources, library elements, and Metrics Dashboard’s new alerting service. This ensures that if a user makes a change anywhere in Metrics Dashboard Enterprise, you’ll have a record of it. For details, refer to the [Auditing docs](/docs/metrics-dashboard/latest/enterprise/auditing/).
