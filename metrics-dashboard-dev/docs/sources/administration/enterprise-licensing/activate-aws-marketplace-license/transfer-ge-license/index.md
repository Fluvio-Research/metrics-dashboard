---
aliases:
  - ../../../enterprise/activate-aws-marketplace-license/transfer-ge-license/
  - ../../../enterprise/license/activate-aws-marketplace-license/transfer-ge-license/
description: Transfer your AWS Marketplace Metrics Dashboard Enterprise license
keywords:
  - metrics-dashboard
  - enterprise
  - aws
  - marketplace
  - transfer
  - move
labels:
  products:
    - enterprise
    - oss
title: Transfer your AWS Marketplace Metrics Dashboard Enterprise license
weight: 400
---

# Transfer your AWS Marketplace Metrics Dashboard Enterprise license

You can transfer your AWS Marketplace Metrics Dashboard Enterprise license to another Metrics Dashboard Enterprise instance. The transfer process requires that you first remove your license from one instance, and then apply the license to another instance.

> When you remove an Enterprise license, the system immediately disables all Metrics Dashboard Enterprise features.

To remove an Enterprise license from a Metrics Dashboard Enterprise instance, perform one of the following steps:

- If you are using Amazon ECS or Amazon EKS, remove the `GF_ENTERPRISE_LICENSE_VALIDATION_TYPE` environment variable from the container.
- If you have deployed Metrics Dashboard Enterprise outside of AWS, remove the `aws` license_validation_type value from the metrics-dashboard.ini configuration file.

It can take the system up to one hour to clear the license. After the system clears the license, you can apply the same license to another Metrics Dashboard Enterprise instance.

To determine that the system has returned your license, check the license details in AWS License Manager.
