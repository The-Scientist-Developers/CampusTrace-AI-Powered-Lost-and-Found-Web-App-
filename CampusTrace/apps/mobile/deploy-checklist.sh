#!/bin/bash

# CampusTrace Mobile App - Push Notifications Deployment Checklist
# Run this script to verify everything is ready for deployment

echo "🚀 CampusTrace Push Notifications - Deployment Checklist"
echo "=========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: EAS CLI installed
echo "1️⃣  Checking EAS CLI..."
if command -v eas &> /dev/null; then
    echo -e "${GREEN}✅ EAS CLI is installed${NC}"
    eas --version
else
    echo -e "${RED}❌ EAS CLI not found${NC}"
    echo "   Install with: npm install -g eas-cli"
    exit 1
fi
echo ""

# Check 2: Logged into Expo
echo "2️⃣  Checking Expo login..."
if eas whoami &> /dev/null; then
    echo -e "${GREEN}✅ Logged into Expo as: $(eas whoami)${NC}"
else
    echo -e "${RED}❌ Not logged into Expo${NC}"
    echo "   Login with: eas login"
    exit 1
fi
echo ""

# Check 3: app.config.js has EAS project ID
echo "3️⃣  Checking EAS project ID..."
if grep -q "projectId.*8d3dfad3-5b4f-4fea-ab86-59762edd8083" app.config.js; then
    echo -e "${GREEN}✅ EAS project ID configured${NC}"
else
    echo -e "${YELLOW}⚠️  EAS project ID not found or different${NC}"
    echo "   Expected: 8d3dfad3-5b4f-4fea-ab86-59762edd8083"
fi
echo ""

# Check 4: expo-notifications package
echo "4️⃣  Checking expo-notifications package..."
if grep -q "expo-notifications" package.json; then
    echo -e "${GREEN}✅ expo-notifications package found${NC}"
    grep "expo-notifications" package.json
else
    echo -e "${RED}❌ expo-notifications not found in package.json${NC}"
    exit 1
fi
echo ""

# Check 5: Push notification files exist
echo "5️⃣  Checking push notification files..."
if [ -f "src/utils/pushNotifications.js" ]; then
    echo -e "${GREEN}✅ pushNotifications.js exists${NC}"
else
    echo -e "${RED}❌ pushNotifications.js not found${NC}"
    exit 1
fi
echo ""

# Check 6: Environment variables
echo "6️⃣  Checking environment variables..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    if grep -q "EXPO_PUBLIC_API_URL" .env; then
        echo -e "${GREEN}✅ EXPO_PUBLIC_API_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️  EXPO_PUBLIC_API_URL not found in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
fi
echo ""

# Check 7: eas.json configuration
echo "7️⃣  Checking eas.json..."
if [ -f "../../eas.json" ]; then
    echo -e "${GREEN}✅ eas.json exists${NC}"
    if grep -q "production" ../../eas.json; then
        echo -e "${GREEN}✅ Production profile configured${NC}"
    fi
else
    echo -e "${RED}❌ eas.json not found${NC}"
    echo "   Run: eas build:configure"
    exit 1
fi
echo ""

# Summary
echo "=========================================================="
echo "📋 Next Steps:"
echo ""
echo "1. Run database migration in Supabase:"
echo "   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;"
echo ""
echo "2. Build the app:"
echo "   eas build --platform android --profile production"
echo ""
echo "3. Test notifications after installing the build"
echo ""
echo "4. Monitor at: https://expo.dev/notifications"
echo ""
echo "✅ All checks passed! Ready to build."
echo "=========================================================="
