# Metrics Dashboard OpenTelemetry Semantic Conventions

<!-- toc -->

- [Adding new attributes](#adding-new-attributes)
- [Attribute Groups](#attribute-groups)
  - [metrics-dashboard.datasource](#metrics-dashboarddatasource)
    - [metrics-dashboard.datasource.request](#metrics-dashboarddatasourcerequest)
- [k8s](#k8s)
  - [metrics-dashboard.plugin](#metrics-dashboardplugin)

<!-- tocstop -->

## Adding new attributes

1. Add a new attribute to a new or existing attribute group in [model/registry](./model/registry).
1. Add a reference to the new attribute in a new or existing attribute group in [model/trace](./model/trace).
1. If you are adding a new attribute group, add a new `semconv` HTML comment tag to the README.md file with the name of the new attribute group.
1. Run `make all` to update the generated files.

For more information:
- [Semantic Convention generator + Docker](https://github.com/open-telemetry/build-tools/blob/main/semantic-conventions/README.md)
- [OpenTelemetry Semantic Conventions](https://github.com/open-telemetry/semantic-conventions/tree/main/model) (these can be used as a reference)

## Attribute Groups

### metrics-dashboard.datasource

<!-- semconv trace.metrics-dashboard.datasource -->
| Attribute  | Type | Description  | Examples  | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Stability |
|---|---|---|---|---|---|
| `metrics-dashboard.datasource.type` | string | The datasource type. | `prometheus`; `loki`; `metrics-dashboard-github-datasource` | `Recommended` | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `metrics-dashboard.datasource.uid` | string | The datasource unique identifier. | `abcdefg-123456` | `Recommended` | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
<!-- endsemconv -->

#### metrics-dashboard.datasource.request

<!-- semconv trace.metrics-dashboard.datasource.request -->
| Attribute  | Type | Description  | Examples  | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Stability |
|---|---|---|---|---|---|
| `metrics-dashboard.datasource.request.query_count` | int | The number of queries in the request. | `3` | `Recommended` | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
<!-- endsemconv -->

## k8s

<!-- semconv trace.k8s -->
| Attribute  | Type | Description  | Examples  | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Stability |
|---|---|---|---|---|---|
| `k8s.dataplaneservice.name` | string | The name of the DataPlaneService. | `v0alpha1.prometheus.metrics-dashboard.app` | `Recommended` | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
<!-- endsemconv -->

### metrics-dashboard.plugin

<!-- semconv trace.metrics-dashboard.plugin -->
| Attribute  | Type | Description  | Examples  | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Stability |
|---|---|---|---|---|---|
| `metrics-dashboard.plugin.id` | string | The plugin ID. | `prometheus`; `loki`; `metrics-dashboard-github-datasource` | `Recommended` | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `metrics-dashboard.plugin.type` | string | The plugin type. | `datasource` | `Recommended` | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
<!-- endsemconv -->

