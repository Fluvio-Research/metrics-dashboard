---
description: Learn how to configure SAML authentication in Metrics Dashboard's UI.
labels:
  products:
    - cloud
    - enterprise
menuTitle: Configure SAML single logout
title: Configure SAML single logout
weight: 560
---

# Configure SAML Single Logout

The single logout feature allows users to log out from all applications associated with the current IdP session established via SAML SSO. If the `single_logout` option is set to `true` and a user logs out, Metrics Dashboard requests IdP to end the user session which in turn triggers logout from all other applications the user is logged into using the same IdP session (applications should support single logout). Conversely, if another application connected to the same IdP logs out using single logout, Metrics Dashboard receives a logout request from IdP and ends the user session.

{{< admonition type="note" >}}
The improved SLO features, including proper handling of the IdP's SessionIndex, are currently behind the `improvedExternalSessionHandlingSAML` feature toggle. When this feature toggle is enabled, Metrics Dashboard will correctly handle session-specific logouts. If the feature toggle is not enabled, logging out will end all of the user's sessions.
{{< /admonition >}}
