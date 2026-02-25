---
labels:
  products:
    - enterprise
    - oss
title: Create Plugin
---

Tooling for modern web development can be tricky to wrap your head around. While you certainly can write your own webpack configuration, for this guide, you'll be using metrics-dashboard create-plugin tool

Metrics Dashboard [create-plugin tool](https://www.npmjs.com/package/@metrics-dashboard/create-plugin) is a CLI application that simplifies Metrics Dashboard plugin development, so that you can focus on code. The tool scaffolds a starter plugin and all the required configuration for you.

1. In the plugin directory, create a plugin from template using create-plugin. When prompted for the kind of plugin, select `datasource`:

   ```
   npx @metrics-dashboard/create-plugin@latest
   ```

1. Change directory to your newly created plugin:

   ```
   cd my-plugin
   ```

1. Install the dependencies:

   ```
   yarn install
   ```

1. Build the plugin:

   ```
   yarn dev
   ```

1. Restart the Metrics Dashboard server for Metrics Dashboard to discover your plugin.
1. Open Metrics Dashboard and go to **Connections** -> **Connect Data**. Make sure that your data source is there.

By default, Metrics Dashboard logs whenever it discovers a plugin:

```
INFO[01-01|12:00:00] Plugin registered       logger=plugin.loader pluginID=my-plugin
```
