---
labels:
  products:
    - enterprise
    - oss
title: Set up Environment
---

Before you can get started building plugins, you need to set up your environment for plugin development.

To discover plugins, Metrics Dashboard scans a _plugin directory_, the location of which depends on your operating system.

1. Create a directory called `metrics-dashboard-plugins` in your preferred workspace.

1. Find the `plugins` property in the Metrics Dashboard configuration file and set the `plugins` property to the path of your `metrics-dashboard-plugins` directory. Refer to the [Metrics Dashboard configuration documentation](/docs/metrics-dashboard/latest/installation/configuration/#plugins) for more information.

   ```ini
   [paths]
   plugins = "/path/to/metrics-dashboard-plugins"
   ```

1. Restart Metrics Dashboard if it's already running, to load the new configuration.

### Alternative method: Docker

If you don't want to install Metrics Dashboard on your local machine, you can use [Docker](https://www.docker.com).

To set up Metrics Dashboard for plugin development using Docker, run the following command:

```
docker run -d -p 3000:3000 -v "$(pwd)"/metrics-dashboard-plugins:/var/lib/metrics-dashboard/plugins --name=metrics-dashboard metrics-dashboard/metrics-dashboard:7.0.0
```

Since Metrics Dashboard only loads plugins on start-up, you need to restart the container whenever you add or remove a plugin.

```
docker restart metrics-dashboard
```
