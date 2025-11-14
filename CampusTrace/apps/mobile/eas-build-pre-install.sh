#!/usr/bin/env bash

set -euo pipefail

echo "📦 Setting up monorepo for EAS Build..."

# Go to workspace root
cd ../..

# Install all workspace dependencies
echo "Installing workspace dependencies..."
npm install --legacy-peer-deps

# Go back to mobile app
cd apps/mobile

echo "✅ Monorepo setup complete!"
