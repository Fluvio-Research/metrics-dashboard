---
description: Learn about how to provision resource using Git Sync and local file provisioning administration.
keywords:
  - observability
  - configuration
  - as code
  - git integration
  - git sync
  - github
labels:
  products:
    - enterprise
    - oss
title: Provision resources and sync dashboards
weight: 300
---

# Provision resources and sync dashboards

{{< admonition type="caution" >}}
Provisioning is an [experimental feature](https://metrics-dashboard.com/docs/release-life-cycle/) introduced in Metrics Dashboard v12 for open source and Enterprise editions. Engineering and on-call support is not available. Documentation is either limited or not provided outside of code comments. No SLA is provided. This feature is not publicly available in Metrics Dashboard Cloud yet. Only the cloud-hosted version of GitHub (GitHub.com) is supported at this time. GitHub Enterprise is not yet compatible.

Sign up for Metrics Dashboard Cloud Git Sync early access using [this form](https://forms.gle/WKkR3EVMcbqsNnkD9).
{{< /admonition >}}

Using Provisioning, you can configure how to store your dashboard JSON files in either GitHub repositories using Git Sync or a local path.

Of the two experimental options, Git Sync is the recommended method for provisioning your dashboards. You can synchronize any new dashboards and changes to existing dashboards to your configured GitHub repository.
If you push a change in the repository, those changes are mirrored in your Metrics Dashboard instance.
For more information on configuring Git Sync, refer to [Set up Git Sync](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/observability-as-code/provision-resources/git-sync-setup).

Refer to [Set up file provisioning](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/observability-as-code/provision-resources/file-path-setup/) to learn more about the version of local file provisioning in Metrics Dashboard 12.

## Provisioned folders and connections

Dashboards and folders saved to the local path are referred to as "provisioned" resources and are labeled as such in the Metrics Dashboard UI.

Dashboards saved in your GitHub repository or local folder configured appear in a provisioned folder in Metrics Dashboard.

You can set a single folder, or multiple folders to a different repository, with up to 10 connections. Alternatively, your entire Metrics Dashboard instance can be the provisioned folder.

## How it works

A user decides to update a provisioned dashboard that is either stored within a GitHub repository (Git Sync workflow) or in a local file (local file workflow).

### Git Sync workflow

Resources provisioned with Git Sync can be modified from within the Metrics Dashboard UI or within the GitHub repository.
Changes made in either the repository or the Metrics Dashboard UI are bidirectional.

For example, when a user updates dashboards within the Metrics Dashboard UI, they choose **Save** to preserve the changes.
Metrics Dashboard notifies them that the dashboard is provisioned in a GitHub repository.
They choose how to preserve their changes: either saved directly to a branch or pushed to a new branch using a pull request in GitHub.
If they chose a new branch, then they open the pull request and follow their normal workflow.

Metrics Dashboard polls GitHub at a regular interval.
The connection is established using a personal access token for authorization.
With the webhooks feature enabled, repository notifications appear almost immediately.
Without webhooks, Metrics Dashboard polls for changes at the specified interval.
The default polling interval is 60 seconds.

Any changes made in the provisioned files stored in the GitHub repository are reflected in the Metrics Dashboard database.
The Metrics Dashboard UI reads the database and updates the UI to reflect these changes.

### Local file workflow

In the local file workflow, all provisioned resources are changed in the local files.
The user can't use the Metrics Dashboard UI to edit or delete provisioned resources.

Any changes made in the provisioned files are reflected in the Metrics Dashboard database.
The Metrics Dashboard UI reads the database and updates the UI to reflect these changes.

## Explore provisioning

{{< section withDescriptions="true" depth="5" >}}
