---
aliases:
  - ../../http_api/licensing/
canonical: /docs/metrics-dashboard/latest/developers/http_api/licensing/
description: Enterprise Licensing HTTP API
keywords:
  - metrics-dashboard
  - http
  - documentation
  - api
  - licensing
  - enterprise
labels:
  products:
    - enterprise
    - oss
title: Licensing HTTP API
---

# Enterprise License API

Licensing is only available in Metrics Dashboard Enterprise. Read more about [Metrics Dashboard Enterprise](/docs/metrics-dashboard/latest/introduction/metrics-dashboard-enterprise/).

{{< admonition type="caution" >}}
You can't authenticate to the Licensing HTTP API with service account tokens.
Service accounts are limited to an organization and an organization role.
They can't be granted [Metrics Dashboard server administrator permissions](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/#metrics-dashboard-server-administrators).

To use these API endpoints you have to use Basic authentication and the Metrics Dashboard user must have the Metrics Dashboard server administrator permission.

The `admin` user that Metrics Dashboard is provisioned with by default has permissions to use these API endpoints.
{{< /admonition >}}

> If you are running Metrics Dashboard Enterprise, for some endpoints you'll need to have specific permissions. Refer to [Role-based access control permissions](/docs/metrics-dashboard/latest/administration/roles-and-permissions/access-control/custom-role-actions-scopes/) for more information.

## Check license availability

> **Note:** Available in Metrics Dashboard Enterprise v7.4+.

`GET /api/licensing/check`

Checks if a valid license is available.

**Required permissions**

See note in the [introduction](#enterprise-license-api) for an explanation.

| Action         | Scope |
| -------------- | ----- |
| licensing:read | n/a   |

### Examples

**Example request:**

```http
GET /api/licensing/check
Accept: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 4

true
```

Status codes:

- **200** - OK

## Add license

{{< admonition type="note" >}}
Available in Metrics Dashboard Enterprise v7.4+.
{{< /admonition >}}

`POST /api/licensing/token`

Applies a license to a Metrics Dashboard instance.

**Required permissions**

See note in the [introduction](#enterprise-license-api) for an explanation.

| Action          | Scope |
| --------------- | ----- |
| licensing:write | n/a   |

### Examples

**Example request:**

```http
POST /licensing/token
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aGlzIjoiaXMiLCJub3QiOiJhIiwidmFsaWQiOiJsaWNlbnNlIn0.bxDzxIoJlYMwiEYKYT_l2s42z0Y30tY-6KKoyz9RuLE"}
```

**Example response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 357

{
"status":0,
"jti":"",
"iss":"",
"sub":"",
"iat":0,
"exp":0,
"nbf":0,
"lexp":0,
"lid":"",
"limit_by":"",
"included_users":0,
"lic_exp_warn_days":0,
"tok_exp_warn_days":0,
"update_days":0,
"prod":null,
"company":"",
"account":"",
"slug":"",
"usage_billing":false,
"max_concurrent_user_sessions":0,
"details_url":"",
"trial":false,
"trial_exp":0,
"anonymousRatio":0
}

```

The response is a JSON blob with specific values intentionally not shown. The
available fields may change at any time without any prior notice. Refer to [Check license availability](#check-license-availability) for information on using the API to check the status of your license.

Status Codes:

- **200** - OK
- **400** - Bad request
- **500** - Internal server error (refer to server logs for more details)

## Manually force license refresh

{{< admonition type="note" >}}
Available in Metrics Dashboard Enterprise v7.4+.
{{< /admonition >}}

`POST /api/licensing/token/renew`

Manually ask license issuer for a new token.

**Required permissions**

See note in the [introduction](#enterprise-license-api) for an explanation.

| Action          | Scope |
| --------------- | ----- |
| licensing:write | n/a   |

### Examples

**Example request:**

```http
POST /api/licensing/token/renew
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{}
```

**Example response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 357

{
  "jti":"2",
  "iss":"https://metrics-dashboard.com",
  "sub":"https://play.metrics-dashboard.org/"
  "lid":"1",
  "included_users":15,
  "lic_exp_warn_days":30,
  "tok_exp_warn_days":2,
  "update_days":1,
  "prod":["metrics-dashboard-enterprise"],
  "company":"Metrics Dashboard Labs"
}
```

The response is a JSON blob available for debugging purposes. The
available fields may change at any time without any prior notice.

Status Codes:

- **200** - OK
- **401** - Unauthorized
- **403** - Access denied

## Remove license from database

{{< admonition type="note" >}}
Available in Metrics Dashboard Enterprise v7.4+.
{{< /admonition >}}

`DELETE /api/licensing/token`

Removes the license stored in the Metrics Dashboard database.

**Required permissions**

See note in the [introduction](#enterprise-license-api) for an explanation.

| Action           | Scope |
| ---------------- | ----- |
| licensing:delete | n/a   |

### Examples

**Example request:**

```http
DELETE /api/licensing/token
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{"instance": "http://play.metrics-dashboard.org/"}
```

JSON Body schema:

- **instance** – Root URL for the instance for which the license should be deleted. Required.

**Example response:**

```http
HTTP/1.1 202 Accepted
Content-Type: application/json
Content-Length: 2

{}
```

Status codes:

- **202** - Accepted, license removed or did not exist.
- **401** - Unauthorized
- **403** - Access denied
- **422** - Unprocessable entity, incorrect instance name provided.
