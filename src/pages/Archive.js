import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  AddRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  FolderRounded,
  HomeRounded,
  MovieCreationRounded,
  OpenInNewRounded,
  PlayArrowRounded,
  PlaylistAddRounded,
  QueuePlayNextRounded,
  RestartAltRounded,
  SearchRounded,
  TheatersRounded,
  VideoFileRounded,
} from "@mui/icons-material";
import {AppNavBar, GradientPage} from "../components/components";

const ARCHIVE_SEARCH_BATCH_SIZE = 24;
const PLAYER_ROUTE = "/player";
const PLAYER_PLAYLIST_STORAGE_KEY = "audiomasterlab-video-playlist-v1";
const PLAYER_PLAYLIST_LIBRARY_STORAGE_KEY =
    "audiomasterlab-video-playlist-library-v2";
const PLAYER_PLAYLIST_LIBRARY_VERSION = 2;
const PLAYER_HANDOFF_STORAGE_KEY = "audiomasterlab-video-player-handoff-v1";
const CUSTOM_COLLECTIONS_STORAGE_KEY = "audiomasterlab-archive-custom-collections-v1";
const ARCHIVE_PAGE_BUILD =
    "archive-direct-media-v5-player-library-handoff";
const MIN_PLAYABLE_BYTES = 128 * 1024;

const PLAYABLE_VIDEO_EXTENSIONS = [".mp4", ".m4v", ".webm", ".ogv", ".ogg"];
const PLAYABLE_VIDEO_FORMATS = [
  "h.264",
  "mpeg4",
  "512kb mpeg4",
  "webm",
  "ogg video",
  "theora",
];
const BLOCKED_VIDEO_FILE_TERMS = [
  "_thumb",
  "thumbs",
  "thumbnail",
  "spectrogram",
  "metadata",
  "files.xml",
  "torrent",
  "_meta.",
  "_itemimage",
];

const BLOCKED_POSTER_FILE_TERMS = [
  "__ia_thumb",
  "_thumb",
  "thumbs",
  "thumbnail",
  "spectrogram",
  "waveform",
  "metadata",
  "_meta.",
  "_itemimage",
];
const MIN_POSTER_BYTES = 8 * 1024;

const VIDEO_COLLECTIONS = [
  {
    id: "opensource_movies",
    label: "Community Video",
    description: "Broad public uploads with MP4, WebM, and other browser-playable videos.",
  },
  {
    id: "prelinger",
    label: "Prelinger",
    description: "Historic films, commercials, educational reels, and archival footage.",
  },
  {
    id: "movies",
    label: "Moving Image",
    description: "Archive.org's top-level video collection.",
  },
  {
    id: "classic_tv",
    label: "Classic TV",
    description: "Public and historic television material.",
  },
  {
    id: "animationandcartoons",
    label: "Animation",
    description: "Animation, cartoons, shorts, and visual experiments.",
  },
  {
    id: "feature_films",
    label: "Feature Films",
    description: "Feature-length films and public-domain cinema uploads.",
  },
  {
    id: "educationalfilms",
    label: "Educational Films",
    description: "Instructional films, classrooms, training footage, and demos.",
  },
  {
    id: "newsandpublicaffairs",
    label: "News",
    description: "News, public affairs, interviews, and documentary-style video.",
  },
  {
    id: "gamevideos",
    label: "Game Videos",
    description: "Gameplay, walkthroughs, speedruns, and game culture video.",
  },
  {
    id: "computersandtechvideos",
    label: "Tech Videos",
    description: "Computer, technology, software, and science video.",
  },
];

const DEFAULT_COLLECTIONS = ["opensource_movies", "prelinger", "movies"];
const SEARCH_FIELDS =
    "identifier,title,creator,collection,date,downloads,description,subject,item_size";

function normalizeCollectionId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  let candidate = raw.replace(/^collection\s*:\s*/i, "").trim();

  try {
    const parsed = new URL(candidate);
    if (/^(www\.)?archive\.org$/i.test(parsed.hostname)) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const detailsIndex = parts.findIndex((part) => part.toLowerCase() === "details");
      if (detailsIndex >= 0 && parts[detailsIndex + 1]) {
        candidate = decodeURIComponent(parts[detailsIndex + 1]);
      }
    }
  } catch {
    // The user entered an Archive collection identifier rather than a URL.
  }

  return candidate
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "")
      .slice(0, 160);
}

function humanizeCollectionId(value) {
  const id = String(value || "").trim();
  if (!id) return "Unknown collection";

  return id
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeCollectionValues(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
      .flatMap((entry) => String(entry || "").split(","))
      .map((entry) => entry.trim())
      .filter(Boolean)
      .filter((entry, index, all) => all.indexOf(entry) === index);
}

function mergeUniqueStrings(...groups) {
  const seen = new Set();
  const merged = [];

  groups.flat().forEach((value) => {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    merged.push(normalized);
  });

  return merged;
}

function readCustomCollections() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_COLLECTIONS_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];

    const seen = new Set();
    return parsed
        .map((collection) => {
          const id = normalizeCollectionId(collection?.id);
          const label = String(collection?.label || "").trim() || humanizeCollectionId(id);
          return id ? { id, label, description: `Custom Archive collection: ${id}`, custom: true } : null;
        })
        .filter((collection) => {
          if (!collection || seen.has(collection.id)) return false;
          seen.add(collection.id);
          return true;
        });
  } catch {
    return [];
  }
}

function writeCustomCollections(collections) {
  try {
    localStorage.setItem(
        CUSTOM_COLLECTIONS_STORAGE_KEY,
        JSON.stringify(
            collections.map(({ id, label }) => ({ id, label }))
        )
    );
  } catch {
    // Searching still works when browser storage is unavailable.
  }
}

function createCollectionLabelMap(collections) {
  return new Map(
      collections.map((collection) => [collection.id, collection.label || humanizeCollectionId(collection.id)])
  );
}

function resolveCollectionLabels(collectionIds, collectionLabelMap) {
  return normalizeCollectionValues(collectionIds).map(
      (collectionId) => collectionLabelMap.get(collectionId) || humanizeCollectionId(collectionId)
  );
}

const pageSx = {
  minHeight: "100vh",
  color: "#f4f8ff",
  background:
      "radial-gradient(circle at 18% 8%, rgba(158,232,255,0.18), transparent 32%), radial-gradient(circle at 86% 0%, rgba(179,140,255,0.16), transparent 30%), #050711",
};

const cardSx = {
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 2,
  background: "rgba(10,16,32,0.78)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.32)",
  backdropFilter: "blur(18px)",
};

const softCardSx = {
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 2,
  background: "rgba(255,255,255,0.04)",
};

const primaryButtonSx = {
  borderRadius: 999,
  px: 2.5,
  fontWeight: 900,
  color: "#07111f",
  background: "linear-gradient(135deg, #9ee8ff, #b38cff)",
  "&:hover": {
    background: "linear-gradient(135deg, #b8f0ff, #c7a8ff)",
  },
};

function getString(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value ? String(value) : "";
}

function getFileNameExtension(name) {
  const clean = String(name || "").split("?")[0].split("#")[0].toLowerCase();
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot) : "";
}

function formatCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return new Intl.NumberFormat("en", { notation: "compact" }).format(number);
}

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size >= 10 || unit === 0 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`;
}

function sanitizeSolrPhrase(value) {
  return String(value || "")
      .replace(/[\\"]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
}

function quoteSolr(value) {
  return `"${sanitizeSolrPhrase(value)}"`;
}

function tokenizeQuery(value) {
  return sanitizeSolrPhrase(value)
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 1)
      .slice(0, 8);
}

function buildArchiveSearchQuery(searchTerm, collectionIds) {
  const collections = (collectionIds || []).length ? collectionIds : DEFAULT_COLLECTIONS;
  const collectionQuery = collections.map((id) => `collection:${quoteSolr(id)}`).join(" OR ");
  const trimmed = sanitizeSolrPhrase(searchTerm);

  if (!trimmed) {
    return `mediatype:movies AND (${collectionQuery})`;
  }

  const tokens = tokenizeQuery(trimmed);
  const exact = quoteSolr(trimmed);
  const tokenQuery = tokens.length
      ? tokens
          .map((token) => {
            const safe = quoteSolr(token);
            return `(title:${safe} OR creator:${safe} OR subject:${safe} OR description:${safe} OR identifier:${safe})`;
          })
          .join(" AND ")
      : "";

  return [
    "mediatype:movies",
    `(${collectionQuery})`,
    `((title:${exact} OR creator:${exact} OR subject:${exact} OR description:${exact} OR identifier:${exact})${
        tokenQuery ? ` OR (${tokenQuery})` : ""
    })`,
  ].join(" AND ");
}

function buildArchiveAdvancedSearchUrl(searchTerm, collectionIds, page) {
  const params = new URLSearchParams({
    q: buildArchiveSearchQuery(searchTerm, collectionIds),
    fl: SEARCH_FIELDS,
    rows: String(ARCHIVE_SEARCH_BATCH_SIZE),
    page: String(page),
    output: "json",
    sort: "downloads desc",
  });

  return `https://archive.org/advancedsearch.php?${params.toString()}`;
}

async function fetchArchiveJson(targetUrl, signal) {
  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      signal,
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
      throw new Error("Archive returned an invalid JSON response.");
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error(error?.message || "Direct Archive JSON request failed.");
  }
}

function isAllowedIaHost(hostname) {
  return /^ia\d+\.us\.archive\.org$/i.test(String(hostname || ""));
}

function encodeArchivePathPart(part) {
  return String(part || "")
      .split("/")
      .filter(Boolean)
      .map((piece) => encodeURIComponent(piece))
      .join("/");
}

function buildArchiveFileUrl(identifier, fileName, mode = "download") {
  return `https://archive.org/${mode}/${encodeURIComponent(identifier)}/${encodeArchivePathPart(fileName)}`;
}

function normalizeMetadataDir(identifier, dir) {
  const fallback = `/items/${identifier}`;
  const value = String(dir || "").trim();
  if (!value) return fallback;
  if (value.includes("/items/")) return value;
  return fallback;
}

function buildIaFileUrl(hostname, identifier, fileName, dir) {
  if (!isAllowedIaHost(hostname)) return "";
  const root = normalizeMetadataDir(identifier, dir).replace(/\/+$/, "");
  return `https://${hostname}${root}/${encodeArchivePathPart(fileName)}`;
}

function getArchiveDetailsUrl(identifier) {
  return `https://archive.org/details/${encodeURIComponent(identifier)}`;
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

function normalizePlayerPlaylistItem(item) {
  const url = String(item?.url || "").trim();
  if (!url) return null;

  return {
    ...item,
    id: String(item?.id || makePlaylistItemId(url)),
    url,
    label: String(item?.label || item?.fileName || "Untitled video"),
    fileName: String(item?.fileName || ""),
    posterUrl: String(item?.posterUrl || ""),
    sourceType: String(item?.sourceType || "Archive.org"),
    detailsUrl: String(item?.detailsUrl || ""),
    archiveIdentifier: String(item?.archiveIdentifier || ""),
    archiveCollectionIds: Array.isArray(item?.archiveCollectionIds)
        ? item.archiveCollectionIds
        : [],
    archiveCollectionNames: Array.isArray(item?.archiveCollectionNames)
        ? item.archiveCollectionNames
        : [],
    size: Number(item?.size || 0),
  };
}

function readLegacyPlayerPlaylist() {
  try {
    const parsed = JSON.parse(
        localStorage.getItem(PLAYER_PLAYLIST_STORAGE_KEY) || "[]"
    );
    return Array.isArray(parsed)
        ? parsed.map(normalizePlayerPlaylistItem).filter(Boolean)
        : [];
  } catch {
    return [];
  }
}

function normalizePlayerPlaylistLibrary(value) {
  const rawPlaylists = Array.isArray(value?.playlists) ? value.playlists : [];
  const playlists = rawPlaylists
      .map((playlist, index) => {
        const items = Array.isArray(playlist?.items)
            ? playlist.items.map(normalizePlayerPlaylistItem).filter(Boolean)
            : [];
        const name =
            String(playlist?.name || `Playlist ${index + 1}`).trim() ||
            `Playlist ${index + 1}`;
        const createdAt = Number(playlist?.createdAt || Date.now());

        return {
          id: String(playlist?.id || `playlist-${index + 1}`),
          name,
          items,
          createdAt,
          updatedAt: Number(playlist?.updatedAt || createdAt),
        };
      })
      .filter(Boolean);

  const safePlaylists = playlists.length
      ? playlists
      : [
        {
          id: "playlist-default",
          name: "My Playlist",
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
  const requestedActiveId = String(value?.activePlaylistId || "");
  const activePlaylistId = safePlaylists.some(
      (playlist) => playlist.id === requestedActiveId
  )
      ? requestedActiveId
      : safePlaylists[0].id;

  return {
    version: PLAYER_PLAYLIST_LIBRARY_VERSION,
    activePlaylistId,
    playlists: safePlaylists,
  };
}

function readPlayerPlaylistLibrary() {
  let library = null;

  try {
    const parsed = JSON.parse(
        localStorage.getItem(PLAYER_PLAYLIST_LIBRARY_STORAGE_KEY) || "null"
    );

    if (
        parsed &&
        parsed.version === PLAYER_PLAYLIST_LIBRARY_VERSION &&
        Array.isArray(parsed.playlists)
    ) {
      library = normalizePlayerPlaylistLibrary(parsed);
    }
  } catch {
    // Fall back to the synchronized legacy playlist below.
  }

  if (!library) {
    library = normalizePlayerPlaylistLibrary(null);
  }

  const legacyItems = readLegacyPlayerPlaylist();
  if (!legacyItems.length) {
    return library;
  }

  return {
    ...library,
    playlists: library.playlists.map((playlist) =>
        playlist.id === library.activePlaylistId
            ? {
              ...playlist,
              items: appendUniquePlaylistItems(playlist.items, legacyItems),
              updatedAt: Date.now(),
            }
            : playlist
    ),
  };
}

function readPlayerPlaylist() {
  const library = readPlayerPlaylistLibrary();
  return (
      library.playlists.find(
          (playlist) => playlist.id === library.activePlaylistId
      )?.items || []
  );
}

function writePlayerPlaylist(items) {
  try {
    const library = readPlayerPlaylistLibrary();
    const normalizedItems = Array.isArray(items)
        ? items.map(normalizePlayerPlaylistItem).filter(Boolean)
        : [];
    const nextLibrary = {
      ...library,
      playlists: library.playlists.map((playlist) =>
          playlist.id === library.activePlaylistId
              ? {
                ...playlist,
                items: normalizedItems,
                updatedAt: Date.now(),
              }
              : playlist
      ),
    };

    localStorage.setItem(
        PLAYER_PLAYLIST_LIBRARY_STORAGE_KEY,
        JSON.stringify(nextLibrary)
    );
    localStorage.setItem(
        PLAYER_PLAYLIST_STORAGE_KEY,
        JSON.stringify(normalizedItems)
    );

    window.dispatchEvent(
        new CustomEvent("audiomasterlab:video-playlist-updated", {
          detail: {
            activePlaylistId: nextLibrary.activePlaylistId,
            items: normalizedItems,
            library: nextLibrary,
          },
        })
    );
  } catch {
    // The /player route still receives the selected source through the URL query string.
  }
}

function writePlayerHandoff(item, autoplay = true) {
  try {
    const normalized = normalizePlayerPlaylistItem(item);
    if (!normalized) return;

    sessionStorage.setItem(
        PLAYER_HANDOFF_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          item: normalized,
          autoplay: Boolean(autoplay),
          createdAt: Date.now(),
        })
    );
  } catch {
    // Query-string handoff remains available when sessionStorage is blocked.
  }
}

function buildPlayerRoute(item, autoplay = true) {
  if (!item?.url) {
    return PLAYER_ROUTE;
  }

  const search = new URLSearchParams({
    source: item.url,
    title: item.label || item.fileName || "Archive video",
    playlistItem: item.id || makePlaylistItemId(item.url),
    autoplay: autoplay ? "1" : "0",
  });

  return `${PLAYER_ROUTE}?${search.toString()}`;
}

function createArchivePlaylistItem(item, file) {
  const url = buildArchiveFileUrl(item.identifier, file.name, "download");
  return {
    id: makePlaylistItemId(url),
    url,
    label: item.title || file.name,
    fileName: file.name,
    posterUrl: item.posterUrl || "",
    sourceType: "Archive.org",
    detailsUrl: item.detailsUrl || getArchiveDetailsUrl(item.identifier),
    archiveIdentifier: item.identifier,
    archiveCollectionIds: item.collectionIds || [],
    archiveCollectionNames: item.collectionNames || [],
    size: Number(file.size || 0),
  };
}

function appendUniquePlaylistItems(currentItems, newItems) {
  const byUrl = new Map();
  [...currentItems, ...newItems].forEach((item) => {
    if (item?.url) byUrl.set(item.url, item);
  });
  return Array.from(byUrl.values());
}

function appendUniquePlayableItems(currentItems, newItems) {
  const byIdentifier = new Map();

  [...currentItems, ...newItems].forEach((item) => {
    if (item?.identifier) {
      byIdentifier.set(item.identifier, item);
    }
  });

  return Array.from(byIdentifier.values());
}

function isPlayableVideoFile(file) {
  const name = String(file?.name || "");
  const lowerName = name.toLowerCase();
  const extension = getFileNameExtension(name);
  const format = String(file?.format || "").toLowerCase();
  const size = Number(file?.size || 0);

  if (!name || BLOCKED_VIDEO_FILE_TERMS.some((term) => lowerName.includes(term))) {
    return false;
  }

  if (size > 0 && size < MIN_PLAYABLE_BYTES) {
    return false;
  }

  return (
      PLAYABLE_VIDEO_EXTENSIONS.includes(extension) ||
      PLAYABLE_VIDEO_FORMATS.some((term) => format.includes(term))
  );
}

function getPlayableVideoScore(file) {
  const name = String(file?.name || "").toLowerCase();
  const format = String(file?.format || "").toLowerCase();
  const size = Number(file?.size || 0);
  let score = size ? Math.min(40, Math.log10(size) * 8) : 0;

  if (name.endsWith(".mp4")) score += 80;
  if (format.includes("h.264")) score += 70;
  if (format.includes("512kb")) score += 45;
  if (name.endsWith(".webm")) score += 40;
  if (name.includes("_512kb")) score += 35;
  if (name.includes("_h264") || name.includes("h.264")) score += 35;
  if (name.includes("thumb") || format.includes("cinepack")) score -= 100;

  return score;
}

function getItemServerHosts(metadata) {
  return [metadata?.server, metadata?.d1, metadata?.d2]
      .map((host) => String(host || "").toLowerCase())
      .filter((host, index, all) => host && all.indexOf(host) === index && isAllowedIaHost(host));
}

function getVideoSourceTargets(identifier, file, metadata) {
  const fileName = file?.name || "";
  const urls = [
    buildArchiveFileUrl(identifier, fileName, "download"),
    buildArchiveFileUrl(identifier, fileName, "serve"),
    ...getItemServerHosts(metadata).map((host) =>
        buildIaFileUrl(host, identifier, fileName, metadata?.dir)
    ),
  ].filter(Boolean);

  return urls.filter((url, index, all) => all.indexOf(url) === index);
}

function getDirectVideoSourceCandidates(identifier, file, metadata) {
  return getVideoSourceTargets(identifier, file, metadata);
}

function getOpenableVideoSource(identifier, file, metadata) {
  const [targetUrl] = getVideoSourceTargets(identifier, file, metadata);
  return targetUrl || "";
}

function isUsablePosterFile(file) {
  const name = String(file?.name || "").toLowerCase();
  const size = Number(file?.size || 0);

  if (!name || !/\.(jpg|jpeg|png|webp)$/i.test(name)) {
    return false;
  }

  if (BLOCKED_POSTER_FILE_TERMS.some((term) => name.includes(term))) {
    return false;
  }

  return size <= 0 || size >= MIN_POSTER_BYTES;
}

function getBestPosterFile(files = []) {
  return files
      .filter(isUsablePosterFile)
      .sort((left, right) => Number(right?.size || 0) - Number(left?.size || 0))[0] || null;
}

function getArchiveImageUrl(identifier, file) {
  if (!file?.name) return "";
  return buildArchiveFileUrl(identifier, file.name, "download");
}

function mapSearchDoc(doc) {
  const identifier = String(doc?.identifier || "");
  return {
    identifier,
    title: getString(doc?.title) || identifier,
    creator: getString(doc?.creator),
    date: getString(doc?.date),
    downloads: Number(doc?.downloads || 0),
    description: getString(doc?.description),
    subjects: Array.isArray(doc?.subject)
        ? doc.subject
        : getString(doc?.subject).split(",").filter(Boolean),
    collectionIds: normalizeCollectionValues(doc?.collection),
    detailsUrl: getArchiveDetailsUrl(identifier),
  };
}

function mapMetadataToPlayableItem(searchItem, metadata, collectionLabelMap) {
  const files = Array.isArray(metadata?.files) ? metadata.files : [];
  const playableFiles = files
      .filter(isPlayableVideoFile)
      .sort((a, b) => getPlayableVideoScore(b) - getPlayableVideoScore(a));
  const posterFile = getBestPosterFile(files);
  const title = getString(metadata?.metadata?.title) || searchItem.title;

  if (!playableFiles.length) return null;

  const collectionIds = mergeUniqueStrings(
      searchItem.collectionIds,
      normalizeCollectionValues(metadata?.metadata?.collection)
  );

  return {
    ...searchItem,
    title,
    creator: getString(metadata?.metadata?.creator) || searchItem.creator,
    date: getString(metadata?.metadata?.date) || searchItem.date,
    description: getString(metadata?.metadata?.description) || searchItem.description,
    collectionIds,
    collectionNames: resolveCollectionLabels(collectionIds, collectionLabelMap),
    playableFiles,
    posterUrl: getArchiveImageUrl(searchItem.identifier, posterFile),
    metadata,
  };
}

function CollectionPicker({ collections, selected, onChange, onRemoveCustom }) {
  const toggleCollection = (collectionId) => {
    const next = selected.includes(collectionId)
        ? selected.filter((id) => id !== collectionId)
        : [...selected, collectionId];
    onChange(next.length ? next : DEFAULT_COLLECTIONS);
  };

  return (
      <Grid container spacing={1.25}>
        {collections.map((collection) => (
            <Grid item xs={12} sm={6} md={4} key={collection.id}>
              <Paper sx={{ ...softCardSx, p: 1.25, height: "100%" }}>
                <Stack direction="row" spacing={0.5} alignItems="flex-start">
                  <FormControlLabel
                      sx={{ alignItems: "flex-start", m: 0, gap: 1, flex: 1 }}
                      control={
                        <Checkbox
                            checked={selected.includes(collection.id)}
                            onChange={() => toggleCollection(collection.id)}
                            sx={{ color: "rgba(255,255,255,0.55)", pt: 0.25 }}
                        />
                      }
                      label={
                        <Box>
                          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                              {collection.label}
                            </Typography>
                            {collection.custom ? (
                                <Chip
                                    label="Custom"
                                    size="small"
                                    sx={{
                                      height: 20,
                                      bgcolor: "rgba(179,140,255,0.14)",
                                      color: "#eadfff",
                                      fontWeight: 800,
                                    }}
                                />
                            ) : null}
                          </Stack>
                          <Typography sx={{ color: "rgba(244,248,255,0.64)", fontSize: 12.5 }}>
                            {collection.description}
                          </Typography>
                          <Typography
                              component="code"
                              sx={{ color: "rgba(158,232,255,0.78)", fontSize: 11.5 }}
                          >
                            {collection.id}
                          </Typography>
                        </Box>
                      }
                  />
                  {collection.custom ? (
                      <Tooltip title="Remove custom collection">
                        <IconButton
                            size="small"
                            onClick={() => onRemoveCustom(collection.id)}
                            sx={{ color: "rgba(255,255,255,0.62)" }}
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                  ) : null}
                </Stack>
              </Paper>
            </Grid>
        ))}
      </Grid>
  );
}

function VideoPlayerFrame({ item, file }) {
  const candidates = useMemo(
      () => getDirectVideoSourceCandidates(item.identifier, file, item.metadata),
      [file, item.identifier, item.metadata]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [error, setError] = useState("");
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setError("");
    setPosterFailed(false);
  }, [file?.name, item.identifier]);

  const activeSource = candidates[candidateIndex] || "";
  const canTryNext = candidateIndex < candidates.length - 1;

  const handleVideoError = () => {
    if (!posterFailed && item.posterUrl) {
      setPosterFailed(true);
    }

    if (canTryNext) {
      setCandidateIndex((index) => index + 1);
      setError("");
      return;
    }

    setError("This Archive file did not stream from its direct download, serve, or IA host range fallbacks.");
  };

  return (
      <Box>
        <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 2,
              background: "#02040b",
              border: "1px solid rgba(255,255,255,0.1)",
              aspectRatio: "16 / 9",
            }}
        >
          {activeSource ? (
              <Box
                  component="video"
                  key={activeSource}
                  controls
                  preload="metadata"
                  poster={!posterFailed && item.posterUrl ? item.posterUrl : undefined}
                  controlsList="nodownload"
                  onError={handleVideoError}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#02040b",
                  }}
              >
                <source src={activeSource} />
              </Box>
          ) : (
              <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
                <VideoFileRounded sx={{ color: "rgba(255,255,255,0.45)", fontSize: 52 }} />
              </Stack>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
          <Chip
              size="small"
              label={`${candidateIndex + 1}/${Math.max(candidates.length, 1)} direct range stream`}
              sx={{ bgcolor: "rgba(158,232,255,0.11)", color: "#dff8ff", fontWeight: 800 }}
          />
          <Chip
              size="small"
              label={file.format || getFileNameExtension(file.name).replace(".", "").toUpperCase()}
              sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "rgba(244,248,255,0.75)" }}
          />
          {file.size ? (
              <Chip
                  size="small"
                  label={formatBytes(file.size)}
                  sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "rgba(244,248,255,0.75)" }}
              />
          ) : null}
        </Stack>

        {error ? (
            <Alert severity="warning" sx={{ mt: 1.25, borderRadius: 2 }}>
              {error}
            </Alert>
        ) : null}
      </Box>
  );
}

function VideoResultCard({ item }) {
  const navigate = useNavigate();
  const [playlistAdded, setPlaylistAdded] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(item.playableFiles[0]?.name || "");
  const selectedFile =
      item.playableFiles.find((file) => file.name === selectedFileName) || item.playableFiles[0];

  useEffect(() => {
    setSelectedFileName(item.playableFiles[0]?.name || "");
    setPlaylistAdded(false);
  }, [item.identifier, item.playableFiles]);

  useEffect(() => {
    setPlaylistAdded(false);
  }, [selectedFileName]);

  const directSource = useMemo(() => {
    if (!selectedFile) return "";
    return getOpenableVideoSource(item.identifier, selectedFile, item.metadata);
  }, [item.identifier, item.metadata, selectedFile]);

  const copySource = async () => {
    if (!directSource || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(directSource);
  };

  const addToPlayerPlaylist = (openPlayer) => {
    if (!selectedFile) return;
    const playlistItem = createArchivePlaylistItem(item, selectedFile);
    const nextPlaylist = appendUniquePlaylistItems(readPlayerPlaylist(), [playlistItem]);
    writePlayerPlaylist(nextPlaylist);
    setPlaylistAdded(true);

    if (openPlayer) {
      writePlayerHandoff(playlistItem, true);
      navigate(buildPlayerRoute(playlistItem, true));
    }
  };

  return (
      <Card sx={cardSx}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <VideoPlayerFrame item={item} file={selectedFile} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                      icon={<TheatersRounded />}
                      label="Playable video"
                      sx={{
                        bgcolor: "rgba(158,232,255,0.12)",
                        color: "#dff8ff",
                        fontWeight: 900,
                        "& .MuiChip-icon": { color: "#9ee8ff" },
                      }}
                  />
                  {item.date ? (
                      <Chip label={item.date} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#f4f8ff" }} />
                  ) : null}
                  <Chip
                      label={`${formatCount(item.downloads)} downloads`}
                      sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#f4f8ff" }}
                  />
                </Stack>

                {item.collectionIds?.length ? (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {item.collectionIds.map((collectionId, index) => (
                          <Tooltip title={`Archive collection ID: ${collectionId}`} key={collectionId}>
                            <Chip
                                size="small"
                                icon={<FolderRounded />}
                                label={item.collectionNames?.[index] || humanizeCollectionId(collectionId)}
                                sx={{
                                  bgcolor: "rgba(179,140,255,0.12)",
                                  color: "#eadfff",
                                  fontWeight: 850,
                                  "& .MuiChip-icon": { color: "#c7a8ff" },
                                }}
                            />
                          </Tooltip>
                      ))}
                    </Stack>
                ) : null}

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.12 }}>
                    {item.title}
                  </Typography>
                  {item.creator ? (
                      <Typography sx={{ mt: 0.5, color: "rgba(244,248,255,0.7)", fontWeight: 700 }}>
                        {item.creator}
                      </Typography>
                  ) : null}
                </Box>

                {item.description ? (
                    <Typography
                        sx={{
                          color: "rgba(244,248,255,0.72)",
                          fontSize: 14,
                          display: "-webkit-box",
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                    >
                      {item.description.replace(/<[^>]*>/g, " ")}
                    </Typography>
                ) : null}

                <TextField
                    select
                    fullWidth
                    size="small"
                    label="Playable source"
                    value={selectedFile?.name || ""}
                    onChange={(event) => setSelectedFileName(event.target.value)}
                    SelectProps={{ native: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: "#f4f8ff",
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.04)",
                      },
                      "& .MuiInputLabel-root": { color: "rgba(244,248,255,0.68)" },
                    }}
                >
                  {item.playableFiles.map((file) => (
                      <option key={file.name} value={file.name}>
                        {file.name} {file.size ? `- ${formatBytes(file.size)}` : ""}
                      </option>
                  ))}
                </TextField>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                      type="button"
                      onClick={() => addToPlayerPlaylist(true)}
                      startIcon={<QueuePlayNextRounded />}
                      sx={primaryButtonSx}
                  >
                    Play in /player
                  </Button>
                  <Button
                      type="button"
                      onClick={() => addToPlayerPlaylist(false)}
                      startIcon={<PlaylistAddRounded />}
                      variant="outlined"
                      sx={{ borderRadius: 999, color: "#dff8ff", borderColor: "rgba(158,232,255,0.45)" }}
                  >
                    {playlistAdded ? "Added to /player playlist" : "Add to /player playlist"}
                  </Button>
                  <Button
                      component="a"
                      href={item.detailsUrl}
                      target="_blank"
                      rel="noreferrer"
                      startIcon={<OpenInNewRounded />}
                      variant="outlined"
                      sx={{ borderRadius: 999, color: "#dff8ff", borderColor: "rgba(158,232,255,0.45)" }}
                  >
                    Open Archive.org
                  </Button>
                  <Button
                      component="a"
                      href={directSource}
                      target="_blank"
                      rel="noreferrer"
                      startIcon={<PlayArrowRounded />}
                      variant="outlined"
                      sx={{ borderRadius: 999, color: "#dff8ff", borderColor: "rgba(158,232,255,0.45)" }}
                  >
                    Open direct stream
                  </Button>
                  <Tooltip title="Copy direct stream URL">
                  <span>
                    <IconButton
                        onClick={copySource}
                        disabled={!directSource}
                        sx={{
                          color: "#f4f8ff",
                          border: "1px solid rgba(255,255,255,0.14)",
                          bgcolor: "rgba(255,255,255,0.05)",
                        }}
                    >
                      <ContentCopyRounded />
                    </IconButton>
                  </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
  );
}

export default function Archive() {
  const navigate = useNavigate();

  useEffect(() => {
    console.info(
        `[Archive] ${ARCHIVE_PAGE_BUILD}: paginated Archive JSON, custom collections, and native media playback.`
    );
  }, []);

  const [query, setQuery] = useState("");
  const [customCollections, setCustomCollections] = useState(() => readCustomCollections());
  const [selectedCollections, setSelectedCollections] = useState(DEFAULT_COLLECTIONS);
  const [customCollectionId, setCustomCollectionId] = useState("");
  const [customCollectionLabel, setCustomCollectionLabel] = useState("");
  const [customCollectionError, setCustomCollectionError] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loadingMode, setLoadingMode] = useState("");
  const [searched, setSearched] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [progress, setProgress] = useState({ checked: 0, total: 0, page: 0 });
  const [playlistNotice, setPlaylistNotice] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);
  const abortRef = useRef(null);
  const searchSnapshotRef = useRef({ query: "", collectionIds: DEFAULT_COLLECTIONS });

  const allCollections = useMemo(() => {
    const builtInIds = new Set(VIDEO_COLLECTIONS.map((collection) => collection.id));
    return [
      ...VIDEO_COLLECTIONS,
      ...customCollections.filter((collection) => !builtInIds.has(collection.id)),
    ];
  }, [customCollections]);

  const collectionLabelMap = useMemo(
      () => createCollectionLabelMap(allCollections),
      [allCollections]
  );

  const selectedCollectionLabels = useMemo(
      () =>
          selectedCollections
              .map(
                  (collectionId) =>
                      collectionLabelMap.get(collectionId) || humanizeCollectionId(collectionId)
              )
              .join(", "),
      [collectionLabelMap, selectedCollections]
  );

  const totalPages = totalFound
      ? Math.ceil(totalFound / ARCHIVE_SEARCH_BATCH_SIZE)
      : 0;
  const loading = Boolean(loadingMode);
  const loadingMore = loadingMode === "more";

  const addCustomCollection = () => {
    const id = normalizeCollectionId(customCollectionId);
    const label = String(customCollectionLabel || "").trim() || humanizeCollectionId(id);

    if (!id) {
      setCustomCollectionError(
          "Enter an Archive.org collection identifier or paste its /details/ collection URL."
      );
      return;
    }

    const builtIn = VIDEO_COLLECTIONS.find((collection) => collection.id === id);
    if (builtIn) {
      setSelectedCollections((current) =>
          current.includes(id) ? current : [...current, id]
      );
      setCustomCollectionError("");
      setCustomCollectionId("");
      setCustomCollectionLabel("");
      return;
    }

    setCustomCollections((current) => {
      const nextCollection = {
        id,
        label,
        description: `Custom Archive collection: ${id}`,
        custom: true,
      };
      const next = [
        ...current.filter((collection) => collection.id !== id),
        nextCollection,
      ];
      writeCustomCollections(next);
      return next;
    });

    setSelectedCollections((current) =>
        current.includes(id) ? current : [...current, id]
    );
    setCustomCollectionError("");
    setCustomCollectionId("");
    setCustomCollectionLabel("");
  };

  const removeCustomCollection = (collectionId) => {
    setCustomCollections((current) => {
      const next = current.filter((collection) => collection.id !== collectionId);
      writeCustomCollections(next);
      return next;
    });

    setSelectedCollections((current) => {
      const next = current.filter((id) => id !== collectionId);
      return next.length ? next : DEFAULT_COLLECTIONS;
    });
  };

  const fetchPlayablePage = useCallback(
      async ({ pageNumber, append, searchTerm, collectionIds }) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoadingMode(append ? "more" : "search");
        setSearched(true);
        setError("");
        setPlaylistNotice("");
        setProgress({ checked: 0, total: 0, page: pageNumber });

        if (!append) {
          setResults([]);
          setCurrentPage(0);
          setTotalFound(0);
          setHasMorePages(false);
        }

        try {
          const searchUrl = buildArchiveAdvancedSearchUrl(
              searchTerm,
              collectionIds,
              pageNumber
          );
          const searchData = await fetchArchiveJson(searchUrl, controller.signal);
          const response = searchData?.response || {};
          const docs = (response.docs || [])
              .map(mapSearchDoc)
              .filter((doc) => doc.identifier);
          const archiveTotal = Number(response.numFound || 0);
          const labelMapForRequest = new Map(collectionLabelMap);

          setTotalFound(archiveTotal);
          setProgress({ checked: 0, total: docs.length, page: pageNumber });

          const playableItems = [];

          for (let index = 0; index < docs.length; index += 1) {
            const item = docs[index];
            const metadataUrl = `https://archive.org/metadata/${encodeURIComponent(
                item.identifier
            )}`;

            try {
              const metadata = await fetchArchiveJson(metadataUrl, controller.signal);
              const playableItem = mapMetadataToPlayableItem(
                  item,
                  metadata,
                  labelMapForRequest
              );

              if (playableItem) {
                playableItems.push(playableItem);
                setResults((current) =>
                    appendUniquePlayableItems(current, [playableItem])
                );
              }
            } catch (metadataError) {
              if (metadataError?.name === "AbortError") throw metadataError;
            } finally {
              setProgress({
                checked: index + 1,
                total: docs.length,
                page: pageNumber,
              });
            }
          }

          const morePagesAvailable =
              docs.length > 0 &&
              pageNumber * ARCHIVE_SEARCH_BATCH_SIZE < archiveTotal;

          setCurrentPage(pageNumber);
          setHasMorePages(morePagesAvailable);

          if (!playableItems.length) {
            if (append) {
              setError(
                  `Archive page ${pageNumber} had no browser-playable derivatives. You can continue to the next page${
                      morePagesAvailable ? "" : ", but this was the final page"
                  }.`
              );
            } else {
              setError(
                  "No browser-playable Archive videos were found on the first result page. Try a broader term, select more collections, or load another page when available."
              );
            }
          }
        } catch (searchError) {
          if (searchError?.name !== "AbortError") {
            setError(searchError?.message || "Archive video search failed.");
          }
        } finally {
          setLoadingMode("");
        }
      },
      [collectionLabelMap]
  );

  const runSearch = useCallback(() => {
    const collectionIds = selectedCollections.length
        ? [...selectedCollections]
        : [...DEFAULT_COLLECTIONS];
    const snapshot = {
      query,
      collectionIds,
    };

    searchSnapshotRef.current = snapshot;
    return fetchPlayablePage({
      pageNumber: 1,
      append: false,
      searchTerm: snapshot.query,
      collectionIds: snapshot.collectionIds,
    });
  }, [fetchPlayablePage, query, selectedCollections]);

  const loadMore = useCallback(() => {
    if (loading || !hasMorePages) return;

    const snapshot = searchSnapshotRef.current;
    return fetchPlayablePage({
      pageNumber: currentPage + 1,
      append: true,
      searchTerm: snapshot.query,
      collectionIds: snapshot.collectionIds,
    });
  }, [currentPage, fetchPlayablePage, hasMorePages, loading]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const resetSearch = () => {
    abortRef.current?.abort();
    setQuery("");
    setSelectedCollections(DEFAULT_COLLECTIONS);
    setResults([]);
    setError("");
    setSearched(false);
    setProgress({ checked: 0, total: 0, page: 0 });
    setCurrentPage(0);
    setTotalFound(0);
    setHasMorePages(false);
    setLoadingMode("");
    setPlaylistNotice("");
    searchSnapshotRef.current = { query: "", collectionIds: DEFAULT_COLLECTIONS };
  };

  const loadingProgress =
      progress.total > 0
          ? Math.round((progress.checked / progress.total) * 100)
          : 0;

  const addAllResultsToPlayer = (openPlayer) => {
    const playlistItems = results
        .map((item) => {
          const file = item.playableFiles?.[0];
          return file ? createArchivePlaylistItem(item, file) : null;
        })
        .filter(Boolean);

    if (!playlistItems.length) return;

    const nextPlaylist = appendUniquePlaylistItems(
        readPlayerPlaylist(),
        playlistItems
    );
    writePlayerPlaylist(nextPlaylist);
    setPlaylistNotice(
        `${playlistItems.length} Archive videos added to the /player playlist.`
    );

    if (openPlayer) {
      writePlayerHandoff(playlistItems[0], true);
      navigate(buildPlayerRoute(playlistItems[0], true));
    }
  };

  return (
      <GradientPage sx={pageSx}>
        <AppNavBar />
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
          <Stack spacing={2.5}>
            <Paper
                sx={{
                  ...cardSx,
                  p: { xs: 1, sm: 1.25 },
                  position: "sticky",
                  top: 12,
                  zIndex: 5,
                }}
            >
              <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                      component={RouterLink}
                      to="/"
                      startIcon={<HomeRounded />}
                      sx={{ color: "#f4f8ff", borderRadius: 999, fontWeight: 900 }}
                  >
                    Home
                  </Button>
                  <Chip
                      icon={<MovieCreationRounded />}
                      label="Archive video"
                      sx={{
                        bgcolor: "rgba(158,232,255,0.12)",
                        color: "#dff8ff",
                        fontWeight: 950,
                        "& .MuiChip-icon": { color: "#9ee8ff" },
                      }}
                  />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                      component={RouterLink}
                      to={PLAYER_ROUTE}
                      startIcon={<QueuePlayNextRounded />}
                      sx={{ color: "#dff8ff", borderRadius: 999, fontWeight: 900 }}
                  >
                    Open /player Playlist
                  </Button>
                  <Button
                      onClick={resetSearch}
                      startIcon={<RestartAltRounded />}
                      sx={{ color: "#f4f8ff", borderRadius: 999 }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Card sx={cardSx}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Grid container spacing={2.5} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1.25}>
                      <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 950,
                            letterSpacing: 0,
                            fontSize: { xs: 34, md: 48 },
                            lineHeight: 1,
                          }}
                      >
                        Search playable Archive videos
                      </Typography>
                      <Typography
                          sx={{ color: "rgba(244,248,255,0.72)", maxWidth: 720 }}
                      >
                        Search multiple Archive.org result pages, add your own
                        collection identifiers, inspect item metadata, and send
                        browser-playable MP4, WebM, Ogg, and H.264 files to /player.
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                            label="Paginated Archive search"
                            sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#f4f8ff" }}
                        />
                        <Chip
                            label="Custom collections"
                            sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#f4f8ff" }}
                        />
                        <Chip
                            label="Collection names on results"
                            sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#f4f8ff" }}
                        />
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                        sx={{
                          ...softCardSx,
                          p: 2,
                          background: alpha("#ffffff", 0.055),
                        }}
                    >
                      <Stack spacing={1.5}>
                        <TextField
                            fullWidth
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !loading) runSearch();
                            }}
                            placeholder="Search videos, creators, subjects, identifiers..."
                            InputProps={{
                              startAdornment: (
                                  <SearchRounded
                                      sx={{ mr: 1, color: "rgba(244,248,255,0.55)" }}
                                  />
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                color: "#f4f8ff",
                                borderRadius: 2,
                                background: "rgba(0,0,0,0.2)",
                              },
                            }}
                        />
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Button
                              onClick={runSearch}
                              disabled={loading}
                              startIcon={
                                loadingMode === "search" ? (
                                    <CircularProgress size={18} />
                                ) : (
                                    <SearchRounded />
                                )
                              }
                              sx={primaryButtonSx}
                          >
                            {loadingMode === "search"
                                ? "Finding playable videos"
                                : "Search videos"}
                          </Button>
                          <Button
                              onClick={() => setShowCollections((value) => !value)}
                              variant="outlined"
                              startIcon={<FolderRounded />}
                              sx={{
                                borderRadius: 999,
                                color: "#dff8ff",
                                borderColor: "rgba(158,232,255,0.45)",
                              }}
                          >
                            Collections ({selectedCollections.length})
                          </Button>
                        </Stack>
                        <Typography
                            sx={{ color: "rgba(244,248,255,0.6)", fontSize: 13 }}
                        >
                          Searching: {selectedCollectionLabels || "default video collections"}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Collapse in={showCollections}>
              <Card sx={cardSx}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Video collections
                      </Typography>
                      <Typography sx={{ color: "rgba(244,248,255,0.65)", fontSize: 13 }}>
                        Use an Archive collection identifier such as
                        <Box component="span" sx={{ color: "#9ee8ff", mx: 0.5 }}>
                          prelinger
                        </Box>
                        or paste an Archive.org /details/ collection URL.
                      </Typography>
                    </Box>

                    <Paper sx={{ ...softCardSx, p: { xs: 1.5, md: 2 } }}>
                      <Stack spacing={1.25}>
                        <Typography sx={{ fontWeight: 900 }}>
                          Add a custom collection
                        </Typography>
                        <Grid container spacing={1.25}>
                          <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Collection identifier or Archive URL"
                                value={customCollectionId}
                                onChange={(event) => {
                                  setCustomCollectionId(event.target.value);
                                  setCustomCollectionError("");
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") addCustomCollection();
                                }}
                                placeholder="example: prelinger or archive.org/details/prelinger"
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    color: "#f4f8ff",
                                    background: "rgba(0,0,0,0.18)",
                                  },
                                  "& .MuiInputLabel-root": {
                                    color: "rgba(244,248,255,0.66)",
                                  },
                                }}
                            />
                          </Grid>
                          <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Display name (optional)"
                                value={customCollectionLabel}
                                onChange={(event) =>
                                    setCustomCollectionLabel(event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") addCustomCollection();
                                }}
                                placeholder="My favorite films"
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    color: "#f4f8ff",
                                    background: "rgba(0,0,0,0.18)",
                                  },
                                  "& .MuiInputLabel-root": {
                                    color: "rgba(244,248,255,0.66)",
                                  },
                                }}
                            />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Button
                                fullWidth
                                onClick={addCustomCollection}
                                startIcon={<AddRounded />}
                                sx={{ ...primaryButtonSx, minHeight: 40 }}
                            >
                              Add
                            </Button>
                          </Grid>
                        </Grid>
                        {customCollectionError ? (
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                              {customCollectionError}
                            </Alert>
                        ) : null}
                      </Stack>
                    </Paper>

                    <CollectionPicker
                        collections={allCollections}
                        selected={selectedCollections}
                        onChange={setSelectedCollections}
                        onRemoveCustom={removeCustomCollection}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Collapse>

            {loading ? (
                <Paper sx={{ ...cardSx, p: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={18} />
                      <Typography sx={{ fontWeight: 850 }}>
                        {loadingMore
                            ? `Loading Archive result page ${currentPage + 1}`
                            : "Checking Archive metadata for playable files"}
                      </Typography>
                    </Stack>
                    <LinearProgress
                        variant={progress.total ? "determinate" : "indeterminate"}
                        value={loadingProgress}
                    />
                    {progress.total ? (
                        <Typography
                            sx={{ color: "rgba(244,248,255,0.66)", fontSize: 13 }}
                        >
                          Page {progress.page}: checked {progress.checked} of {progress.total}
                          candidate items.
                        </Typography>
                    ) : null}
                  </Stack>
                </Paper>
            ) : null}

            {error ? (
                <Alert
                    severity={results.length ? "info" : "warning"}
                    onClose={() => setError("")}
                    sx={{ borderRadius: 2 }}
                >
                  {error}
                </Alert>
            ) : null}

            {playlistNotice ? (
                <Alert
                    severity="success"
                    onClose={() => setPlaylistNotice("")}
                    sx={{ borderRadius: 2 }}
                >
                  {playlistNotice}
                </Alert>
            ) : null}

            {searched ? (
                <Paper sx={{ ...cardSx, p: 1.5 }}>
                  <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", sm: "center" }}
                      justifyContent="space-between"
                  >
                    <Stack spacing={0.25}>
                      <Typography sx={{ fontWeight: 900 }}>
                        {results.length} playable Archive videos ready
                      </Typography>
                      <Typography
                          sx={{ color: "rgba(244,248,255,0.62)", fontSize: 13 }}
                      >
                        {totalFound
                            ? `${formatCount(totalFound)} matching Archive items across ${totalPages} result pages. Scanned through page ${currentPage || 1}.`
                            : `Scanned through page ${currentPage || 1}.`}
                      </Typography>
                    </Stack>
                    {results.length ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Button
                              type="button"
                              onClick={() => addAllResultsToPlayer(false)}
                              startIcon={<PlaylistAddRounded />}
                              variant="outlined"
                              sx={{
                                borderRadius: 999,
                                color: "#dff8ff",
                                borderColor: "rgba(158,232,255,0.45)",
                              }}
                          >
                            Add all loaded videos
                          </Button>
                          <Button
                              type="button"
                              onClick={() => addAllResultsToPlayer(true)}
                              startIcon={<QueuePlayNextRounded />}
                              sx={primaryButtonSx}
                          >
                            Play all loaded videos
                          </Button>
                        </Stack>
                    ) : null}
                  </Stack>
                </Paper>
            ) : null}

            <Stack spacing={2}>
              {results.map((item) => (
                  <VideoResultCard key={item.identifier} item={item} />
              ))}
            </Stack>

            {searched && (hasMorePages || loadingMore) ? (
                <Paper sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, textAlign: "center" }}>
                  <Stack spacing={1.25} alignItems="center">
                    <Typography sx={{ fontWeight: 950 }}>
                      Load the next Archive result page
                    </Typography>
                    <Typography
                        sx={{ color: "rgba(244,248,255,0.65)", fontSize: 13 }}
                    >
                      Next page: {currentPage + 1}
                      {totalPages ? ` of ${totalPages}` : ""}. New playable videos will
                      be appended without replacing the videos already loaded.
                    </Typography>
                    <Button
                        onClick={loadMore}
                        disabled={loading || !hasMorePages}
                        startIcon={
                          loadingMore ? <CircularProgress size={18} /> : <AddRounded />
                        }
                        sx={primaryButtonSx}
                    >
                      {loadingMore ? "Loading more videos" : "Load more videos"}
                    </Button>
                  </Stack>
                </Paper>
            ) : null}

            {!loading && searched && !hasMorePages && currentPage > 0 ? (
                <Paper sx={{ ...softCardSx, p: 2, textAlign: "center" }}>
                  <Typography sx={{ color: "rgba(244,248,255,0.68)" }}>
                    You reached the final Archive result page for this search.
                  </Typography>
                </Paper>
            ) : null}

            {!loading && searched && !results.length && !error ? (
                <Paper sx={{ ...cardSx, p: 4, textAlign: "center" }}>
                  <VideoFileRounded
                      sx={{ fontSize: 54, color: "rgba(255,255,255,0.4)" }}
                  />
                  <Typography sx={{ mt: 1, fontWeight: 950 }}>
                    No playable videos found yet.
                  </Typography>
                </Paper>
            ) : null}

            {!searched ? (
                <Paper sx={{ ...cardSx, p: 3 }}>
                  <Stack spacing={1}>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                      How the Archive search works
                    </Typography>
                    <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                    <Typography sx={{ color: "rgba(244,248,255,0.68)" }}>
                      Each result page is checked against Archive item metadata and only
                      items with browser-playable video derivatives are shown. Use Load
                      more to continue through the same query page by page. Collection
                      names come from Archive metadata and use your custom display names
                      whenever a matching custom collection is configured.
                    </Typography>
                  </Stack>
                </Paper>
            ) : null}
          </Stack>
        </Container>
      </GradientPage>
  );
}