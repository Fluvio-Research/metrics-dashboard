# Metrics Dashboard High Availability (HA) test setup

A set of docker compose services which together creates a Metrics Dashboard HA test setup with capability of easily
scaling up/down number of Metrics Dashboard instances.

Included services

- Metrics Dashboard
- Mysql - Metrics Dashboard configuration database and session storage
- Prometheus - Monitoring of Metrics Dashboard and used as data source of provisioned alert rules
- Nginx - Reverse proxy for Metrics Dashboard and Prometheus. Enables browsing Metrics Dashboard/Prometheus UI using a hostname

## Prerequisites

### Build metrics-dashboard docker container

Build a Metrics Dashboard docker container from current branch and commit and tag it as metrics-dashboard/metrics-dashboard:dev.

```bash
$ cd <metrics-dashboard repo>
$ make build-docker-full
```

### Virtual host names

#### Alternative 1 - Use dnsmasq

```bash
$ sudo apt-get install dnsmasq
$ echo 'address=/loc/127.0.0.1' | sudo tee /etc/dnsmasq.d/dnsmasq-loc.conf > /dev/null
$ sudo /etc/init.d/dnsmasq restart
$ ping whatever.loc
PING whatever.loc (127.0.0.1) 56(84) bytes of data.
64 bytes from localhost (127.0.0.1): icmp_seq=1 ttl=64 time=0.076 ms
--- whatever.loc ping statistics ---
1 packet transmitted, 1 received, 0% packet loss, time 1998ms
```

#### Alternative 2 - Manually update /etc/hosts

Update your `/etc/hosts` to be able to access Metrics Dashboard and/or Prometheus UI using a hostname.

```bash
$ cat /etc/hosts
127.0.0.1       metrics-dashboard.loc
127.0.0.1       prometheus.loc
```

## Start services

```bash
$ docker-compose up -d
```

Browse
- http://metrics-dashboard.loc/
- http://prometheus.loc/

Check for any errors

```bash
$ docker-compose logs | grep error
```

### Scale Metrics Dashboard instances up/down

Scale number of Metrics Dashboard instances to `<instances>`

```bash
$ docker-compose up --scale metrics-dashboard=<instances> -d
# for example 3 instances
$ docker-compose up --scale metrics-dashboard=3 -d
```

## Test alerting

### Create notification channels

Creates default notification channels, if not already exists

```bash
$ ./alerts.sh setup
```

### Slack notifications

Disable

```bash
$ ./alerts.sh slack -d
```

Enable and configure url

```bash
$ ./alerts.sh slack -u https://hooks.slack.com/services/...
```

Enable, configure url and enable reminders

```bash
$ ./alerts.sh slack -u https://hooks.slack.com/services/... -r -e 10m
```

### Provision alert dashboards with alert rules

Provision 1 dashboard/alert rule (default)

```bash
$ ./alerts.sh provision
```

Provision 10 dashboards/alert rules

```bash
$ ./alerts.sh provision -a 10
```

Provision 10 dashboards/alert rules and change condition to `gt > 100`

```bash
$ ./alerts.sh provision -a 10 -c 100
```

### Pause/unpause all alert rules

Pause

```bash
$ ./alerts.sh pause
```

Unpause

```bash
$ ./alerts.sh unpause
```
