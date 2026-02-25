# Control Panel Plugin

A fancy, customizable control panel that provides **time picker** and **variable filters** functionality. This panel can be placed anywhere on your Grafana dashboard, allowing you to hide the default time picker and variable dropdowns for a cleaner, more customized layout.

## Features

### 🕐 Time Picker
- **Quick Range Selection**: Pre-built time range buttons (5m, 15m, 30m, 1h, 3h, 6h, 12h, 24h, 2d, 7d, 30d)
- **Navigation Controls**: Move time range backwards/forwards
- **Zoom Controls**: Zoom out to see a larger time range
- **Refresh Button**: Manual dashboard refresh with animated feedback

### 🎛️ Variable Filters
- **Dynamic Variable Loading**: Automatically loads all dashboard variables
- **Include/Exclude Filters**: Show only specific variables or hide certain ones
- **Multi-Select Support**: Works with both single and multi-select variables
- **Labels**: Optional labels above each filter

### 🎨 Themes
Four beautiful theme options:
- **Default**: Standard Grafana styling
- **Glass**: Modern glassmorphism effect with blur
- **Gradient**: Eye-catching gradient background
- **Minimal**: Transparent, borderless design

### 📐 Layout Modes
- **Horizontal**: Controls in a row (best for wide panels)
- **Vertical**: Controls stacked (best for narrow sidebars)
- **Compact**: Wrapping layout for flexible sizing

## Usage

### Hiding Native Controls

To use this panel effectively, you'll want to hide Grafana's native controls:

1. **Hide Time Picker**: Dashboard Settings → General → Hide time picker
2. **Hide Variables**: Dashboard Settings → Variables → Set "Hide" on each variable

### Panel Options

#### Display Settings
| Option | Description |
|--------|-------------|
| Layout Mode | Horizontal, Vertical, or Compact arrangement |
| Panel Theme | Default, Glass, Gradient, or Minimal |
| Show Title | Display a custom title above controls |
| Border Radius | Roundness of panel corners (0-24px) |
| Padding | Inner spacing (0-32px) |
| Background Opacity | Transparency level (0-100%) |

#### Time Picker Settings
| Option | Description |
|--------|-------------|
| Show Time Picker | Enable/disable the time picker |
| Show Quick Ranges | Display preset time range buttons |
| Show Zoom Controls | Display navigation and zoom buttons |
| Show Refresh Button | Display manual refresh button |

#### Variable Filter Settings
| Option | Description |
|--------|-------------|
| Show Variable Filters | Enable/disable variable filters |
| Show Labels | Display labels above each filter |
| Compact Mode | Labels inline with filters |
| Include Variables | Comma-separated list of variables to show |
| Exclude Variables | Comma-separated list of variables to hide |

## Examples

### Sidebar Control Panel
Create a narrow panel on the left side of your dashboard with vertical layout:
```
Width: 3 columns
Layout: Vertical
Theme: Glass
```

### Top Bar Replacement
Place a wide panel at the top to replace the native controls:
```
Width: 24 columns
Height: 2 rows
Layout: Horizontal
Theme: Minimal
```

### Floating Filter Panel
Place on top of a map or chart:
```
Position: Overlay
Theme: Glass
Opacity: 85%
Border Radius: 12px
```

## Customization Tips

1. **For dark dashboards**: Use Glass or Gradient theme with 90-95% opacity
2. **For light dashboards**: Use Minimal theme or reduce opacity to 80%
3. **For small screens**: Use Compact mode with hidden labels
4. **For data-focused dashboards**: Hide time picker, show only critical filters

## Technical Details

This panel uses:
- `@grafana/runtime` for location and template services
- `@grafana/ui` for consistent UI components
- Redux for state management
- CSS-in-JS with `@emotion/css` for styling

The panel does not require any data queries (`skipDataQuery: true`).
