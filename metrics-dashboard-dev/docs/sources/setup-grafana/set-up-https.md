---
description: Learn how to set up Metrics Dashboard HTTPS for secure web traffic.
keywords:
  - metrics-dashboard
  - https
  - ssl
  - certificates
labels:
  products:
    - enterprise
    - oss
menuTitle: Set up HTTPS
title: Set up Metrics Dashboard HTTPS for secure web traffic
weight: 900
---

# Set up Metrics Dashboard HTTPS for secure web traffic

When accessing the Metrics Dashboard UI through the web, it is important to set up HTTPS to ensure the communication between Metrics Dashboard and the end user is encrypted, including login credentials and retrieved metric data.

In order to ensure secure traffic over the internet, Metrics Dashboard must have a key for encryption and a [Secure Socket Layer (SSL) Certificate](https://www.kaspersky.com/resource-center/definitions/what-is-a-ssl-certificate) to verify the identity of the site.

The following image shows a browser lock icon which confirms the connection is safe.

{{< figure src="/media/docs/metrics-dashboard/https-config/screenshot-secure-https.png" max-width="500px" caption="Secure HTTPS connection" >}}

This topic shows you how to:

1. Obtain a certificate and key
2. Configure Metrics Dashboard HTTPS
3. Restart the Metrics Dashboard server

## Before you begin

To follow these instructions, you need:

- You must have shell access to the system and `sudo` access to perform actions as root or administrator.
- For the CA-signed option, you need a domain name that you possess and that is associated with the machine you are using.

## Obtain a certificate and key

You can use one of two methods to obtain a certificate and a key. The faster and easier _self-signed_ option might show browser warnings to the user that they will have to accept each time they visit the site. Alternatively, the Certificate Authority (CA) signed option requires more steps to complete, but it enables full trust with the browser. To learn more about the difference between these options, refer to [Difference between self-signed CA and self-signed certificate](https://www.baeldung.com/cs/self-signed-ca-vs-certificate).

### Generate a self-signed certificate

This section shows you how to use `openssl` tooling to generate all necessary files from the command line.

1. Run the following command to generate a 2048-bit RSA private key, which is used to decrypt traffic:

   ```bash
   sudo openssl genrsa -out /etc/metrics-dashboard/metrics-dashboard.key 2048
   ```

1. Run the following command to generate a certificate, using the private key from the previous step.

   ```bash
   sudo openssl req -new -key /etc/metrics-dashboard/metrics-dashboard.key -out /etc/metrics-dashboard/metrics-dashboard.csr
   ```

   When prompted, answer the questions, which might include your fully-qualified domain name, email address, country code, and others. The following example is similar to the prompts you will see.

   ```
   You are about to be asked to enter information that will be incorporated
   into your certificate request.
   What you are about to enter is what is called a Distinguished Name or a DN.
   There are quite a few fields but you can leave some blank
   For some fields there will be a default value,
   If you enter '.', the field will be left blank.
   -----
   Country Name (2 letter code) [AU]:US
   State or Province Name (full name) [Some-State]:Virginia
   Locality Name (eg, city) []:Richmond
   Organization Name (eg, company) [Internet Pty Ltd]:
   Organizational Unit Name (eg, section) []:
   Common Name (e.g. server FQDN or YOUR name) []:subdomain.mysite.com
   Email Address []:me@mysite.com

   Please enter the following 'extra' attributes
   to be sent with your certificate request
   A challenge password []:
   An optional company name []:
   ```

1. Run the following command to self-sign the certificate with the private key, for a period of validity of 365 days:

   ```bash
   sudo openssl x509 -req -days 365 -in /etc/metrics-dashboard/metrics-dashboard.csr -signkey /etc/metrics-dashboard/metrics-dashboard.key -out /etc/metrics-dashboard/metrics-dashboard.crt
   ```

1. Run the following commands to set the appropriate permissions for the files:

   ```bash
   sudo chown metrics-dashboard:metrics-dashboard /etc/metrics-dashboard/metrics-dashboard.crt
   sudo chown metrics-dashboard:metrics-dashboard /etc/metrics-dashboard/metrics-dashboard.key
   sudo chmod 400 /etc/metrics-dashboard/metrics-dashboard.key /etc/metrics-dashboard/metrics-dashboard.crt
   ```

   **Note**: When using these files, browsers might provide warnings for the resulting website because a third-party source does not trust the certificate. Browsers will show trust warnings; however, the connection will remain encrypted.

   The following image shows an insecure HTTP connection.

   {{< figure src="/media/docs/metrics-dashboard/https-config/screenshot-insecure-https.png" max-width="750px" caption="Insecure HTTPS connection" >}}

### Obtain a signed certificate from LetsEncrypt

[LetsEncrypt](https://letsencrypt.org/) is a nonprofit certificate authority that provides certificates without any charge. For signed certificates, there are multiple companies and certificate authorities (CAs) available. The principles for generating the certificates might vary slightly in accordance with the provider but will generally remain the same.

The examples in this section use LetsEncrypt because it is free.

{{< admonition type="note" >}}
The instructions provided in this section are for a Debian-based Linux system. For other distributions and operating systems, please refer to the [certbot instructions](https://certbot.eff.org/instructions). Also, these instructions require you to have a domain name that you are in control of. Dynamic domain names like those from Amazon EC2 or DynDNS providers will not function.
{{< /admonition >}}

#### Install `snapd` and `certbot`

`certbot` is an open-source program used to manage LetsEncrypt certificates, and `snapd` is a tool that assists in running `certbot` and installing the certificates.

1. To install `snapd`, run the following commands:

   ```bash
   sudo apt-get install snapd
   sudo snap install core; sudo snap refresh core
   ```

1. Run the following commands to install:

   ```bash
   sudo apt-get remove certbot
   sudo snap install --classic certbot
   sudo ln -s /snap/bin/certbot /usr/bin/certbot
   ```

   These commands:
   - Uninstall `certbot` from your system if it has been installed using a package manager
   - Install `certbot` using `snapd`

#### Generate certificates using `certbot`

The `sudo certbot certonly --standalone` command prompts you to answer questions before it generates a certificate. This process temporarily opens a service on port `80` that LetsEncrypt uses to verify communication with your host.

To generate certificates using `certbot`, complete the following steps:

1. Ensure that port `80` traffic is permitted by applicable firewall rules.

1. Run the following command to generate certificates:

   ```bash
   $ sudo certbot certonly --standalone

   Saving debug log to /var/log/letsencrypt/letsencrypt.log
   Enter email address (used for urgent renewal and security notices)
   (Enter 'c' to cancel): me@mysite.com

   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   Please read the Terms of Service at
   https://letsencrypt.org/documents/LE-SA-v1.3-September-21-2022.pdf. You must
   agree in order to register with the ACME server. Do you agree?
   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   (Y)es/(N)o: y

   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   Would you be willing, once your first certificate is successfully issued, to
   share your email address with the Electronic Frontier Foundation, a founding
   partner of the Let’s Encrypt project and the non-profit organization that
   develops Certbot? We’d like to send you email about our work encrypting the web,
   EFF news, campaigns, and ways to support digital freedom.
   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   (Y)es/(N)o: n
   Account registered.
   Please enter the domain name(s) you would like on your certificate (comma and/or
   space separated) (Enter 'c' to cancel): subdomain.mysite.com
   Requesting a certificate for subdomain.mysite.com

   Successfully received certificate.
   Certificate is saved at: /etc/letsencrypt/live/subdomain.mysite.com/fullchain.pem
   Key is saved at:         /etc/letsencrypt/live/subdomain.mysite.com/privkey.pem
   This certificate expires on 2023-06-20.
   These files will be updated when the certificate renews.
   Certbot has set up a scheduled task to automatically renew this certificate in the background.

   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   If you like Certbot, please consider supporting our work by:
   * Donating to ISRG / Let’s Encrypt:   https://letsencrypt.org/donate
   * Donating to EFF:                    https://eff.org/donate-le
   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   ```

#### Set up symlinks to Metrics Dashboard

Symbolic links, also known as symlinks, enable you to create pointers to existing LetsEncrypt files in the `/etc/metrics-dashboard` directory. By using symlinks rather than copying files, you can use `certbot` to refresh or request updated certificates from LetsEncrypt without the need to reconfigure the Metrics Dashboard settings.

To set up symlinks to Metrics Dashboard, run the following commands:

```bash
$ sudo ln -s /etc/letsencrypt/live/subdomain.mysite.com/privkey.pem /etc/metrics-dashboard/metrics-dashboard.key
$ sudo ln -s /etc/letsencrypt/live/subdomain.mysite.com/fullchain.pem /etc/metrics-dashboard/metrics-dashboard.crt
```

#### Adjust permissions

Metrics Dashboard usually runs under the `metrics-dashboard` Linux group, and you must ensure that the Metrics Dashboard server process has permission to read the relevant files. Without read access, the HTTPS server fails to start properly.

To adjust permissions, perform the following steps:

1. Run the following commands to set the appropriate permissions and groups for the files:

   ```bash
   $ sudo chgrp -R metrics-dashboard /etc/letsencrypt/*
   $ sudo chmod -R g+rx /etc/letsencrypt/*
   $ sudo chgrp -R metrics-dashboard /etc/metrics-dashboard/metrics-dashboard.crt /etc/metrics-dashboard/metrics-dashboard.key
   $ sudo chmod 440 /etc/metrics-dashboard/metrics-dashboard.crt /etc/metrics-dashboard/metrics-dashboard.key
   ```

1. Run the following command to verify that the `metrics-dashboard` group can read the symlinks:

   ```bash
   $ $ ls -l /etc/metrics-dashboard/metrics-dashboard.*

   lrwxrwxrwx 1 root metrics-dashboard    67 Mar 22 14:15 /etc/metrics-dashboard/metrics-dashboard.crt -> /etc/letsencrypt/live/subdomain.mysite.com/fullchain.pem
   -rw-r----- 1 root metrics-dashboard 54554 Mar 22 14:13 /etc/metrics-dashboard/metrics-dashboard.ini
   lrwxrwxrwx 1 root metrics-dashboard    65 Mar 22 14:15 /etc/metrics-dashboard/metrics-dashboard.key -> /etc/letsencrypt/live/subdomain.mysite.com/privkey.pem
   ```

## Configure Metrics Dashboard HTTPS and restart Metrics Dashboard

In this section you edit the `metrics-dashboard.ini` file so that it includes the certificate you created. If you need help identifying where to find this file, or what each key means, refer to [Configuration file location](../configure-metrics-dashboard/#configuration-file-location).

To configure Metrics Dashboard HTTPS and restart Metrics Dashboard, complete the following steps.

1. Open the `metrics-dashboard.ini` file and edit the following configuration parameters:

   ```
   [server]
   http_addr =
   http_port = 3000
   domain = mysite.com
   root_url = https://subdomain.mysite.com:3000
   cert_key = /etc/metrics-dashboard/metrics-dashboard.key
   cert_file = /etc/metrics-dashboard/metrics-dashboard.crt
   enforce_domain = False
   protocol = https
   ```

   > **Note**: The standard port for SSL traffic is 443, which you can use instead of Metrics Dashboard's default port 3000. This change might require additional operating system privileges or configuration to bind to lower-numbered privileged ports.

1. Optional. From Metrics Dashboard v11.2, edit the `cert_pass` configuration option with the decryption password if you are using encrypted certificates.

1. [Restart the Metrics Dashboard server](../start-restart-metrics-dashboard/#linux) using `systemd`, `init.d`, or the binary as appropriate for your environment.

## Troubleshooting

Refer to the following troubleshooting tips as required.

### Failure to obtain a certificate

The following reasons explain why the `certbot` process might fail:

- To make sure you can get a certificate from LetsEncrypt, you need to ensure that port 80 is open so that LetsEncrypt can communicate with your machine. If port 80 is blocked or firewall is enabled, the exchange will fail and you won't be able to receive a certificate.
- LetsEncrypt requires proof that you control the domain, so attempts to obtain certificates for domains you do not
  control might be rejected.

### Metrics Dashboard starts, but HTTPS is unavailable

When you configure HTTPS, the following errors might appear in Metrics Dashboard's logs.

#### Permission denied

```
level=error msg="Stopped background service" service=*api.HTTPServer reason="open /etc/metrics-dashboard/metrics-dashboard.crt: permission denied"
```

##### Resolution

To ensure secure HTTPS setup, it is essential that the cryptographic keys and certificates are as restricted as possible. However, if the file permissions are too restricted, the Metrics Dashboard process may not have access to the necessary files, thus impeding a successful HTTPS setup. Please re-examine the listed instructions to double check the file permissions and try again.

#### Cannot assign requested address

```
listen tcp 34.148.30.243:3000: bind: cannot assign requested address
```

##### Resolution

Check the config to ensure the `http_addr` is left blank, allowing Metrics Dashboard to bind to all interfaces. If you have set `http_addr` to a specific subdomain, such as `subdomain.mysite.com`, this might prevent the Metrics Dashboard process from binding to an external address, due to network address translation layers being present.
