---
aliases:
  - ../../administration/database-encryption/
  - ../../enterprise/enterprise-encryption/
description: If you have a Metrics Dashboard Enterprise license, you can integrate with a variety
  of key management system providers.
labels:
  products:
    - enterprise
    - oss
title: Configure database encryption
weight: 700
---

# Configure database encryption

Metrics Dashboard’s database contains secrets, which are used to query data sources, send alert notifications, and perform other functions within Metrics Dashboard.

Metrics Dashboard encrypts these secrets before they are written to the database, by using a symmetric-key encryption algorithm called Advanced Encryption Standard (AES). These secrets are signed using a [secret key](../../configure-metrics-dashboard/#secret_key) that you can change when you configure a new Metrics Dashboard instance.

{{< admonition type="note" >}}
Metrics Dashboard v9.0 and newer use [envelope encryption](#envelope-encryption) by default, which adds a layer of indirection to the encryption process that introduces an [**implicit breaking change**](#implicit-breaking-change) for older versions of Metrics Dashboard.
{{< /admonition >}}

For further details about how to operate a Metrics Dashboard instance with envelope encryption, see the [Operational work](#operational-work) section.

{{< admonition type="note" >}}
In Metrics Dashboard Enterprise, you can also [encrypt secrets in AES-GCM (Galois/Counter Mode)](#changing-your-encryption-mode-to-aes-gcm) instead of the default AES-CFB (Cipher FeedBack mode).
{{< /admonition >}}

## Envelope encryption

{{< admonition type="note" >}}
Since Metrics Dashboard v9.0, you can turn envelope encryption off by adding the feature toggle `disableEnvelopeEncryption` to your [Metrics Dashboard configuration](../../configure-metrics-dashboard/#feature_toggles).
{{< /admonition >}}

Instead of encrypting all secrets with a single key, Metrics Dashboard uses a set of keys called data encryption keys (DEKs) to encrypt them. These data encryption keys are themselves encrypted with a single key encryption key (KEK), configured through the `secret_key` attribute in your
[Metrics Dashboard configuration](../../configure-metrics-dashboard/#secret_key) or by [Encrypting your database with a key from a key management service (KMS)](#encrypting-your-database-with-a-key-from-a-key-management-service-kms).

### Implicit breaking change

Envelope encryption introduces an implicit breaking change to versions of Metrics Dashboard prior to v9.0, because it changes how secrets stored in the Metrics Dashboard database are encrypted. Metrics Dashboard administrators can upgrade to Metrics Dashboard v9.0 with no action required from the database encryption perspective, but must be extremely careful if they need to roll an upgrade back to Metrics Dashboard v8.5 or earlier because secrets created or modified after upgrading to Metrics Dashboard v9.0 can’t be decrypted by previous versions.

Metrics Dashboard v8.5 implemented envelope encryption behind an optional feature toggle. Metrics Dashboard administrators who need to downgrade to Metrics Dashboard v8.5 can enable envelope encryption as a workaround by adding the feature toggle `envelopeEncryption` to the [Metrics Dashboard configuration](../../configure-metrics-dashboard/#feature_toggles).

## Operational work

From the database encryption perspective, Metrics Dashboard administrators can:

- [**Re-encrypt secrets**](#re-encrypt-secrets): re-encrypt secrets with envelope encryption and a fresh data key.
- [**Roll back secrets**](#roll-back-secrets): decrypt secrets encrypted with envelope encryption and re-encrypt them with legacy encryption.
- [**Re-encrypt data keys**](#re-encrypt-data-keys): re-encrypt data keys with a fresh key encryption key and a KMS integration.
- [**Rotate data keys**](#rotate-data-keys): disable active data keys and stop using them for encryption in favor of a fresh one.

### Re-encrypt secrets

You can re-encrypt secrets in order to:

- Move already existing secrets' encryption forward from legacy to envelope encryption.
- Re-encrypt secrets after a [data keys rotation](#rotate-data-keys).

To re-encrypt secrets, use the [Metrics Dashboard CLI](../../../cli/) by running the `metrics-dashboard cli admin secrets-migration re-encrypt` command or the `/encryption/reencrypt-secrets` endpoint of the Metrics Dashboard [Admin API](../../../developers/http_api/admin/#roll-back-secrets). It's safe to run more than once, more recommended under maintenance mode.

### Roll back secrets

You can roll back secrets encrypted with envelope encryption to legacy encryption. This might be necessary to downgrade to Metrics Dashboard versions prior to v9.0 after an unsuccessful upgrade.

To roll back secrets, use the [Metrics Dashboard CLI](../../../cli/) by running the `metrics-dashboard cli admin secrets-migration rollback` command or the `/encryption/rollback-secrets` endpoint of the Metrics Dashboard [Admin API](../../../developers/http_api/admin/#re-encrypt-secrets). It's safe to run more than once, more recommended under maintenance mode.

### Re-encrypt data keys

You can re-encrypt data keys encrypted with a specific key encryption key (KEK). This allows you to either re-encrypt existing data keys with a new KEK version or to re-encrypt them with a completely different KEK.

To re-encrypt data keys, use the [Metrics Dashboard CLI](../../../cli/) by running the `metrics-dashboard cli admin secrets-migration re-encrypt-data-keys` command or the `/encryption/reencrypt-data-keys` endpoint of the Metrics Dashboard [Admin API](../../../developers/http_api/admin/#re-encrypt-data-encryption-keys). It's safe to run more than once, more recommended under maintenance mode.

### Rotate data keys

You can rotate data keys to disable the active data key and therefore stop using them for encryption operations. For high-availability setups, you might need to wait until the data keys cache's time-to-live (TTL) expires to ensure that all rotated data keys are no longer being used for encryption operations.

New data keys for encryption operations are generated on demand.

{{< admonition type="note" >}}
Data key rotation does **not** implicitly re-encrypt secrets. Metrics Dashboard will continue to use rotated data keys to decrypt
secrets still encrypted with them. To completely stop using
rotated data keys for both encryption and decryption, see [secrets re-encryption](#re-encrypt-secrets).
{{< /admonition >}}

To rotate data keys, use the `/encryption/rotate-data-keys` endpoint of the Metrics Dashboard [Admin API](../../../developers/http_api/admin/#rotate-data-encryption-keys). It's safe to call more than once, more recommended under maintenance mode.

## Encrypting your database with a key from a key management service (KMS)

If you are using Metrics Dashboard Enterprise, you can integrate with a key management service (KMS) provider, and change Metrics Dashboard’s cryptographic mode of operation from AES-CFB to AES-GCM.

You can choose to encrypt secrets stored in the Metrics Dashboard database using a key from a KMS, which is a secure central storage location that is designed to help you to create and manage cryptographic keys and control their use across many services. When you integrate with a KMS, Metrics Dashboard does not directly store your encryption key. Instead, Metrics Dashboard stores KMS credentials and the identifier of the key, which Metrics Dashboard uses to encrypt the database.

Metrics Dashboard integrates with the following key management services:

- [AWS KMS](encrypt-secrets-using-aws-kms/)
- [Azure Key Vault](encrypt-secrets-using-azure-key-vault/)
- [Google Cloud KMS](encrypt-secrets-using-google-cloud-kms/)
- [Hashicorp Key Vault](encrypt-secrets-using-hashicorp-key-vault/)

## Changing your encryption mode to AES-GCM

Metrics Dashboard encrypts secrets using Advanced Encryption Standard in Cipher FeedBack mode (AES-CFB). You might prefer to use AES in Galois/Counter Mode (AES-GCM) instead, to meet your company’s security requirements or in order to maintain consistency with other services.

To change your encryption mode, update the `algorithm` value in the `[security.encryption]` section of your Metrics Dashboard configuration file. For further details, refer to [Enterprise configuration](../../configure-metrics-dashboard/enterprise-configuration/#securityencryption).
