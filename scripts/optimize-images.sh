#!/bin/bash
# Image optimization script for Team Pinas Signage
# Run this to optimize all images for web performance

echo "🖼️ Optimizing images for web performance..."

cd "$(dirname "$0")/.."

# Create optimized directory if it doesn't exist
mkdir -p public/assets/images/optimized

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Install with: brew install imagemagick"
    echo "📝 Manual optimization needed:"
    echo "   - Resize background.jpg to max 1920x1080 and compress to ~200KB"
    echo "   - Optimize team-pinas-logo.svg (remove unnecessary metadata)"
    exit 1
fi

# Optimize background image (7.3MB -> ~200KB)
if [ -f "public/assets/images/background.jpg" ]; then
    echo "📸 Optimizing background.jpg..."
    convert "public/assets/images/background.jpg" \
        -resize 1920x1080^ \
        -gravity center \
        -extent 1920x1080 \
        -quality 75 \
        -strip \
        "public/assets/images/optimized/background.jpg"
    
    # Get file sizes for comparison
    ORIGINAL_SIZE=$(du -h "public/assets/images/background.jpg" | cut -f1)
    OPTIMIZED_SIZE=$(du -h "public/assets/images/optimized/background.jpg" | cut -f1)
    echo "   Original: $ORIGINAL_SIZE → Optimized: $OPTIMIZED_SIZE"
fi

# Create WebP versions for modern browsers
echo "🔄 Creating WebP versions..."
if command -v cwebp &> /dev/null; then
    cwebp -q 80 "public/assets/images/optimized/background.jpg" -o "public/assets/images/optimized/background.webp"
    echo "   Created background.webp"
else
    echo "⚠️ WebP conversion skipped (cwebp not installed)"
    echo "   Install with: brew install webp"
fi

# Optimize SVG files
if command -v svgo &> /dev/null; then
    echo "🎨 Optimizing SVG files..."
    svgo --folder="public/assets/images" --recursive --output="public/assets/images/optimized"
else
    echo "⚠️ SVG optimization skipped (svgo not installed)"
    echo "   Install with: npm install -g svgo"
fi

echo "✅ Image optimization complete!"
echo "📊 Next steps:"
echo "   1. Update CSS to use optimized/background.jpg"
echo "   2. Implement responsive images with <picture> element"
echo "   3. Add WebP support with fallbacks"