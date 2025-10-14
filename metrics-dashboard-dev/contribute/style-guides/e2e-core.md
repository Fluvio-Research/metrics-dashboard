# End-to-end tests for core Metrics Dashboard

This guide explains how to conduct end-to-end tests for the [Metrics Dashboard repository](https://github.com/metrics-dashboard/metrics-dashboard). Ensure that you've read the [generalized E2E document](e2e.md).

## Commands

- `yarn e2e`: Creates an isolated `metrics-dashboard-server` home under `\<repo-root>/e2e/tmp` with provisioned data sources and dashboards. This makes a local copy of the build binary and frontend assets from your repository root so you need to have a built backend and frontend. The server starts on port `3001` so it does not conflict with your normal dev server.
- `yarn e2e:debug`: Same as previous but runs the tests in Chrome and doesn't shut down after completion.
- `yarn e2e:dev`: Same as previous but does not run any tests on startup. It lets you pick a test first.

If you already have a Metrics Dashboard instance running, you can provide a specific URL by setting the `BASE_URL` environment variable:

```shell
BASE_URL=http://172.0.10.2:3333 yarn e2e
```

The previous commands use some `utils` scripts under [_\<repo-root>/e2e_](../../e2e) that you can also use for more control.

- `./scripts/metrics-dashboard-server/start-server`: This creates a new Metrics Dashboard server working directory, sets up configuration. and starts the server. It also kills any previously started server that is still running using the `pid` file at `\<repo-root>/scripts/metrics-dashboard-server/tmp/pid`.
- `./scripts/metrics-dashboard-server/wait-for-metrics-dashboard`: waits for `$HOST` and `$PORT` to be available. Per default `localhost` and `3001`.
- `./e2e/run-suite <debug|dev|noarg>`: Starts Cypress in different modes.

## Test suites

You can find integration tests at `\<repo-root>/e2e/suite\<x>/specs`.
