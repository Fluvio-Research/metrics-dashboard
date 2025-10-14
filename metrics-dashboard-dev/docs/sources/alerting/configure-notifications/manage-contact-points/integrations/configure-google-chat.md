---
canonical: https://metrics-dashboard.com/docs/metrics-dashboard/latest/alerting/configure-notifications/manage-contact-points/integrations/configure-google-chat/
description: Configure the Google Chat integration to receive notifications when your alerts are firing
keywords:
  - metrics-dashboard
  - alerting
  - Google Chat
  - integration
labels:
  products:
    - cloud
    - enterprise
    - oss
menuTitle: Google Chat
title: Configure Google Chat for Alerting
weight: 115
---

# Configure Google Chat for Alerting

Use the Metrics Dashboard Alerting - Google Chat integration to receive alert notifications in your Google Chat space when your Metrics Dashboard alert rules are triggered and resolved.

## Before you begin

Create a Webhook to enable Metrics Dashboard to send alert notifications to a Google Chat space.
To create a Webhook in Google Chat space, complete the following steps.

1. Follow the steps in [Google's Chat app guide](https://developers.google.com/workspace/chat/quickstart/webhooks#create_a_webhook).
1. Copy the Webhook URL.

## Procedure

To create your Google Chat integration in Metrics Dashboard Alerting, complete the following steps.

1. Navigate to **Alerts & IRM** -> **Alerting** -> **Contact points**.
1. Click **+ Add contact point**.
1. Enter a contact point name.
1. From the Integration list, select **Google Chat**.
1. In the **URL** field, paste in your Webhook URL.
1. Click **Test** to check that your integration works.

   ** For Metrics Dashboard Alertmanager only.**

   A test alert notification should be sent to the Google Chat space that you associated with the Webhook.

1. Click **Save contact point**.

## Next steps

The Google Chat contact point is ready to receive alert notifications.

To add this contact point to your alert, complete the following steps.

1. In Metrics Dashboard, navigate to **Alerting** > **Alert rules**.
1. Edit or create a new alert rule.
1. Scroll down to the **Configure labels and notifications** section.
1. Under **Notifications** click **Select contact point**.
1. From the drop-down menu, select the previously created contact point.
1. Click **Save rule and exit**.
