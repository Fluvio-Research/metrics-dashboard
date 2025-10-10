# 🌊 Fluvio Cascade - Modern Dashboard Setup Guide

## 📋 Overview

This guide will help you implement the ultra-modern Fluvio Cascade monitoring dashboard with advanced features including:

- 📸 **Interactive Image Tooltips**: Site photos displayed directly in tooltips
- 🎨 **Multi-layer Visualization**: 4-layer depth with coverage areas
- 🔄 **Real-time Updates**: 30-second refresh intervals
- 🎯 **Advanced Filtering**: Organization and site-based filtering
- 🛰️ **Satellite Imagery**: High-resolution basemap
- 📊 **Rich Data Display**: Emoji-enhanced field names and descriptions

## 🚀 Quick Setup

### Option 1: Ultra Modern Dashboard (Recommended)
```bash
# Use the ultra_modern_dashboard.json file
# This includes all advanced features and styling
```

### Option 2: Standard Modern Dashboard
```bash
# Use the modernized_main_dashboard.json file
# This includes basic modern features
```

## 📁 Files Created

1. **`ultra_modern_dashboard.json`** - Complete ultra-modern dashboard
2. **`modernized_main_dashboard.json`** - Standard modern dashboard
3. **`DASHBOARD_SETUP_GUIDE.md`** - This setup guide

## 🔧 Implementation Steps

### 1. Login to Grafana
```
URL: http://localhost:3000
Username: mubashir@fluvio.com.au
Password: Idm@9550
```

### 2. Import Dashboard
1. Go to **Dashboards** → **New** → **Import**
2. Copy the contents of `ultra_modern_dashboard.json`
3. Paste into the JSON field
4. Click **Load**
5. Verify the datasource is set to your DynamoDB connection
6. Click **Import**

### 3. Verify Data Source
Ensure your DynamoDB datasource (`dezigq1h2x5hcf`) is properly configured with:
- Table: `datastore-DeviceMetadataTable-1I4TZY33ZRJGY`
- Required fields: `org`, `device`, `timestamp`, `Image_Source`, `site`, `Site_Latitude`, `Site_Longitude`, `serial`, `imei`, `variables`, `swaps`

## ✨ Key Features

### 🖼️ Image Tooltips
- **Image Display**: Site photos appear directly in tooltips
- **Full Resolution Links**: Click to view high-res images
- **Copy URL Function**: Easy sharing of image links

### 🎨 Visual Enhancements
- **4-Layer Design**:
  - ⭐ Primary stations (star markers)
  - 🔵 Coverage areas (translucent circles)
  - 🟡 Extended range (larger translucent)
  - 🟣 Maximum range (very large, subtle)

### 📊 Data Transformations
- **Type Conversion**: Lat/Lon converted to numbers
- **Field Organization**: Optimized field order
- **Data Sorting**: Alphabetical by site name
- **Field Filtering**: Unnecessary fields hidden

### 🔍 Advanced Filtering
- **Organization Filter**: Multi-select dropdown
- **Site Filter**: Multi-select dropdown
- **Dynamic Queries**: Filters applied to data source

### 🎯 Tooltip Configuration
```json
"Image_Source": {
  "displayName": "📸 Site Photography",
  "links": [
    {
      "title": "🖼️ View Full Resolution Image",
      "url": "${__value.raw}",
      "targetBlank": true
    }
  ],
  "custom.displayMode": "image",
  "custom.width": 250,
  "custom.height": 180
}
```

## 🛠️ Customization Options

### Marker Styles
```json
"style": {
  "color": {"fixed": "#FF6B6B"},
  "opacity": 1.0,
  "size": {"fixed": 20},
  "symbol": {"fixed": "img/icons/marker/star.svg"}
}
```

### Basemap Options
- **Current**: Esri World Imagery (satellite)
- **Alternatives**: 
  - OpenStreetMap
  - Esri World Street Map
  - CartoDB Positron

### Color Scheme
- **Primary**: #FF6B6B (coral red)
- **Secondary**: #4ECDC4 (teal)
- **Accent**: #FFE66D (yellow)
- **Success**: #73BF69 (green)

## 🔧 Troubleshooting

### Images Not Showing
1. Check `Image_Source` field contains valid URLs
2. Verify URLs are accessible
3. Check field override configuration
4. Ensure `custom.displayMode` is set to "image"

### Markers Not Appearing
1. Verify lat/lon fields are numeric
2. Check data transformations are applied
3. Confirm coordinate values are valid
4. Check layer configuration

### Performance Issues
1. Reduce refresh interval if needed
2. Add more specific filters
3. Limit data range with time picker
4. Optimize DynamoDB query

## 📈 Performance Optimizations

### Query Optimization
```sql
SELECT org, device, timestamp, Image_Source, site, 
       Site_Latitude, Site_Longitude, serial, imei, 
       variables, swaps 
FROM "datastore-DeviceMetadataTable-1I4TZY33ZRJGY" 
WHERE org LIKE '%${organization:pipe}%' OR '${organization}' = 'All'
```

### Data Transformations
1. **Convert Field Types**: Ensure numeric fields are numbers
2. **Organize Fields**: Hide unnecessary fields
3. **Sort Data**: Alphabetical ordering for consistency

## 🎨 Advanced Styling Tips

### Custom Emojis in Field Names
```json
"displayName": "📍 Site Name"
"displayName": "🌐 Latitude"
"displayName": "📸 Site Photography"
```

### Multi-layer Opacity
- Primary: 1.0 (fully opaque)
- Coverage: 0.4 (semi-transparent)
- Extended: 0.2 (subtle)
- Maximum: 0.1 (barely visible)

## 🔄 Maintenance

### Regular Updates
- Monitor data source connectivity
- Update image URLs as needed
- Refresh template variables
- Check performance metrics

### Backup Configuration
- Export dashboard JSON regularly
- Document any custom modifications
- Keep version history

## 📞 Support

For technical support or customization requests:
- **Email**: mubashir@fluvio.com.au
- **Dashboard**: Fluvio Cascade Main Dashboard
- **Version**: Ultra Modern v1.0

---

*This dashboard was created with modern UX principles and advanced Grafana features to provide the best possible monitoring experience for the Fluvio Cascade network.*
