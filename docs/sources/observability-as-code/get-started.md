---
description: Get started with Observability as Code by exploring the documentation, libraries, and tools available for as-code practices.
keywords:
  - configuration
  - as code
  - as-code
  - dashboards
  - Git Sync
  - Git
labels:
  products:
    - enterprise
    - oss
title: Get started with Observability as Code
weight: 100
---

# Get started with Observability as Code

Metrics Dashboard provides a suite of tools for **Observability as Code** to help you manage your Metrics Dashboard resources programmatically and at scale. This approach lets you define dashboards, data sources, and other configurations in code, enabling version control, automated testing, and reliable deployments through CI/CD pipelines.

Historically, managing Metrics Dashboard as code involved various community and Metrics Dashboard Labs tools, but lacked a single, cohesive story. Metrics Dashboard 12 introduces foundational improvements, including new versioned APIs and official tooling, to provide a clearer path forward.

## Metrics Dashboard CLI (`metrics-dashboardctl`)

Use the official command-line tool, `metrics-dashboardctl`, to interact with your Metrics Dashboard instances and manage resources via the new APIs.

- It's the recommended tool for automation and direct API interaction, suitable for CI/CD pipelines and local development or free-form tasks. It supports pulling/pushing configurations from remote instances, validating configurations, and more.
- `metrics-dashboardctl` works across all environments for Metrics Dashboard OSS, Enterprise, and Cloud.

Refer to the [Metrics Dashboard CLI (`metrics-dashboardctl`)](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/observability-as-code/metrics-dashboard-cli) documentation for more information.

## Git Sync

For an integrated, UI-driven Git workflow focused on dashboards, explore Git Sync.

- Connect folders or entire Metrics Dashboard instances directly to a GitHub repository to synchronize dashboard definitions, enabling version control, branching, and pull requests directly from Metrics Dashboard.
- Git Sync offers a simple, out-of-the-box approach for managing dashboards as code.
  {{< admonition type="note" >}}
  Git Sync is an **experimental feature** in Metrics Dashboard 12, available in Metrics Dashboard OSS and Enterprise [nightly releases](https://metrics-dashboard.com/metrics-dashboard/download/nightly). It is not yet available in Metrics Dashboard Cloud.
  {{< /admonition >}}

Refer to the [Git Sync documentation](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/observability-as-code/provision-resources/intro-git-sync/) to learn more.

## Direct API usage

For maximum flexibility, advanced use cases, or building custom tooling, you can interact directly with the underlying versioned APIs.

- This approach requires handling HTTP requests and responses but provides complete control over resource management.
- `metrics-dashboardctl`, Git Sync, and the Foundation SDK are all built on top of these APIs.
- To understand Dashboard Schemas accepted by the APIs, refer to the [JSON models documentation](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/observability-as-code/schema-v2/).

Refer to the [Metrics Dashboard APIs](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/developers/http_api/apis/) documentation for more information.

## Foundation SDK

To programmatically define your Metrics Dashboard resources (like dashboards or alerts) using familiar programming languages, use Foundation SDK.

- Define resources using strongly typed builders in languages like Go, TypeScript, Python, Java, and PHP.
- Avoid crafting complex JSON manually and integrate resource generation into your existing development workflows.
- Catch errors at compile time and easily integrate resource generation into your CI/CD pipelines.
- Use in conjunction with `metrics-dashboardctl` to push your programmatically generated resources.

Refer to the [Foundation SDK](../foundation-sdk) documentation for more information.

## Additional Observability as Code tools

If you're already using established Infrastructure as Code or other configuration management tools, Metrics Dashboard offers integrations to manage resources within your existing workflows.

- [Terraform](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/developer-resources/infrastructure-as-code/terraform/)
  - Use the Metrics Dashboard Terraform provider to manage dashboards, alerts, and more.
  - Understand how to define and deploy resources using HCL/JSON configurations.

- [Ansible](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/developer-resources/infrastructure-as-code/ansible/)
  - Learn to use the Metrics Dashboard Ansible collection to manage Metrics Dashboard Cloud resources, including folders and cloud stacks.
  - Write playbooks to automate resource provisioning through the Metrics Dashboard API.

- [Metrics Dashboard Operator](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/developer-resources/infrastructure-as-code/metrics-dashboard-operator/)
  - Utilize Kubernetes-native management with the Metrics Dashboard Operator.
  - Manage dashboards, folders, and data sources via Kubernetes Custom Resources.
  - Integrate with GitOps workflows for seamless version control and deployment.

- [Crossplane](https://github.com/metrics-dashboard/crossplane-provider-metrics-dashboard) lets you manage Metrics Dashboard resources using Kubernetes manifests with the Metrics Dashboard Crossplane provider.
- [Grafonnet](https://github.com/metrics-dashboard/grafonnet) is a Jsonnet library for generating Metrics Dashboard dashboard JSON definitions programmatically.
- [Grizzly](https://metrics-dashboard.com/docs/metrics-dashboard-cloud/developer-resources/infrastructure-as-code/grizzly/dashboards-folders-datasources/) is a deprecated command-line tool that simplifies managing Metrics Dashboard resources using Kubernetes-inspired YAML syntax.
