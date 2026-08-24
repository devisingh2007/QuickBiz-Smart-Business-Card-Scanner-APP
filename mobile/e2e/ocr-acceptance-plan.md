# Real-Device OCR Acceptance Test Plan

This document outlines the acceptance test protocol for verifying the on-device ML Kit OCR scanner on real iOS and Android physical hardware.

---

## 1. Test Environment Setup

To ensure consistent baseline results, conduct hardware tests under the following conditions:

- **Lighting:** Even ambient lighting (neutral white light, ~500 lux). Avoid direct overhead spotlights to prevent reflective glare on glossy business cards.
- **Background:** Place the business card on a dark, non-reflective flat surface (e.g., a dark wood desk or black paper) to provide high border contrast for edge detection.
- **Distance & Angle:** Hold the device parallel to the card surface at a distance of 15–20 cm (6–8 inches). Ensure the entire card is visible within the viewfinder box.
- **Stability:** Hold the device steady for at least 1 second before capturing. If possible, rest elbows on the table to minimize motion blur.

---

## 2. Test Execution Protocol

Repeat the following steps for each test card:

1. Open the QuickBiz app and navigate to the **Scan** tab.
2. Position the business card inside the dashed finder frame.
3. Tap the white shutter circle to capture.
4. Verify the captured image preview:
   - Check if the text is sharp and readable.
   - If blurry or out of focus, tap **Retake** and capture again.
5. Tap **Use Photo** to trigger the on-device Google ML Kit Text Recognition engine.
6. Verify the redirection to the **Review** screen:
   - Check the **Extraction Quality Score**.
   - Compare the parsed input fields (Name, Designation, Company, Phones, Emails, Website, Address) with the physical card.

---

## 3. Real-Card Verification Grid

Test against these 10 hardware card profiles and record details:

| Test Profile | Target Verification | Success Criteria | Passed (Y/N) |
| :--- | :--- | :--- | :--- |
| **01. High Contrast** | Matte finish, black text on white background | 100% field accuracy, score > 90% | |
| **02. Small Text** | Fine print font sizes (6pt–8pt) | Email/phone parsed without missing digits | |
| **03. Multiple Phones** | Mobile, Office, and Fax lines | All numbers parsed, types labeled correctly | |
| **04. Multiple Emails** | Work and personal emails on card | Both emails mapped cleanly to inputs | |
| **05. Long Address** | Multi-line address with ZIP code | Correct comma-separated concatenation | |
| **06. Logo-Heavy** | Large graphics / stylised branding text | Company name is not confused with logo text | |
| **07. Non-Standard Orientation** | Vertical/portrait layout card | Name, company, and title map correctly | |
| **08. Low Light / High Shadow** | Low-light camera capture conditions | Spaced domain typos auto-corrected | |
| **09. Distinct Typography** | Serif and sans-serif stylized fonts | Names and titles successfully extracted | |
| **10. Missing Fields** | Card with only Name + Email address | Unmapped fields remain empty; no fake data | |

---

## 4. Handheld Calibration & Troubleshooting

If field recognition fails, apply these troubleshooting corrections:

- **Reflective Glare:** Tilt the card slightly (~5 degrees) away from the overhead light source to redirect reflections off the lens.
- **Focus Failure:** Tap the center of the camera screen to trigger autofocus. Verify that the camera lens is clean.
- **Parser Typos:** Correct minor OCR anomalies directly on the Review screen (all fields are fully editable) before saving.
