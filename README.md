# WilsonOS DJ

**Platforma muzyczno-psychologiczna z AI DJ-ami** — analizuje Twoje playlisty Spotify przez pryzmat psychologii i neurobiologii, rekomenduje muzykę dopasowaną do nastroju i prowadzi terapeutyczne rozmowy o muzyce.

**Strona projektu:** [octadecimal.pl/projects/wilsonos-dj](https://octadecimal.pl/projects/wilsonos-dj)
**Organizacja:** [github.com/octadecimal-ai](https://github.com/octadecimal-ai)

---

## Stack techniczny

| Warstwa | Technologia |
|---------|-------------|
| Framework | React Native 0.81 + Expo 54 |
| Routing | Expo Router (typed routes) |
| Język | TypeScript 5.9 |
| AI | Claude Sonnet 4.5 (Anthropic API) |
| Muzyka | Spotify Web API + OAuth 2.0 PKCE |
| Audio | expo-audio (odtwarzanie lokalne) |
| Storage | expo-file-system, expo-secure-store |
| Platformy | Android, iOS, Web |

---

## Zaimplementowane funkcjonalności

### 1. Autentykacja Spotify (OAuth 2.0 + PKCE)

- Logowanie przez Spotify z pełnym flow PKCE
- Automatyczny refresh tokenu (5 min przed wygasnieciem)
- Bezpieczne przechowywanie tokenow w expo-secure-store
- Profil uzytkownika (nazwa, email, avatar, typ konta)
- Uprawnienia: odczyt playlist, sterowanie odtwarzaniem, ostatnio sluchane, tworzenie playlist

### 2. Cztery AI DJ persony

Kazdy DJ analizuje muzyke z innej perspektywy psychologicznej:

| DJ | Perspektywa | Status |
|----|-------------|--------|
| DJ Neuro | Neurobiologia: dopamina, serotonina, system nagrody, neuroplastycznosc | Darmowy |
| DJ Freud | Psychoanaliza: id/ego/superego, sublimacja, mechanizmy obronne | Premium |
| DJ Jung | Psychologia analityczna: archetypy, cien, anima/animus, indywiduacja | Premium |
| DJ Filozof | Filozofia: egzystencjalizm, fenomenologia, estetyka | Premium |

Kazdy DJ ma:
- Unikalny system prompt i styl komunikacji
- Spersonalizowane powitanie
- Wlasna kolorystyka UI
- Perspektywe psychologiczna wplywajaca na rekomendacje

### 3. Czat z DJ-em

- Pelny interfejs czatowy z DJ-em AI
- Kontekst Spotify ladowany automatycznie (playlisty + ostatnio sluchane)
- Auto-save sesji po kazdej wiadomosci
- Historia rozmow z mozliwoscia powrotu do starych sesji
- Wykrywanie sugestii muzycznych w odpowiedziach DJ-a (regex pattern matching)
- Automatyczne generowanie tytulu sesji z pierwszej wiadomosci

### 4. Rekomendacje muzyczne i odtwarzanie

DJ sugeruje konkretne utwory w formacie **"Artysta - Tytuł"**. Pod kazda sugestia pojawiaja sie przyciski:

- **Spotify** — wyszukuje i odtwarza przez Spotify Connect API (bez przechodzenia do apki Spotify)
- **YouTube Music** — otwiera wyszukiwanie w YouTube Music
- **Odtwarz caly set** — puszcza wszystkie sugestie DJ-a naraz
- **Stworz playliste** — DJ moze zaproponowac playliste komenda `[PLAYLIST:nazwa]`, a user jednym kliknieciem tworzy ja na Spotify

### 5. Analiza playlist

- Lista wszystkich playlist uzytkownika ze Spotify
- Szczegolowa analiza kazdej playlisty:
  - Liczba utworow, unikalnych artystow, laczny czas
  - Srednia popularnosc i rozklad (niszowe/srednie/popularne)
  - Procent explicit content
  - Top gatunki, top artysci, rozklad dekad
- Komentarz AI z perspektywy wybranego DJ-a (3-5 akapitow)
- Mozliwosc przelaczania DJ-ow i regeneracji komentarza

### 6. Wyszukiwanie internetowe

- DJ ma dostep do wyszukiwarki (Claude web_search tool, max 3 zapytania na odpowiedz)
- Sprawdza informacje o artystach, albumach, aktualnych listach przebojow
- Eliminuje "halucynacje" — weryfikuje fakty zamiast zgadywac

### 7. Odtwarzanie lokalnych plikow audio

- Przycisk nuty w polu czatu otwiera natywny document picker Android
- Obslugiwane formaty: MP3, WAV, OGG, FLAC, AAC, MP4
- Picker pokazuje pliki lokalne + Google Drive + OneDrive (wszystkie zrodla Android)
- Mini player nad polem tekstowym: play/pause, nazwa, pasek postepu, zamknij
- Automatyczna wiadomosc w czacie "Slucham teraz: nazwa.mp3"
- DJ komentuje wybor z perspektywy psychologicznej

### 8. Logowanie rozmow

- Logi JSONL na urzadzeniu (`/chat-logs/YYYY-MM-DD_personaId.jsonl`)
- Kazda wiadomosc logowana do konsoli Metro (widoczna dla dewelopera)
- Baza wiedzy DJ (`dj-knowledge.md`) — dodatkowy kontekst utrwalany miedzy sesjami

### 9. Ekran profilu

- Avatar i dane ze Spotify (nazwa, email, typ konta)
- Status polaczenia ze Spotify
- Statystyki uzytkowania (placeholder)
- Ustawienia (placeholder)
- Karta Premium z CTA do upgradu

### 10. Nawigacja i UI

- 4 glowne zakladki: Home, Analiza, Sesja, Profil
- Dark theme (#0a0a0a tlo)
- Kolory specyficzne dla kazdego DJ-a
- SafeArea i KeyboardAvoidingView
- Edge-to-edge na Androidzie

---

## Funkcjonalnosci do zrobienia

### Wysoki priorytet

- [ ] **Premium paywall** — architektura istnieje (3 DJ-e oznaczone `isPremium`), brak implementacji platnosci (Google Play Billing / App Store)
- [ ] **Pelna integracja YouTube Music** — obecnie deep link do wyszukiwania, docelowo natywne odtwarzanie
- [ ] **Szczegoly playlist w analizie** — DJ widzi nazwy playlist, ale nie pelne listy utworow w srodku; dodac audio features (BPM, valence, energy, danceability) do kontekstu
- [ ] **Historia sesji miedzy DJ-ami** — DJ nie pamicta rozmow z poprzednich sesji; rozwazyc wspolna pamiec

### Sredni priorytet

- [ ] **Muzyczne DNA** — generowanie "osobowosci muzycznej" na podstawie calej biblioteki Spotify (placeholder w profilu)
- [ ] **Statystyki uzytkowania** — zliczanie analiz, sesji, czasu rozmow (placeholder w profilu)
- [ ] **Notyfikacje** — np. "DJ Neuro ma dla Ciebie nowa rekomendacje" (placeholder w ustawieniach)
- [ ] **Ekran 'O aplikacji'** — opis, licencje, linki (placeholder)
- [ ] **Lock screen controls** — kontrolki odtwarzania na ekranie blokady (expo-audio wspiera `setActiveForLockScreen`)
- [ ] **Background audio** — odtwarzanie w tle po wyjsciu z aplikacji

### Niski priorytet

- [ ] **Wiele jezykow** — obecnie tylko po polsku
- [ ] **Tryb jasny** — tylko dark theme
- [ ] **Eksport rozmow** — udostepnianie fragmentow rozmowy z DJ-em
- [ ] **Spolecznosc** — dzielenie sie analizami i playlistami z innymi uzytkownikami
- [ ] **Integracja z innymi serwisami** — Apple Music, Tidal, Deezer
- [ ] **Pamiec dlugookresowa DJ-a** — DJ pamicta preferencje uzytkownika miedzy sesjami (np. "lubisz prog rock lat 70.")
- [ ] **Widget Android** — szybki dostep do DJ-a z ekranu glownego

---

## Struktura projektu

```
wilsonos-dj-app/
├── app/                          # Ekrany (Expo Router)
│   ├── (tabs)/                   # Glowne zakladki
│   │   ├── index.tsx             # Home — hero + grid DJ-ow
│   │   ├── analysis.tsx          # Lista playlist do analizy
│   │   ├── session.tsx           # Wybor DJ-a + historia rozmow
│   │   └── profile.tsx           # Profil Spotify + ustawienia
│   ├── analysis/
│   │   └── [id].tsx              # Analiza konkretnej playlisty
│   ├── auth/
│   │   └── spotify-login.tsx     # Ekran logowania Spotify
│   └── session/
│       └── [personaId].tsx       # Czat z wybranym DJ-em
├── components/                   # Wspolne komponenty
├── constants/
│   ├── Colors.ts                 # Kolory (dark theme + per-persona)
│   └── DJPersonas.ts             # Definicje 4 DJ-ow
├── contexts/
│   └── AuthContext.tsx            # Kontekst autentykacji Spotify
├── services/
│   ├── auth.ts                   # Token management (Secure Store)
│   ├── audioPlayer.ts            # Singleton audio player (expo-audio)
│   ├── chatHistory.ts            # Zapis/odczyt sesji czatu
│   ├── claude.ts                 # Anthropic API + system prompty DJ-ow
│   ├── filePicker.ts             # Document picker (lokalne pliki audio)
│   └── spotify.ts                # Spotify Web API (playlisty, playback, search)
├── prompts/                      # Dodatkowe prompty
├── assets/                       # Ikony, splash screen
├── app.json                      # Konfiguracja Expo
├── package.json                  # Zaleznosci
└── tsconfig.json                 # TypeScript config
```

---

## Uruchomienie

```bash
# Zainstaluj zaleznosci
npm install

# Ustaw zmienne srodowiskowe (.env)
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=twoj_client_id
EXPO_PUBLIC_ANTHROPIC_API_KEY=twoj_api_key

# Uruchom Metro bundler
npx expo start

# Lub bezposrednio na Androidzie
npx expo start --android
```

---

## Licencja

Copyright 2025 [octadecimal.pl](https://octadecimal.pl)
