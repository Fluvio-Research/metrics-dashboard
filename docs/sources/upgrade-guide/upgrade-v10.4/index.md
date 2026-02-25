---
description: Guide for upgrading to Metrics Dashboard v10.4
keywords:
  - metrics-dashboard
  - configuration
  - documentation
  - upgrade
  - '10.4'
title: Upgrade to Metrics Dashboard v10.4
menuTitle: Upgrade to v10.4
weight: 1300
---

# Upgrade to Metrics Dashboard v10.4

{{< docs/shared lookup="upgrade/intro.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

{{< docs/shared lookup="back-up/back-up-metrics-dashboard.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" leveloffset="+1" >}}

{{< docs/shared lookup="upgrade/upgrade-common-tasks.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

## Technical notes

### Legacy alerting -> Metrics Dashboard Alerting dry-run on start

If you haven't already upgraded to Metrics Dashboard Alerting from legacy Alerting, Metrics Dashboard will initiate a dry-run of the upgrade every time the instance starts. This is in preparation for the removal of legacy Alerting in Metrics Dashboard v11. The dry-run logs the results of the upgrade attempt and identifies any issues requiring attention before you can successfully execute the upgrade. No changes are made during the dry-run.

You can disable this behavior using the feature flag `alertingUpgradeDryrunOnStart`:

```toml
[feature_toggles]
alertingUpgradeDryrunOnStart=false
```

{{< admonition type="note" >}}
We strongly encourage you to review the [upgrade guide](https://metrics-dashboard.com/docs/metrics-dashboard/v10.4/alerting/set-up/migrating-alerts/) and perform the necessary upgrade steps prior to v11.
{{< /admonition >}}
