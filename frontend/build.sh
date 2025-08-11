#!/bin/bash
# Fix permissions and build React app
echo "Setting up build environment..."

# Ensure node_modules/.bin has proper permissions
if [ -d "node_modules/.bin" ]; then
    chmod +x node_modules/.bin/*
fi

# Install dependencies with clean cache
npm ci --no-optional

# Build with explicit path
./node_modules/.bin/react-scripts build
