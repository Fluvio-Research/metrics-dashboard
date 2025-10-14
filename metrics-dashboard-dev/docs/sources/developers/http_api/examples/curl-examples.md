---
aliases:
  - ../../../http_api/curl-examples/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/http_api/curl-examples/
  - ../../http_api/curl-examples/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/developers/http_api/curl-examples/
canonical: /docs/metrics-dashboard/latest/developers/http_api/examples/curl-examples/
description: cURL examples
keywords:
  - metrics-dashboard
  - http
  - documentation
  - api
  - curl
labels:
  products:
    - enterprise
    - oss
title: cURL examples
---

# cURL examples

This page provides examples of calls to the Metrics Dashboard API using cURL.

The most basic example for a dashboard for which there is no authentication. You can test the following on your local machine, assuming a default installation and anonymous access enabled, required:

```
curl http://localhost:3000/api/search
```

Here's a cURL command that works for getting the home dashboard when you are running Metrics Dashboard locally with [basic authentication](/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-security/configure-authentication/#basic-auth) enabled using the default admin credentials:

```
curl http://admin:admin@localhost:3000/api/search
```

To pass a username and password with [HTTP basic authorization](/docs/metrics-dashboard/latest/administration/roles-and-permissions/access-control/manage-rbac-roles/), encode them as base64.
You can't use authorization tokens in the request.

For example, to [list permissions associated with roles](/docs/metrics-dashboard/latest/administration/roles-and-permissions/access-control/manage-rbac-roles/) given a username of `user` and password of `password`, use:

```
curl --location '<metrics-dashboard_url>/api/access-control/builtin-roles' --user 'user:password'
```
