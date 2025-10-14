---
aliases:
  - ../installation/restart-metrics-dashboard/
  - ./restart-metrics-dashboard/
description: How to start the Metrics Dashboard server
labels:
  products:
    - enterprise
    - oss
menuTitle: Start Metrics Dashboard
title: Start the Metrics Dashboard server
weight: 300
---

# Start the Metrics Dashboard server

This topic includes instructions for starting the Metrics Dashboard server. For certain configuration changes, you might have to restart the Metrics Dashboard server for them to take effect.

The following instructions start the `metrics-dashboard-server` process as the `metrics-dashboard` user, which was created during the package installation.

If you installed with the APT repository or `.deb` package, then you can start the server using `systemd` or `init.d`. If you installed a binary `.tar.gz` file, then you execute the binary.

## Linux

The following subsections describe three methods of starting and restarting the Metrics Dashboard server: with systemd, initd, or by directly running the binary. You should follow only one set of instructions, depending on how your machine is configured.

### Start the Metrics Dashboard server with systemd

Complete the following steps to start the Metrics Dashboard server using systemd and verify that it is running.

1. To start the service, run the following commands:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start metrics-dashboard-server
   ```

1. To verify that the service is running, run the following command:

   ```bash
   sudo systemctl status metrics-dashboard-server
   ```

### Configure the Metrics Dashboard server to start at boot using systemd

To configure the Metrics Dashboard server to start at boot, run the following command:

```bash
sudo systemctl enable metrics-dashboard-server.service
```

#### Serve Metrics Dashboard on a port < 1024

{{< docs/shared lookup="systemd/bind-net-capabilities.md" source="metrics-dashboard" version="<METRICS_DASHBOARD VERSION>" >}}

### Restart the Metrics Dashboard server using systemd

To restart the Metrics Dashboard server, run the following command:

```bash
sudo systemctl restart metrics-dashboard-server
```

{{< admonition type="note" >}}
SUSE or openSUSE users might need to start the server with the systemd method, then use the init.d method to configure Metrics Dashboard to start at boot.
{{< /admonition >}}

### Start the Metrics Dashboard server using init.d

Complete the following steps to start the Metrics Dashboard server using init.d and verify that it is running:

1. To start the Metrics Dashboard server, run the following command:

   ```bash
   sudo service metrics-dashboard-server start
   ```

1. To verify that the service is running, run the following command:

   ```bash
   sudo service metrics-dashboard-server status
   ```

### Configure the Metrics Dashboard server to start at boot using init.d

To configure the Metrics Dashboard server to start at boot, run the following command:

```bash
sudo update-rc.d metrics-dashboard-server defaults
```

#### Restart the Metrics Dashboard server using init.d

To restart the Metrics Dashboard server, run the following command:

```bash
sudo service metrics-dashboard-server restart
```

### Start the server using the binary

The `metrics-dashboard` binary .tar.gz needs the working directory to be the root install directory where the binary and the `public` folder are located.

To start the Metrics Dashboard server, run the following command:

```bash
./bin/metrics-dashboard server
```

## Docker

To restart the Metrics Dashboard service, use the `docker restart` command.

`docker restart metrics-dashboard`

Alternatively, you can use the `docker compose restart` command to restart Metrics Dashboard. For more information, refer to [docker compose documentation](https://docs.docker.com/compose/).

### Docker compose example

Configure your `docker-compose.yml` file. For example:

```yml
version: '3.8'
services:
  metrics-dashboard:
    image: metrics-dashboard/metrics-dashboard:latest
    container_name: metrics-dashboard
    restart: unless-stopped
    environment:
      - TERM=linux
      - GF_PLUGINS_PREINSTALL=metrics-dashboard-clock-panel,metrics-dashboard-polystat-panel
    ports:
      - '3000:3000'
    volumes:
      - 'metrics-dashboard_storage:/var/lib/metrics-dashboard'
volumes:
  metrics-dashboard_storage: {}
```

Start the Metrics Dashboard server:

`docker compose up -d`

This starts the Metrics Dashboard server container in detached mode along with the two plugins specified in the YAML file.

To restart the running container, use this command:

`docker compose restart metrics-dashboard`

## Windows

Complete the following steps to start the Metrics Dashboard server on Windows:

1. Execute `metrics-dashboard.exe server`; the `metrics-dashboard` binary is located in the `bin` directory.

   We recommend that you run `metrics-dashboard.exe server` from the command line.

   If you want to run Metrics Dashboard as a Windows service, you can download [NSSM](https://nssm.cc/).

1. To run Metrics Dashboard, open your browser and go to the Metrics Dashboard port (http://localhost:3000/ is default).

   > **Note:** The default Metrics Dashboard port is `3000`. This port might require extra permissions on Windows. If it does not appear in the default port, you can try changing to a different port.

1. To change the port, complete the following steps:

   a. In the `conf` directory, copy `sample.ini` to `custom.ini`.

   > **Note:** You should edit `custom.ini`, never `defaults.ini`.

   b. Edit `custom.ini` and uncomment the `http_port` configuration option (`;` is the comment character in ini files) and change it to something similar to `8080`, which should not require extra Windows privileges.

To restart the Metrics Dashboard server, complete the following steps:

1. Open the **Services** app.
1. Right-click on the **Metrics Dashboard** service.
1. In the context menu, click **Restart**.

## macOS

Restart methods differ depending on whether you installed Metrics Dashboard using Homebrew or as standalone macOS binaries.

### Start Metrics Dashboard using Homebrew

To start Metrics Dashboard using [Homebrew](http://brew.sh/), run the following start command:

```bash
brew services start metrics-dashboard
```

### Restart Metrics Dashboard using Homebrew

Use the [Homebrew](http://brew.sh/) restart command:

```bash
brew services restart metrics-dashboard
```

### Restart standalone macOS binaries

To restart Metrics Dashboard:

1. Open a terminal and go to the directory where you copied the install setup files.
1. Run the command:

```bash
./bin/metrics-dashboard server
```

## Next steps

After the Metrics Dashboard server is up and running, consider taking the next steps:

- Refer to [Get Started](../../getting-started/) to learn how to build your first dashboard.
- Refer to [Configuration](../configure-metrics-dashboard/) to learn about how you can customize your environment.
