import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPlaylistTracks,
  getArtists,
  type SpotifyTrack,
} from '@/services/spotify';

interface AnalysisResult {
  trackCount: number;
  avgPopularity: number;
  explicitRatio: number;
  avgDurationMin: number;
  topGenres: { genre: string; count: number }[];
  decades: { decade: string; count: number }[];
  uniqueArtists: number;
  topArtists: { name: string; count: number }[];
  popularitySpread: { low: number; mid: number; high: number };
  totalDurationMin: number;
}

function analyzeData(tracks: SpotifyTrack[], genres: Map<string, string[]>): AnalysisResult {
  const trackCount = tracks.length;
  const avgPopularity = tracks.reduce((s, t) => s + t.popularity, 0) / trackCount;
  const explicitCount = tracks.filter((t) => t.explicit).length;
  const totalDurationMs = tracks.reduce((s, t) => s + t.duration_ms, 0);

  // Decades
  const decadeMap = new Map<string, number>();
  for (const t of tracks) {
    const year = parseInt(t.album.release_date?.substring(0, 4) || '0', 10);
    if (year > 0) {
      const decade = `${Math.floor(year / 10) * 10}s`;
      decadeMap.set(decade, (decadeMap.get(decade) || 0) + 1);
    }
  }

  // Genre counts
  const genreMap = new Map<string, number>();
  for (const t of tracks) {
    for (const artist of t.artists) {
      const artistGenres = genres.get(artist.id) || [];
      for (const g of artistGenres) {
        genreMap.set(g, (genreMap.get(g) || 0) + 1);
      }
    }
  }

  // Artist frequency
  const artistMap = new Map<string, number>();
  for (const t of tracks) {
    const name = t.artists[0]?.name;
    if (name) artistMap.set(name, (artistMap.get(name) || 0) + 1);
  }

  // Popularity spread
  let low = 0, mid = 0, high = 0;
  for (const t of tracks) {
    if (t.popularity >= 70) high++;
    else if (t.popularity >= 40) mid++;
    else low++;
  }

  return {
    trackCount,
    avgPopularity: Math.round(avgPopularity),
    explicitRatio: explicitCount / trackCount,
    avgDurationMin: totalDurationMs / trackCount / 60000,
    totalDurationMin: totalDurationMs / 60000,
    topGenres: [...genreMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count })),
    decades: [...decadeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([decade, count]) => ({ decade, count })),
    uniqueArtists: artistMap.size,
    topArtists: [...artistMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
    popularitySpread: { low, mid, high },
  };
}

function getPopularityVerdict(avg: number): string {
  if (avg >= 70) return 'Mainstream hunter — lubisz to, co popularne. Muzyka jako waluta społeczna.';
  if (avg >= 50) return 'Zbalansowany odkrywca — mieszasz hity z mniej znanymi perełkami.';
  if (avg >= 30) return 'Hipster soul — szukasz muzyki poza radarem. Cenisz autentyczność.';
  return 'Undergroundowy archeolog — kopiesz głęboko. Muzyka to dla Ciebie odkrywanie.';
}

function getDiversityVerdict(uniqueArtists: number, trackCount: number): string {
  const ratio = uniqueArtists / trackCount;
  if (ratio > 0.8) return 'Kolekcjoner doświadczeń — rzadko wracasz do tego samego artysty. Ciekawość ponad lojalność.';
  if (ratio > 0.5) return 'Zdrowa równowaga — masz ulubieńców, ale jesteś otwarty na nowe dźwięki.';
  return 'Lojalista — budujesz głębokie relacje z wybranymi artystami. Przywiązanie emocjonalne do muzyki.';
}

function getExplicitVerdict(ratio: number): string {
  if (ratio > 0.6) return 'Szukasz autentyczności i surowych emocji. Nie boisz się kontrowersji.';
  if (ratio > 0.3) return 'Mix delikatności i surowości — różnorodna ekspresja emocjonalna.';
  return 'Preferujesz łagodniejsze formy wyrazu. Harmonia ponad prowokację.';
}

function getEraVerdict(decades: { decade: string; count: number }[]): string {
  if (decades.length === 0) return '';
  const top = decades[0].decade;
  if (top === '2020s') return 'Żyjesz chwilą obecną — Twoja muzyka to lustro współczesności.';
  if (top === '2010s') return 'Złota era streamingu ukształtowała Twój gust muzyczny.';
  if (top === '2000s') return 'Nostalgia za latami 2000. — formacyjne dźwięki Twojego pokolenia.';
  return `Dusza vintage — ${top} to Twój muzyczny dom duchowy.`;
}

export default function PlaylistAnalysisScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { getValidToken } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Pobieram utwory...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) runAnalysis();
  }, [id]);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      if (!token) {
        setError('Brak tokenu — zaloguj się ponownie.');
        return;
      }

      setLoadingStatus('Pobieram utwory...');
      const tracks = await getPlaylistTracks(token, id!);
      if (tracks.length === 0) {
        setError('Playlista jest pusta.');
        return;
      }

      setLoadingStatus(`Analizuję ${tracks.length} utworów...`);

      // Pobierz unikalne ID artystów
      const artistIds = [...new Set(tracks.flatMap((t) => t.artists.map((a) => a.id)))];

      setLoadingStatus(`Pobieram dane ${artistIds.length} artystów...`);
      const artists = await getArtists(token, artistIds);

      // Mapa artyst ID → gatunki
      const genreMap = new Map<string, string[]>();
      for (const a of artists) {
        genreMap.set(a.id, a.genres);
      }

      setLoadingStatus('Generuję profil psychologiczny...');
      const analysis = analyzeData(tracks, genreMap);
      setResult(analysis);
    } catch (err) {
      console.log('Analysis error:', err);
      setError('Błąd podczas analizy. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analizuję playlistę...</Text>
        <Text style={styles.loadingHint}>{loadingStatus}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!result) return null;

  const maxGenreCount = result.topGenres[0]?.count || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.playlistName}>{name || 'Playlista'}</Text>
        <Text style={styles.trackCount}>
          {result.trackCount} utworów · {result.uniqueArtists} artystów · {Math.round(result.totalDurationMin)} min
        </Text>
      </View>

      {/* Profil psychologiczny */}
      <View style={styles.verdictCard}>
        <Text style={styles.verdictEmoji}>{'\u{1F9E0}'}</Text>
        <Text style={styles.verdictTitle}>Profil psychologiczny</Text>
        <Text style={styles.verdictText}>{getPopularityVerdict(result.avgPopularity)}</Text>
      </View>

      {/* Popularność */}
      <Text style={styles.sectionTitle}>Popularność utworów</Text>
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricEmoji}>{'\u{1F525}'}</Text>
          <View style={styles.metricInfo}>
            <Text style={styles.metricLabel}>Średnia popularność</Text>
            <Text style={styles.metricDesc}>0 = niszowa, 100 = megahit</Text>
          </View>
          <Text style={styles.metricValue}>{result.avgPopularity}</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${result.avgPopularity}%`, backgroundColor: Colors.spotifyGreen }]} />
        </View>
      </View>

      <View style={styles.spreadRow}>
        <View style={styles.spreadCard}>
          <Text style={styles.spreadNumber}>{result.popularitySpread.low}</Text>
          <Text style={styles.spreadLabel}>Niszowe</Text>
        </View>
        <View style={styles.spreadCard}>
          <Text style={styles.spreadNumber}>{result.popularitySpread.mid}</Text>
          <Text style={styles.spreadLabel}>Średnie</Text>
        </View>
        <View style={styles.spreadCard}>
          <Text style={styles.spreadNumber}>{result.popularitySpread.high}</Text>
          <Text style={styles.spreadLabel}>Popularne</Text>
        </View>
      </View>

      {/* Diversity */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>{'\u{1F3AD}'} Różnorodność</Text>
        <Text style={styles.insightText}>
          {getDiversityVerdict(result.uniqueArtists, result.trackCount)}
        </Text>
      </View>

      {/* Gatunki */}
      {result.topGenres.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>DNA gatunkowe</Text>
          {result.topGenres.map((g) => (
            <View key={g.genre} style={styles.genreRow}>
              <Text style={styles.genreLabel} numberOfLines={1}>{g.genre}</Text>
              <View style={styles.genreBarBg}>
                <View
                  style={[
                    styles.genreBarFill,
                    { width: `${(g.count / maxGenreCount) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.genreCount}>{g.count}</Text>
            </View>
          ))}
        </>
      )}

      {/* Top artyści */}
      <Text style={styles.sectionTitle}>Top artyści</Text>
      {result.topArtists.map((a, i) => (
        <View key={a.name} style={styles.artistRow}>
          <Text style={styles.artistRank}>#{i + 1}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{a.name}</Text>
          <Text style={styles.artistCount}>{a.count} {a.count === 1 ? 'utwór' : a.count < 5 ? 'utwory' : 'utworów'}</Text>
        </View>
      ))}

      {/* Ery */}
      {result.decades.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Ery muzyczne</Text>
          <View style={styles.decadesRow}>
            {result.decades.map((d) => (
              <View key={d.decade} style={styles.decadeChip}>
                <Text style={styles.decadeLabel}>{d.decade}</Text>
                <Text style={styles.decadeCount}>{d.count}</Text>
              </View>
            ))}
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>{'\u{23F3}'} Era</Text>
            <Text style={styles.insightText}>{getEraVerdict(result.decades)}</Text>
          </View>
        </>
      )}

      {/* Explicit */}
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricEmoji}>{'\u{1F525}'}</Text>
          <View style={styles.metricInfo}>
            <Text style={styles.metricLabel}>Explicit content</Text>
            <Text style={styles.metricDesc}>Procent utworów z treścią dla dorosłych</Text>
          </View>
          <Text style={styles.metricValue}>{Math.round(result.explicitRatio * 100)}%</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.round(result.explicitRatio * 100)}%`, backgroundColor: Colors.error }]} />
        </View>
      </View>
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>{'\u{1F3A4}'} Ekspresja</Text>
        <Text style={styles.insightText}>{getExplicitVerdict(result.explicitRatio)}</Text>
      </View>

      {/* Średni czas */}
      <View style={styles.tempoCard}>
        <Text style={styles.tempoEmoji}>{'\u{23F1}'}</Text>
        <Text style={styles.tempoLabel}>Średni czas utworu</Text>
        <Text style={styles.tempoValue}>
          {Math.floor(result.avgDurationMin)}:{String(Math.round((result.avgDurationMin % 1) * 60)).padStart(2, '0')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
  },
  loadingText: { fontSize: 18, fontWeight: '600', color: Colors.text },
  loadingHint: { fontSize: 14, color: Colors.textSecondary },
  errorText: { fontSize: 16, color: Colors.error, textAlign: 'center', marginTop: 12 },
  header: { marginBottom: 20 },
  playlistName: { fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  trackCount: { fontSize: 14, color: Colors.textSecondary },
  verdictCard: {
    backgroundColor: Colors.accent, borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Colors.primary,
  },
  verdictEmoji: { fontSize: 36, marginBottom: 8 },
  verdictTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.primary, marginBottom: 8 },
  verdictText: { fontSize: 15, color: Colors.text, textAlign: 'center', lineHeight: 22 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginBottom: 14, marginTop: 10 },
  metricCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  metricEmoji: { fontSize: 24 },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  metricDesc: { fontSize: 12, color: Colors.textSecondary },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  barBg: { height: 8, backgroundColor: Colors.surfaceLight, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  spreadRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  spreadCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, alignItems: 'center' },
  spreadNumber: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  spreadLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  genreRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 8, paddingHorizontal: 4,
  },
  genreLabel: { width: 110, fontSize: 13, color: Colors.text },
  genreBarBg: {
    flex: 1, height: 8, backgroundColor: Colors.surfaceLight,
    borderRadius: 4, overflow: 'hidden',
  },
  genreBarFill: { height: 8, borderRadius: 4, backgroundColor: Colors.secondary },
  genreCount: { width: 28, fontSize: 13, color: Colors.textSecondary, textAlign: 'right' },
  artistRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 10, padding: 12,
    marginBottom: 6, gap: 10,
  },
  artistRank: { fontSize: 14, fontWeight: 'bold', color: Colors.primary, width: 28 },
  artistName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  artistCount: { fontSize: 13, color: Colors.textSecondary },
  decadesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  decadeChip: {
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', gap: 6,
  },
  decadeLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  decadeCount: { fontSize: 14, color: Colors.textSecondary },
  insightCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 10 },
  insightTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  insightText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  tempoCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 20,
    alignItems: 'center', marginTop: 6, marginBottom: 20,
  },
  tempoEmoji: { fontSize: 28, marginBottom: 4 },
  tempoLabel: { fontSize: 14, color: Colors.textSecondary },
  tempoValue: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginTop: 4 },
});
