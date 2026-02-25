# Test plugins

The [e2e test server](https://github.com/metrics-dashboard/metrics-dashboard/blob/main/scripts/metrics-dashboard-server/start-server) automatically scans and looks for plugins in this directory.

### To add a new test plugin:

1. If provisioning is required you may update the YAML config file in [`/devenv`](https://github.com/metrics-dashboard/metrics-dashboard/tree/main/devenv).
2. Add the plugin ID to the `allow_loading_unsigned_plugins` setting in the test server's [configuration file](https://github.com/metrics-dashboard/metrics-dashboard/blob/main/scripts/metrics-dashboard-server/custom.ini).

### Building a test plugin with webpack

If you wish to build a test plugin with webpack, you may take a look at how the [metrics-dashboard-extensionstest-app](./metrics-dashboard-extensionstest-app/) is wired. A few things to keep in mind:

- the package name needs to be prefixed with `@test-plugins/`
- extend the webpack config from [`@metrics-dashboard/plugin-configs`](../../packages/metrics-dashboard-plugin-configs/) and use custom webpack config to only copy the necessary files (see example [here](./metrics-dashboard-extensionstest-app/webpack.config.ts))
- keep dependency versions in sync with what's in core

#### Local development

1: Install frontend dependencies:
`yarn install --immutable`

2: Build and watch the core frontend
`yarn start`

3: Build and watch the test plugins
`yarn e2e:plugin:build:dev`

4: Build the backend
`make build-go`

5: Start the Metrics Dashboard e2e test server with the provisioned test plugin
`PORT=3000 ./scripts/metrics-dashboard-server/start-server`
