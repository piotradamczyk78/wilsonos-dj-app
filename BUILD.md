# Build & Deployment Guide

Instrukcje budowania AAB i deployu do Google Play.

---

## Prerequisites

### 1. Environment Variables

Stwórz plik `.env` (skopiuj z `.env.example`):

```bash
cp .env.example .env
```

Wypełnij wartościami:
```
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=<twoj_spotify_client_id>
EXPO_PUBLIC_ANTHROPIC_API_KEY=<twoj_anthropic_key>
EXPO_PUBLIC_GEMINI_API_KEY=<twoj_gemini_key>
```

**WAŻNE:** Jeśli używasz Doppler, pomiń plik `.env` i skonfiguruj:
```bash
doppler setup
doppler secrets download --no-file --format env > .env
```

### 2. Google Play Console Setup

#### a) Stwórz aplikację:
- Nazwa: **WilsonOS DJ**
- Package name: `com.octadecimal.wilsonosdj` (musi być zgodne z `app.json`)

#### b) Dodaj In-App Products (Consumable):
- Product ID: `credits_starter_099` — Cena: $0.99 — Nazwa: "1000 Credits"
- Product ID: `credits_popular_499` — Cena: $4.99 — Nazwa: "5000 Credits"
- Product ID: `credits_power_999` — Cena: $9.99 — Nazwa: "10000 Credits"

#### c) Dodaj URLs:
- Privacy Policy: `https://octadecimal.pl/wilsonos-dj/privacy-policy.html`
- Terms of Service: `https://octadecimal.pl/wilsonos-dj/terms-of-service.html`

---

## Build Process

### Option 1: EAS Build (Recommended)

EAS (Expo Application Services) automatyzuje signing i build process.

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Login to Expo
```bash
eas login
```

#### 3. Configure EAS
```bash
eas build:configure
```

To create `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

Change `"buildType": "apk"` to `"buildType": "app-bundle"` for AAB.

#### 4. Build Production AAB
```bash
eas build --platform android --profile production
```

- Wybierz **app bundle (AAB)** (required by Google Play)
- EAS wygeneruje signing key automatycznie (lub użyj własnego)
- Build trwa ~10-15 minut
- Download AAB po zakończeniu

#### 5. Submit to Google Play
```bash
eas submit --platform android
```

Lub manualnie:
1. Google Play Console → Release → Production
2. Upload AAB
3. Fill release notes
4. Submit for review

---

### Option 2: Local Build (Advanced)

Wymaga Android Studio + Gradle setup.

```bash
# 1. Build locally
npx expo prebuild --platform android

# 2. Open in Android Studio
open android/

# 3. Build → Generate Signed Bundle / APK
# Follow wizard, create keystore

# 4. Upload AAB to Google Play Console manually
```

**UWAGA:** EAS Build jest prostszy i zalecany dla pierwszego release.

---

## Pre-Launch Checklist

Przed uplodem AAB do Google Play:

### Code
- [ ] All API keys in `.env` (nie hardcoded!)
- [ ] No `console.log` z wrażliwymi danymi
- [ ] `.gitignore` zawiera `.env` i `*.keystore`
- [ ] Test na prawdziwym urządzeniu Android

### Legal
- [ ] Privacy Policy online i dostępny
- [ ] Terms of Service online i dostępny
- [ ] URLs dodane w Google Play Console

### IAP
- [ ] Product IDs utworzone w Google Play Console
- [ ] Ceny ustawione (USD)
- [ ] Test purchase w sandbox mode

### Store Listing
- [ ] Opisy PL + EN
- [ ] Screenshots (6-8 sztuk)
- [ ] Feature graphic (1024x500px)
- [ ] Category: Music & Audio
- [ ] Content rating: PEGI 3

### Testing
- [ ] Spotify OAuth działa
- [ ] Chat z DJ-ami działa (wszystkie 4 persony)
- [ ] Model selector switching działa
- [ ] Credits deduction działa poprawnie
- [ ] Purchase credits działa (sandbox)
- [ ] Low credits warning pokazuje się

---

## Testing Workflow

### 1. Internal Testing Track
```bash
# Upload do internal testing
eas submit --platform android --track internal
```

- Dodaj testerów przez email
- Test wszystkich funkcji
- Fix critical bugs
- Repeat

### 2. Closed Testing (Beta)
- Rozszerz grupę testerów (~50-100 osób)
- Zbierz feedback
- Optymalizuj UX/UI

### 3. Production Release
- Submit final AAB
- Google review: 1-7 dni
- Po approval: app jest live! 🎉

---

## Post-Launch

### Monitoring
- Google Play Console → Vitals (crashes, ANRs)
- Reviews → Respond to users
- Analytics → Track installs, retention

### Updates
```bash
# Increment version in app.json
"version": "1.0.1"

# Build new AAB
eas build --platform android --profile production --auto-submit
```

---

## Troubleshooting

### Build fails with "AAPT error"
```bash
# Clean cache
npx expo prebuild --clean
npm install
```

### IAP not working
- Check product IDs match exactly
- Ensure app is published (at least in internal testing)
- Test with real Google account (not test account)

### Spotify OAuth redirect fails
- Check `app.json` → `scheme: "wilsonos-dj"`
- Spotify Developer Dashboard → Add redirect URI: `wilsonos-dj://`

---

## Quick Commands Summary

```bash
# Development
npm install
npx expo start --android

# Production Build (EAS)
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android

# Check build status
eas build:list
```

---

## Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [React Native IAP Docs](https://github.com/dooboolab/react-native-iap)
- [Spotify OAuth Docs](https://developer.spotify.com/documentation/general/guides/authorization/)

---

## Support

Problemy z buildem? Napisz:
- **Email:** dev@octadecimal.pl
- **GitHub Issues:** (dodaj link do repo)
