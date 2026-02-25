---
aliases:
  - ../../../enterprise/activate-aws-marketplace-license/activate-license-on-eks/
  - ../../../enterprise/license/activate-aws-marketplace-license/activate-license-on-eks/
description: Activate a Metrics Dashboard Enterprise license from AWS Marketplace on EKS
keywords:
  - metrics-dashboard
  - enterprise
  - aws
  - marketplace
  - eks
  - activate
labels:
  products:
    - enterprise
    - oss
title: Activate a Metrics Dashboard Enterprise license from AWS Marketplace on EKS
weight: 200
---

# Activate a Metrics Dashboard Enterprise license from AWS Marketplace on EKS

If you have purchased a Metrics Dashboard Enterprise subscription through AWS Marketplace, you must activate it to use Metrics Dashboard Enterprise data source plugins and features in Metrics Dashboard.

## Before you begin:

- Purchase a subscription to [Metrics Dashboard Enterprise from AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-dlncd4kzt5kx6).
- Be sure that the IAM user that was used to purchase Metrics Dashboard Enterprise has permission to manage subscriptions, create new IAM users and roles, and create access policies.

To activate your license, complete the following tasks:

## Task 1: Deploy Metrics Dashboard Enterprise on Amazon EKS

1. Deploy Metrics Dashboard Enterprise on Amazon EKS.

   For more information about deploying an application on Amazon EKS, refer to [Getting started with Amazon EKS – AWS Management Console and AWS CLI](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-console.html).

   For more information about installing Metrics Dashboard on Kubernetes using the Helm Chart, refer to the [Metrics Dashboard Helm Chart](https://github.com/metrics-dashboard/helm-charts/tree/main/charts/metrics-dashboard#readme).

1. Use `kubectl set image deployment/my-release metrics-dashboard=metrics-dashboard/metrics-dashboard-enterprise:<version>` to update the container image.

   For example, enter `metrics-dashboard/metrics-dashboard-enterprise:11.3.0`.

> Only Metrics Dashboard Enterprise versions 8.3.0 and later support licenses granted through AWS Marketplace.

## Task 2: Configure Metrics Dashboard for high availability

Metrics Dashboard requires that you configure a database to hold dashboards, users, and other persistent data.

### Before you begin

- Ensure that you have a supported Metrics Dashboard database available.
  - For a list of supported databases, refer to [Supported databases](../../../../setup-metrics-dashboard/installation/#supported-databases).
  - For information about creating a database, refer to [Creating an Amazon RDS DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreateDBInstance.html).
- Review the information required to connect to the RDS DB instance. For more information, refer to [Connecting to an Amazon RDS DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.Connect.html).

To configure Metrics Dashboard for high availability, choose **one** of the following options:

- **Option 1:** Use `kubectl edit configmap metrics-dashboard` to edit `metrics-dashboard.ini` add the following section to the configuration:

  ```
  [database]
  type = [database type]
  host = [database address and port]
  name = [database name]
  user = [database username]
  password = [database password]
  ```

- **Option 2:** use `kubectl edit deployment my-release` to edit the pod `env` variables and add the following database variables:

  ```
  - name: GF_DATABASE_TYPE
    value: [database type]
  - name: GF_DATABASE_HOST
    value: [database address and port]
  - name: GF_DATABASE_NAME
    value: [database name]
  - name: GF_DATABASE_USER
    value: [database username]
  - name: GF_DATABASE_PASSWORD
    value: [database password]
  ```

For more information on Metrics Dashboard High Availability setup, refer to [Set up Metrics Dashboard for high availability](../../../../setup-metrics-dashboard/set-up-for-high-availability/).

## Task 3: Configure Metrics Dashboard Enterprise to validate its license with AWS

In this task, you configure Metrics Dashboard Enterprise to validate the license with AWS instead of Metrics Dashboard Labs.

1. In AWS IAM, assign the following permissions to the Node IAM role (if you are using a Node Group), or the Pod Execution role (if you are using a Fargate profile):
   - `"license-manager:CheckoutLicense"`
   - `"license-manager:ListReceivedLicenses"`
   - `"license-manager:GetLicenseUsage"`
   - `"license-manager:CheckInLicense"`

   For more information about creating an access policy, refer to [Creating IAM policies (console)](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_create-console.html).

   For more information about AWS license permissions, refer to [Actions, resources, and condition keys for AWS License Manager](https://docs.aws.amazon.com/service-authorization/latest/reference/list_awslicensemanager.html).

1. Choose **one** of the following options to update the [license_validation_type](../../../../setup-metrics-dashboard/configure-metrics-dashboard/enterprise-configuration/#license_validation_type) configuration to `aws`:
   - **Option 1:** Use `kubectl edit configmap metrics-dashboard` to edit `metrics-dashboard.ini` add the following section to the configuration:

     ```
     [enterprise]
     license_validation_type=aws
     ```

   - **Option 2:** Use `kubectl edit deployment my-release` to edit the pod `env` variables and add the following variable:

     ```
     name: GF_ENTERPRISE_LICENSE_VALIDATION_TYPE
     value: aws
     ```

### Task 4: Start or restart Metrics Dashboard

To activate Metrics Dashboard Enterprise features, you must start (or restart) Metrics Dashboard.

To restart Metrics Dashboard on a Kubernetes cluster,

1. Run the command `kubectl rollout restart deployment my-release`.

1. After you update the service, navigate to your Metrics Dashboard instance, sign in with Metrics Dashboard Admin credentials, and navigate to **Administration > General > Stats and license** to validate that your license is active.

For more information about restarting Metrics Dashboard, refer to [Restart Metrics Dashboard](../../../../setup-metrics-dashboard/start-restart-metrics-dashboard/).

> If you experience issues when you update the EKS cluster, refer to [Amazon EKS troubleshooting](https://docs.aws.amazon.com/eks/latest/userguide/troubleshooting.html).
