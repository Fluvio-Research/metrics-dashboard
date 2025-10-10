# Icon Picker - Quick Start Guide

## What's New?

The Advanced ToolPit layer now has a **visual icon picker** similar to emoji keyboards! No more typing icon names manually.

## Quick Start

### 1. Add an Icon to Your Tooltip

1. Navigate to your Geomap panel
2. Select the Advanced ToolPit layer
3. Go to "Tooltip content" section
4. Click the **apps button** (📱) next to any Icon field
5. Browse and click an icon from the grid
6. Done! The icon will appear in your tooltip

### 2. Icon Picker Features

#### Browse by Category
- **Common:** Popular icons (star, heart, bell, check, etc.)
- **Arrows:** All directional arrows
- **Social:** GitHub, Slack, Google, etc.
- **Data:** Database, charts, tables, dashboards
- **Files:** File operations and folders
- **UI:** Settings, edit, trash, lock icons
- **Navigation:** Home, map, layers, compass
- **Media:** Play, pause, camera icons
- **Communication:** Comments, messages, email
- **Status:** Check marks, warnings, errors
- **All:** Every available icon

#### Search for Icons
Type in the search box to instantly filter icons by name.

Example searches:
- "arrow" - shows all arrow icons
- "heart" - shows heart icons
- "cloud" - shows cloud-related icons
- "user" - shows user/people icons

#### Quick Emojis
Scroll to the bottom of the picker to find common emojis:
- 📍 Pin
- 🔥 Fire
- ⭐ Star
- ❤️ Heart
- 📊 Chart
- 🎯 Target
- 💡 Light bulb
- 🚀 Rocket
- ✅ Check mark
- ⚠️ Warning
- 📌 Pushpin
- 🏠 House

#### Custom Images
Want to use your own icon?
1. Close the picker
2. Paste an image URL directly into the Icon field
3. URL must start with `http://` or `https://`

### 3. Field Dropdown Fix

**Problem Before:** Dropdown didn't show fields from DynamoDB queries

**Fixed Now:** 
- Run your query first
- Fields automatically populate in dropdown
- See "Run query first..." if no data loaded
- Debug info shows how many fields are available

### 4. Tips & Tricks

**Tip 1: Preview Your Icon**
After selecting, you'll see the icon preview in the input field

**Tip 2: Icon Colors**
Use the color picker next to the icon field to customize icon colors

**Tip 3: Clear an Icon**
Click "Clear Icon" at the bottom of the picker to remove the icon

**Tip 4: Manual Entry**
You can still type icon names if you prefer:
- Format: lowercase with hyphens
- Example: `star`, `heart-rate`, `cloud-upload`

**Tip 5: Emoji in Input**
Paste emojis directly into the input field without opening the picker

### 5. Common Use Cases

#### Location Markers
- 📍 `map-marker` - Mark locations
- 🏠 `home` - Home locations
- 🏢 `building` - Buildings/offices
- 🌍 `globe` - Global locations

#### Status Indicators
- ✅ `check-circle` - Success/complete
- ⚠️ `exclamation-triangle` - Warning
- ❌ `times-circle` - Error/failed
- ℹ️ `info-circle` - Information

#### Data & Analytics
- 📊 `chart-line` - Trends/charts
- 📈 `graph-bar` - Statistics
- 🗄️ `database` - Data sources
- 📋 `table` - Tables/lists

#### Actions
- ✏️ `edit` - Edit actions
- 🗑️ `trash-alt` - Delete
- 💾 `save` - Save operations
- 📥 `download-alt` - Downloads

#### Communication
- 💬 `comment-alt` - Comments
- 📧 `envelope` - Messages
- 🔔 `bell` - Notifications
- 📱 `mobile-android` - Mobile

### 6. Troubleshooting

**Q: Icon picker won't open**
- Check browser console for errors (F12)
- Refresh the page
- Clear browser cache

**Q: No fields in dropdown**
- Make sure you've run your query
- Check Query Inspector for data
- Look at debug info: "X data frames found"

**Q: Icon not showing in tooltip**
- Verify icon name is correct
- Check that tooltip is enabled
- Make sure layer is visible

**Q: Can't find an icon**
- Try searching with different keywords
- Check the "All" category
- Consider using an emoji instead
- Use a custom image URL

### 7. Keyboard Shortcuts

- **Escape:** Close icon picker modal
- **Tab:** Navigate between UI elements
- **Enter:** Confirm selection
- **Arrow Keys:** Navigate category tabs

### 8. Best Practices

1. **Consistency:** Use similar icons for similar data types
2. **Colors:** Match icon colors to your theme
3. **Simplicity:** Don't overuse icons - sometimes text is clearer
4. **Accessibility:** Choose icons that are recognizable
5. **Testing:** Preview tooltips with different zoom levels

### 9. Example Configurations

#### Photo Location Tooltip
```
Header: 📸 "camera" (from field: title)
Row 1: 📍 "map-marker" Location
Row 2: 📅 "calendar-alt" Date Taken
Row 3: 👤 "user" Photographer
Row 4: ⭐ "star" Rating
```

#### Server Status Tooltip
```
Header: 🖥️ "monitor" (from field: server_name)
Row 1: ✅/❌ Status (conditional)
Row 2: 💾 "database" Database Size
Row 3: 📊 "graph-bar" CPU Usage
Row 4: 🌡️ "thermometer-half" Temperature
```

#### Sales Data Tooltip
```
Header: 💰 "dollar-alt" (from field: region)
Row 1: 📈 "chart-line" Revenue
Row 2: 🛒 "shopping-cart" Orders
Row 3: 👥 "users-alt" Customers
Row 4: ⏱️ "clock-nine" Last Updated
```

## Need More Help?

See the full documentation: `GEOMAP-ADVANCED-TOOLPIT-IMPROVEMENTS.md`

## Feedback

If you encounter issues or have suggestions, check the browser console for debug information and refer to the troubleshooting section.

Happy mapping! 🗺️

