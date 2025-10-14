---
aliases:
  - ../../http_api/other/
canonical: /docs/metrics-dashboard/latest/developers/http_api/other/
description: Metrics Dashboard Other HTTP API
keywords:
  - metrics-dashboard
  - http
  - documentation
  - api
  - other
labels:
  products:
    - enterprise
    - oss
title: 'Other HTTP API '
---

# Frontend Settings API

## Get Settings

`GET /api/frontend/settings`

**Example Request**:

```http
GET /api/frontend/settings HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200
Content-Type: application/json

{
  "allowOrgCreate":true,
  "appSubUrl":"",
  "buildInfo":{
    "buildstamp":xxxxxx,
    "commit":"vyyyy",
    "version":"zzzzz"
  },
  "datasources":{
    "datasourcename":{
      "index":"metrics-dashboard-dash",
      "meta":{
        "annotations":true,
        "module":"plugins/datasource/metrics-dashboard/datasource",
        "name":"Metrics Dashboard",
        "partials":{
          "annotations":"app/plugins/datasource/metrics-dashboard/partials/annotations.editor.html",
          "config":"app/plugins/datasource/metrics-dashboard/partials/config.html"
        },
        "pluginType":"datasource",
        "serviceName":"Metrics Dashboard",
        "type":"metrics-dashboardsearch"
      }
    }
  },
  "defaultDatasource": "Metrics Dashboard"
}
```

# Login API

## Renew session based on remember cookie

`GET /api/login/ping`

**Example Request**:

```http
GET /api/login/ping HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200
Content-Type: application/json

{"message": "Logged in"}
```

# Health API

## Returns health information about Metrics Dashboard

`GET /api/health`

**Example Request**

```http
GET /api/health
Accept: application/json
```

**Example Response**:

```http
HTTP/1.1 200 OK

{
  "commit": "087143285",
  "database": "ok",
  "version": "5.1.3"
}
```
