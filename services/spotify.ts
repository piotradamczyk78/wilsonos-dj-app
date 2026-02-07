const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
}

export interface AudioFeatures {
  id: string;
  valence: number;
  energy: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  tempo: number;
}

async function spotifyFetch(endpoint: string, accessToken: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Spotify API error: ${res.status}`);
  }
  return res.json();
}

export async function getUserPlaylists(
  accessToken: string,
  limit = 50
): Promise<SpotifyPlaylist[]> {
  const data = await spotifyFetch(`/me/playlists?limit=${limit}`, accessToken);
  return data.items;
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit = 100
): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch(
    `/playlists/${playlistId}/tracks?limit=${limit}`,
    accessToken
  );
  return data.items.map((item: { track: SpotifyTrack }) => item.track).filter(Boolean);
}

export async function getAudioFeatures(
  accessToken: string,
  trackIds: string[]
): Promise<AudioFeatures[]> {
  // Spotify allows max 100 IDs per request
  const chunks: string[][] = [];
  for (let i = 0; i < trackIds.length; i += 100) {
    chunks.push(trackIds.slice(i, i + 100));
  }

  const results: AudioFeatures[] = [];
  for (const chunk of chunks) {
    const data = await spotifyFetch(
      `/audio-features?ids=${chunk.join(',')}`,
      accessToken
    );
    results.push(...(data.audio_features || []).filter(Boolean));
  }
  return results;
}

export async function getCurrentPlayback(accessToken: string) {
  try {
    return await spotifyFetch('/me/player', accessToken);
  } catch {
    return null;
  }
}

export async function getUserProfile(accessToken: string) {
  return spotifyFetch('/me', accessToken);
}
