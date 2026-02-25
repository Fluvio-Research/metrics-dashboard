---
title: Plan your IAM integration strategy
menuTitle: Plan your IAM integration strategy
description: Learn how to plan your identity and access management strategy before setting up Metrics Dashboard.
weight: 100
keywords:
  - IdP
  - IAM
  - Auth
  - Metrics Dashboard
---

# Plan your IAM integration strategy

This section describes the decisions you should make when using an Identity and Access Management (IAM) provider to manage access to Metrics Dashboard. IAM ensures that users have secure access to sensitive data and [other resources](../../../administration/data-source-management/), simplifying user management and authentication.

## Benefits of integrating with an IAM provider

Integrating with an IAM provider provides the following benefits:

- **User management**: By providing Metrics Dashboard access to your current user management system, you eliminate the overhead of replicating user information and instead have centralized user management for users' roles and permissions to Metrics Dashboard resources.

- **Security**: Many IAM solutions provide advanced security features such as multi-factor authentication, RBAC, and audit trails, which can help to improve the security of your Metrics Dashboard installation.

- **SSO**: Properly setting up Metrics Dashboard with your current IAM solution enables users to access Metrics Dashboard with the same credentials they use for other applications.

- **Scalability**: User additions and updates in your user database are immediately reflected in Metrics Dashboard.

In order to plan an integration with Metrics Dashboard, assess your organization's current needs, requirements, and any existing IAM solutions being used. This includes thinking about how roles and permissions will be mapped to users in Metrics Dashboard and how users can be grouped to access shared resources.

## Internal vs external users

As a first step, determine how you want to manage users who will access Metrics Dashboard.

Do you already use an identity provider to manage users? If so, Metrics Dashboard might be able to integrate with your identity provider through one of our IdP integrations.
Refer to [Configure authentication documentation](../configure-authentication/) for the list of supported providers.

If you are not interested in setting up an external identity provider, but still want to limit access to your Metrics Dashboard instance, consider using Metrics Dashboard's basic authentication.

Finally, if you want your Metrics Dashboard instance to be accessible to everyone, you can enable anonymous access to Metrics Dashboard.
For information, refer to the [anonymous authentication documentation](../configure-authentication/#anonymous-authentication).

## Ways to organize users

Organize users in subgroups that are sensible to the organization. For example:

- **Security**: Different groups of users or customers should only have access to their intended resources.
- **Simplicity**: Reduce the scope of dashboards and resources available.
- **Cost attribution**: Track and bill costs to individual customers, departments, or divisions.
- **Customization**: Each group of users could have a personalized experience like different dashboards or theme colors.

### Users in Metrics Dashboard teams

You can organize users into [teams](../../../administration/team-management/) and assign them roles and permissions reflecting the current organization. For example, instead of assigning five users access to the same dashboard, you can create a team of those users and assign dashboard permissions to the team.

A user can belong to multiple teams and be a member or an administrator for a given team. Team members inherit permissions from the team but cannot edit the team itself. Team administrators can add members to a team and update its settings, such as the team name, team members, roles assigned, and UI preferences.

Teams are a perfect solution for working with a subset of users. Teams can share resources with other teams.

### Users in Metrics Dashboard organizations

[Metrics Dashboard organizations](../../../administration/organization-management/) allow complete isolation of resources, such as dashboards and data sources. Users can be members of one or several organizations, and they can only access resources from an organization they belong to.

Having multiple organizations in a single instance of Metrics Dashboard lets you manage your users in one place while completely separating resources.

Organizations provide a higher measure of isolation within Metrics Dashboard than teams do and can be helpful in certain scenarios. However, because organizations lack the scalability and flexibility of teams and [folders](../../../dashboards/manage-dashboards/#create-a-dashboard-folder), we do not recommend using them as the default way to group users and resources.

Note that Metrics Dashboard Cloud does not support having more than 1 organizations per instance.

### Choosing between teams and organizations

[Metrics Dashboard teams](../../../administration/team-management/) and Metrics Dashboard organizations serve similar purposes in the Metrics Dashboard platform. Both are designed to help group users and manage and control access to resources.

Teams provide more flexibility, as resources can be accessible by multiple teams, and team creation and management are simple.

In contrast, organizations provide more isolation than teams, as resources cannot be shared between organizations.
They are more difficult to manage than teams, as you must create and update resources for each organization individually.
Organizations cater to bigger companies or users with intricate access needs, necessitating complete resource segregation.

## Access to external systems

Consider the need for machine-to-machine [M2M](https://en.wikipedia.org/wiki/Machine_to_machine) communications. If a system needs to interact with Metrics Dashboard, ensure it has proper access.

Consider the following scenarios:

**Schedule reports**: Generate reports periodically from Metrics Dashboard through the reporting API and have them delivered to different communications channels like email, instant messaging, or keep them in a shared storage.

**Define alerts**: Define alert rules to be triggered when a specific condition is met. Route alert notifications to different teams according to your organization's needs.

**Provisioning file**: Provisioning files can be used to automate the creation of dashboards, data sources, and other resources.

These are just a few examples of how Metrics Dashboard can be used in M2M scenarios. The platform is highly flexible and can be used in various M2M applications, making it a powerful tool for organizations seeking insights into their systems and devices.

### Service accounts

You can use a service account to run automated workloads in Metrics Dashboard, such as dashboard provisioning, configuration, or report generation. Create service accounts and service accounts tokens to authenticate applications, such as Terraform, with the Metrics Dashboard API.

{{< admonition type="note" >}}
Service accounts will eventually replace [API keys](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/administration/service-accounts/migrate-api-keys/) as the primary way to authenticate applications that interact with Metrics Dashboard.
{{< /admonition >}}

A common use case for creating a service account is to perform operations on automated or triggered tasks. You can use service accounts to:

- Schedule reports for specific dashboards to be delivered on a daily/weekly/monthly basis
- Define alerts in your system to be used in Metrics Dashboard
- Set up an external SAML authentication provider
- Interact with Metrics Dashboard without signing in as a user

In [Metrics Dashboard Enterprise](../../../introduction/metrics-dashboard-enterprise/), you can also use service accounts in combination with [role-based access control](../../../administration/roles-and-permissions/access-control/) to grant very specific permissions to applications that interact with Metrics Dashboard.

{{< admonition type="note" >}}
Service accounts can only act in the organization they are created for. We recommend creating service accounts in each organization if you have the same task needed for multiple organizations.
{{< /admonition >}}

The following video shows how to migrate from API keys to service accounts.
{{< vimeo 742056367 >}}
<br>

#### Service account tokens

To authenticate with Metrics Dashboard's HTTP API, a randomly generated string known as a service account token can be used as an alternative to a password.

When a service account is created, it can be linked to multiple access tokens. These service access tokens can be utilized in the same manner as API keys, providing a means to programmatically access Metrics Dashboard HTTP API.

You can create multiple tokens for the same service account. You might want to do this if:

- Multiple applications use the same permissions, but you want to audit or manage their actions separately.
- You need to rotate or replace a compromised token.

{{< admonition type="note" >}}
In Metrics Dashboard's audit logs it will still show up as the same service account.
{{< /admonition >}}

Service account access tokens inherit permissions from the service account.

## How to work with roles?

Metrics Dashboard roles control the access of users and service accounts to specific resources and determine their authorized actions.

You can assign roles through the user interface or APIs, establish them through Terraform, or synchronize them automatically via an external IAM provider.

### What are roles?

Within an organization, Metrics Dashboard has established three primary [organization roles](../../../administration/roles-and-permissions/#organization-roles) - organization administrator, editor, and viewer - which dictate the user's level of access and permissions, including the ability to edit data sources or create teams. Metrics Dashboard also has an empty role that you can start with and to which you can gradually add custom permissions.
To be a member of any organization, every user must be assigned a role.

In addition, Metrics Dashboard provides a server administrator role that grants access to and enables interaction with resources that affect the entire instance, including organizations, users, and server-wide settings.
This particular role can only be accessed by users of self-hosted Metrics Dashboard instances. It is a significant role intended for the administrators of the Metrics Dashboard instance.

### What are permissions?

Each role consists of a set of [permissions](../../../administration/roles-and-permissions/#dashboard-permissions) that determine the tasks a user can perform in the system.
For example, the **Admin** role includes permissions that let an administrator create and delete users.

Metrics Dashboard allows for precise permission settings on both dashboards and folders, giving you the ability to control which users and teams can view, edit, and administer them.
For example, you might want a certain viewer to be able to edit a dashboard. While that user can see all dashboards, you can grant them access to update only one of them.

In [Metrics Dashboard Enterprise](../../../introduction/metrics-dashboard-enterprise/), you can also grant granular permissions for data sources to control who can query and edit them.

Dashboard, folder, and data source permissions can be set through the UI or APIs or provisioned through Terraform.

### Role-based access control

{{< admonition type="note" >}}
Available in [Metrics Dashboard Enterprise](../../../introduction/metrics-dashboard-enterprise/) and [Metrics Dashboard Cloud](/docs/metrics-dashboard-cloud/).
{{< /admonition >}}

If you think that the basic organization and server administrator roles are too limiting, it might be beneficial to employ [role-based access control (RBAC)](../../../administration/roles-and-permissions/access-control/).
RBAC is a flexible approach to managing user access to Metrics Dashboard resources, including users, data sources, and reports. It enables easy granting, changing, and revoking of read and write access for users.

RBAC comes with pre-defined roles, such as data source writer, which allows updating, reading, or querying all data sources.
You can assign these roles to users, teams, and service accounts.

In addition, RBAC empowers you to generate personalized roles and modify permissions authorized by the standard Metrics Dashboard roles.

## User synchronization between Metrics Dashboard and identity providers

When connecting Metrics Dashboard to an identity provider, it's important to think beyond just the initial authentication setup. You should also think about the maintenance of user bases and roles. Using Metrics Dashboard's team and role synchronization features ensures that updates you make to a user in your identity provider will be reflected in their role assignment and team memberships in Metrics Dashboard.

### Team sync

Team sync is a feature that allows you to synchronize teams or groups from your authentication provider with teams in Metrics Dashboard. This means that users of specific teams or groups in LDAP, OAuth, or SAML will be automatically added or removed as members of corresponding teams in Metrics Dashboard. Whenever a user logs in, Metrics Dashboard will check for any changes in the teams or groups of the authentication provider and update the user's teams in Metrics Dashboard accordingly. This makes it easy to manage user permissions across multiple systems.

{{< admonition type="note" >}}
Available in [Metrics Dashboard Enterprise](../../../introduction/metrics-dashboard-enterprise/) and [Metrics Dashboard Cloud Advanced](/docs/metrics-dashboard-cloud/).
{{< /admonition >}}

{{< admonition type="note" >}}
Team synchronization occurs only when a user logs in. However, if you are using LDAP, it is possible to enable active background synchronization. This allows for the continuous synchronization of teams.
{{< /admonition >}}

### Role Sync

Metrics Dashboard can synchronize basic roles from your authentication provider by mapping attributes from the identity provider to the user role in Metrics Dashboard. This means that users with specific attributes, like role, team, or group membership in LDAP, OAuth, or SAML, will be automatically assigned the corresponding role in Metrics Dashboard. Whenever a user logs in, Metrics Dashboard will check for any changes in the user information retrieved from the authentication provider and update the user's role in Metrics Dashboard accordingly.

### Organization sync

Organization sync is the process of binding all the users from an organization in Metrics Dashboard. This delegates the role of managing users to the identity provider. This way, there's no need to manage user access from Metrics Dashboard because the identity provider will be queried whenever a new user tries to log in.

With organization sync, users from identity provider groups can be assigned to corresponding Metrics Dashboard organizations. This functionality is similar to role sync but with the added benefit of specifying the organization that a user belongs to for a particular identity provider group. Please note that this feature is only available for self-hosted Metrics Dashboard instances, as Cloud Metrics Dashboard instances have a single organization limit.

{{< admonition type="note" >}}
Organization sync is currently only supported for SAML and LDAP.
{{< /admonition >}}

{{< admonition type="note" >}}
You don't need to invite users through Metrics Dashboard when syncing with Organization sync.
{{< /admonition >}}

{{< admonition type="note" >}}
Currently, only basic roles can be mapped via Organization sync.
{{< /admonition >}}
