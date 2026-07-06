import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    Grid,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    ContentCopyRounded,
    DesktopWindowsRounded,
    LinkRounded,
    MicRounded,
    PhoneIphoneRounded,
    PlayArrowRounded,
    RestartAltRounded,
    ScreenShareRounded,
    StopRounded,
    VideocamRounded,
    VisibilityRounded,
    VolumeUpRounded,
    WarningAmberRounded,
} from "@mui/icons-material";
import {
    AppNavBar,
    GlassCard,
    GradientPage,
    SectionHeader,
    primaryPillSx,
} from "../components/components";

const STREAM_SIGNAL_API_URL = "https://scrapewebsite.pages.dev/api/stream-signal";

const STORAGE_ROOM_KEY = "clipmaster-stream-room";
const STORAGE_SIGNAL_API_KEY = "clipmaster-stream-signal-api";

const RTC_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

const IOS_BROWSER_SCREEN_CAPTURE_LIMITATION =
    "iPhone Safari can stream camera and microphone through getUserMedia, but it does not expose full iPhone screen capture to normal browser pages. This page only uses browser APIs, so iPhone screen capture is disabled and camera + microphone remains available.";

const DEVICE_PAIRING_NOTE =
    "Use the same room code on any two browsers: desktop to desktop, phone to desktop, desktop to phone, or phone to phone. One browser starts as Sender and the other starts as Receiver.";

const DISPLAY_MEDIA_OPTIONS = {
    video: {
        frameRate: { ideal: 30, max: 60 },
        width: { ideal: 1280 },
        height: { ideal: 720 },
    },
    audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        suppressLocalAudioPlayback: false,
    },
    systemAudio: "include",
    windowAudio: "system",
    surfaceSwitching: "include",
    selfBrowserSurface: "include",
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

const dangerButtonSx = {
    borderRadius: 999,
    fontWeight: 900,
};

function makeRoomCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function cleanRoom(value) {
    return String(value || "DEFAULT")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "")
        .slice(0, 64) || "DEFAULT";
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

function getTrackSummary(stream) {
    if (!stream) {
        return "0 video track(s), 0 audio track(s)";
    }

    return `${stream.getVideoTracks().length} video track(s), ${stream.getAudioTracks().length} audio track(s)`;
}

function stopStream(stream) {
    if (!stream) {
        return;
    }

    stream.getTracks().forEach((track) => track.stop());
}

function getDisplayCaptureFunction() {
    if (typeof navigator === "undefined") {
        return null;
    }

    if (navigator.mediaDevices?.getDisplayMedia) {
        return navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    }

    if (navigator.getDisplayMedia) {
        return navigator.getDisplayMedia.bind(navigator);
    }

    if (navigator.webkitGetDisplayMedia) {
        return navigator.webkitGetDisplayMedia.bind(navigator);
    }

    return null;
}

function getScreenCaptureSupportDetails() {
    if (typeof navigator === "undefined") {
        return {
            hasModernDisplayMedia: false,
            hasLegacyDisplayMedia: false,
            hasWebkitDisplayMedia: false,
        };
    }

    return {
        hasModernDisplayMedia: Boolean(navigator.mediaDevices?.getDisplayMedia),
        hasLegacyDisplayMedia: Boolean(navigator.getDisplayMedia),
        hasWebkitDisplayMedia: Boolean(navigator.webkitGetDisplayMedia),
    };
}

function getAudioConstraints() {
    return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
    };
}

function getCameraConstraintAttempts(facingMode) {
    return [
        {
            audio: getAudioConstraints(),
            video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30, max: 30 },
            },
        },
        {
            audio: getAudioConstraints(),
            video: {
                facingMode,
                width: { ideal: 960 },
                height: { ideal: 540 },
                frameRate: { ideal: 24, max: 30 },
            },
        },
        {
            audio: true,
            video: {
                facingMode,
            },
        },
        {
            audio: true,
            video: true,
        },
    ];
}

async function getMicrophoneOnlyStream() {
    return navigator.mediaDevices.getUserMedia({
        audio: getAudioConstraints(),
        video: false,
    });
}

async function getCameraOnlyStream(facingMode) {
    const attempts = [
        {
            audio: false,
            video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30, max: 30 },
            },
        },
        {
            audio: false,
            video: {
                facingMode,
            },
        },
        {
            audio: false,
            video: true,
        },
    ];

    let lastError = null;

    for (const constraints of attempts) {
        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Camera-only stream failed.");
}

async function getCameraAndMicStream(facingMode, addLog) {
    let lastError = null;

    for (const constraints of getCameraConstraintAttempts(facingMode)) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (stream.getVideoTracks().length && stream.getAudioTracks().length) {
                return stream;
            }

            if (stream.getVideoTracks().length && !stream.getAudioTracks().length) {
                try {
                    const micStream = await getMicrophoneOnlyStream();
                    return new MediaStream([
                        ...stream.getVideoTracks(),
                        ...micStream.getAudioTracks(),
                    ]);
                } catch (error) {
                    addLog(`Camera worked, but microphone fallback failed: ${error.message}`);
                    return stream;
                }
            }

            stopStream(stream);
        } catch (error) {
            lastError = error;
            addLog(`Camera/microphone capture retry after ${error.name || "Error"}: ${error.message}`);
        }
    }

    try {
        const cameraStream = await getCameraOnlyStream(facingMode);

        try {
            const micStream = await getMicrophoneOnlyStream();
            return new MediaStream([
                ...cameraStream.getVideoTracks(),
                ...micStream.getAudioTracks(),
            ]);
        } catch (error) {
            addLog(`Camera-only fallback is live, but microphone failed: ${error.message}`);
            return cameraStream;
        }
    } catch (cameraError) {
        lastError = cameraError || lastError;
    }

    throw lastError || new Error("Camera and microphone could not be started.");
}

async function getDisplayMediaWithAudio() {
    const displayCapture = getDisplayCaptureFunction();

    if (!displayCapture) {
        throw new Error("No browser screen-capture function is exposed on this device.");
    }

    try {
        return await displayCapture(DISPLAY_MEDIA_OPTIONS);
    } catch (error) {
        if (error?.name !== "TypeError") {
            throw error;
        }

        return displayCapture({
            video: true,
            audio: true,
        });
    }
}

function getStoredRoom() {
    if (typeof window === "undefined") {
        return makeRoomCode();
    }

    return cleanRoom(localStorage.getItem(STORAGE_ROOM_KEY) || makeRoomCode());
}

function getStoredSignalApi() {
    if (typeof window === "undefined") {
        return STREAM_SIGNAL_API_URL;
    }

    return localStorage.getItem(STORAGE_SIGNAL_API_KEY) || STREAM_SIGNAL_API_URL;
}

function parseInitialRole() {
    if (typeof window === "undefined") {
        return "receiver";
    }

    const value = new URLSearchParams(window.location.search).get("role");
    return value === "sender" ? "sender" : "receiver";
}

function parseInitialRoom() {
    if (typeof window === "undefined") {
        return makeRoomCode();
    }

    const fromUrl = new URLSearchParams(window.location.search).get("room");

    if (fromUrl) {
        return cleanRoom(fromUrl);
    }

    return getStoredRoom();
}

function parseAutoStart() {
    if (typeof window === "undefined") {
        return false;
    }

    const value = new URLSearchParams(window.location.search).get("auto");
    return value === "1" || value === "true";
}

function buildShareUrl(room, role = "sender") {
    if (typeof window === "undefined") {
        return "";
    }

    const url = new URL(window.location.href);
    url.pathname = "/stream";
    url.searchParams.set("room", cleanRoom(room));
    url.searchParams.set("role", role);

    if (role === "receiver") {
        url.searchParams.set("auto", "1");
    } else {
        url.searchParams.delete("auto");
    }

    return url.toString();
}

function updateBrowserUrl(room, role) {
    if (typeof window === "undefined") {
        return;
    }

    const url = new URL(window.location.href);
    url.pathname = "/stream";
    url.searchParams.set("room", cleanRoom(room));
    url.searchParams.set("role", role);

    if (role === "receiver") {
        url.searchParams.set("auto", "1");
    } else {
        url.searchParams.delete("auto");
    }

    window.history.replaceState(null, "", url.toString());
}

async function postSignalApi({ apiUrl, room, role, payload }) {
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
            room: cleanRoom(room),
            role,
            type: "signal",
            payload,
        }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
        throw new Error(data?.error || `Signal POST failed: ${response.status}`);
    }

    return data;
}

async function pollSignalApi({ apiUrl, room, role, since }) {
    const url = new URL(apiUrl);
    url.searchParams.set("room", cleanRoom(room));
    url.searchParams.set("role", role);
    url.searchParams.set("since", String(since || 0));

    const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
        throw new Error(data?.error || `Signal poll failed: ${response.status}`);
    }

    return data;
}

async function clearSignalRoom({ apiUrl, room }) {
    const url = new URL(apiUrl);
    url.searchParams.set("room", cleanRoom(room));

    await fetch(url.toString(), {
        method: "DELETE",
        cache: "no-store",
    }).catch(() => {});
}

function StatusLog({ logs }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 1.5,
                minHeight: 150,
                maxHeight: 230,
                overflow: "auto",
                borderRadius: 3,
                backgroundColor: "rgba(0,0,0,0.34)",
                border: "1px solid rgba(255,255,255,0.1)",
            }}
        >
            <Stack spacing={0.75}>
                {logs.length ? (
                    logs.map((line) => (
                        <Typography
                            key={line.id}
                            sx={{
                                color: "rgba(255,255,255,0.72)",
                                fontFamily:
                                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                                fontSize: 12,
                                lineHeight: 1.55,
                            }}
                        >
                            {line.text}
                        </Typography>
                    ))
                ) : (
                    <Typography sx={{ color: "rgba(255,255,255,0.54)", fontSize: 13 }}>
                        Stream status messages will show here.
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
}

function VideoPanel({ title, icon, videoRef, muted, placeholder }) {
    return (
        <GlassCard sx={{ p: 1.5 }}>
            <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                    {icon}
                    <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
                </Stack>

                <Box
                    sx={{
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 4,
                        border: "1px solid rgba(255,255,255,0.12)",
                        backgroundColor: "rgba(0,0,0,0.55)",
                        aspectRatio: "16 / 9",
                    }}
                >
                    <Box
                        component="video"
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={muted}
                        controls={!muted}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            backgroundColor: "black",
                        }}
                    />

                    {placeholder && (
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                display: "grid",
                                placeItems: "center",
                                pointerEvents: "none",
                            }}
                        >
                            <Typography
                                sx={{
                                    color: "rgba(255,255,255,0.36)",
                                    fontWeight: 900,
                                    textAlign: "center",
                                    px: 2,
                                }}
                            >
                                {placeholder}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Stack>
        </GlassCard>
    );
}

function EasyStep({ number, title, description }) {
    return (
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    flex: "0 0 auto",
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    color: "#07111f",
                    fontWeight: 1000,
                    background: "linear-gradient(135deg, #9ee8ff, #b38cff)",
                    boxShadow: "0 12px 34px rgba(158,232,255,0.18)",
                }}
            >
                {number}
            </Box>

            <Box>
                <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.6, fontSize: 14 }}>
                    {description}
                </Typography>
            </Box>
        </Stack>
    );
}

export default function Stream() {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const pollTimerRef = useRef(null);
    const lastSignalTimeRef = useRef(0);
    const processedMessageIdsRef = useRef(new Set());
    const makingOfferRef = useRef(false);
    const roleRef = useRef(parseInitialRole());
    const autoStartedRef = useRef(false);

    const [role, setRole] = useState(parseInitialRole);
    const [room, setRoom] = useState(parseInitialRoom);
    const [signalApiUrl, setSignalApiUrl] = useState(getStoredSignalApi);
    const [connectedSignal, setConnectedSignal] = useState(false);
    const [peerState, setPeerState] = useState("idle");
    const [streamLabel, setStreamLabel] = useState("");
    const [logs, setLogs] = useState([]);
    const [localActive, setLocalActive] = useState(false);
    const [remoteActive, setRemoteActive] = useState(false);
    const [localAudioActive, setLocalAudioActive] = useState(false);
    const [localVideoActive, setLocalVideoActive] = useState(false);
    const [remoteAudioActive, setRemoteAudioActive] = useState(false);
    const [remoteVideoActive, setRemoteVideoActive] = useState(false);

    const isIOS = useMemo(() => isIOSDevice(), []);
    const isSecure = typeof window !== "undefined" ? window.isSecureContext : false;
    const shouldAutoStartReceiver = useMemo(() => parseAutoStart(), []);
    const screenCaptureSupport = useMemo(() => getScreenCaptureSupportDetails(), []);

    const supportsCamera =
        typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

    const supportsDisplay = Boolean(
        screenCaptureSupport.hasModernDisplayMedia ||
        screenCaptureSupport.hasLegacyDisplayMedia ||
        screenCaptureSupport.hasWebkitDisplayMedia
    );

    useEffect(() => {
        roleRef.current = role;
        updateBrowserUrl(room, role);
    }, [room, role]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_ROOM_KEY, cleanRoom(room));
        }
    }, [room]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_SIGNAL_API_KEY, signalApiUrl || STREAM_SIGNAL_API_URL);
        }
    }, [signalApiUrl]);

    const addLog = useCallback((message) => {
        const stamp = new Date().toLocaleTimeString();

        setLogs((current) => [
            {
                id: `${Date.now()}-${Math.random()}`,
                text: `[${stamp}] ${message}`,
            },
            ...current,
        ].slice(0, 100));
    }, []);

    const closeSignal = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }

        setConnectedSignal(false);
    }, []);

    const cleanupPeer = useCallback((stopTracks = false) => {
        const pc = pcRef.current;

        if (pc) {
            pc.ontrack = null;
            pc.onicecandidate = null;
            pc.onconnectionstatechange = null;
            pc.close();
            pcRef.current = null;
        }

        pendingCandidatesRef.current = [];
        makingOfferRef.current = false;
        setPeerState("idle");

        if (stopTracks && localStreamRef.current) {
            stopStream(localStreamRef.current);
            localStreamRef.current = null;
            setLocalActive(false);
            setLocalAudioActive(false);
            setLocalVideoActive(false);
            setStreamLabel("");

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
        }

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        setRemoteActive(false);
        setRemoteAudioActive(false);
        setRemoteVideoActive(false);
    }, []);

    const sendSignal = useCallback(async (payload) => {
        try {
            await postSignalApi({
                apiUrl: signalApiUrl || STREAM_SIGNAL_API_URL,
                room,
                role: roleRef.current,
                payload,
            });

            setConnectedSignal(true);
            return true;
        } catch (error) {
            addLog(`Signal API send failed: ${error.message}`);
            setConnectedSignal(false);
            return false;
        }
    }, [addLog, room, signalApiUrl]);

    const flushPendingCandidates = useCallback(async () => {
        const pc = pcRef.current;

        if (!pc || !pc.remoteDescription) {
            return;
        }

        const pending = pendingCandidatesRef.current.splice(0);

        for (const candidate of pending) {
            try {
                await pc.addIceCandidate(candidate);
            } catch (error) {
                addLog(`Queued ICE failed: ${error.message}`);
            }
        }
    }, [addLog]);

    const unlockReceiverPlayback = useCallback(async () => {
        const video = remoteVideoRef.current;

        if (!video) {
            return false;
        }

        video.muted = false;
        video.volume = 1;
        video.playsInline = true;

        try {
            await video.play();
            addLog("Receiver playback/audio is enabled.");
            return true;
        } catch (error) {
            addLog(`Receiver audio needs one click/tap to unlock: ${error.message}`);
            return false;
        }
    }, [addLog]);

    const createPeerConnection = useCallback((nextRole) => {
        cleanupPeer(false);

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;
        setPeerState("created");

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal({
                    candidate: event.candidate,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            setPeerState(pc.connectionState);
            addLog(`Peer connection: ${pc.connectionState}`);

            if (pc.connectionState === "connected") {
                if (nextRole === "receiver") {
                    setRemoteActive(true);
                }
            }

            if (
                pc.connectionState === "failed" ||
                pc.connectionState === "closed" ||
                pc.connectionState === "disconnected"
            ) {
                if (nextRole === "receiver") {
                    setRemoteActive(false);
                    setRemoteAudioActive(false);
                    setRemoteVideoActive(false);
                }
            }
        };

        if (nextRole === "receiver") {
            const remoteStream = new MediaStream();

            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.volume = 1;
                remoteVideoRef.current.muted = false;
            }

            pc.addTransceiver("video", { direction: "recvonly" });
            pc.addTransceiver("audio", { direction: "recvonly" });

            pc.ontrack = (event) => {
                addLog(`Received ${event.track.kind} track.`);

                event.track.enabled = true;
                event.track.onmute = () => addLog(`Remote ${event.track.kind} track muted by browser/source.`);
                event.track.onunmute = () => addLog(`Remote ${event.track.kind} track unmuted.`);
                event.track.onended = () => addLog(`Remote ${event.track.kind} track ended.`);

                remoteStream.addTrack(event.track);
                setRemoteActive(true);
                setRemoteVideoActive(remoteStream.getVideoTracks().length > 0);
                setRemoteAudioActive(remoteStream.getAudioTracks().length > 0);

                const video = remoteVideoRef.current;

                if (video) {
                    video.srcObject = remoteStream;
                    video.muted = false;
                    video.volume = 1;
                    unlockReceiverPlayback();
                }
            };
        }

        return pc;
    }, [addLog, cleanupPeer, sendSignal, unlockReceiverPlayback]);

    const handleSignal = useCallback(async (payload) => {
        if (!payload) {
            return;
        }

        let pc = pcRef.current;

        if (payload.sdp) {
            const description = payload.sdp;

            if (description.type === "offer") {
                if (roleRef.current !== "receiver") {
                    addLog("Ignored offer because this page is not receiver mode.");
                    return;
                }

                if (!pc || pc.signalingState === "closed") {
                    pc = createPeerConnection("receiver");
                }

                await pc.setRemoteDescription(description);
                await flushPendingCandidates();

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                await sendSignal({
                    sdp: pc.localDescription,
                });

                addLog("Received sender offer and sent receiver answer.");
                return;
            }

            if (description.type === "answer") {
                if (!pc) {
                    addLog("No sender peer exists for answer.");
                    return;
                }

                await pc.setRemoteDescription(description);
                await flushPendingCandidates();

                addLog("Receiver answer accepted. Stream should connect now.");
                return;
            }
        }

        if (payload.candidate) {
            if (!pc || !pc.remoteDescription) {
                pendingCandidatesRef.current.push(payload.candidate);
                return;
            }

            try {
                await pc.addIceCandidate(payload.candidate);
            } catch (error) {
                addLog(`ICE candidate failed: ${error.message}`);
            }
        }
    }, [addLog, createPeerConnection, flushPendingCandidates, sendSignal]);

    const pollOnce = useCallback(async () => {
        try {
            const data = await pollSignalApi({
                apiUrl: signalApiUrl || STREAM_SIGNAL_API_URL,
                room,
                role: roleRef.current,
                since: lastSignalTimeRef.current,
            });

            setConnectedSignal(true);

            const messages = Array.isArray(data.messages) ? data.messages : [];

            messages
                .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
                .forEach((message) => {
                    const id = message.id || `${message.createdAt}-${JSON.stringify(message.payload || {})}`;

                    if (processedMessageIdsRef.current.has(id)) {
                        return;
                    }

                    processedMessageIdsRef.current.add(id);

                    if (processedMessageIdsRef.current.size > 500) {
                        processedMessageIdsRef.current = new Set(
                            Array.from(processedMessageIdsRef.current).slice(-250)
                        );
                    }

                    lastSignalTimeRef.current = Math.max(
                        lastSignalTimeRef.current,
                        Number(message.createdAt || 0)
                    );

                    handleSignal(message.payload);
                });
        } catch (error) {
            setConnectedSignal(false);
            addLog(`Signal API poll failed: ${error.message}`);
        }
    }, [addLog, handleSignal, room, signalApiUrl]);

    const startSignalPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }

        setConnectedSignal(true);

        pollOnce();
        pollTimerRef.current = setInterval(pollOnce, 850);

        addLog(`Signal API polling started for room ${cleanRoom(room)}.`);
    }, [addLog, pollOnce, room]);

    const connectSignal = useCallback(async () => {
        lastSignalTimeRef.current = Date.now() - 30000;
        processedMessageIdsRef.current.clear();
        startSignalPolling();
        return true;
    }, [startSignalPolling]);

    const makeSenderOffer = useCallback(async () => {
        if (makingOfferRef.current) {
            return;
        }

        const stream = localStreamRef.current;

        if (!stream) {
            addLog("Start camera/microphone or browser screen capture first.");
            return;
        }

        makingOfferRef.current = true;

        try {
            let pc = pcRef.current;

            if (!pc || pc.signalingState === "closed") {
                pc = createPeerConnection("sender");

                stream.getTracks().forEach((track) => {
                    pc.addTrack(track, stream);
                    addLog(`Sender added ${track.kind} track.`);
                });
            }

            const offer = await pc.createOffer({
                offerToReceiveAudio: false,
                offerToReceiveVideo: false,
            });

            await pc.setLocalDescription(offer);

            await sendSignal({
                sdp: pc.localDescription,
            });

            addLog("Sent WebRTC offer to receiver.");
        } catch (error) {
            addLog(`Offer failed: ${error.message}`);
        } finally {
            makingOfferRef.current = false;
        }
    }, [addLog, createPeerConnection, sendSignal]);

    const startSenderWithStream = useCallback(async (stream, label) => {
        cleanupPeer(false);

        if (localStreamRef.current && localStreamRef.current !== stream) {
            stopStream(localStreamRef.current);
        }

        await clearSignalRoom({
            apiUrl: signalApiUrl || STREAM_SIGNAL_API_URL,
            room,
        });

        addLog("Cleared old room messages for a fresh connection.");

        localStreamRef.current = stream;
        setLocalActive(true);
        setLocalVideoActive(stream.getVideoTracks().length > 0);
        setLocalAudioActive(stream.getAudioTracks().length > 0);
        setStreamLabel(label);

        stream.getTracks().forEach((track) => {
            track.enabled = true;
            track.onended = () => addLog(`Local ${track.kind} track ended.`);
            track.onmute = () => addLog(`Local ${track.kind} track muted by browser/source.`);
            track.onunmute = () => addLog(`Local ${track.kind} track unmuted.`);
        });

        addLog(`Starting sender stream with ${getTrackSummary(stream)}.`);

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.muted = true;
            localVideoRef.current.playsInline = true;

            try {
                await localVideoRef.current.play();
            } catch {
                // iOS may require the user to tap. The stream still exists.
            }
        }

        await connectSignal();

        const pc = createPeerConnection("sender");

        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
            addLog(`Sender added ${track.kind} track.`);
        });

        await makeSenderOffer();
    }, [
        addLog,
        cleanupPeer,
        connectSignal,
        createPeerConnection,
        makeSenderOffer,
        room,
        signalApiUrl,
    ]);

    const startCamera = useCallback(async (facingMode = "environment") => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                addLog("Camera API is not available. Use Safari/Chrome over HTTPS.");
                return;
            }

            if (!isSecure) {
                addLog("Camera and microphone require HTTPS. Open the Cloudflare Pages HTTPS URL on the sender device.");
                return;
            }

            setRole("sender");
            roleRef.current = "sender";

            addLog(`Requesting ${facingMode === "user" ? "front" : "back"} camera and microphone...`);

            const stream = await getCameraAndMicStream(facingMode, addLog);

            await startSenderWithStream(
                stream,
                facingMode === "user" ? "front camera + mic" : "back camera + mic"
            );

            addLog(`Camera stream started with ${getTrackSummary(stream)}.`);
        } catch (error) {
            addLog(`Camera start failed: ${error.message}`);
        }
    }, [addLog, isSecure, startSenderWithStream]);

    const stopEverything = useCallback(() => {
        cleanupPeer(true);
        closeSignal();

        clearSignalRoom({
            apiUrl: signalApiUrl || STREAM_SIGNAL_API_URL,
            room,
        });

        addLog("Stopped stream and cleared signaling room.");
    }, [addLog, cleanupPeer, closeSignal, room, signalApiUrl]);

    const startScreenCapture = useCallback(async () => {
        try {
            if (isIOS) {
                const support = getScreenCaptureSupportDetails();

                addLog(
                    `iOS screen-capture probe: mediaDevices.getDisplayMedia=${support.hasModernDisplayMedia ? "yes" : "no"}, navigator.getDisplayMedia=${support.hasLegacyDisplayMedia ? "yes" : "no"}, navigator.webkitGetDisplayMedia=${support.hasWebkitDisplayMedia ? "yes" : "no"}.`
                );
                addLog(IOS_BROWSER_SCREEN_CAPTURE_LIMITATION);
                return;
            }

            if (!getDisplayCaptureFunction()) {
                addLog("Screen capture is not available in this browser.");
                return;
            }

            setRole("sender");
            roleRef.current = "sender";

            addLog("Requesting browser screen capture with audio...");

            const screenStream = await getDisplayMediaWithAudio();

            let finalStream = screenStream;

            if (!screenStream.getAudioTracks().length) {
                try {
                    const micStream = await getMicrophoneOnlyStream();

                    finalStream = new MediaStream([
                        ...screenStream.getVideoTracks(),
                        ...micStream.getAudioTracks(),
                    ]);
                    addLog("Screen capture had no audio track, so microphone fallback was added.");
                } catch (error) {
                    addLog(`Microphone fallback unavailable: ${error.message}`);
                    finalStream = screenStream;
                }
            }

            finalStream.getVideoTracks()[0]?.addEventListener("ended", () => {
                addLog("Screen capture ended.");
                stopEverything();
            });

            await startSenderWithStream(finalStream, "browser screen capture");

            addLog(`Screen capture stream started with ${getTrackSummary(finalStream)}. Protected video may appear black or fail to capture.`);
        } catch (error) {
            addLog(`Screen capture failed: ${error.message}`);
        }
    }, [addLog, isIOS, startSenderWithStream, stopEverything]);

    const connectReceiver = useCallback(async () => {
        try {
            cleanupPeer(false);

            setRole("receiver");
            roleRef.current = "receiver";

            await unlockReceiverPlayback();
            await connectSignal();
            createPeerConnection("receiver");

            addLog("Receiver is armed. Now start the sender device.");
        } catch (error) {
            addLog(`Receiver connect failed: ${error.message}`);
        }
    }, [addLog, cleanupPeer, connectSignal, createPeerConnection, unlockReceiverPlayback]);

    const reconnectCurrentSide = useCallback(async () => {
        if (roleRef.current === "receiver") {
            await connectReceiver();
            return;
        }

        if (localStreamRef.current) {
            cleanupPeer(false);
            const pc = createPeerConnection("sender");

            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current);
                addLog(`Sender re-added ${track.kind} track.`);
            });

            await makeSenderOffer();
        } else {
            addLog("No active sender stream to reconnect. Tap Start Camera + Mic or Browser Screen Capture first.");
        }
    }, [addLog, cleanupPeer, connectReceiver, createPeerConnection, makeSenderOffer]);

    const copyText = useCallback(async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            addLog(`Copied ${label}.`);
        } catch {
            addLog(`${label}: ${text}`);
        }
    }, [addLog]);

    const copySenderLink = useCallback(async () => {
        await copyText(buildShareUrl(room, "sender"), "sender link");
    }, [copyText, room]);

    const copyReceiverLink = useCallback(async () => {
        await copyText(buildShareUrl(room, "receiver"), "receiver link");
    }, [copyText, room]);

    const createFreshRoom = useCallback(async () => {
        const nextRoom = makeRoomCode();

        stopEverything();
        setRoom(nextRoom);
        updateBrowserUrl(nextRoom, roleRef.current);

        addLog(`Created fresh room ${nextRoom}.`);
    }, [addLog, stopEverything]);

    useEffect(() => {
        if (autoStartedRef.current) {
            return;
        }

        if (role !== "receiver") {
            return;
        }

        if (!shouldAutoStartReceiver) {
            return;
        }

        autoStartedRef.current = true;

        const timer = setTimeout(() => {
            connectReceiver();
        }, 450);

        return () => clearTimeout(timer);
    }, [connectReceiver, role, shouldAutoStartReceiver]);

    useEffect(() => {
        return () => {
            cleanupPeer(true);
            closeSignal();
        };
    }, [cleanupPeer, closeSignal]);

    const senderLink = buildShareUrl(room, "sender");
    const receiverLink = buildShareUrl(room, "receiver");

    return (
        <GradientPage>
            <AppNavBar />

            <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
                <Stack spacing={4}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Stack spacing={2}>
                                <Chip
                                    label="Easy Cloudflare WebRTC Stream"
                                    sx={{
                                        width: "fit-content",
                                        color: "#9ee8ff",
                                        fontWeight: 950,
                                        backgroundColor: "rgba(158,232,255,0.1)",
                                        border: "1px solid rgba(158,232,255,0.22)",
                                    }}
                                />

                                <Typography
                                    variant="h1"
                                    sx={{
                                        fontWeight: 1000,
                                        letterSpacing: -2,
                                        lineHeight: 0.95,
                                        fontSize: { xs: "2.5rem", sm: "4rem", md: "5.35rem" },
                                    }}
                                >
                                    Browser-only WebRTC streaming between any two devices.
                                </Typography>

                                <Typography
                                    sx={{
                                        maxWidth: 900,
                                        color: "rgba(255,255,255,0.72)",
                                        fontSize: { xs: 16, md: 19 },
                                        lineHeight: 1.75,
                                    }}
                                >
                                    One browser opens as the receiver and waits. The other opens as the sender and
                                    starts camera plus microphone, or browser screen capture when supported. It works
                                    for two desktops, phone to desktop, desktop to phone, and phone to phone.
                                </Typography>

                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    <Chip
                                        icon={<PhoneIphoneRounded />}
                                        label={isIOS ? "iOS browser detected" : "Browser device detected"}
                                        sx={{
                                            color: "#9ee8ff",
                                            fontWeight: 900,
                                            border: "1px solid rgba(158,232,255,0.2)",
                                        }}
                                    />

                                    <Chip
                                        icon={<VisibilityRounded />}
                                        label={isSecure ? "HTTPS ready" : "Not HTTPS"}
                                        sx={{
                                            color: isSecure ? "#7ef4b6" : "#ffcf7a",
                                            fontWeight: 900,
                                            border: isSecure
                                                ? "1px solid rgba(126,244,182,0.22)"
                                                : "1px solid rgba(255,207,122,0.25)",
                                        }}
                                    />

                                    <Chip
                                        icon={<MicRounded />}
                                        label={supportsCamera ? "Camera/mic ready" : "Camera/mic unavailable"}
                                        sx={{
                                            color: supportsCamera ? "#7ef4b6" : "#ffcf7a",
                                            fontWeight: 900,
                                            border: supportsCamera
                                                ? "1px solid rgba(126,244,182,0.22)"
                                                : "1px solid rgba(255,207,122,0.25)",
                                        }}
                                    />

                                    <Chip
                                        icon={<ScreenShareRounded />}
                                        label={supportsDisplay ? "Browser screen API exposed" : "Browser screen API blocked"}
                                        sx={{
                                            color: supportsDisplay ? "#7ef4b6" : "#ffcf7a",
                                            fontWeight: 900,
                                            border: supportsDisplay
                                                ? "1px solid rgba(126,244,182,0.22)"
                                                : "1px solid rgba(255,207,122,0.25)",
                                        }}
                                    />

                                    <Chip
                                        label={`Room ${cleanRoom(room)}`}
                                        sx={{
                                            color: "#b38cff",
                                            fontWeight: 900,
                                            border: "1px solid rgba(179,140,255,0.25)",
                                        }}
                                    />

                                    <Chip
                                        label={role === "sender" ? "Sender mode" : "Receiver mode"}
                                        sx={{
                                            color: role === "sender" ? "#9ee8ff" : "#b38cff",
                                            fontWeight: 900,
                                            border: "1px solid rgba(255,255,255,0.14)",
                                        }}
                                    />
                                </Stack>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <GlassCard>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <WarningAmberRounded sx={{ color: "#ffcf7a" }} />
                                        <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                            Browser-only device pairing
                                        </Typography>
                                    </Stack>

                                    <Typography sx={{ color: "rgba(255,255,255,0.68)", lineHeight: 1.7 }}>
                                        {DEVICE_PAIRING_NOTE} This page only uses browser features: camera, microphone,
                                        browser screen capture when exposed, WebRTC, and HTTPS fetch calls to your
                                        Cloudflare signal API.
                                    </Typography>
                                </Stack>
                            </GlassCard>
                        </Grid>
                    </Grid>

                    {!isSecure && (
                        <Alert
                            severity="warning"
                            sx={{
                                borderRadius: 4,
                                backgroundColor: "rgba(255,199,107,0.1)",
                                color: "#ffe4ad",
                                border: "1px solid rgba(255,199,107,0.24)",
                            }}
                        >
                            Browsers usually block camera and microphone on non-HTTPS pages.
                            Test from your Cloudflare Pages HTTPS URL.
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={5}>
                            <GlassCard>
                                <Stack spacing={2.25}>
                                    <SectionHeader
                                        compact
                                        eyebrow="Easy setup"
                                        title="Use these two links"
                                        description="Start one device as the receiver first, then open the sender link on the other device."
                                    />

                                    <Stack spacing={1.5}>
                                        <EasyStep
                                            number={1}
                                            title="Receiver device"
                                            description="Open the receiver link on any desktop or phone. It auto-arms and waits."
                                        />
                                        <EasyStep
                                            number={2}
                                            title="Sender device"
                                            description="Open the sender link on any desktop or phone, then tap Start Camera + Mic."
                                        />
                                        <EasyStep
                                            number={3}
                                            title="Live"
                                            description="The receiver gets the sender video and audio through WebRTC."
                                        />
                                    </Stack>

                                    <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                                    <TextField
                                        label="Room code"
                                        value={room}
                                        onChange={(event) => setRoom(cleanRoom(event.target.value))}
                                        fullWidth
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: "white",
                                                borderRadius: 3,
                                            },
                                        }}
                                    />

                                    <TextField
                                        label="Cloudflare Pages Signal API"
                                        value={signalApiUrl}
                                        onChange={(event) => {
                                            setSignalApiUrl(event.target.value.trim() || STREAM_SIGNAL_API_URL);
                                        }}
                                        fullWidth
                                        helperText="Default: https://scrapewebsite.pages.dev/api/stream-signal"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: "white",
                                                borderRadius: 3,
                                            },
                                            "& .MuiFormHelperText-root": {
                                                color: "rgba(255,255,255,0.48)",
                                            },
                                        }}
                                    />

                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Button onClick={createFreshRoom} sx={softButtonSx}>
                                            New Clean Room
                                        </Button>

                                        <Button
                                            onClick={copySenderLink}
                                            startIcon={<ContentCopyRounded />}
                                            sx={softButtonSx}
                                        >
                                            Copy Sender Link
                                        </Button>

                                        <Button
                                            onClick={copyReceiverLink}
                                            startIcon={<ContentCopyRounded />}
                                            sx={softButtonSx}
                                        >
                                            Copy Receiver Link
                                        </Button>
                                    </Stack>

                                    <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <LinkRounded sx={{ color: "#9ee8ff" }} />
                                            <Typography sx={{ fontWeight: 950 }}>
                                                Sender URL
                                            </Typography>
                                        </Stack>

                                        <Typography
                                            onClick={() => copyText(senderLink, "sender link")}
                                            sx={{
                                                color: "rgba(255,255,255,0.62)",
                                                fontSize: 13,
                                                wordBreak: "break-all",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {senderLink}
                                        </Typography>
                                    </Stack>

                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <DesktopWindowsRounded sx={{ color: "#b38cff" }} />
                                            <Typography sx={{ fontWeight: 950 }}>
                                                Receiver URL
                                            </Typography>
                                        </Stack>

                                        <Typography
                                            onClick={() => copyText(receiverLink, "receiver link")}
                                            sx={{
                                                color: "rgba(255,255,255,0.62)",
                                                fontSize: 13,
                                                wordBreak: "break-all",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {receiverLink}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </GlassCard>
                        </Grid>

                        <Grid item xs={12} md={7}>
                            <GlassCard>
                                <Stack spacing={2.25}>
                                    <SectionHeader
                                        compact
                                        eyebrow="Controls"
                                        title={role === "sender" ? "Sender controls" : "Receiver controls"}
                                        description={
                                            role === "sender"
                                                ? "Start camera/microphone or browser screen capture, then send a WebRTC offer."
                                                : "Receiver mode waits for the sender device and auto-answers the WebRTC offer."
                                        }
                                    />

                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Button
                                            onClick={() => {
                                                setRole("receiver");
                                                roleRef.current = "receiver";
                                                addLog("Switched to receiver mode.");
                                            }}
                                            startIcon={<DesktopWindowsRounded />}
                                            variant={role === "receiver" ? "contained" : "text"}
                                            sx={role === "receiver" ? primaryPillSx : softButtonSx}
                                        >
                                            Receiver
                                        </Button>

                                        <Button
                                            onClick={() => {
                                                setRole("sender");
                                                roleRef.current = "sender";
                                                addLog("Switched to sender mode.");
                                            }}
                                            startIcon={<PhoneIphoneRounded />}
                                            variant={role === "sender" ? "contained" : "text"}
                                            sx={role === "sender" ? primaryPillSx : softButtonSx}
                                        >
                                            Sender
                                        </Button>
                                    </Stack>

                                    <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                                    {role === "sender" ? (
                                        <Stack spacing={2}>
                                            <Button
                                                disabled={!supportsCamera}
                                                onClick={() => startCamera("environment")}
                                                startIcon={<VideocamRounded />}
                                                variant="contained"
                                                sx={{
                                                    ...primaryPillSx,
                                                    minHeight: 58,
                                                    fontSize: 17,
                                                }}
                                            >
                                                Start Camera + Mic
                                            </Button>

                                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                                <Button
                                                    disabled={!supportsCamera}
                                                    onClick={() => startCamera("user")}
                                                    startIcon={<PhoneIphoneRounded />}
                                                    sx={softButtonSx}
                                                >
                                                    Use Front Camera
                                                </Button>

                                                <Tooltip
                                                    title={
                                                        supportsDisplay && !isIOS
                                                            ? "Starts browser screen capture with audio when this browser exposes getDisplayMedia."
                                                            : "Screen capture is not available from this browser. Use Camera + Mic instead."
                                                    }
                                                >
                                                    <span>
                                                        <Button
                                                            disabled={isIOS || !supportsDisplay}
                                                            onClick={startScreenCapture}
                                                            startIcon={<ScreenShareRounded />}
                                                            sx={softButtonSx}
                                                        >
                                                            Browser Screen Capture
                                                        </Button>
                                                    </span>
                                                </Tooltip>

                                                <Button
                                                    onClick={reconnectCurrentSide}
                                                    startIcon={<RestartAltRounded />}
                                                    sx={softButtonSx}
                                                >
                                                    Reconnect Stream
                                                </Button>
                                            </Stack>

                                            <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>
                                                The sender browser will ask for camera and microphone permission. Keep this
                                                page open while streaming. If permission fails, check the browser site
                                                settings for Camera and Microphone, then tap Reconnect Stream.
                                            </Typography>
                                        </Stack>
                                    ) : (
                                        <Stack spacing={2}>
                                            <Button
                                                onClick={connectReceiver}
                                                startIcon={<PlayArrowRounded />}
                                                variant="contained"
                                                sx={{
                                                    ...primaryPillSx,
                                                    minHeight: 58,
                                                    fontSize: 17,
                                                }}
                                            >
                                                Start Receiver
                                            </Button>

                                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                                <Button
                                                    onClick={reconnectCurrentSide}
                                                    startIcon={<RestartAltRounded />}
                                                    sx={softButtonSx}
                                                >
                                                    Reconnect Receiver
                                                </Button>

                                                <Button
                                                    onClick={unlockReceiverPlayback}
                                                    startIcon={<VolumeUpRounded />}
                                                    sx={softButtonSx}
                                                >
                                                    Enable Receiver Audio
                                                </Button>

                                                <Button
                                                    onClick={copySenderLink}
                                                    startIcon={<ContentCopyRounded />}
                                                    sx={softButtonSx}
                                                >
                                                    Copy Sender Link
                                                </Button>
                                            </Stack>

                                            <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>
                                                The receiver can be started first. Once the sender starts camera/mic or
                                                browser screen capture, this device will answer and display the stream.
                                            </Typography>
                                        </Stack>
                                    )}

                                    <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Button
                                            onClick={stopEverything}
                                            color="error"
                                            startIcon={<StopRounded />}
                                            sx={dangerButtonSx}
                                        >
                                            Stop Everything
                                        </Button>

                                        <Chip
                                            label={connectedSignal ? "Signal API active" : "Signal API stopped"}
                                            sx={{
                                                color: connectedSignal ? "#7ef4b6" : "#ffb4b4",
                                                fontWeight: 900,
                                                border: connectedSignal
                                                    ? "1px solid rgba(126,244,182,0.25)"
                                                    : "1px solid rgba(255,180,180,0.25)",
                                            }}
                                        />

                                        <Chip
                                            label={`Peer: ${peerState}`}
                                            sx={{
                                                color: "#9ee8ff",
                                                fontWeight: 900,
                                                border: "1px solid rgba(158,232,255,0.22)",
                                            }}
                                        />

                                        <Chip
                                            label={localVideoActive ? "Local camera active" : "Local camera waiting"}
                                            sx={{
                                                color: localVideoActive ? "#7ef4b6" : "rgba(255,255,255,0.58)",
                                                fontWeight: 900,
                                                border: localVideoActive
                                                    ? "1px solid rgba(126,244,182,0.25)"
                                                    : "1px solid rgba(255,255,255,0.14)",
                                            }}
                                        />

                                        <Chip
                                            label={localAudioActive ? "Local mic active" : "Local mic waiting"}
                                            sx={{
                                                color: localAudioActive ? "#7ef4b6" : "rgba(255,255,255,0.58)",
                                                fontWeight: 900,
                                                border: localAudioActive
                                                    ? "1px solid rgba(126,244,182,0.25)"
                                                    : "1px solid rgba(255,255,255,0.14)",
                                            }}
                                        />

                                        <Chip
                                            label={remoteVideoActive ? "Remote video received" : "Remote video waiting"}
                                            sx={{
                                                color: remoteVideoActive ? "#7ef4b6" : "rgba(255,255,255,0.58)",
                                                fontWeight: 900,
                                                border: remoteVideoActive
                                                    ? "1px solid rgba(126,244,182,0.25)"
                                                    : "1px solid rgba(255,255,255,0.14)",
                                            }}
                                        />

                                        <Chip
                                            label={remoteAudioActive ? "Remote audio received" : "Remote audio waiting"}
                                            sx={{
                                                color: remoteAudioActive ? "#7ef4b6" : "rgba(255,255,255,0.58)",
                                                fontWeight: 900,
                                                border: remoteAudioActive
                                                    ? "1px solid rgba(126,244,182,0.25)"
                                                    : "1px solid rgba(255,255,255,0.14)",
                                            }}
                                        />

                                        {streamLabel && (
                                            <Chip
                                                label={streamLabel}
                                                sx={{
                                                    color: "#b38cff",
                                                    fontWeight: 900,
                                                    border: "1px solid rgba(179,140,255,0.24)",
                                                }}
                                            />
                                        )}
                                    </Stack>
                                </Stack>
                            </GlassCard>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <VideoPanel
                                title="Sender preview"
                                icon={<PhoneIphoneRounded sx={{ color: "#9ee8ff" }} />}
                                videoRef={localVideoRef}
                                muted
                                placeholder={localActive ? "" : "Sender preview appears here"}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <VideoPanel
                                title="Receiver live view"
                                icon={<DesktopWindowsRounded sx={{ color: "#b38cff" }} />}
                                videoRef={remoteVideoRef}
                                muted={false}
                                placeholder={remoteActive ? "" : "Received stream appears here"}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={7}>
                            <GlassCard>
                                <Stack spacing={2}>
                                    <SectionHeader
                                        compact
                                        eyebrow="Status"
                                        title="Connection log"
                                        description="Use this to see permission, API polling, WebRTC offers, answers, and ICE status."
                                    />

                                    <StatusLog logs={logs} />
                                </Stack>
                            </GlassCard>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <GlassCard>
                                <Stack spacing={2}>
                                    <SectionHeader
                                        compact
                                        eyebrow="Fastest workflow"
                                        title="How to use it"
                                    />

                                    <Stack spacing={1.5}>
                                        <EasyStep
                                            number={1}
                                            title="Open receiver device"
                                            description="Use the receiver link on any desktop or phone. Receiver mode auto-starts when the URL has auto=1."
                                        />
                                        <EasyStep
                                            number={2}
                                            title="Open sender device"
                                            description="Use the sender link on any desktop or phone. Tap Start Camera + Mic, or Browser Screen Capture when supported."
                                        />
                                        <EasyStep
                                            number={3}
                                            title="Fix connection quickly"
                                            description="Use Reconnect Stream or New Clean Room if stale signaling messages get in the way."
                                        />
                                    </Stack>

                                    <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                                    <SectionHeader
                                        compact
                                        eyebrow="Browser limits"
                                        title="What this page can receive"
                                        description="Everything here is possible from normal browser APIs and your Cloudflare Pages signal endpoint."
                                    />

                                    <Stack spacing={1.5}>
                                        <EasyStep
                                            number={1}
                                            title="Camera + microphone"
                                            description="Works in browser over HTTPS after the user taps the sender button and grants Camera/Microphone permission."
                                        />
                                        <EasyStep
                                            number={2}
                                            title="Browser screen capture"
                                            description="Works only when the sender browser exposes getDisplayMedia. The page disables this control when the API is blocked."
                                        />
                                        <EasyStep
                                            number={3}
                                            title="WebRTC receiver"
                                            description="The receiver page gets remote browser media tracks over WebRTC after Cloudflare handles signaling."
                                        />
                                    </Stack>
                                </Stack>
                            </GlassCard>
                        </Grid>
                    </Grid>
                </Stack>
            </Container>
        </GradientPage>
    );
}
