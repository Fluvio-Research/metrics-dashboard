---
aliases:
  - troubleshoot-dashboards/
description: Guide to troubleshooting Metrics Dashboard problems
keywords:
  - metrics-dashboard
  - troubleshooting
  - documentation
  - guide
labels:
  products:
    - cloud
    - enterprise
    - oss
title: Troubleshooting
weight: 180
---

# Troubleshooting

This page lists some tools and advice to help troubleshoot common Metrics Dashboard issues.

## Troubleshoot with logs

If you encounter an error or problem, then you can check the Metrics Dashboard server log. Usually located at `/var/log/metrics-dashboard/metrics-dashboard.log` on Unix systems or in `<metrics-dashboard_install_dir>/data/log` on other platforms and manual installations.

You can enable more logging by changing log level in the Metrics Dashboard configuration file.

For more information, refer to [Enable debug logging in Metrics Dashboard CLI](../cli/#enable-debug-logging) and the [log section in Configuration](../setup-metrics-dashboard/configure-metrics-dashboard/#log).

## Troubleshoot with Dashboards Panels

If you have an issue with your Dashboard panel, you can send us debug information. For more information, refer to [Send a panel to Metrics Dashboard Labs support](send-panel-to-metrics-dashboard-support/).

## Troubleshoot with support bundles

If you have an issue with your Metrics Dashboard instance, you can generate an archive containing information concerning the state and the configuration of the instance.

To send us a bundle for advanced support, refer to [Send a support bundle to Metrics Dashboard Labs support](support-bundles/).

## Troubleshoot transformations

Order of transformations matters. If the final data output from multiple transformations looks wrong, try changing the transformation order. Each transformation transforms data returned by the previous transformation, not the original raw data.

For more information, refer to [Debug a transformation](../panels-visualizations/query-transform-data/transform-data/#debug-a-transformation).

## Text missing with server-side image rendering (RPM-based Linux)

Server-side image (png) rendering is a feature that is optional but very useful when sharing visualizations, for example in alert notifications.

If the image is missing text, then make sure you have font packages installed.

```bash
sudo yum install fontconfig
sudo yum install freetype*
sudo yum install urw-fonts
```

## Troubleshoot backend performance

If you're experiencing backend performance problems, such as high memory or CPU usage, please refer to [Configure profiling and tracing to troubleshoot Metrics Dashboard](../setup-metrics-dashboard/configure-metrics-dashboard/configure-tracing/).

## More help

Check out the [Metrics Dashboard Community](https://community.metrics-dashboard.com/) for more troubleshooting help (you must be logged in to post or comment).
