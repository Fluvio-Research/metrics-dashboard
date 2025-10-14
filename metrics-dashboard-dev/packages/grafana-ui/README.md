# Metrics Dashboard UI components library

@metrics-dashboard/ui is a collection of components used by [Metrics Dashboard](https://github.com/metrics-dashboard/metrics-dashboard)

Our goal is to deliver Metrics Dashboard's common UI elements for plugins developers and contributors.

Browse the [Storybook catalog of the components](http://developers.metrics-dashboard.com/).

See [package source](https://github.com/metrics-dashboard/metrics-dashboard/tree/main/packages/metrics-dashboard-ui) for more details.

## Installation

`yarn add @metrics-dashboard/ui`

`npm install @metrics-dashboard/ui`

## Development

For development purposes we suggest using `yarn link` that will create symlink to @metrics-dashboard/ui lib. To do so navigate to `packages/metrics-dashboard-ui` and run `YARN_IGNORE_PATH=1 yarn link`. Then, navigate to your project and run `yarn link "@metrics-dashboard/ui"` to use the linked version of the lib. To unlink follow the same procedure, but use `yarn unlink` instead.
