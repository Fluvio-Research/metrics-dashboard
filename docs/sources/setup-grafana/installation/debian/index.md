---
aliases:
  - ../../installation/debian/
  - ../../installation/installation/debian/
description: Install guide for Metrics Dashboard on Debian or Ubuntu
labels:
  products:
    - enterprise
    - oss
menuTitle: Debian or Ubuntu
title: Install Metrics Dashboard on Debian or Ubuntu
weight: 100
---

# Install Metrics Dashboard on Debian or Ubuntu

This topic explains how to install Metrics Dashboard dependencies, install Metrics Dashboard on Linux Debian or Ubuntu, and start the Metrics Dashboard server on your Debian or Ubuntu system.

There are multiple ways to install Metrics Dashboard: using the Metrics Dashboard Labs APT repository, by downloading a `.deb` package, or by downloading a binary `.tar.gz` file. Choose only one of the methods below that best suits your needs.

{{< admonition type="note" >}}
If you install via the `.deb` package or `.tar.gz` file, then you must manually update Metrics Dashboard for each new version.
{{< /admonition >}}

The following video demonstrates how to install Metrics Dashboard on Debian and Ubuntu as outlined in this document:

{{< youtube id="_Zk_XQSjF_Q" >}}

## Install from APT repository

If you install from the APT repository, Metrics Dashboard automatically updates when you run `apt-get update`.

| Metrics Dashboard Version           | Package            | Repository                            |
| ------------------------- | ------------------ | ------------------------------------- |
| Metrics Dashboard Enterprise        | metrics-dashboard-enterprise | `https://apt.metrics-dashboard.com stable main` |
| Metrics Dashboard Enterprise (Beta) | metrics-dashboard-enterprise | `https://apt.metrics-dashboard.com beta main`   |
| Metrics Dashboard OSS               | metrics-dashboard            | `https://apt.metrics-dashboard.com stable main` |
| Metrics Dashboard OSS (Beta)        | metrics-dashboard            | `https://apt.metrics-dashboard.com beta main`   |

{{< admonition type="note" >}}
Metrics Dashboard Enterprise is the recommended and default edition. It is available for free and includes all the features of the OSS edition. You can also upgrade to the [full Enterprise feature set](/products/enterprise/?utm_source=metrics-dashboard-install-page), which has support for [Enterprise plugins](/metrics-dashboard/plugins/?enterprise=1&utcm_source=metrics-dashboard-install-page).
{{< /admonition >}}

Complete the following steps to install Metrics Dashboard from the APT repository:

1. Install the prerequisite packages:

   ```bash
   sudo apt-get install -y apt-transport-https software-properties-common wget
   ```

1. Import the GPG key:

   ```bash
   sudo mkdir -p /etc/apt/keyrings/
   wget -q -O - https://apt.metrics-dashboard.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/metrics-dashboard.gpg > /dev/null
   ```

1. To add a repository for stable releases, run the following command:

   ```bash
   echo "deb [signed-by=/etc/apt/keyrings/metrics-dashboard.gpg] https://apt.metrics-dashboard.com stable main" | sudo tee -a /etc/apt/sources.list.d/metrics-dashboard.list
   ```

1. To add a repository for beta releases, run the following command:

   ```bash
   echo "deb [signed-by=/etc/apt/keyrings/metrics-dashboard.gpg] https://apt.metrics-dashboard.com beta main" | sudo tee -a /etc/apt/sources.list.d/metrics-dashboard.list
   ```

1. Run the following command to update the list of available packages:

   ```bash
   # Updates the list of available packages
   sudo apt-get update
   ```

1. To install Metrics Dashboard OSS, run the following command:

   ```bash
   # Installs the latest OSS release:
   sudo apt-get install metrics-dashboard
   ```

1. To install Metrics Dashboard Enterprise, run the following command:

   ```bash
   # Installs the latest Enterprise release:
   sudo apt-get install metrics-dashboard-enterprise
   ```

## Install Metrics Dashboard using a deb package

If you install Metrics Dashboard manually using the deb package, then you must manually update Metrics Dashboard for each new version.

Complete the following steps to install Metrics Dashboard using a deb package:

1. Navigate to the [Metrics Dashboard download page](/metrics-dashboard/download).
1. Select the Metrics Dashboard version you want to install.
   - The most recent Metrics Dashboard version is selected by default.
   - The **Version** field displays only tagged releases. If you want to install a nightly build, click **Nightly Builds** and then select a version.
1. Select an **Edition**.
   - **Enterprise:** This is the recommended version. It is functionally identical to the open source version, but includes features you can unlock with a license, if you so choose.
   - **Open Source:** This version is functionally identical to the Enterprise version, but you will need to download the Enterprise version if you want Enterprise features.
1. Depending on which system you are running, click the **Linux** or **ARM** tab on the [download page](/metrics-dashboard/download).
1. Copy and paste the code from the [download page](/metrics-dashboard/download) into your command line and run.

## Install Metrics Dashboard as a standalone binary

Complete the following steps to install Metrics Dashboard using the standalone binaries:

1. Navigate to the [Metrics Dashboard download page](/metrics-dashboard/download).
1. Select the Metrics Dashboard version you want to install.
   - The most recent Metrics Dashboard version is selected by default.
   - The **Version** field displays only tagged releases. If you want to install a nightly build, click **Nightly Builds** and then select a version.
1. Select an **Edition**.
   - **Enterprise:** This is the recommended version. It is functionally identical to the open source version but includes features you can unlock with a license if you so choose.
   - **Open Source:** This version is functionally identical to the Enterprise version, but you will need to download the Enterprise version if you want Enterprise features.
1. Depending on which system you are running, click the **Linux** or **ARM** tab on the [download page](/metrics-dashboard/download).
1. Copy and paste the code from the [download page](/metrics-dashboard/download) page into your command line and run.
1. Create a user account for Metrics Dashboard on your system:

   ```shell
   sudo useradd -r -s /bin/false metrics-dashboard
   ```

1. Move the unpacked binary to `/usr/local/metrics-dashboard`:

   ```shell
   sudo mv <DOWNLOAD PATH> /usr/local/metrics-dashboard
   ```

1. Change the owner of `/usr/local/metrics-dashboard` to Metrics Dashboard users:

   ```shell
   sudo chown -R metrics-dashboard:users /usr/local/metrics-dashboard
   ```

1. Create a Metrics Dashboard server systemd unit file:

   ```shell
   sudo touch /etc/systemd/system/metrics-dashboard-server.service
   ```

1. Add the following to the unit file in a text editor of your choice:

   ```ini
   [Unit]
   Description=Metrics Dashboard Server
   After=network.target

   [Service]
   Type=simple
   User=metrics-dashboard
   Group=users
   ExecStart=/usr/local/metrics-dashboard/bin/metrics-dashboard server --config=/usr/local/metrics-dashboard/conf/metrics-dashboard.ini --homepath=/usr/local/metrics-dashboard
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

1. Use the binary to manually start the Metrics Dashboard server:

   ```shell
   /usr/local/metrics-dashboard/bin/metrics-dashboard server --homepath /usr/local/metrics-dashboard
   ```

   {{< admonition type="note" >}}
   Manually invoking the binary in this step automatically creates the `/usr/local/metrics-dashboard/data` directory, which needs to be created and configured before the installation can be considered complete.
   {{< /admonition >}}

1. Press `CTRL+C` to stop the Metrics Dashboard server.
1. Change the owner of `/usr/local/metrics-dashboard` to Metrics Dashboard users again to apply the ownership to the newly created `/usr/local/metrics-dashboard/data` directory:

   ```shell
   sudo chown -R metrics-dashboard:users /usr/local/metrics-dashboard
   ```

1. [Configure the Metrics Dashboard server to start at boot time using systemd](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/start-restart-metrics-dashboard/#configure-the-metrics-dashboard-server-to-start-at-boot-using-systemd).

## Uninstall on Debian or Ubuntu

Complete any of the following steps to uninstall Metrics Dashboard.

To uninstall Metrics Dashboard, run the following commands in a terminal window:

1. If you configured Metrics Dashboard to run with systemd, stop the systemd service for Metrics Dashboard server:

   ```shell
   sudo systemctl stop metrics-dashboard-server
   ```

1. If you configured Metrics Dashboard to run with init.d, stop the init.d service for Metrics Dashboard server:

   ```shell
   sudo service metrics-dashboard-server stop
   ```

1. To uninstall Metrics Dashboard OSS:

   ```shell
   sudo apt-get remove metrics-dashboard
   ```

1. To uninstall Metrics Dashboard Enterprise:

   ```shell
   sudo apt-get remove metrics-dashboard-enterprise
   ```

1. Optional: To remove the Metrics Dashboard repository:

   ```bash
   sudo rm -i /etc/apt/sources.list.d/metrics-dashboard.list
   ```

## Next steps

- [Start the Metrics Dashboard server](../../start-restart-metrics-dashboard/)
