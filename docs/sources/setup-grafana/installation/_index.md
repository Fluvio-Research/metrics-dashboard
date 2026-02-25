---
aliases:
  - ../install/
  - ../installation/
  - ../installation/installation/
  - ../installation/requirements/
  - /docs/metrics-dashboard/v2.1/installation/install/
  - ./installation/rpm/
description: Installation guide for Metrics Dashboard
labels:
  products:
    - enterprise
    - oss
title: Install Metrics Dashboard
weight: 100
---

# Install Metrics Dashboard

This page lists the minimum hardware and software requirements to install Metrics Dashboard.

To run Metrics Dashboard, you must have a supported operating system, hardware that meets or exceeds minimum requirements, a supported database, and a supported browser.

The following video guides you through the steps and common commands for installing Metrics Dashboard on various operating systems as described in this document.

{{< youtube id="f-x_p2lvz8s" >}}

Metrics Dashboard relies on other open source software to operate. For a list of open source software that Metrics Dashboard uses, refer to [package.json](https://github.com/metrics-dashboard/metrics-dashboard/blob/main/package.json).

## Supported operating systems

Metrics Dashboard supports the following operating systems:

- [Debian or Ubuntu](debian/)
- [RHEL or Fedora](redhat-rhel-fedora/)
- [SUSE or openSUSE](suse-opensuse/)
- [macOS](mac/)
- [Windows](windows/)

{{< admonition type="note" >}}
Installation of Metrics Dashboard on other operating systems is possible, but is not recommended or supported.
{{< /admonition >}}

## Hardware recommendations

Metrics Dashboard requires the minimum system resources:

- Minimum recommended memory: 512 MB
- Minimum recommended CPU: 1 core

Some features might require more memory or CPUs, including:

- [Server side rendering of images](/metrics-dashboard/plugins/metrics-dashboard-image-renderer#requirements)
- [Alerting](../../alerting/)
- [Data source proxy](../../developers/http_api/data_source/)

## Supported databases

Metrics Dashboard requires a database to store its configuration data, such as users, data sources, and dashboards. The exact requirements depend on the size of the Metrics Dashboard installation and the features you use.

Metrics Dashboard supports the following databases:

- [SQLite 3](https://www.sqlite.org/index.html)
- [MySQL 8.0+](https://www.mysql.com/support/supportedplatforms/database.html)
- [PostgreSQL 12+](https://www.postgresql.org/support/versioning/)

By default Metrics Dashboard uses an embedded SQLite database, which is stored in the Metrics Dashboard installation location.

{{< admonition type="note" >}}
SQLite works well if your environment is small, but is not recommended when your environment starts growing. For more information about the limitations of SQLite, refer to [Appropriate Uses For SQLite](https://www.sqlite.org/whentouse.html). If you want [high availability](/docs/metrics-dashboard/latest/setup-metrics-dashboard/set-up-for-high-availability), you must use either a MySQL or PostgreSQL database. For information about how to define the database configuration parameters inside the `metrics-dashboard.ini` file, refer to [[database]](/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-metrics-dashboard/#database).
{{< /admonition >}}

Metrics Dashboard supports the versions of these databases that are officially supported by the project at the time a version of Metrics Dashboard is released. When a Metrics Dashboard version becomes unsupported, Metrics Dashboard Labs might also drop support for that database version. See the links above for the support policies for each project.

{{< admonition type="note" >}}
PostgreSQL versions 10.9, 11.4, and 12-beta2 are affected by a bug (tracked by the PostgreSQL project as [bug #15865](https://www.postgresql.org/message-id/flat/15865-17940eacc8f8b081%40postgresql.org)) which prevents those versions from being used with Metrics Dashboard. The bug has been fixed in more recent versions of PostgreSQL.
{{< /admonition >}}

{{< admonition type="note" >}}
Metrics Dashboard binaries and images might not work with unsupported databases, even if they claim to be drop-in or replicate the API to their best.
Binaries and images built with [BoringCrypto](https://pkg.go.dev/crypto/internal/boring) may have different problems than other distributions of Metrics Dashboard.
{{< /admonition >}}

> Metrics Dashboard can report errors when relying on read-only MySQL servers, such as in high-availability failover scenarios or serverless AWS Aurora MySQL. This is a known issue; for more information, see [issue #13399](https://github.com/metrics-dashboard/metrics-dashboard/issues/13399).

## Supported web browsers

Metrics Dashboard supports the current version of the following browsers. Older versions of these browsers might not be supported, so you should always upgrade to the latest browser version when using Metrics Dashboard.

{{< admonition type="note" >}}
Enable JavaScript in your browser. Running Metrics Dashboard without JavaScript enabled in the browser is not supported.
{{< /admonition >}}

- Chrome/Chromium
- Firefox
- Safari
- Microsoft Edge
