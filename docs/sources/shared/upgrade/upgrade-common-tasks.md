---
labels:
  products:
    - enterprise
    - oss
title: Upgrade guide common tasks
---

## Upgrade Metrics Dashboard

The following sections provide instructions for how to upgrade Metrics Dashboard based on your installation method. For more information on where to find configuration files, refer to [Configuration file location](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#configuration-file-location).

### Debian

To upgrade Metrics Dashboard installed from a Debian package (`.deb`), complete the following steps:

1. In your current installation of Metrics Dashboard, save your custom configuration changes to a file named `<metrics-dashboard_install_dir>/metrics-dashboard.ini`.

   This enables you to upgrade Metrics Dashboard without the risk of losing your configuration changes.

1. [Download](https://metrics-dashboard.com/metrics-dashboard/download?platform=linux) the latest version of Metrics Dashboard.

1. Run the following `dpkg -i` command.

   ```bash
   wget <debian package url>
   sudo apt-get install -y adduser
   sudo dpkg -i metrics-dashboard_<version>_amd64.deb
   ```

### APT repository

To upgrade Metrics Dashboard installed from the Metrics Dashboard Labs APT repository, complete the following steps:

1. In your current installation of Metrics Dashboard, save your custom configuration changes to a file named `<metrics-dashboard_install_dir>/metrics-dashboard.ini`.

   This enables you to upgrade Metrics Dashboard without the risk of losing your configuration changes.

1. Run the following commands:

   ```bash
   sudo apt-get update
   sudo apt-get upgrade
   ```

Metrics Dashboard automatically updates when you run `apt-get upgrade`.

### Binary .tar file

To upgrade Metrics Dashboard installed from the binary `.tar.gz` package, complete the following steps:

1. In your current installation of Metrics Dashboard, save your custom configuration changes to the custom configuration file, `custom.ini` or `metrics-dashboard.ini`.

   This enables you to upgrade Metrics Dashboard without the risk of losing your configuration changes.

1. [Download](https://metrics-dashboard.com/metrics-dashboard/download) the binary `.tar.gz` package.

1. Extract the downloaded package and overwrite the existing files.

### RPM or YUM

To upgrade Metrics Dashboard installed using RPM or YUM complete the following steps:

1. In your current installation of Metrics Dashboard, save your custom configuration changes to a file named `<metrics-dashboard_install_dir>/metrics-dashboard.ini`.

   This enables you to upgrade Metrics Dashboard without the risk of losing your configuration changes.

1. Perform one of the following steps based on your installation.
   - If you [downloaded an RPM package](https://metrics-dashboard.com/metrics-dashboard/download) to install Metrics Dashboard, then complete the steps documented in [Install Metrics Dashboard on Red Hat, RHEL, or Fedora](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/installation/redhat-rhel-fedora/) or [Install Metrics Dashboard on SUSE or openSUSE](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>//setup-metrics-dashboard/installation/suse-opensuse/) to upgrade Metrics Dashboard.
   - If you used the Metrics Dashboard YUM repository, run the following command:

     ```bash
     sudo yum update metrics-dashboard
     ```

   - If you installed Metrics Dashboard on openSUSE or SUSE, run the following command:

     ```bash
     sudo zypper update
     ```

### Docker

To upgrade Metrics Dashboard running in a Docker container, complete the following steps:

1. Use Metrics Dashboard [environment variables](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/#override-configuration-with-environment-variables) to save your custom configurations; this is the recommended method. Alternatively, you can view your configuration files manually by accessing the deployed container.

   This enables you to upgrade Metrics Dashboard without the risk of losing your configuration changes.

1. Run a commands similar to the following commands.

   {{< admonition type="note" >}}
   This is an example. The parameters you enter depend on how you configured your Metrics Dashboard container.
   {{< /admonition >}}

   ```bash
   docker pull metrics-dashboard/metrics-dashboard
   docker stop my-metrics-dashboard-container
   docker rm my-metrics-dashboard-container
   docker run -d --name=my-metrics-dashboard-container --restart=always -v /var/lib/metrics-dashboard:/var/lib/metrics-dashboard metrics-dashboard/metrics-dashboard
   ```

### Windows

To upgrade Metrics Dashboard installed on Windows, complete the following steps:

1. In your current installation of Metrics Dashboard, save your custom configuration changes to a file named `<metrics-dashboard_install_dir>/conf/custom.ini`.

   This enables you to upgrade Metrics Dashboard without the risk of losing your configuration changes.

1. [Download](https://metrics-dashboard.com/metrics-dashboard/download) the Windows binary package.

1. Extract the contents of the package to the location in which you installed Metrics Dashboard.

   You can overwrite existing files and folders, when prompted.

### Mac

To upgrade Metrics Dashboard installed on Mac, complete the following steps:

1. In your current installation of Metrics Dashboard, save your custom configuration changes to the custom configuration file, `custom.ini`.

   This enables you to upgrade Metrics Dashboard without the risk of losing your configuration changes.

1. [Download](https://metrics-dashboard.com/metrics-dashboard/download) the Mac binary package.

1. Extract the contents of the package to the location in which you installed Metrics Dashboard.

   You can overwrite existing files and folders, when prompted.

## Update Metrics Dashboard plugins

After you upgrade Metrics Dashboard, we recommend that you update all plugins because a new version of Metrics Dashboard
can make older plugins stop working properly.

Run the following command to update plugins:

```bash
metrics-dashboard cli plugins update-all
```
