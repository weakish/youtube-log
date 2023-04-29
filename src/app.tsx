import { Signal, useSignal } from "@preact/signals";
import {
  calculatePlaylistDuration,
  extractPlaylistId,
  fetchPlaylist,
} from "./youtube-playtime";
import { LowSync } from "lowdb";
import { LocalStorage } from "lowdb/browser";
import "./app.css";
import { useEffect } from "preact/hooks";

type LogEntry = {
  playlistId: string;
  playlistTitle: string;
  startIndex: number;
  endIndex: number;
  playTime: number;
};

type Log = {
  [index: string]: LogEntry[];
};

export function App() {
  const hosts = [
    "https://invidious.snopyta.org",
    "https://invidious.0011.lt",
    "https://invidious.vpsburti.com",
    "https://invidious.lunar.icu",
    "https://invidious.sethforprivacy.com",
    "https://iv.ggtyler.dev",
    "https://iv.melmac.space",
    "https://vid.priv.au",
    "https://yt.funami.tech",
    "https://invidious.privacydev.net",
    "https://invidious.baczek.me",
    "https://inv.odyssey346.dev",
    "https://invidious.nerdvpn.de",
    "https://vid.puffyan.us",
    "https://inv.riverside.rocks",
    "https://yt.artemislena.eu",
    "https://invidious.flokinet.to",
    "https://invidious.esmailelbob.xyz",
    "https://invidious.projectsegfau.lt",
    "https://inv.bp.projectsegfau.lt",
    "https://y.com.sb",
    "https://invidious.tiekoetter.com",
  ];

  const adapter = new LocalStorage<Log>("log");
  const db = new LowSync<Log>(adapter, {});

  const playlistUrl = useSignal("");
  const playlistId = useSignal("");
  const startIndex = useSignal(1);
  const endIndex = useSignal(2);
  const apiHost = useSignal(hosts[0]);
  const log = useSignal("");

  useEffect(() => {
    db.read();
    log.value = JSON.stringify(db.data, null, 2);
  }, []);
  const handlePlaylistUrl = (e: Event, s: Signal) => {
    if (e.target instanceof HTMLInputElement) {
      s.value = e.target.value;
      try {
        const id = extractPlaylistId(e.target.value);
        if (id == null) {
          e.target.setCustomValidity(
            "Invalid playlist URL, not containing list parameter",
          );
        } else {
          playlistId.value = id;
          e.target.setCustomValidity("");
        }
      } catch (err) {
        if (err instanceof TypeError) {
          e.target.setCustomValidity("Invalid URL");
        } else {
          throw err;
        }
      }
    } else {
      throw new Error(
        "e.target is not HTMLInputElement! Calling handleInput on non input elements?",
      );
    }
  };
  const handleInput = (e: Event, s: Signal) => {
    if (e.target instanceof HTMLInputElement) {
      s.value = e.target.value;
    } else {
      throw new Error(
        "e.target is not HTMLInputElement! Calling handleInput on non input elements?",
      );
    }
  };

  const updateLog = async (e: Event) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const playlist = await fetchPlaylist(playlistId.value, apiHost.value);
    const playTime = calculatePlaylistDuration(
      playlist,
      startIndex.value - 1,
      endIndex.value - 1,
    );
    const logEntry = {
      playlistId: playlistId.value,
      playlistTitle: playlist.title,
      startIndex: startIndex.value,
      endIndex: endIndex.value,
      playTime: playTime,
    };
    const todayEntries = db.data[today];
    if (todayEntries == undefined) {
      db.data[today] = [logEntry];
    } else {
      db.data[today].push(logEntry);
    }
    db.write();
    log.value = JSON.stringify(db.data, null, 2);
  };

  return (
    <main>
      <pre contentEditable><code>{log}</code></pre>
      <aside>
        <form onSubmit={(e) => updateLog(e)}>
          <label for="playlistUrl">
            YouTube Playlist URL<sup>1</sup>
          </label>
          <input
            type="text"
            name="playlistUrl"
            required
            value={playlistUrl}
            onChange={(e) => handlePlaylistUrl(e, playlistUrl)}
          />

          <label for="startIndex">
            Start index<sup>2</sup>
          </label>
          <input
            type="number"
            name="startIndex"
            required
            min="1"
            value={startIndex}
            onChange={(e) => handleInput(e, startIndex)}
          />
          <label for="endIndex">
            End index<sup>3</sup>
          </label>
          <input
            type="number"
            name="endIndex"
            required
            min="2"
            value={endIndex}
            onChange={(e) => handleInput(e, endIndex)}
          />

          <label for="apiHost">
            API host<sup>4</sup>
          </label>
          <input
            list="apiHosts"
            name="apiHost"
            value={apiHost}
            onChange={(e) => handleInput(e, apiHost)}
          />
          <datalist id="apiHosts">
            {hosts.map((host) => <option value={host} />)}
          </datalist>

          <div>
            <button type="submit">Submit</button>
          </div>
        </form>
      </aside>
      <p>Notes:</p>
      <ol>
        <li>
          You can also paste a Video URL containing the <code>list</code>{" "}
          URL parameter.
        </li>
        <li>Index starts from 1, as displayed at YouTube website UI.</li>
        <li>Included.</li>
        <li>
          Accessing YouTube Data API requires an API key, which is not suitable
          for a static site. Thus,{" "}
          <a href="https://docs.invidious.io/api/">Invidious API</a>{" "}
          is used instead. You can choose from the list of available instances,
          or input your own. Invidious is an alternative frontend to YouTube not
          using official YouTube API.
        </li>
      </ol>
    </main>
  );
}
