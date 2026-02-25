# Image Panel

Display images from database URLs with support for URL arrays and click-to-filter functionality.

## Features

- **Multiple Display Modes**:
  - **Single**: Show the first image
  - **Grid**: Display images in a responsive grid layout
  - **Carousel**: Navigate through images with previous/next buttons

- **URL Array Support**: Automatically handles database fields containing:
  - `null` values (shows placeholder or nothing)
  - Single URL: `"https://example.com/image.jpg"`
  - JSON array of URLs: `["url1.jpg", "url2.jpg"]`
  - Array fields from database queries

- **Click to Filter**: Click on images to set dashboard variable values, similar to Table Panel
  - Configure source field and target variable
  - Toggle mode to clear filter on second click
  - Visual indicators for clickable images

- **Layout Options**:
  - Image fit modes: contain, cover, fill, scale-down
  - Configurable grid columns (1-8)
  - Adjustable gap between images
  - Border radius customization
  - Image counter display
  - Lightbox for full-screen viewing
  - Auto-rotate for carousel mode

## Configuration

### Image Source
- **URL field**: Select the field containing image URLs (supports arrays)
- **Fallback URL**: Image to show when data is null or empty
- **Placeholder**: Show a message when no images are available

### Layout
- **Display mode**: Single, Grid, or Carousel
- **Image fit**: How images fit in their container
- **Grid columns**: Number of columns (Grid mode only)
- **Gap**: Space between images
- **Border radius**: Corner rounding
- **Image counter**: Show image count or position
- **Lightbox**: Enable full-screen image viewing
- **Auto-rotate**: Automatic carousel rotation interval

### Click to Filter
- **Enable**: Turn on click-to-filter functionality
- **Source field**: Field to use as filter value
- **Target variable**: Dashboard variable to update (without $)
- **Toggle mode**: Click same value to clear filter
- **Show indicator**: Highlight clickable images with border
- **Cursor style**: Mouse cursor when hovering

## Example Use Cases

### 1. Site Photos from Database
Query returns a row with `sitePhotoUrls` field containing an array:
```json
{
  "siteId": "1300051",
  "sitePhotoUrls": [
    "https://example.com/photo1.jpeg",
    "https://example.com/photo2.jpeg"
  ]
}
```

Configure:
- URL field: `sitePhotoUrls`
- Display mode: Grid
- Grid columns: 3
- Click to filter enabled with source field: `siteId`

### 2. Product Images with Filtering
Display product images and filter dashboard when clicked:
- URL field: `productImages`
- Display mode: Carousel
- Auto-rotate interval: 3000ms
- Click to filter: Target variable `selectedProduct`

## Tips

- If no URL field is specified, the panel uses the first field in the data
- Use Toggle mode for easy filter clearing
- Lightbox works great with Grid display mode
- Set auto-rotate to 0 to disable automatic carousel rotation
- Show placeholder when you want users to know there's no data































































