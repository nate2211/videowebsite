import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  ContentCopyRounded,
  HomeRounded,
  MovieCreationRounded,
  OpenInNewRounded,
  PlayArrowRounded,
  RestartAltRounded,
  SearchRounded,
  TheatersRounded,
  VideoFileRounded,
} from "@mui/icons-material";

const ARCHIVE_SEARCH_BATCH_SIZE = 60;
const MAX_METADATA_LOOKUPS = 18;
const MIN_PLAYABLE_BYTES = 128 * 1024;
const ARCHIVE_PROXY_ENDPOINTS = [
  "/api/archiveproxy",
  "https://scrapewebsite.pages.dev/api/archiveproxy",
];

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

function buildArchiveProxyUrlCandidates(targetUrl) {
  return ARCHIVE_PROXY_ENDPOINTS.map((endpoint) => {
    const proxyUrl = new URL(endpoint, window.location.origin);
    proxyUrl.searchParams.set("url", targetUrl);
    return proxyUrl.toString();
  });
}

function buildExternalArchiveProxyUrl(targetUrl) {
  const endpoint =
    ARCHIVE_PROXY_ENDPOINTS.find((value) => /^https?:\/\//i.test(value)) ||
    ARCHIVE_PROXY_ENDPOINTS[0];
  const proxyUrl = new URL(endpoint, window.location.origin);
  proxyUrl.searchParams.set("url", targetUrl);
  return proxyUrl.toString();
}

async function fetchArchiveJson(targetUrl, signal) {
  const errors = [];

  for (const candidate of buildArchiveProxyUrlCandidates(targetUrl)) {
    try {
      const response = await fetch(candidate, {
        method: "GET",
        signal,
        headers: { Accept: "application/json" },
        credentials: "omit",
      });

      if (!response.ok) {
        errors.push(`${response.status} ${response.statusText || "Archive proxy error"}`);
        continue;
      }

      const contentType = response.headers.get("Content-Type") || "";
      const text = await response.text();

      try {
        return JSON.parse(text);
      } catch {
        errors.push(`Proxy returned ${contentType || "non-JSON"} instead of Archive JSON.`);
      }
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      errors.push(error?.message || "Archive proxy JSON request failed.");
    }
  }

  throw new Error(errors.filter(Boolean).join(" | ") || "Archive proxy JSON request failed.");
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

function getProxiedVideoSourceCandidates(identifier, file, metadata) {
  return getVideoSourceTargets(identifier, file, metadata).flatMap((targetUrl) =>
    buildArchiveProxyUrlCandidates(targetUrl)
  );
}

function getOpenableProxiedVideoSource(identifier, file, metadata) {
  const [targetUrl] = getVideoSourceTargets(identifier, file, metadata);
  return targetUrl ? buildExternalArchiveProxyUrl(targetUrl) : "";
}

function getBestPosterFile(files = []) {
  const image = files.find((file) => {
    const name = String(file?.name || "").toLowerCase();
    return name.includes("_itemimage") && /\.(jpg|jpeg|png|webp)$/i.test(name);
  });

  return image || files.find((file) => /\.(jpg|jpeg|png|webp)$/i.test(String(file?.name || "")));
}

function getArchiveImageUrl(identifier, file, metadata) {
  if (!file?.name) return "";
  const targets = getVideoSourceTargets(identifier, file, metadata);
  const preferred = targets.find((url) => url.includes("/download/")) || targets[0];
  return preferred ? buildExternalArchiveProxyUrl(preferred) : "";
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
    subjects: Array.isArray(doc?.subject) ? doc.subject : getString(doc?.subject).split(",").filter(Boolean),
    detailsUrl: getArchiveDetailsUrl(identifier),
  };
}

function mapMetadataToPlayableItem(searchItem, metadata) {
  const files = Array.isArray(metadata?.files) ? metadata.files : [];
  const playableFiles = files.filter(isPlayableVideoFile).sort((a, b) => getPlayableVideoScore(b) - getPlayableVideoScore(a));
  const posterFile = getBestPosterFile(files);
  const title = getString(metadata?.metadata?.title) || searchItem.title;

  if (!playableFiles.length) return null;

  return {
    ...searchItem,
    title,
    creator: getString(metadata?.metadata?.creator) || searchItem.creator,
    date: getString(metadata?.metadata?.date) || searchItem.date,
    description: getString(metadata?.metadata?.description) || searchItem.description,
    playableFiles,
    posterUrl: getArchiveImageUrl(searchItem.identifier, posterFile, metadata),
    metadata,
  };
}

function CollectionPicker({ selected, onChange }) {
  const toggleCollection = (collectionId) => {
    const next = selected.includes(collectionId)
      ? selected.filter((id) => id !== collectionId)
      : [...selected, collectionId];
    onChange(next.length ? next : DEFAULT_COLLECTIONS);
  };

  return (
    <Grid container spacing={1.25}>
      {VIDEO_COLLECTIONS.map((collection) => (
        <Grid item xs={12} sm={6} md={4} key={collection.id}>
          <Paper sx={{ ...softCardSx, p: 1.25 }}>
            <FormControlLabel
              sx={{ alignItems: "flex-start", m: 0, gap: 1 }}
              control={
                <Checkbox
                  checked={selected.includes(collection.id)}
                  onChange={() => toggleCollection(collection.id)}
                  sx={{ color: "rgba(255,255,255,0.55)", pt: 0.25 }}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                    {collection.label}
                  </Typography>
                  <Typography sx={{ color: "rgba(244,248,255,0.64)", fontSize: 12.5 }}>
                    {collection.description}
                  </Typography>
                </Box>
              }
            />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function VideoPlayerFrame({ item, file }) {
  const candidates = useMemo(
    () => getProxiedVideoSourceCandidates(item.identifier, file, item.metadata),
    [file, item.identifier, item.metadata]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    setCandidateIndex(0);
    setError("");
  }, [file?.name, item.identifier]);

  const activeSource = candidates[candidateIndex] || "";
  const canTryNext = candidateIndex < candidates.length - 1;

  const handleVideoError = () => {
    if (canTryNext) {
      setCandidateIndex((index) => index + 1);
      setError("");
      return;
    }

    setError("This Archive file did not stream from download, serve, or IA host fallbacks.");
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
            poster={item.posterUrl || undefined}
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
          label={`${candidateIndex + 1}/${Math.max(candidates.length, 1)} proxy stream`}
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
  const [selectedFileName, setSelectedFileName] = useState(item.playableFiles[0]?.name || "");
  const selectedFile =
    item.playableFiles.find((file) => file.name === selectedFileName) || item.playableFiles[0];

  useEffect(() => {
    setSelectedFileName(item.playableFiles[0]?.name || "");
  }, [item.identifier, item.playableFiles]);

  const proxiedSource = useMemo(() => {
    if (!selectedFile) return "";
    return getOpenableProxiedVideoSource(item.identifier, selectedFile, item.metadata);
  }, [item.identifier, item.metadata, selectedFile]);

  const copySource = async () => {
    if (!proxiedSource || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(proxiedSource);
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
                  href={proxiedSource}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<PlayArrowRounded />}
                  variant="outlined"
                  sx={{ borderRadius: 999, color: "#dff8ff", borderColor: "rgba(158,232,255,0.45)" }}
                >
                  Open proxied stream
                </Button>
                <Tooltip title="Copy proxied stream URL">
                  <span>
                    <IconButton
                      onClick={copySource}
                      disabled={!proxiedSource}
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
  const [query, setQuery] = useState("");
  const [selectedCollections, setSelectedCollections] = useState(DEFAULT_COLLECTIONS);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
  const abortRef = useRef(null);

  const selectedCollectionLabels = useMemo(
    () =>
      VIDEO_COLLECTIONS.filter((collection) => selectedCollections.includes(collection.id))
        .map((collection) => collection.label)
        .join(", "),
    [selectedCollections]
  );

  const runSearch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    setProgress({ checked: 0, total: 0 });

    try {
      const searchUrl = buildArchiveAdvancedSearchUrl(query, selectedCollections, 1);
      const searchData = await fetchArchiveJson(searchUrl, controller.signal);
      const docs = (searchData?.response?.docs || []).map(mapSearchDoc).filter((doc) => doc.identifier);
      const candidates = docs.slice(0, MAX_METADATA_LOOKUPS);

      setProgress({ checked: 0, total: candidates.length });

      const playableItems = [];

      for (let index = 0; index < candidates.length; index += 1) {
        const item = candidates[index];
        const metadataUrl = `https://archive.org/metadata/${encodeURIComponent(item.identifier)}`;

        try {
          const metadata = await fetchArchiveJson(metadataUrl, controller.signal);
          const playableItem = mapMetadataToPlayableItem(item, metadata);
          if (playableItem) {
            playableItems.push(playableItem);
            setResults([...playableItems]);
          }
        } catch (metadataError) {
          if (metadataError?.name === "AbortError") throw metadataError;
        } finally {
          setProgress({ checked: index + 1, total: candidates.length });
        }
      }

      if (!playableItems.length) {
        setError("No browser-playable Archive videos were found for that search. Try a broader term or more collections.");
      }
    } catch (searchError) {
      if (searchError?.name !== "AbortError") {
        setError(searchError?.message || "Archive video search failed.");
      }
    } finally {
      setLoading(false);
    }
  }, [query, selectedCollections]);

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
    setProgress({ checked: 0, total: 0 });
  };

  const loadingProgress =
    progress.total > 0 ? Math.round((progress.checked / progress.total) * 100) : 0;

  return (
    <Box sx={pageSx}>
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
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
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
              <Button onClick={resetSearch} startIcon={<RestartAltRounded />} sx={{ color: "#f4f8ff", borderRadius: 999 }}>
                Reset
              </Button>
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
                    <Typography sx={{ color: "rgba(244,248,255,0.72)", maxWidth: 720 }}>
                      Search Archive.org through the proxy, inspect item metadata, and only show files
                      the browser can actually play: MP4, WebM, Ogg, and H.264 derivatives.
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label="No direct media calls" sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#f4f8ff" }} />
                      <Chip label="No download buttons" sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#f4f8ff" }} />
                      <Chip label="Download, serve, IA fallback" sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#f4f8ff" }} />
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
                          if (event.key === "Enter") runSearch();
                        }}
                        placeholder="Search videos, creators, subjects, identifiers..."
                        InputProps={{
                          startAdornment: <SearchRounded sx={{ mr: 1, color: "rgba(244,248,255,0.55)" }} />,
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
                          startIcon={loading ? <CircularProgress size={18} /> : <SearchRounded />}
                          sx={primaryButtonSx}
                        >
                          {loading ? "Finding playable videos" : "Search videos"}
                        </Button>
                        <Button
                          onClick={() => setShowCollections((value) => !value)}
                          variant="outlined"
                          sx={{ borderRadius: 999, color: "#dff8ff", borderColor: "rgba(158,232,255,0.45)" }}
                        >
                          Collections
                        </Button>
                      </Stack>
                      <Typography sx={{ color: "rgba(244,248,255,0.6)", fontSize: 13 }}>
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
                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 950 }}>
                    Video collections
                  </Typography>
                  <CollectionPicker selected={selectedCollections} onChange={setSelectedCollections} />
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
                    Checking Archive metadata for playable files
                  </Typography>
                </Stack>
                <LinearProgress variant={progress.total ? "determinate" : "indeterminate"} value={loadingProgress} />
                {progress.total ? (
                  <Typography sx={{ color: "rgba(244,248,255,0.66)", fontSize: 13 }}>
                    Checked {progress.checked} of {progress.total} candidate items.
                  </Typography>
                ) : null}
              </Stack>
            </Paper>
          ) : null}

          {error ? (
            <Alert severity={results.length ? "info" : "warning"} sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          ) : null}

          <Stack spacing={2}>
            {results.map((item) => (
              <VideoResultCard key={item.identifier} item={item} />
            ))}
          </Stack>

          {!loading && searched && !results.length && !error ? (
            <Paper sx={{ ...cardSx, p: 4, textAlign: "center" }}>
              <VideoFileRounded sx={{ fontSize: 54, color: "rgba(255,255,255,0.4)" }} />
              <Typography sx={{ mt: 1, fontWeight: 950 }}>No playable videos found.</Typography>
            </Paper>
          ) : null}

          {!searched ? (
            <Paper sx={{ ...cardSx, p: 3 }}>
              <Stack spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>
                  What this page filters out
                </Typography>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                <Typography sx={{ color: "rgba(244,248,255,0.68)" }}>
                  Search results are not shown until their Archive metadata includes at least one
                  playable video derivative. Metadata files, thumbnails, torrents, tiny previews,
                  and non-video downloads are ignored before the result card is rendered.
                </Typography>
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
