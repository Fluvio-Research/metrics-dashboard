---
description: Upgrade to Metrics Dashboard v9.4
keywords:
  - metrics-dashboard
  - configuration
  - documentation
  - upgrade
labels:
  products:
    - enterprise
    - oss
menutitle: Upgrade to v9.4
title: Upgrade to Metrics Dashboard v9.4
weight: 1995
---

# Upgrade to Metrics Dashboard v9.4

{{< docs/shared lookup="upgrade/intro.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

{{< docs/shared lookup="back-up/back-up-metrics-dashboard.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" leveloffset="+1" >}}

{{< docs/shared lookup="upgrade/upgrade-common-tasks.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

## Technical notes

The upgrade to Metrics Dashboard v9.4 includes changes to the Metrics Dashboard database for Metrics Dashboard alerting that are not backward compatible. As a result, when you upgrade to Metrics Dashboard v9.4, do not downgrade your Metrics Dashboard instance to an earlier version. Doing so might cause issues with managing your Metrics Dashboard alerts.
