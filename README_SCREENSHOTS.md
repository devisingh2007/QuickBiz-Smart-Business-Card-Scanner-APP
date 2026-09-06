# QuickBiz — App Screenshots Guide

This document outlines the visual showcase layout and instructions for capturing high-resolution screenshots of the QuickBiz mobile application.

---

## Screenshot Inventory & Dimensions

For best visual presentation on GitHub, capture screenshots on a standard 1080x2400 (or equivalent 19.5:9 ratio) Android or iOS device in portrait mode.

Place captured image files in `mobile/assets/screenshots/` (or `docs/screenshots/`) using the filenames listed below:

| # | Screen / State | Target Filename | Description |
|---|---|---|---|
| 1 | **Sign In / Auth** | `01_auth_signin.png` | Clean login screen with email, password fields, and brand icon. |
| 2 | **Sign Up / Registration** | `02_auth_signup.png` | Account creation screen with name, email, and password validation. |
| 3 | **Home Dashboard** | `03_home_dashboard.png` | Overview screen with stats cards, quick scan button, and recent contacts. |
| 4 | **Camera Scanner** | `04_camera_scanner.png` | Live camera view with card alignment guide and torch toggle. |
| 5 | **Captured Card Preview** | `05_capture_preview.png` | Photo preview state with "Use Photo" and "Retake" actions. |
| 6 | **OCR Processing** | `06_ocr_processing.png` | Loading indicator during on-device ML Kit text extraction. |
| 7 | **Review & Edit** | `07_contact_review.png` | Extracted fields review, extraction quality score badge (0-100%), and edit inputs. |
| 8 | **Duplicate Warning Modal**| `08_duplicate_warning.png` | 409 Conflict prompt with "Overwrite" or "Cancel" options. |
| 9 | **Contacts List** | `09_contacts_list.png` | Full contacts list with avatar initials, company tags, and sync status badges. |
| 10 | **Category Filter** | `10_category_filter.png` | Contacts filtered by category (e.g. Developer, Client, Investor). |
| 11 | **Live Search** | `11_search_results.png` | Search bar query filtering contacts by name, company, or designation. |
| 12 | **Contact Details Profile**| `12_contact_details.png` | Contact details with quick call, email, copy, and address actions. |
| 13 | **Save to Native Phone** | `13_native_save.png` | Native address book sync indicator. |
| 14 | **Settings & Profile** | `14_settings.png` | User info, API status indicator, sync actions, and cache clearing. |
| 15 | **Delete Account Modal** | `15_delete_account.png` | Safe account deletion confirmation dialog. |

---

## How to Capture Screenshots

### Option A: Via Android Studio Emulator
1. Launch Android Emulator with your development build: `npm --prefix mobile run android`
2. Open the desired screen.
3. Click the **Camera Icon** (Screen Capture) in the emulator toolbar.
4. Save the screenshot to `mobile/assets/screenshots/<filename>.png`.

### Option B: Via Real Android / iOS Device
1. Run the app on your physical device.
2. Use physical hardware buttons to capture screenshots (Power + Volume Down on Android, Side + Volume Up on iOS).
3. Transfer screenshots to your project directory.
