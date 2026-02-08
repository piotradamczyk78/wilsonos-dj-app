import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { DJ_PERSONAS, type DJPersonaId } from '@/constants/DJPersonas';
import { sendDJChatMessage, type ChatMessage } from '@/services/claude';
import { useAuth } from '@/contexts/AuthContext';
import { getPlaylistSummaryForDJ, getRecentlyPlayed, searchTrack, createPlaylist } from '@/services/spotify';
import { getUserProfile } from '@/services/spotify';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function DJChatScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const insets = useSafeAreaInsets();
  const persona = DJ_PERSONAS[personaId as DJPersonaId];
  const { getValidToken } = useAuth();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [spotifyContext, setSpotifyContext] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Ładuj kontekst Spotify przy starcie czatu
  useEffect(() => {
    async function loadSpotifyContext() {
      try {
        const token = await getValidToken();
        if (!token) return;

        const [playlistSummary, recentItems] = await Promise.all([
          getPlaylistSummaryForDJ(token),
          getRecentlyPlayed(token, 10).catch(() => []),
        ]);

        let context = '';
        if (playlistSummary) {
          context += playlistSummary;
        }
        if (recentItems.length > 0) {
          const recentTracks = recentItems
            .map((item) => `- ${item.track.artists[0]?.name} — "${item.track.name}"`)
            .join('\n');
          context += `\n\nOSTATNIO SŁUCHANE UTWORY:\n${recentTracks}`;
        }
        if (context) {
          setSpotifyContext(context);
          console.log('[DJ-CHAT] Spotify context loaded');
        }
      } catch (e) {
        console.log('[DJ-CHAT] Error loading Spotify context:', e);
      }
    }
    loadSpotifyContext();
  }, []);

  // Wiadomość powitalna od DJ-a
  useEffect(() => {
    const greetings: Record<DJPersonaId, string> = {
      neurobiological: `Cześć! Jestem ${persona.name}. 🧬 Opowiedz mi jak się dziś czujesz — a powiem Ci, co Twój mózg próbuje Ci przekazać przez muzykę. Jaki masz teraz nastrój?`,
      freudian: `Witaj na mojej kozetce muzycznej. Jestem ${persona.name}. 🛋️ To nie przypadek, że tu jesteś... Opowiedz mi o swoim nastroju — co kryje się pod powierzchnią Twoich emocji?`,
      jungian: `Witaj, wędrowcze. Jestem ${persona.name}. 🌟 Każda muzyczna podróż jest częścią większej historii. Powiedz mi — jaki archetyp w Tobie dziś przemawia? Jak się czujesz?`,
      philosophical: `Witaj. Jestem ${persona.name}. 📜 Jak mawiał Nietzsche: "Bez muzyki życie byłoby błędem." Powiedz mi — czego dziś szukasz w dźwięku? Jaki jest Twój nastrój?`,
    };

    const id = personaId as DJPersonaId;
    if (persona && greetings[id]) {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: greetings[id],
        },
      ]);
    }
  }, [personaId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Buduj historię czatu dla API
    const chatHistory: ChatMessage[] = [...messages, userMsg]
      .filter((m) => m.id !== 'greeting' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const reply = await sendDJChatMessage(personaId as DJPersonaId, chatHistory, spotifyContext);
      setMessages((prev) => [
        ...prev,
        {
          id: `dj-${Date.now()}`,
          role: 'assistant',
          content: reply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `${persona.emoji} Przepraszam, mam chwilowy problem z połączeniem. Spróbuj ponownie.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Wykryj sugestie muzyczne w tekście DJ-a (format: **"Artysta - Tytuł"** lub "Artysta — „Tytuł"")
  const extractTrackSuggestions = useCallback((text: string): string[] => {
    const patterns = [
      /\*\*"(.+?)"\*\*/g,                    // **"Artysta - Tytuł"**
      /\*\*(.+?)\s[–—-]\s[„""](.+?)[""]\*\*/g,  // **Artysta — „Tytuł"**
      /\*\*(.+?)\s[–—-]\s(.+?)\*\*/g,        // **Artysta - Tytuł**
    ];
    const results: string[] = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Jeśli grupa 2 istnieje, to artysta + tytuł osobno
        const suggestion = match[2] ? `${match[1]} ${match[2]}` : match[1];
        if (suggestion && !results.includes(suggestion)) {
          results.push(suggestion);
        }
      }
    }
    return results;
  }, []);

  // Wykryj komendę [PLAYLIST:nazwa] w tekście DJ-a
  const extractPlaylistCommand = useCallback((text: string): string | null => {
    const match = text.match(/\[PLAYLIST:(.+?)\]/);
    return match ? match[1] : null;
  }, []);

  // Stwórz playlistę na Spotify z sugestiami DJ-a
  async function handleCreatePlaylist(playlistName: string, trackQueries: string[]) {
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert('Spotify', 'Zaloguj się do Spotify.');
        return;
      }

      // Wyszukaj wszystkie utwory i zbierz URI
      const trackUris: string[] = [];
      for (const query of trackQueries) {
        const result = await searchTrack(token, query);
        if (result) trackUris.push(result.uri);
      }

      if (trackUris.length === 0) {
        Alert.alert('Spotify', 'Nie znaleziono żadnych utworów.');
        return;
      }

      const profile = await getUserProfile(token);
      const result = await createPlaylist(
        token,
        profile.id,
        playlistName,
        `Stworzone przez ${persona.name} — WilsonOS DJ`,
        trackUris
      );

      if (result) {
        Alert.alert(
          'Playlista utworzona!',
          `"${playlistName}" (${trackUris.length} utworów) dodana do Spotify.`,
          [
            { text: 'Otwórz', onPress: () => result.externalUrl && Linking.openURL(result.externalUrl) },
            { text: 'OK' },
          ]
        );
        console.log(`[DJ-CHAT] Created playlist "${playlistName}" with ${trackUris.length} tracks`);
      } else {
        Alert.alert('Błąd', 'Nie udało się utworzyć playlisty.');
      }
    } catch (e) {
      console.log('[DJ-CHAT] Create playlist error:', e);
      Alert.alert('Błąd', 'Nie udało się utworzyć playlisty.');
    }
  }

  // Otwórz utwór w Spotify
  async function playInSpotify(query: string) {
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert('Spotify', 'Zaloguj się do Spotify żeby odtwarzać muzykę.');
        return;
      }
      const result = await searchTrack(token, query);
      if (result) {
        // Próbuj otworzyć w apce Spotify, fallback na URL
        const spotifyAppUrl = result.uri; // spotify:track:xxx
        const canOpen = await Linking.canOpenURL(spotifyAppUrl);
        if (canOpen) {
          await Linking.openURL(spotifyAppUrl);
        } else if (result.externalUrl) {
          await Linking.openURL(result.externalUrl);
        } else {
          Alert.alert('Spotify', `Nie znaleziono: ${query}`);
        }
      } else {
        Alert.alert('Spotify', `Nie znaleziono utworu: ${query}`);
      }
    } catch (e) {
      console.log('[DJ-CHAT] Play error:', e);
      Alert.alert('Błąd', 'Nie udało się otworzyć Spotify.');
    }
  }

  // Auto-scroll po nowej wiadomości
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  if (!persona) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Nieznana persona DJ</Text>
      </View>
    );
  }

  const personaColor = Colors[personaId as keyof typeof Colors] || Colors.primary;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>
      {/* Header z info o DJ */}
      <View style={[styles.djHeader, { borderBottomColor: personaColor as string }]}>
        <Text style={styles.djEmoji}>{persona.emoji}</Text>
        <View style={styles.djInfo}>
          <Text style={styles.djName}>{persona.name}</Text>
          <Text style={styles.djShort}>{persona.shortDescription}</Text>
        </View>
      </View>

      {/* Wiadomości */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        keyboardShouldPersistTaps="handled">
        {messages.map((msg) => {
          const trackSuggestions = msg.role === 'assistant' ? extractTrackSuggestions(msg.content) : [];
          const playlistCmd = msg.role === 'assistant' ? extractPlaylistCommand(msg.content) : null;
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.djBubble,
              ]}>
              {msg.role === 'assistant' && (
                <Text style={styles.bubbleLabel}>{persona.name}</Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.djText,
                ]}>
                {msg.content}
              </Text>
              {trackSuggestions.length > 0 && (
                <View style={styles.trackButtons}>
                  {trackSuggestions.map((track, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.playButton}
                      onPress={() => playInSpotify(track)}>
                      <FontAwesome name="spotify" size={14} color={Colors.spotifyGreen} />
                      <Text style={styles.playButtonText} numberOfLines={1}>
                        {track}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {playlistCmd && trackSuggestions.length >= 2 && (
                    <TouchableOpacity
                      style={styles.createPlaylistButton}
                      onPress={() => handleCreatePlaylist(playlistCmd, trackSuggestions)}>
                      <FontAwesome name="plus-circle" size={16} color={Colors.primary} />
                      <Text style={styles.createPlaylistText}>
                        Stwórz playlistę "{playlistCmd}"
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
        {isLoading && (
          <View style={[styles.messageBubble, styles.djBubble]}>
            <Text style={styles.bubbleLabel}>{persona.name}</Text>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={personaColor as string} />
              <Text style={styles.typingText}>pisze...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Opowiedz o swoim nastroju..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: input.trim() ? (personaColor as string) : Colors.surfaceLight },
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}>
          <FontAwesome
            name="send"
            size={16}
            color={input.trim() ? '#fff' : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  djHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    gap: 12,
  },
  djEmoji: {
    fontSize: 32,
  },
  djInfo: {
    flex: 1,
  },
  djName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  djShort: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  djBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: Colors.text,
  },
  djText: {
    color: Colors.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButtons: {
    marginTop: 10,
    gap: 6,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  playButtonText: {
    color: Colors.spotifyGreen,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 4,
  },
  createPlaylistText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
