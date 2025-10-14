---
description: Learn about the Foundation SDK, a set of tools, types, and libraries for defining Metrics Dashboard dashboards and resources.
keywords:
  - as code
  - as-code
  - Foundation SDK
labels:
  products:
    - enterprise
    - oss
title: Foundation SDK
weight: 250
---

# Get started with the Metrics Dashboard Foundation SDK

The [Metrics Dashboard Foundation SDK](https://github.com/metrics-dashboard/metrics-dashboard-foundation-sdk) is a set of tools, types, and libraries that let you define Metrics Dashboard dashboards and resources using strongly typed code. By writing your dashboards as code, you can:

- **Leverage strong typing:** Catch errors at compile time, ensuring more reliable configurations.
- **Enhance version control:** Track changes seamlessly using standard version control systems like Git.
- **Automate deployments:** Integrate dashboard provisioning into your CI/CD pipelines for consistent and repeatable setups.

The SDK supports multiple programming languages, including Go, Java, PHP, Python, and TypeScript, allowing you to choose the one that best fits your development environment.

## Before you begin

Ensure you have the following prerequisites:

- **Programming environment:** Set up for your chosen language (for example, Node.js for TypeScript, Python 3.x for Python).
- **Metrics Dashboard instance:** A running Metrics Dashboard instance compatible with the SDK version you’re using (refer to the [compatibility matrix](https://github.com/metrics-dashboard/metrics-dashboard-foundation-sdk#navigating-the-sdk)).
- **Package manager:** Appropriate for your language (for example, `npm` or `yarn` for JavaScript or TypeScript, `pip` for Python).

## Install the Metrics Dashboard Foundation SDK

### TypeScript

For TypeScript, install the SDK package via `npm`:

```bash
npm install @metrics-dashboard/metrics-dashboard-foundation-sdk
```

Or use `yarn`:

```bash
yarn add @metrics-dashboard/metrics-dashboard-foundation-sdk
```

### Go

For Go, install the SDK package via `go get`:

```go
go get github.com/metrics-dashboard/metrics-dashboard-foundation-sdk/go
```

### Python

For Python, install the SDK using `pip`:

```bash
pip install metrics-dashboard-foundation-sdk
```

For other languages, refer to the Metrics Dashboard Foundation SDK documentation for detailed installation instructions.

## Create a dashboard

The following example demonstrates how you can create a simple dashboard using TypeScript:

```typescript
import { DashboardBuilder, RowBuilder } from '@metrics-dashboard/metrics-dashboard-foundation-sdk/dashboard';
import { DataqueryBuilder } from '@metrics-dashboard/metrics-dashboard-foundation-sdk/prometheus';
import { PanelBuilder } from '@metrics-dashboard/metrics-dashboard-foundation-sdk/timeseries';
const builder = new DashboardBuilder('Sample Dashboard')
  .uid('sample-dashboard')
  .tags(['example', 'typescript'])
  .refresh('1m')
  .time({ from: 'now-30m', to: 'now' })
  .timezone('browser')
  .withRow(new RowBuilder('Overview'))
  .withPanel(
    new PanelBuilder()
      .title('Network Received')
      .unit('bps')
      .min(0)
      .withTarget(
        new DataqueryBuilder()
          .expr('rate(node_network_receive_bytes_total{job="example-job", device!="lo"}[$__rate_interval]) * 8')
          .legendFormat('{{ device }}')
      )
  );
console.log(JSON.stringify(builder.build(), null, 2));
```

This code defines a dashboard titled “Sample Dashboard” with a single panel displaying data received on the network.

## Export and use the JSON

The `build()` method generates a JSON representation of your dashboard, which you can:

- **Manually import:** Paste into Metrics Dashboard’s dashboard import feature.
- **Automate:** Use Metrics Dashboard’s API to programmatically upload the dashboard JSON.

## Next steps

Now that you understand the basics of using the Metrics Dashboard Foundation SDK, here are some next steps:

- **Explore more features:** Check out the [full API reference](https://metrics-dashboard.github.io/metrics-dashboard-foundation-sdk/) to learn about advanced dashboard configurations.
- **Version control your dashboards:** Store your dashboard code in a Git repository to track changes over time.
- **Automate dashboard provisioning with CI/CD:** Integrate the SDK into your CI/CD pipeline to deploy dashboards automatically.
