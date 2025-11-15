#!/usr/bin/env python3
"""
Push Notifications Setup Checker
Run this to verify everything is ready for deployment
"""

import os
import json
import sys
from pathlib import Path

def check_file_exists(path, description):
    """Check if a file exists."""
    if os.path.exists(path):
        print(f"✅ {description}")
        return True
    else:
        print(f"❌ {description} - NOT FOUND")
        return False

def check_file_contains(path, search_string, description):
    """Check if a file contains a specific string."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            if search_string in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} - NOT FOUND")
                return False
    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        return False

def main():
    print("🔔 CampusTrace Push Notifications Setup Checker")
    print("=" * 60)
    print()
    
    all_checks_passed = True
    
    # Backend Checks
    print("📦 Backend Files:")
    all_checks_passed &= check_file_exists(
        "CampusTrace-Backend/app/push_notification_service.py",
        "Push notification service"
    )
    all_checks_passed &= check_file_exists(
        "CampusTrace-Backend/app/main.py",
        "Main backend file"
    )
    all_checks_passed &= check_file_contains(
        "CampusTrace-Backend/app/main.py",
        "PushNotificationService",
        "Push notification import in main.py"
    )
    all_checks_passed &= check_file_contains(
        "CampusTrace-Backend/app/main.py",
        "push_router",
        "Push notification router in main.py"
    )
    all_checks_passed &= check_file_contains(
        "CampusTrace-Backend/requirements.txt",
        "httpx",
        "httpx dependency"
    )
    print()
    
    # Mobile App Checks
    print("📱 Mobile App Files:")
    all_checks_passed &= check_file_exists(
        "CampusTrace/apps/mobile/src/utils/pushNotifications.js",
        "Push notification utility"
    )
    all_checks_passed &= check_file_contains(
        "CampusTrace/apps/mobile/package.json",
        "expo-notifications",
        "expo-notifications package"
    )
    all_checks_passed &= check_file_contains(
        "CampusTrace/apps/mobile/App.jsx",
        "pushNotifications",
        "Push notification import in App.jsx"
    )
    print()
    
    # Configuration Checks
    print("⚙️  Configuration:")
    all_checks_passed &= check_file_exists(
        "CampusTrace/apps/mobile/app.config.js",
        "App configuration"
    )
    all_checks_passed &= check_file_contains(
        "CampusTrace/apps/mobile/app.config.js",
        "8d3dfad3-5b4f-4fea-ab86-59762edd8083",
        "EAS project ID"
    )
    all_checks_passed &= check_file_exists(
        "CampusTrace/eas.json",
        "EAS build configuration"
    )
    print()
    
    # Database Migration
    print("🗄️  Database:")
    all_checks_passed &= check_file_exists(
        "CampusTrace-Backend/migrations/add_push_token_column.sql",
        "Database migration file"
    )
    print()
    
    # Documentation
    print("📚 Documentation:")
    all_checks_passed &= check_file_exists(
        "PUSH_NOTIFICATIONS_QUICK_START.md",
        "Quick start guide"
    )
    all_checks_passed &= check_file_exists(
        "DEPLOYMENT_GUIDE_PUSH_NOTIFICATIONS.md",
        "Deployment guide"
    )
    all_checks_passed &= check_file_exists(
        "CampusTrace-Backend/INTEGRATION_EXAMPLES.py",
        "Integration examples"
    )
    print()
    
    # Summary
    print("=" * 60)
    if all_checks_passed:
        print("✅ ALL CHECKS PASSED!")
        print()
        print("🚀 Your push notification system is ready!")
        print()
        print("Next steps:")
        print("1. Run database migration in Supabase")
        print("2. Deploy backend (git push)")
        print("3. Build mobile app (eas build)")
        print("4. Test notifications")
        print()
        print("See PUSH_NOTIFICATIONS_QUICK_START.md for details")
        return 0
    else:
        print("❌ SOME CHECKS FAILED")
        print()
        print("Please review the errors above and fix them.")
        print("Then run this script again.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
