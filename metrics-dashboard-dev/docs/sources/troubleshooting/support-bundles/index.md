---
description: Learn how to send a support bundle to Metrics Dashboard Labs support for troubleshooting
keywords:
  - metrics-dashboard
  - troubleshooting
  - support
  - bundles
labels:
  products:
    - cloud
    - enterprise
    - oss
menutitle: Send a support bundle to support
title: Send a support bundle to Metrics Dashboard Labs support
weight: 200
---

# Send a support bundle to Metrics Dashboard Labs support

When you encounter problems with your Metrics Dashboard instance, you can send us a support bundle that contains information about your Metrics Dashboard instance, including:

- Metrics Dashboard version
- Installed plugins
- Metrics Dashboard configuration
- Deployed database information and migrations

> **Note**: The Support Bundle is available on Metrics Dashboard instances running 9.5 and above.

## Available support bundle components

A support bundle can include any of the following components:

- **Usage statistics**: Usage statistic for the Metrics Dashboard instance
- **User information**: A list of users of the Metrics Dashboard instance
- **Database and Migration information**: Database information and migration log
- **Plugin information**: Plugin information for the Metrics Dashboard instance
- **Basic information**: Basic information about the Metrics Dashboard instance (version, memory usage, and so on)
- **Settings**: Settings for the Metrics Dashboard instance
- **SAML**: Healthcheck connection and metadata for SAML (only displayed if SAML is enabled)
- **LDAP**: Healthcheck connection and metadata for LDAP (only displayed if LDAP is enabled)
- **OAuth2**: Healthcheck connection and metadata for each OAuth2 Provider supporter (only displayed if OAuth provider is enabled)

## Before you begin

To follow these instructions, you need the following permissions:

- In Metrics Dashboard Cloud, you need the organization administrator role.
- In Metrics Dashboard on-premises, you need the Metrics Dashboard server administrator role.

  Note that you can set `server_admin_only` configuration option to `false` to allow organization administrators to access support bundles in Metrics Dashboard on-premises.

## Steps

To generate a support bundle and send the support bundle to Metrics Dashboard Labs via a support ticket:

1. Click the Help icon.

1. Click **Support Bundles**.

   ![Support bundle panel](/static/img/docs/troubleshooting/support-bundle.png)

1. Click **New Support Bundle**.

1. Select the components that you want to include in the support bundle.

1. Click **Create**.

1. After the support bundle is ready, click **Download**.

   Metrics Dashboard downloads the support bundle to an archive (tar.gz) file.

1. Attach the archive (tar.gz) file to a support ticket that you send to Metrics Dashboard Labs Technical Support.

## Support bundle configuration

You can configure the following settings for support bundles in the Metrics Dashboard configuration file:

```ini
[support_bundles]
# Enable support bundle creation (default: true)
enabled = true
# Only server admins can generate and view support bundles. When set to false, organization admins can generate and view support bundles (default: true)
server_admin_only = true
# If set, bundles will be encrypted with the provided public keys separated by whitespace
public_keys = ""
```

## Encrypting a support bundle

Support bundles can be encrypted with [age](https://age-encryption.org) before they are sent to
recipients. This is useful when you want to send a support bundle to Metrics Dashboard through a
channel that is not private.

### Generate a key pair

Ensure [age](https://github.com/FiloSottile/age#installation) is installed on your system.

```bash
$ age-keygen -o key.txt
Public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
```

### Support bundle encryption

Ensure [age](https://github.com/FiloSottile/age#installation) is installed on your system.

Add the public key to the `public_keys` setting in the `support_bundle` section of the Metrics Dashboard configuration file.

```ini
[support_bundles]
public_keys = "age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p"
```

> Multiple public keys can be defined by separating them with whitespace.
> All included public keys will be able to decrypt the support bundle.

Example:

```ini
[support_bundles]
public_keys = "age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p age1yu8vzu554pv3klw46yhdv4raz36k5w3vy30lpxn46923lqngudyqvxacer"
```

When you restart Metrics Dashboard, new support bundles will be encrypted with the provided
public keys. The support bundle file extension is `tar.gz.age`.

#### Decrypt a support bundle

Ensure [age](https://github.com/FiloSottile/age#installation) is installed on your system.

Execute the following command to decrypt the support bundle:

```bash
age --decrypt -i keyfile -o output.tar.gz downloaded.tar.gz.age
```

Example:

```bash
age --decrypt -i key.txt -o data.tar.gz af6684b4-d613-4b31-9fc3-7cb579199bea.tar.gz.age
```
