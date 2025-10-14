---
aliases:
  - ../../installation/docker/
description: Guide for running Metrics Dashboard using Docker
labels:
  products:
    - enterprise
    - oss
menuTitle: Metrics Dashboard Docker image
title: Run Metrics Dashboard Docker image
weight: 400
---

# Run Metrics Dashboard Docker image

This topic guides you through installing Metrics Dashboard via the official Docker images. Specifically, it covers running Metrics Dashboard via the Docker command line interface (CLI) and docker-compose.

{{< youtube id="FlDfcMbSLXs" start="703">}}

Metrics Dashboard Docker images come in two editions:

- **Metrics Dashboard Enterprise**: `metrics-dashboard/metrics-dashboard-enterprise`
- **Metrics Dashboard Open Source**: `metrics-dashboard/metrics-dashboard-oss`

> **Note:** The recommended and default edition of Metrics Dashboard is Metrics Dashboard Enterprise. It is free and includes all the features of the OSS edition. Additionally, you have the option to upgrade to the [full Enterprise feature set](/products/enterprise/?utm_source=metrics-dashboard-install-page), which includes support for [Enterprise plugins](/metrics-dashboard/plugins/?enterprise=1&utcm_source=metrics-dashboard-install-page).

The default images for Metrics Dashboard are created using the Alpine Linux project and can be found in the Alpine official image. For instructions on configuring a Docker image for Metrics Dashboard, refer to [Configure a Metrics Dashboard Docker image](../../configure-docker/).

## Run Metrics Dashboard via Docker CLI

This section shows you how to run Metrics Dashboard using the Docker CLI.

> **Note:** If you are on a Linux system (for example, Debian or Ubuntu), you might need to add `sudo` before the command or add your user to the `docker` group. For more information, refer to [Linux post-installation steps for Docker Engine](https://docs.docker.com/engine/install/linux-postinstall/).

To run the latest stable version of Metrics Dashboard, run the following command:

```bash
docker run -d -p 3000:3000 --name=metrics-dashboard metrics-dashboard/metrics-dashboard-enterprise
```

Where:

- [`docker run`](https://docs.docker.com/engine/reference/commandline/run/) is a Docker CLI command that runs a new container from an image
- `-d` (`--detach`) runs the container in the background
- `-p <host-port>:<container-port>` (`--publish`) publish a container's port(s) to the host, allowing you to reach the container's port via a host port. In this case, we can reach the container's port `3000` via the host's port `3000`
- `--name` assign a logical name to the container (e.g. `metrics-dashboard`). This allows you to refer to the container by name instead of by ID.
- `metrics-dashboard/metrics-dashboard-enterprise` is the image to run

### Stop the Metrics Dashboard container

To stop the Metrics Dashboard container, run the following command:

```bash
# The `docker ps` command shows the processes running in Docker
docker ps

# This will display a list of containers that looks like the following:
CONTAINER ID   IMAGE  COMMAND   CREATED  STATUS   PORTS    NAMES
cd48d3994968   metrics-dashboard/metrics-dashboard-enterprise   "/run.sh"   8 seconds ago   Up 7 seconds   0.0.0.0:3000->3000/tcp   metrics-dashboard

# To stop the metrics-dashboard container run the command
# docker stop CONTAINER-ID or use
# docker stop NAME, which is `metrics-dashboard` as previously defined
docker stop metrics-dashboard
```

### Save your Metrics Dashboard data

By default, Metrics Dashboard uses an embedded SQLite version 3 database to store configuration, users, dashboards, and other data. When you run Docker images as containers, changes to these Metrics Dashboard data are written to the filesystem within the container, which will only persist for as long as the container exists. If you stop and remove the container, any filesystem changes (i.e. the Metrics Dashboard data) will be discarded. To avoid losing your data, you can set up persistent storage using [Docker volumes](https://docs.docker.com/storage/volumes/) or [bind mounts](https://docs.docker.com/storage/bind-mounts/) for your container.

> **Note:** Though both methods are similar, there is a slight difference. If you want your storage to be fully managed by Docker and accessed only through Docker containers and the Docker CLI, you should choose to use persistent storage. However, if you need full control of the storage and want to allow other processes besides Docker to access or modify the storage layer, then bind mounts is the right choice for your environment.

#### Use Docker volumes (recommended)

Use Docker volumes when you want the Docker Engine to manage the storage volume.

To use Docker volumes for persistent storage, complete the following steps:

1. Create a Docker volume to be used by the Metrics Dashboard container, giving it a descriptive name (e.g. `metrics-dashboard-storage`). Run the following command:

   ```bash
   # create a persistent volume for your data
   docker volume create metrics-dashboard-storage

   # verify that the volume was created correctly
   # you should see some JSON output
   docker volume inspect metrics-dashboard-storage
   ```

1. Start the Metrics Dashboard container by running the following command:
   ```bash
   # start metrics-dashboard
   docker run -d -p 3000:3000 --name=metrics-dashboard \
     --volume metrics-dashboard-storage:/var/lib/metrics-dashboard \
     metrics-dashboard/metrics-dashboard-enterprise
   ```

#### Use bind mounts

If you plan to use directories on your host for the database or configuration when running Metrics Dashboard in Docker, you must start the container with a user with permission to access and write to the directory you map.

To use bind mounts, run the following command:

```bash
# create a directory for your data
mkdir data

# start metrics-dashboard with your user id and using the data directory
docker run -d -p 3000:3000 --name=metrics-dashboard \
  --user "$(id -u)" \
  --volume "$PWD/data:/var/lib/metrics-dashboard" \
  metrics-dashboard/metrics-dashboard-enterprise
```

### Use environment variables to configure Metrics Dashboard

Metrics Dashboard supports specifying custom configuration settings using [environment variables](../../configure-metrics-dashboard/#override-configuration-with-environment-variables).

```bash
# enable debug logs

docker run -d -p 3000:3000 --name=metrics-dashboard \
  -e "GF_LOG_LEVEL=debug" \
  metrics-dashboard/metrics-dashboard-enterprise
```

## Install plugins in the Docker container

You can install plugins in Metrics Dashboard from the official and community [plugins page](/metrics-dashboard/plugins) or by using a custom URL to install a private plugin. These plugins allow you to add new visualization types, data sources, and applications to help you better visualize your data.

Metrics Dashboard currently supports three types of plugins: panel, data source, and app. For more information on managing plugins, refer to [Plugin Management](../../../administration/plugin-management/).

To install plugins in the Docker container, complete the following steps:

1. Pass the plugins you want to be installed to Docker with the `GF_PLUGINS_PREINSTALL` environment variable as a comma-separated list.

   This starts a background process that installs the list of plugins while Metrics Dashboard server starts.

   For example:

   ```bash
   docker run -d -p 3000:3000 --name=metrics-dashboard \
     -e "GF_PLUGINS_PREINSTALL=metrics-dashboard-clock-panel, metrics-dashboard-simple-json-datasource" \
     metrics-dashboard/metrics-dashboard-enterprise
   ```

1. To specify the version of a plugin, add the version number to the `GF_PLUGINS_PREINSTALL` environment variable.

   For example:

   ```bash
   docker run -d -p 3000:3000 --name=metrics-dashboard \
     -e "GF_PLUGINS_PREINSTALL=metrics-dashboard-clock-panel@1.0.1" \
     metrics-dashboard/metrics-dashboard-enterprise
   ```

   > **Note:** If you do not specify a version number, the latest version is used.

1. To install a plugin from a custom URL, use the following convention to specify the URL: `<plugin ID>@[<plugin version>]@<url to plugin zip>`.

   For example:

   ```bash
   docker run -d -p 3000:3000 --name=metrics-dashboard \
     -e "GF_PLUGINS_PREINSTALL=custom-plugin@@https://github.com/VolkovLabs/custom-plugin.zip" \
     metrics-dashboard/metrics-dashboard-enterprise
   ```

## Example

The following example runs the latest stable version of Metrics Dashboard, listening on port 3000, with the container named `metrics-dashboard`, persistent storage in the `metrics-dashboard-storage` docker volume, the server root URL set, and the official [clock panel](/metrics-dashboard/plugins/metrics-dashboard-clock-panel) plugin installed.

```bash
# create a persistent volume for your data
docker volume create metrics-dashboard-storage

# start metrics-dashboard by using the above persistent storage
# and defining environment variables

docker run -d -p 3000:3000 --name=metrics-dashboard \
  --volume metrics-dashboard-storage:/var/lib/metrics-dashboard \
  -e "GF_SERVER_ROOT_URL=http://my.metrics-dashboard.server/" \
  -e "GF_PLUGINS_PREINSTALL=metrics-dashboard-clock-panel" \
  metrics-dashboard/metrics-dashboard-enterprise
```

## Run Metrics Dashboard via Docker Compose

Docker Compose is a software tool that makes it easy to define and share applications that consist of multiple containers. It works by using a YAML file, usually called `docker-compose.yaml`, which lists all the services that make up the application. You can start the containers in the correct order with a single command, and with another command, you can shut them down. For more information about the benefits of using Docker Compose and how to use it refer to [Use Docker Compose](https://docs.docker.com/get-started/08_using_compose/).

### Before you begin

To run Metrics Dashboard via Docker Compose, install the compose tool on your machine. To determine if the compose tool is available, run the following command:

```bash
docker compose version
```

If the compose tool is unavailable, refer to [Install Docker Compose](https://docs.docker.com/compose/install/).

### Run the latest stable version of Metrics Dashboard

This section shows you how to run Metrics Dashboard using Docker Compose. The examples in this section use Compose version 3. For more information about compatibility, refer to [Compose and Docker compatibility matrix](https://docs.docker.com/compose/compose-file/compose-file-v3/).

> **Note:** If you are on a Linux system (for example, Debian or Ubuntu), you might need to add `sudo` before the command or add your user to the `docker` group. For more information, refer to [Linux post-installation steps for Docker Engine](https://docs.docker.com/engine/install/linux-postinstall/).

To run the latest stable version of Metrics Dashboard using Docker Compose, complete the following steps:

1. Create a `docker-compose.yaml` file.

   ```bash
   # first go into the directory where you have created this docker-compose.yaml file
   cd /path/to/docker-compose-directory

   # now create the docker-compose.yaml file
   touch docker-compose.yaml
   ```

1. Now, add the following code into the `docker-compose.yaml` file.

   For example:

   ```bash
   services:
     metrics-dashboard:
       image: metrics-dashboard/metrics-dashboard-enterprise
       container_name: metrics-dashboard
       restart: unless-stopped
       ports:
        - '3000:3000'
   ```

1. To run `docker-compose.yaml`, run the following command:

   ```bash
   # start the metrics-dashboard container
   docker compose up -d
   ```

   Where:

   d = detached mode

   up = to bring the container up and running

To determine that Metrics Dashboard is running, open a browser window and type `IP_ADDRESS:3000`. The sign in screen should appear.

### Stop the Metrics Dashboard container

To stop the Metrics Dashboard container, run the following command:

```bash
docker compose down
```

> **Note:** For more information about using Docker Compose commands, refer to [docker compose](https://docs.docker.com/engine/reference/commandline/compose/).

### Save your Metrics Dashboard data

By default, Metrics Dashboard uses an embedded SQLite version 3 database to store configuration, users, dashboards, and other data. When you run Docker images as containers, changes to these Metrics Dashboard data are written to the filesystem within the container, which will only persist for as long as the container exists. If you stop and remove the container, any filesystem changes (i.e. the Metrics Dashboard data) will be discarded. To avoid losing your data, you can set up persistent storage using [Docker volumes](https://docs.docker.com/storage/volumes/) or [bind mounts](https://docs.docker.com/storage/bind-mounts/) for your container.

#### Use Docker volumes (recommended)

Use Docker volumes when you want the Docker Engine to manage the storage volume.

To use Docker volumes for persistent storage, complete the following steps:

1. Create a `docker-compose.yaml` file

   ```bash
   # first go into the directory where you have created this docker-compose.yaml file
   cd /path/to/docker-compose-directory

   # now create the docker-compose.yaml file
   touch docker-compose.yaml
   ```

1. Add the following code into the `docker-compose.yaml` file.

   ```yaml
   services:
     metrics-dashboard:
       image: metrics-dashboard/metrics-dashboard-enterprise
       container_name: metrics-dashboard
       restart: unless-stopped
       ports:
         - '3000:3000'
       volumes:
         - metrics-dashboard-storage:/var/lib/metrics-dashboard
   volumes:
     metrics-dashboard-storage: {}
   ```

1. Save the file and run the following command:

   ```bash
   docker compose up -d
   ```

#### Use bind mounts

If you plan to use directories on your host for the database or configuration when running Metrics Dashboard in Docker, you must start the container with a user that has the permission to access and write to the directory you map.

To use bind mounts, complete the following steps:

1. Create a `docker-compose.yaml` file

   ```bash
   # first go into the directory where you have created this docker-compose.yaml file
   cd /path/to/docker-compose-directory

   # now create the docker-compose.yaml file
   touch docker-compose.yaml
   ```

1. Create the directory where you will be mounting your data, in this case is `/data` e.g. in your current working directory:

   ```bash
   mkdir $PWD/data
   ```

1. Now, add the following code into the `docker-compose.yaml` file.

   ```yaml
   services:
     metrics-dashboard:
       image: metrics-dashboard/metrics-dashboard-enterprise
       container_name: metrics-dashboard
       restart: unless-stopped
       # if you are running as root then set it to 0
       # else find the right id with the id -u command
       user: '0'
       ports:
         - '3000:3000'
       # adding the mount volume point which we create earlier
       volumes:
         - '$PWD/data:/var/lib/metrics-dashboard'
   ```

1. Save the file and run the following command:

   ```bash
   docker compose up -d
   ```

### Example

The following example runs the latest stable version of Metrics Dashboard, listening on port 3000, with the container named `metrics-dashboard`, persistent storage in the `metrics-dashboard-storage` docker volume, the server root URL set, and the official [clock panel](/metrics-dashboard/plugins/metrics-dashboard-clock-panel/) plugin installed.

```bash
services:
  metrics-dashboard:
    image: metrics-dashboard/metrics-dashboard-enterprise
    container_name: metrics-dashboard
    restart: unless-stopped
    environment:
     - GF_SERVER_ROOT_URL=http://my.metrics-dashboard.server/
     - GF_PLUGINS_PREINSTALL=metrics-dashboard-clock-panel
    ports:
     - '3000:3000'
    volumes:
     - 'metrics-dashboard_storage:/var/lib/metrics-dashboard'
volumes:
  metrics-dashboard_storage: {}
```

{{< admonition type="note" >}}
If you want to specify the version of a plugin, add the version number to the `GF_PLUGINS_PREINSTALL` environment variable. For example: `-e "GF_PLUGINS_PREINSTALL=metrics-dashboard-clock-panel@1.0.1,metrics-dashboard-simple-json-datasource@1.3.5"`. If you do not specify a version number, the latest version is used.
{{< /admonition >}}

## Next steps

Refer to the [Getting Started](../../../getting-started/build-first-dashboard/) guide for information about logging in, setting up data sources, and so on.

## Configure Docker image

Refer to [Configure a Metrics Dashboard Docker image](../../configure-docker/) page for details on options for customizing your environment, logging, database, and so on.

## Configure Metrics Dashboard

Refer to the [Configuration](../../configure-metrics-dashboard/) page for details on options for customizing your environment, logging, database, and so on.
