import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';

// Spotify app credentials — w produkcji przenieść do backend proxy!
const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
const SPOTIFY_REDIRECT_URI = 'wilsonos-dj://auth/callback';
const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

export default function SpotifyLoginScreen() {
  const router = useRouter();

  const handleLogin = async () => {
    // TODO: Implement expo-auth-session Spotify OAuth flow
    // For now, show placeholder
    console.log('Spotify login pressed');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <FontAwesome name="spotify" size={64} color={Colors.spotifyGreen} />
        <Text style={styles.title}>Po\u0142\u0105cz ze Spotify</Text>
        <Text style={styles.desc}>
          WilsonOS DJ potrzebuje dost\u0119pu do Twoich playlist, aby m\u00f3c analizowa\u0107
          Tw\u00f3j profil emocjonalny i proponowa\u0107 spersonalizowan\u0105 muzyk\u0119.
        </Text>

        <View style={styles.permissions}>
          <Text style={styles.permTitle}>Uprawnienia:</Text>
          <PermissionItem icon="list" text="Odczyt Twoich playlist" />
          <PermissionItem icon="bar-chart" text="Analiza cech audio utwor\u00f3w" />
          <PermissionItem icon="play" text="Sterowanie odtwarzaniem (Premium)" />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <FontAwesome name="spotify" size={20} color="#fff" />
          <Text style={styles.loginButtonText}>Zaloguj przez Spotify</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
          <Text style={styles.skipText}>P\u00f3\u017aniej</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PermissionItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.permRow}>
      <FontAwesome
        name={icon as any}
        size={14}
        color={Colors.spotifyGreen}
      />
      <Text style={styles.permText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissions: {
    alignSelf: 'stretch',
    marginBottom: 28,
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  permText: {
    fontSize: 14,
    color: Colors.text,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.spotifyGreen,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
