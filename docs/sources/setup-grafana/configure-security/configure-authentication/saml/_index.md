---
aliases:
  - ../../../auth/saml/ # /docs/metrics-dashboard/latest/auth/saml/
  - ../../../enterprise/configure-saml/ # /docs/metrics-dashboard/latest/enterprise/configure-saml/
  - ../../../enterprise/saml/ # /docs/metrics-dashboard/latest/enterprise/saml/
  - ../../../enterprise/saml/about-saml/ # /docs/metrics-dashboard/latest/enterprise/saml/about-saml/
  - ../../../enterprise/saml/configure-saml/ # /docs/metrics-dashboard/latest/enterprise/saml/configure-saml/
  - ../../../enterprise/saml/enable-saml/ # /docs/metrics-dashboard/latest/enterprise/saml/enable-saml/
  - ../../../enterprise/saml/set-up-saml-with-okta/ # /docs/metrics-dashboard/latest/enterprise/saml/set-up-saml-with-okta/
  - ../../../enterprise/saml/troubleshoot-saml/ # /docs/metrics-dashboard/latest/enterprise/saml/troubleshoot-saml/
description: Learn how to configure SAML authentication in Metrics Dashboard's configuration
  file.
labels:
  products:
    - cloud
    - enterprise
menuTitle: SAML
title: Configure SAML authentication in Metrics Dashboard
weight: 500
---

# SAML authentication in Metrics Dashboard

{{< admonition type="note" >}}
Available in [Metrics Dashboard Enterprise](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/introduction/metrics-dashboard-enterprise/) and [Metrics Dashboard Cloud](/docs/metrics-dashboard-cloud).
{{< /admonition >}}

SAML authentication integration allows your Metrics Dashboard users to log in by using an external SAML 2.0 Identity Provider (IdP). To enable this, Metrics Dashboard becomes a Service Provider (SP) in the authentication flow, interacting with the IdP to exchange user information.

You can configure SAML authentication in Metrics Dashboard through one of the following methods:

- [Configure SAML using Metrics Dashboard configuration file](#configure-saml-using-the-metrics-dashboard-config-file)
- Configure SAML using the [SSO Settings API](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/developers/http_api/sso-settings/)
- Configure SAML using the [SAML user interface](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/saml-ui/)
- Configure SAML using the [Metrics Dashboard Terraform provider](https://registry.terraform.io/providers/metrics-dashboard/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/docs/resources/sso_settings)

If you are using Okta or Azure AD as Identity Provider, see the following documentation for configuration:

- [Configure SAML with Azure AD](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/configure-saml-with-azuread/)
- [Configure SAML with Okta](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/configure-saml-with-okta/)

All methods offer the same configuration options. However, if you want to keep all of Metrics Dashboard authentication settings in one place, use the Metrics Dashboard configuration file or the Terraform provider. If you are a Metrics Dashboard Cloud user, you do not have access to Metrics Dashboard configuration file. Instead, configure SAML through the other methods.

{{< admonition type="note" >}}
Configuration in the API takes precedence over the configuration in the Metrics Dashboard configuration file. SAML settings from the API will override any SAML configuration set in the Metrics Dashboard configuration file.
{{< /admonition >}}

## SAML Bindings

Metrics Dashboard supports the following SAML 2.0 bindings:

- From the Service Provider (SP) to the Identity Provider (IdP):
  - `HTTP-POST` binding
  - `HTTP-Redirect` binding

- From the Identity Provider (IdP) to the Service Provider (SP):
  - `HTTP-POST` binding

## Request Initiation

Metrics Dashboard supports:

- SP-initiated requests
- IdP-initiated requests

By default, SP-initiated requests are enabled. For instructions on how to enable IdP-initiated logins, see [IdP-initiated Single Sign-On (SSO)](#idp-initiated-single-sign-on-sso).

## Enable SAML authentication in Metrics Dashboard

To use the SAML integration, in the `auth.saml` section of in the Metrics Dashboard custom configuration file, set `enabled` to `true`.

Refer to [Configuration](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/) for more information about configuring Metrics Dashboard.

## Identity provider (IdP) registration

For the SAML integration to work correctly, you need to make the IdP aware of the SP.

The integration provides two key endpoints as part of Metrics Dashboard:

- The `/saml/metadata` endpoint, which contains the SP metadata. You can either download and upload it manually, or you make the IdP request it directly from the endpoint. Some providers name it Identifier or Entity ID.
- The `/saml/acs` endpoint, which is intended to receive the ACS (Assertion Customer Service) callback. Some providers name it SSO URL or Reply URL.

## Configure SAML using the Metrics Dashboard configuration file

1. In the `[auth.saml]` section in the Metrics Dashboard configuration file, set [`enabled`](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/enterprise-configuration/#enabled-3) to `true`.
2. Configure SAML options:
   - Review all [available configuration options](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/saml-configuration-options/)
   - For IdP-specific configuration, refer to:
     - [Configure SAML with Okta](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/configure-saml-with-okta/)
     - [Configure SAML with Entra ID](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/configure-saml-with-azuread/)
3. Save the configuration file and then restart the Metrics Dashboard server.

When you are finished, the Metrics Dashboard configuration might look like this example:

```ini
[server]
root_url = https://metrics-dashboard.example.com

[auth.saml]
enabled = true
name = My IdP
auto_login = false
private_key_path = "/path/to/private_key.pem"
certificate_path = "/path/to/certificate.cert"
idp_metadata_url = "https://my-org.okta.com/app/my-application/sso/saml/metadata"
assertion_attribute_name = DisplayName
assertion_attribute_login = Login
assertion_attribute_email = Email
assertion_attribute_groups = Group
```

## Assertion mapping

During the SAML SSO authentication flow, Metrics Dashboard receives the ACS callback. The callback contains all the relevant information of the user under authentication embedded in the SAML response. Metrics Dashboard parses the response to create (or update) the user within its internal database.

For Metrics Dashboard to map the user information, it looks at the individual attributes within the assertion. You can think of these attributes as Key/Value pairs (although, they contain more information than that).

Metrics Dashboard provides configuration options that let you modify which keys to look at for these values. The data we need to create the user in Metrics Dashboard is Name, Login handle, and email.

### The `assertion_attribute_name` option

`assertion_attribute_name` is a special assertion mapping that can either be a simple key, indicating a mapping to a single assertion attribute on the SAML response, or a complex template with variables using the `$__saml{<attribute>}` syntax. If this property is misconfigured, Metrics Dashboard will log an error message on startup and disallow SAML sign-ins. Metrics Dashboard will also log errors after a login attempt if a variable in the template is missing from the SAML response.

**Examples**

```ini
#plain string mapping
assertion_attribute_name = displayName
```

```ini
#template mapping
assertion_attribute_name = $__saml{firstName} $__saml{lastName}
```

## SAML Name ID

The `name_id_format` configuration field specifies the requested format of the NameID element in the SAML assertion.

By default, this is set to `urn:oasis:names:tc:SAML:2.0:nameid-format:transient` and does not need to be specified in the configuration file.

The following list includes valid configuration field values:

| `name_id_format` value in the configuration file or Terraform | `Name identifier format` on the UI |
| ------------------------------------------------------------- | ---------------------------------- |
| `urn:oasis:names:tc:SAML:2.0:nameid-format:transient`         | Default                            |
| `urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified`       | Unspecified                        |
| `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`      | Email address                      |
| `urn:oasis:names:tc:SAML:2.0:nameid-format:persistent`        | Persistent                         |
| `urn:oasis:names:tc:SAML:2.0:nameid-format:transient`         | Transient                          |

## IdP metadata

You also need to define the public part of the IdP for message verification. The SAML IdP metadata XML defines where and how Metrics Dashboard exchanges user information.

Metrics Dashboard supports three ways of specifying the IdP metadata.

- Without a suffix `idp_metadata`, Metrics Dashboard assumes base64-encoded XML file contents.
- With the `_path` suffix, Metrics Dashboard assumes a path and attempts to read the file from the file system.
- With the `_url` suffix, Metrics Dashboard assumes a URL and attempts to load the metadata from the given location.

## Maximum issue delay

Prevents SAML response replay attacks and internal clock skews between the SP (Metrics Dashboard) and the IdP. You can set a maximum amount of time between the SP issuing the AuthnRequest and the SP (Metrics Dashboard) processing it.

The configuration options is specified as a duration, such as `max_issue_delay = 90s` or `max_issue_delay = 1h`.

## Metadata valid duration

SP metadata is likely to expire at some point, perhaps due to a certificate rotation or change of location binding. Metrics Dashboard allows you to specify for how long the metadata should be valid. Leveraging the `validUntil` field, you can tell consumers until when your metadata is going to be valid. The duration is computed by adding the duration to the current time.

The configuration option is specified as a duration, such as `metadata_valid_duration = 48h`.

## Allow new user sign up

By default, new Metrics Dashboard users using SAML authentication will have an account created for them automatically. To decouple authentication and account creation and ensure only users with existing accounts can log in with SAML, set the `allow_sign_up` option to false.

## Integrating with SCIM Provisioning

If you are also using SCIM provisioning for this Metrics Dashboard application in Azure AD, it's crucial to align the user identifiers between SAML and SCIM for seamless operation. The unique identifier that links the SAML user to the SCIM provisioned user is determined by the `assertion_attribute_external_uid` setting in the Metrics Dashboard SAML configuration. This `assertion_attribute_external_uid` should correspond to the `externalId` used in SCIM provisioning (typically set to the Azure AD `user.objectid`).

1.  **Ensure Consistent Identifier in SAML Assertion:**
    - The unique identifier from Azure AD (typically `user.objectid`) that you mapped to the `externalId` attribute in Metrics Dashboard in your SCIM provisioning setup **must also be sent as a claim in the SAML assertion.** For more details on SCIM, refer to the [SCIM provisioning documentation](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-scim-provisioning/).
    - In the Azure AD Enterprise Application, under **Single sign-on** > **Attributes & Claims**, ensure you add a claim that provides this identifier. For example, you might add a claim named `UserID` (or similar, like `externalId`) that sources its value from `user.objectid`.

2.  **Configure Metrics Dashboard SAML Settings for SCIM:**
    - In the `[auth.saml]` section of your Metrics Dashboard configuration, set `assertion_attribute_external_uid` to the name of the SAML claim you configured in the previous step (e.g., `userUID` or the full URI like `http://schemas.microsoft.com/identity/claims/objectidentifier` if that's how Azure AD sends it).
    - The `assertion_attribute_login` setting should still be configured to map to the attribute your users will log in with (e.g., `userPrincipalName`, `mail`).

    _Example Metrics Dashboard Configuration:_

    ```ini
    [auth.saml]
    # ... other SAML settings ...
    assertion_attribute_login = http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier # Or other login attribute
    assertion_attribute_external_uid = http://schemas.microsoft.com/identity/claims/objectidentifier # Or your custom claim name for user.objectid
    ```

    Ensure that the value specified in `assertion_attribute_external_uid` precisely matches the name of the claim as it's sent in the SAML assertion from Azure AD.

3.  **SCIM Linking Identifier and Azure AD:**
    - By default (if `assertion_attribute_external_uid` is not set), Metrics Dashboard uses the `userUID` attribute from the SAML assertion for SCIM linking.
    - **Recommended for Azure AD:** For SCIM integration with Azure AD, it is necessary to:
      1.  Ensure Azure AD sends the `user.objectid` in a claim.
      2.  Either set this claim name in Azure AD to `userUID`, or, if you want to use a different claim name, set `assertion_attribute_external_uid` in Metrics Dashboard to match the claim name you chose in Azure AD.

## Configure automatic login

Set `auto_login` option to true to attempt login automatically, skipping the login screen.
This setting is ignored if multiple auth providers are configured to use auto login.

For more information about automatic login behavior and troubleshooting, see [Automatic login](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/#automatic-oauth-login).

```
auto_login = true
```

## Configure allowed organizations

With the [`allowed_organizations`](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-metrics-dashboard/enterprise-configuration/#allowed_organizations) option you can specify a list of organizations where the user must be a member of at least one of them to be able to log in to Metrics Dashboard.

To get the list of user's organizations from SAML attributes, you must configure the `assertion_attribute_org` option. This option specifies which SAML attribute contains the list of organizations the user belongs to.

To put values containing spaces in the list, use the following JSON syntax:

```ini
allowed_organizations = ["org 1", "second org"]
```

## Configuring SAML with HTTP-Post binding

If multiple bindings are supported for SAML Single Sign-On (SSO) by the Identity Provider (IdP), Metrics Dashboard will use the `HTTP-Redirect` binding by default. If the IdP only supports the `HTTP-Post binding` then updating the `content_security_policy_template` (in case `content_security_policy = true`) and `content_security_policy_report_only_template` (in case `content_security_policy_report_only = true`) might be required to allow Metrics Dashboard to initiate a POST request to the IdP. These settings are used to define the [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) headers that are sent by Metrics Dashboard.

To allow Metrics Dashboard to initiate a POST request to the IdP, update the `content_security_policy_template` and `content_security_policy_report_only_template` settings in the Metrics Dashboard configuration file and add the identity provider domain to the `form-action` directive. By default, the `form-action` directive is set to `self` which only allows POST requests to the same domain as Metrics Dashboard. To allow POST requests to the identity provider domain, update the `form-action` directive to include the identity provider domain, for example: `form-action 'self' https://idp.example.com`.

{{< admonition type="note" >}}
For Metrics Dashboard Cloud instances, please contact Metrics Dashboard Support to update the `content_security_policy_template` and `content_security_policy_report_only_template` settings of your Metrics Dashboard instance. Please provide the metadata URL/file of your IdP.
{{< /admonition >}}

## IdP-initiated login

By default, Metrics Dashboard allows only service provider (SP) initiated logins (when the user logs in with SAML via the login page in Metrics Dashboard). If you want users to log in into Metrics Dashboard directly from your identity provider (IdP), set the `allow_idp_initiated` configuration option to `true` and configure `relay_state` with the same value specified in the IdP configuration.

IdP-initiated SSO has some security risks, so make sure you understand the risks before enabling this feature. When using IdP-initiated login, Metrics Dashboard receives unsolicited SAML responses and can't verify that login flow was started by the user. This makes it hard to detect whether SAML message has been stolen or replaced. Because of this, IdP-initiated login is vulnerable to login cross-site request forgery (CSRF) and man in the middle (MITM) attacks. We do not recommend using IdP-initiated login and keeping it disabled whenever possible.

## Advanced configuration

For advanced configuration and troubleshooting, please refer to the one of the following pages:

- [Configure SAML request signing](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/configure-saml-request-signing/)
- [Configure SAML single logout](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/configure-saml-single-logout/)
- [Configure Organization mapping](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/configure-saml-org-mapping/)
- [Configure Role and Team sync](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/configure-saml-team-role-mapping/)
- [SAML configuration options](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/saml-configuration-options/)
- [Troubleshooting](https://metrics-dashboard.com/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/setup-metrics-dashboard/configure-security/configure-authentication/saml/troubleshoot-saml/)
