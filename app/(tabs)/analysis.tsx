import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';

export default function AnalysisScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.emptyState}>
        <FontAwesome name="bar-chart" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>Analiza Playlist</Text>
        <Text style={styles.emptyDesc}>
          Po\u0142\u0105cz si\u0119 ze Spotify, aby zobaczy\u0107 emocjonalny profil swoich playlist.
        </Text>
        <Text style={styles.emptyHint}>
          Wybierz playlist\u0119 {'\u2192'} AI DJ przeanalizuje valence, energy i acousticness
          {'\u2192'} otrzymasz psychologiczny komentarz
        </Text>
        <TouchableOpacity style={styles.connectButton}>
          <FontAwesome name="spotify" size={20} color="#fff" />
          <Text style={styles.connectButtonText}>Po\u0142\u0105cz Spotify</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
    marginTop: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.spotifyGreen,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 10,
    marginTop: 20,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
