---
description: Upgrade to Metrics Dashboard v8.1
keywords:
  - metrics-dashboard
  - configuration
  - documentation
  - upgrade
labels:
  products:
    - enterprise
    - oss
menutitle: Upgrade to v8.1
title: Upgrade to Metrics Dashboard v8.1
weight: 2800
---

# Upgrade to Metrics Dashboard v8.1

{{< docs/shared lookup="upgrade/intro.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

{{< docs/shared lookup="back-up/back-up-metrics-dashboard.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" leveloffset="+1" >}}

{{< docs/shared lookup="upgrade/upgrade-common-tasks.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

## Technical notes

This section describes technical changes associated with this release of Metrics Dashboard.

### Use of unencrypted passwords for data sources no longer supported

As of Metrics Dashboard v8.1, we no longer support unencrypted storage of passwords and basic auth passwords.

{{< admonition type="note" >}}
Since Metrics Dashboard v6.2, new or updated data sources store passwords and basic auth passwords encrypted. However, unencrypted passwords and basic auth passwords were also allowed.
{{< /admonition >}}

To migrate to encrypted storage, use a `metrics-dashboard-cli` command to migrate all of your data sources to use encrypted storage of secrets. See [migrate data and encrypt passwords](../../cli/#migrate-data-and-encrypt-passwords) for further instructions.
