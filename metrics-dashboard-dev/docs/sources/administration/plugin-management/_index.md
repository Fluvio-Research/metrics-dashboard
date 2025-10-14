---
aliases:
  - ../plugins/
  - ../plugins/catalog/
  - ../plugins/installation/
  - ../plugins/plugin-signature-verification/
  - ../plugins/plugin-signatures/
labels:
  products:
    - enterprise
    - cloud
    - oss
title: Plugin management
weight: 600
---

# Plugin management

You can enhance your Metrics Dashboard experience with _plugins_, extensions to Metrics Dashboard beyond the wide range of visualizations and data sources that are built-in.

This guide shows you how to [install](#install-a-plugin) plugins that are built by Metrics Dashboard Labs, commercial partners, our community, or plugins that you have [built yourself](/developers/plugin-tools).

## Types of plugins

Metrics Dashboard supports three types of plugins:

- [Panels](/metrics-dashboard/plugins/panel-plugins) - These plugins make it easy to create and add any kind of panel, to show your data, or improve your favorite dashboards.
- [Data sources](/metrics-dashboard/plugins/data-source-plugins) - These plugins allow you to pull data from various data sources such as databases, APIs, log files, and so on, and display it in the form of graphs, charts, and dashboards in Metrics Dashboard.
- [Apps](/metrics-dashboard/plugins/app-plugins) - These plugins enable the bundling of data sources, panels, dashboards, and Metrics Dashboard pages into a cohesive experience.

## Panel plugins

Add new visualizations to your dashboard with panel plugins, such as the [Clock](/metrics-dashboard/plugins/metrics-dashboard-clock-panel), [Mosaic](/metrics-dashboard/plugins/boazreicher-mosaicplot-panel) and [Variable](/metrics-dashboard/plugins/volkovlabs-variable-panel) panels.

Use panel plugins when you want to:

- Visualize data returned by data source queries.
- Navigate between dashboards.
- Control external systems, such as smart home devices.

## Data source plugins

Data source plugins add support for new databases, such as [Google BigQuery](/metrics-dashboard/plugins/metrics-dashboard-bigquery-datasource).

Data source plugins communicate with external sources of data and return the data in a format that Metrics Dashboard understands. By adding a data source plugin, you can immediately use the data in any of your existing dashboards.

Use data source plugins when you want to query data from external or third-party systems.

## App plugins

Applications, or _app plugins_, bundle data sources and panels to provide a cohesive experience, such as the [Zabbix](/metrics-dashboard/plugins/alexanderzobnin-zabbix-app) app.

Apps can also add custom pages for things like control panels.

Use app plugins when you want an out-of-the-box monitoring experience.

### Managing access for app plugins

Customize access to app plugins with [RBAC](../roles-and-permissions/access-control/rbac-for-app-plugins/).

By default, the Viewer, Editor and Admin roles have access to all app plugins that their Organization role allows them to access. Access is granted by the `fixed:plugins.app:reader` role.

{{< admonition type="note" >}}
To prevent users from seeing an app plugin, refer to [these permissions scenarios](../roles-and-permissions/access-control/plan-rbac-rollout-strategy/#prevent-viewers-from-accessing-an-app-plugin).
{{< /admonition >}}

## Plugin catalog

The Metrics Dashboard plugin catalog allows you to browse and manage plugins from within Metrics Dashboard. Only Metrics Dashboard server administrators and Organization administrators can access and use the plugin catalog. For more information about Metrics Dashboard roles and permissions, refer to [Roles and permissions](../roles-and-permissions/).

The following access rules apply depending on the user role:

- If you are an **Org Admin**, you can configure app plugins, but you can't install, uninstall, or update them.
- If you are a **Server Admin**, you can't configure app plugins, but you can install, uninstall, or update them.
- If you are both **Org Admin** and **Server Admin**, you can configure app plugins and also install, uninstall, or update them.

{{< admonition type="note" >}}
The Metrics Dashboard plugin catalog is designed to work with a single Metrics Dashboard server instance only. Support for Metrics Dashboard clusters is planned for future Metrics Dashboard releases.
{{< /admonition >}}

<div class="medium-6 columns">
  <video width="700" height="600" controls>
    <source src="/static/assets/videos/plugins-catalog-install-9.2.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>

_Video shows the Plugin catalog in a previous version of Metrics Dashboard._

{{< admonition type="note" >}}
If required, the Metrics Dashboard plugin catalog can be disabled using the `plugin_admin_enabled` flag in the [configuration](../../setup-metrics-dashboard/configure-metrics-dashboard/#plugin_admin_enabled) file.
{{< /admonition >}}

<a id="#plugin-catalog-entry"></a>

### Browse plugins

To browse for available plugins:

1. While logged into Metrics Dashboard as an administrator, click **Administration > Plugins and data > Plugins** in the side menu to view installed and available plugins.
1. Use the search to filter based on name, keywords, organization and other metadata.
1. Click the **Data sources**, **Panels**, or **Applications** buttons to filter by plugin type.

### Install a plugin

The most common way to install a plugin is through the Metrics Dashboard UI, but alternative methods are also available.

1. In Metrics Dashboard, click **Administration > Plugins and data > Plugins** in the side navigation menu to view all plugins.
1. Browse and find a plugin.
1. Click the plugin's logo.
1. Click **Install**.

There are also additional ways to install plugins depending on your setup.

#### Install a plugin using Metrics Dashboard CLI

Metrics Dashboard CLI allows you to install, upgrade, and manage your Metrics Dashboard plugins using a command line. For more information about Metrics Dashboard CLI plugin commands, refer to [Plugin commands](../../cli/#plugins-commands).

#### Install a plugin from a ZIP file

This method is typically used for plugins not available in the Plugin Catalog or in environments without internet access.

Download the archive containing the plugin assets, and install it by extracting the archive into the plugin directory. For example:

```bash
unzip my-plugin-0.2.0.zip -d YOUR_PLUGIN_DIR/my-plugin
```

The path to the plugin directory is defined in the configuration file. For more information, refer to [Configuration](../../setup-metrics-dashboard/configure-metrics-dashboard/#plugins).

#### Install a plugin using Metrics Dashboard configuration

{{< admonition type="note" >}}
This feature requires Metrics Dashboard 11.5.0 or later.
{{< /admonition >}}

You can install plugins by adding the plugin ID to the `plugins.preinstall` section in the Metrics Dashboard configuration file. This prevents the plugin from being accidentally uninstalled and can be auto-updated. For more information, refer to [Configuration](../../setup-metrics-dashboard/configure-metrics-dashboard/#plugins).

#### Install a plugin in air-gapped environment

Plugin installation usually requires an internet connection. You can check which endpoints are used during the installation on your instance and add them to your instance’s allowlist.

If this is not possible you can go via installing a plugin using [Metrics Dashboard CLI](#install-a-plugin-using-metrics-dashboard-cli) or as a [ZIP file](#install-a-plugin-from-a-zip-file).

You can fetch any plugin from metrics-dashboard.com API following the download link referenced in the API.
Here is an example based on `metrics-dashboard-lokiexplore-app` plugins.

1. Open `https://metrics-dashboard.com/api/plugins/metrics-dashboard-lokiexplore-app` and look for `links` section
1. Find a `download` url which looks something like `https://metrics-dashboard.com/api/plugins/metrics-dashboard-lokiexplore-app/versions/1.0.2/download`
1. Use this URL to download the plugin ZIP file, which you can then install as described above.

#### Install plugins using the Metrics Dashboard Helm chart

With the Metrics Dashboard Helm chart, add the plugins you want to install as a list using the `plugins` field in the your values file. For more information about the configuration, refer to [the Helm chart configuration reference](https://github.com/metrics-dashboard/helm-charts/tree/main/charts/metrics-dashboard#configuration).

The following YAML snippet installs v1.9.0 of the Metrics Dashboard OnCall App plugin and the Redis data source plugin.
You must incorporate this snippet within your Helm values file.

```yaml
plugins:
  - https://metrics-dashboard.com/api/plugins/metrics-dashboard-oncall-app/versions/v1.9.0/download;metrics-dashboard-oncall-app
  - redis-datasource
```

When the update is complete, a confirmation message will indicate the installation was successful.

### Update a plugin

To update a plugin:

1. In Metrics Dashboard, click **Administration > Plugins and data > Plugins** in the side navigation menu to view all plugins.
1. Click the **Installed** filter to show only installed plugins.
1. Click the plugin's logo.
1. Click **Update**.

When the update is complete, a confirmation message will indicate the installation was successful.

### Uninstall a plugin

To uninstall a plugin:

1. In Metrics Dashboard, click **Administration > Plugins and data > Plugins** in the side navigation menu to view all plugins.
1. Click the plugin's logo.
1. Click the **Installed** filter to show only installed plugins.
1. Click **Uninstall**.

When the update is complete, a confirmation message will indicate the installation was successful.

## Plugin signatures

Plugin signature verification, also known as _signing_, is a security measure to make sure plugins haven't been tampered with. Upon loading, Metrics Dashboard checks to see if a plugin is signed or unsigned when inspecting and verifying its digital signature.

At startup, Metrics Dashboard verifies the signatures of every plugin in the plugin directory. If a plugin is unsigned, then Metrics Dashboard neither loads nor starts it. To see the result of this verification for each plugin, navigate to **Configuration** -> **Plugins**.

Metrics Dashboard also writes an error message to the server log:

```bash
WARN[05-26|12:00:00] Some plugin scanning errors were found   errors="plugin '<plugin id>' is unsigned, plugin '<plugin id>' has an invalid signature"
```

If you are a plugin developer and want to know how to sign your plugin, refer to [Sign a plugin](/developers/plugin-tools/publish-a-plugin/sign-a-plugin).

| Signature status   | Description                                                                     |
| ------------------ | ------------------------------------------------------------------------------- |
| Core               | Core plugin built into Metrics Dashboard.                                                 |
| Invalid signature  | The plugin has an invalid signature.                                            |
| Modified signature | The plugin has changed since it was signed. This may indicate malicious intent. |
| Unsigned           | The plugin is not signed.                                                       |
| Signed             | The plugin signature was successfully verified.                                 |

### Plugin signature levels

All plugins are signed under a _signature level_. The signature level determines how the plugin can be distributed.

| **Plugin Level** | **Description**                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Private          | <p>Private plugins are for use on your own Metrics Dashboard. They may not be distributed to the Metrics Dashboard community, and are not published in the Metrics Dashboard catalog.</p>                                                              |
| Community        | <p>Community plugins have dependent technologies that are open source and not for profit.</p><p>Community plugins are published in the official Metrics Dashboard catalog, and are available to the Metrics Dashboard community.</p>         |
| Commercial       | <p>Commercial plugins have dependent technologies that are closed source or commercially backed.</p><p>Commercial plugins are published on the official Metrics Dashboard catalog, and are available to the Metrics Dashboard community.</p> |

### Allow unsigned plugins

{{< admonition type="note" >}}
Unsigned plugins are not supported in Metrics Dashboard Cloud.
{{< /admonition >}}

We strongly recommend that you don't run unsigned plugins in your Metrics Dashboard instance. However, if you're aware of the risks and you still want to load an unsigned plugin, refer to [Configuration](../../setup-metrics-dashboard/configure-metrics-dashboard/#allow_loading_unsigned_plugins).

If you've allowed loading of an unsigned plugin, then Metrics Dashboard writes a warning message to the server log:

```bash
WARN[06-01|16:45:59] Running an unsigned plugin   pluginID=<plugin id>
```

{{< admonition type="note" >}}
If you're developing a plugin, then you can enable development mode to allow all unsigned plugins.
{{< /admonition >}}

## Integrate plugins

You can configure your Metrics Dashboard instance to let the frontends of installed plugins directly communicate locally with the backends of other installed plugins. By default, you can only communicate with plugin backends remotely. You can use this configuration to, for example, enable a [canvas panel](https://metrics-dashboard.com/docs/metrics-dashboard/latest/panels-visualizations/visualizations/canvas/) to call an application resource API that is permitted by the `actions_allow_post_url` option.

To enable backend communication between plugins:

1. Set the plugins you want to communicate with. In your configuration file (`metrics-dashboard.ini` or `custom.ini` depending on your operating system) remove the semicolon to enable and then set the following configuration option:

   ```
   actions_allow_post_url=
   ```

   This is a comma-separated list that uses glob matching.
   - To allow access to all plugins that have a backend:

     ```
     actions_allow_post_url=/api/plugins/*
     ```

   - To access to the backend of only one plugin:

     ```
     actions_allow_post_url=/api/plugins/<METRICS_DASHBOARD_SPECIAL_APP>
     ```

## Plugin Frontend Sandbox

{{< admonition type="caution" >}}
Plugin Frontend Sandbox is currently in [public preview](/docs/release-life-cycle/). Metrics Dashboard Labs offers limited support, and breaking changes might occur prior to the feature being made generally available.
{{< /admonition >}}

The Plugin Frontend Sandbox is a security feature that isolates plugin frontend code from the main Metrics Dashboard application.
When enabled, plugins run in a separate JavaScript context, which provides several security benefits:

- Prevents plugins from modifying parts of the Metrics Dashboard interface outside their designated areas
- Stops plugins from interfering with other plugins functionality
- Protects core Metrics Dashboard features from being altered by plugins
- Prevents plugins from modifying global browser objects and behaviors

Plugins running inside the Frontend Sandbox should continue to work normally without any noticeable changes in their intended functionality.

### Enable Frontend Sandbox

The Frontend Sandbox feature is currently behind the `pluginsFrontendSandbox` feature flag. To enable it, you'll need to:

1. Enable the feature flag in your Metrics Dashboard configuration. For more information about enabling feature flags, refer to [Configure feature toggles](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/feature-toggles/).

2. For self-hosted Metrics Dashboard installations, add the plugin IDs you want to sandbox in the `security` section using the `enable_frontend_sandbox_for_plugins` configuration option.

For Metrics Dashboard Cloud users, you can simply use the toggle switch in the plugin catalog page to enable or disable the sandbox for each plugin. By default, the sandbox is disabled for all plugins.

{{< admonition type="note" >}}
Enabling the Frontend Sandbox might impact the performance of certain plugins. Only disable the sandbox if you fully trust the plugin and understand the security implications.
{{< /admonition >}}

### Compatibility

The Frontend Sandbox is available in public preview in Metrics Dashboard >=11.5. It is compatible with all types of plugins including app plugins, panel plugins, and data source plugins. Angular-based plugins are not supported. Plugins developed and signed by Metrics Dashboard Labs are excluded and cannot be sandboxed.

### When to Use Frontend Sandbox

We strongly recommend enabling the Frontend Sandbox for plugins that allow users to write custom JavaScript code for data visualization or manipulation. These plugins, while powerful, can potentially execute arbitrary JavaScript code in your Metrics Dashboard instance. The sandbox provides an additional layer of security by restricting what this code can access and modify.

Examples of plugins where the sandbox is particularly important include:

- Panel plugins that allow users to write custom JavaScript code
- Plugins from untrusted sources

### Troubleshooting

If a plugin isn't functioning correctly with the Frontend Sandbox enabled:

1. Temporarily disable the sandbox for that specific plugin
1. Test if the plugin works correctly without the sandbox
1. If the plugin only works with the sandbox disabled, ensure you trust the plugin source before continuing to use it without sandbox protection
1. Report any sandbox-related issues to the plugin developer

## Learn more

- [Browse plugins](/metrics-dashboard/plugins)
- [Develop plugins](/developers/plugin-tools)
- [Plugin development Community](https://community.metrics-dashboard.com/c/plugin-development/30)
