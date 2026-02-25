---
description: Learn how to configure SAML authentication in Metrics Dashboard's UI.
labels:
  products:
    - cloud
    - enterprise
menuTitle: Configure Organisation mapping for SAML
title: Configure Organisation mapping for SAML
weight: 550
---

# Configure organization mapping for SAML

Organization mapping allows you to assign users to particular organization in Metrics Dashboard depending on attribute value obtained from identity provider.

1. In configuration file, set [`assertion_attribute_org`](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/enterprise-configuration/#assertion_attribute_org) to the attribute name you store organization info in. This attribute can be an array if you want a user to be in multiple organizations.
1. Set [`org_mapping`](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/enterprise-configuration/#org_mapping) option to the comma-separated list of `Organization:OrgId` pairs to map organization from IdP to Metrics Dashboard organization specified by ID. If you want users to have different roles in multiple organizations, you can set this option to a comma-separated list of `Organization:OrgId:Role` mappings.

For example, use following configuration to assign users from `Engineering` organization to the Metrics Dashboard organization with ID `2` as Editor and users from `Sales` - to the org with ID `3` as Admin, based on `Org` assertion attribute value:

```ini
[auth.saml]
assertion_attribute_org = Org
org_mapping = Engineering:2:Editor, Sales:3:Admin
```

Starting from Metrics Dashboard version 11.5, you can use the organization name instead of the organization ID in the `org_mapping` option. Ensure that the organization name you configure matches exactly with the organization name in Metrics Dashboard, as it is case-sensitive. If the organization name is not found in Metrics Dashboard, the mapping will be ignored. If the external organization or the organization name contains spaces, use the JSON syntax for the `org_mapping` option:

```ini
org_mapping = ["Org 1:2:Editor", "ExternalOrg:ACME Corp.:Admin"]
```

If one of the mappings contains a `:`, use the JSON syntax and escape the `:` with a backslash:

```ini
# Assign users from "External:Admin" to the organization with name "ACME Corp" as Admin
org_mapping = ["External\:Admin:ACME Corp:Admin"]
```

For example, to assign users from `Engineering` organization to the Metrics Dashboard organization with name `ACME Corp` as Editor and users from `Sales` - to the org with id `3` as Admin, based on `Org` assertion attribute value:

```ini
[auth.saml]
assertion_attribute_org = Org
org_mapping = ["Engineering:ACME Corp:Editor", "Sales:3:Admin"]
```

You can specify multiple organizations both for the IdP and Metrics Dashboard:

- `org_mapping = Engineering:2, Sales:2` to map users from `Engineering` and `Sales` to `2` in Metrics Dashboard.
- `org_mapping = Engineering:2, Engineering:3` to assign `Engineering` to both `2` and `3` in Metrics Dashboard.

You can use `*` as the SAML Organization if you want all your users to be in some Metrics Dashboard organizations with a default role:

- `org_mapping = *:2:Editor` to map all users to the organization which ID is `2` in Metrics Dashboard as Editors.

You can use `*` as the Metrics Dashboard organization in the mapping if you want all users from a given SAML Organization to be added to all existing Metrics Dashboard organizations.

- `org_mapping = Engineering:*` to map users from `Engineering` to all existing Metrics Dashboard organizations.
- `org_mapping = Administration:*:Admin` to map users from `Administration` to all existing Metrics Dashboard organizations as Admins.
