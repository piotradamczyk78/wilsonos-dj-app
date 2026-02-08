import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { DJ_PERSONAS } from '@/constants/DJPersonas';

export default function SessionScreen() {
  const router = useRouter();

  function handlePersonaPress(personaId: string) {
    router.push({ pathname: '/session/[personaId]', params: { personaId } });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Sesja DJ</Text>
        <Text style={styles.subtitle}>
          Wybierz osobowość DJ-a i rozpocznij emocjonalną podróż muzyczną
        </Text>
      </View>

      {Object.values(DJ_PERSONAS).map((persona) => {
        const personaColor = Colors[persona.id as keyof typeof Colors] || Colors.primary;
        return (
          <TouchableOpacity
            key={persona.id}
            style={[styles.personaRow, { borderLeftColor: personaColor as string, borderLeftWidth: 3 }]}
            onPress={() => handlePersonaPress(persona.id)}
            activeOpacity={0.7}>
            <Text style={styles.personaEmoji}>{persona.emoji}</Text>
            <View style={styles.personaInfo}>
              <View style={styles.personaHeader}>
                <Text style={styles.personaName}>{persona.name}</Text>
                {persona.isPremium && (
                  <View style={styles.proBadge}>
                    <Text style={styles.proText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.personaDesc}>{persona.description}</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        );
      })}

      <View style={styles.infoBox}>
        <FontAwesome name="info-circle" size={16} color={Colors.neurobiological} />
        <Text style={styles.infoText}>
          Porozmawiaj z AI DJ-em o swoich emocjach i nastroju — otrzymasz psychologicznie dopasowane sugestie muzyczne.
        </Text>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  personaEmoji: {
    fontSize: 36,
  },
  personaInfo: {
    flex: 1,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  personaName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  personaDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  proBadge: {
    backgroundColor: Colors.highlight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  proText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.background,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
