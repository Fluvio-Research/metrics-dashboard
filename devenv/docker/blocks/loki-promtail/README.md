NB: This will not work properly on MacOS. The loglines of metrics-dashboard.log are ingested at the start of this devenv and you won't get any more logs are the Docker service is started.

By default this block is setup to scrape logs from Metrics Dashboard. If you need to log some service from the docker-compse you can add:
```
    # For this to work you need to install the logging driver see https://github.com/metrics-dashboard/loki/tree/master/cmd/docker-driver#plugin-installation
    logging:
      driver: loki
      options:
        loki-url: "http://loki:3100/loki/api/v1/push"
```