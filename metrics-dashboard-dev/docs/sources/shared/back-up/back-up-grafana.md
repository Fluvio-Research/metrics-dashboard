---
headless: true
labels:
  products:
    - enterprise
    - oss
title: Back up Metrics Dashboard
---

# Back up Metrics Dashboard

This topic explains how to back up a local Metrics Dashboard deployment, including configuration, plugin data, and the Metrics Dashboard database.

## Back up the Metrics Dashboard configuration file

Copy Metrics Dashboard configuration files that you might have modified in your Metrics Dashboard deployment to a backup directory.

The Metrics Dashboard configuration files are located in the following directories:

- Default configuration: `$WORKING_DIR/defaults.ini` (Don't change this file)
- Custom configuration: `$WORKING_DIR/custom.ini`

For more information on where to find configuration files, refer to [Configuration file location](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#configuration-file-location).

{{< admonition type="note" >}}
If you installed Metrics Dashboard using the `deb` or `rpm` packages, then your configuration file is located at
`/etc/metrics-dashboard/metrics-dashboard.ini`. This path is specified in the Metrics Dashboard `init.d` script using `--config` file parameter.
{{< /admonition >}}

## Back up plugin data

Installing plugins in Metrics Dashboard creates a folder for each plugin with its associated files and data. Copy all files and folders recursively from this location to your backup repository.

The Metrics Dashboard plugin files are located in the following directories:

- Default location for plugins in a binary or source installation: `$WORKING_DIR/data/plugins`
- Default location for plugins in a `deb` or `rpm` package: `/var/lib/metrics-dashboard/plugins`. This path is specified in the Metrics Dashboard init.d script using `--config` file parameter.

## Back up the Metrics Dashboard database

We recommend that you back up your Metrics Dashboard database so that you can roll back to a previous version, if required.

### SQLite

The default Metrics Dashboard database is SQLite, which stores its data in a single file on disk. To back up this file, copy it to your backup repository.

{{< admonition type="note" >}}
To ensure data integrity, shut down your Metrics Dashboard service before backing up the SQLite database.
{{< /admonition >}}

The SQLite database file is located in one of the following directories:

- Default location for SQLite data in a binary or source installation: `$WORKING_DIR/data/metrics-dashboard.db`
- Default location for SQLite data in a `deb` or `rpm` package: `/var/lib/metrics-dashboard/metrics-dashboard.db`. This path is specified in the Metrics Dashboard
  init.d script using `--config` file parameter.

### MySQL

To back up or restore a MySQL Metrics Dashboard database, run the following commands:

```bash
backup:
> mysqldump -u root -p[root_password] [metrics-dashboard] > metrics-dashboard_backup.sql

restore:
> mysql -u root -p metrics-dashboard < metrics-dashboard_backup.sql
```

### Postgres

To back up or restore a Postgres Metrics Dashboard database, run the following commands:

```bash
backup:
> pg_dump metrics-dashboard > metrics-dashboard_backup

restore:
> psql metrics-dashboard < metrics-dashboard_backup
```
