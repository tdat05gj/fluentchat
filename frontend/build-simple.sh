#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm install

echo "🏗️ Building with Node.js directly..."
# Use Node.js to run build script directly
node node_modules/react-scripts/scripts/build.js

echo "🎉 Build completed!"
