type Video = {
  id: string;
  lengthSeconds: number;
  index: number;
};

export type Playlist = {
  title: string;
  videos: Video[];
};

export async function fetchPlaylist(
  playlistId: string,
  apiHost: string,
): Promise<Playlist> {
  const response = await fetch(`${apiHost}/api/v1/playlists/${playlistId}`);
  const data = await response.json();
  return data as Playlist;
}

/**
 * Calculates the total duration of a playlist between the start and end indices (inclusive).
 *
 * @throws {Error} If any video index in the playlist does not match its position in the array.
 *
 * @returns The total duration in seconds of the specified portion of the playlist.
 */
export const calculatePlaylistDuration = (
  playlist: Playlist,
  startIndex: number,
  endIndex: number,
): number => {
  const { videos } = playlist;

  let totalDuration = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    const video = videos[i];
    if (video.index !== i) {
      throw new Error(`Video index mismatch at index ${i}`);
    }
    totalDuration += video.lengthSeconds;
  }

  return totalDuration;
};

export function extractPlaylistId(input: string): string | null {
  const url = new URL(input);
  const playlistId = url.searchParams.get("list");

  return playlistId;
}

type InstanceInfo = {
  api: boolean;
  uri: string;
};
export type Instance = [string, InstanceInfo];

export function filterApiInstance(instances: Instance[]): string[] {
  return instances.filter(([_, { api }]) => api).map(([_, { uri }]) => uri);
}
