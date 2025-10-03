# Astro UXDS Theme Plugin - Testing Guide

## Plugin Installation Status
✅ **COMPLETED**: The Astro UXDS theme plugin has been successfully installed and Grafana has been restarted.

## Plugin Location
- **Installed at**: `/data/plugins/rocketcom-astrotheme-panel/`
- **Plugin ID**: `rocketcom-astrotheme-panel`
- **Plugin Name**: Astro Theme
- **Version**: 1.1.1

## How to Test the Theme Live

### Step 1: Access Grafana
1. Open your browser and navigate to: **http://localhost:3000**
2. Login with:
   - **Username**: admin
   - **Password**: admin

### Step 2: Create or Open a Dashboard
1. Create a new dashboard or open an existing one
2. The theme will only apply when the Astro Panel is added to the dashboard

### Step 3: Add the Astro Theme Panel
1. Click **"Add a new panel"** in your dashboard
2. In the panel selection menu, look for **"Astro Theme"** panel
3. Select the **Astro Theme** panel from the list
4. The theme styles will immediately apply to your dashboard

### Step 4: Configure Theme Options
The Astro Panel provides several configuration options:

#### Theme Settings
- **Default Theme**: Choose between light/dark theme as default
- **Hide Theme Picker**: Toggle to hide/show the light/dark theme switch button

#### Visual Elements
- **Classification Banner**: Add classification banners at the top of the panel
- **Include Clock**: Show or hide a real-time clock
- **Format**: Choose alignment (left, center, or right) for panel content

#### Panel Visibility
- **Hide Astro Panel**: Hide the panel itself while keeping the theme styles active

### Step 5: Test Theme Features
1. **Theme Switching**: If theme picker is enabled, test switching between light and dark themes
2. **Clock Display**: Verify the clock shows current time and updates
3. **Classification Banner**: Test different classification levels if needed
4. **Navigation**: Navigate within the dashboard - theme should persist
5. **Style Application**: Verify that Grafana's interface adopts the Astro UXDS design system

### Important Notes
- ⚠️ **Dashboard Requirement**: The Astro Panel MUST be present in the dashboard for styles to take effect
- ⚠️ **Navigation Limitation**: Moving away from the dashboard will revert styles to Grafana defaults
- ⚠️ **Panel Visibility**: You can hide the panel content but keep the theme active using "Hide Astro Panel" option

### Troubleshooting
If the plugin doesn't appear:
1. Check if Grafana restarted properly: `./dev.sh status`
2. Restart Grafana manually: `./dev.sh restart`
3. Check logs for errors: `tail -f data/grafana.log`
4. Verify plugin files are in: `/data/plugins/rocketcom-astrotheme-panel/`

### MIL-STD 1472 Compliance
The Astro plugin implements the AstroUX Design System and meets Section 5.17 of MIL-STD 1472 compliance requirements as documented at https://www.astrouxds.com/compliance/mil-std-1472/

### Support
For issues or feature requests, visit: https://github.com/RocketCommunicationsInc/grafana-theme
