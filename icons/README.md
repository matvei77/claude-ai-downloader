# Extension Icons

You need to create three icon files:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## Quick Options:

### Option 1: Use the Icon Generator Tool
Open `generate-icons.html` in your browser to create simple placeholder icons.

### Option 2: Use Online Tools
1. Go to https://favicon.io/ or https://www.flaticon.com/
2. Create or download an icon (suggest using a clipboard or document icon)
3. Resize to the three sizes above
4. Save them in this directory

### Option 3: Use ImageMagick (if installed)
```bash
# Create a simple placeholder icon
convert -size 128x128 xc:transparent \
  -fill "#667eea" -draw "roundrectangle 10,10 118,118 20,20" \
  -fill white -pointsize 80 -gravity center -annotate +0+0 "📝" \
  icon128.png

convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

### Option 4: Use the provided SVG
The `icon.svg` file is provided. You can convert it using:
- https://cloudconvert.com/svg-to-png
- Or any SVG to PNG converter

## Recommended Icon Design:
- Theme: Document/clipboard with Claude colors (purple/blue gradient)
- Simple, recognizable at small sizes
- Use emojis: 📝, 💾, 📋, or similar

## Testing Icons:
After creating the icons, reload the extension in Chrome to see them in action.
