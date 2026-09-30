#!/bin/bash

# CampusTrace Mobile App - Production Build Script
# Version: 1.0.0
# Package: app.campustrace.site

echo "🚀 CampusTrace Production Build Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI is not installed${NC}"
    echo "Please install it with: npm install -g eas-cli"
    exit 1
fi

echo -e "${GREEN}✅ EAS CLI is installed${NC}"
echo ""

# Check if logged in to Expo
echo "Checking Expo authentication..."
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Expo${NC}"
    echo "Please login:"
    eas login
else
    echo -e "${GREEN}✅ Logged in to Expo as: $(eas whoami)${NC}"
fi

echo ""
echo "Select build type:"
echo "1) Production (AAB for Play Store)"
echo "2) Sideload (APK for testing)"
echo "3) Both"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}📦 Building Production AAB...${NC}"
        eas build --platform android --profile production
        ;;
    2)
        echo ""
        echo -e "${YELLOW}📦 Building Sideload APK...${NC}"
        eas build --platform android --profile sideload
        ;;
    3)
        echo ""
        echo -e "${YELLOW}📦 Building Production AAB...${NC}"
        eas build --platform android --profile production
        echo ""
        echo -e "${YELLOW}📦 Building Sideload APK...${NC}"
        eas build --platform android --profile sideload
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Build command executed!${NC}"
echo ""
echo "📊 Monitor your build at:"
echo "https://expo.dev/accounts/$(eas whoami)/projects/campustrace-monorepo/builds"
echo ""
echo "📝 Next steps:"
echo "1. Wait for build to complete"
echo "2. Download the build artifact"
echo "3. Test the build on devices"
echo "4. Follow PRODUCTION_CHECKLIST.md for Play Store submission"
echo ""
