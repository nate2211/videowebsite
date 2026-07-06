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

const IPHONE_SCREEN_CAPTURE_LIMITATION =
    "iPhone Safari/Chrome do not currently expose full-device browser screen capture through getDisplayMedia. The page will still stream iPhone camera video with microphone audio, and desktop browsers can use screen sharing with audio when supported.";

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

async function getDisplayMediaWithAudio() {
    try {
        return await navigator.mediaDevices.getDisplayMedia(DISPLAY_MEDIA_OPTIONS);
    } catch (error) {
        if (error?.name !== "TypeError") {
            throw error;
        }

        return navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
        });
    }
}

async function getMicrophoneStream() {
    return navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        },
        video: false,
    });
}

function mergeVideoWithFallbackAudio(videoStream, audioStream) {
    return new MediaStream([
        ...videoStream.getVideoTracks(),
        ...videoStream.getAudioTracks(),
        ...audioStream.getAudioTracks(),
    ]);
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
    const [remoteAudioActive, setRemoteAudioActive] = useState(false);
    const [remoteVideoActive, setRemoteVideoActive] = useState(false);

    const isIOS = useMemo(() => isIOSDevice(), []);
    const isSecure = typeof window !== "undefined" ? window.isSecureContext : false;
    const shouldAutoStartReceiver = useMemo(() => parseAutoStart(), []);

    const supportsCamera =
        typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

    const supportsDisplay =
        typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices?.getDisplayMedia);

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
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
            setLocalActive(false);
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
            addLog("Desktop receiver playback/audio is enabled.");
            return true;
        } catch (error) {
            addLog(`Desktop audio needs one click/tap to unlock: ${error.message}`);
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

                addLog("Received iPhone offer and sent desktop answer.");
                return;
            }

            if (description.type === "answer") {
                if (!pc) {
                    addLog("No sender peer exists for answer.");
                    return;
                }

                await pc.setRemoteDescription(description);
                await flushPendingCandidates();

                addLog("Desktop answer accepted. Stream should connect now.");
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
            addLog("Start the iPhone camera first.");
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

            addLog("Sent iPhone WebRTC offer to desktop receiver.");
        } catch (error) {
            addLog(`Offer failed: ${error.message}`);
        } finally {
            makingOfferRef.current = false;
        }
    }, [addLog, createPeerConnection, sendSignal]);

    const startSenderWithStream = useCallback(async (stream, label) => {
        cleanupPeer(false);

        if (localStreamRef.current && localStreamRef.current !== stream) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        await clearSignalRoom({
            apiUrl: signalApiUrl || STREAM_SIGNAL_API_URL,
            room,
        });

        addLog("Cleared old room messages for a fresh connection.");

        localStreamRef.current = stream;
        setLocalActive(true);
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

            setRole("sender");
            roleRef.current = "sender";

            addLog(`Requesting ${facingMode === "user" ? "front" : "back"} camera and microphone...`);

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30, max: 30 },
                },
            });

            await startSenderWithStream(
                stream,
                facingMode === "user" ? "iPhone front camera" : "iPhone back camera"
            );

            addLog("Camera stream started.");
        } catch (error) {
            addLog(`Camera start failed: ${error.message}`);
        }
    }, [addLog, startSenderWithStream]);

    const stopEverything = useCallback(() => {
        cleanupPeer(true);
        closeSignal();

        clearSignalRoom({
            apiUrl: signalApiUrl || STREAM_SIGNAL_API_URL,
            room,
        });

        addLog("Stopped stream and cleared signaling room.");
    }, [addLog, cleanupPeer, closeSignal, room, signalApiUrl]);

    const startScreenCapture = useCallback(async (options = {}) => {
        const preferIphone = Boolean(options?.preferIphone || isIOS);
        const captureLabel = typeof options?.label === "string"
            ? options.label
            : preferIphone
                ? "iPhone screen + audio"
                : "screen capture + audio";

        try {
            if (!navigator.mediaDevices?.getDisplayMedia) {
                if (preferIphone) {
                    addLog(IPHONE_SCREEN_CAPTURE_LIMITATION);
                    addLog("Falling back to iPhone camera video with microphone audio so the desktop still receives live iPhone video/audio.");
                    await startCamera("environment");
                    return;
                }

                addLog("Screen capture is not available in this browser.");
                return;
            }

            setRole("sender");
            roleRef.current = "sender";

            addLog(
                preferIphone
                    ? "Requesting iPhone screen share with audio. If iOS shows a picker, choose the screen and enable audio when offered."
                    : "Requesting screen/window capture with audio..."
            );

            const screenStream = await getDisplayMediaWithAudio();

            if (!screenStream.getVideoTracks().length) {
                throw new Error("The browser did not return a screen video track.");
            }

            const screenAudioTracks = screenStream.getAudioTracks();
            let finalStream = screenStream;

            if (screenAudioTracks.length) {
                addLog(`Screen share returned ${screenAudioTracks.length} audio track(s).`);
            } else {
                addLog("No screen/system audio track was returned. Trying microphone audio as the iPhone audio fallback.");

                try {
                    const micStream = await getMicrophoneStream();

                    finalStream = mergeVideoWithFallbackAudio(screenStream, micStream);

                    addLog("Microphone audio fallback added to the screen share.");
                } catch (error) {
                    addLog(`Microphone fallback unavailable: ${error.message}`);
                    finalStream = screenStream;
                }
            }

            finalStream.getVideoTracks()[0]?.addEventListener("ended", () => {
                addLog("Screen capture ended.");
                stopEverything();
            });

            await startSenderWithStream(finalStream, captureLabel);

            addLog(
                `Screen share stream started with ${getTrackSummary(finalStream)}. Protected video may appear black or fail to capture.`
            );
        } catch (error) {
            addLog(`Screen capture failed: ${error.message}`);
        }
    }, [addLog, isIOS, startCamera, startSenderWithStream, stopEverything]);

    const connectReceiver = useCallback(async () => {
        try {
            cleanupPeer(false);

            setRole("receiver");
            roleRef.current = "receiver";

            await unlockReceiverPlayback();
            await connectSignal();
            createPeerConnection("receiver");

            addLog("Desktop receiver is armed. Now start the iPhone sender.");
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
            addLog("No active iPhone stream to reconnect. Start the iPhone Camera or iPhone Screen + Audio first.");
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
        await copyText(buildShareUrl(room, "sender"), "iPhone sender link");
    }, [copyText, room]);

    const copyReceiverLink = useCallback(async () => {
        await copyText(buildShareUrl(room, "receiver"), "desktop receiver link");
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
                                    One-tap iPhone camera, screen, and audio streaming.
                                </Typography>

                                <Typography
                                    sx={{
                                        maxWidth: 900,
                                        color: "rgba(255,255,255,0.72)",
                                        fontSize: { xs: 16, md: 19 },
                                        lineHeight: 1.75,
                                    }}
                                >
                                    Desktop opens as the receiver and waits. iPhone opens as the sender and can start
                                    the camera or try screen sharing with audio. Signaling goes through your Cloudflare
                                    Pages API, while WebRTC carries the live video and audio tracks.
                                </Typography>

                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    <Chip
                                        icon={<PhoneIphoneRounded />}
                                        label={isIOS ? "iOS detected" : "Desktop/browser detected"}
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
                                            iPhone screen/audio note
                                        </Typography>
                                    </Stack>

                                    <Typography sx={{ color: "rgba(255,255,255,0.68)", lineHeight: 1.7 }}>
                                        The iPhone sender always supports camera video with microphone audio when HTTPS
                                        permissions are granted. Full iPhone screen capture from a normal browser tab is
                                        limited by iOS browser support, so the Screen + Audio button tries it first and
                                        falls back to camera plus microphone when iOS does not expose screen capture.
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
                            iPhone Safari usually blocks camera and microphone on non-HTTPS pages.
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
                                        description="Start the desktop receiver first, then open the iPhone sender link."
                                    />

                                    <Stack spacing={1.5}>
                                        <EasyStep
                                            number={1}
                                            title="Desktop"
                                            description="Open the receiver link on your desktop. It auto-arms and waits."
                                        />
                                        <EasyStep
                                            number={2}
                                            title="iPhone"
                                            description="Open the sender link on your iPhone, then tap Camera or iPhone Screen + Audio."
                                        />
                                        <EasyStep
                                            number={3}
                                            title="Live"
                                            description="The desktop receives the iPhone video and audio through WebRTC."
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
                                            Copy iPhone Link
                                        </Button>

                                        <Button
                                            onClick={copyReceiverLink}
                                            startIcon={<ContentCopyRounded />}
                                            sx={softButtonSx}
                                        >
                                            Copy Desktop Link
                                        </Button>
                                    </Stack>

                                    <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <LinkRounded sx={{ color: "#9ee8ff" }} />
                                            <Typography sx={{ fontWeight: 950 }}>
                                                iPhone sender URL
                                            </Typography>
                                        </Stack>

                                        <Typography
                                            onClick={() => copyText(senderLink, "iPhone sender link")}
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
                                                Desktop receiver URL
                                            </Typography>
                                        </Stack>

                                        <Typography
                                            onClick={() => copyText(receiverLink, "desktop receiver link")}
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
                                        title={role === "sender" ? "iPhone sender controls" : "Desktop receiver controls"}
                                        description={
                                            role === "sender"
                                                ? "One tap starts the iPhone camera, microphone, signaling, and WebRTC offer."
                                                : "Receiver mode waits for the iPhone sender and auto-answers the WebRTC offer."
                                        }
                                    />

                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Button
                                            onClick={() => {
                                                setRole("receiver");
                                                roleRef.current = "receiver";
                                                addLog("Switched to desktop receiver mode.");
                                            }}
                                            startIcon={<DesktopWindowsRounded />}
                                            variant={role === "receiver" ? "contained" : "text"}
                                            sx={role === "receiver" ? primaryPillSx : softButtonSx}
                                        >
                                            Desktop Receiver
                                        </Button>

                                        <Button
                                            onClick={() => {
                                                setRole("sender");
                                                roleRef.current = "sender";
                                                addLog("Switched to iPhone sender mode.");
                                            }}
                                            startIcon={<PhoneIphoneRounded />}
                                            variant={role === "sender" ? "contained" : "text"}
                                            sx={role === "sender" ? primaryPillSx : softButtonSx}
                                        >
                                            iPhone Sender
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
                                                Start iPhone Camera + Mic
                                            </Button>

                                            <Tooltip
                                                title={
                                                    supportsDisplay
                                                        ? "Tries screen capture and sends returned screen/system audio, with microphone fallback when screen audio is unavailable."
                                                        : "On iPhone this falls back to camera plus microphone because iOS browsers do not expose full-device screen capture."
                                                }
                                            >
                                                <span>
                                                    <Button
                                                        disabled={!isSecure}
                                                        onClick={() => startScreenCapture({
                                                            preferIphone: true,
                                                            label: "iPhone screen + audio",
                                                        })}
                                                        startIcon={<ScreenShareRounded />}
                                                        variant="contained"
                                                        sx={{
                                                            ...primaryPillSx,
                                                            minHeight: 58,
                                                            fontSize: 17,
                                                            background: "linear-gradient(135deg, #b38cff, #9ee8ff)",
                                                        }}
                                                    >
                                                        iPhone Screen + Audio
                                                    </Button>
                                                </span>
                                            </Tooltip>

                                            {!isSecure && (
                                                <Typography sx={{ color: "#ffcf7a", lineHeight: 1.6, fontSize: 14 }}>
                                                    Screen sharing requires HTTPS or localhost. Use your Cloudflare Pages
                                                    HTTPS URL on the iPhone.
                                                </Typography>
                                            )}

                                            {!supportsDisplay && isIOS && isSecure && (
                                                <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.6, fontSize: 14 }}>
                                                    This iPhone browser does not expose full-device browser screen capture.
                                                    The button will fall back to camera video plus microphone audio so the
                                                    desktop still receives a live iPhone stream.
                                                </Typography>
                                            )}

                                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                                <Button
                                                    disabled={!supportsCamera}
                                                    onClick={() => startCamera("user")}
                                                    startIcon={<PhoneIphoneRounded />}
                                                    sx={softButtonSx}
                                                >
                                                    Use Front Camera
                                                </Button>

                                                <Tooltip title={supportsDisplay ? "Desktop screen/window/tab capture with supported audio" : "Screen capture is not exposed by this browser"}>
                                                    <span>
                                                        <Button
                                                            disabled={!supportsDisplay}
                                                            onClick={() => startScreenCapture({
                                                                preferIphone: false,
                                                                label: "screen capture + audio",
                                                            })}
                                                            startIcon={<ScreenShareRounded />}
                                                            sx={softButtonSx}
                                                        >
                                                            Desktop Screen + Audio
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
                                                On iPhone, Safari will ask for camera/microphone permission for camera mode.
                                                Full browser screen sharing also needs iOS support for the Screen Capture API.
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
                                                Start Desktop Receiver
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
                                                    Copy iPhone Link
                                                </Button>
                                            </Stack>

                                            <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>
                                                The receiver can be started first. Once the iPhone starts the camera,
                                                the desktop will answer and display the stream. If video appears without
                                                sound, click Enable Receiver Audio once.
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
                                title="iPhone sender preview"
                                icon={<PhoneIphoneRounded sx={{ color: "#9ee8ff" }} />}
                                videoRef={localVideoRef}
                                muted
                                placeholder={localActive ? "" : "Sender preview appears here"}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <VideoPanel
                                title="Desktop receiver live view"
                                icon={<DesktopWindowsRounded sx={{ color: "#b38cff" }} />}
                                videoRef={remoteVideoRef}
                                muted={false}
                                placeholder={remoteActive ? "" : "Received iPhone stream appears here"}
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
                                            title="Open desktop receiver"
                                            description="Use the desktop link. Receiver mode auto-starts when the URL has auto=1."
                                        />
                                        <EasyStep
                                            number={2}
                                            title="Open iPhone sender"
                                            description="Use the iPhone link. Tap Start iPhone Camera or iPhone Screen + Audio."
                                        />
                                        <EasyStep
                                            number={3}
                                            title="Fix connection quickly"
                                            description="Use Reconnect Stream or New Clean Room if stale signaling messages get in the way."
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
