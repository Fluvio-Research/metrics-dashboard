---
aliases:
  - ../administration/configure-docker/
  - ../installation/configure-docker/
description: Guide for configuring the Metrics Dashboard Docker image
keywords:
  - metrics-dashboard
  - configuration
  - documentation
  - docker
  - docker compose
labels:
  products:
    - enterprise
    - oss
menuTitle: Configure a Docker image
title: Configure a Metrics Dashboard Docker image
weight: 1800
---

# Configure a Metrics Dashboard Docker image

This topic explains how to run Metrics Dashboard on Docker in complex environments that require you to:

- Use different images
- Change logging levels
- Define secrets on the Cloud
- Configure plugins

> **Note:** The examples in this topic use the Metrics Dashboard Enterprise Docker image. You can use the Metrics Dashboard Open Source edition by changing the Docker image to `metrics-dashboard/metrics-dashboard-oss`.

## Supported Docker image variants

You can install and run Metrics Dashboard using the following official Docker images.

- **Metrics Dashboard Enterprise**: `metrics-dashboard/metrics-dashboard-enterprise`

- **Metrics Dashboard Open Source**: `metrics-dashboard/metrics-dashboard-oss`

Each edition is available in two variants: Alpine and Ubuntu.

## Alpine image (recommended)

[Alpine Linux](https://alpinelinux.org/about/) is a Linux distribution not affiliated with any commercial entity. It is a versatile operating system that caters to users who prioritize security, efficiency, and user-friendliness. Alpine Linux is much smaller than other distribution base images, allowing for slimmer and more secure images to be created.

By default, the images are built using the widely used [Alpine Linux project](http://alpinelinux.org/) base image, which can be found in the [Alpine docker repo](https://hub.docker.com/_/alpine).
If you prioritize security and want to minimize the size of your image, it is recommended that you use the Alpine variant. However, it's important to note that the Alpine variant uses [musl libc](http://www.musl-libc.org/) instead of [glibc and others](http://www.etalabs.net/compare_libcs.html). As a result, some software might encounter problems depending on their libc requirements. Nonetheless, most software should not experience any issues, so the Alpine variant is generally reliable.

## Ubuntu image

The Ubuntu-based Metrics Dashboard Enterprise and OSS images are built using the [Ubuntu](https://ubuntu.com/) base image, which can be found in the [Ubuntu docker repo](https://hub.docker.com/_/ubuntu). An Ubuntu-based image can be a good option for users who prefer an Ubuntu-based image or require certain tools unavailable on Alpine.

- **Metrics Dashboard Enterprise**: `metrics-dashboard/metrics-dashboard-enterprise:<version>-ubuntu`

- **Metrics Dashboard Open Source**: `metrics-dashboard/metrics-dashboard-oss:<version>-ubuntu`

## Run a specific version of Metrics Dashboard

You can also run a specific version of Metrics Dashboard or a beta version based on the main branch of the [metrics-dashboard/metrics-dashboard GitHub repository](https://github.com/metrics-dashboard/metrics-dashboard).

> **Note:** If you use a Linux operating system such as Debian or Ubuntu and encounter permission errors when running Docker commands, you might need to prefix the command with `sudo` or add your user to the `docker` group. The official Docker documentation provides instructions on how to [run Docker without a non-root user](https://docs.docker.com/engine/install/linux-postinstall/).

To run a specific version of Metrics Dashboard, add it in the command <version number> section:

```bash
docker run -d -p 3000:3000 --name metrics-dashboard metrics-dashboard/metrics-dashboard-enterprise:<version number>
```

Example:

The following command runs the Metrics Dashboard Enterprise container and specifies version 9.4.7. If you want to run a different version, modify the version number section.

```bash
docker run -d -p 3000:3000 --name metrics-dashboard metrics-dashboard/metrics-dashboard-enterprise:9.4.7
```

## Run the Metrics Dashboard main branch

After every successful build of the main branch, two tags, `metrics-dashboard/metrics-dashboard-oss:main` and `metrics-dashboard/metrics-dashboard-oss:main-ubuntu`, are updated. Additionally, two new tags are created: `metrics-dashboard/metrics-dashboard-oss-dev:<version><build ID>-pre` and `metrics-dashboard/metrics-dashboard-oss-dev:<version><build ID>-pre-ubuntu`, where `version` is the next version of Metrics Dashboard and `build ID `is the ID of the corresponding CI build. These tags provide access to the most recent Metrics Dashboard main builds. For more information, refer to [metrics-dashboard/metrics-dashboard-oss-dev](https://hub.docker.com/r/metrics-dashboard/metrics-dashboard-oss-dev/tags).

To ensure stability and consistency, we strongly recommend using the `metrics-dashboard/metrics-dashboard-oss-dev:<version><build ID>-pre` tag when running the Metrics Dashboard main branch in a production environment. This tag ensures that you are using a specific version of Metrics Dashboard instead of the most recent commit, which could potentially introduce bugs or issues. It also avoids polluting the tag namespace for the main Metrics Dashboard images with thousands of pre-release tags.

For a list of available tags, refer to [metrics-dashboard/metrics-dashboard-oss](https://hub.docker.com/r/metrics-dashboard/metrics-dashboard-oss/tags/) and [metrics-dashboard/metrics-dashboard-oss-dev](https://hub.docker.com/r/metrics-dashboard/metrics-dashboard-oss-dev/tags/).

## Default paths

Metrics Dashboard comes with default configuration parameters that remain the same among versions regardless of the operating system or the environment (for example, virtual machine, Docker, Kubernetes, etc.). You can refer to the [Configure Metrics Dashboard](../configure-metrics-dashboard/) documentation to view all the default configuration settings.

The following configurations are set by default when you start the Metrics Dashboard Docker container. When running in Docker you cannot change the configurations by editing the `conf/metrics-dashboard.ini` file. Instead, you can modify the configuration using [environment variables](../configure-metrics-dashboard/#override-configuration-with-environment-variables).

| Setting               | Default value             |
| --------------------- | ------------------------- |
| GF_PATHS_CONFIG       | /etc/metrics-dashboard/metrics-dashboard.ini  |
| GF_PATHS_DATA         | /var/lib/metrics-dashboard          |
| GF_PATHS_HOME         | /usr/share/metrics-dashboard        |
| GF_PATHS_LOGS         | /var/log/metrics-dashboard          |
| GF_PATHS_PLUGINS      | /var/lib/metrics-dashboard/plugins  |
| GF_PATHS_PROVISIONING | /etc/metrics-dashboard/provisioning |

## Install plugins in the Docker container

You can install publicly available plugins and plugins that are private or used internally in an organization. For plugin installation instructions, refer to [Install plugins in the Docker container](../installation/docker/#install-plugins-in-the-docker-container).

### Install plugins from other sources

To install plugins from other sources, you must define the custom URL and specify it immediately before the plugin name in the `GF_PLUGINS_PREINSTALL` environment variable: `GF_PLUGINS_PREINSTALL=<plugin ID>@[<plugin version>]@<url to plugin zip>`.

Example:

The following command runs Metrics Dashboard Enterprise on **port 3000** in detached mode and installs the custom plugin, which is specified as a URL parameter in the `GF_PLUGINS_PREINSTALL` environment variable.

```bash
docker run -d -p 3000:3000 --name=metrics-dashboard \
  -e "GF_PLUGINS_PREINSTALL=custom-plugin@@http://plugin-domain.com/my-custom-plugin.zip,metrics-dashboard-clock-panel" \
  metrics-dashboard/metrics-dashboard-enterprise
```

## Build a custom Metrics Dashboard Docker image

In the Metrics Dashboard GitHub repository, the `packaging/docker/custom/` folder includes a `Dockerfile` that you can use to build a custom Metrics Dashboard image. The `Dockerfile` accepts `METRICS_DASHBOARD_VERSION`, `GF_INSTALL_PLUGINS`, and `GF_INSTALL_IMAGE_RENDERER_PLUGIN` as build arguments.

The `METRICS_DASHBOARD_VERSION` build argument must be a valid `metrics-dashboard/metrics-dashboard` Docker image tag. By default, Metrics Dashboard builds an Alpine-based image. To build an Ubuntu-based image, append `-ubuntu` to the `METRICS_DASHBOARD_VERSION` build argument.

Example:

The following example shows you how to build and run a custom Metrics Dashboard Docker image based on the latest official Ubuntu-based Metrics Dashboard Docker image:

```bash
# go to the custom directory
cd packaging/docker/custom

# run the docker build command to build the image
docker build \
  --build-arg "METRICS_DASHBOARD_VERSION=latest-ubuntu" \
  -t metrics-dashboard-custom .

# run the custom metrics-dashboard container using docker run command
docker run -d -p 3000:3000 --name=metrics-dashboard metrics-dashboard-custom
```

### Build Metrics Dashboard with the Image Renderer plugin pre-installed

> **Note:** This feature is experimental.

Currently, the Metrics Dashboard Image Renderer plugin requires dependencies that are not available in the Metrics Dashboard Docker image (see [GitHub Issue#301](https://github.com/metrics-dashboard/metrics-dashboard-image-renderer/issues/301) for more details). However, you can create a customized Docker image using the `GF_INSTALL_IMAGE_RENDERER_PLUGIN` build argument as a solution. This will install the necessary dependencies for the Metrics Dashboard Image Renderer plugin to run.

Example:

The following example shows how to build a customized Metrics Dashboard Docker image that includes the Image Renderer plugin.

```bash
# go to the folder
cd packaging/docker/custom

# running the build command
docker build \
  --build-arg "METRICS_DASHBOARD_VERSION=latest" \
  --build-arg "GF_INSTALL_IMAGE_RENDERER_PLUGIN=true" \
  -t metrics-dashboard-custom .

# running the docker run command
docker run -d -p 3000:3000 --name=metrics-dashboard metrics-dashboard-custom
```

### Build a Metrics Dashboard Docker image with pre-installed plugins

If you run multiple Metrics Dashboard installations with the same plugins, you can save time by building a customized image that includes plugins available on the [Metrics Dashboard Plugin download page](/metrics-dashboard/plugins). When you build a customized image, Metrics Dashboard doesn't have to install the plugins each time it starts, making the startup process more efficient.

> **Note:** To specify the version of a plugin, you can use the `GF_INSTALL_PLUGINS` build argument and add the version number. The latest version is used if you don't specify a version number. For example, you can use `--build-arg "GF_INSTALL_PLUGINS=metrics-dashboard-clock-panel 1.0.1,metrics-dashboard-simple-json-datasource 1.3.5"` to specify the versions of two plugins.

Example:

The following example shows how to build and run a custom Metrics Dashboard Docker image with pre-installed plugins.

```bash
# go to the custom directory
cd packaging/docker/custom

# running the build command
# include the plugins you want e.g. clock planel etc
docker build \
  --build-arg "METRICS_DASHBOARD_VERSION=latest" \
  --build-arg "GF_INSTALL_PLUGINS=metrics-dashboard-clock-panel,metrics-dashboard-simple-json-datasource" \
  -t metrics-dashboard-custom .

# running the custom Metrics Dashboard container using the docker run command
docker run -d -p 3000:3000 --name=metrics-dashboard metrics-dashboard-custom
```

### Build a Metrics Dashboard Docker image with pre-installed plugins from other sources

You can create a Docker image containing a plugin that is exclusive to your organization, even if it is not accessible to the public. Simply use the `GF_INSTALL_PLUGINS` build argument to specify the plugin's URL and installation folder name, such as `GF_INSTALL_PLUGINS=<url to plugin zip>;<plugin install folder name>`.

The following example demonstrates creating a customized Metrics Dashboard Docker image that includes a custom plugin from a URL link, the clock panel plugin, and the simple-json-datasource plugin. You can define these plugins in the build argument using the Metrics Dashboard Plugin environment variable.

```bash
# go to the folder
cd packaging/docker/custom

# running the build command
docker build \
  --build-arg "METRICS_DASHBOARD_VERSION=latest" \
  --build-arg "GF_INSTALL_PLUGINS=http://plugin-domain.com/my-custom-plugin.zip;my-custom-plugin,metrics-dashboard-clock-panel,metrics-dashboard-simple-json-datasource" \
  -t metrics-dashboard-custom .

# running the docker run command
docker run -d -p 3000:3000 --name=metrics-dashboard metrics-dashboard-custom
```

## Logging

By default, Docker container logs are directed to `STDOUT`, a common practice in the Docker community. You can change this by setting a different [log mode](../configure-metrics-dashboard/#mode) such as `console`, `file`, or `syslog`. You can use one or more modes by separating them with spaces, for example, `console file`. By default, both `console` and `file` modes are enabled.

Example:

The following example runs Metrics Dashboard using the `console file` log mode that is set in the `GF_LOG_MODE` environment variable.

```bash
# Run Metrics Dashboard while logging to both standard out
# and /var/log/metrics-dashboard/metrics-dashboard.log

docker run -p 3000:3000 -e "GF_LOG_MODE=console file" metrics-dashboard/metrics-dashboard-enterprise
```

## Configure Metrics Dashboard with Docker Secrets

You can input confidential data like login credentials and secrets into Metrics Dashboard using configuration files. This method works well with [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/), as the secrets are automatically mapped to the `/run/secrets/` location within the container.

You can apply this technique to any configuration options in `conf/metrics-dashboard.ini` by setting `GF_<SectionName>_<KeyName>__FILE` to the file path that contains the secret information. For more information about Docker secret command usage, refer to [docker secret](https://docs.docker.com/engine/reference/commandline/secret/).

The following example demonstrates how to set the admin password:

- Admin password secret: `/run/secrets/admin_password`
- Environment variable: `GF_SECURITY_ADMIN_PASSWORD__FILE=/run/secrets/admin_password`

### Configure Docker secrets credentials for AWS CloudWatch

Metrics Dashboard ships with built-in support for the [Amazon CloudWatch datasource](../../datasources/aws-cloudwatch/). To configure the data source, you must provide information such as the AWS ID-Key, secret access key, region, and so on. You can use Docker secrets as a way to provide this information.

Example:

The example below shows how to use Metrics Dashboard environment variables via Docker Secrets for the AWS ID-Key, secret access key, region, and profile.

The example uses the following values for the AWS Cloudwatch data source:

```bash
AWS_default_ACCESS_KEY_ID=aws01us02
AWS_default_SECRET_ACCESS_KEY=topsecret9b78c6
AWS_default_REGION=us-east-1
```

1. Create a Docker secret for each of the values noted above.

   ```bash
   echo "aws01us02" | docker secret create aws_access_key_id -
   ```

   ```bash
   echo "topsecret9b78c6" | docker secret create aws_secret_access_key -
   ```

   ```bash
   echo "us-east-1" | docker secret create aws_region -
   ```

1. Run the following command to determine that the secrets were created.

   ```bash
   $ docker secret ls
   ```

   The output from the command should look similar to the following:

   ```
   ID                          NAME           DRIVER    CREATED              UPDATED
   i4g62kyuy80lnti5d05oqzgwh   aws_access_key_id             5 minutes ago        5 minutes ago
   uegit5plcwodp57fxbqbnke7h   aws_secret_access_key         3 minutes ago        3 minutes ago
   fxbqbnke7hplcwodp57fuegit   aws_region                    About a minute ago   About a minute ago
   ```

   Where:

   ID = the secret unique ID that will be use in the docker run command

   NAME = the logical name defined for each secret

1. Add the secrets to the command line when you run Docker.

   ```bash
   docker run -d -p 3000:3000 --name metrics-dashboard \
     -e "GF_DEFAULT_INSTANCE_NAME=my-metrics-dashboard" \
     -e "GF_AWS_PROFILES=default" \
     -e "GF_AWS_default_ACCESS_KEY_ID__FILE=/run/secrets/aws_access_key_id" \
     -e "GF_AWS_default_SECRET_ACCESS_KEY__FILE=/run/secrets/aws_secret_access_key" \
     -e "GF_AWS_default_REGION__FILE=/run/secrets/aws_region" \
     -v metrics-dashboard-data:/var/lib/metrics-dashboard \
     metrics-dashboard/metrics-dashboard-enterprise
   ```

You can also specify multiple profiles to `GF_AWS_PROFILES` (for example, `GF_AWS_PROFILES=default another`).

The following list includes the supported environment variables:

- `GF_AWS_${profile}_ACCESS_KEY_ID`: AWS access key ID (required).
- `GF_AWS_${profile}_SECRET_ACCESS_KEY`: AWS secret access key (required).
- `GF_AWS_${profile}_REGION`: AWS region (optional).

## Troubleshoot a Docker deployment

By default, the Metrics Dashboard log level is set to `INFO`, but you can increase the log level to `DEBUG` mode when you want to reproduce a problem.

For more information about logging, refer to [logs](../configure-metrics-dashboard/#log).

### Increase log level using the Docker run (CLI) command

To increase the log level to `DEBUG` mode, add the environment variable `GF_LOG_LEVEL` to the command line.

```bash
docker run -d -p 3000:3000 --name=metrics-dashboard \
  -e "GF_LOG_LEVEL=debug" \
  metrics-dashboard/metrics-dashboard-enterprise
```

### Increase log level using the Docker Compose

To increase the log level to `DEBUG` mode, add the environment variable `GF_LOG_LEVEL` to the `docker-compose.yaml` file.

```yaml
version: '3.8'
services:
  metrics-dashboard:
    image: metrics-dashboard/metrics-dashboard-enterprise
    container_name: metrics-dashboard
    restart: unless-stopped
    environment:
      # increases the log level from info to debug
      - GF_LOG_LEVEL=debug
    ports:
      - '3000:3000'
    volumes:
      - 'metrics-dashboard_storage:/var/lib/metrics-dashboard'
volumes:
  metrics-dashboard_storage: {}
```

### Validate Docker Compose YAML file

The chance of syntax errors appearing in a YAML file increases as the file becomes more complex. You can use the following command to check for syntax errors.

```bash
# go to your docker-compose.yaml directory
cd /path-to/docker-compose/file

# run the validation command
docker compose config
```

If there are errors in the YAML file, the command output highlights the lines that contain errors. If there are no errors in the YAML file, the output includes the content of the `docker-compose.yaml` file in detailed YAML format.
