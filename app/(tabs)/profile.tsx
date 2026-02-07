import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={32} color={Colors.textMuted} />
        </View>
        <Text style={styles.name}>Wilson DJ User</Text>
        <Text style={styles.plan}>Plan: Free</Text>
      </View>

      <TouchableOpacity style={styles.premiumCard}>
        <View>
          <Text style={styles.premiumTitle}>{'\u{1F451}'} Odblokuj Premium</Text>
          <Text style={styles.premiumDesc}>
            4 osobowo\u015bci AI DJ, nielimitowane analizy, pe\u0142ne sesje
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color={Colors.highlight} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Twoje statystyki</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Analizy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Sesje DJ</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>-</Text>
          <Text style={styles.statLabel}>DNA muzyczne</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Ustawienia</Text>
      <TouchableOpacity style={styles.menuItem}>
        <FontAwesome name="spotify" size={18} color={Colors.spotifyGreen} />
        <Text style={styles.menuText}>Konto Spotify</Text>
        <Text style={styles.menuStatus}>Nie po\u0142\u0105czono</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem}>
        <FontAwesome name="bell" size={18} color={Colors.textSecondary} />
        <Text style={styles.menuText}>Powiadomienia</Text>
        <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem}>
        <FontAwesome name="info-circle" size={18} color={Colors.textSecondary} />
        <Text style={styles.menuText}>O aplikacji</Text>
        <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
      </TouchableOpacity>

      <Text style={styles.version}>WilsonOS DJ v1.0.0</Text>
      <Text style={styles.copyright}>octadecimal.pl</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  plan: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: Colors.highlight,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.highlight,
    marginBottom: 4,
  },
  premiumDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  menuStatus: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 30,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
