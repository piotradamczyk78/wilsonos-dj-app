import { DJ_PERSONAS, type DJPersonaId } from '@/constants/DJPersonas';

// Anthropic API key — docelowo przenieść do backend proxy (Supabase)
export const ANTHROPIC_API_KEY = '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';

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
  if (ANTHROPIC_API_KEY === 'YOUR_ANTHROPIC_API_KEY') {
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
