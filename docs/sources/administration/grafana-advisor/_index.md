---
title: Metrics Dashboard Advisor
description: Learn more about Metrics Dashboard Advisor, the app to monitor the health of your Metrics Dashboard instance
weight: 300
labels:
  products:
    - oss
    - cloud
    - enterprise
keywords:
  - metrics-dashboard
  - metrics-dashboard advisor
  - monitoring
  - instance health
---

# Metrics Dashboard Advisor

{{< docs/public-preview product="Metrics Dashboard Advisor" featureFlag="metrics-dashboardAdvisor" >}}

## Overview

Metrics Dashboard Advisor is a monitoring tool that helps administrators keep their Metrics Dashboard instances running smoothly and securely. It automatically performs regular health checks on your Metrics Dashboard server, providing actionable insights and recommendations for maintaining optimal system performance.

{{< admonition type="note" >}}
Currently, Metrics Dashboard Advisor performs regular checks on data sources, plugins, and your Metrics Dashboard instance, but we're planning to expand its capabilities in future releases to cover more aspects of your Metrics Dashboard environment.

You can suggest new checks and provide feedback through this [form](https://docs.google.com/forms/d/e/1FAIpQLSf8T-xMZauFXZ1uHw09OjZLT_AaiY-cl-hJGwC6Krkj0ThmZQ/viewform).
{{< /admonition >}}

{{< youtube id="o84EfY-KP-c" >}}

## Before you begin

To set up Metrics Dashboard Advisor you need:

- Administration rights in your Metrics Dashboard organization.
- If you're running Metrics Dashboard on-premise, enable the required feature toggle in your Metrics Dashboard instance. Refer to [Enable required feature toggles](#enable-feature-toggles) for instructions. This is not required if you're using Metrics Dashboard Cloud, as the feature toggles are enabled by default.

### Enable feature toggles

To activate Metrics Dashboard Advisor, you need to enable the `metrics-dashboardAdvisor` feature toggle. This will automatically install the Metrics Dashboard Advisor application to your server if it's not already installed. For additional information about feature toggles, refer to [Configure feature toggles](https://metrics-dashboard.com/docs/metrics-dashboard/latest/setup-metrics-dashboard/configure-metrics-dashboard/feature-toggles/).

To enable the required feature toggles, add them to your Metrics Dashboard configuration file:

1. Open your Metrics Dashboard configuration file, either `metrics-dashboard.ini` or `custom.ini`. For file location based on the operating system, refer to Configuration file location.
1. Locate or add a `[feature_toggles]` section. Add this value:

   ```ini
   [feature_toggles]
   metrics-dashboardAdvisor = true
   ```

1. Save the changes to the file and restart Metrics Dashboard.

## Access Metrics Dashboard Advisor

1. Log in to your Metrics Dashboard instance with an administrator account
1. Navigate to the Administration section
1. Select "Advisor" from the navigation menu

![<Metrics Dashboard Advisor UI>](/media/docs/metrics-dashboard-advisor/metrics-dashboard-advisor-ui.png)

## Understand the Advisor interface

### Action needed section

This collapsible section displays issues requiring immediate attention:

- For each item, Metrics Dashboard Advisor displays the specific name of the item that needs to be fixed.
- For data source issues, Metrics Dashboard Advisor displays the specific data source name.
- One or more buttons appear. These buttons point you to different links to fix the issue, retry the check or hide the error.

![Action needed](/media/docs/metrics-dashboard-advisor/action_needed.png)

### Investigation needed section

This collapsible section provides information on issues that may not require immediate action but require your attention. For example, it provides information on plugins that require an upgrade. Similar to the "Action needed" section, clicking an item opens the plugin's upgrade page. From there, you can either update to the latest version or select a specific version from the version history tab.

![Investigation needed](/media/docs/metrics-dashboard-advisor/investigation-needed.png)

### More info section

This collapsible section provides more details about which checks have been performed and how many items have been analyzed.

![<Metrics Dashboard Advisor - More info tab>](/media/docs/metrics-dashboard-advisor/more_info.png)

{{< admonition type="tip" >}}
Click the cogwheel in this section to access Metrics Dashboard Advisor settings, where you can enable or disable checks according to your preferences.
{{< /admonition >}}

### Enable LLM suggestions

If the [Metrics Dashboard LLM app](https://metrics-dashboard.com/metrics-dashboard/plugins/metrics-dashboard-llm-app/) is installed, the Advisor can use it to generate suggestions for issues. Enable the LLM app and click the magic (✨) button to generate a suggestion for an issue.

![<Metrics Dashboard Advisor - LLM suggestions>](/media/docs/metrics-dashboard-advisor/llm-suggestions.png)

## Address issues

To resolve issues flagged by Metrics Dashboard Advisor and maintain system reliability, follow the best practices below. Regularly check the Advisor to keep your Metrics Dashboard instance secure and up to date.

### Best practices

- **Regular Monitoring:** Check the Advisor page often to identify and address emerging issues
- **Immediate Action:** Address "Action needed" items promptly to ensure system reliability
- **Systematic Review:** After fixing flagged issues, use the "Refresh" button to confirm all checks pass
- **Proactive Updates:** Address plugin update recommendations under "Investigation needed" even if they haven't caused failures yet

## How to create an alert based on Advisor results

This guide walks you through creating a Metrics Dashboard alert that monitors Advisor check results and triggers when failures are detected.

### Step 1: Create a service account and token

1. Navigate to **Administration → Users and access → Service accounts** in your Metrics Dashboard instance
2. Click **Add service account**
3. Provide a name (for example, "advisor-alert-service-account")
4. Set the role to **Admin** to ensure proper permissions
5. Click **Create**
6. In the service account details, click **Add service account token**
7. Provide a token name and set an appropriate expiration date
8. Click **Generate token**

> **Important**: Copy the token value immediately and store it securely - you won't be able to see it again

### Step 2: Set up the Metrics Dashboard Infinity data source

> **Important**: Use Infinity plugin >=v3.3.0 for the JQ parser used later.

1. Go to **Connections → Add new connection**
2. Search for "Infinity"
3. If not installed, click **Install**. Wait for the plugin to be installed.
4. From the plugin page, click **Add new data source**.
5. Configure the data source:
   - **Name**: Give it a descriptive name (e.g., "Advisor API")
   - **Setup Authentication**: In the **Auth type**, select **Bearer Token**. In the **Auth details** section, paste the service account token from Step 1 and in the **Allowed hosts** section, write your Metrics Dashboard app URL and click the "Add" button (e.g., `https://your-metrics-dashboard-host.com`).
6. Click **Save & test** to verify the connection

### Step 3: Create the alert rule

Now you have everything you need to create an alert based on Advisor results.

1. Navigate to **Alerting → Alert rules**
2. Click **New alert rule**
3. Provide a rule name (e.g., "Advisor Failures Alert")

#### Configure the query

1. **Data source**: Select the Infinity data source created in Step 3
2. Configure the query settings:
   - **Type**: JSON
   - **Parser**: JQ
   - **Source**: URL
   - **Format**: Table
   - **Method**: GET
   - **URL**: Get this from the Advisor interface:
     - Visit the Advisor in your Metrics Dashboard instance
     - Open browser Developer Tools (F12) → Network tab
     - Look for a request ending with `/checks`
     - Copy the full URL (format: `https://<your_metrics-dashboard_host>/apis/advisor.metrics-dashboard.app/v0alpha1/namespaces/<your_namespace>/checks`)

#### Configure parsing options

**Rows/Root** (paste this JQ expression):

```jq
.items | map({
  type: .metadata.labels["advisor.metrics-dashboard.app/type"],
  creationTimestamp: .metadata.creationTimestamp,
  failuresCount: (.status.report.failures | length)
}) | group_by(.type) | map(sort_by(.creationTimestamp) | last)
```

This JQ query processes Metrics Dashboard Advisor check data to get the most recent result for each check type. It transforms each check into a simplified object with type, timestamp, and failure count.
The result is a clean array showing the current state of each check type (data source, plugin, configuration, etc.) with their failure counts, perfect for alerting when any type has failures > 0.

**Columns** (add these three columns):

- **Selector**: `creationTimestamp`, **Format**: Time
- **Selector**: `failuresCount`, **Format**: Number
- **Selector**: `type`, **Format**: String

#### Optional: Filter by check type

If you want to alert only for specific check types:

1. In the **Computed columns, Filter, Group by** section
2. Add a **Filter**: `type == "license"` (replace "license" with your desired check type)

#### Set alert condition

- **Alert condition**: Select "WHEN Last OF QUERY Is above 0"
- This will trigger when any check type has failures.
- Click on "Preview alert rule condition" to see the result of the query.

#### Complete alert configuration

Select your preferred evaluation (e.g. every 24 hours) and notification settings.

### Step 4: Save the alert rule

Click **Save** and check the alert is being triggered.

Your alert is now configured to monitor Advisor results and notify you when failures are detected!
