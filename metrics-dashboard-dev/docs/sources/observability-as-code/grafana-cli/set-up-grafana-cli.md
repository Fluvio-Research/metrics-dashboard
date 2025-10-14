---
description: Configuration guide for Metrics Dashboard CLI, a command line tool for managing Metrics Dashboard resources as code.
keywords:
  - configuration
  - Metrics Dashboard CLI
  - CLI
  - command line
  - metrics-dashboardctl
labels:
  products:
    - cloud
    - enterprise
    - oss
title: Set up Metrics Dashboard CLI
weight: 200
---

# Set up Metrics Dashboard CLI

You can configure Metrics Dashboard CLI in two ways: using environment variables or through a configuration file.

- **Environment variables** are ideal for CI environments and support a single context.
- **Configuration files** can manage multiple contexts, making it easier to switch between different Metrics Dashboard instances.

## Use environment variables

Metrics Dashboard CLI communicates with Metrics Dashboard via its REST API, which requires authentication credentials.

At a minimum, set the URL of your Metrics Dashboard instance and the organization ID:

```bash
METRICS_DASHBOARD_SERVER='http://localhost:3000' METRICS_DASHBOARD_ORG_ID='1' metrics-dashboardctl config check
```

Depending on your authentication method, you may also need to set:

- A [token](https://github.com/metrics-dashboard/metrics-dashboardctl/blob/main/docs/reference/environment-variables/index.md#metrics-dashboard_token) for a [Metrics Dashboard service account](https://metrics-dashboard.com/docs/metrics-dashboard/latest/administration/service-accounts/) (recommended)
- A [username](https://github.com/metrics-dashboard/metrics-dashboardctl/blob/main/docs/reference/environment-variables/index.md#metrics-dashboard_user) and [password](https://github.com/metrics-dashboard/metrics-dashboardctl/blob/main/docs/reference/environment-variables/index.md#metrics-dashboard_password) for basic authentication

To persist your configuration, consider [creating a context](#defining-contexts).

A full list of supported environment variables is available in the [reference documentation](https://github.com/metrics-dashboard/metrics-dashboardctl/blob/main/docs/reference/environment-variables/index.md#environment-variables-reference).

## Define contexts

Contexts allow you to easily switch between multiple Metrics Dashboard instances. By default, the CLI uses a context named `default`.

To configure the `default` context:

```bash
metrics-dashboardctl config set contexts.default.metrics-dashboard.server http://localhost:3000
metrics-dashboardctl config set contexts.default.metrics-dashboard.org-id 1

# Authenticate with a service account token
metrics-dashboardctl config set contexts.default.metrics-dashboard.token service-account-token

# Or use basic authentication
metrics-dashboardctl config set contexts.default.metrics-dashboard.user admin
metrics-dashboardctl config set contexts.default.metrics-dashboard.password admin
```

You can define additional contexts in the same way:

```bash
metrics-dashboardctl config set contexts.staging.metrics-dashboard.server https://staging.metrics-dashboard.example
metrics-dashboardctl config set contexts.staging.metrics-dashboard.org-id 1
```

{{< admonition type="note" >}}
In these examples, `default` and `staging` are the names of the contexts.
{{< /admonition >}}

## Configuration file

Metrics Dashboard CLI stores its configuration in a YAML file. The CLI determines the configuration file location in the following order:

1. If the `--config` flag is provided, the specified file is used.
2. If `$XDG_CONFIG_HOME` is set:
   `$XDG_CONFIG_HOME/metrics-dashboardctl/config.yaml`
3. If `$HOME` is set:
   `$HOME/.config/metrics-dashboardctl/config.yaml`
4. If `$XDG_CONFIG_DIRS` is set:
   `$XDG_CONFIG_DIRS/metrics-dashboardctl/config.yaml`

{{< admonition type="note" >}}
Use `metrics-dashboardctl config check` to display the configuration file currently in use.
{{< /admonition >}}

## Useful commands

Check the current configuration:

```bash
metrics-dashboardctl config check
```

{{< admonition type="note" >}}
This command is useful to troubleshoot your configuration.
{{< /admonition >}}

List all available contexts:

```bash
metrics-dashboardctl config list-contexts
```

Switch to a specific context:

```bash
metrics-dashboardctl config use-context staging
```

View the full configuration:

```bash
metrics-dashboardctl config view
```
