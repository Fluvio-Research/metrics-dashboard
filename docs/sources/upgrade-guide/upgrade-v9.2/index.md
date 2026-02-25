---
description: Upgrade to Metrics Dashboard v9.2
keywords:
  - metrics-dashboard
  - configuration
  - documentation
  - upgrade
labels:
  products:
    - enterprise
    - oss
menutitle: Upgrade to v9.2
title: Upgrade to Metrics Dashboard v9.2
weight: 2100
---

# Upgrade to Metrics Dashboard v9.2

{{< docs/shared lookup="upgrade/intro.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

{{< docs/shared lookup="back-up/back-up-metrics-dashboard.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" leveloffset="+1" >}}

{{< docs/shared lookup="upgrade/upgrade-common-tasks.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

## Technical notes

Beginning in v9.2, Metrics Dashboard has a [supported database versions policy](../../setup-metrics-dashboard/installation/#supported-databases). As of this release, MySQL versions from 5.7, postgres versions from v10, and SQLite 3 are supported databases.
