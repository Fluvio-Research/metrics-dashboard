# Geomap Advanced ToolPit Layer - Improvements

## Summary

Enhanced the Advanced ToolPit layer in Grafana's Geomap panel with two major improvements:

1. **Fixed Field Dropdown Issue** - Resolved the problem where field dropdowns weren't showing available fields from DynamoDB plugin queries
2. **Modern Icon Picker** - Replaced text input with a visual icon picker similar to emoji keyboards on mobile devices

## Changes Made

### 1. New Icon Picker Component

**File:** `grafana-dev/public/app/plugins/panel/geomap/components/IconPicker.tsx`

Created a new, user-friendly icon picker component that provides:

- **Visual Icon Browser**: Grid display of all 200+ available Grafana icons
- **Categorized Icons**: Icons organized into logical categories (Common, Arrows, Social, Data, Files, UI, Navigation, Media, Communication, Status)
- **Search Functionality**: Real-time search to quickly find icons by name
- **Emoji Support**: Quick access to commonly used emojis
- **URL Support**: Ability to use custom icon image URLs
- **Live Preview**: Shows selected icon in the input field
- **Modern Modal UI**: Clean, responsive interface with proper theming support

### 2. Enhanced Field Discovery & Debugging

**Files Modified:**
- `grafana-dev/public/app/plugins/panel/geomap/editor/AdvancedToolPitFieldsEditor.tsx`
- `grafana-dev/public/app/plugins/panel/geomap/editor/AdvancedToolPitHeaderEditor.tsx`

#### Improvements:

**Better Field Detection:**
- Enhanced `buildFieldOptions()` function to handle edge cases with DynamoDB data
- Added robust null/undefined checks for frames and fields
- Improved field labeling with fallbacks for fields without display names
- Added field type information in dropdown descriptions

**Debug Logging:**
- Added comprehensive console logging to track field discovery
- Shows frame count, field count, and available options
- Helps diagnose issues with data sources not providing fields

**Improved User Feedback:**
- Dropdown now shows clear message "Run query first..." when no data is available
- Disabled state for dropdowns when no fields are present
- Debug information displayed in UI showing frame and field counts
- Better placeholders and no-options messages

**Icon Picker Integration:**
- Replaced plain text inputs with visual icon picker in both:
  - Field detail rows (for row icons)
  - Header configuration (for header icon)
- Maintains backward compatibility with existing configurations

### 3. Better Error Handling

- Field dropdowns no longer fail silently
- Clear visual feedback when queries haven't been run yet
- Helpful debug information for troubleshooting

## How to Use

### Using the Icon Picker

1. **Browse Icons:**
   - Click the apps icon button (📱) next to any Icon field
   - Modal opens showing all available icons organized by category
   - Click category tabs to filter icons
   - Use search box to find specific icons

2. **Select an Icon:**
   - Click any icon in the grid to select it
   - Icon name automatically populates the input field
   - Preview appears in the input field

3. **Use Emojis:**
   - Click the emoji section at the bottom of the picker
   - Select from common emojis
   - Or paste any emoji directly into the input field

4. **Use Custom Images:**
   - Enter an image URL (starting with http:// or https://)
   - The URL will be rendered as the icon

5. **Enter Icon Names Manually:**
   - You can still type icon names directly if you know them
   - Format: lowercase with hyphens (e.g., 'star', 'heart-rate', 'cloud-upload')

### Configuring Field Tooltips

1. **Run Your Query First:**
   - Make sure your DynamoDB query is configured and returns data
   - The field dropdowns will populate automatically when data is available

2. **Add Field Rows:**
   - Click "Add field" button
   - Select the field from the dropdown
   - Optionally customize the label
   - Add an icon using the icon picker
   - Choose icon color with the color picker

3. **Debug Field Issues:**
   - If no fields appear, check the debug information displayed
   - Console logs show detailed information about data frames
   - Verify your query is returning data in the Query Inspector

### Configuring the Header

1. **Select Header Field:**
   - Choose which field should appear as the tooltip title
   - Or provide fallback text for when the field is empty

2. **Add Header Icon:**
   - Use the icon picker to select a header icon
   - Choose icon color

3. **Toggle Duplicate Row:**
   - Enable "Hide duplicate row" to prevent showing the same field twice

## Technical Details

### Icon Picker Architecture

- **Available Icons**: Uses Grafana's `availableIconsIndex` (200+ icons)
- **Categories**: Organized into 11 categories for easy browsing
- **State Management**: Local state for search, category selection, modal visibility
- **Responsive**: Grid layout adapts to different screen sizes
- **Performance**: Memoized filtering for smooth search experience

### Field Discovery Improvements

**Previous Issue:**
- Field dropdowns would be empty even when data was loaded
- No feedback about why fields weren't appearing
- Silent failures made troubleshooting difficult

**Solution:**
- Added defensive coding with null checks
- Comprehensive logging at each step
- Visual debug information in the UI
- Better error messages and placeholders

**Field Key Format:**
- Fields are identified by `frameIndex:fieldIndex` format
- Supports multiple data frames
- Maintains compatibility with existing configurations

### Console Logging

When debugging field issues, check the browser console for:

```
[AdvancedToolPitFieldsEditor] Building field options: {
  framesCount: 1,
  totalFields: 15,
  optionsCount: 15,
  frames: [...],
  options: [...]
}

[buildFieldOptions] Built 15 field options from 1 frames
```

## DynamoDB Plugin Compatibility

The improvements specifically address issues with the DynamoDB plugin:

1. **Dynamic Field Discovery:** Works with any table structure
2. **Nested Data Support:** Handles complex DynamoDB data types
3. **Type Information:** Shows field types in dropdown descriptions
4. **Flexible Field Names:** Handles fields without display names

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- Responsive design works on all screen sizes

## Known Limitations

1. **Icon Preview:** Grafana icon names must be exact matches
2. **Custom Images:** URLs must be publicly accessible
3. **Field Limit:** Maximum 6 tooltip detail rows (by design)
4. **Data Requirement:** Query must be run before fields appear

## Future Enhancements

Potential improvements for future versions:

1. **Icon Upload:** Allow users to upload custom icon images
2. **Icon Favorites:** Save frequently used icons
3. **Field Preview:** Show field values while configuring
4. **Template Variables:** Support for Grafana template variables in icons
5. **Dynamic Icons:** Icon selection based on field values

## Troubleshooting

### No Fields Appearing in Dropdown

1. **Check Query Status:**
   - Make sure query has been executed
   - Check Query Inspector for returned data
   - Verify data source connection

2. **Check Debug Info:**
   - Look at debug information displayed in UI
   - Should show "X data frames found, Y total fields available"
   - If 0 frames, query hasn't run or returned no data

3. **Console Logs:**
   - Open browser console (F12)
   - Look for `[buildFieldOptions]` and `[AdvancedToolPitFieldsEditor]` logs
   - Check for any error messages

4. **Field Type Filters:**
   - Check "Allowed field types" setting
   - If set, only matching field types will appear
   - Clear filters to see all fields

### Icon Not Displaying

1. **Icon Name:** Verify the icon name exists in Grafana's icon library
2. **Emoji:** Make sure emoji is properly copied/pasted
3. **URL:** Check that image URL is accessible and starts with http:// or https://
4. **Format:** Icon names should be lowercase with hyphens

### Icon Picker Modal Issues

1. **Modal Not Opening:** Check browser console for errors
2. **Icons Not Loading:** Verify Grafana assets are loading properly
3. **Search Not Working:** Try clearing search and selecting category again

## Testing Checklist

- [ ] Icon picker opens when clicking browse button
- [ ] Icons display in grid layout
- [ ] Search filters icons correctly
- [ ] Category tabs switch icon sets
- [ ] Selected icon appears in input field
- [ ] Emoji section displays and works
- [ ] Custom URLs can be entered
- [ ] Field dropdown populates after query runs
- [ ] Debug information shows when no fields available
- [ ] Selected fields display in tooltip
- [ ] Icons render correctly in tooltip
- [ ] Color picker applies colors to icons
- [ ] Configuration persists after save

## Performance Notes

- Icon picker uses CSS Grid for efficient rendering
- Memoized filtering prevents unnecessary re-renders
- Portal rendering for modal prevents z-index issues
- Lazy loading of icon SVGs via Grafana's icon system
- Field options built only when data changes

## Accessibility

- Icon picker modal has proper ARIA labels
- Keyboard navigation supported in dropdowns
- Color contrast meets WCAG standards
- Screen reader support for icon names
- Focus management in modal

## Related Documentation

- [Grafana Icon Documentation](https://grafana.com/developers/saga/components/icon/)
- [Geomap Panel Documentation](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/geomap/)
- [DynamoDB Data Source](https://grafana.com/grafana/plugins/grafana-dynamodb-datasource/)

## Version Information

- **Grafana Version:** 11.x+
- **Panel:** Geomap
- **Layer:** Advanced ToolPit
- **Date:** October 2025

