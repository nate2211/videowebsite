import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Slider,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    ArchiveRounded,
    AutoAwesomeRounded,
    ClosedCaptionRounded,
    ContentCopyRounded,
    DeleteRounded,
    DownloadRounded,
    FastForwardRounded,
    FastRewindRounded,
    FileOpenRounded,
    FilterAltRounded,
    FullscreenRounded,
    GraphicEqRounded,
    LinkRounded,
    MemoryRounded,
    PauseRounded,
    PictureInPictureAltRounded,
    PlaylistAddRounded,
    PlaylistPlayRounded,
    PlayArrowRounded,
    RefreshRounded,
    RestartAltRounded,
    SkipNextRounded,
    SkipPreviousRounded,
    StopRounded,
    TranslateRounded,
    TuneRounded,
    VolumeOffRounded,
    VolumeUpRounded,
} from "@mui/icons-material";
import Hls from "hls.js";
import { SoundTouchNode } from "@soundtouchjs/audio-worklet";
import {
    AppNavBar,
    GradientPage,
    primaryPillSx,
} from "../components/components";

const VIDEO_PLAYLIST_STORAGE_KEY = "audiomasterlab-video-playlist-v1";
const VIDEO_PLAYLIST_LIBRARY_STORAGE_KEY =
    "audiomasterlab-video-playlist-library-v2";
const VIDEO_PLAYLIST_LIBRARY_VERSION = 2;
const PLAYER_HANDOFF_STORAGE_KEY = "audiomasterlab-video-player-handoff-v1";
const PLAYER_MEDIA_BUILD = "player-archive-handoff-named-playlists-v6";
const VIDEO_PLAYER_STATE_STORAGE_KEY = "audiomasterlab-video-player-state-v2";
const PLAYER_STATE_VERSION = 2;
const ARCHIVE_PLAYABLE_EXTENSIONS = [".mp4", ".m4v", ".webm", ".ogv", ".ogg"];
const ARCHIVE_BLOCKED_FILE_TERMS = [
    "_thumb",
    "thumbnail",
    "spectrogram",
    "metadata",
    "files.xml",
    "torrent",
    "_meta.",
    "_itemimage",
];

const DEFAULT_MODEL_ID = "onnx-community/whisper-tiny";
const MODEL_OPTIONS = [
    {
        id: "onnx-community/whisper-tiny",
        label: "Whisper Tiny — fastest",
    },
    {
        id: "onnx-community/whisper-base",
        label: "Whisper Base — balanced",
    },
    {
        id: "onnx-community/whisper-small",
        label: "Whisper Small — better accuracy",
    },
];

const LANGUAGE_OPTIONS = [
    { value: "auto", label: "Auto detect" },
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "italian", label: "Italian" },
    { value: "portuguese", label: "Portuguese" },
    { value: "russian", label: "Russian" },
    { value: "ukrainian", label: "Ukrainian" },
    { value: "polish", label: "Polish" },
    { value: "turkish", label: "Turkish" },
    { value: "arabic", label: "Arabic" },
    { value: "hindi", label: "Hindi" },
    { value: "chinese", label: "Chinese" },
    { value: "japanese", label: "Japanese" },
    { value: "korean", label: "Korean" },
];

const INITIAL_VIDEO_EFFECTS = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    zoom: 100,
    rotate: 0,
};

const INITIAL_AUDIO_EFFECTS = {
    volume: 1,
    pan: 0,
    bass: 0,
    mid: 0,
    treble: 0,
};

const SOUNDTOUCH_PROCESSOR_URLS = [
    "https://cdn.jsdelivr.net/npm/@soundtouchjs/audio-worklet@2.1.0/.dist/soundtouch-processor.js",
    "/soundtouch-processor.js",
];

const INITIAL_TIME_WARP = {
    enabled: false,
    depth: 0.18,
    frequency: 0.35,
    shape: "sine",
};

const INITIAL_PITCH_WARP = {
    enabled: false,
    depth: 3,
    frequency: 0.22,
    shape: "sine",
};

const INITIAL_VISUAL_WARP = {
    mode: "none",
    intensity: 38,
    speed: 1,
    displacement: 34,
    perspective: 18,
    syncToVideo: true,
    scanlines: false,
    vignette: true,
};

const VISUAL_WARP_PRESETS = {
    Clean: {
        ...INITIAL_VISUAL_WARP,
    },
    Liquid: {
        ...INITIAL_VISUAL_WARP,
        mode: "liquid",
        intensity: 46,
        speed: 0.75,
        displacement: 52,
    },
    Vortex: {
        ...INITIAL_VISUAL_WARP,
        mode: "vortex",
        intensity: 58,
        speed: 0.7,
        displacement: 42,
        perspective: 28,
    },
    Pulse: {
        ...INITIAL_VISUAL_WARP,
        mode: "pulse",
        intensity: 44,
        speed: 1.6,
        displacement: 18,
    },
    Glitch: {
        ...INITIAL_VISUAL_WARP,
        mode: "glitch",
        intensity: 66,
        speed: 3.4,
        displacement: 40,
        scanlines: true,
    },
    Rubber: {
        ...INITIAL_VISUAL_WARP,
        mode: "rubber",
        intensity: 52,
        speed: 1.2,
        displacement: 30,
    },
    Drift: {
        ...INITIAL_VISUAL_WARP,
        mode: "drift",
        intensity: 36,
        speed: 0.45,
        displacement: 20,
    },
};

const VIDEO_PRESETS = {
    Natural: {
        ...INITIAL_VIDEO_EFFECTS,
    },
    Cinema: {
        ...INITIAL_VIDEO_EFFECTS,
        brightness: 92,
        contrast: 118,
        saturation: 112,
        sepia: 8,
    },
    Vivid: {
        ...INITIAL_VIDEO_EFFECTS,
        brightness: 104,
        contrast: 114,
        saturation: 145,
    },
    Noir: {
        ...INITIAL_VIDEO_EFFECTS,
        contrast: 125,
        grayscale: 100,
    },
    Warm: {
        ...INITIAL_VIDEO_EFFECTS,
        brightness: 102,
        contrast: 105,
        saturation: 118,
        sepia: 22,
        hue: -8,
    },
    Dream: {
        ...INITIAL_VIDEO_EFFECTS,
        brightness: 108,
        saturation: 118,
        blur: 1.4,
        sepia: 12,
    },
};

const softButtonSx = {
    borderRadius: 999,
    color: "white",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.055)",
    "&:hover": {
        backgroundColor: "rgba(255,255,255,0.1)",
    },
};

const iconButtonSx = {
    color: "white",
    border: "1px solid rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
    "&:hover": {
        backgroundColor: "rgba(255,255,255,0.11)",
    },
};

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    }

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "Unknown size";
    }

    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${
        units[unitIndex]
    }`;
}

function isArchiveUrl(value) {
    try {
        const url = new URL(value);
        const hostname = url.hostname.toLowerCase();

        return (
            hostname === "archive.org" ||
            hostname.endsWith(".archive.org") ||
            hostname === "web.archive.org" ||
            hostname.endsWith(".web.archive.org")
        );
    } catch {
        return false;
    }
}

function isHlsUrl(value) {
    try {
        const url = new URL(value, window.location.href);
        return url.pathname.toLowerCase().endsWith(".m3u8");
    } catch {
        return String(value || "")
            .toLowerCase()
            .includes(".m3u8");
    }
}

function isIOSDevice() {
    if (typeof navigator === "undefined") {
        return false;
    }

    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
}

function isUsablePosterUrl(value) {
    const posterUrl = String(value || "").trim();
    if (!posterUrl) {
        return false;
    }

    const lower = posterUrl.toLowerCase();
    return ![
        "__ia_thumb",
        "_thumb",
        "thumbs",
        "thumbnail",
        "spectrogram",
        "waveform",
        "_itemimage",
    ].some((term) => lower.includes(term));
}

function readStoredPlayerState() {
    try {
        const parsed = JSON.parse(
            localStorage.getItem(VIDEO_PLAYER_STATE_STORAGE_KEY) || "null"
        );

        if (!parsed || parsed.version !== PLAYER_STATE_VERSION) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

function writeStoredPlayerState(state) {
    try {
        if (!state?.source || String(state.source).startsWith("blob:")) {
            return;
        }

        localStorage.setItem(
            VIDEO_PLAYER_STATE_STORAGE_KEY,
            JSON.stringify({
                ...state,
                version: PLAYER_STATE_VERSION,
                savedAt: Date.now(),
            })
        );
    } catch {
        // Playback still works when localStorage is unavailable.
    }
}

async function fetchArchiveMetadataJson(targetUrl) {
    try {
        const response = await fetch(targetUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "omit",
            cache: "no-store",
            mode: "cors",
        });

        if (!response.ok) {
            throw new Error(
                `Archive returned HTTP ${response.status} ${response.statusText || "metadata error"}.`
            );
        }

        const data = await response.json();
        if (!data || typeof data !== "object") {
            throw new Error("Archive returned invalid metadata JSON.");
        }

        return data;
    } catch (error) {
        throw new Error(error?.message || "Direct Archive metadata request failed.");
    }
}

function buildArchiveMediaCandidates(value) {
    const candidates = [];
    const add = (candidate) => {
        const clean = String(candidate || "").trim();
        if (clean && !candidates.includes(clean)) {
            candidates.push(clean);
        }
    };

    add(value);

    try {
        const url = new URL(value);
        if (url.hostname === "archive.org") {
            if (url.pathname.startsWith("/download/")) {
                const serveUrl = new URL(url.toString());
                serveUrl.pathname = serveUrl.pathname.replace(/^\/download\//, "/serve/");
                add(serveUrl.toString());
            } else if (url.pathname.startsWith("/serve/")) {
                const downloadUrl = new URL(url.toString());
                downloadUrl.pathname = downloadUrl.pathname.replace(/^\/serve\//, "/download/");
                add(downloadUrl.toString());
            }
        }
    } catch {
        // The original candidate remains available.
    }

    return candidates;
}

function makePlaylistItemId(url) {
    let hash = 2166136261;
    const text = String(url || "");

    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return `video-${(hash >>> 0).toString(36)}`;
}

function normalizePlaylistItem(item) {
    const url = String(item?.url || "").trim();

    if (!url) {
        return null;
    }

    return {
        id: String(item?.id || makePlaylistItemId(url)),
        url,
        label: String(item?.label || item?.fileName || "Untitled video"),
        fileName: String(item?.fileName || ""),
        posterUrl: isUsablePosterUrl(item?.posterUrl)
            ? String(item.posterUrl)
            : "",
        sourceType: String(item?.sourceType || (isArchiveUrl(url) ? "Archive.org" : "Remote URL")),
        detailsUrl: String(item?.detailsUrl || ""),
        archiveIdentifier: String(item?.archiveIdentifier || ""),
        size: Number(item?.size || 0),
    };
}

function appendUniquePlaylistItems(currentItems, newItems) {
    const itemsByUrl = new Map();

    [...currentItems, ...newItems].forEach((item) => {
        const normalized = normalizePlaylistItem(item);
        if (normalized) {
            itemsByUrl.set(normalized.url, normalized);
        }
    });

    return Array.from(itemsByUrl.values());
}

function makeVideoPlaylistId(name = "playlist") {
    const seed = `${name}-${Date.now()}-${Math.random()}`;
    let hash = 2166136261;

    for (let index = 0; index < seed.length; index += 1) {
        hash ^= seed.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return `playlist-${(hash >>> 0).toString(36)}`;
}

function normalizeVideoPlaylist(value, fallbackName = "My Playlist") {
    const items = Array.isArray(value?.items)
        ? value.items.map(normalizePlaylistItem).filter(Boolean)
        : [];
    const name = String(value?.name || fallbackName).trim() || fallbackName;
    const createdAt = Number(value?.createdAt || Date.now());

    return {
        id: String(value?.id || makeVideoPlaylistId(name)),
        name,
        items,
        createdAt,
        updatedAt: Number(value?.updatedAt || createdAt),
    };
}

function createDefaultVideoPlaylist(items = []) {
    return normalizeVideoPlaylist({
        id: "playlist-default",
        name: "My Playlist",
        items,
    });
}

function readLegacyVideoPlaylist() {
    try {
        const parsed = JSON.parse(
            localStorage.getItem(VIDEO_PLAYLIST_STORAGE_KEY) || "[]"
        );

        return Array.isArray(parsed)
            ? parsed.map(normalizePlaylistItem).filter(Boolean)
            : [];
    } catch {
        return [];
    }
}

function normalizeVideoPlaylistLibrary(value) {
    const rawPlaylists = Array.isArray(value?.playlists)
        ? value.playlists
        : [];
    const playlists = rawPlaylists
        .map((playlist, index) =>
            normalizeVideoPlaylist(playlist, `Playlist ${index + 1}`)
        )
        .filter(Boolean);
    const safePlaylists = playlists.length
        ? playlists
        : [createDefaultVideoPlaylist()];
    const requestedActiveId = String(value?.activePlaylistId || "");
    const activePlaylistId = safePlaylists.some(
        (playlist) => playlist.id === requestedActiveId
    )
        ? requestedActiveId
        : safePlaylists[0].id;

    return {
        version: VIDEO_PLAYLIST_LIBRARY_VERSION,
        activePlaylistId,
        playlists: safePlaylists,
    };
}

function readStoredVideoPlaylistLibrary() {
    let library = null;

    try {
        const parsed = JSON.parse(
            localStorage.getItem(VIDEO_PLAYLIST_LIBRARY_STORAGE_KEY) || "null"
        );

        if (
            parsed &&
            parsed.version === VIDEO_PLAYLIST_LIBRARY_VERSION &&
            Array.isArray(parsed.playlists)
        ) {
            library = normalizeVideoPlaylistLibrary(parsed);
        }
    } catch {
        // Fall through to the legacy single-playlist migration.
    }

    if (!library) {
        const migratedPlaylist = createDefaultVideoPlaylist(
            readLegacyVideoPlaylist()
        );

        return normalizeVideoPlaylistLibrary({
            activePlaylistId: migratedPlaylist.id,
            playlists: [migratedPlaylist],
        });
    }

    // Archive.js historically wrote only the legacy single-playlist key.
    // Merge that synchronized key into the active named playlist so videos
    // added from /archive are visible immediately when /player mounts.
    const legacyItems = readLegacyVideoPlaylist();
    if (!legacyItems.length) {
        return library;
    }

    return {
        ...library,
        playlists: library.playlists.map((playlist) =>
            playlist.id === library.activePlaylistId
                ? {
                    ...playlist,
                    items: appendUniquePlaylistItems(
                        playlist.items,
                        legacyItems
                    ),
                    updatedAt: Date.now(),
                }
                : playlist
        ),
    };
}

function readPlayerHandoff() {
    try {
        const parsed = JSON.parse(
            sessionStorage.getItem(PLAYER_HANDOFF_STORAGE_KEY) || "null"
        );

        if (
            !parsed ||
            parsed.version !== 1 ||
            !parsed.item ||
            Date.now() - Number(parsed.createdAt || 0) > 5 * 60 * 1000
        ) {
            sessionStorage.removeItem(PLAYER_HANDOFF_STORAGE_KEY);
            return null;
        }

        return {
            item: normalizePlaylistItem(parsed.item),
            autoplay: parsed.autoplay !== false,
        };
    } catch {
        return null;
    }
}

function clearPlayerHandoff() {
    try {
        sessionStorage.removeItem(PLAYER_HANDOFF_STORAGE_KEY);
    } catch {
        // Nothing to clear when sessionStorage is unavailable.
    }
}

function writeStoredVideoPlaylistLibrary(value) {
    try {
        const normalized = normalizeVideoPlaylistLibrary(value);
        const persistentPlaylists = normalized.playlists.map((playlist) => ({
            ...playlist,
            items: playlist.items.filter(
                (item) => item?.url && !String(item.url).startsWith("blob:")
            ),
        }));
        const persistentState = {
            ...normalized,
            playlists: persistentPlaylists,
        };
        const activePlaylist = persistentPlaylists.find(
            (playlist) => playlist.id === persistentState.activePlaylistId
        );

        localStorage.setItem(
            VIDEO_PLAYLIST_LIBRARY_STORAGE_KEY,
            JSON.stringify(persistentState)
        );

        // Keep the original single-playlist key synchronized so older Archive
        // and Video pages can continue adding to and reading the active list.
        localStorage.setItem(
            VIDEO_PLAYLIST_STORAGE_KEY,
            JSON.stringify(activePlaylist?.items || [])
        );
    } catch {
        // The in-memory playlist library still works without localStorage.
    }
}

function getArchiveDetailsIdentifier(value) {
    try {
        const url = new URL(value);
        const match = url.pathname.match(/^\/details\/([^/?#]+)/i);
        return match ? decodeURIComponent(match[1]) : "";
    } catch {
        return "";
    }
}

function getArchiveFileScore(file) {
    const name = String(file?.name || "").toLowerCase();
    const format = String(file?.format || "").toLowerCase();
    const size = Number(file?.size || 0);

    if (
        !name ||
        ARCHIVE_BLOCKED_FILE_TERMS.some((term) => name.includes(term))
    ) {
        return -Infinity;
    }

    const extension = ARCHIVE_PLAYABLE_EXTENSIONS.find((value) =>
        name.endsWith(value)
    );

    if (!extension && !/h\.264|mpeg4|webm|ogg video|theora/.test(format)) {
        return -Infinity;
    }

    let score = size > 0 ? Math.min(45, Math.log10(size) * 8) : 0;
    if (name.endsWith(".mp4")) score += 90;
    if (format.includes("h.264")) score += 75;
    if (format.includes("512kb")) score += 45;
    if (name.endsWith(".webm")) score += 35;
    if (name.includes("_512kb")) score += 30;

    return score;
}

async function resolveArchivePlayableUrl(value) {
    const identifier = getArchiveDetailsIdentifier(value);

    if (!identifier) {
        return {
            url: value,
            label: "",
            size: 0,
        };
    }

    const metadataTarget = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
    const metadata = await fetchArchiveMetadataJson(metadataTarget);
    const files = Array.isArray(metadata?.files) ? metadata.files : [];
    const bestFile = files
        .map((file) => ({ file, score: getArchiveFileScore(file) }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((left, right) => right.score - left.score)[0]?.file;

    if (!bestFile?.name) {
        throw new Error(
            "This Archive item does not contain a browser-playable MP4, WebM, or Ogg video derivative."
        );
    }

    const encodedFileName = String(bestFile.name)
        .split("/")
        .filter(Boolean)
        .map((part) => encodeURIComponent(part))
        .join("/");

    return {
        url: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodedFileName}`,
        label: String(metadata?.metadata?.title || bestFile.name),
        size: Number(bestFile.size || 0),
    };
}

function buildVideoFilter(effects) {
    return [
        `brightness(${effects.brightness}%)`,
        `contrast(${effects.contrast}%)`,
        `saturate(${effects.saturation}%)`,
        `hue-rotate(${effects.hue}deg)`,
        `blur(${effects.blur}px)`,
        `grayscale(${effects.grayscale}%)`,
        `sepia(${effects.sepia}%)`,
        `invert(${effects.invert}%)`,
    ].join(" ");
}

function sanitizeVttText(value) {
    return String(value || "")
        .replace(/-->/g, "→")
        .replace(/\r?\n+/g, " ")
        .trim();
}

function secondsToVttTime(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const wholeSeconds = Math.floor(safe % 60);
    const milliseconds = Math.floor((safe - Math.floor(safe)) * 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
    )}:${String(wholeSeconds).padStart(2, "0")}.${String(milliseconds).padStart(
        3,
        "0"
    )}`;
}

function cuesToVtt(cues) {
    const lines = ["WEBVTT", ""];

    cues.forEach((cue, index) => {
        lines.push(String(index + 1));
        lines.push(
            `${secondsToVttTime(cue.start)} --> ${secondsToVttTime(cue.end)}`
        );
        lines.push(sanitizeVttText(cue.text));
        lines.push("");
    });

    return lines.join("\n");
}

function downloadTextFile(filename, text, type = "text/plain;charset=utf-8") {
    const blob = new Blob([text], { type });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(objectUrl);
}

function mixAudioBufferToMono(audioBuffer) {
    const channelCount = audioBuffer.numberOfChannels;
    const output = new Float32Array(audioBuffer.length);

    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
        const channelData = audioBuffer.getChannelData(channelIndex);

        for (let sampleIndex = 0; sampleIndex < output.length; sampleIndex += 1) {
            output[sampleIndex] += channelData[sampleIndex] / channelCount;
        }
    }

    return output;
}

function resampleLinear(input, sourceRate, targetRate = 16000) {
    if (sourceRate === targetRate) {
        return input;
    }

    const ratio = sourceRate / targetRate;
    const outputLength = Math.max(1, Math.round(input.length / ratio));
    const output = new Float32Array(outputLength);

    for (let index = 0; index < outputLength; index += 1) {
        const sourcePosition = index * ratio;
        const lowerIndex = Math.floor(sourcePosition);
        const upperIndex = Math.min(input.length - 1, lowerIndex + 1);
        const fraction = sourcePosition - lowerIndex;

        output[index] =
            input[lowerIndex] * (1 - fraction) + input[upperIndex] * fraction;
    }

    return output;
}

function normalizeWhisperCues(result, fallbackDuration) {
    const rawChunks = Array.isArray(result?.chunks) ? result.chunks : [];

    if (rawChunks.length > 0) {
        const cues = rawChunks
            .map((chunk, index) => {
                const timestamp = Array.isArray(chunk.timestamp)
                    ? chunk.timestamp
                    : [0, null];
                const start = Math.max(0, Number(timestamp[0]) || 0);
                const rawEnd = Number(timestamp[1]);
                const nextChunk = rawChunks[index + 1];
                const nextStart = Array.isArray(nextChunk?.timestamp)
                    ? Number(nextChunk.timestamp[0])
                    : NaN;
                const fallbackEnd = Number.isFinite(nextStart)
                    ? nextStart
                    : Math.min(
                        Number.isFinite(fallbackDuration)
                            ? fallbackDuration
                            : start + 8,
                        start + 12
                    );
                const end = Math.max(
                    start + 0.25,
                    Number.isFinite(rawEnd) ? rawEnd : fallbackEnd
                );

                return {
                    start,
                    end,
                    text: String(chunk.text || "").trim(),
                };
            })
            .filter((cue) => cue.text);

        if (cues.length > 0) {
            return cues;
        }
    }

    const text = String(result?.text || "").trim();

    if (!text) {
        return [];
    }

    return [
        {
            start: 0,
            end: Math.max(1, Number(fallbackDuration) || 30),
            text,
        },
    ];
}

function getLfoValue(phase, shape) {
    const normalized = ((phase / (Math.PI * 2)) % 1 + 1) % 1;

    switch (shape) {
        case "triangle":
            return 1 - 4 * Math.abs(normalized - 0.5);
        case "square":
            return normalized < 0.5 ? 1 : -1;
        case "saw":
            return normalized * 2 - 1;
        default:
            return Math.sin(phase);
    }
}

function EffectSlider({ label, value, minimum, maximum, step = 1, unit, onChange }) {
    return (
        <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
                    {label}
                </Typography>
                <Typography
                    sx={{
                        color: "rgba(255,255,255,0.58)",
                        fontSize: 12,
                        fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    }}
                >
                    {value}
                    {unit}
                </Typography>
            </Stack>

            <Slider
                value={value}
                min={minimum}
                max={maximum}
                step={step}
                onChange={(_, nextValue) => onChange(Number(nextValue))}
                size="small"
                sx={{
                    color: "#9ee8ff",
                    "& .MuiSlider-rail": {
                        opacity: 0.18,
                    },
                }}
            />
        </Stack>
    );
}

function StatusLog({ logs }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 1.5,
                minHeight: 140,
                maxHeight: 230,
                overflow: "auto",
                borderRadius: 3,
                backgroundColor: "rgba(0,0,0,0.34)",
                border: "1px solid rgba(255,255,255,0.1)",
            }}
        >
            <Stack spacing={0.75}>
                {logs.length > 0 ? (
                    logs.map((line) => (
                        <Typography
                            key={line.id}
                            sx={{
                                color: "rgba(255,255,255,0.7)",
                                fontFamily:
                                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                fontSize: 12,
                                lineHeight: 1.55,
                            }}
                        >
                            {line.text}
                        </Typography>
                    ))
                ) : (
                    <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>
                        Player and translation status messages appear here.
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
}


const DAW_PANEL_SX = {
    overflow: "hidden",
    borderRadius: 2.5,
    border: "1px solid rgba(255,255,255,0.1)",
    background:
        "linear-gradient(180deg, rgba(20,25,38,0.98), rgba(8,11,18,0.98))",
    boxShadow:
        "0 18px 55px rgba(0,0,0,0.34), inset 0 1px rgba(255,255,255,0.035)",
};

const DAW_SECTION_SX = {
    p: 1.5,
    borderRadius: 2,
    border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.025)",
};

const monoTextSx = {
    fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
};

function DawPanel({ title, eyebrow, icon, action, children, sx }) {
    return (
        <Paper elevation={0} sx={{ ...DAW_PANEL_SX, ...sx }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1.5}
                sx={{
                    minHeight: 43,
                    px: 1.5,
                    py: 0.8,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    background:
                        "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015))",
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                    {icon && (
                        <Box sx={{ color: "#9ee8ff", display: "grid", placeItems: "center" }}>
                            {icon}
                        </Box>
                    )}
                    <Box minWidth={0}>
                        {eyebrow && (
                            <Typography
                                sx={{
                                    color: "rgba(255,255,255,0.42)",
                                    fontSize: 9,
                                    fontWeight: 1000,
                                    letterSpacing: 1.25,
                                    lineHeight: 1.1,
                                    textTransform: "uppercase",
                                }}
                            >
                                {eyebrow}
                            </Typography>
                        )}
                        <Typography
                            noWrap
                            sx={{
                                color: "white",
                                fontSize: 13,
                                fontWeight: 1000,
                                letterSpacing: 0.25,
                            }}
                        >
                            {title}
                        </Typography>
                    </Box>
                </Stack>
                {action}
            </Stack>
            <Box sx={{ p: 1.5 }}>{children}</Box>
        </Paper>
    );
}

function DawSection({ title, subtitle, icon, children, sx }) {
    return (
        <Box sx={{ ...DAW_SECTION_SX, ...sx }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                {icon && <Box sx={{ color: "#b38cff", display: "grid" }}>{icon}</Box>}
                <Box minWidth={0}>
                    <Typography
                        sx={{
                            color: "rgba(255,255,255,0.92)",
                            fontSize: 12,
                            fontWeight: 1000,
                            textTransform: "uppercase",
                            letterSpacing: 0.8,
                        }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography
                            sx={{
                                color: "rgba(255,255,255,0.42)",
                                fontSize: 10.5,
                                lineHeight: 1.4,
                            }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Stack>
            {children}
        </Box>
    );
}

function SignalNode({ label, detail, active = true }) {
    return (
        <Stack
            spacing={0.35}
            alignItems="center"
            sx={{ minWidth: 56, position: "relative", zIndex: 1 }}
        >
            <Box
                sx={{
                    width: 42,
                    height: 26,
                    borderRadius: 1.25,
                    display: "grid",
                    placeItems: "center",
                    color: active ? "#07111f" : "rgba(255,255,255,0.48)",
                    fontSize: 9,
                    fontWeight: 1000,
                    border: active
                        ? "1px solid rgba(158,232,255,0.55)"
                        : "1px solid rgba(255,255,255,0.12)",
                    background: active
                        ? "linear-gradient(135deg, #9ee8ff, #b38cff)"
                        : "rgba(255,255,255,0.035)",
                    boxShadow: active ? "0 0 18px rgba(158,232,255,0.14)" : "none",
                }}
            >
                {label.slice(0, 3).toUpperCase()}
            </Box>
            <Typography
                sx={{
                    color: active ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.36)",
                    fontSize: 8.5,
                    fontWeight: 900,
                    textAlign: "center",
                }}
            >
                {label}
            </Typography>
            {detail && (
                <Typography sx={{ color: "rgba(255,255,255,0.32)", fontSize: 8 }}>
                    {detail}
                </Typography>
            )}
        </Stack>
    );
}

function VerticalFader({ label, value, minimum, maximum, step, unit, onChange }) {
    return (
        <Stack alignItems="center" spacing={0.75} sx={{ minWidth: 54 }}>
            <Typography
                sx={{
                    color: "rgba(255,255,255,0.62)",
                    fontSize: 9,
                    fontWeight: 1000,
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                }}
            >
                {label}
            </Typography>
            <Box sx={{ height: 142, display: "flex", alignItems: "center" }}>
                <Slider
                    orientation="vertical"
                    value={value}
                    min={minimum}
                    max={maximum}
                    step={step}
                    onChange={(_, nextValue) => onChange(Number(nextValue))}
                    sx={{
                        color: "#9ee8ff",
                        "& .MuiSlider-thumb": {
                            width: 20,
                            height: 10,
                            borderRadius: 1,
                            background: "linear-gradient(180deg, #f7fbff, #a7b4c4)",
                            border: "1px solid rgba(0,0,0,0.65)",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.65)",
                        },
                        "& .MuiSlider-track": { width: 4 },
                        "& .MuiSlider-rail": { width: 4, opacity: 0.22 },
                    }}
                />
            </Box>
            <Typography
                sx={{
                    ...monoTextSx,
                    minWidth: 44,
                    px: 0.55,
                    py: 0.3,
                    borderRadius: 0.8,
                    color: "#aeeeff",
                    backgroundColor: "rgba(0,0,0,0.42)",
                    border: "1px solid rgba(158,232,255,0.14)",
                    fontSize: 9,
                    textAlign: "center",
                }}
            >
                {Number(value).toFixed(step < 1 ? 2 : 0)}{unit}
            </Typography>
        </Stack>
    );
}

function MiniMeter({ value = 0, label }) {
    const normalized = clamp(Number(value) || 0, 0, 1);
    return (
        <Stack spacing={0.5} alignItems="center">
            <Box
                sx={{
                    position: "relative",
                    width: 9,
                    height: 142,
                    overflow: "hidden",
                    borderRadius: 99,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background:
                        "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 3px, transparent 3px 5px)",
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        left: 1,
                        right: 1,
                        bottom: 1,
                        height: `${normalized * 100}%`,
                        borderRadius: 99,
                        background:
                            "linear-gradient(0deg, #6df5a6 0%, #e7f56d 68%, #ff8c7a 100%)",
                        boxShadow: "0 0 8px rgba(109,245,166,0.34)",
                        transition: "height 80ms linear",
                    }}
                />
            </Box>
            <Typography sx={{ color: "rgba(255,255,255,0.38)", fontSize: 8 }}>
                {label}
            </Typography>
        </Stack>
    );
}

export default function Player() {
    useEffect(() => {
        console.info(`[Player] ${PLAYER_MEDIA_BUILD}: Archive uses native media without crossOrigin.`);
    }, []);

    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const hlsRef = useRef(null);
    const objectUrlRef = useRef("");
    const localFileRef = useRef(null);
    const audioContextRef = useRef(null);
    const mediaSourceNodeRef = useRef(null);
    const bassNodeRef = useRef(null);
    const midNodeRef = useRef(null);
    const trebleNodeRef = useRef(null);
    const pannerNodeRef = useRef(null);
    const soundTouchNodeRef = useRef(null);
    const masterGainNodeRef = useRef(null);
    const turbulenceRef = useRef(null);
    const displacementRef = useRef(null);
    const warpAnimationFrameRef = useRef(null);
    const warpReadoutTimeRef = useRef(0);
    const lastWarpFrameTimeRef = useRef(0);
    const smoothedTempoRef = useRef(1);
    const soundTouchUnderrunRef = useRef(0);
    const soundTouchMetricLogTimeRef = useRef(0);
    const lastAppliedTempoRef = useRef(1);
    const lastAppliedPitchRef = useRef(0);
    const lastAppliedFinePitchRef = useRef(0);
    const lastVideoTransformRef = useRef("");
    const lastVideoFilterRef = useRef("");
    const transcriberRef = useRef(null);
    const loadedModelIdRef = useRef("");
    const subtitleObjectUrlRef = useRef("");
    const lastSpokenCueRef = useRef(-1);
    const translationRunRef = useRef(0);
    const modelLoadRunRef = useRef(0);
    const pendingAutoplayRef = useRef(false);
    const pendingRestoreTimeRef = useRef(null);
    const pendingResumeAfterSeekRef = useRef(false);
    const playbackIntentRef = useRef("pause");
    const playbackCommandRef = useRef(0);
    const internalPauseUntilRef = useRef(0);
    const playlistBootstrapRef = useRef(false);
    const playerSurfaceRef = useRef(null);
    const controlsHideTimerRef = useRef(null);
    const surfaceClickTimerRef = useRef(null);
    const lastAudibleVolumeRef = useRef(1);
    const mediaSourceCandidatesRef = useRef([]);
    const mediaSourceCandidateIndexRef = useRef(0);
    const isScrubbingRef = useRef(false);
    const scrubWasPlayingRef = useRef(false);
    const scrubTimeRef = useRef(0);
    const playerSnapshotRef = useRef(null);
    const storedPlayerStateRef = useRef(readStoredPlayerState());

    const [urlInput, setUrlInput] = useState("");
    const [playlistState, setPlaylistState] = useState(() =>
        readStoredVideoPlaylistLibrary()
    );
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [playlistNameDraft, setPlaylistNameDraft] = useState("");
    const [editingPlaylistItemId, setEditingPlaylistItemId] = useState("");
    const [playlistItemDraft, setPlaylistItemDraft] = useState({
        label: "",
        url: "",
    });
    const [activePlaylistIndex, setActivePlaylistIndex] = useState(-1);
    const [playlistAutoplay, setPlaylistAutoplay] = useState(true);
    const [loadedSource, setLoadedSource] = useState("");
    const [originalSource, setOriginalSource] = useState("");
    const [sourceLabel, setSourceLabel] = useState("No video loaded");
    const [sourceType, setSourceType] = useState("none");
    const [fileSize, setFileSize] = useState(0);
    const [corsSafeSource, setCorsSafeSource] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubTime, setScrubTime] = useState(0);
    const [bufferedTime, setBufferedTime] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [playerMuted, setPlayerMuted] = useState(
        Boolean(storedPlayerStateRef.current?.muted)
    );
    const [playbackRate, setPlaybackRate] = useState(() =>
        clamp(Number(storedPlayerStateRef.current?.playbackRate) || 1, 0.25, 4)
    );
    const [smoothTempoEnabled, setSmoothTempoEnabled] = useState(
        storedPlayerStateRef.current?.smoothTempoEnabled !== false
    );
    const [tempoSmoothingMs, setTempoSmoothingMs] = useState(() =>
        clamp(
            Number(storedPlayerStateRef.current?.tempoSmoothingMs) || 180,
            20,
            800
        )
    );
    const [pitchSemitones, setPitchSemitones] = useState(0);
    const [finePitchCents, setFinePitchCents] = useState(0);
    const [timeWarp, setTimeWarp] = useState(INITIAL_TIME_WARP);
    const [pitchWarp, setPitchWarp] = useState(INITIAL_PITCH_WARP);
    const [visualWarp, setVisualWarp] = useState(INITIAL_VISUAL_WARP);
    const [liveWarpReadout, setLiveWarpReadout] = useState({
        tempo: 1,
        pitch: 0,
    });
    const [fitMode, setFitMode] = useState("contain");
    const [videoEffects, setVideoEffects] = useState(INITIAL_VIDEO_EFFECTS);
    const [audioEffects, setAudioEffects] = useState(() => ({
        ...INITIAL_AUDIO_EFFECTS,
        volume: clamp(
            Number(storedPlayerStateRef.current?.volume ?? INITIAL_AUDIO_EFFECTS.volume),
            0,
            1
        ),
    }));
    const [logs, setLogs] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [translationEnabled, setTranslationEnabled] = useState(false);
    const [muteOriginalForTranslation, setMuteOriginalForTranslation] =
        useState(true);
    const [englishVoiceEnabled, setEnglishVoiceEnabled] = useState(false);
    const [sourceLanguage, setSourceLanguage] = useState("auto");
    const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
    const [modelState, setModelState] = useState("not loaded");
    const [modelProgress, setModelProgress] = useState(0);
    const [translationState, setTranslationState] = useState("idle");
    const [translationProgress, setTranslationProgress] = useState(0);
    const [translatedText, setTranslatedText] = useState("");
    const [translatedCues, setTranslatedCues] = useState([]);
    const [subtitleUrl, setSubtitleUrl] = useState("");

    const isIOS = useMemo(() => isIOSDevice(), []);
    const activePlaylist = useMemo(
        () =>
            playlistState.playlists.find(
                (playlist) => playlist.id === playlistState.activePlaylistId
            ) || playlistState.playlists[0],
        [playlistState]
    );
    const playlist = activePlaylist?.items || [];
    const activePlaylistItem = useMemo(
        () => playlist[activePlaylistIndex] || null,
        [activePlaylistIndex, playlist]
    );

    const filterString = useMemo(
        () => buildVideoFilter(videoEffects),
        [videoEffects]
    );

    const archiveDetected = useMemo(
        () => isArchiveUrl(urlInput),
        [urlInput]
    );

    const addLog = useCallback((message) => {
        const stamp = new Date().toLocaleTimeString();

        setLogs((current) => [
            {
                id: `${Date.now()}-${Math.random()}`,
                text: `[${stamp}] ${message}`,
            },
            ...current,
        ].slice(0, 120));
    }, []);

    const setPlaylist = useCallback((nextItemsOrUpdater) => {
        setPlaylistState((current) => {
            const normalized = normalizeVideoPlaylistLibrary(current);
            const activeId = normalized.activePlaylistId;
            const nextPlaylists = normalized.playlists.map((playlist) => {
                if (playlist.id !== activeId) {
                    return playlist;
                }

                const nextItems =
                    typeof nextItemsOrUpdater === "function"
                        ? nextItemsOrUpdater(playlist.items)
                        : nextItemsOrUpdater;

                return {
                    ...playlist,
                    items: Array.isArray(nextItems)
                        ? nextItems.map(normalizePlaylistItem).filter(Boolean)
                        : playlist.items,
                    updatedAt: Date.now(),
                };
            });

            return {
                ...normalized,
                playlists: nextPlaylists,
            };
        });
    }, []);

    useEffect(() => {
        setPlaylistNameDraft(activePlaylist?.name || "");
        setEditingPlaylistItemId("");
        setPlaylistItemDraft({ label: "", url: "" });
    }, [activePlaylist?.id, activePlaylist?.name]);

    const destroyHls = useCallback(() => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    const revokeLocalObjectUrl = useCallback(() => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = "";
        }
    }, []);

    const clearSubtitles = useCallback(() => {
        if (subtitleObjectUrlRef.current) {
            URL.revokeObjectURL(subtitleObjectUrlRef.current);
            subtitleObjectUrlRef.current = "";
        }

        setSubtitleUrl("");
        setTranslatedCues([]);
        setTranslatedText("");
        lastSpokenCueRef.current = -1;

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    const resetMessages = useCallback(() => {
        setErrorMessage("");
        setSuccessMessage("");
    }, []);

    const pauseMediaInternally = useCallback((video = videoRef.current) => {
        if (!video) {
            return;
        }

        internalPauseUntilRef.current = performance.now() + 750;
        video.pause();
    }, []);

    const persistPausedStateNow = useCallback(() => {
        const video = videoRef.current;
        const snapshot = playerSnapshotRef.current;

        if (!snapshot?.source) {
            return;
        }

        writeStoredPlayerState({
            ...snapshot,
            currentTime: Number(video?.currentTime || snapshot.currentTime || 0),
            wasPlaying: false,
        });
    }, []);

    const restoreOriginalAudio = useCallback(() => {
        const video = videoRef.current;
        const selectedVolume = clamp(audioEffects.volume, 0, 1);
        const targetVolume = playerMuted ? 0 : selectedVolume;
        const context = audioContextRef.current;

        if (masterGainNodeRef.current && context) {
            masterGainNodeRef.current.gain.cancelScheduledValues(context.currentTime);
            masterGainNodeRef.current.gain.setTargetAtTime(
                targetVolume,
                context.currentTime,
                0.01
            );
        }

        if (video) {
            video.muted = playerMuted;
            video.volume = selectedVolume;
        }
    }, [audioEffects.volume, playerMuted]);

    const disableTranslationAudioMode = useCallback(() => {
        setTranslationEnabled(false);
        setMuteOriginalForTranslation(false);
        setEnglishVoiceEnabled(false);
        lastSpokenCueRef.current = -1;

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        restoreOriginalAudio();
    }, [restoreOriginalAudio]);

    const ensureAudioGraph = useCallback(async () => {
        const video = videoRef.current;

        if (!video) {
            return null;
        }

        if (!corsSafeSource) {
            // createMediaElementSource() forces cross-origin media without ACAO
            // to output silence. Keep Archive and opaque remote sources on the
            // native <video> audio path instead of attaching Web Audio.
            addLog(
                "Native media mode active: Web Audio was not attached because this source is not CORS-readable."
            );
            return null;
        }

        if (!audioContextRef.current) {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) {
                addLog("Web Audio API is not available in this browser.");
                return null;
            }

            const context = new AudioContextClass({
                latencyHint: "interactive",
            });
            const sourceNode = context.createMediaElementSource(video);
            const bassNode = context.createBiquadFilter();
            const midNode = context.createBiquadFilter();
            const trebleNode = context.createBiquadFilter();
            const pannerNode = context.createStereoPanner
                ? context.createStereoPanner()
                : null;
            const masterGainNode = context.createGain();


            bassNode.type = "lowshelf";
            bassNode.frequency.value = 180;

            midNode.type = "peaking";
            midNode.frequency.value = 1200;
            midNode.Q.value = 0.9;

            trebleNode.type = "highshelf";
            trebleNode.frequency.value = 4200;

            let soundTouchNode = null;

            if (context.audioWorklet) {
                let registrationError = null;

                for (const processorUrl of SOUNDTOUCH_PROCESSOR_URLS) {
                    try {
                        await SoundTouchNode.register(context, processorUrl);
                        soundTouchNode = new SoundTouchNode({ context });
                        addLog(
                            `SoundTouch AudioWorklet loaded from ${processorUrl}.`
                        );
                        break;
                    } catch (error) {
                        registrationError = error;
                    }
                }

                if (!soundTouchNode) {
                    addLog(
                        `SoundTouch AudioWorklet could not load: ${
                            registrationError?.message || "unknown worklet error"
                        }. Falling back to the browser's pitch-preserving playback rate.`
                    );
                }
            } else {
                addLog(
                    "AudioWorklet is unavailable. Independent pitch shifting is disabled in this browser."
                );
            }

            sourceNode.connect(bassNode);
            bassNode.connect(midNode);
            midNode.connect(trebleNode);

            let graphTail = trebleNode;

            if (pannerNode) {
                trebleNode.connect(pannerNode);
                graphTail = pannerNode;
            }

            if (soundTouchNode) {
                graphTail.connect(soundTouchNode);
                soundTouchNode.connect(masterGainNode);
            } else {
                graphTail.connect(masterGainNode);
            }

            masterGainNode.connect(context.destination);

            audioContextRef.current = context;
            mediaSourceNodeRef.current = sourceNode;
            bassNodeRef.current = bassNode;
            midNodeRef.current = midNode;
            trebleNodeRef.current = trebleNode;
            pannerNodeRef.current = pannerNode;
            soundTouchNodeRef.current = soundTouchNode;
            masterGainNodeRef.current = masterGainNode;

            video.preservesPitch = false;
            video.webkitPreservesPitch = false;
            video.mozPreservesPitch = false;
            video.volume = 1;
            video.muted = false;

            if (soundTouchNode) {
                const time = context.currentTime;
                const initialTempo = clamp(
                    Number(video.playbackRate || playbackRate),
                    0.25,
                    4
                );

                smoothedTempoRef.current = initialTempo;
                video.playbackRate = initialTempo;
                video.defaultPlaybackRate = initialTempo;
                soundTouchNode.playbackRate.setValueAtTime(initialTempo, time);
                soundTouchNode.pitchSemitones.setValueAtTime(
                    pitchSemitones,
                    time
                );
                soundTouchNode.pitch.setValueAtTime(
                    2 ** (finePitchCents / 1200),
                    time
                );

                soundTouchNode.addEventListener?.("metrics", (event) => {
                    const metrics = event?.detail;
                    const underrunCount = Number(metrics?.underrunCount || 0);
                    const now = performance.now();

                    if (
                        underrunCount > soundTouchUnderrunRef.current &&
                        now - soundTouchMetricLogTimeRef.current > 4000
                    ) {
                        soundTouchUnderrunRef.current = underrunCount;
                        soundTouchMetricLogTimeRef.current = now;
                        addLog(
                            `SoundTouch recovered from ${underrunCount} short audio render block${
                                underrunCount === 1 ? "" : "s"
                            }. Keep tempo nearer 1.0× if the source device is overloaded.`
                        );
                    }
                });
            }

            addLog(
                "Web Audio graph created for EQ, pan, tempo warp, pitch warp, and translation mute."
            );
        }

        if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume().catch(() => {});
        }

        return audioContextRef.current;
    }, [
        addLog,
        corsSafeSource,
        finePitchCents,
        pitchSemitones,
        playbackRate,
        sourceType,
    ]);

    const applyLoadedSource = useCallback(
        async ({
                   playableUrl,
                   originalUrl,
                   label,
                   type,
                   size = 0,
                   corsSafe = false,
                   sourceCandidates = [],
               }) => {
            const video = videoRef.current;

            if (!video) {
                return;
            }

            resetMessages();
            clearSubtitles();
            disableTranslationAudioMode();
            destroyHls();

            mediaSourceCandidatesRef.current = sourceCandidates.length
                ? sourceCandidates
                : [playableUrl];
            mediaSourceCandidateIndexRef.current = Math.max(
                0,
                mediaSourceCandidatesRef.current.indexOf(playableUrl)
            );

            pendingResumeAfterSeekRef.current = false;
            pauseMediaInternally(video);
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            setBufferedTime(0);
            setLoadedSource(playableUrl);
            setOriginalSource(originalUrl || playableUrl);
            setSourceLabel(label);
            setSourceType(type);
            setFileSize(size);
            setCorsSafeSource(corsSafe);

            if (corsSafe) {
                video.crossOrigin = "anonymous";
            } else {
                video.removeAttribute("crossorigin");
            }

            const hlsCandidate = isHlsUrl(originalUrl || playableUrl);

            if (hlsCandidate) {
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = playableUrl;
                    video.load();
                    addLog("Loaded HLS source using native browser playback.");
                } else if (Hls.isSupported()) {
                    const hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90,
                    });

                    hlsRef.current = hls;
                    hls.loadSource(playableUrl);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        addLog("HLS manifest parsed and attached to the player.");
                    });

                    hls.on(Hls.Events.ERROR, (_, data) => {
                        addLog(
                            `HLS ${data?.type || "unknown"} error: ${
                                data?.details || "unknown details"
                            }`
                        );

                        if (data?.fatal) {
                            setErrorMessage(
                                `The HLS stream failed: ${
                                    data?.details || "fatal HLS error"
                                }`
                            );
                        }
                    });
                } else {
                    setErrorMessage(
                        "This browser cannot play HLS and Hls.js is not supported here."
                    );
                    return;
                }
            } else {
                video.src = playableUrl;
                video.load();
                addLog(`Loaded ${type} video source.`);
            }

            setSuccessMessage(`${label} is ready.`);
        },
        [
            addLog,
            clearSubtitles,
            destroyHls,
            disableTranslationAudioMode,
            pauseMediaInternally,
            resetMessages,
        ]
    );

    const loadLocalFile = useCallback(
        async (file) => {
            if (!file) {
                return;
            }

            if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
                setErrorMessage("Choose a video or audio file.");
                return;
            }

            revokeLocalObjectUrl();

            playbackCommandRef.current += 1;
            playbackIntentRef.current = "pause";
            pendingAutoplayRef.current = false;
            pendingResumeAfterSeekRef.current = false;

            const objectUrl = URL.createObjectURL(file);
            objectUrlRef.current = objectUrl;
            localFileRef.current = file;

            await applyLoadedSource({
                playableUrl: objectUrl,
                originalUrl: objectUrl,
                label: file.name,
                type: "local file",
                size: file.size,
                corsSafe: true,
            });
        },
        [applyLoadedSource, revokeLocalObjectUrl]
    );

    const loadRemoteUrl = useCallback(
        async (
            value,
            {
                label = "",
                size = 0,
                autoplay = false,
                playlistIndex = -1,
            } = {}
        ) => {
            resetMessages();

            let parsedUrl;

            try {
                parsedUrl = new URL(String(value || "").trim());
            } catch {
                setErrorMessage("Enter a complete http:// or https:// video URL.");
                return false;
            }

            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                setErrorMessage("Only HTTP and HTTPS video URLs are supported.");
                return false;
            }

            revokeLocalObjectUrl();
            localFileRef.current = null;

            let resolvedUrl = parsedUrl.toString();
            let resolvedLabel = label;
            let resolvedSize = Number(size || 0);
            const archive = isArchiveUrl(resolvedUrl);

            try {
                if (archive) {
                    const resolvedArchive = await resolveArchivePlayableUrl(
                        resolvedUrl
                    );
                    resolvedUrl = resolvedArchive.url;
                    resolvedLabel = resolvedLabel || resolvedArchive.label;
                    resolvedSize = resolvedSize || resolvedArchive.size;
                }
            } catch (error) {
                setErrorMessage(`Archive link resolution failed: ${error.message}`);
                addLog(`Archive link resolution failed: ${error.message}`);
                return false;
            }

            const resolvedParsedUrl = new URL(resolvedUrl);
            const sourceCandidates = archive
                ? buildArchiveMediaCandidates(resolvedUrl)
                : [resolvedUrl];
            const playableUrl = sourceCandidates[0];

            playbackCommandRef.current += 1;
            playbackIntentRef.current = autoplay ? "play" : "pause";
            pendingAutoplayRef.current = Boolean(autoplay);
            pendingResumeAfterSeekRef.current = false;
            setUrlInput(resolvedUrl);

            await applyLoadedSource({
                playableUrl,
                originalUrl: resolvedUrl,
                label:
                    resolvedLabel ||
                    (archive
                        ? `Archive: ${resolvedParsedUrl.pathname.split("/").pop() || "video"}`
                        : resolvedParsedUrl.pathname.split("/").pop() ||
                        resolvedParsedUrl.hostname),
                type: archive ? "Archive.org direct" : "direct URL",
                size: resolvedSize,
                corsSafe:
                    resolvedParsedUrl.origin === window.location.origin,
                sourceCandidates,
            });

            setActivePlaylistIndex(playlistIndex);

            if (archive) {
                addLog(
                    "Archive media is streaming in native mode with direct download/serve range fallbacks. Web Audio remains detached unless the source explicitly allows CORS."
                );
            }

            return true;
        },
        [
            addLog,
            applyLoadedSource,
            resetMessages,
            revokeLocalObjectUrl,
        ]
    );

    const loadUrl = useCallback(async () => {
        await loadRemoteUrl(urlInput, {
            autoplay: false,
            playlistIndex: -1,
        });
    }, [loadRemoteUrl, urlInput]);

    const addUrlToPlaylist = useCallback(() => {
        let parsedUrl;

        try {
            parsedUrl = new URL(urlInput.trim());
        } catch {
            setErrorMessage("Enter a complete video URL before adding it to the playlist.");
            return;
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            setErrorMessage("Only HTTP and HTTPS playlist URLs are supported.");
            return;
        }

        const item = normalizePlaylistItem({
            url: parsedUrl.toString(),
            label: parsedUrl.pathname.split("/").pop() || parsedUrl.hostname,
            sourceType: isArchiveUrl(parsedUrl.toString())
                ? "Archive.org"
                : "Remote URL",
        });

        setPlaylist((current) => appendUniquePlaylistItems(current, [item]));
        setSuccessMessage(
            `Video added to “${activePlaylist?.name || "playlist"}”.`
        );
    }, [activePlaylist?.name, setPlaylist, urlInput]);

    const createVideoPlaylist = useCallback(() => {
        const requestedName = newPlaylistName.trim();
        const name =
            requestedName || `Playlist ${playlistState.playlists.length + 1}`;
        const nextPlaylist = normalizeVideoPlaylist({
            id: makeVideoPlaylistId(name),
            name,
            items: [],
        });

        setPlaylistState((current) => ({
            ...normalizeVideoPlaylistLibrary(current),
            activePlaylistId: nextPlaylist.id,
            playlists: [
                ...normalizeVideoPlaylistLibrary(current).playlists,
                nextPlaylist,
            ],
        }));
        setNewPlaylistName("");
        setPlaylistNameDraft(name);
        setActivePlaylistIndex(-1);
        setEditingPlaylistItemId("");
        setSuccessMessage(`Created playlist “${name}”.`);
    }, [newPlaylistName, playlistState.playlists.length]);

    const selectVideoPlaylist = useCallback((playlistId) => {
        setPlaylistState((current) => {
            const normalized = normalizeVideoPlaylistLibrary(current);

            if (!normalized.playlists.some((item) => item.id === playlistId)) {
                return normalized;
            }

            return {
                ...normalized,
                activePlaylistId: playlistId,
            };
        });
        setActivePlaylistIndex(-1);
        setEditingPlaylistItemId("");
    }, []);

    const renameActiveVideoPlaylist = useCallback(() => {
        const nextName = playlistNameDraft.trim();

        if (!nextName) {
            setErrorMessage("Enter a playlist name before saving it.");
            return;
        }

        setPlaylistState((current) => {
            const normalized = normalizeVideoPlaylistLibrary(current);

            return {
                ...normalized,
                playlists: normalized.playlists.map((playlist) =>
                    playlist.id === normalized.activePlaylistId
                        ? {
                            ...playlist,
                            name: nextName,
                            updatedAt: Date.now(),
                        }
                        : playlist
                ),
            };
        });
        setSuccessMessage(`Playlist renamed to “${nextName}”.`);
    }, [playlistNameDraft]);

    const duplicateActiveVideoPlaylist = useCallback(() => {
        if (!activePlaylist) {
            return;
        }

        const copyName = `${activePlaylist.name} Copy`;
        const copy = normalizeVideoPlaylist({
            id: makeVideoPlaylistId(copyName),
            name: copyName,
            items: activePlaylist.items.map((item) => ({ ...item })),
        });

        setPlaylistState((current) => {
            const normalized = normalizeVideoPlaylistLibrary(current);
            return {
                ...normalized,
                activePlaylistId: copy.id,
                playlists: [...normalized.playlists, copy],
            };
        });
        setActivePlaylistIndex(-1);
        setPlaylistNameDraft(copyName);
        setSuccessMessage(`Duplicated “${activePlaylist.name}”.`);
    }, [activePlaylist]);

    const deleteActiveVideoPlaylist = useCallback(() => {
        if (playlistState.playlists.length <= 1 || !activePlaylist) {
            setErrorMessage("Keep at least one playlist. Clear its videos instead.");
            return;
        }

        const deletedName = activePlaylist.name;

        setPlaylistState((current) => {
            const normalized = normalizeVideoPlaylistLibrary(current);
            const deletedIndex = normalized.playlists.findIndex(
                (playlist) => playlist.id === normalized.activePlaylistId
            );
            const remaining = normalized.playlists.filter(
                (playlist) => playlist.id !== normalized.activePlaylistId
            );
            const nextActive =
                remaining[Math.min(Math.max(deletedIndex, 0), remaining.length - 1)] ||
                remaining[0];

            return {
                ...normalized,
                activePlaylistId: nextActive.id,
                playlists: remaining,
            };
        });
        setActivePlaylistIndex(-1);
        setEditingPlaylistItemId("");
        setSuccessMessage(`Deleted playlist “${deletedName}”.`);
    }, [activePlaylist, playlistState.playlists.length]);

    const beginEditPlaylistItem = useCallback((item) => {
        setEditingPlaylistItemId(item.id);
        setPlaylistItemDraft({
            label: item.label,
            url: item.url,
        });
    }, []);

    const saveEditedPlaylistItem = useCallback(() => {
        const label = playlistItemDraft.label.trim();
        const urlText = playlistItemDraft.url.trim();
        let parsedUrl;

        try {
            parsedUrl = new URL(urlText);
        } catch {
            setErrorMessage("The edited playlist item needs a complete URL.");
            return;
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            setErrorMessage("Playlist video URLs must use HTTP or HTTPS.");
            return;
        }

        setPlaylist((current) =>
            current.map((item) =>
                item.id === editingPlaylistItemId
                    ? normalizePlaylistItem({
                        ...item,
                        url: parsedUrl.toString(),
                        label:
                            label ||
                            parsedUrl.pathname.split("/").pop() ||
                            parsedUrl.hostname,
                        sourceType: isArchiveUrl(parsedUrl.toString())
                            ? "Archive.org"
                            : item.sourceType || "Remote URL",
                    })
                    : item
            )
        );
        setEditingPlaylistItemId("");
        setPlaylistItemDraft({ label: "", url: "" });
        setSuccessMessage("Playlist video updated.");
    }, [editingPlaylistItemId, playlistItemDraft, setPlaylist]);

    const movePlaylistItem = useCallback(
        (fromIndex, direction) => {
            const toIndex = clamp(fromIndex + direction, 0, playlist.length - 1);

            if (fromIndex === toIndex) {
                return;
            }

            setPlaylist((current) => {
                const next = [...current];
                const [moved] = next.splice(fromIndex, 1);
                next.splice(toIndex, 0, moved);
                return next;
            });

            setActivePlaylistIndex((currentIndex) => {
                if (currentIndex === fromIndex) return toIndex;
                if (currentIndex === toIndex) return fromIndex;
                return currentIndex;
            });
        },
        [playlist.length, setPlaylist]
    );

    const pauseCurrentMedia = useCallback(() => {
        const video = videoRef.current;

        // Invalidate every async play request before pausing. This prevents a
        // delayed AudioContext resume, canplay event, seek completion, or
        // playlist source fallback from starting the media again.
        playbackCommandRef.current += 1;
        playbackIntentRef.current = "pause";
        pendingAutoplayRef.current = false;
        pendingResumeAfterSeekRef.current = false;
        scrubWasPlayingRef.current = false;

        if (video && !video.paused) {
            video.pause();
        }

        setIsPlaying(false);
        persistPausedStateNow();

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    }, [persistPausedStateNow]);

    const playCurrentMedia = useCallback(async () => {
        const video = videoRef.current;

        if (!video || !loadedSource) {
            setErrorMessage("Load a video before pressing play.");
            return false;
        }

        resetMessages();

        const commandId = playbackCommandRef.current + 1;
        playbackCommandRef.current = commandId;
        playbackIntentRef.current = "play";
        pendingAutoplayRef.current = false;
        pendingResumeAfterSeekRef.current = false;

        try {
            await ensureAudioGraph();

            if (
                playbackCommandRef.current !== commandId ||
                playbackIntentRef.current !== "play"
            ) {
                return false;
            }

            await video.play();

            // video.play() may resolve after the user has already pressed
            // Pause. Re-check the command generation and force the element
            // back to paused if this request is stale.
            if (
                playbackCommandRef.current !== commandId ||
                playbackIntentRef.current !== "play"
            ) {
                video.pause();
                return false;
            }

            return true;
        } catch (error) {
            if (playbackCommandRef.current === commandId) {
                playbackIntentRef.current = "pause";
                pendingAutoplayRef.current = false;
                setIsPlaying(false);
                setErrorMessage(`Playback failed: ${error.message}`);
                persistPausedStateNow();
            }
            return false;
        }
    }, [
        ensureAudioGraph,
        loadedSource,
        persistPausedStateNow,
        resetMessages,
    ]);

    const stopPlayback = useCallback(() => {
        const video = videoRef.current;

        playbackCommandRef.current += 1;
        playbackIntentRef.current = "pause";
        pendingAutoplayRef.current = false;
        pendingResumeAfterSeekRef.current = false;
        scrubWasPlayingRef.current = false;

        if (!video) {
            return;
        }

        video.pause();
        video.currentTime = 0;
        setCurrentTime(0);
        setScrubTime(0);
        scrubTimeRef.current = 0;
        setIsPlaying(false);
        lastSpokenCueRef.current = -1;
        persistPausedStateNow();

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    }, [persistPausedStateNow]);

    const togglePlayback = useCallback(async () => {
        const video = videoRef.current;

        if (!video || !loadedSource) {
            setErrorMessage("Load a video before pressing play.");
            return false;
        }

        if (!video.paused && playbackIntentRef.current === "play") {
            pauseCurrentMedia();
            return false;
        }

        return playCurrentMedia();
    }, [loadedSource, pauseCurrentMedia, playCurrentMedia]);

    const playPlaylistItem = useCallback(
        async (index, autoplay = true) => {
            const item = playlist[index];

            if (!item) {
                return false;
            }

            const isCurrentItem =
                index === activePlaylistIndex &&
                Boolean(loadedSource);

            // Never reload the active item just to play or pause it. Reloading
            // was the cause of the playlist Pause button immediately starting
            // the video again.
            if (isCurrentItem) {
                if (autoplay) {
                    return playCurrentMedia();
                }

                pauseCurrentMedia();
                return true;
            }

            return loadRemoteUrl(item.url, {
                label: item.label,
                size: item.size,
                autoplay,
                playlistIndex: index,
            });
        },
        [
            activePlaylistIndex,
            loadRemoteUrl,
            loadedSource,
            pauseCurrentMedia,
            playCurrentMedia,
            playlist,
        ]
    );

    const togglePlaylistItem = useCallback(
        async (index) => {
            const item = playlist[index];
            if (!item) {
                return false;
            }

            const video = videoRef.current;
            const isCurrentItem =
                index === activePlaylistIndex &&
                Boolean(loadedSource);

            if (isCurrentItem) {
                if (
                    video &&
                    !video.paused &&
                    playbackIntentRef.current === "play"
                ) {
                    pauseCurrentMedia();
                    return false;
                }

                return playCurrentMedia();
            }

            return playPlaylistItem(index, true);
        },
        [
            activePlaylistIndex,
            loadedSource,
            pauseCurrentMedia,
            playCurrentMedia,
            playPlaylistItem,
            playlist,
        ]
    );

    const playPreviousPlaylistItem = useCallback(() => {
        if (!playlist.length) return;
        const previousIndex =
            activePlaylistIndex > 0
                ? activePlaylistIndex - 1
                : Math.max(0, playlist.length - 1);
        playPlaylistItem(previousIndex, true);
    }, [activePlaylistIndex, playPlaylistItem, playlist.length]);

    const playNextPlaylistItem = useCallback(() => {
        if (!playlist.length) return;
        const nextIndex =
            activePlaylistIndex >= 0
                ? activePlaylistIndex + 1
                : 0;

        if (nextIndex < playlist.length) {
            playPlaylistItem(nextIndex, true);
        }
    }, [activePlaylistIndex, playPlaylistItem, playlist.length]);

    const removePlaylistItem = useCallback(
        (index) => {
            const removedItemId = playlist[index]?.id;

            setPlaylist((current) =>
                current.filter((_, itemIndex) => itemIndex !== index)
            );
            setActivePlaylistIndex((currentIndex) => {
                if (currentIndex === index) return -1;
                if (currentIndex > index) return currentIndex - 1;
                return currentIndex;
            });

            if (removedItemId && editingPlaylistItemId === removedItemId) {
                setEditingPlaylistItemId("");
                setPlaylistItemDraft({ label: "", url: "" });
            }
        },
        [editingPlaylistItemId, playlist, setPlaylist]
    );

    const clearPlaylist = useCallback(() => {
        setPlaylist([]);
        setActivePlaylistIndex(-1);
        setEditingPlaylistItemId("");
        setSuccessMessage(
            `Cleared videos from “${activePlaylist?.name || "playlist"}”.`
        );
    }, [activePlaylist?.name, setPlaylist]);

    const handlePlaylistEnded = useCallback(() => {
        playbackCommandRef.current += 1;
        playbackIntentRef.current = "pause";
        pendingAutoplayRef.current = false;
        pendingResumeAfterSeekRef.current = false;
        setIsPlaying(false);
        lastSpokenCueRef.current = -1;

        if (
            playlistAutoplay &&
            activePlaylistIndex >= 0 &&
            activePlaylistIndex < playlist.length - 1
        ) {
            playPlaylistItem(activePlaylistIndex + 1, true);
        }
    }, [
        activePlaylistIndex,
        playPlaylistItem,
        playlist.length,
        playlistAutoplay,
    ]);

    const attemptPendingAutoplay = useCallback(async () => {
        if (
            !pendingAutoplayRef.current ||
            playbackIntentRef.current !== "play"
        ) {
            pendingAutoplayRef.current = false;
            return;
        }

        pendingAutoplayRef.current = false;
        const started = await playCurrentMedia();

        if (!started && playbackIntentRef.current === "pause") {
            persistPausedStateNow();
        }
    }, [persistPausedStateNow, playCurrentMedia]);

    const seekBy = useCallback((seconds) => {
        const video = videoRef.current;

        if (!video || !Number.isFinite(video.duration)) {
            return;
        }

        video.currentTime = clamp(
            video.currentTime + seconds,
            0,
            video.duration
        );
        setCurrentTime(video.currentTime);
        lastSpokenCueRef.current = -1;

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    const beginScrub = useCallback(() => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(video.duration)) {
            return;
        }

        if (!isScrubbingRef.current) {
            isScrubbingRef.current = true;
            scrubWasPlayingRef.current =
                !video.paused && playbackIntentRef.current === "play";
            scrubTimeRef.current = video.currentTime || 0;
            setScrubTime(scrubTimeRef.current);
            setIsScrubbing(true);
            pauseMediaInternally(video);
        }
    }, [pauseMediaInternally]);

    const updateScrub = useCallback((nextValue) => {
        const video = videoRef.current;
        const maxTime = Number.isFinite(video?.duration) ? video.duration : duration;
        const nextTime = clamp(Number(nextValue) || 0, 0, Math.max(0, maxTime || 0));

        if (!isScrubbingRef.current) {
            beginScrub();
        }

        scrubTimeRef.current = nextTime;
        setScrubTime(nextTime);
        setCurrentTime(nextTime);

        if (video && video.readyState >= 1) {
            try {
                video.currentTime = nextTime;
            } catch {
                // The final pointer/touch release commits the exact seek.
            }
        }
    }, [beginScrub, duration]);

    const finishScrub = useCallback((nextValue = scrubTimeRef.current) => {
        if (!isScrubbingRef.current) {
            return;
        }

        const video = videoRef.current;
        const maxTime = Number.isFinite(video?.duration) ? video.duration : duration;
        const finalTime = clamp(Number(nextValue) || 0, 0, Math.max(0, maxTime || 0));
        const shouldResume =
            scrubWasPlayingRef.current &&
            playbackIntentRef.current === "play";

        isScrubbingRef.current = false;
        scrubWasPlayingRef.current = false;
        scrubTimeRef.current = finalTime;
        setScrubTime(finalTime);
        setCurrentTime(finalTime);
        setIsScrubbing(false);
        pendingResumeAfterSeekRef.current = shouldResume;

        if (!video) {
            pendingResumeAfterSeekRef.current = false;
            return;
        }

        try {
            video.currentTime = finalTime;
        } catch (error) {
            pendingResumeAfterSeekRef.current = false;
            setErrorMessage(`Seek failed: ${error.message}`);
            return;
        }

        if (Math.abs((video.currentTime || 0) - finalTime) < 0.04) {
            pendingResumeAfterSeekRef.current = false;
            if (shouldResume && playbackIntentRef.current === "play") {
                playCurrentMedia();
            } else {
                persistPausedStateNow();
            }
        }
    }, [duration, persistPausedStateNow, playCurrentMedia]);

    const handleVideoError = useCallback(() => {
        const video = videoRef.current;
        const candidates = mediaSourceCandidatesRef.current;
        const nextIndex = mediaSourceCandidateIndexRef.current + 1;

        if (video && nextIndex < candidates.length) {
            const restoreTime = Number(video.currentTime || currentTime || 0);
            const shouldResume = playbackIntentRef.current === "play";
            const nextSource = candidates[nextIndex];

            mediaSourceCandidateIndexRef.current = nextIndex;
            playbackCommandRef.current += 1;
            pendingRestoreTimeRef.current = restoreTime;
            pendingAutoplayRef.current = shouldResume;
            setLoadedSource(nextSource);
            video.src = nextSource;
            video.load();
            addLog(`Trying Archive range fallback ${nextIndex + 1}/${candidates.length}.`);
            return;
        }

        const mediaError = video?.error;
        setErrorMessage(
            `Video playback failed${mediaError ? ` with media error ${mediaError.code}` : ""}. ` +
            "The player used native cross-origin media mode and tried the Archive download/serve candidates. " +
            "The selected derivative may use an unsupported codec or may be temporarily unavailable on Archive."
        );
    }, [addLog, currentTime]);

    const requestPictureInPicture = useCallback(async () => {
        const video = videoRef.current;

        if (!video || !document.pictureInPictureEnabled) {
            setErrorMessage("Picture-in-picture is not supported in this browser.");
            return;
        }

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await video.requestPictureInPicture();
            }
        } catch (error) {
            setErrorMessage(`Picture-in-picture failed: ${error.message}`);
        }
    }, []);

    const requestFullscreen = useCallback(async () => {
        const video = videoRef.current;
        const surface = playerSurfaceRef.current;

        if (!video) {
            return;
        }

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else if (surface?.requestFullscreen) {
                await surface.requestFullscreen();
            } else if (surface?.webkitRequestFullscreen) {
                surface.webkitRequestFullscreen();
            } else if (video.webkitEnterFullscreen) {
                video.webkitEnterFullscreen();
            } else if (video.requestFullscreen) {
                await video.requestFullscreen();
            } else {
                throw new Error("Fullscreen is not available in this browser.");
            }
        } catch (error) {
            setErrorMessage(`Fullscreen failed: ${error.message}`);
        }
    }, []);

    const clearControlsHideTimer = useCallback(() => {
        if (controlsHideTimerRef.current) {
            window.clearTimeout(controlsHideTimerRef.current);
            controlsHideTimerRef.current = null;
        }
    }, []);

    const revealPlayerControls = useCallback((keepVisible = false) => {
        clearControlsHideTimer();
        setControlsVisible(true);

        const video = videoRef.current;
        if (
            !keepVisible &&
            video &&
            !video.paused &&
            !isScrubbingRef.current
        ) {
            controlsHideTimerRef.current = window.setTimeout(() => {
                setControlsVisible(false);
                controlsHideTimerRef.current = null;
            }, 2400);
        }
    }, [clearControlsHideTimer]);

    const togglePlayerMute = useCallback(() => {
        const selectedVolume = clamp(audioEffects.volume, 0, 1);

        if (playerMuted || selectedVolume <= 0.001) {
            const restoredVolume = clamp(
                lastAudibleVolumeRef.current || 0.8,
                0.01,
                1
            );
            setPlayerMuted(false);
            setAudioEffects((current) => ({
                ...current,
                volume: current.volume > 0.001 ? current.volume : restoredVolume,
            }));
        } else {
            lastAudibleVolumeRef.current = selectedVolume;
            setPlayerMuted(true);
        }

        revealPlayerControls();
    }, [audioEffects.volume, playerMuted, revealPlayerControls]);

    const changePlayerVolume = useCallback((nextValue) => {
        const nextVolume = clamp(Number(nextValue) || 0, 0, 1);

        if (nextVolume > 0.001) {
            lastAudibleVolumeRef.current = nextVolume;
            setPlayerMuted(false);
        } else {
            setPlayerMuted(true);
        }

        setAudioEffects((current) => ({
            ...current,
            volume: nextVolume,
        }));
        revealPlayerControls();
    }, [revealPlayerControls]);

    const handlePlayerSurfaceClick = useCallback((event) => {
        if (event.target.closest?.('[data-player-control="true"]')) {
            return;
        }

        revealPlayerControls();
        playerSurfaceRef.current?.focus?.({ preventScroll: true });

        if (surfaceClickTimerRef.current) {
            window.clearTimeout(surfaceClickTimerRef.current);
        }

        surfaceClickTimerRef.current = window.setTimeout(() => {
            surfaceClickTimerRef.current = null;
            togglePlayback();
        }, 180);
    }, [revealPlayerControls, togglePlayback]);

    const handlePlayerSurfaceDoubleClick = useCallback((event) => {
        if (event.target.closest?.('[data-player-control="true"]')) {
            return;
        }

        if (surfaceClickTimerRef.current) {
            window.clearTimeout(surfaceClickTimerRef.current);
            surfaceClickTimerRef.current = null;
        }

        requestFullscreen();
    }, [requestFullscreen]);

    const handlePlayerKeyDown = useCallback((event) => {
        const targetTag = event.target?.tagName?.toLowerCase();
        if (["input", "textarea", "select", "button"].includes(targetTag)) {
            return;
        }

        switch (event.key.toLowerCase()) {
            case " ":
            case "k":
                event.preventDefault();
                togglePlayback();
                break;
            case "arrowleft":
                event.preventDefault();
                seekBy(-5);
                break;
            case "arrowright":
                event.preventDefault();
                seekBy(5);
                break;
            case "j":
                event.preventDefault();
                seekBy(-10);
                break;
            case "l":
                event.preventDefault();
                seekBy(10);
                break;
            case "m":
                event.preventDefault();
                togglePlayerMute();
                break;
            case "f":
                event.preventDefault();
                requestFullscreen();
                break;
            default:
                return;
        }

        revealPlayerControls();
    }, [requestFullscreen, revealPlayerControls, seekBy, togglePlayback, togglePlayerMute]);

    const captureFrame = useCallback(() => {
        const video = videoRef.current;

        if (!video || !video.videoWidth || !video.videoHeight) {
            setErrorMessage("Play or seek the video before capturing a frame.");
            return;
        }

        try {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            const rotation = ((videoEffects.rotate % 360) + 360) % 360;
            const swapDimensions = rotation === 90 || rotation === 270;

            canvas.width = swapDimensions ? video.videoHeight : video.videoWidth;
            canvas.height = swapDimensions ? video.videoWidth : video.videoHeight;

            context.save();
            context.filter = filterString;
            context.translate(canvas.width / 2, canvas.height / 2);
            context.rotate((videoEffects.rotate * Math.PI) / 180);
            context.scale(videoEffects.zoom / 100, videoEffects.zoom / 100);
            context.drawImage(
                video,
                -video.videoWidth / 2,
                -video.videoHeight / 2,
                video.videoWidth,
                video.videoHeight
            );
            context.restore();

            canvas.toBlob((blob) => {
                if (!blob) {
                    setErrorMessage("The browser could not create the frame image.");
                    return;
                }

                const objectUrl = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = objectUrl;
                anchor.download = `video-frame-${Math.floor(
                    video.currentTime
                )}.png`;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                URL.revokeObjectURL(objectUrl);
                setSuccessMessage("Filtered frame exported as PNG.");
            }, "image/png");
        } catch (error) {
            setErrorMessage(
                `Frame capture failed. The remote server may block canvas access: ${error.message}`
            );
        }
    }, [filterString, videoEffects.rotate, videoEffects.zoom]);

    const setVideoEffect = useCallback((name, value) => {
        setVideoEffects((current) => ({
            ...current,
            [name]: value,
        }));
    }, []);

    const setAudioEffect = useCallback((name, value) => {
        const nextValue = Number(value);

        if (name === "volume") {
            const nextVolume = clamp(nextValue || 0, 0, 1);
            if (nextVolume > 0.001) {
                lastAudibleVolumeRef.current = nextVolume;
                setPlayerMuted(false);
            } else {
                setPlayerMuted(true);
            }
        }

        setAudioEffects((current) => ({
            ...current,
            [name]: value,
        }));
    }, []);

    const applyPreset = useCallback((presetName) => {
        const preset = VIDEO_PRESETS[presetName];

        if (preset) {
            setVideoEffects(preset);
        }
    }, []);

    const resetAllEffects = useCallback(() => {
        setVideoEffects(INITIAL_VIDEO_EFFECTS);
        setAudioEffects(INITIAL_AUDIO_EFFECTS);
        setPlaybackRate(1);
        setSmoothTempoEnabled(true);
        setTempoSmoothingMs(180);
        smoothedTempoRef.current = 1;
        setPitchSemitones(0);
        setFinePitchCents(0);
        setTimeWarp(INITIAL_TIME_WARP);
        setPitchWarp(INITIAL_PITCH_WARP);
        setVisualWarp(INITIAL_VISUAL_WARP);
        setLiveWarpReadout({
            tempo: 1,
            pitch: 0,
        });
        setFitMode("contain");
        setSuccessMessage("Video, audio, tempo, pitch, and animated warp effects reset.");
    }, []);

    const loadTranslationModel = useCallback(async () => {
        if (
            transcriberRef.current &&
            loadedModelIdRef.current === modelId
        ) {
            setModelState("ready");
            return transcriberRef.current;
        }

        const loadRunId = modelLoadRunRef.current + 1;
        modelLoadRunRef.current = loadRunId;
        setErrorMessage("");
        setModelState("loading module");
        setModelProgress(0);
        addLog(`Loading ${modelId} in the browser.`);

        try {
            const { env, pipeline } = await import("@huggingface/transformers");

            env.allowRemoteModels = true;
            env.allowLocalModels = false;
            env.useBrowserCache = true;

            if (
                transcriberRef.current &&
                loadedModelIdRef.current !== modelId &&
                transcriberRef.current.dispose
            ) {
                await transcriberRef.current.dispose().catch(() => {});
                transcriberRef.current = null;
                loadedModelIdRef.current = "";
            }

            const progressCallback = (progress) => {
                if (modelLoadRunRef.current !== loadRunId) {
                    return;
                }

                const numericProgress = Number(progress?.progress);
                if (Number.isFinite(numericProgress)) {
                    setModelProgress(
                        clamp(numericProgress <= 1 ? numericProgress * 100 : numericProgress, 0, 100)
                    );
                }

                if (progress?.status) {
                    setModelState(String(progress.status));
                }
            };

            const devices = navigator.gpu ? ["webgpu", "wasm"] : ["wasm"];
            let lastError = null;

            for (const device of devices) {
                if (modelLoadRunRef.current !== loadRunId) {
                    throw new Error("Model loading was cancelled.");
                }

                try {
                    setModelState(`loading on ${device}`);
                    const transcriber = await pipeline(
                        "automatic-speech-recognition",
                        modelId,
                        {
                            device,
                            progress_callback: progressCallback,
                        }
                    );

                    if (modelLoadRunRef.current !== loadRunId) {
                        if (transcriber?.dispose) {
                            await transcriber.dispose().catch(() => {});
                        }
                        throw new Error("Model loading was cancelled.");
                    }

                    transcriberRef.current = transcriber;
                    loadedModelIdRef.current = modelId;
                    setModelProgress(100);
                    setModelState(`ready on ${device}`);
                    addLog(`Whisper model ready on ${device}.`);
                    return transcriber;
                } catch (error) {
                    lastError = error;
                    addLog(`Whisper ${device} load failed: ${error.message}`);
                }
            }

            throw lastError || new Error("No supported model runtime was available.");
        } catch (error) {
            if (modelLoadRunRef.current === loadRunId) {
                setModelState("failed");
                setModelProgress(0);
                setErrorMessage(`Model loading failed: ${error.message}`);
                addLog(`Model loading failed: ${error.message}`);
            }
            throw error;
        }
    }, [addLog, modelId]);

    const readLoadedMediaAsArrayBuffer = useCallback(async () => {
        if (localFileRef.current) {
            return localFileRef.current.arrayBuffer();
        }

        if (!loadedSource) {
            throw new Error("Load a video first.");
        }

        if (isHlsUrl(originalSource || loadedSource)) {
            throw new Error(
                "HLS manifests cannot be decoded as one audio file in the browser. Use a direct MP4/WebM file for translation."
            );
        }

        const response = await fetch(loadedSource, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(
                `Media fetch returned HTTP ${response.status}. The remote host may require CORS or range support.`
            );
        }

        return response.arrayBuffer();
    }, [loadedSource, originalSource]);

    const decodeMediaToWhisperAudio = useCallback(async () => {
        setTranslationState("fetching media");
        setTranslationProgress(8);

        const arrayBuffer = await readLoadedMediaAsArrayBuffer();
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            throw new Error("Web Audio decoding is not available in this browser.");
        }

        const temporaryContext = new AudioContextClass();

        try {
            setTranslationState("decoding audio");
            setTranslationProgress(18);

            const decodedBuffer = await temporaryContext.decodeAudioData(
                arrayBuffer.slice(0)
            );

            if (decodedBuffer.duration > 60 * 60) {
                addLog(
                    "The video is longer than one hour. Browser translation may require substantial memory and time."
                );
            }

            setTranslationState("mixing channels");
            setTranslationProgress(28);

            const mono = mixAudioBufferToMono(decodedBuffer);

            setTranslationState("resampling to 16 kHz");
            setTranslationProgress(38);

            return {
                samples: resampleLinear(mono, decodedBuffer.sampleRate, 16000),
                decodedDuration: decodedBuffer.duration,
            };
        } finally {
            await temporaryContext.close().catch(() => {});
        }
    }, [addLog, readLoadedMediaAsArrayBuffer]);

    const translateVideoToEnglish = useCallback(async () => {
        if (!loadedSource) {
            setErrorMessage("Load a video before starting translation.");
            return;
        }

        if (!corsSafeSource && !localFileRef.current) {
            disableTranslationAudioMode();
            setErrorMessage(
                "Browser translation needs CORS-readable media bytes. This Archive stream can play natively, but JavaScript cannot decode it. Use a local file or a same-origin range proxy before translating."
            );
            return;
        }

        const runId = translationRunRef.current + 1;
        translationRunRef.current = runId;

        setErrorMessage("");
        setSuccessMessage("");
        setTranslationEnabled(true);
        setMuteOriginalForTranslation(true);
        setTranslationState("preparing");
        setTranslationProgress(2);
        clearSubtitles();

        try {
            const transcriber = await loadTranslationModel();

            if (translationRunRef.current !== runId) {
                return;
            }

            const { samples, decodedDuration } =
                await decodeMediaToWhisperAudio();

            if (translationRunRef.current !== runId) {
                return;
            }

            setTranslationState("translating speech to English");
            setTranslationProgress(48);
            addLog(
                `Running English translation on ${formatTime(
                    decodedDuration
                )} of audio.`
            );

            const options = {
                task: "translate",
                return_timestamps: true,
                chunk_length_s: 29,
                stride_length_s: 5,
            };

            if (sourceLanguage !== "auto") {
                options.language = sourceLanguage;
            }

            const result = await transcriber(samples, options);

            if (translationRunRef.current !== runId) {
                return;
            }

            setTranslationState("building English captions");
            setTranslationProgress(92);

            const cues = normalizeWhisperCues(
                result,
                decodedDuration || duration
            );
            const text = String(result?.text || "")
                .trim() || cues.map((cue) => cue.text).join(" ");

            if (cues.length === 0 || !text) {
                throw new Error(
                    "The model did not return speech. Try another model or a clearer audio track."
                );
            }

            const vtt = cuesToVtt(cues);
            const vttBlob = new Blob([vtt], {
                type: "text/vtt;charset=utf-8",
            });
            const nextSubtitleUrl = URL.createObjectURL(vttBlob);

            if (subtitleObjectUrlRef.current) {
                URL.revokeObjectURL(subtitleObjectUrlRef.current);
            }

            subtitleObjectUrlRef.current = nextSubtitleUrl;
            setSubtitleUrl(nextSubtitleUrl);
            setTranslatedCues(cues);
            setTranslatedText(text);
            setTranslationProgress(100);
            setTranslationState("English translation ready");
            setSuccessMessage(
                "English captions are ready. Enable English voice for an approximate cue-synced dub."
            );
            addLog(`Created ${cues.length} English caption cues.`);

            window.setTimeout(() => {
                const video = videoRef.current;

                if (!video) {
                    return;
                }

                Array.from(video.textTracks || []).forEach((track) => {
                    if (track.language === "en" || track.label === "AI English") {
                        track.mode = "showing";
                    }
                });
            }, 250);
        } catch (error) {
            disableTranslationAudioMode();
            setTranslationState("failed");
            setTranslationProgress(0);
            setErrorMessage(`Translation failed: ${error.message}`);
            addLog(`Translation failed: ${error.message}`);
        }
    }, [
        addLog,
        clearSubtitles,
        corsSafeSource,
        decodeMediaToWhisperAudio,
        disableTranslationAudioMode,
        duration,
        loadTranslationModel,
        loadedSource,
        sourceLanguage,
    ]);

    const cancelTranslation = useCallback(() => {
        translationRunRef.current += 1;
        modelLoadRunRef.current += 1;
        disableTranslationAudioMode();
        setTranslationState("cancelled");
        setTranslationProgress(0);
        setModelState((current) =>
            current.startsWith("ready") ? current : "cancelled"
        );
        setModelProgress((current) =>
            transcriberRef.current ? 100 : Math.min(current, 99)
        );
        addLog(
            "Translation cancelled. Original audio routing and master gain were restored immediately."
        );
    }, [addLog, disableTranslationAudioMode]);

    const speakCue = useCallback(
        (cueIndex) => {
            if (
                !englishVoiceEnabled ||
                !translationEnabled ||
                cueIndex < 0 ||
                cueIndex >= translatedCues.length ||
                !("speechSynthesis" in window)
            ) {
                return;
            }

            const cue = translatedCues[cueIndex];
            const utterance = new SpeechSynthesisUtterance(cue.text);
            const availableTime = Math.max(0.5, cue.end - cue.start);
            const approximateWordCount = Math.max(
                1,
                cue.text.trim().split(/\s+/).length
            );
            const normalSpeechSeconds = approximateWordCount / 2.5;

            utterance.lang = "en-US";
            utterance.rate = clamp(
                (normalSpeechSeconds / availableTime) * playbackRate,
                0.75,
                2
            );
            utterance.pitch = 1;
            utterance.volume = 1;

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        },
        [
            englishVoiceEnabled,
            playbackRate,
            translatedCues,
            translationEnabled,
        ]
    );

    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        if (!isScrubbingRef.current) {
            setCurrentTime(video.currentTime || 0);
            scrubTimeRef.current = video.currentTime || 0;
        }

        if (
            "mediaSession" in navigator &&
            Number.isFinite(video.duration) &&
            video.duration > 0
        ) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: video.duration,
                    playbackRate: video.playbackRate || 1,
                    position: clamp(video.currentTime || 0, 0, video.duration),
                });
            } catch {
                // Safari may reject position updates during source transitions.
            }
        }

        if (
            !englishVoiceEnabled ||
            !translationEnabled ||
            video.paused ||
            translatedCues.length === 0
        ) {
            return;
        }

        const cueIndex = translatedCues.findIndex(
            (cue) => video.currentTime >= cue.start && video.currentTime < cue.end
        );

        if (cueIndex >= 0 && cueIndex !== lastSpokenCueRef.current) {
            lastSpokenCueRef.current = cueIndex;
            speakCue(cueIndex);
        }
    }, [
        englishVoiceEnabled,
        speakCue,
        translatedCues,
        translationEnabled,
    ]);

    const copyTranscript = useCallback(async () => {
        if (!translatedText) {
            return;
        }

        try {
            await navigator.clipboard.writeText(translatedText);
            setSuccessMessage("English transcript copied.");
        } catch {
            setErrorMessage("Clipboard access was blocked by the browser.");
        }
    }, [translatedText]);

    useEffect(() => {
        const releaseScrub = () => {
            if (isScrubbingRef.current) {
                finishScrub(scrubTimeRef.current);
            }
        };

        window.addEventListener("pointerup", releaseScrub, true);
        window.addEventListener("pointercancel", releaseScrub, true);
        window.addEventListener("touchend", releaseScrub, true);
        window.addEventListener("touchcancel", releaseScrub, true);
        window.addEventListener("mouseup", releaseScrub, true);

        return () => {
            window.removeEventListener("pointerup", releaseScrub, true);
            window.removeEventListener("pointercancel", releaseScrub, true);
            window.removeEventListener("touchend", releaseScrub, true);
            window.removeEventListener("touchcancel", releaseScrub, true);
            window.removeEventListener("mouseup", releaseScrub, true);
        };
    }, [finishScrub]);

    useEffect(() => {
        if (!("mediaSession" in navigator)) {
            return undefined;
        }

        const video = videoRef.current;
        const artwork = isUsablePosterUrl(activePlaylistItem?.posterUrl)
            ? [{ src: activePlaylistItem.posterUrl }]
            : [];

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: sourceLabel || "Video Warp Studio",
                artist: sourceType || "AudioMasterLab",
                album: "AudioMasterLab Video Player",
                artwork,
            });
        } catch {
            // MediaMetadata is optional on older iOS versions.
        }

        const setHandler = (action, handler) => {
            try {
                navigator.mediaSession.setActionHandler(action, handler);
            } catch {
                // Unsupported actions are ignored per browser.
            }
        };

        setHandler("play", () => {
            playCurrentMedia();
        });
        setHandler("pause", () => {
            pauseCurrentMedia();
        });
        setHandler("stop", stopPlayback);
        setHandler("seekbackward", (details) => seekBy(-(details.seekOffset || 10)));
        setHandler("seekforward", (details) => seekBy(details.seekOffset || 10));
        setHandler("seekto", (details) => {
            if (!video || !Number.isFinite(video.duration)) return;
            const target = clamp(Number(details.seekTime) || 0, 0, video.duration);
            if (details.fastSeek && typeof video.fastSeek === "function") {
                video.fastSeek(target);
            } else {
                video.currentTime = target;
            }
            setCurrentTime(target);
        });
        setHandler("previoustrack", playPreviousPlaylistItem);
        setHandler("nexttrack", playNextPlaylistItem);

        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

        return () => {
            [
                "play",
                "pause",
                "stop",
                "seekbackward",
                "seekforward",
                "seekto",
                "previoustrack",
                "nexttrack",
            ].forEach((action) => setHandler(action, null));
        };
    }, [
        activePlaylistItem,
        isPlaying,
        pauseCurrentMedia,
        playCurrentMedia,
        playNextPlaylistItem,
        playPreviousPlaylistItem,
        persistPausedStateNow,
        seekBy,
        sourceLabel,
        sourceType,
        stopPlayback,
    ]);

    useEffect(() => {
        const resumeAudio = () => {
            if (document.visibilityState === "visible" && isPlaying) {
                audioContextRef.current?.resume().catch(() => {});
            }
        };

        document.addEventListener("visibilitychange", resumeAudio);
        window.addEventListener("pageshow", resumeAudio);
        return () => {
            document.removeEventListener("visibilitychange", resumeAudio);
            window.removeEventListener("pageshow", resumeAudio);
        };
    }, [isPlaying]);

    useEffect(() => {
        playerSnapshotRef.current = {
            source:
                originalSource && !String(originalSource).startsWith("blob:")
                    ? originalSource
                    : "",
            label: sourceLabel,
            sourceType,
            size: fileSize,
            currentTime: Number(currentTime || 0),
            duration: Number(duration || 0),
            activePlaylistId: playlistState.activePlaylistId,
            activePlaylistIndex,
            playlistAutoplay,
            playbackRate,
            smoothTempoEnabled,
            tempoSmoothingMs,
            volume: audioEffects.volume,
            muted: playerMuted,
            wasPlaying: isPlaying && playbackIntentRef.current === "play",
        };
    }, [
        activePlaylistIndex,
        audioEffects.volume,
        playlistState.activePlaylistId,
        currentTime,
        duration,
        fileSize,
        isPlaying,
        originalSource,
        playbackRate,
        playerMuted,
        playlistAutoplay,
        smoothTempoEnabled,
        tempoSmoothingMs,
        sourceLabel,
        sourceType,
    ]);

    useEffect(() => {
        const save = () => {
            if (playerSnapshotRef.current?.source) {
                writeStoredPlayerState(playerSnapshotRef.current);
            }
        };

        const interval = window.setInterval(save, 1000);
        window.addEventListener("pagehide", save);
        window.addEventListener("beforeunload", save);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener("pagehide", save);
            window.removeEventListener("beforeunload", save);
            save();
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return undefined;
        }

        const startTime = performance.now();
        let cancelled = false;

        const updateWarpFrame = (now) => {
            if (cancelled) {
                return;
            }

            const animationSeconds = visualWarp.syncToVideo
                ? Number(video.currentTime || 0)
                : (now - startTime) / 1000;
            const timePhase =
                animationSeconds * Math.PI * 2 * timeWarp.frequency;
            const pitchPhase =
                animationSeconds * Math.PI * 2 * pitchWarp.frequency;
            const visualPhase =
                animationSeconds * Math.PI * 2 * visualWarp.speed;

            const timeModulation = timeWarp.enabled
                ? getLfoValue(timePhase, timeWarp.shape) * timeWarp.depth
                : 0;
            const pitchModulation = pitchWarp.enabled
                ? getLfoValue(pitchPhase, pitchWarp.shape) * pitchWarp.depth
                : 0;

            const targetTempo = clamp(
                playbackRate * (1 + timeModulation),
                0.25,
                4
            );
            const livePitch = clamp(
                pitchSemitones + pitchModulation,
                -24,
                24
            );
            const previousFrameTime = lastWarpFrameTimeRef.current || now;
            const elapsedMs = clamp(now - previousFrameTime, 0, 100);
            const smoothingWindow = smoothTempoEnabled
                ? clamp(tempoSmoothingMs, 20, 800)
                : 0;
            const smoothingAmount = smoothingWindow
                ? 1 - Math.exp(-elapsedMs / smoothingWindow)
                : 1;
            const previousTempo = clamp(
                Number(smoothedTempoRef.current || video.playbackRate || 1),
                0.25,
                4
            );
            let liveTempo = clamp(
                previousTempo +
                (targetTempo - previousTempo) * smoothingAmount,
                0.25,
                4
            );

            if (Math.abs(targetTempo - liveTempo) < 0.0005) {
                liveTempo = targetTempo;
            }

            lastWarpFrameTimeRef.current = now;
            smoothedTempoRef.current = liveTempo;

            // The media element owns the synchronized video clock. SoundTouch
            // receives the exact same mirrored rate so it can correct pitch
            // without independently stretching the stream and drifting behind.
            if (Math.abs(video.playbackRate - liveTempo) > 0.0001) {
                video.playbackRate = liveTempo;
                video.defaultPlaybackRate = liveTempo;
            }

            const context = audioContextRef.current;
            const soundTouchNode = soundTouchNodeRef.current;

            if (soundTouchNode && context) {
                const time = context.currentTime;

                video.preservesPitch = false;
                video.webkitPreservesPitch = false;
                video.mozPreservesPitch = false;
                if (
                    Math.abs(lastAppliedTempoRef.current - liveTempo) > 0.0001
                ) {
                    soundTouchNode.playbackRate.setValueAtTime(liveTempo, time);
                    lastAppliedTempoRef.current = liveTempo;
                }

                if (
                    Math.abs(lastAppliedPitchRef.current - livePitch) > 0.001
                ) {
                    soundTouchNode.pitchSemitones.setTargetAtTime(
                        livePitch,
                        time,
                        0.02
                    );
                    lastAppliedPitchRef.current = livePitch;
                }

                if (
                    Math.abs(
                        lastAppliedFinePitchRef.current - finePitchCents
                    ) > 0.1
                ) {
                    soundTouchNode.pitch.setTargetAtTime(
                        2 ** (finePitchCents / 1200),
                        time,
                        0.02
                    );
                    lastAppliedFinePitchRef.current = finePitchCents;
                }
            } else {
                video.preservesPitch = true;
                video.webkitPreservesPitch = true;
                video.mozPreservesPitch = true;
            }

            const intensity = visualWarp.intensity / 100;
            const baseScale = videoEffects.zoom / 100;
            let scaleX = baseScale;
            let scaleY = baseScale;
            let rotation = videoEffects.rotate;
            let translateX = 0;
            let translateY = 0;
            let skewX = 0;
            let skewY = 0;
            let perspectiveRotateX = 0;
            let perspectiveRotateY = 0;
            let displacementScale = 0;
            let turbulenceX = 0.004;
            let turbulenceY = 0.008;
            let hueJitter = 0;

            switch (visualWarp.mode) {
                case "liquid":
                    displacementScale =
                        visualWarp.displacement *
                        (0.6 + 0.4 * Math.sin(visualPhase));
                    turbulenceX =
                        0.003 +
                        0.004 *
                        (0.5 + 0.5 * Math.sin(visualPhase * 0.73));
                    turbulenceY =
                        0.007 +
                        0.006 *
                        (0.5 + 0.5 * Math.cos(visualPhase * 0.51));
                    scaleX *= 1 + Math.sin(visualPhase * 0.8) * intensity * 0.02;
                    scaleY *= 1 + Math.cos(visualPhase * 0.63) * intensity * 0.025;
                    break;
                case "vortex":
                    displacementScale =
                        visualWarp.displacement *
                        (0.55 + 0.45 * Math.sin(visualPhase * 1.3));
                    rotation += Math.sin(visualPhase) * intensity * 14;
                    scaleX *= 1 + Math.sin(visualPhase * 0.5) * intensity * 0.06;
                    scaleY *= 1 + Math.cos(visualPhase * 0.5) * intensity * 0.06;
                    perspectiveRotateX =
                        Math.sin(visualPhase * 0.7) *
                        visualWarp.perspective *
                        0.35;
                    perspectiveRotateY =
                        Math.cos(visualPhase * 0.62) *
                        visualWarp.perspective *
                        0.35;
                    break;
                case "pulse":
                    scaleX *=
                        1 +
                        Math.sin(visualPhase) *
                        intensity *
                        0.11;
                    scaleY *=
                        1 +
                        Math.sin(visualPhase) *
                        intensity *
                        0.11;
                    displacementScale =
                        visualWarp.displacement *
                        Math.max(0, Math.sin(visualPhase));
                    break;
                case "glitch": {
                    const stepped = Math.floor(animationSeconds * visualWarp.speed * 18);
                    const pseudoRandom = Math.sin(stepped * 91.345) * 43758.5453;
                    const noise = (pseudoRandom - Math.floor(pseudoRandom)) * 2 - 1;

                    translateX = noise * intensity * 18;
                    translateY =
                        Math.sin(stepped * 2.17) * intensity * 7;
                    skewX = noise * intensity * 4;
                    rotation += noise * intensity * 1.5;
                    displacementScale =
                        visualWarp.displacement *
                        (0.35 + Math.abs(noise) * 0.9);
                    hueJitter = noise * intensity * 28;
                    break;
                }
                case "rubber":
                    scaleX *=
                        1 +
                        Math.sin(visualPhase) *
                        intensity *
                        0.14;
                    scaleY *=
                        1 -
                        Math.sin(visualPhase) *
                        intensity *
                        0.1;
                    skewX =
                        Math.sin(visualPhase * 0.75) *
                        intensity *
                        5;
                    displacementScale =
                        visualWarp.displacement *
                        (0.3 + 0.7 * Math.abs(Math.sin(visualPhase)));
                    break;
                case "drift":
                    translateX =
                        Math.sin(visualPhase * 0.75) *
                        intensity *
                        22;
                    translateY =
                        Math.cos(visualPhase * 0.52) *
                        intensity *
                        14;
                    perspectiveRotateX =
                        Math.sin(visualPhase * 0.41) *
                        visualWarp.perspective *
                        0.22;
                    perspectiveRotateY =
                        Math.cos(visualPhase * 0.37) *
                        visualWarp.perspective *
                        0.22;
                    displacementScale =
                        visualWarp.displacement *
                        (0.15 + 0.2 * Math.abs(Math.sin(visualPhase)));
                    break;
                case "shake":
                    translateX =
                        Math.sin(visualPhase * 4.3) *
                        intensity *
                        12;
                    translateY =
                        Math.cos(visualPhase * 5.1) *
                        intensity *
                        10;
                    rotation +=
                        Math.sin(visualPhase * 3.4) *
                        intensity *
                        2.2;
                    break;
                case "twist":
                    rotation +=
                        Math.sin(visualPhase) *
                        intensity *
                        18;
                    skewX =
                        Math.sin(visualPhase * 0.72) *
                        intensity *
                        4;
                    skewY =
                        Math.cos(visualPhase * 0.68) *
                        intensity *
                        4;
                    displacementScale =
                        visualWarp.displacement *
                        (0.2 + 0.8 * Math.abs(Math.sin(visualPhase)));
                    break;
                default:
                    break;
            }

            const nextTransform = [
                `perspective(900px)`,
                `translate3d(${translateX}px, ${translateY}px, 0)`,
                `rotateX(${perspectiveRotateX}deg)`,
                `rotateY(${perspectiveRotateY}deg)`,
                `rotate(${rotation}deg)`,
                `skew(${skewX}deg, ${skewY}deg)`,
                `scale(${scaleX}, ${scaleY})`,
            ].join(" ");

            if (lastVideoTransformRef.current !== nextTransform) {
                video.style.transform = nextTransform;
                lastVideoTransformRef.current = nextTransform;
            }

            const svgFilterEnabled =
                visualWarp.mode !== "none" &&
                visualWarp.displacement > 0;
            const nextFilter = [
                filterString,
                hueJitter ? `hue-rotate(${hueJitter}deg)` : "",
                svgFilterEnabled ? "url(#playerAnimatedWarpFilter)" : "",
            ]
                .filter(Boolean)
                .join(" ");

            if (lastVideoFilterRef.current !== nextFilter) {
                video.style.filter = nextFilter;
                lastVideoFilterRef.current = nextFilter;
            }

            if (svgFilterEnabled && turbulenceRef.current) {
                turbulenceRef.current.setAttribute(
                    "baseFrequency",
                    `${Math.max(0.0001, turbulenceX)} ${Math.max(
                        0.0001,
                        turbulenceY
                    )}`
                );
                turbulenceRef.current.setAttribute(
                    "seed",
                    String(
                        2 +
                        Math.floor(
                            animationSeconds *
                            Math.max(0.1, visualWarp.speed)
                        ) %
                        97
                    )
                );
            }

            if (svgFilterEnabled && displacementRef.current) {
                displacementRef.current.setAttribute(
                    "scale",
                    String(displacementScale)
                );
            }

            if (now - warpReadoutTimeRef.current > 120) {
                warpReadoutTimeRef.current = now;
                setLiveWarpReadout({
                    tempo: liveTempo,
                    pitch: livePitch + finePitchCents / 100,
                });
            }

            warpAnimationFrameRef.current =
                requestAnimationFrame(updateWarpFrame);
        };

        warpAnimationFrameRef.current =
            requestAnimationFrame(updateWarpFrame);

        return () => {
            cancelled = true;

            if (warpAnimationFrameRef.current) {
                cancelAnimationFrame(warpAnimationFrameRef.current);
                warpAnimationFrameRef.current = null;
            }

            video.style.transform = "";
            video.style.filter = filterString;
            lastVideoTransformRef.current = "";
            lastVideoFilterRef.current = filterString;
            lastWarpFrameTimeRef.current = 0;
            smoothedTempoRef.current = clamp(playbackRate, 0.25, 4);
            video.playbackRate = smoothedTempoRef.current;
            video.defaultPlaybackRate = smoothedTempoRef.current;
        };
    }, [
        filterString,
        finePitchCents,
        pitchSemitones,
        pitchWarp,
        playbackRate,
        smoothTempoEnabled,
        tempoSmoothingMs,
        timeWarp,
        videoEffects.rotate,
        videoEffects.zoom,
        visualWarp,
    ]);

    useEffect(() => {
        if (audioEffects.volume > 0.001) {
            lastAudibleVolumeRef.current = audioEffects.volume;
        }
    }, [audioEffects.volume]);

    useEffect(() => {
        if (!isPlaying || isScrubbing) {
            clearControlsHideTimer();
            setControlsVisible(true);
            return undefined;
        }

        revealPlayerControls();
        return clearControlsHideTimer;
    }, [clearControlsHideTimer, isPlaying, isScrubbing, revealPlayerControls]);

    useEffect(() => {
        return () => {
            clearControlsHideTimer();
            if (surfaceClickTimerRef.current) {
                window.clearTimeout(surfaceClickTimerRef.current);
                surfaceClickTimerRef.current = null;
            }
        };
    }, [clearControlsHideTimer]);

    useEffect(() => {
        const updateAudioNodes = async () => {
            const video = videoRef.current;
            const selectedVolume = clamp(audioEffects.volume, 0, 1);
            const gainValue =
                translationEnabled && muteOriginalForTranslation
                    ? 0
                    : playerMuted
                        ? 0
                        : selectedVolume;

            if (masterGainNodeRef.current) {
                const context = audioContextRef.current;
                const time = context?.currentTime || 0;

                masterGainNodeRef.current.gain.setTargetAtTime(
                    gainValue,
                    time,
                    0.015
                );
                bassNodeRef.current.gain.setTargetAtTime(
                    audioEffects.bass,
                    time,
                    0.015
                );
                midNodeRef.current.gain.setTargetAtTime(
                    audioEffects.mid,
                    time,
                    0.015
                );
                trebleNodeRef.current.gain.setTargetAtTime(
                    audioEffects.treble,
                    time,
                    0.015
                );

                if (pannerNodeRef.current) {
                    pannerNodeRef.current.pan.setTargetAtTime(
                        audioEffects.pan,
                        time,
                        0.015
                    );
                }
            } else if (video) {
                video.volume = selectedVolume;
                video.muted = gainValue === 0;
            }
        };

        updateAudioNodes();
    }, [
        audioEffects.bass,
        audioEffects.mid,
        audioEffects.pan,
        audioEffects.treble,
        audioEffects.volume,
        muteOriginalForTranslation,
        playerMuted,
        translationEnabled,
    ]);

    useEffect(() => {
        if (!englishVoiceEnabled && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            lastSpokenCueRef.current = -1;
        }
    }, [englishVoiceEnabled]);

    useEffect(() => {
        writeStoredVideoPlaylistLibrary(playlistState);
    }, [playlistState]);

    useEffect(() => {
        const syncPlaylist = (event) => {
            if (
                event?.type === "storage" &&
                ![
                    VIDEO_PLAYLIST_STORAGE_KEY,
                    VIDEO_PLAYLIST_LIBRARY_STORAGE_KEY,
                ].includes(event.key)
            ) {
                return;
            }

            if (
                event?.type === "storage" &&
                event.key === VIDEO_PLAYLIST_LIBRARY_STORAGE_KEY
            ) {
                setPlaylistState(readStoredVideoPlaylistLibrary());
                return;
            }

            if (event?.type === "audiomasterlab:video-playlist-updated") {
                const eventLibrary = event.detail?.library;
                const incomingItems = Array.isArray(event.detail)
                    ? event.detail
                    : event.detail?.items;

                if (
                    eventLibrary?.version === VIDEO_PLAYLIST_LIBRARY_VERSION &&
                    Array.isArray(eventLibrary.playlists)
                ) {
                    setPlaylistState(normalizeVideoPlaylistLibrary(eventLibrary));
                    return;
                }

                if (Array.isArray(incomingItems)) {
                    setPlaylist((current) =>
                        appendUniquePlaylistItems(current, incomingItems)
                    );
                    return;
                }
            }

            // The browser storage event for the legacy key does not fire in
            // the same tab, but it does fire in other open /player tabs.
            const legacyItems = readLegacyVideoPlaylist();
            if (legacyItems.length) {
                setPlaylist((current) =>
                    appendUniquePlaylistItems(current, legacyItems)
                );
            }
        };

        window.addEventListener("storage", syncPlaylist);
        window.addEventListener(
            "audiomasterlab:video-playlist-updated",
            syncPlaylist
        );

        return () => {
            window.removeEventListener("storage", syncPlaylist);
            window.removeEventListener(
                "audiomasterlab:video-playlist-updated",
                syncPlaylist
            );
        };
    }, [setPlaylist]);

    useEffect(() => {
        if (playlistBootstrapRef.current) {
            return;
        }

        playlistBootstrapRef.current = true;
        const params = new URLSearchParams(window.location.search);
        const source = params.get("source");
        const requestedId = params.get("playlistItem");
        const title = params.get("title") || "";
        const shouldAutoplay = params.get("autoplay") === "1";
        const handoff = readPlayerHandoff();
        const handoffMatchesRequest = Boolean(
            handoff?.item &&
            (!source || handoff.item.url === source) &&
            (!requestedId || handoff.item.id === requestedId)
        );

        if (source) {
            const requestedItem = normalizePlaylistItem(
                handoffMatchesRequest
                    ? handoff.item
                    : {
                        id: requestedId || undefined,
                        url: source,
                        label: title || undefined,
                        sourceType: isArchiveUrl(source)
                            ? "Archive.org"
                            : "Remote URL",
                    }
            );

            clearPlayerHandoff();

            if (!requestedItem) {
                setErrorMessage("The Archive player handoff did not contain a valid video URL.");
                return;
            }

            const nextPlaylist = appendUniquePlaylistItems(playlist, [
                requestedItem,
            ]);
            const requestedIndex = nextPlaylist.findIndex(
                (item) => item.url === requestedItem.url
            );
            const autoplay = handoffMatchesRequest
                ? handoff.autoplay && shouldAutoplay
                : shouldAutoplay;

            setPlaylist(nextPlaylist);
            loadRemoteUrl(requestedItem.url, {
                label: requestedItem.label,
                size: requestedItem.size,
                autoplay,
                playlistIndex: requestedIndex,
            });
            return;
        }

        clearPlayerHandoff();

        if (requestedId) {
            const requestedIndex = playlist.findIndex(
                (item) => item.id === requestedId
            );
            if (requestedIndex >= 0) {
                playPlaylistItem(requestedIndex, shouldAutoplay);
                return;
            }
        }

        const restored = storedPlayerStateRef.current;
        if (restored?.source && !String(restored.source).startsWith("blob:")) {
            pendingRestoreTimeRef.current = Math.max(
                0,
                Number(restored.currentTime) || 0
            );
            setPlaylistAutoplay(restored.playlistAutoplay !== false);
            setSmoothTempoEnabled(restored.smoothTempoEnabled !== false);
            setTempoSmoothingMs(
                clamp(Number(restored.tempoSmoothingMs) || 180, 20, 800)
            );
            loadRemoteUrl(restored.source, {
                label: restored.label || "Restored video",
                size: Number(restored.size || 0),
                autoplay: Boolean(restored.wasPlaying),
                playlistIndex: Number.isInteger(restored.activePlaylistIndex)
                    ? restored.activePlaylistIndex
                    : -1,
            });
        }
    }, [loadRemoteUrl, playPlaylistItem, playlist, setPlaylist]);

    useEffect(() => {
        return () => {
            translationRunRef.current += 1;
            modelLoadRunRef.current += 1;
            if (playerSnapshotRef.current?.source) {
                writeStoredPlayerState(playerSnapshotRef.current);
            }
            destroyHls();
            revokeLocalObjectUrl();

            if (subtitleObjectUrlRef.current) {
                URL.revokeObjectURL(subtitleObjectUrlRef.current);
                subtitleObjectUrlRef.current = "";
            }

            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }

            if (transcriberRef.current?.dispose) {
                transcriberRef.current.dispose().catch(() => {});
            }

            if (soundTouchNodeRef.current) {
                soundTouchNodeRef.current.disconnect();
                soundTouchNodeRef.current = null;
            }

            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, [destroyHls, revokeLocalObjectUrl]);

    return (
        <GradientPage>
            <AppNavBar />

            <Box
                sx={{
                    minHeight: "calc(100vh - 64px)",
                    px: { xs: 1, sm: 1.5, xl: 2 },
                    py: 1.5,
                    background:
                        "radial-gradient(circle at 50% -20%, rgba(84,116,171,0.14), transparent 42%), linear-gradient(180deg, rgba(3,5,10,0.2), rgba(3,5,10,0.78))",
                }}
            >
                <Stack spacing={1.25}>
                    <Paper
                        elevation={0}
                        sx={{
                            ...DAW_PANEL_SX,
                            position: "sticky",
                            top: 0,
                            zIndex: 20,
                            p: 1,
                            borderColor: "rgba(158,232,255,0.16)",
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", lg: "row" }}
                            spacing={1}
                            alignItems={{ xs: "stretch", lg: "center" }}
                        >
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ minWidth: { lg: 255 } }}
                            >
                                <Box
                                    sx={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 1.5,
                                        display: "grid",
                                        placeItems: "center",
                                        color: "#07111f",
                                        background: "linear-gradient(135deg, #9ee8ff, #b38cff)",
                                    }}
                                >
                                    <AutoAwesomeRounded fontSize="small" />
                                </Box>
                                <Box minWidth={0}>
                                    <Typography
                                        sx={{
                                            color: "white",
                                            fontWeight: 1000,
                                            fontSize: 14,
                                            letterSpacing: 0.25,
                                        }}
                                    >
                                        Video Warp Studio
                                    </Typography>
                                    <Typography
                                        noWrap
                                        sx={{
                                            color: "rgba(255,255,255,0.43)",
                                            fontSize: 9.5,
                                            maxWidth: 205,
                                        }}
                                    >
                                        {sourceLabel}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={0.6}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Tooltip title="Previous playlist item">
                                    <span>
                                        <IconButton
                                            disabled={!playlist.length}
                                            onClick={playPreviousPlaylistItem}
                                            sx={iconButtonSx}
                                            size="small"
                                        >
                                            <SkipPreviousRounded fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Back 10 seconds">
                                    <IconButton onClick={() => seekBy(-10)} sx={iconButtonSx} size="small">
                                        <FastRewindRounded fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <IconButton
                                    onClick={togglePlayback}
                                    sx={{
                                        ...iconButtonSx,
                                        width: 42,
                                        height: 42,
                                        color: "#07111f",
                                        background: "linear-gradient(135deg, #9ee8ff, #b38cff)",
                                        "&:hover": {
                                            background: "linear-gradient(135deg, #c4f4ff, #ccb4ff)",
                                        },
                                    }}
                                >
                                    {isPlaying ? <PauseRounded /> : <PlayArrowRounded />}
                                </IconButton>
                                <Tooltip title="Stop and return to zero">
                                    <IconButton onClick={stopPlayback} sx={iconButtonSx} size="small">
                                        <StopRounded fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Forward 10 seconds">
                                    <IconButton onClick={() => seekBy(10)} sx={iconButtonSx} size="small">
                                        <FastForwardRounded fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Next playlist item">
                                    <span>
                                        <IconButton
                                            disabled={!playlist.length}
                                            onClick={playNextPlaylistItem}
                                            sx={iconButtonSx}
                                            size="small"
                                        >
                                            <SkipNextRounded fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ flex: 1, minWidth: 0 }}
                            >
                                <Typography
                                    sx={{
                                        ...monoTextSx,
                                        color: "#aeeeff",
                                        fontWeight: 900,
                                        fontSize: 11,
                                        minWidth: 45,
                                    }}
                                >
                                    {formatTime(currentTime)}
                                </Typography>
                                <Slider
                                    value={
                                        isScrubbing
                                            ? scrubTime
                                            : Number.isFinite(currentTime)
                                                ? currentTime
                                                : 0
                                    }
                                    min={0}
                                    max={Math.max(duration, 0.001)}
                                    step={0.02}
                                    onPointerDown={beginScrub}
                                    onMouseDown={beginScrub}
                                    onTouchStart={beginScrub}
                                    onChange={(_, nextValue) => updateScrub(nextValue)}
                                    onChangeCommitted={(_, nextValue) => finishScrub(nextValue)}
                                    onPointerUp={() => finishScrub(scrubTimeRef.current)}
                                    onPointerCancel={() => finishScrub(scrubTimeRef.current)}
                                    onTouchEnd={() => finishScrub(scrubTimeRef.current)}
                                    onMouseUp={() => finishScrub(scrubTimeRef.current)}
                                    aria-label="Video timeline scrubber"
                                    sx={{
                                        color: isScrubbing ? "#b38cff" : "#9ee8ff",
                                        py: 0,
                                        touchAction: "none",
                                        "& .MuiSlider-thumb": { width: 15, height: 15 },
                                    }}
                                />
                                <Typography
                                    sx={{
                                        ...monoTextSx,
                                        color: "rgba(255,255,255,0.58)",
                                        fontSize: 11,
                                        minWidth: 45,
                                        textAlign: "right",
                                    }}
                                >
                                    {formatTime(duration)}
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={0.7} alignItems="center">
                                <Chip
                                    size="small"
                                    label={`${liveWarpReadout.tempo.toFixed(2)}×`}
                                    sx={{
                                        ...monoTextSx,
                                        color: "#9ee8ff",
                                        fontWeight: 900,
                                        border: "1px solid rgba(158,232,255,0.2)",
                                    }}
                                />
                                <Chip
                                    size="small"
                                    label={`${liveWarpReadout.pitch >= 0 ? "+" : ""}${liveWarpReadout.pitch.toFixed(2)} st`}
                                    sx={{
                                        ...monoTextSx,
                                        color: "#c5adff",
                                        fontWeight: 900,
                                        border: "1px solid rgba(179,140,255,0.22)",
                                    }}
                                />
                                {isIOS && (
                                    <Chip
                                        size="small"
                                        label="iOS controls"
                                        sx={{
                                            ...monoTextSx,
                                            color: "#7ef4b6",
                                            fontWeight: 900,
                                            border: "1px solid rgba(126,244,182,0.22)",
                                        }}
                                    />
                                )}
                                <Tooltip title={playerMuted || audioEffects.volume <= 0.001 ? "Unmute" : "Mute"}>
                                    <IconButton onClick={togglePlayerMute} sx={iconButtonSx} size="small">
                                        {playerMuted || audioEffects.volume <= 0.001 ? (
                                            <VolumeOffRounded fontSize="small" />
                                        ) : (
                                            <VolumeUpRounded fontSize="small" />
                                        )}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Picture in picture">
                                    <IconButton onClick={requestPictureInPicture} sx={iconButtonSx} size="small">
                                        <PictureInPictureAltRounded fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Fullscreen">
                                    <IconButton onClick={requestFullscreen} sx={iconButtonSx} size="small">
                                        <FullscreenRounded fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Paper>

                    {errorMessage && (
                        <Alert severity="error" onClose={() => setErrorMessage("")} sx={{ borderRadius: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert severity="success" onClose={() => setSuccessMessage("")} sx={{ borderRadius: 2 }}>
                            {successMessage}
                        </Alert>
                    )}

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "minmax(0, 1fr)",
                                lg: "270px minmax(480px, 1fr) 355px",
                                xl: "300px minmax(620px, 1fr) 390px",
                            },
                            gap: 1.25,
                            alignItems: "start",
                        }}
                    >
                        <Stack spacing={1.25}>
                            <DawPanel
                                eyebrow="Sources"
                                title="Media Browser"
                                icon={<FileOpenRounded fontSize="small" />}
                            >
                                <Stack spacing={1.25}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="video/*,audio/*,.m3u8"
                                        hidden
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            loadLocalFile(file);
                                            event.target.value = "";
                                        }}
                                    />
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        startIcon={<FileOpenRounded />}
                                        variant="contained"
                                        sx={{ ...primaryPillSx, minHeight: 42 }}
                                    >
                                        Import Local Media
                                    </Button>
                                    <TextField
                                        label="Direct or Archive URL"
                                        value={urlInput}
                                        onChange={(event) => setUrlInput(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") loadUrl();
                                        }}
                                        multiline
                                        minRows={2}
                                        size="small"
                                        fullWidth
                                        placeholder="https://archive.org/details/..."
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: "white",
                                                borderRadius: 1.5,
                                                fontSize: 12,
                                                backgroundColor: "rgba(0,0,0,0.22)",
                                            },
                                        }}
                                    />
                                    {archiveDetected && (
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                            <ArchiveRounded sx={{ color: "#9ee8ff", fontSize: 17 }} />
                                            <Typography sx={{ color: "rgba(255,255,255,0.56)", fontSize: 10.5 }}>
                                                Archive item detected; a playable derivative will be resolved from direct metadata and loaded in native media mode.
                                            </Typography>
                                        </Stack>
                                    )}
                                    <Stack direction="row" spacing={0.75}>
                                        <Button
                                            fullWidth
                                            onClick={loadUrl}
                                            startIcon={archiveDetected ? <ArchiveRounded /> : <LinkRounded />}
                                            sx={softButtonSx}
                                        >
                                            Load
                                        </Button>
                                        <Tooltip title="Add URL to playlist">
                                            <IconButton onClick={addUrlToPlaylist} sx={iconButtonSx}>
                                                <PlaylistAddRounded />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Stack>
                            </DawPanel>

                            <DawPanel
                                eyebrow={`Playlists · ${playlistState.playlists.length}`}
                                title={`${activePlaylist?.name || "Playlist"} · ${playlist.length}`}
                                icon={<PlaylistPlayRounded fontSize="small" />}
                                action={
                                    <Tooltip title="Clear videos from active playlist">
                                        <span>
                                            <IconButton
                                                disabled={!playlist.length}
                                                onClick={clearPlaylist}
                                                size="small"
                                                sx={iconButtonSx}
                                            >
                                                <DeleteRounded fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                }
                            >
                                <Stack spacing={1}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel sx={{ color: "rgba(255,255,255,0.55)" }}>
                                            Active playlist
                                        </InputLabel>
                                        <Select
                                            value={playlistState.activePlaylistId}
                                            label="Active playlist"
                                            onChange={(event) =>
                                                selectVideoPlaylist(event.target.value)
                                            }
                                            sx={{
                                                color: "white",
                                                borderRadius: 1.5,
                                                fontSize: 11,
                                            }}
                                        >
                                            {playlistState.playlists.map((savedPlaylist) => (
                                                <MenuItem
                                                    key={savedPlaylist.id}
                                                    value={savedPlaylist.id}
                                                >
                                                    {savedPlaylist.name} · {savedPlaylist.items.length}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <Stack direction="row" spacing={0.65}>
                                        <TextField
                                            value={playlistNameDraft}
                                            onChange={(event) =>
                                                setPlaylistNameDraft(event.target.value)
                                            }
                                            size="small"
                                            fullWidth
                                            label="Playlist name"
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    renameActiveVideoPlaylist();
                                                }
                                            }}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    color: "white",
                                                    borderRadius: 1.5,
                                                    fontSize: 11,
                                                },
                                            }}
                                        />
                                        <Button
                                            onClick={renameActiveVideoPlaylist}
                                            sx={{ ...softButtonSx, minWidth: 78 }}
                                        >
                                            Rename
                                        </Button>
                                    </Stack>

                                    <Stack direction="row" spacing={0.65}>
                                        <TextField
                                            value={newPlaylistName}
                                            onChange={(event) =>
                                                setNewPlaylistName(event.target.value)
                                            }
                                            size="small"
                                            fullWidth
                                            label="New playlist"
                                            placeholder={`Playlist ${playlistState.playlists.length + 1}`}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    createVideoPlaylist();
                                                }
                                            }}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    color: "white",
                                                    borderRadius: 1.5,
                                                    fontSize: 11,
                                                },
                                            }}
                                        />
                                        <Button
                                            onClick={createVideoPlaylist}
                                            startIcon={<PlaylistAddRounded />}
                                            sx={{ ...softButtonSx, minWidth: 92 }}
                                        >
                                            Create
                                        </Button>
                                    </Stack>

                                    <Stack direction="row" spacing={0.65}>
                                        <Button
                                            fullWidth
                                            onClick={duplicateActiveVideoPlaylist}
                                            startIcon={<ContentCopyRounded />}
                                            sx={softButtonSx}
                                        >
                                            Duplicate
                                        </Button>
                                        <Button
                                            fullWidth
                                            disabled={playlistState.playlists.length <= 1}
                                            onClick={deleteActiveVideoPlaylist}
                                            startIcon={<DeleteRounded />}
                                            sx={softButtonSx}
                                        >
                                            Delete list
                                        </Button>
                                    </Stack>

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={playlistAutoplay}
                                                onChange={(event) =>
                                                    setPlaylistAutoplay(event.target.checked)
                                                }
                                            />
                                        }
                                        label={
                                            <Typography
                                                sx={{
                                                    fontSize: 11,
                                                    color: "rgba(255,255,255,0.64)",
                                                }}
                                            >
                                                Auto-advance this playlist
                                            </Typography>
                                        }
                                    />

                                    <Stack
                                        spacing={0.65}
                                        sx={{
                                            maxHeight: { lg: 560 },
                                            overflowY: "auto",
                                            pr: 0.3,
                                        }}
                                    >
                                        {playlist.length ? (
                                            playlist.map((item, index) => {
                                                const active = index === activePlaylistIndex;
                                                const editing =
                                                    editingPlaylistItemId === item.id;

                                                return (
                                                    <Paper
                                                        key={item.id}
                                                        elevation={0}
                                                        onDoubleClick={() =>
                                                            togglePlaylistItem(index)
                                                        }
                                                        sx={{
                                                            p: 0.85,
                                                            cursor: "pointer",
                                                            borderRadius: 1.5,
                                                            border: active
                                                                ? "1px solid rgba(158,232,255,0.42)"
                                                                : "1px solid rgba(255,255,255,0.07)",
                                                            background: active
                                                                ? "linear-gradient(90deg, rgba(158,232,255,0.12), rgba(179,140,255,0.08))"
                                                                : "rgba(0,0,0,0.18)",
                                                        }}
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            spacing={0.8}
                                                            alignItems="center"
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                aria-label={
                                                                    active && isPlaying
                                                                        ? `Pause ${item.label}`
                                                                        : `Play ${item.label}`
                                                                }
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    togglePlaylistItem(index);
                                                                }}
                                                                onDoubleClick={(event) =>
                                                                    event.stopPropagation()
                                                                }
                                                                sx={{
                                                                    ...iconButtonSx,
                                                                    width: 29,
                                                                    height: 29,
                                                                }}
                                                            >
                                                                {active && isPlaying ? (
                                                                    <PauseRounded fontSize="small" />
                                                                ) : (
                                                                    <PlayArrowRounded fontSize="small" />
                                                                )}
                                                            </IconButton>
                                                            <Box minWidth={0} flex={1}>
                                                                <Typography
                                                                    noWrap
                                                                    sx={{
                                                                        color: active
                                                                            ? "#c9f6ff"
                                                                            : "rgba(255,255,255,0.78)",
                                                                        fontSize: 10.5,
                                                                        fontWeight: 900,
                                                                    }}
                                                                >
                                                                    {index + 1}. {item.label}
                                                                </Typography>
                                                                <Typography
                                                                    noWrap
                                                                    sx={{
                                                                        color: "rgba(255,255,255,0.34)",
                                                                        fontSize: 8.5,
                                                                    }}
                                                                >
                                                                    {item.sourceType}
                                                                    {item.size
                                                                        ? ` · ${formatBytes(item.size)}`
                                                                        : ""}
                                                                </Typography>
                                                            </Box>
                                                            <Tooltip title="Edit video">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        beginEditPlaylistItem(item);
                                                                    }}
                                                                    onDoubleClick={(event) =>
                                                                        event.stopPropagation()
                                                                    }
                                                                    sx={{
                                                                        color: "rgba(255,255,255,0.52)",
                                                                    }}
                                                                >
                                                                    <TuneRounded sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    removePlaylistItem(index);
                                                                }}
                                                                onDoubleClick={(event) =>
                                                                    event.stopPropagation()
                                                                }
                                                                sx={{
                                                                    color: "rgba(255,255,255,0.38)",
                                                                }}
                                                            >
                                                                <DeleteRounded sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Stack>

                                                        {editing && (
                                                            <Stack
                                                                spacing={0.75}
                                                                sx={{
                                                                    mt: 0.8,
                                                                    pt: 0.8,
                                                                    borderTop:
                                                                        "1px solid rgba(255,255,255,0.08)",
                                                                }}
                                                                onClick={(event) =>
                                                                    event.stopPropagation()
                                                                }
                                                                onDoubleClick={(event) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >
                                                                <TextField
                                                                    value={playlistItemDraft.label}
                                                                    onChange={(event) =>
                                                                        setPlaylistItemDraft(
                                                                            (current) => ({
                                                                                ...current,
                                                                                label: event.target.value,
                                                                            })
                                                                        )
                                                                    }
                                                                    size="small"
                                                                    label="Video title"
                                                                    fullWidth
                                                                    sx={{
                                                                        "& .MuiOutlinedInput-root": {
                                                                            color: "white",
                                                                            borderRadius: 1.5,
                                                                            fontSize: 10.5,
                                                                        },
                                                                    }}
                                                                />
                                                                <TextField
                                                                    value={playlistItemDraft.url}
                                                                    onChange={(event) =>
                                                                        setPlaylistItemDraft(
                                                                            (current) => ({
                                                                                ...current,
                                                                                url: event.target.value,
                                                                            })
                                                                        )
                                                                    }
                                                                    size="small"
                                                                    label="Video URL"
                                                                    fullWidth
                                                                    multiline
                                                                    minRows={2}
                                                                    sx={{
                                                                        "& .MuiOutlinedInput-root": {
                                                                            color: "white",
                                                                            borderRadius: 1.5,
                                                                            fontSize: 10,
                                                                        },
                                                                    }}
                                                                />
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={0.5}
                                                                    useFlexGap
                                                                    flexWrap="wrap"
                                                                >
                                                                    <Button
                                                                        size="small"
                                                                        onClick={saveEditedPlaylistItem}
                                                                        sx={softButtonSx}
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        onClick={() => {
                                                                            setEditingPlaylistItemId("");
                                                                            setPlaylistItemDraft({
                                                                                label: "",
                                                                                url: "",
                                                                            });
                                                                        }}
                                                                        sx={softButtonSx}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        disabled={index === 0}
                                                                        onClick={() =>
                                                                            movePlaylistItem(index, -1)
                                                                        }
                                                                        sx={softButtonSx}
                                                                    >
                                                                        Move up
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        disabled={
                                                                            index === playlist.length - 1
                                                                        }
                                                                        onClick={() =>
                                                                            movePlaylistItem(index, 1)
                                                                        }
                                                                        sx={softButtonSx}
                                                                    >
                                                                        Move down
                                                                    </Button>
                                                                </Stack>
                                                            </Stack>
                                                        )}
                                                    </Paper>
                                                );
                                            })
                                        ) : (
                                            <Box
                                                sx={{
                                                    minHeight: 120,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    borderRadius: 1.5,
                                                    border:
                                                        "1px dashed rgba(255,255,255,0.1)",
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        color: "rgba(255,255,255,0.32)",
                                                        fontSize: 11,
                                                        textAlign: "center",
                                                        px: 2,
                                                    }}
                                                >
                                                    Add remote videos to “{activePlaylist?.name}”.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </Stack>
                            </DawPanel>
                        </Stack>

                        <Stack spacing={1.25} minWidth={0}>
                            <DawPanel
                                eyebrow="Preview Bus"
                                title="Video Monitor"
                                icon={<AutoAwesomeRounded fontSize="small" />}
                                action={
                                    <Stack direction="row" spacing={0.5}>
                                        <Chip
                                            size="small"
                                            label={sourceType}
                                            sx={{ color: "#9ee8ff", fontSize: 9, height: 22 }}
                                        />
                                        <Chip
                                            size="small"
                                            label={fileSize ? formatBytes(fileSize) : "LIVE"}
                                            sx={{ color: "#b9f8d4", fontSize: 9, height: 22 }}
                                        />
                                    </Stack>
                                }
                            >
                                <Box
                                    ref={playerSurfaceRef}
                                    tabIndex={0}
                                    role="application"
                                    aria-label="Video player. Click to play or pause. Double-click for fullscreen."
                                    onClick={handlePlayerSurfaceClick}
                                    onDoubleClick={handlePlayerSurfaceDoubleClick}
                                    onKeyDown={handlePlayerKeyDown}
                                    onMouseMove={() => revealPlayerControls()}
                                    onPointerMove={() => revealPlayerControls()}
                                    onTouchStart={() => revealPlayerControls(true)}
                                    onMouseLeave={() => {
                                        if (isPlaying && !isScrubbingRef.current) {
                                            clearControlsHideTimer();
                                            setControlsVisible(false);
                                        }
                                    }}
                                    sx={{
                                        position: "relative",
                                        overflow: "hidden",
                                        borderRadius: 1.75,
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        background:
                                            "radial-gradient(circle at center, rgba(18,25,47,0.92), rgba(0,0,0,0.99))",
                                        aspectRatio: "16 / 9",
                                        boxShadow: "inset 0 0 60px rgba(0,0,0,0.7)",
                                        outline: "none",
                                        cursor:
                                            isPlaying && !controlsVisible
                                                ? "none"
                                                : "pointer",
                                        "&:focus-visible": {
                                            boxShadow:
                                                "inset 0 0 60px rgba(0,0,0,0.7), 0 0 0 2px rgba(158,232,255,0.7)",
                                        },
                                    }}
                                >
                                    <svg
                                        width="0"
                                        height="0"
                                        aria-hidden="true"
                                        style={{ position: "absolute", pointerEvents: "none" }}
                                    >
                                        <defs>
                                            <filter
                                                id="playerAnimatedWarpFilter"
                                                x="-35%"
                                                y="-35%"
                                                width="170%"
                                                height="170%"
                                                colorInterpolationFilters="sRGB"
                                            >
                                                <feTurbulence
                                                    ref={turbulenceRef}
                                                    type="fractalNoise"
                                                    baseFrequency="0.004 0.008"
                                                    numOctaves="2"
                                                    seed="2"
                                                    stitchTiles="stitch"
                                                    result="warpNoise"
                                                />
                                                <feDisplacementMap
                                                    ref={displacementRef}
                                                    in="SourceGraphic"
                                                    in2="warpNoise"
                                                    scale="0"
                                                    xChannelSelector="R"
                                                    yChannelSelector="B"
                                                />
                                            </filter>
                                        </defs>
                                    </svg>

                                    <Box
                                        component="video"
                                        ref={videoRef}
                                        crossOrigin={corsSafeSource ? "anonymous" : undefined}
                                        controls={false}
                                        controlsList="nodownload noplaybackrate"
                                        playsInline
                                        preload="auto"
                                        disablePictureInPicture={false}
                                        x-webkit-airplay="allow"
                                        onPlay={() => {
                                            const video = videoRef.current;

                                            if (playbackIntentRef.current !== "play") {
                                                video?.pause();
                                                setIsPlaying(false);
                                                return;
                                            }

                                            pendingAutoplayRef.current = false;
                                            setIsPlaying(true);
                                            revealPlayerControls();
                                            audioContextRef.current?.resume().catch(() => {});
                                            if ("mediaSession" in navigator) {
                                                navigator.mediaSession.playbackState = "playing";
                                            }
                                        }}
                                        onPause={() => {
                                            const internalPause =
                                                performance.now() < internalPauseUntilRef.current;

                                            if (!internalPause) {
                                                playbackCommandRef.current += 1;
                                                playbackIntentRef.current = "pause";
                                                pendingAutoplayRef.current = false;
                                                pendingResumeAfterSeekRef.current = false;
                                                persistPausedStateNow();
                                            }

                                            setIsPlaying(false);
                                            revealPlayerControls(true);
                                            if ("mediaSession" in navigator) {
                                                navigator.mediaSession.playbackState = "paused";
                                            }
                                            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                                        }}
                                        onEnded={handlePlaylistEnded}
                                        onCanPlay={attemptPendingAutoplay}
                                        onProgress={() => {
                                            const video = videoRef.current;
                                            if (!video || !video.buffered?.length) {
                                                setBufferedTime(0);
                                                return;
                                            }

                                            let furthestBuffered = 0;
                                            for (let index = 0; index < video.buffered.length; index += 1) {
                                                furthestBuffered = Math.max(
                                                    furthestBuffered,
                                                    video.buffered.end(index)
                                                );
                                            }
                                            setBufferedTime(furthestBuffered);
                                        }}
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={() => {
                                            const video = videoRef.current;
                                            const nextDuration = Number.isFinite(video?.duration)
                                                ? video.duration
                                                : 0;
                                            setDuration(nextDuration);

                                            if (video && pendingRestoreTimeRef.current !== null) {
                                                const restoreTime = clamp(
                                                    Number(pendingRestoreTimeRef.current) || 0,
                                                    0,
                                                    Math.max(0, nextDuration || 0)
                                                );
                                                pendingRestoreTimeRef.current = null;
                                                try {
                                                    video.currentTime = restoreTime;
                                                    setCurrentTime(restoreTime);
                                                    setScrubTime(restoreTime);
                                                    scrubTimeRef.current = restoreTime;
                                                } catch {
                                                    // Some streams accept the seek after canplay.
                                                }
                                            }

                                            addLog(`Metadata ready: ${formatTime(video?.duration)}.`);
                                        }}
                                        onDurationChange={() => {
                                            const nextDuration = videoRef.current?.duration;
                                            setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
                                        }}
                                        onSeeked={() => {
                                            const video = videoRef.current;
                                            lastSpokenCueRef.current = -1;
                                            if ("speechSynthesis" in window) window.speechSynthesis.cancel();

                                            if (video && pendingResumeAfterSeekRef.current) {
                                                const shouldResume =
                                                    playbackIntentRef.current === "play";
                                                pendingResumeAfterSeekRef.current = false;

                                                if (shouldResume) {
                                                    playCurrentMedia();
                                                } else {
                                                    persistPausedStateNow();
                                                }
                                            }
                                        }}
                                        onError={handleVideoError}
                                        poster={
                                            isUsablePosterUrl(activePlaylistItem?.posterUrl)
                                                ? activePlaylistItem.posterUrl
                                                : undefined
                                        }
                                        sx={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: fitMode,
                                            backgroundColor: "black",
                                            filter: filterString,
                                            transformOrigin: "center",
                                            willChange: "transform, filter",
                                        }}
                                    >
                                        {subtitleUrl && (
                                            <track
                                                key={subtitleUrl}
                                                kind="subtitles"
                                                src={subtitleUrl}
                                                srcLang="en"
                                                label="AI English"
                                                default
                                            />
                                        )}
                                    </Box>

                                    {visualWarp.scanlines && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                inset: 0,
                                                pointerEvents: "none",
                                                opacity: 0.12 + visualWarp.intensity / 900,
                                                mixBlendMode: "screen",
                                                background:
                                                    "repeating-linear-gradient(180deg, rgba(255,255,255,0.11) 0px, rgba(255,255,255,0.11) 1px, rgba(0,0,0,0.17) 2px, rgba(0,0,0,0.17) 4px)",
                                            }}
                                        />
                                    )}
                                    {visualWarp.vignette && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                inset: 0,
                                                pointerEvents: "none",
                                                background:
                                                    "radial-gradient(circle at center, transparent 48%, rgba(0,0,0,0.66) 100%)",
                                            }}
                                        />
                                    )}
                                    {loadedSource && (
                                        <>
                                            {!isPlaying && (
                                                <IconButton
                                                    data-player-control="true"
                                                    aria-label="Play video"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        revealPlayerControls();
                                                        togglePlayback();
                                                    }}
                                                    sx={{
                                                        position: "absolute",
                                                        left: "50%",
                                                        top: "50%",
                                                        zIndex: 7,
                                                        width: { xs: 58, sm: 72 },
                                                        height: { xs: 58, sm: 72 },
                                                        transform: "translate(-50%, -50%)",
                                                        color: "white",
                                                        backgroundColor: "rgba(8,10,16,0.72)",
                                                        border: "1px solid rgba(255,255,255,0.28)",
                                                        backdropFilter: "blur(12px)",
                                                        boxShadow: "0 16px 44px rgba(0,0,0,0.45)",
                                                        "&:hover": {
                                                            backgroundColor: "rgba(8,10,16,0.9)",
                                                            transform: "translate(-50%, -50%) scale(1.05)",
                                                        },
                                                    }}
                                                >
                                                    <PlayArrowRounded sx={{ fontSize: { xs: 36, sm: 46 } }} />
                                                </IconButton>
                                            )}

                                            <Box
                                                data-player-control="true"
                                                onClick={(event) => event.stopPropagation()}
                                                onMouseEnter={() => revealPlayerControls(true)}
                                                onMouseLeave={() => revealPlayerControls()}
                                                sx={{
                                                    position: "absolute",
                                                    inset: "auto 0 0",
                                                    zIndex: 8,
                                                    px: { xs: 1, sm: 1.5 },
                                                    pt: 7,
                                                    pb: { xs: 0.7, sm: 1 },
                                                    opacity: controlsVisible ? 1 : 0,
                                                    pointerEvents: controlsVisible ? "auto" : "none",
                                                    transition: "opacity 170ms ease",
                                                    background:
                                                        "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.18) 20%, rgba(0,0,0,0.88) 100%)",
                                                }}
                                            >
                                                <Box sx={{ position: "relative", height: 24, display: "flex", alignItems: "center" }}>
                                                    <Box
                                                        sx={{
                                                            position: "absolute",
                                                            left: 0,
                                                            right: 0,
                                                            height: 4,
                                                            borderRadius: 99,
                                                            overflow: "hidden",
                                                            backgroundColor: "rgba(255,255,255,0.24)",
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                height: "100%",
                                                                width: `${duration > 0 ? Math.min(100, (bufferedTime / duration) * 100) : 0}%`,
                                                                backgroundColor: "rgba(255,255,255,0.48)",
                                                            }}
                                                        />
                                                    </Box>
                                                    <Slider
                                                        value={isScrubbing ? scrubTime : Number.isFinite(currentTime) ? currentTime : 0}
                                                        min={0}
                                                        max={Math.max(duration, 0.001)}
                                                        step={0.02}
                                                        onPointerDown={() => {
                                                            revealPlayerControls(true);
                                                            beginScrub();
                                                        }}
                                                        onMouseDown={() => {
                                                            revealPlayerControls(true);
                                                            beginScrub();
                                                        }}
                                                        onTouchStart={() => {
                                                            revealPlayerControls(true);
                                                            beginScrub();
                                                        }}
                                                        onChange={(_, nextValue) => updateScrub(nextValue)}
                                                        onChangeCommitted={(_, nextValue) => {
                                                            finishScrub(nextValue);
                                                            revealPlayerControls();
                                                        }}
                                                        onPointerUp={() => {
                                                            finishScrub(scrubTimeRef.current);
                                                            revealPlayerControls();
                                                        }}
                                                        onPointerCancel={() => {
                                                            finishScrub(scrubTimeRef.current);
                                                            revealPlayerControls();
                                                        }}
                                                        onTouchEnd={() => {
                                                            finishScrub(scrubTimeRef.current);
                                                            revealPlayerControls();
                                                        }}
                                                        aria-label="In-player video scrubber"
                                                        sx={{
                                                            position: "absolute",
                                                            inset: 0,
                                                            p: 0,
                                                            color: "#ff3158",
                                                            touchAction: "none",
                                                            "& .MuiSlider-rail": { opacity: 0 },
                                                            "& .MuiSlider-track": { border: 0, height: 4 },
                                                            "& .MuiSlider-thumb": {
                                                                width: 13,
                                                                height: 13,
                                                                opacity: isScrubbing ? 1 : 0,
                                                                transition: "opacity 120ms ease, transform 120ms ease",
                                                            },
                                                            "&:hover .MuiSlider-thumb, &:focus-visible .MuiSlider-thumb": {
                                                                opacity: 1,
                                                            },
                                                        }}
                                                    />
                                                </Box>

                                                <Stack
                                                    direction="row"
                                                    spacing={{ xs: 0.35, sm: 0.6 }}
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                >
                                                    <Stack direction="row" spacing={{ xs: 0.25, sm: 0.5 }} alignItems="center" minWidth={0}>
                                                        <IconButton
                                                            data-player-control="true"
                                                            aria-label={isPlaying ? "Pause" : "Play"}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                revealPlayerControls();
                                                                togglePlayback();
                                                            }}
                                                            sx={{ color: "white", p: { xs: 0.55, sm: 0.75 } }}
                                                        >
                                                            {isPlaying ? <PauseRounded /> : <PlayArrowRounded />}
                                                        </IconButton>

                                                        <IconButton
                                                            data-player-control="true"
                                                            aria-label={playerMuted || audioEffects.volume <= 0.001 ? "Unmute" : "Mute"}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                togglePlayerMute();
                                                            }}
                                                            sx={{ color: "white", p: { xs: 0.55, sm: 0.75 } }}
                                                        >
                                                            {playerMuted || audioEffects.volume <= 0.001 ? (
                                                                <VolumeOffRounded />
                                                            ) : (
                                                                <VolumeUpRounded />
                                                            )}
                                                        </IconButton>

                                                        <Slider
                                                            data-player-control="true"
                                                            aria-label="Player volume"
                                                            value={playerMuted ? 0 : audioEffects.volume}
                                                            min={0}
                                                            max={1}
                                                            step={0.01}
                                                            onChange={(_, nextValue) => changePlayerVolume(nextValue)}
                                                            sx={{
                                                                width: { xs: 70, sm: 96 },
                                                                color: "white",
                                                                display: { xs: "none", sm: "block" },
                                                                "& .MuiSlider-thumb": { width: 11, height: 11 },
                                                                "& .MuiSlider-track": { border: 0 },
                                                                "& .MuiSlider-rail": { opacity: 0.35 },
                                                            }}
                                                        />

                                                        <Typography
                                                            sx={{
                                                                ...monoTextSx,
                                                                ml: { xs: 0.25, sm: 0.75 },
                                                                color: "white",
                                                                fontSize: { xs: 10, sm: 11 },
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {formatTime(isScrubbing ? scrubTime : currentTime)} / {formatTime(duration)}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" spacing={{ xs: 0.2, sm: 0.45 }} alignItems="center">
                                                        <IconButton
                                                            data-player-control="true"
                                                            aria-label="Picture in picture"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                requestPictureInPicture();
                                                            }}
                                                            sx={{
                                                                color: "white",
                                                                p: { xs: 0.55, sm: 0.75 },
                                                                display: { xs: "none", sm: "inline-flex" },
                                                            }}
                                                        >
                                                            <PictureInPictureAltRounded fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            data-player-control="true"
                                                            aria-label="Fullscreen"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                requestFullscreen();
                                                            }}
                                                            sx={{ color: "white", p: { xs: 0.55, sm: 0.75 } }}
                                                        >
                                                            <FullscreenRounded />
                                                        </IconButton>
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        </>
                                    )}

                                    {!loadedSource && (
                                        <Stack
                                            spacing={1}
                                            alignItems="center"
                                            sx={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "grid",
                                                placeContent: "center",
                                                textAlign: "center",
                                                p: 3,
                                            }}
                                        >
                                            <FileOpenRounded sx={{ color: "rgba(255,255,255,0.2)", fontSize: 48 }} />
                                            <Typography sx={{ color: "rgba(255,255,255,0.38)", fontWeight: 900 }}>
                                                Import a clip or load a direct media URL.
                                            </Typography>
                                        </Stack>
                                    )}
                                </Box>

                                <Box sx={{ mt: 1.25 }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.45 }}>
                                        <Typography sx={{ ...monoTextSx, color: "rgba(255,255,255,0.42)", fontSize: 9 }}>
                                            TIMELINE
                                        </Typography>
                                        <Typography sx={{ ...monoTextSx, color: "rgba(255,255,255,0.42)", fontSize: 9 }}>
                                            {duration > 0 ? `${Math.round((currentTime / duration) * 100)}%` : "0%"}
                                        </Typography>
                                    </Stack>
                                    <Box
                                        sx={{
                                            position: "relative",
                                            height: 56,
                                            overflow: "hidden",
                                            borderRadius: 1.25,
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            background:
                                                "repeating-linear-gradient(90deg, rgba(158,232,255,0.12) 0 2px, transparent 2px 7px), linear-gradient(180deg, rgba(158,232,255,0.09), rgba(179,140,255,0.04))",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                bottom: 0,
                                                left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                                width: 2,
                                                backgroundColor: "#d8f8ff",
                                                boxShadow: "0 0 10px rgba(158,232,255,0.8)",
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1}
                                    alignItems={{ xs: "stretch", sm: "center" }}
                                    justifyContent="space-between"
                                    sx={{ mt: 1.25 }}
                                >
                                    <FormControl size="small" sx={{ minWidth: 130 }}>
                                        <InputLabel sx={{ color: "rgba(255,255,255,0.55)" }}>Monitor fit</InputLabel>
                                        <Select
                                            value={fitMode}
                                            label="Monitor fit"
                                            onChange={(event) => setFitMode(event.target.value)}
                                            sx={{ color: "white", borderRadius: 1.5, fontSize: 11 }}
                                        >
                                            <MenuItem value="contain">Contain</MenuItem>
                                            <MenuItem value="cover">Cover</MenuItem>
                                            <MenuItem value="fill">Fill</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                        <Button onClick={captureFrame} startIcon={<DownloadRounded />} sx={softButtonSx}>
                                            Capture Frame
                                        </Button>
                                        <Button onClick={resetAllEffects} startIcon={<RestartAltRounded />} sx={softButtonSx}>
                                            Reset Session FX
                                        </Button>
                                    </Stack>
                                </Stack>
                            </DawPanel>

                            <DawPanel
                                eyebrow="Image Rack"
                                title="Visual FX Console"
                                icon={<FilterAltRounded fontSize="small" />}
                            >
                                <Grid container spacing={1.25}>
                                    <Grid item xs={12} md={6} xl={4}>
                                        <DawSection title="Color Lab" subtitle="Static monitor processing">
                                            <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                                                {Object.keys(VIDEO_PRESETS).map((presetName) => (
                                                    <Button
                                                        key={presetName}
                                                        size="small"
                                                        onClick={() => applyPreset(presetName)}
                                                        sx={{ ...softButtonSx, minWidth: 0, px: 1, fontSize: 9 }}
                                                    >
                                                        {presetName}
                                                    </Button>
                                                ))}
                                            </Stack>
                                            <EffectSlider label="Brightness" value={videoEffects.brightness} minimum={0} maximum={200} unit="%" onChange={(value) => setVideoEffect("brightness", value)} />
                                            <EffectSlider label="Contrast" value={videoEffects.contrast} minimum={0} maximum={200} unit="%" onChange={(value) => setVideoEffect("contrast", value)} />
                                            <EffectSlider label="Saturation" value={videoEffects.saturation} minimum={0} maximum={250} unit="%" onChange={(value) => setVideoEffect("saturation", value)} />
                                            <EffectSlider label="Hue" value={videoEffects.hue} minimum={-180} maximum={180} unit="°" onChange={(value) => setVideoEffect("hue", value)} />
                                            <EffectSlider label="Blur" value={videoEffects.blur} minimum={0} maximum={12} step={0.1} unit="px" onChange={(value) => setVideoEffect("blur", value)} />
                                        </DawSection>
                                    </Grid>
                                    <Grid item xs={12} md={6} xl={4}>
                                        <DawSection title="Texture + Transform" subtitle="Frame geometry and texture">
                                            <EffectSlider label="Grayscale" value={videoEffects.grayscale} minimum={0} maximum={100} unit="%" onChange={(value) => setVideoEffect("grayscale", value)} />
                                            <EffectSlider label="Sepia" value={videoEffects.sepia} minimum={0} maximum={100} unit="%" onChange={(value) => setVideoEffect("sepia", value)} />
                                            <EffectSlider label="Invert" value={videoEffects.invert} minimum={0} maximum={100} unit="%" onChange={(value) => setVideoEffect("invert", value)} />
                                            <EffectSlider label="Zoom" value={videoEffects.zoom} minimum={50} maximum={200} unit="%" onChange={(value) => setVideoEffect("zoom", value)} />
                                            <EffectSlider label="Rotation" value={videoEffects.rotate} minimum={-180} maximum={180} unit="°" onChange={(value) => setVideoEffect("rotate", value)} />
                                        </DawSection>
                                    </Grid>
                                    <Grid item xs={12} xl={4}>
                                        <DawSection title="Animated Warp" subtitle="SVG displacement and 3D motion">
                                            <Stack direction="row" spacing={0.55} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                                                {Object.entries(VISUAL_WARP_PRESETS).map(([presetName, preset]) => (
                                                    <Button
                                                        key={presetName}
                                                        size="small"
                                                        onClick={() => setVisualWarp({ ...preset })}
                                                        sx={{ ...softButtonSx, minWidth: 0, px: 1, fontSize: 9 }}
                                                    >
                                                        {presetName}
                                                    </Button>
                                                ))}
                                            </Stack>
                                            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                                <InputLabel sx={{ color: "rgba(255,255,255,0.55)" }}>Warp mode</InputLabel>
                                                <Select
                                                    value={visualWarp.mode}
                                                    label="Warp mode"
                                                    onChange={(event) => setVisualWarp((current) => ({ ...current, mode: event.target.value }))}
                                                    sx={{ color: "white", borderRadius: 1.5, fontSize: 11 }}
                                                >
                                                    {[
                                                        "none",
                                                        "liquid",
                                                        "vortex",
                                                        "pulse",
                                                        "glitch",
                                                        "rubber",
                                                        "drift",
                                                        "shake",
                                                        "twist",
                                                    ].map((mode) => (
                                                        <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <EffectSlider label="Intensity" value={visualWarp.intensity} minimum={0} maximum={100} unit="%" onChange={(value) => setVisualWarp((current) => ({ ...current, intensity: value }))} />
                                            <EffectSlider label="Speed" value={visualWarp.speed} minimum={0.05} maximum={6} step={0.05} unit=" Hz" onChange={(value) => setVisualWarp((current) => ({ ...current, speed: value }))} />
                                            <EffectSlider label="Displacement" value={visualWarp.displacement} minimum={0} maximum={120} unit=" px" onChange={(value) => setVisualWarp((current) => ({ ...current, displacement: value }))} />
                                            <EffectSlider label="Perspective" value={visualWarp.perspective} minimum={0} maximum={60} unit="°" onChange={(value) => setVisualWarp((current) => ({ ...current, perspective: value }))} />
                                            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={0.5}>
                                                <FormControlLabel control={<Switch size="small" checked={visualWarp.syncToVideo} onChange={(event) => setVisualWarp((current) => ({ ...current, syncToVideo: event.target.checked }))} />} label={<Typography sx={{ fontSize: 10 }}>Sync timeline</Typography>} />
                                                <FormControlLabel control={<Switch size="small" checked={visualWarp.scanlines} onChange={(event) => setVisualWarp((current) => ({ ...current, scanlines: event.target.checked }))} />} label={<Typography sx={{ fontSize: 10 }}>Scanlines</Typography>} />
                                                <FormControlLabel control={<Switch size="small" checked={visualWarp.vignette} onChange={(event) => setVisualWarp((current) => ({ ...current, vignette: event.target.checked }))} />} label={<Typography sx={{ fontSize: 10 }}>Vignette</Typography>} />
                                            </Stack>
                                        </DawSection>
                                    </Grid>
                                </Grid>
                            </DawPanel>
                        </Stack>

                        <Stack spacing={1.25}>
                            <DawPanel
                                eyebrow="Audio Bus"
                                title="Web Audio Console"
                                icon={<GraphicEqRounded fontSize="small" />}
                                action={
                                    <Chip
                                        size="small"
                                        label={audioContextRef.current ? "ENGINE ON" : "ENGINE IDLE"}
                                        sx={{
                                            color: audioContextRef.current ? "#7ef4b6" : "#ffcf7a",
                                            fontSize: 8.5,
                                            height: 21,
                                        }}
                                    />
                                }
                            >
                                <Stack spacing={1.25}>
                                    <DawSection title="Signal Flow" subtitle="All Web Audio processing stays in this rack">
                                        <Box sx={{ position: "relative", overflowX: "auto", pb: 0.5 }}>
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    left: 26,
                                                    right: 26,
                                                    top: 13,
                                                    height: 2,
                                                    background:
                                                        "linear-gradient(90deg, rgba(158,232,255,0.25), rgba(179,140,255,0.42))",
                                                }}
                                            />
                                            <Stack direction="row" spacing={1.1} justifyContent="space-between" minWidth={330}>
                                                <SignalNode label="Media" active={Boolean(loadedSource)} />
                                                <SignalNode label="EQ" active={Boolean(audioContextRef.current)} />
                                                <SignalNode label="Pan" active={Boolean(audioContextRef.current)} />
                                                <SignalNode label="Warp" detail="SoundTouch" active={Boolean(soundTouchNodeRef.current)} />
                                                <SignalNode label="Master" active={Boolean(audioContextRef.current)} />
                                                <SignalNode label="Out" active={isPlaying} />
                                            </Stack>
                                        </Box>
                                        <Button
                                            fullWidth
                                            onClick={ensureAudioGraph}
                                            startIcon={<VolumeUpRounded />}
                                            variant="contained"
                                            sx={{ ...primaryPillSx, mt: 1.25, minHeight: 40 }}
                                        >
                                            Activate / Resume Audio Engine
                                        </Button>
                                    </DawSection>

                                    <DawSection title="Mixer Strip" subtitle="Gain staging, stereo field, and 3-band EQ">
                                        <Stack direction="row" spacing={1.2} justifyContent="center" alignItems="flex-start">
                                            <VerticalFader label="Bass" value={audioEffects.bass} minimum={-24} maximum={24} step={1} unit="dB" onChange={(value) => setAudioEffect("bass", value)} />
                                            <VerticalFader label="Mid" value={audioEffects.mid} minimum={-24} maximum={24} step={1} unit="dB" onChange={(value) => setAudioEffect("mid", value)} />
                                            <VerticalFader label="High" value={audioEffects.treble} minimum={-24} maximum={24} step={1} unit="dB" onChange={(value) => setAudioEffect("treble", value)} />
                                            <VerticalFader label="Pan" value={audioEffects.pan} minimum={-1} maximum={1} step={0.01} unit="" onChange={(value) => setAudioEffect("pan", value)} />
                                            <VerticalFader label="Master" value={audioEffects.volume} minimum={0} maximum={1} step={0.01} unit="" onChange={(value) => setAudioEffect("volume", value)} />
                                            <MiniMeter value={isPlaying ? audioEffects.volume * (0.58 + Math.abs(Math.sin(currentTime * 8)) * 0.4) : 0.02} label="L" />
                                            <MiniMeter value={isPlaying ? audioEffects.volume * (0.52 + Math.abs(Math.cos(currentTime * 7.4)) * 0.43) : 0.02} label="R" />
                                        </Stack>
                                    </DawSection>

                                    <DawSection
                                        title="Smooth SoundTouch Time + Pitch"
                                        subtitle="The video clock and SoundTouch receive one mirrored, smoothed tempo so audio stays synchronized"
                                    >
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={smoothTempoEnabled}
                                                    onChange={(event) =>
                                                        setSmoothTempoEnabled(
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                            }
                                            label={
                                                <Typography sx={{ fontSize: 10.5 }}>
                                                    Smooth tempo changes
                                                </Typography>
                                            }
                                        />
                                        <EffectSlider
                                            label="Video tempo"
                                            value={playbackRate}
                                            minimum={0.25}
                                            maximum={4}
                                            step={0.01}
                                            unit="×"
                                            onChange={setPlaybackRate}
                                        />
                                        <EffectSlider
                                            label="Tempo smoothing"
                                            value={tempoSmoothingMs}
                                            minimum={20}
                                            maximum={800}
                                            step={10}
                                            unit=" ms"
                                            onChange={setTempoSmoothingMs}
                                        />
                                        <Stack
                                            direction="row"
                                            spacing={0.5}
                                            useFlexGap
                                            flexWrap="wrap"
                                            sx={{ mb: 0.75 }}
                                        >
                                            {[0.5, 0.75, 0.85, 1, 1.25].map(
                                                (tempoPreset) => (
                                                    <Button
                                                        key={tempoPreset}
                                                        size="small"
                                                        onClick={() =>
                                                            setPlaybackRate(tempoPreset)
                                                        }
                                                        sx={{
                                                            ...softButtonSx,
                                                            minWidth: 48,
                                                            px: 1,
                                                            fontSize: 9,
                                                        }}
                                                    >
                                                        {tempoPreset.toFixed(2)}×
                                                    </Button>
                                                )
                                            )}
                                        </Stack>
                                        <EffectSlider
                                            label="Pitch"
                                            value={pitchSemitones}
                                            minimum={-24}
                                            maximum={24}
                                            step={0.1}
                                            unit=" st"
                                            onChange={setPitchSemitones}
                                        />
                                        <EffectSlider
                                            label="Fine pitch"
                                            value={finePitchCents}
                                            minimum={-100}
                                            maximum={100}
                                            step={1}
                                            unit=" ct"
                                            onChange={setFinePitchCents}
                                        />
                                        <Stack
                                            direction="row"
                                            spacing={0.75}
                                            useFlexGap
                                            flexWrap="wrap"
                                            sx={{ mt: 0.75 }}
                                        >
                                            <Chip
                                                size="small"
                                                label={`LIVE ${liveWarpReadout.tempo.toFixed(
                                                    3
                                                )}×`}
                                                sx={{
                                                    ...monoTextSx,
                                                    color: "#9ee8ff",
                                                    fontSize: 9,
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label={`${liveWarpReadout.pitch.toFixed(
                                                    2
                                                )} st`}
                                                sx={{
                                                    ...monoTextSx,
                                                    color: "#c5adff",
                                                    fontSize: 9,
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label={
                                                    soundTouchNodeRef.current
                                                        ? "SOUNDTOUCH SYNC"
                                                        : "NATIVE FALLBACK"
                                                }
                                                sx={{
                                                    ...monoTextSx,
                                                    color: soundTouchNodeRef.current
                                                        ? "#7ef4b6"
                                                        : "#ffcf7a",
                                                    fontSize: 9,
                                                }}
                                            />
                                        </Stack>
                                    </DawSection>

                                    <DawSection title="Modulation Rack" subtitle="Tempo LFO and pitch LFO">
                                        <Stack spacing={1.2}>
                                            <Box sx={{ p: 1, borderRadius: 1.5, backgroundColor: "rgba(158,232,255,0.035)", border: "1px solid rgba(158,232,255,0.09)" }}>
                                                <FormControlLabel
                                                    control={<Switch size="small" checked={timeWarp.enabled} onChange={(event) => setTimeWarp((current) => ({ ...current, enabled: event.target.checked }))} />}
                                                    label={<Typography sx={{ fontSize: 11, fontWeight: 900 }}>Tempo LFO</Typography>}
                                                />
                                                <FormControl fullWidth size="small" sx={{ my: 0.75 }}>
                                                    <InputLabel sx={{ color: "rgba(255,255,255,0.55)" }}>Waveform</InputLabel>
                                                    <Select value={timeWarp.shape} label="Waveform" onChange={(event) => setTimeWarp((current) => ({ ...current, shape: event.target.value }))} sx={{ color: "white", borderRadius: 1.5, fontSize: 11 }}>
                                                        {['sine', 'triangle', 'square', 'saw'].map((shape) => <MenuItem key={shape} value={shape}>{shape}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                                <EffectSlider label="Depth" value={timeWarp.depth} minimum={0} maximum={0.9} step={0.01} unit="" onChange={(value) => setTimeWarp((current) => ({ ...current, depth: value }))} />
                                                <EffectSlider label="Rate" value={timeWarp.frequency} minimum={0.02} maximum={8} step={0.01} unit=" Hz" onChange={(value) => setTimeWarp((current) => ({ ...current, frequency: value }))} />
                                            </Box>
                                            <Box sx={{ p: 1, borderRadius: 1.5, backgroundColor: "rgba(179,140,255,0.035)", border: "1px solid rgba(179,140,255,0.1)" }}>
                                                <FormControlLabel
                                                    control={<Switch size="small" checked={pitchWarp.enabled} onChange={(event) => setPitchWarp((current) => ({ ...current, enabled: event.target.checked }))} />}
                                                    label={<Typography sx={{ fontSize: 11, fontWeight: 900 }}>Pitch LFO</Typography>}
                                                />
                                                <FormControl fullWidth size="small" sx={{ my: 0.75 }}>
                                                    <InputLabel sx={{ color: "rgba(255,255,255,0.55)" }}>Waveform</InputLabel>
                                                    <Select value={pitchWarp.shape} label="Waveform" onChange={(event) => setPitchWarp((current) => ({ ...current, shape: event.target.value }))} sx={{ color: "white", borderRadius: 1.5, fontSize: 11 }}>
                                                        {['sine', 'triangle', 'square', 'saw'].map((shape) => <MenuItem key={shape} value={shape}>{shape}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                                <EffectSlider label="Depth" value={pitchWarp.depth} minimum={0} maximum={12} step={0.1} unit=" st" onChange={(value) => setPitchWarp((current) => ({ ...current, depth: value }))} />
                                                <EffectSlider label="Rate" value={pitchWarp.frequency} minimum={0.02} maximum={8} step={0.01} unit=" Hz" onChange={(value) => setPitchWarp((current) => ({ ...current, frequency: value }))} />
                                            </Box>
                                        </Stack>
                                    </DawSection>

                                    <DawSection title="Translation Monitor" subtitle="Original program-audio behavior">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={translationEnabled}
                                                    onChange={(event) => {
                                                        if (event.target.checked) {
                                                            setTranslationEnabled(true);
                                                        } else {
                                                            disableTranslationAudioMode();
                                                        }
                                                    }}
                                                />
                                            }
                                            label={<Typography sx={{ fontSize: 10.5 }}>Translation mode</Typography>}
                                        />
                                        <FormControlLabel control={<Switch size="small" checked={muteOriginalForTranslation} onChange={(event) => setMuteOriginalForTranslation(event.target.checked)} />} label={<Stack direction="row" spacing={0.5} alignItems="center"><VolumeOffRounded sx={{ fontSize: 15 }} /><Typography sx={{ fontSize: 10.5 }}>Mute original bus</Typography></Stack>} />
                                    </DawSection>
                                </Stack>
                            </DawPanel>
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.35fr) minmax(360px, 0.65fr)" },
                            gap: 1.25,
                        }}
                    >
                        <DawPanel
                            eyebrow="Machine Learning Rack"
                            title="Whisper Translation + Caption Editor"
                            icon={<TranslateRounded fontSize="small" />}
                        >
                            <Grid container spacing={1.25}>
                                <Grid item xs={12} md={4}>
                                    <DawSection title="Model" icon={<MemoryRounded fontSize="small" />}>
                                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                            <InputLabel sx={{ color: "rgba(255,255,255,0.55)" }}>Whisper model</InputLabel>
                                            <Select value={modelId} label="Whisper model" onChange={(event) => setModelId(event.target.value)} sx={{ color: "white", borderRadius: 1.5, fontSize: 11 }}>
                                                {MODEL_OPTIONS.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                            <InputLabel sx={{ color: "rgba(255,255,255,0.55)" }}>Source language</InputLabel>
                                            <Select value={sourceLanguage} label="Source language" onChange={(event) => setSourceLanguage(event.target.value)} sx={{ color: "white", borderRadius: 1.5, fontSize: 11 }}>
                                                {LANGUAGE_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                        <Typography sx={{ color: "rgba(255,255,255,0.48)", fontSize: 10, mb: 0.5 }}>Model · {modelState}</Typography>
                                        <LinearProgress variant="determinate" value={modelProgress} sx={{ height: 6, borderRadius: 99, mb: 1 }} />
                                        <Typography sx={{ color: "rgba(255,255,255,0.48)", fontSize: 10, mb: 0.5 }}>Task · {translationState}</Typography>
                                        <LinearProgress variant="determinate" value={translationProgress} sx={{ height: 6, borderRadius: 99 }} />
                                    </DawSection>
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <DawSection title="English Output" icon={<ClosedCaptionRounded fontSize="small" />}>
                                        <TextField
                                            value={translatedText}
                                            onChange={(event) => setTranslatedText(event.target.value)}
                                            multiline
                                            minRows={8}
                                            fullWidth
                                            placeholder="Translated English transcript appears here."
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    color: "white",
                                                    borderRadius: 1.5,
                                                    alignItems: "flex-start",
                                                    backgroundColor: "rgba(0,0,0,0.24)",
                                                    ...monoTextSx,
                                                    fontSize: 11,
                                                },
                                            }}
                                        />
                                    </DawSection>
                                </Grid>
                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
                                        <Button onClick={loadTranslationModel} startIcon={<MemoryRounded />} sx={softButtonSx}>Load Model</Button>
                                        <Button onClick={translateVideoToEnglish} startIcon={<TranslateRounded />} variant="contained" sx={primaryPillSx}>Translate Clip</Button>
                                        <Button onClick={cancelTranslation} startIcon={<StopRounded />} sx={softButtonSx}>Cancel</Button>
                                        <FormControlLabel control={<Switch size="small" checked={englishVoiceEnabled} disabled={!translatedCues.length} onChange={(event) => setEnglishVoiceEnabled(event.target.checked)} />} label={<Typography sx={{ fontSize: 10.5 }}>Cue-synced English voice</Typography>} />
                                        <Box flex={1} />
                                        <Tooltip title="Copy transcript">
                                            <span>
                                                <IconButton disabled={!translatedText} onClick={copyTranscript} sx={iconButtonSx}><ContentCopyRounded /></IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Download transcript">
                                            <span>
                                                <IconButton disabled={!translatedText} onClick={() => downloadTextFile("video-translation-en.txt", translatedText)} sx={iconButtonSx}><DownloadRounded /></IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Download captions">
                                            <span>
                                                <IconButton disabled={!translatedCues.length} onClick={() => downloadTextFile("video-translation-en.vtt", cuesToVtt(translatedCues), "text/vtt;charset=utf-8")} sx={iconButtonSx}><ClosedCaptionRounded /></IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Clear translation">
                                            <span>
                                                <IconButton disabled={!subtitleUrl && !translatedText} onClick={clearSubtitles} sx={iconButtonSx}><RefreshRounded /></IconButton>
                                            </span>
                                        </Tooltip>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </DawPanel>

                        <DawPanel
                            eyebrow="Diagnostics"
                            title="Engine Console"
                            icon={<TuneRounded fontSize="small" />}
                            action={
                                <Stack direction="row" spacing={0.5}>
                                    <Chip size="small" label={corsSafeSource ? "WEB AUDIO READY" : "NATIVE MEDIA"} sx={{ color: corsSafeSource ? "#7ef4b6" : "#ffcf7a", fontSize: 8.5, height: 21 }} />
                                    <Chip size="small" label={loadedSource ? "MEDIA READY" : "NO MEDIA"} sx={{ color: loadedSource ? "#9ee8ff" : "rgba(255,255,255,0.4)", fontSize: 8.5, height: 21 }} />
                                </Stack>
                            }
                        >
                            <StatusLog logs={logs} />
                        </DawPanel>
                    </Box>
                </Stack>
            </Box>
        </GradientPage>
    );
}