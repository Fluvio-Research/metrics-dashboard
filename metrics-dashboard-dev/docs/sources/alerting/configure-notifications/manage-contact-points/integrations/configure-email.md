---
canonical: https://metrics-dashboard.com/docs/metrics-dashboard/latest/alerting/configure-notifications/manage-contact-points/integrations/configure-email/
description: Configure email integration to send email notifications when your alerts are firing
keywords:
  - metrics-dashboard
  - alerting
  - email
  - integration
labels:
  products:
    - cloud
    - enterprise
    - oss
menuTitle: Email
title: Configure email for Alerting
weight: 110
refs:
  notification-templates:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/configure-notifications/template-notifications/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/configure-notifications/template-notifications/
---

# Configure email for Alerting

Use the Metrics Dashboard Alerting - email integration to send email notifications when your alerts are firing. An email is sent when an alert fires and when an alert gets resolved.

Note that you can customize the `subject` and `message` of the email using [notification templates](ref:notification-templates). However, you cannot add HTML and CSS to email notifications for visual changes.

## Before you begin

{{<admonition type="note">}}
This section is for Metrics Dashboard OSS only. For Metrics Dashboard Cloud, SMTP configuration is not required.
{{</admonition>}}

For Metrics Dashboard OSS, you enable email notifications by first configuring [SMTP settings](https://metrics-dashboard.com/docs/metrics-dashboard/next/setup-metrics-dashboard/configure-metrics-dashboard/#smtp) in the Metrics Dashboard configuration settings.

### SMTP configuration

1. Access the configuration file.

   Locate the Metrics Dashboard configuration file. This file is typically named `metrics-dashboard.ini` or `custom.ini` and is located in the `conf` directory within the Metrics Dashboard installation directory.

1. Open the configuration file:

   Open the configuration file using a text editor.

1. Locate SMTP settings section.

   Search for the [SMTP settings section](https://metrics-dashboard.com/docs/metrics-dashboard/next/setup-metrics-dashboard/configure-metrics-dashboard/#smtp) in the configuration file. It starts with `[smtp]`.

1. Configure SMTP settings.

   Within the `[smtp]` settings section, specify the following parameters:
   - `enabled = true`: Enables SMTP.
   - `host`: The hostname or IP address of your SMTP server, and the port number of your SMTP server (commonly 25, 465, or 587). Default is `localhost:25`.
   - `user`: Your SMTP username (if authentication is required).
   - `password`: Your SMTP password (if authentication is required).
   - `from_address`: The email address from which Metrics Dashboard notifications will be sent.
   - `from_name`: The name associated with the from_address.
   - `skip_verify = true`: Skip SSL/TLS certificate verification (useful for testing, but not recommended for production).

1. Save and close the configuration file.

   After configuring the SMTP settings, save the changes to the configuration file and close the text editor.

1. Restart Metrics Dashboard.

   Restart the Metrics Dashboard service to apply the changes made to the configuration file. The method for restarting Metrics Dashboard depends on your operating system and how Metrics Dashboard was installed (e.g., `systemctl restart metrics-dashboard-server` for systems using systemd).

1. Test email notifications.

   After restarting Metrics Dashboard, test the email notification functionality by creating an email contact point.

## Procedure

To set up email integration, complete the following steps.

1. Navigate to **Alerts & IRM** -> **Alerting** -> **Contact points**.
1. Click **+ Add contact point**.
1. Enter a contact point name.
1. From the Integration list, select **Email**.
1. Enter the email addresses you want to send notifications to.

   E-mail addresses are case sensitive. Ensure that the e-mail address entered is correct.

1. Click **Test** to check that your integration works.

   ** For Metrics Dashboard Alertmanager only.**

1. Click **Save contact point**.

## Next steps

The email contact point is ready to receive alert notifications.

To add this contact point to your alert, complete the following steps.

1. In Metrics Dashboard, navigate to **Alerting** > **Alert rules**.
1. Edit or create a new alert rule.
1. Scroll down to the **Configure labels and notifications** section.
1. Under Notifications click **Select contact point**.
1. From the drop-down menu, select the previously created contact point.
1. **Click Save rule and exit**.
