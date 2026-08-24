# QUICKBIZ BASELINE
**Phase 0 — Pre-modification snapshot**
**Date:** 2026-08-24 09:38 IST
**Recorded by:** Antigravity (read-only — nothing was modified)

---

## 1. Current Architecture Confirmed

### Mobile
| Concern | Technology | Version |
|---------|-----------|---------|
| Runtime | Expo SDK | ~54.0.36 |
| Framework | React Native | 0.81.5 |
| React | React | 19.1.0 |
| Navigation | Expo Router | ~6.0.24 |
| OCR Engine | expo-mlkit-ocr (Google ML Kit v2) | ^0.2.7 |
| Camera | expo-camera (CameraView API) | ~17.0.10 |
| Native Contacts | expo-contacts | ~15.0.11 |
| Clipboard | expo-clipboard | ~8.0.8 |
| Local Storage | @react-native-async-storage/async-storage | 2.2.0 |
| Icons | @expo/vector-icons (MaterialIcons) + expo-symbols (iOS SF Symbols) | ^15.0.3 / ~1.0.8 |
| Haptics | expo-haptics | ~15.0.8 |
| Animations | react-native-reanimated | ~4.1.1 |
| Architecture | React Native New Architecture | enabled (newArchEnabled: true) |
| React Compiler | Enabled | experiments.reactCompiler: true |

### Backend
| Concern | Technology | Version |
|---------|-----------|---------|
| Server | Express | ^5.2.1 |
| Language | TypeScript (ts-node) | — |
| Authentication | JSON Web Token (jsonwebtoken) | ^9.0.3 |
| Password hashing | bcryptjs | ^3.0.3 |
| Database ORM | Mongoose | ^9.9.3 |
| Database | MongoDB (Atlas or local 127.0.0.1:27017) | — |
| Environment | dotenv | ^17.4.2 |
| CORS | cors | ^2.8.6 |
| Dev server | nodemon | — |

---

## 2. Git Status

```
Branch:   master
Tracking: origin/main
Status:   19 commits AHEAD of origin/main (unpushed)

Modified (not staged):
  mobile/app.json
  mobile/app/(tabs)/scan.tsx
  mobile/package-lock.json
  mobile/package.json
  mobile/services/api.service.ts
  mobile/services/ocr.service.ts
  server/.env.example
  server/package-lock.json
  server/package.json
  server/src/app.ts

Deleted (not staged):
  server/src/controllers/ocr.controller.ts  (Cloud Vision era — intentional)
  server/src/routes/ocr.routes.ts           (Cloud Vision era — intentional)
```

Note: The deleted files are from the previous Google Cloud Vision OCR implementation.
The current OCR is entirely on-device via expo-mlkit-ocr. No server-side OCR route exists.

---

## 3. TypeScript Status

### Mobile — npx tsc --noEmit
```
Result:  PASS
Errors:  0
Exit:    0
```

### Server — npx tsc --noEmit
```
Result:  PASS
Errors:  0
Exit:    0
```

---

## 4. Expo Doctor Status

```
Command:  npx expo-doctor
Checks:   18 / 18 passed
Issues:   None detected
Result:   PASS
```

---

## 5. Lint Status

### npm run lint (expo lint -> ESLint with eslint-config-expo)

```
Result:   PASS (exit code 0 — warnings only, no errors)
Errors:   0
Warnings: 8
```

### Warning Detail

| File | Line | Warning | Rule |
|------|------|---------|------|
| app/contact-details.tsx | 2:94 | 'Platform' is defined but never used | @typescript-eslint/no-unused-vars |
| app/contact-details.tsx | 40:16 | 'e' is defined but never used | @typescript-eslint/no-unused-vars |
| app/contact-details.tsx | 53:16 | 'e' is defined but never used | @typescript-eslint/no-unused-vars |
| app/contact-details.tsx | 66:16 | 'e' is defined but never used | @typescript-eslint/no-unused-vars |
| app/review.tsx | 32:16 | 'e' is defined but never used | @typescript-eslint/no-unused-vars |
| app/review.tsx | 45:16 | 'e' is defined but never used | @typescript-eslint/no-unused-vars |
| app/review.tsx | 58:16 | 'e' is defined but never used | @typescript-eslint/no-unused-vars |
| utils/parser.ts | 73:7 | 'website' is assigned a value but never used | @typescript-eslint/no-unused-vars |

Note: The 8th warning (utils/parser.ts) is inside the confirmed-dead parser file.
All 7 'e' warnings are unused event parameters in gesture handlers.
'Platform' is imported but not consumed in contact-details.tsx.

---

## 6. Build Status

Native builds (EAS / expo run:android / expo run:ios) were NOT run in Phase 0.

| Check | Status |
|-------|--------|
| Mobile TypeScript compile | PASS — 0 errors |
| Server TypeScript compile | PASS — 0 errors |
| Expo SDK doctor | PASS — 18/18 checks |
| ESLint | PASS — 0 errors, 8 warnings (exit 0) |
| Native iOS build | Not run |
| Native Android build | Not run |
| Server npm run build (tsc) | Not run (--noEmit passed cleanly) |

---

## 7. Current OCR Provider

```
Provider:     Google ML Kit Text Recognition v2 (on-device, no cloud)
Package:      expo-mlkit-ocr ^0.2.7
Entry point:  mobile/services/ocr.service.ts
Function:     recognizeText(imageUri)  [from expo-mlkit-ocr]
iOS engine:   "auto"  (configured in mobile/app.json plugins)
Platform:     Android + iOS only
              Web: throws OCR_NOT_SUPPORTED_ON_WEB

Previous provider: Google Cloud Vision API (server-side)
  Removed: server/src/controllers/ocr.controller.ts (deleted from disk)
  Removed: server/src/routes/ocr.routes.ts (deleted from disk)
  No GOOGLE_APPLICATION_CREDENTIALS env var required or used.
```

---

## 8. Current Backend

```
Framework:    Express ^5.2.1
Language:     TypeScript (ts-node in dev, tsc in prod)
Entry:        server/src/server.ts
App:          server/src/app.ts
Port:         process.env.PORT || 5000
CORS:         app.use(cors()) — fully open, no origin restriction
Body limit:   10mb (JSON + urlencoded)

Routes:
  POST   /api/auth/register              (public)
  POST   /api/auth/login                 (public)
  GET    /api/contacts                   (JWT required)
  POST   /api/contacts                   (JWT required)
  GET    /api/contacts/:id               (JWT required) — ORPHANED, never called from mobile
  PATCH  /api/contacts/:id               (JWT required)
  DELETE /api/contacts/:id               (JWT required)

Scripts:
  npm run dev    -> nodemon src/server.ts
  npm run build  -> tsc
  npm start      -> node dist/server.js
  npm test       -> "Error: no test specified" (not configured)
```

---

## 9. Current Database

```
Engine:      MongoDB
ODM:         Mongoose ^9.9.3
Connection:  process.env.MONGODB_URI
Default:     mongodb://127.0.0.1:27017/quickbiz
Fallback:    Local MongoDB at 127.0.0.1:27017/quickbiz if primary fails

Collections:
  users:    { name, email, password(bcrypt), createdAt, updatedAt }
  contacts: { userId(ref:User), name, phones[], emails[], company,
              designation, officeAddress, websites[], category,
              nativeContactId, syncStatus, source, createdAt, updatedAt }

Existing indexes on contacts:
  { userId: 1 }
  { emails.value: 1 }
  { phones.value: 1 }
  { name: text, company: text, designation: text, emails.value: text }

Missing index (not yet created):
  { userId: 1, createdAt: -1 }  <- most common query pattern
```

---

## 10. Current Authentication

```
Mechanism:   JSON Web Token (JWT)
Library:     jsonwebtoken ^9.0.3
Secret:      process.env.JWT_SECRET
Fallback:    'quickbiz_jwt_secret_key_2026_dev'  <- SECURITY ISSUE
Expiry:      30 days
Refresh:     NOT IMPLEMENTED
Storage:     AsyncStorage '@quickbiz_auth_session'  (NOT expo-secure-store)
Hashing:     bcryptjs, salt rounds = 10

Auth flow:
  register  -> bcrypt.hash -> User.create -> jwt.sign -> { token, user }
  login     -> User.findOne -> bcrypt.compare -> jwt.sign -> { token, user }
  protected -> authMiddleware -> jwt.verify -> req.userId -> handler

Session restore on app start:
  _layout.tsx -> apiService.restoreSession()
              -> AsyncStorage.getItem('@quickbiz_auth_session')
              -> parses { token, user } -> sets in-memory state
```

---

## 11. Known Warnings (Pre-existing — NOT Fixed in Phase 0)

| # | Location | Warning | Category |
|---|----------|---------|----------|
| W1 | app/contact-details.tsx:2 | Platform imported but never used | Lint |
| W2 | app/contact-details.tsx:40,53,66 | e parameter unused (3x) | Lint |
| W3 | app/review.tsx:32,45,58 | e parameter unused (3x) | Lint |
| W4 | utils/parser.ts:73 | website variable assigned but never used | Lint |
| W5 | auth.middleware.ts | Log prefix [OCR AUTH] is wrong context | Code smell |
| W6 | permissions/index.tsx | Grant buttons set local bool only — no real native API | Logic |
| W7 | settings.tsx | Profile hardcoded as "Devisingh Rajput" / "devisingh@example.com" | Logic |
| W8 | settings.tsx | Sync status hardcoded "Connected" | Logic |
| W9 | icon-symbol.tsx | minus.circle.fill missing from MAPPING | Active Bug |
| W10 | icon-symbol.tsx | arrow.up.right.square missing from MAPPING (if used) | Active Bug |
| W11 | index.tsx | Always redirects to /onboarding — no seen-flag | Logic |
| W12 | contact.store.ts:203 | handleLoginSync dedup uses c.email (legacy field) | Logic |
| W13 | contact.model.ts | Missing extractionQualityScore field | Data |
| W14 | server/src/app.ts | CORS fully open — no origin restriction | Security |
| W15 | auth.controller.ts + auth.middleware.ts | Hardcoded JWT secret fallback | Security |
| W16 | contact.model.ts | Missing compound index { userId:1, createdAt:-1 } | Performance |
| W17 | utils/parser.ts | Entire file is dead code (zero imports anywhere) | Dead Code |
| W18 | app/modal.tsx | Registered route, never navigated to | Dead Code |

---

## 12. Known Runtime Errors (Pre-existing — NOT Fixed in Phase 0)

No TypeScript errors. No ESLint errors. No expo-doctor errors.
The following are runtime/logic errors not caught by static analysis:

| # | Location | Error | Trigger |
|---|----------|-------|---------|
| E1 | icon-symbol.tsx | minus.circle.fill renders blank on Android/web | Tapping Remove buttons in review.tsx on Android |
| E2 | contact.store.ts:handleLoginSync | Duplicates created on login (dedup checks wrong field) | Login after offline contact save |
| E3 | api.service.ts | Expired JWT causes silent 401 — no re-auth prompt | 30 days after login |
| E4 | permissions/index.tsx | System permission may not be granted despite UI showing granted | First scan/save on fresh install |

---

## 13. Unstaged Git Deletions

Files deleted from disk but not yet staged in git:
  server/src/controllers/ocr.controller.ts  — Cloud Vision OCR (intentional removal)
  server/src/routes/ocr.routes.ts           — Cloud Vision OCR (intentional removal)

---

## 14. npm Scripts

### Mobile (mobile/)
  start           -> expo start
  android         -> expo start --android
  ios             -> expo start --ios
  web             -> expo start --web
  lint            -> expo lint
  reset-project   -> node ./scripts/reset-project.js

### Server (server/)
  dev             -> nodemon src/server.ts
  build           -> tsc
  start           -> node dist/server.js
  test            -> "Error: no test specified" (NOT CONFIGURED)

---

## 15. Baseline Scorecard

| Dimension | Status | Detail |
|-----------|--------|--------|
| TypeScript (mobile) | PASS | 0 errors |
| TypeScript (server) | PASS | 0 errors |
| Expo Doctor | PASS | 18/18 checks |
| ESLint | PASS | 0 errors, 8 warnings, exit 0 |
| Git branch | master | 19 commits ahead of origin/main |
| Git working tree | Dirty | 10 modified, 2 deleted (unstaged) |
| Native build (Android) | Unknown | Not run in Phase 0 |
| Native build (iOS) | Unknown | Not run in Phase 0 |
| Automated tests | NONE | No test framework configured |
| Active runtime bugs | 4 | See Section 12 |
| Dead code files | 2 confirmed | utils/parser.ts, app/modal.tsx |
| Unused image assets | 4 files | react-logo*.png, partial-react-logo.png |
| Security concerns | 5 active | JWT fallback, open CORS, AsyncStorage, no rate limit |

---

PHASE 0 COMPLETE. Nothing was modified.
Proceed to Phase 1 only on explicit user instruction.
