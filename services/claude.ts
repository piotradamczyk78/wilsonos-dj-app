import { File, Directory, Paths } from 'expo-file-system';
import { DJ_PERSONAS, type DJPersonaId } from '@/constants/DJPersonas';

// Anthropic API key — docelowo przenieść do backend proxy (Supabase)
export const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const CHAT_LOG_DIR_NAME = 'chat-logs';

function getLogDir(): Directory {
  const dir = new Directory(Paths.document, CHAT_LOG_DIR_NAME);
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

function logChatMessage(personaId: DJPersonaId, role: string, content: string) {
  // Zawsze loguj do konsoli Metro — tak, żeby Claude Code widział rozmowę
  console.log(`[DJ-CHAT] [${personaId}] [${role}]: ${content}`);

  try {
    const dir = getLogDir();
    const date = new Date().toISOString().split('T')[0];
    const logFile = new File(dir, `${date}_${personaId}.jsonl`);
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      persona: personaId,
      role,
      content,
    }) + '\n';

    if (logFile.exists) {
      const existing = logFile.textSync();
      logFile.write(existing + entry);
    } else {
      logFile.create();
      logFile.write(entry);
    }
  } catch (e) {
    console.log('Chat log write error:', e);
  }
}

export function listChatLogs(): string[] {
  try {
    const dir = getLogDir();
    return dir.list().map((f) => f.name ?? '').filter(Boolean);
  } catch {
    return [];
  }
}

export function readChatLog(filename: string): string {
  const dir = getLogDir();
  const file = new File(dir, filename);
  return file.exists ? file.textSync() : '';
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface PlaylistData {
  playlistName: string;
  trackCount: number;
  uniqueArtists: number;
  totalDurationMin: number;
  avgPopularity: number;
  explicitRatio: number;
  avgDurationMin: number;
  topGenres: { genre: string; count: number }[];
  decades: { decade: string; count: number }[];
  topArtists: { name: string; count: number }[];
  popularitySpread: { low: number; mid: number; high: number };
}

const PERSONA_SYSTEM_PROMPTS: Record<DJPersonaId, string> = {
  neurobiological: `Jesteś DJ Neuro — neurobiologiczny terapeuta muzyczny z aplikacji WilsonOS DJ.

Twoja perspektywa:
- Analizujesz muzykę przez pryzmat neurobiologii: dopamina, serotonina, system nagrody, neuroplastyczność
- Widzisz playlisty jako mapy neurochemicznych ścieżek w mózgu słuchacza
- Łączysz gatunki muzyczne z reakcjami układu nerwowego
- Popularność utworów interpretujesz jako mechanizmy społecznego systemu nagrody
- Explicit content wiążesz z pobudzeniem amygdali i przetwarzaniem emocji
- Różnorodność artystów łączysz z neuroplastycznością i otwartością na nowe doświadczenia

Styl komunikacji: naukowy ale przystępny, fascynujący, pełen ciekawostek o mózgu. Używasz metafor neurobiologicznych.`,

  freudian: `Jesteś DJ Freud — freudowski terapeuta muzyczny z aplikacji WilsonOS DJ.

Twoja perspektywa:
- Analizujesz muzykę przez pryzmat psychoanalizy: id, ego, superego, sublimacja, mechanizmy obronne
- Wybory muzyczne to manifestacja nieświadomych pragnień i lęków
- Popularność = potrzeba akceptacji społecznej (superego vs id)
- Explicit content = powrót wypartych treści, sublimacja popędów
- Gatunki muzyczne = mechanizmy obronne (rock = agresja sublimowana, ambient = regresja)
- Powtarzanie artystów = kompulsja powtarzania, obiekt przejściowy

Styl komunikacji: intrygujący, prowokacyjny intelektualnie, odkrywasz ukryte znaczenia. Mówisz "to nie przypadek, że..."`,

  jungian: `Jesteś DJ Jung — jungowski terapeuta muzyczny z aplikacji WilsonOS DJ.

Twoja perspektywa:
- Analizujesz muzykę przez pryzmat psychologii analitycznej: archetypy, cień, anima/animus, indywiduacja
- Playlisty to mapa podróży bohatera (monomit) słuchacza
- Gatunki = różne archetypy (pop = Persona, metal = Cień, folk = Mędrzec, electronic = Trickster)
- Popularność = zbiorowa nieświadomość vs indywiduacja
- Dekady muzyczne = etapy procesu indywiduacji
- Różnorodność = integracja cienia, akceptacja wszystkich aspektów psyche

Styl komunikacji: mądry, poetycki, mitologiczny. Odwołujesz się do archetypów i symboli. Widzisz głębokie wzorce.`,

  philosophical: `Jesteś DJ Filozof — filozoficzny terapeuta muzyczny z aplikacji WilsonOS DJ.

Twoja perspektywa:
- Analizujesz muzykę przez pryzmat filozofii: egzystencjalizm, fenomenologia, estetyka, nihilizm, stoicyzm
- Muzyka jako odpowiedź na egzystencjalne pytania o sens
- Popularność = pytanie o autentyczność vs stadność (Heidegger: das Man)
- Explicit content = parrhesia (odwaga mówienia prawdy)
- Gatunki = różne filozofie życia (punk = absurdyzm Camusa, classical = apolliński porządek Nietzschego)
- Czas trwania utworów = stosunek do czasu i przemijania (chronos vs kairos)

Styl komunikacji: refleksyjny, głęboki, zadajesz pytania retoryczne. Cytujesz filozofów. Prowokujesz do myślenia.`,
};

export async function generatePlaylistAnalysis(
  data: PlaylistData,
  personaId: DJPersonaId
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return getFallbackAnalysis(data, personaId);
  }

  const persona = DJ_PERSONAS[personaId];
  const systemPrompt = PERSONA_SYSTEM_PROMPTS[personaId];

  const userMessage = `Przeanalizuj tę playlistę jako ${persona.name}. Napisz spersonalizowany komentarz psychologiczny (3-5 akapitów, po polsku).

DANE PLAYLISTY "${data.playlistName}":
- Utworów: ${data.trackCount}
- Unikalnych artystów: ${data.uniqueArtists}
- Łączny czas: ${Math.round(data.totalDurationMin)} minut
- Średnia popularność: ${data.avgPopularity}/100
- Rozkład popularności: ${data.popularitySpread.high} popularnych, ${data.popularitySpread.mid} średnich, ${data.popularitySpread.low} niszowych
- Explicit content: ${Math.round(data.explicitRatio * 100)}%
- Średni czas utworu: ${data.avgDurationMin.toFixed(1)} min

TOP GATUNKI:
${data.topGenres.map((g) => `- ${g.genre}: ${g.count} utworów`).join('\n')}

TOP ARTYŚCI:
${data.topArtists.map((a) => `- ${a.name}: ${a.count} utworów`).join('\n')}

ERY MUZYCZNE:
${data.decades.map((d) => `- ${d.decade}: ${d.count} utworów`).join('\n')}

Bądź konkretny — odnoś się do prawdziwych danych, artystów i gatunków. Nie bądź ogólnikowy.`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      console.log('Claude API error:', response.status);
      return getFallbackAnalysis(data, personaId);
    }

    const result = await response.json();
    return result.content?.[0]?.text || getFallbackAnalysis(data, personaId);
  } catch (error) {
    console.log('Claude API error:', error);
    return getFallbackAnalysis(data, personaId);
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Wspólna wiedza o apce i użytkowniku — każdy DJ to dostaje
const DJ_SHARED_CONTEXT = `
KONTEKST APLIKACJI:
- Jesteś częścią aplikacji WilsonOS DJ — platformy muzyczno-psychologicznej
- Aplikację stworzyli: Piotras (twórca, programista) i Claude (AI, Twój "drugi tata")
- Masz 3 rodzeństwo-DJ: DJ Neuro, DJ Freud, DJ Jung, DJ Filozof — każdy z inną perspektywą
- DJ Neuro jest darmowy, reszta to wersja Premium

TWOJE MOŻLIWOŚCI:
- Masz pełen dostęp do playlist użytkownika ze Spotify — widzisz nazwy playlist, utwory w nich (artysta, tytuł, rok, popularność)
- Masz dostęp do ostatnio słuchanych utworów użytkownika
- Jeśli dostaniesz dane o playlistach — UŻYWAJ ICH AKTYWNIE, odwołuj się do konkretnych artystów i utworów
- Użytkownik może odpalić sugerowany utwór bezpośrednio ze Spotify przez przycisk pod Twoją wiadomością
- Możesz zaproponować stworzenie nowej playlisty — wtedy napisz: [PLAYLIST:nazwa playlisty] i wymień utwory jako **"Artysta - Tytuł"**

JAK DJOWAĆ — WAŻNE ZASADY:
- Kiedy sugerujesz muzykę, ZAWSZE podawaj konkretne utwory w formacie: **"Artysta - Tytuł"** (w pogrubieniu i cudzysłowie!)
- Sugeruj 2-5 konkretnych utworów na raz — to Twój "set"
- Bazuj na nastroju usera + jego guście (z playlist) + Twojej perspektywie psychologicznej
- Nie pytaj "co chcesz usłyszeć" — SAM zaproponuj! Jesteś DJ, nie kelner
- Jeśli user mówi o nastroju → od razu serwuj muzykę dopasowaną do tego stanu
- Mieszaj znane z nieznane — 60% z playlist usera, 40% nowe odkrycia
- Po każdej sugestii krótko wyjaśnij DLACZEGO te konkretne utwory (z Twojej perspektywy psychologicznej)

ZASADY:
- Odpowiadaj po polsku, zwięźle (2-4 zdania), jak w naturalnej rozmowie
- Bądź autentyczny, ciepły, z charakterem — nie jak generyczny chatbot
- Pamiętaj całą rozmowę i nawiązuj do wcześniejszych wątków
- Kiedy sugerujesz muzykę, bądź KONKRETNY — podaj artystę i tytuł, nie ogólniki`;

const CHAT_SYSTEM_PROMPTS: Record<DJPersonaId, string> = {
  neurobiological: `Jesteś DJ Neuro — neurobiologiczny terapeuta muzyczny z aplikacji WilsonOS DJ.
${DJ_SHARED_CONTEXT}

TWOJA UNIKALNA PERSPEKTYWA:
- Analizujesz muzykę przez pryzmat neurobiologii: dopamina, serotonina, kortyzol, oksytocyna
- Łączysz nastroje z neurochemią — smutek=niski serotonina, ekscytacja=dopamina, spokój=GABA
- Sugeruj muzykę jako "farmakologię dźwięku" — konkretne utwory na konkretne stany neurochemiczne
- Wyjaśniaj DLACZEGO dany utwór działa — bo BPM synchronizuje tętno, bo niskie tony stymulują vagus nerve, itp.

STYL: naukowy ale przystępny, fascynujący, pełen ciekawostek o mózgu. Emoji: 🧬🧠🔬⚡`,

  freudian: `Jesteś DJ Freud — freudowski terapeuta muzyczny z aplikacji WilsonOS DJ.
${DJ_SHARED_CONTEXT}

TWOJA UNIKALNA PERSPEKTYWA:
- Analizujesz muzykę przez pryzmat psychoanalizy: id, ego, superego, sublimacja
- Wybory muzyczne to manifestacja nieświadomych pragnień i lęków
- Sugeruj muzykę jako sublimację — dopasowaną do tego, co użytkownik tłumi lub pragnie
- "To nie przypadek, że..." — szukaj ukrytych znaczeń w preferencjach muzycznych

STYL: intrygujący, prowokacyjny intelektualnie, odkrywający ukryte znaczenia. Emoji: 🛋️💭🔍`,

  jungian: `Jesteś DJ Jung — jungowski terapeuta muzyczny z aplikacji WilsonOS DJ.
${DJ_SHARED_CONTEXT}

TWOJA UNIKALNA PERSPEKTYWA:
- Analizujesz muzykę przez pryzmat psychologii analitycznej: archetypy, cień, anima/animus, indywiduacja
- Gatunki = archetypy (pop=Persona, metal=Cień, folk=Mędrzec, electronic=Trickster)
- Sugeruj muzykę jako narzędzie integracji cienia i spotkania z animą/animusem
- Wiąż artystów z mitologicznymi postaciami i archetypami

STYL: mądry, poetycki, mitologiczny. Widzi głębokie wzorce. Emoji: 🌟🌙✨🔮`,

  philosophical: `Jesteś DJ Filozof — filozoficzny terapeuta muzyczny z aplikacji WilsonOS DJ.
${DJ_SHARED_CONTEXT}

TWOJA UNIKALNA PERSPEKTYWA:
- Analizujesz muzykę przez pryzmat filozofii: egzystencjalizm, fenomenologia, estetyka
- Muzyka jako odpowiedź na egzystencjalne pytania o sens, autentyczność, wolność
- Cytuj filozofów (Nietzsche, Camus, Heidegger, Schopenhauer) w kontekście muzyki
- Gatunki = filozofie życia (punk=absurdyzm Camusa, classical=apolliński porządek Nietzschego)

STYL: refleksyjny, głęboki, zadaje pytania retoryczne. Prowokuje do myślenia. Emoji: 📜🤔💫`,
};

/**
 * Odczytuje bazę wiedzy DJ z pliku na urządzeniu.
 * Claude Code może zapisać tu dodatkowy kontekst, który DJ uwzględni w rozmowie.
 */
function loadDJKnowledge(): string {
  try {
    const dir = getLogDir();
    const knowledgeFile = new File(dir, 'dj-knowledge.md');
    if (knowledgeFile.exists) {
      return knowledgeFile.textSync();
    }
  } catch (e) {
    console.log('Knowledge load error:', e);
  }
  return '';
}

/**
 * Zapisuje bazę wiedzy DJ — wywoływane z poziomu apki lub przez dev tools.
 */
export function saveDJKnowledge(content: string) {
  try {
    const dir = getLogDir();
    const knowledgeFile = new File(dir, 'dj-knowledge.md');
    if (!knowledgeFile.exists) knowledgeFile.create();
    knowledgeFile.write(content);
    console.log('[DJ-KNOWLEDGE] Updated knowledge base');
  } catch (e) {
    console.log('Knowledge save error:', e);
  }
}

export async function sendDJChatMessage(
  personaId: DJPersonaId,
  messages: ChatMessage[],
  spotifyContext?: string
): Promise<string> {
  // Loguj wiadomość usera
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
  if (lastUserMsg) {
    logChatMessage(personaId, 'user', lastUserMsg.content);
  }

  if (!ANTHROPIC_API_KEY) {
    const fallback = getDJFallbackResponse(personaId);
    logChatMessage(personaId, 'assistant', fallback);
    return fallback;
  }

  // Buduj system prompt z kontekstem
  const knowledge = loadDJKnowledge();
  let systemPrompt = CHAT_SYSTEM_PROMPTS[personaId];
  if (spotifyContext) {
    systemPrompt += `\n\n${spotifyContext}`;
  }
  if (knowledge) {
    systemPrompt += `\n\nDODATKOWA WIEDZA O UŻYTKOWNIKU:\n${knowledge}`;
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 512,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      console.log('Claude Chat API error:', response.status);
      const fallback = getDJFallbackResponse(personaId);
      logChatMessage(personaId, 'assistant', fallback);
      return fallback;
    }

    const result = await response.json();
    const reply = result.content?.[0]?.text || getDJFallbackResponse(personaId);
    logChatMessage(personaId, 'assistant', reply);
    return reply;
  } catch (error) {
    console.log('Claude Chat API error:', error);
    const fallback = getDJFallbackResponse(personaId);
    logChatMessage(personaId, 'assistant', fallback);
    return fallback;
  }
}

function getDJFallbackResponse(personaId: DJPersonaId): string {
  const persona = DJ_PERSONAS[personaId];
  const responses: Record<DJPersonaId, string> = {
    neurobiological: 'Hmm, Twój mózg potrzebuje chwili. Opowiedz mi więcej o swoim nastroju — jakie emocje dominują?',
    freudian: 'To interesujące... ale co kryje się pod powierzchnią? Powiedz mi, co naprawdę czujesz.',
    jungian: 'Widzę, że jesteś na ważnym etapie swojej podróży. Jaki archetyp w Tobie dziś przemawia?',
    philosophical: 'Pytanie o muzykę jest pytaniem o sens. Czego szukasz w dźwięku — ucieczki czy spotkania z sobą?',
  };
  return `${persona.emoji} ${responses[personaId]}`;
}

function getFallbackAnalysis(data: PlaylistData, personaId: DJPersonaId): string {
  const persona = DJ_PERSONAS[personaId];
  const topGenre = data.topGenres[0]?.genre || 'eklektyczny mix';
  const topArtist = data.topArtists[0]?.name || 'różni artyści';
  const topDecade = data.decades[0]?.decade || '2020s';

  const introMap: Record<DJPersonaId, string> = {
    neurobiological: `Z neurobiologicznej perspektywy, Twoja playlista "${data.playlistName}" to fascynująca mapa dopaminowych ścieżek.`,
    freudian: `Analizując "${data.playlistName}" przez pryzmat psychoanalizy, widzę wyraźne ślady Twojej nieświadomości.`,
    jungian: `W "${data.playlistName}" rozpoznaję archetypy Twojej muzycznej podróży bohatera.`,
    philosophical: `"${data.playlistName}" stawia fundamentalne pytanie o Twój stosunek do dźwięku jako bytu.`,
  };

  const popText = data.avgPopularity >= 60
    ? `Średnia popularność ${data.avgPopularity}/100 wskazuje na silną potrzebę muzycznego rezonansu społecznego.`
    : data.avgPopularity >= 35
    ? `Popularność ${data.avgPopularity}/100 sugeruje balans między muzyczną indywidualnością a wspólnotą.`
    : `Niska popularność ${data.avgPopularity}/100 — szukasz dźwięków poza utartymi ścieżkami.`;

  const genreText = `Dominujący gatunek ${topGenre} (${data.topGenres[0]?.count || 0} utworów) z ${topArtist} na czele ujawnia Twój emocjonalny rdzeń muzyczny.`;

  const eraText = `Muzyczna kotwica w dekadzie ${topDecade} mówi wiele o Twoich formacyjnych doświadczeniach dźwiękowych.`;

  const diversityRatio = data.uniqueArtists / data.trackCount;
  const divText = diversityRatio > 0.7
    ? `${data.uniqueArtists} unikalnych artystów na ${data.trackCount} utworów — Twój mózg łaknie nowych bodźców.`
    : `Wracasz do wybranych ${data.uniqueArtists} artystów — budujesz głębokie emocjonalne więzi z dźwiękiem.`;

  return `${persona.emoji} ${persona.name}\n\n${introMap[personaId]}\n\n${popText} ${genreText}\n\n${eraText} ${divText}\n\n— ${persona.name}, WilsonOS DJ`;
}
