#!/bin/bash
set -e

echo "🔧 Setting up Node.js build environment..."

# Clean install
npm ci

echo "🔧 Fixing permissions..."
# Fix permissions for all binaries
find node_modules/.bin -type f -exec chmod +x {} \; 2>/dev/null || true

echo "🏗️ Building React app..."
# Try multiple build methods
if npx react-scripts build; then
    echo "✅ Build successful with npx!"
elif ./node_modules/.bin/react-scripts build; then
    echo "✅ Build successful with direct path!"
else
    echo "❌ Build failed with both methods"
    exit 1
fi

echo "🎉 Build completed successfully!"
