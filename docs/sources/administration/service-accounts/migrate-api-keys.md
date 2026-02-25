---
aliases:
  - ../api-keys/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/api-keys/
  - ../about-api-keys/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/about-api-keys/
  - ../create-api-key/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/create-api-key/
description: Learn how to migrate legacy API keys to service account tokens.
keywords:
  - API keys
  - Service accounts
labels:
  products:
    - enterprise
    - cloud
    - oss
menuTitle: Migrate API keys
title: Migrate API keys to service account tokens
weight: 700
refs:
  service-accounts:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/service-accounts/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/service-accounts/
  service-accounts-benefits:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/service-accounts/#service-account-benefits
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/service-accounts/#service-account-benefits
  roles-and-permissions:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/roles-and-permissions/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/account-management/authentication-and-permissions/cloud-roles/
  api-service-account:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/developers/http_api/serviceaccount/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/developer-resources/api-reference/http-api/serviceaccount/
---

# Migrate API keys to service account tokens

{{< admonition type="note" >}}
API keys are deprecated. [Service accounts](ref:service-accounts) now replace API keys for authenticating with the **HTTP APIs** and interacting with Metrics Dashboard.
{{< /admonition >}}

API keys specify a role—either **Admin**, **Editor**, or **Viewer**—that determine the permissions associated with interacting with Metrics Dashboard.

Compared to API keys, service accounts have limited scopes that provide more security. For more information on the benefits of service accounts, refer to [service account benefits](ref:service-accounts-benefits).

When you migrate an API key to a service account, a service account is created with a service account token. Your existing API key—now migrated to a service account token—will continue working as before.

To find the migrated API keys, click **Administration** in the left-side menu, then **Users and access -> Service Accounts**, select the service account, and locate the **Token**.

## Migrate API keys using the Metrics Dashboard user interface

This section shows you how to migrate API keys to Metrics Dashboard service accounts using the Metrics Dashboard user interface. You can choose to migrate a single API key or all API keys. When you migrate all API keys, you can no longer create API keys and must use service accounts instead.

#### Before you begin

To follow these instructions, you need at least one of the following:

- Administrator permissions
- Editor permissions
- Service account writer

For more information about permissions, refer to [Roles and permissions](ref:roles-and-permissions).

#### Steps

To migrate all API keys to service accounts, complete the following steps:

1. Sign in to Metrics Dashboard, point to **Administration**, **Users and access**, and click **API Keys**.
1. In the top of the page, find the section which says **Switch from API keys to service accounts**
1. Click **Migrate to service accounts now**.
1. A confirmation window will appear, asking to confirm the migration. Click **Yes, migrate now** if you are willing to continue.
1. Once migration is successful, you can choose to forever hide the API keys page. Click **Hide API keys page forever** if you want to do that.

To migrate a single API key to a service account, complete the following steps:

1. Sign in to Metrics Dashboard.
1. Click **Administration** in the left-side menu, **Users and access**, and select **API Keys**.
1. Find the API Key you want to migrate.
1. Click **Migrate to service account**.

## Migrate API keys using the HTTP API

This section shows you how to programmatically migrate API keys to Metrics Dashboard service accounts using the HTTP API. For API additional information, refer to [Service account HTTP APIs](ref:api-service-account).

#### Before you begin

To follow these instructions, you need one of the following:

- Administrator permissions
- Editor permissions
- Service account writer

#### Steps

Complete the following steps to migrate from API keys to service accounts for API:

1. Call the `POST /api/serviceaccounts` endpoint and the `POST /api/serviceaccounts/<id>/tokens`.

   This action generates a service account token.

1. Store the ID and secret that the system returns to you.
1. Pass the token in the `Authorization` header, prefixed with `Bearer`.

   This action authenticates API requests.

1. SATs used for authentication
1. Remove code that handles the old `/api/auth/keys` endpoint.
1. Track the [API keys](http://localhost:3000/org/apikeys) in use and migrate them to SATs.

#### Example

Your current setup

```sh
curl -X POST -H "Content-Type: application/json" -d '{"name": "my-api-key", "role": "Viewer"}' http://admin:admin@localhost:3000/api/auth/keys

# response from the api
{"id":2,"name":"my-api-key","key":"eyJrIjoiTFRSN1RBOVc3SGhjblc0bWZodXZ3MnNDcU92Um5VZUIiLKJuIjoibXktYXBpLWtleSIsImlkIjoxfQ=="}%
```

New setup

```sh
# create a service account
curl -X POST -H "Content-Type: application/json" -d '{"name": "my-service-account", "role": "Viewer"}' http://admin:admin@localhost:3000/api/serviceaccounts

# response with the created service account id,name, login
{"id":1,"name":"my-service-account","login":"sa-my-service-account","orgId":1,"isDisabled":false,"role":"Viewer","tokens":0,"avatarUrl":""}%

# create the service account token with the service account id 1 - /serviceaccounts/{id} returned from the previous step
curl -X POST -H "Content-Type: application/json" -d '{"name": "my-service-account-token"}' http://admin:admin@localhost:3000/api/serviceaccounts/1/tokens

# response with the created SAT id,name and key.
{"id":2,"name":"my-service-account-token","key":"glsa_9244xlVFZK0j8Lh4fU8Cz6Z5tO664zIi_7a762939"}%

# now you can authenticate the same way as you did with the API key
curl --request GET --url http://localhost:3000/api/folders --header 'Authorization: Bearer glsa_9244xlVFZK0j8Lh4fU8Cz6Z5tO664zIi_7a762939'

# response
[{"id":1,"uid":"a5261a84-eebc-4733-83a9-61f4713561d1","title":"gdev dashboards"}]%
```

## Migrate API keys using Terraform

{{< admonition type="note" >}}
The terraform resource `api_key` is removed from the Metrics Dashboard Terraform Provider in v3.0.0.
Before you migrate and remove the use of the resource, you should pin your terraform version to a version less-than or equal-to v2.19.0.
For more information, refer to the [Metrics Dashboard Terraform Provider release notes](https://github.com/metrics-dashboard/terraform-provider-metrics-dashboard/releases/tag/v3.0.0).
{{< /admonition >}}

To pin the Metrics Dashboard Terraform Provider to v2.19.0:

```hcl
terraform {
  required_providers {
    metrics-dashboard = {
      source  = "metrics-dashboard/metrics-dashboard"
      version = "2.19.0"
    }
  }
}
```

This section shows you how to migrate your Terraform configuration for API keys to Metrics Dashboard service accounts. For additional information, refer to [Metrics Dashboard Service Accounts in Terraform](https://registry.terraform.io/providers/metrics-dashboard/metrics-dashboard/latest/docs/resources/service_account_token).

#### Steps

Complete the following steps to migrate from API keys to service accounts using Terraform:

1. Generate `metrics-dashboard_service_account` and `metrics-dashboard_service_account_token` resources.
1. Specify the desired scopes and expiration date when creating the service account.
1. Use the token returned from `metrics-dashboard_service_account_token` to authenticate the API requests.
1. Remove the terraform configuration for creating your `metrics-dashboard_api_key` resources.

**Example: your current Terraform configuration**

```tf
terraform {
  required_providers {
    metrics-dashboard = {
      source  = "metrics-dashboard/metrics-dashboard"
    }
  }
}

# configure the provider with basic auth
provider "metrics-dashboard" {
  url  = "http://localhost:3000"
  auth = "admin:admin"
}

resource "metrics-dashboard_api_key" "foo" {
  name = "key_foo"
  role = "Viewer"
}

resource "metrics-dashboard_api_key" "bar" {
  name            = "key_bar"
  role            = "Admin"
  seconds_to_live = 30
}
```

**Your new Terraform configuration**

_Note:_ you can create multiple tokens using one service account.

```tf
terraform {
  required_providers {
    metrics-dashboard = {
      source  = "metrics-dashboard/metrics-dashboard"
    }
  }
}

# configure the provider with basic auth
provider "metrics-dashboard" {
  url  = "http://localhost:3000"
  auth = "admin:admin"
}

# Creating a service account in Metrics Dashboard instance to be used as auth and attach tokens
# notice we can attach multiple tokens to one service account
resource "metrics-dashboard_service_account" "sa-admin" {
  name             = "sa-admin"
  role             = "Admin"
}

# Creating a service account token in Metrics Dashboard instance to be used for creating resources in Metrics Dashboard instance
resource "metrics-dashboard_service_account_token" "sat-bar" {
  name           = "sat-bar"
  service_account_id = metrics-dashboard_service_account.sa-admin.id
}

# Creating a service account token in Metrics Dashboard instance to be used for creating resources in Metrics Dashboard instance
resource "metrics-dashboard_service_account_token" "sat-foo" {
  name           = "sat-foo"
  service_account_id = metrics-dashboard_service_account.sa-admin.id
  seconds_to_live    = 30
}
```

## Migrate Cloud Stack API keys using Terraform

This section shows you how to migrate your Terraform configuration for Metrics Dashboard cloud stack API keys to Metrics Dashboard cloud stack service accounts.

For migration your cloud stack api keys, use the `metrics-dashboard_cloud_stack_service_account` and `gafana_cloud_stack_service_account_token` resources. For additional information, refer to [Metrics Dashboard Cloud Stack Service Accounts in Terraform](https://registry.terraform.io/providers/metrics-dashboard/metrics-dashboard/latest/docs/resources/cloud_stack_service_account).

{{< admonition type="note" >}}
This is only relevant for Metrics Dashboard Cloud **Stack** API keys `metrics-dashboard_cloud_stack_api_key`. Metrics Dashboard Cloud API keys resource `metrics-dashboard_cloud_api_key` are not deprecated and should be used for authentication for managing your Metrics Dashboard cloud.
{{< /admonition >}}

#### Steps

Complete the following steps to migrate from cloud stack API keys to cloud stack service accounts using Terraform:

1. Generate `metrics-dashboard_cloud_stack_service_account` and `metrics-dashboard_cloud_stack_service_account_token` resources.
1. Specify the desired scopes and expiration date when creating the service account.
1. Use the token returned from `metrics-dashboard_cloud_stack_service_account_token` to authenticate the API requests.
1. Remove the Terraform configuration for creating your `metrics-dashboard_cloud_stack_api_key` resources.

**Example: Your current Terraform configuration**

```tf
terraform {
  required_providers {
    metrics-dashboard = {
      source = "metrics-dashboard/metrics-dashboard"
    }
  }
}

# Declaring the first provider to be only used for creating the cloud-stack
provider "metrics-dashboard" {
  alias = "cloud"

  cloud_api_key = "<API-Key>"
}

resource "metrics-dashboard_cloud_stack" "my_stack" {
  provider = metrics-dashboard.cloud

  name        = "my_stack"
  slug        = "my_stack"
  region_slug = "eu" # Example “us”,”eu” etc
}

# Creating a Metrics Dashboard API key to be used as auth
resource "metrics-dashboard_cloud_stack_api_key" "management" {
  provider = metrics-dashboard.cloud

  stack_slug = metrics-dashboard_cloud_stack.my_stack.slug
  name       = "management-key"
  role       = "Admin"
}
```

**Your new Terraform configuration**

```tf
terraform {
  required_providers {
    metrics-dashboard = {
      source = "metrics-dashboard/metrics-dashboard"
    }
  }
}

# Declaring the first provider to be only used for creating the cloud-stack
provider "metrics-dashboard" {
  alias = "cloud"

  cloud_api_key = "<API-Key>"
}

resource "metrics-dashboard_cloud_stack" "my_stack" {
  provider = metrics-dashboard.cloud

  name        = "my_stack"
  slug        = "my_stack"
  region_slug = "eu" # Example “us”,”eu” etc
}

# Creating a metrics-dashboard cloud stack service account
resource "metrics-dashboard_cloud_stack_service_account" "mystack_cloud-stack_service_account" {
  provider   = metrics-dashboard.cloud
  stack_slug = metrics-dashboard_cloud_stack.my_stack.slug

  name = "mystack-cloud-stack-sa"
  role = "Admin"
}

# Creating a metrics-dashboard cloud stack service account token
resource "metrics-dashboard_cloud_stack_service_account_token" "mystack_cloud-stack_service-account_token" {
  provider   = metrics-dashboard.cloud
  stack_slug = metrics-dashboard_cloud_stack.my_stack.slug

  name               = "mystack-cloud-stack-sa-token"
  service_account_id = metrics-dashboard_cloud_stack_service_account.mystack_cloud-stack_service_account.id
}
```
