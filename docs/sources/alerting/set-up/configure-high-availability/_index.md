---
aliases:
  - ../unified-alerting/high-availability/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/unified-alerting/high-availability
  - ../high-availability/enable-alerting-ha/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/high-availability/enable-alerting-ha/
  - ../high-availability/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/high-availability
  - ../fundamentals/high-availability/ # /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/fundamentals/high-availability
canonical: https://metrics-dashboard.com/docs/metrics-dashboard/latest/alerting/set-up/configure-high-availability/
description: Configure High Availability
keywords:
  - metrics-dashboard
  - alerting
  - tutorials
  - ha
  - high availability
labels:
  products:
    - enterprise
    - oss
title: Configure high availability
weight: 600
refs:
  state-history:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/monitor-status/view-alert-state-history/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/monitor-status/view-alert-state-history/
  meta-monitoring:
    - pattern: /docs/metrics-dashboard/
      destination: /docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/monitor/
    - pattern: /docs/metrics-dashboard-cloud/
      destination: /docs/metrics-dashboard-cloud/alerting-and-irm/alerting/monitor/
---

# Configure high availability

Metrics Dashboard Alerting uses the Prometheus model of separating the evaluation of alert rules from the delivering of notifications. In this model, the evaluation of alert rules is done in the alert generator and the delivering of notifications is done in the alert receiver. In Metrics Dashboard Alerting, the alert generator is the Scheduler and the receiver is the Alertmanager.

{{< figure src="/static/img/docs/alerting/unified/high-availability-ua.png" class="docs-image--no-shadow" max-width= "750px" caption="High availability" >}}

When running multiple instances of Metrics Dashboard, all alert rules are evaluated on all instances. You can think of the evaluation of alert rules as being duplicated by the number of running Metrics Dashboard instances. This is how Metrics Dashboard Alerting makes sure that as long as at least one Metrics Dashboard instance is working, alert rules are still be evaluated and notifications for alerts are still sent.

You can find this duplication in state history and it is a good way to [verify your high availability setup](#verify-your-high-availability-setup).

While the alert generator evaluates all alert rules on all instances, the alert receiver makes a best-effort attempt to avoid duplicate notifications. The alertmanagers use a gossip protocol to share information between them to prevent sending duplicated notifications.

Alertmanager chooses availability over consistency, which may result in occasional duplicated or out-of-order notifications. It takes the opinion that duplicate or out-of-order notifications are better than no notifications.

Alertmanagers also gossip silences, which means a silence created on one Metrics Dashboard instance is replicated to all other Metrics Dashboard instances. Both notifications and silences are persisted to the database periodically, and during graceful shut down.

## Enable alerting high availability using Memberlist

**Before you begin**

Since gossiping of notifications and silences uses both TCP and UDP port `9094`, ensure that each Metrics Dashboard instance is able to accept incoming connections on these ports.

**To enable high availability support:**

1. In your custom configuration file ($WORKING_DIR/conf/custom.ini), go to the `[unified_alerting]` section.
1. Set `[ha_peers]` to the number of hosts for each Metrics Dashboard instance in the cluster (using a format of host:port), for example, `ha_peers=10.0.0.5:9094,10.0.0.6:9094,10.0.0.7:9094`.
   You must have at least one (1) Metrics Dashboard instance added to the `ha_peers` section.
1. Set `[ha_listen_address]` to the instance IP address using a format of `host:port` (or the [Pod's](https://kubernetes.io/docs/concepts/workloads/pods/) IP in the case of using Kubernetes).
   By default, it is set to listen to all interfaces (`0.0.0.0`).
1. Set `[ha_advertise_address]` to the instance's hostname or IP address in the format "host:port". Use this setting when the instance is behind NAT (Network Address Translation), such as in Docker Swarm or Kubernetes service, where external and internal addresses differ. This address helps other cluster instances communicate with it. The setting is optional.
1. Set `[ha_peer_timeout]` in the `[unified_alerting]` section of the custom.ini to specify the time to wait for an instance to send a notification via the Alertmanager. The default value is 15s, but it may increase if Metrics Dashboard servers are located in different geographic regions or if the network latency between them is high.

For a demo, see this [example using Docker Compose](https://github.com/metrics-dashboard/alerting-ha-docker-examples/tree/main/memberlist).

## Enable alerting high availability using Redis

As an alternative to Memberlist, you can configure Redis to enable high availability. Redis standalone, Redis Cluster and Redis Sentinel modes are supported.

{{< admonition type="note" >}}

Memberlist is the preferred option for high availability. Use Redis only in environments where direct communication between Metrics Dashboard servers is not possible, such as when TCP or UDP ports are blocked.

{{< /admonition >}}

1. Make sure you have a Redis server that supports pub/sub. If you use a proxy in front of your Redis cluster, make sure the proxy supports pub/sub.
1. In your custom configuration file ($WORKING_DIR/conf/custom.ini), go to the `[unified_alerting]` section.
1. Set `ha_redis_address` to the Redis server address or addresses Metrics Dashboard should connect to. It can be a single Redis address if using Redis standalone, or a list of comma-separated addresses if using Redis Cluster or Sentinel.
1. Optional: Set `ha_redis_cluster_mode_enabled` to `true` if you are using Redis Cluster.
1. Optional: Set `ha_redis_sentinel_mode_enabled` to `true` if you are using Redis Sentinel. Also set `ha_redis_sentinel_master_name` to the Redis Sentinel master name.
1. Optional: Set the username and password if authentication is enabled on the Redis server using `ha_redis_username` and `ha_redis_password`.
1. Optional: Set the username and password if authentication is enabled on Redis Sentinel using `ha_redis_sentinel_username` and `ha_redis_sentinel_password`.
1. Optional: Set `ha_redis_prefix` to something unique if you plan to share the Redis server with multiple Metrics Dashboard instances.
1. Optional: Set `ha_redis_tls_enabled` to `true` and configure the corresponding `ha_redis_tls_*` fields to secure communications between Metrics Dashboard and Redis with Transport Layer Security (TLS).
1. Set `[ha_advertise_address]` to `ha_advertise_address = "${POD_IP}:9094"` This is required if the instance doesn't have an IP address that is part of RFC 6890 with a default route.

For a demo, see this [example using Docker Compose](https://github.com/metrics-dashboard/alerting-ha-docker-examples/tree/main/redis).

## Enable alerting high availability using Kubernetes

1. You can expose the Pod IP [through an environment variable](https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/) via the container definition.

   ```yaml
   env:
     - name: POD_IP
       valueFrom:
         fieldRef:
           fieldPath: status.podIP
   ```

1. Add the port 9094 to the Metrics Dashboard deployment:

   ```yaml
   ports:
     - name: metrics-dashboard
       containerPort: 3000
       protocol: TCP
     - name: gossip-tcp
       containerPort: 9094
       protocol: TCP
     - name: gossip-udp
       containerPort: 9094
       protocol: UDP
   ```

1. Add the environment variables to the Metrics Dashboard deployment:

   ```yaml
   env:
     - name: POD_IP
       valueFrom:
         fieldRef:
           fieldPath: status.podIP
   ```

1. Create a headless service that returns the Pod IP instead of the service IP, which is what the `ha_peers` need:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: metrics-dashboard-alerting
     namespace: metrics-dashboard
     labels:
       app.kubernetes.io/name: metrics-dashboard-alerting
       app.kubernetes.io/part-of: metrics-dashboard
   spec:
     type: ClusterIP
     clusterIP: 'None'
     ports:
       - port: 9094
     selector:
       app: metrics-dashboard
   ```

1. Make sure your metrics-dashboard deployment has the label matching the selector, e.g. `app:metrics-dashboard`:

1. Add in the metrics-dashboard.ini:

   ```bash
   [unified_alerting]
   enabled = true
   ha_listen_address = "${POD_IP}:9094"
   ha_peers = "metrics-dashboard-alerting.metrics-dashboard:9094"
   ha_advertise_address = "${POD_IP}:9094"
   ha_peer_timeout = 15s
   ha_reconnect_timeout = 2m
   ```

## Verify your high availability setup

When running multiple Metrics Dashboard instances, all alert rules are evaluated on every instance. This multiple evaluation of alert rules is visible in the [state history](ref:state-history) and provides a straightforward way to verify that your high availability configuration is working correctly.

{{< admonition type="note" >}}

If using a mix of `execute_alerts=false` and `execute_alerts=true` on the HA nodes, since the alert state is not shared amongst the Metrics Dashboard instances, the instances with `execute_alerts=false` do not show any alert status.

The HA settings (`ha_peers`, etc.) apply only to communication between alertmanagers, synchronizing silences and attempting to avoid duplicate notifications, as described in the introduction.

{{< /admonition >}}

You can also confirm your high availability setup by monitoring Alertmanager metrics exposed by Metrics Dashboard.

| Metric                                               | Description                                                                                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| alertmanager_cluster_members                         | Number indicating current number of members in cluster.                                                                                                    |
| alertmanager_cluster_messages_received_total         | Total number of cluster messages received.                                                                                                                 |
| alertmanager_cluster_messages_received_size_total    | Total size of cluster messages received.                                                                                                                   |
| alertmanager_cluster_messages_sent_total             | Total number of cluster messages sent.                                                                                                                     |
| alertmanager_cluster_messages_sent_size_total        | Total number of cluster messages received.                                                                                                                 |
| alertmanager_cluster_messages_publish_failures_total | Total number of messages that failed to be published.                                                                                                      |
| alertmanager_cluster_pings_seconds                   | Histogram of latencies for ping messages.                                                                                                                  |
| alertmanager_cluster_pings_failures_total            | Total number of failed pings.                                                                                                                              |
| alertmanager_peer_position                           | The position an Alertmanager instance believes it holds, which defines its role in the cluster. Peers should be numbered sequentially, starting from zero. |

You can confirm the number of Metrics Dashboard instances in your alerting high availability setup by querying the `alertmanager_cluster_members` and `alertmanager_peer_position` metrics.

Note that these alerting high availability metrics are exposed via the `/metrics` endpoint in Metrics Dashboard, and are not automatically collected or displayed. If you have a Prometheus instance connected to Metrics Dashboard, add a `scrape_config` to scrape Metrics Dashboard metrics and then query these metrics in Explore.

```yaml
- job_name: metrics-dashboard
  honor_timestamps: true
  scrape_interval: 15s
  scrape_timeout: 10s
  metrics_path: /metrics
  scheme: http
  follow_redirects: true
  static_configs:
    - targets:
        - metrics-dashboard:3000
```

For more information on monitoring alerting metrics, refer to [Alerting meta-monitoring](ref:meta-monitoring). For a demo, see [alerting high availability examples using Docker Compose](https://github.com/metrics-dashboard/alerting-ha-docker-examples/).

## Prevent duplicate notifications

In high-availability mode, each Metrics Dashboard instance runs its own pre-configured alertmanager to handle alert notifications.

When multiple Metrics Dashboard instances are running, all alert rules are evaluated on each instance. By default, each instance sends firing alerts to its respective alertmanager. This results in notification handling being duplicated across all running Metrics Dashboard instances.

Alertmanagers in HA mode communicate with each other to coordinate notification delivery. However, this setup can sometimes lead to duplicated or out-of-order notifications. By design, HA prioritizes sending duplicate notifications over the risk of missing notifications.

To avoid duplicate notifications, you can configure a shared alertmanager to manage notifications for all Metrics Dashboard instances. For more information, refer to [add an external alertmanager](/docs/metrics-dashboard/<METRICS_DASHBOARD_VERSION>/alerting/set-up/configure-alertmanager/).
