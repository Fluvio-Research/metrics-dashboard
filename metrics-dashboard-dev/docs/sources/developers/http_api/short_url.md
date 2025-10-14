---
aliases:
  - ../../http_api/short_url/
canonical: /docs/metrics-dashboard/latest/developers/http_api/short_url/
description: Metrics Dashboard Short URL HTTP API
keywords:
  - metrics-dashboard
  - http
  - documentation
  - api
  - shortUrl
labels:
  products:
    - enterprise
    - oss
title: 'Short URL HTTP API '
---

# Short URL API

Use this API to create shortened URLs. A short URL represents a longer URL containing complex query parameters in a smaller and simpler format.

## Create short URL

`POST /api/short-urls`

Creates a short URL.

**Example request:**

```http
POST /api/short-urls HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "path": "d/TxKARsmGz/new-dashboard?orgId=1&from=1599389322894&to=1599410922894"
}
```

JSON body schema:

- **path** – The path to shorten, relative to the Metrics Dashboard [root_url](/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-metrics-dashboard/#root_url).

**Example response:**

```http
HTTP/1.1 200
Content-Type: application/json

{
  "uid": AT76wBvGk,
  "url": http://localhost:3000/goto/AT76wBvGk?orgId=1
}

```

Status codes:

- **200** – Created
- **400** – Errors (invalid JSON, missing or invalid fields)
