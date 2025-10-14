---
description: Install guide for Metrics Dashboard on RHEL and Fedora.
labels:
  products:
    - enterprise
    - oss
menuTitle: RHEL or Fedora
title: Install Metrics Dashboard on RHEL or Fedora
weight: 200
---

# Install Metrics Dashboard on RHEL or Fedora

This topic explains how to install Metrics Dashboard dependencies, install Metrics Dashboard on RHEL or Fedora, and start the Metrics Dashboard server on your system.

You can install Metrics Dashboard from the RPM repository, from standalone RPM, or with the binary `.tar.gz` file.

If you install via RPM or the `.tar.gz` file, then you must manually update Metrics Dashboard for each new version.

The following video demonstrates how to install Metrics Dashboard on RHEL or Fedora as outlined in this document:

{{< youtube id="4khbLlyoqzE" >}}

## Install Metrics Dashboard from the RPM repository

If you install from the RPM repository, then Metrics Dashboard is automatically updated every time you update your applications.

| Metrics Dashboard Version           | Package            | Repository                     |
| ------------------------- | ------------------ | ------------------------------ |
| Metrics Dashboard Enterprise        | metrics-dashboard-enterprise | `https://rpm.metrics-dashboard.com`      |
| Metrics Dashboard Enterprise (Beta) | metrics-dashboard-enterprise | `https://rpm-beta.metrics-dashboard.com` |
| Metrics Dashboard OSS               | metrics-dashboard            | `https://rpm.metrics-dashboard.com`      |
| Metrics Dashboard OSS (Beta)        | metrics-dashboard            | `https://rpm-beta.metrics-dashboard.com` |

{{< admonition type="note" >}}
Metrics Dashboard Enterprise is the recommended and default edition. It is available for free and includes all the features of the OSS edition. You can also upgrade to the [full Enterprise feature set](/products/enterprise/?utm_source=metrics-dashboard-install-page), which has support for [Enterprise plugins](/metrics-dashboard/plugins/?enterprise=1&utcm_source=metrics-dashboard-install-page).
{{< /admonition >}}

To install Metrics Dashboard from the RPM repository, complete the following steps:

{{< admonition type="note" >}}
If you wish to install beta versions of Metrics Dashboard, substitute the repository URL for the beta URL listed above.
{{< /admonition >}}

1. Import the GPG key:

   ```bash
   wget -q -O gpg.key https://rpm.metrics-dashboard.com/gpg.key
   sudo rpm --import gpg.key
   ```

1. Create `/etc/yum.repos.d/metrics-dashboard.repo` with the following content:

   ```bash
   [metrics-dashboard]
   name=metrics-dashboard
   baseurl=https://rpm.metrics-dashboard.com
   repo_gpgcheck=1
   enabled=1
   gpgcheck=1
   gpgkey=https://rpm.metrics-dashboard.com/gpg.key
   sslverify=1
   sslcacert=/etc/pki/tls/certs/ca-bundle.crt
   ```

1. To install Metrics Dashboard OSS, run the following command:

   ```bash
   sudo dnf install metrics-dashboard
   ```

1. To install Metrics Dashboard Enterprise, run the following command:

   ```bash
   sudo dnf install metrics-dashboard-enterprise
   ```

## Install the Metrics Dashboard RPM package manually

If you install Metrics Dashboard manually using YUM or RPM, then you must manually update Metrics Dashboard for each new version. This method varies according to which Linux OS you are running.

**Note:** The RPM files are signed. You can verify the signature with this [public GPG key](https://rpm.metrics-dashboard.com/gpg.key).

1. On the [Metrics Dashboard download page](/metrics-dashboard/download), select the Metrics Dashboard version you want to install.
   - The most recent Metrics Dashboard version is selected by default.
   - The **Version** field displays only finished releases. If you want to install a beta version, click **Nightly Builds** and then select a version.
1. Select an **Edition**.
   - **Enterprise** - Recommended download. Functionally identical to the open source version, but includes features you can unlock with a license if you so choose.
   - **Open Source** - Functionally identical to the Enterprise version, but you will need to download the Enterprise version if you want Enterprise features.
1. Depending on which system you are running, click **Linux** or **ARM**.
1. Copy and paste the RPM package URL and the local RPM package information from the [download page](/metrics-dashboard/download) into the pattern shown below and run the command.

   ```bash
   sudo yum install -y <rpm package url>
   ```

## Install Metrics Dashboard as a standalone binary

If you install Metrics Dashboard manually using the standalone binaries, then you must manually update Metrics Dashboard for each new version.

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
   /usr/local/metrics-dashboard/bin/metrics-dashboard-server --homepath /usr/local/metrics-dashboard
   ```

   {{< admonition type="note" >}}
   Manually invoking the binary in this step automatically creates the `/usr/local/metrics-dashboard/data` directory, which needs to be created and configured before the installation can be considered complete.
   {{< /admonition >}}

1. Press `CTRL+C` to stop the Metrics Dashboard server.
1. Change the owner of `/usr/local/metrics-dashboard` to Metrics Dashboard users again to apply the ownership to the newly created `/usr/local/metrics-dashboard/data` directory:

   ```shell
   sudo chown -R metrics-dashboard:users /usr/local/metrics-dashboard
   ```

1. [Configure the Metrics Dashboard server to start at boot time using systemd](../../start-restart-metrics-dashboard/#configure-the-metrics-dashboard-server-to-start-at-boot-using-systemd).

## Uninstall on RHEL or Fedora

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
   sudo dnf remove metrics-dashboard
   ```

1. To uninstall Metrics Dashboard Enterprise:

   ```shell
   sudo dnf remove metrics-dashboard-enterprise
   ```

1. Optional: To remove the Metrics Dashboard repository:

   ```shell
   sudo rm -i /etc/yum.repos.d/metrics-dashboard.repo
   ```

## Next steps

Refer to [Start the Metrics Dashboard server](../../start-restart-metrics-dashboard/).
