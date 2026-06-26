import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    MenuItem,
    Paper,
    Slider,
    Stack,
    Switch,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    AddRounded,
    BrushRounded,
    ChevronLeftRounded,
    ChevronRightRounded,
    CloudUploadRounded,
    ContentCutRounded,
    DeleteRounded,
    DragIndicatorRounded,
    FileDownloadRounded,
    GraphicEqRounded,
    HomeRounded,
    KeyRounded,
    LayersRounded,
    LockOpenRounded,
    LockRounded,
    MovieCreationRounded,
    PauseRounded,
    PlayArrowRounded,
    RestartAltRounded,
    TextFieldsRounded,
    TimelineRounded,
    TuneRounded,
    VolumeUpRounded,
} from "@mui/icons-material";

export const primaryPillSx = {
    borderRadius: 999,
    px: 3,
    py: 1.25,
    fontWeight: 950,
    color: "#07111f",
    background: "linear-gradient(135deg, #9ee8ff, #b38cff)",
    boxShadow: "0 18px 50px rgba(158,232,255,0.22)",
    "&:hover": {
        background: "linear-gradient(135deg, #b8f0ff, #c7a8ff)",
        boxShadow: "0 22px 60px rgba(179,140,255,0.28)",
    },
};

const panelBorder = "1px solid rgba(255,255,255,0.1)";
const MIN_CLIP_LENGTH = 0.12;

const VISUAL_NEUTRAL = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    hue: 0,
    opacity: 100,
    sharpen: 0,
    noise: 0,
    vignette: 0,
};

const AUDIO_NEUTRAL = {
    gain: 100,
    pan: 0,
    bass: 0,
    treble: 0,
    lowpass: 22050,
    highpass: 0,
    delayMix: 0,
    delayTime: 0.24,
    feedback: 0,
};

const DEFAULT_BRUSH = {
    color: "#9ee8ff",
    size: 18,
    opacity: 88,
    smoothing: 0.35,
    usePressure: true,
    revealOverTime: false,
    fadeIn: 0,
    fadeOut: 0,
};

const VISUAL_PARAMS = [
    { key: "brightness", label: "Brightness", min: 0, max: 250, step: 1, unit: "%", neutral: 100 },
    { key: "contrast", label: "Contrast", min: 0, max: 250, step: 1, unit: "%", neutral: 100 },
    { key: "saturation", label: "Saturation", min: 0, max: 300, step: 1, unit: "%", neutral: 100 },
    { key: "blur", label: "Blur", min: 0, max: 40, step: 0.25, unit: "px", neutral: 0 },
    { key: "grayscale", label: "Grayscale", min: 0, max: 100, step: 1, unit: "%", neutral: 0 },
    { key: "sepia", label: "Sepia", min: 0, max: 100, step: 1, unit: "%", neutral: 0 },
    { key: "hue", label: "Hue Rotate", min: -180, max: 180, step: 1, unit: "°", neutral: 0 },
    { key: "opacity", label: "Opacity", min: 0, max: 100, step: 1, unit: "%", neutral: 100 },
    { key: "sharpen", label: "Sharpen", min: 0, max: 100, step: 1, unit: "%", neutral: 0 },
    { key: "noise", label: "Noise", min: 0, max: 100, step: 1, unit: "%", neutral: 0 },
    { key: "vignette", label: "Vignette", min: 0, max: 100, step: 1, unit: "%", neutral: 0 },
];

const AUDIO_PARAMS = [
    { key: "gain", label: "Gain", min: 0, max: 200, step: 1, unit: "%", neutral: 100 },
    { key: "pan", label: "Pan", min: -100, max: 100, step: 1, unit: "", neutral: 0 },
    { key: "bass", label: "Bass Shelf", min: -30, max: 30, step: 1, unit: "dB", neutral: 0 },
    { key: "treble", label: "Treble Shelf", min: -30, max: 30, step: 1, unit: "dB", neutral: 0 },
    { key: "lowpass", label: "Lowpass", min: 250, max: 22050, step: 25, unit: "Hz", neutral: 22050 },
    { key: "highpass", label: "Highpass", min: 0, max: 9000, step: 25, unit: "Hz", neutral: 0 },
    { key: "delayMix", label: "Delay Mix", min: 0, max: 100, step: 1, unit: "%", neutral: 0 },
    { key: "delayTime", label: "Delay Time", min: 0.02, max: 1.2, step: 0.01, unit: "s", neutral: 0.24 },
    { key: "feedback", label: "Feedback", min: 0, max: 90, step: 1, unit: "%", neutral: 0 },
];

const VISUAL_PRESETS = {
    clean: {
        label: "Clean",
        values: { ...VISUAL_NEUTRAL },
    },
    cinematic: {
        label: "Cinematic",
        values: {
            ...VISUAL_NEUTRAL,
            brightness: 96,
            contrast: 126,
            saturation: 88,
            sepia: 10,
            hue: -4,
            sharpen: 12,
            vignette: 38,
        },
    },
    flash: {
        label: "Flash",
        values: {
            ...VISUAL_NEUTRAL,
            brightness: 165,
            contrast: 120,
            saturation: 115,
        },
    },
    dream: {
        label: "Dream Blur",
        values: {
            ...VISUAL_NEUTRAL,
            brightness: 112,
            contrast: 92,
            saturation: 132,
            blur: 5,
            sepia: 6,
            hue: 8,
            vignette: 18,
        },
    },
    vintage: {
        label: "Vintage",
        values: {
            ...VISUAL_NEUTRAL,
            brightness: 104,
            contrast: 112,
            saturation: 78,
            grayscale: 8,
            sepia: 42,
            hue: -8,
            sharpen: 5,
            noise: 18,
            vignette: 28,
        },
    },
    fadeOut: {
        label: "Fade Out",
        values: {
            ...VISUAL_NEUTRAL,
            opacity: 0,
        },
    },
};

const AUDIO_PRESETS = {
    normal: {
        label: "Normal",
        values: { ...AUDIO_NEUTRAL },
    },
    fadeDown: {
        label: "Fade Down",
        values: {
            ...AUDIO_NEUTRAL,
            gain: 0,
        },
    },
    bassBoost: {
        label: "Bass Boost",
        values: {
            ...AUDIO_NEUTRAL,
            gain: 110,
            bass: 12,
            treble: 2,
        },
    },
    phone: {
        label: "Phone Voice",
        values: {
            ...AUDIO_NEUTRAL,
            gain: 105,
            lowpass: 3600,
            highpass: 500,
            bass: -10,
            treble: 7,
        },
    },
    echo: {
        label: "Echo",
        values: {
            ...AUDIO_NEUTRAL,
            delayMix: 42,
            delayTime: 0.34,
            feedback: 38,
        },
    },
    panLeft: {
        label: "Pan Left",
        values: {
            ...AUDIO_NEUTRAL,
            pan: -70,
        },
    },
    panRight: {
        label: "Pan Right",
        values: {
            ...AUDIO_NEUTRAL,
            pan: 70,
        },
    },
};

function makeId(prefix) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function snapTime(value, snapEnabled, snapStep) {
    if (!snapEnabled) {
        return value;
    }

    return Math.round(value / snapStep) * snapStep;
}

function formatTime(value) {
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
    const minutes = Math.floor(safe / 60);
    const seconds = Math.floor(safe % 60);
    const tenths = Math.floor((safe % 1) * 10);

    return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function sortKeyframes(keyframes) {
    return [...(keyframes || [])].sort((a, b) => a.time - b.time);
}

function interpolateValues(paramDefs, neutral, a, b, amount) {
    const output = { ...neutral };

    paramDefs.forEach((param) => {
        output[param.key] = lerp(
            Number(a?.[param.key] ?? param.neutral),
            Number(b?.[param.key] ?? param.neutral),
            amount
        );
    });

    return output;
}

function evaluateKeyframes(paramDefs, neutral, keyframes, time) {
    const sorted = sortKeyframes(keyframes);

    if (!sorted.length) {
        return { ...neutral };
    }

    if (time <= sorted[0].time) {
        return { ...neutral, ...sorted[0].values };
    }

    if (time >= sorted[sorted.length - 1].time) {
        return { ...neutral, ...sorted[sorted.length - 1].values };
    }

    for (let index = 0; index < sorted.length - 1; index += 1) {
        const current = sorted[index];
        const next = sorted[index + 1];

        if (time >= current.time && time <= next.time) {
            const span = Math.max(0.001, next.time - current.time);
            const amount = clamp((time - current.time) / span, 0, 1);

            return interpolateValues(paramDefs, neutral, current.values, next.values, amount);
        }
    }

    return { ...neutral };
}

function combineVisualClips(clips, time) {
    const combined = { ...VISUAL_NEUTRAL };

    clips
        .filter((clip) => clip.enabled !== false)
        .filter((clip) => time >= clip.start && time <= clip.end)
        .forEach((clip) => {
            const values = evaluateKeyframes(VISUAL_PARAMS, VISUAL_NEUTRAL, clip.keyframes, time);

            combined.brightness += values.brightness - 100;
            combined.contrast += values.contrast - 100;
            combined.saturation += values.saturation - 100;
            combined.blur += values.blur;
            combined.grayscale = Math.max(combined.grayscale, values.grayscale);
            combined.sepia = Math.max(combined.sepia, values.sepia);
            combined.hue += values.hue;
            combined.opacity = Math.min(combined.opacity, values.opacity);
            combined.sharpen = Math.max(combined.sharpen, values.sharpen);
            combined.noise = Math.max(combined.noise, values.noise);
            combined.vignette = Math.max(combined.vignette, values.vignette);
        });

    return {
        brightness: clamp(combined.brightness, 0, 250),
        contrast: clamp(combined.contrast, 0, 250),
        saturation: clamp(combined.saturation, 0, 300),
        blur: clamp(combined.blur, 0, 40),
        grayscale: clamp(combined.grayscale, 0, 100),
        sepia: clamp(combined.sepia, 0, 100),
        hue: clamp(combined.hue, -180, 180),
        opacity: clamp(combined.opacity, 0, 100),
        sharpen: clamp(combined.sharpen, 0, 100),
        noise: clamp(combined.noise, 0, 100),
        vignette: clamp(combined.vignette, 0, 100),
    };
}

function combineAudioClips(clips, time) {
    const combined = { ...AUDIO_NEUTRAL };

    clips
        .filter((clip) => clip.enabled !== false)
        .filter((clip) => time >= clip.start && time <= clip.end)
        .forEach((clip) => {
            const values = evaluateKeyframes(AUDIO_PARAMS, AUDIO_NEUTRAL, clip.keyframes, time);

            combined.gain += values.gain - 100;
            combined.pan += values.pan;
            combined.bass += values.bass;
            combined.treble += values.treble;
            combined.lowpass = Math.min(combined.lowpass, values.lowpass);
            combined.highpass = Math.max(combined.highpass, values.highpass);
            combined.delayMix = Math.max(combined.delayMix, values.delayMix);
            combined.delayTime = values.delayMix > 0 ? values.delayTime : combined.delayTime;
            combined.feedback = Math.max(combined.feedback, values.feedback);
        });

    return {
        gain: clamp(combined.gain, 0, 200),
        pan: clamp(combined.pan, -100, 100),
        bass: clamp(combined.bass, -30, 30),
        treble: clamp(combined.treble, -30, 30),
        lowpass: clamp(combined.lowpass, 250, 22050),
        highpass: clamp(combined.highpass, 0, 9000),
        delayMix: clamp(combined.delayMix, 0, 100),
        delayTime: clamp(combined.delayTime, 0.02, 1.2),
        feedback: clamp(combined.feedback, 0, 90),
    };
}

function filterString(values) {
    return [
        `brightness(${values.brightness}%)`,
        `contrast(${values.contrast}%)`,
        `saturate(${values.saturation}%)`,
        `blur(${values.blur}px)`,
        `grayscale(${values.grayscale}%)`,
        `sepia(${values.sepia}%)`,
        `hue-rotate(${values.hue}deg)`,
        `opacity(${values.opacity}%)`,
    ].join(" ");
}

function hexToRgba(hex, alphaValue) {
    const cleaned = String(hex || "#ffffff").replace("#", "");
    const normalized = cleaned.length === 3
        ? cleaned.split("").map((char) => char + char).join("")
        : cleaned;

    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alphaValue})`;
}

function drawVignette(ctx, width, height, amount) {
    if (!amount) {
        return;
    }

    const strength = clamp(amount / 100, 0, 1);
    const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.25,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.72
    );

    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${0.72 * strength})`);

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

function drawNoise(ctx, width, height, amount) {
    if (!amount) {
        return;
    }

    const strength = clamp(amount / 100, 0, 1);
    const count = Math.floor(width * height * 0.0012 * strength);

    ctx.save();
    ctx.globalAlpha = 0.18 * strength;

    for (let index = 0; index < count; index += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const shade = Math.random() > 0.5 ? 255 : 0;

        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(x, y, 1, 1);
    }

    ctx.restore();
}

function drawSharpen(ctx, width, height, amount) {
    if (!amount) {
        return;
    }

    const strength = clamp(amount / 100, 0, 1);

    ctx.save();
    ctx.globalAlpha = 0.18 * strength;
    ctx.globalCompositeOperation = "overlay";
    ctx.filter = "contrast(160%) saturate(115%)";
    ctx.drawImage(ctx.canvas, 0, 0, width, height);
    ctx.restore();
}

function clipFadeAmount(clip, time) {
    let alphaAmount = 1;

    if (clip.brush?.fadeIn > 0) {
        const fadeInEnd = clip.start + clip.brush.fadeIn;
        if (time < fadeInEnd) {
            alphaAmount = Math.min(alphaAmount, clamp((time - clip.start) / clip.brush.fadeIn, 0, 1));
        }
    }

    if (clip.brush?.fadeOut > 0) {
        const fadeOutStart = clip.end - clip.brush.fadeOut;
        if (time > fadeOutStart) {
            alphaAmount = Math.min(alphaAmount, clamp((clip.end - time) / clip.brush.fadeOut, 0, 1));
        }
    }

    return alphaAmount;
}

function drawDrawingClips(ctx, drawingClips, time, width, height) {
    drawingClips
        .filter((clip) => clip.enabled !== false)
        .filter((clip) => time >= clip.start && time <= clip.end)
        .forEach((clip) => {
            const brush = { ...DEFAULT_BRUSH, ...clip.brush };
            const localTime = time - clip.start;
            const opacity = clamp((brush.opacity / 100) * clipFadeAmount(clip, time), 0, 1);

            ctx.save();
            ctx.globalCompositeOperation = clip.blendMode || "source-over";
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            clip.strokes.forEach((stroke) => {
                const sourcePoints = brush.revealOverTime
                    ? stroke.points.filter((point) => point.t <= localTime)
                    : stroke.points;

                if (!sourcePoints.length) {
                    return;
                }

                if (sourcePoints.length === 1) {
                    const point = sourcePoints[0];
                    const pressure = brush.usePressure ? clamp(point.pressure || 0.5, 0.12, 1) : 1;
                    const radius = (brush.size * pressure) / 2;

                    ctx.fillStyle = hexToRgba(stroke.color || brush.color, opacity);
                    ctx.beginPath();
                    ctx.arc((point.x / 100) * width, (point.y / 100) * height, radius, 0, Math.PI * 2);
                    ctx.fill();
                    return;
                }

                for (let index = 1; index < sourcePoints.length; index += 1) {
                    const previous = sourcePoints[index - 1];
                    const current = sourcePoints[index];

                    const previousPressure = brush.usePressure ? clamp(previous.pressure || 0.5, 0.12, 1) : 1;
                    const currentPressure = brush.usePressure ? clamp(current.pressure || 0.5, 0.12, 1) : 1;
                    const lineWidth = brush.size * ((previousPressure + currentPressure) / 2);

                    ctx.strokeStyle = hexToRgba(stroke.color || brush.color, opacity);
                    ctx.lineWidth = Math.max(1, lineWidth);
                    ctx.beginPath();
                    ctx.moveTo((previous.x / 100) * width, (previous.y / 100) * height);
                    ctx.lineTo((current.x / 100) * width, (current.y / 100) * height);
                    ctx.stroke();
                }
            });

            ctx.restore();
        });
}

function drawTextBox(ctx, box, canvasWidth, canvasHeight) {
    const x = (box.x / 100) * canvasWidth;
    const y = (box.y / 100) * canvasHeight;
    const lines = String(box.text || "").split("\n");
    const fontSize = Number(box.fontSize) || 48;
    const lineHeight = fontSize * 1.18;
    const totalHeight = (lines.length - 1) * lineHeight;

    ctx.save();
    ctx.font = `${box.fontWeight || 900} ${fontSize}px Inter, Arial, sans-serif`;
    ctx.fillStyle = box.color || "#ffffff";
    ctx.textAlign = box.align || "center";
    ctx.textBaseline = "middle";

    if (box.shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.72)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
    }

    lines.forEach((line, index) => {
        ctx.fillText(line, x, y - totalHeight / 2 + index * lineHeight);
    });

    ctx.restore();
}

export function GradientPage({ children }) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                color: "white",
                background:
                    "radial-gradient(circle at top left, rgba(158,232,255,0.16), transparent 35%), radial-gradient(circle at 80% 10%, rgba(179,140,255,0.16), transparent 32%), linear-gradient(135deg, #050711 0%, #080b17 45%, #070814 100%)",
            }}
        >
            {children}
        </Box>
    );
}

export function GlassCard({ children, sx }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 5,
                backgroundColor: "rgba(255,255,255,0.065)",
                border: panelBorder,
                boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
                backdropFilter: "blur(18px)",
                ...sx,
            }}
        >
            {children}
        </Paper>
    );
}

export function AppNavBar() {
    const location = useLocation();

    const navItems = [
        {
            label: "Home",
            path: "/",
            icon: <HomeRounded fontSize="small" />,
        },
        {
            label: "Video Editor",
            path: "/video",
            icon: <MovieCreationRounded fontSize="small" />,
        },
    ];

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                backgroundColor: "rgba(5,7,17,0.72)",
                borderBottom: panelBorder,
                backdropFilter: "blur(18px)",
            }}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ minHeight: 72 }}>
                    <Stack
                        component={RouterLink}
                        to="/"
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                        sx={{
                            color: "white",
                            textDecoration: "none",
                            mr: "auto",
                        }}
                    >
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 3,
                                display: "grid",
                                placeItems: "center",
                                color: "#06101d",
                                background: "linear-gradient(135deg, #9ee8ff, #b38cff)",
                                boxShadow: "0 14px 45px rgba(158,232,255,0.22)",
                            }}
                        >
                            <MovieCreationRounded />
                        </Box>

                        <Box>
                            <Typography sx={{ fontWeight: 950, lineHeight: 1 }}>
                                ClipMaster Lab
                            </Typography>
                            <Typography
                                sx={{
                                    color: "rgba(255,255,255,0.56)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                Canvas Timeline Editor
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        {navItems.map((item) => {
                            const active = location.pathname === item.path;

                            return (
                                <Button
                                    key={item.path}
                                    component={RouterLink}
                                    to={item.path}
                                    startIcon={item.icon}
                                    sx={{
                                        display: {
                                            xs: item.path === "/" ? "none" : "inline-flex",
                                            sm: "inline-flex",
                                        },
                                        borderRadius: 999,
                                        px: 2,
                                        color: active ? "#07111f" : "rgba(255,255,255,0.78)",
                                        fontWeight: 900,
                                        background: active
                                            ? "linear-gradient(135deg, #9ee8ff, #b38cff)"
                                            : "rgba(255,255,255,0.055)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        "&:hover": {
                                            background: active
                                                ? "linear-gradient(135deg, #b8f0ff, #c7a8ff)"
                                                : "rgba(255,255,255,0.09)",
                                        },
                                    }}
                                >
                                    {item.label}
                                </Button>
                            );
                        })}
                    </Stack>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export function PageHero({ eyebrow, title, description, actions }) {
    return (
        <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
                <Stack spacing={2.25}>
                    <Chip
                        label={eyebrow}
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
                            maxWidth: 980,
                            fontWeight: 1000,
                            letterSpacing: -2.5,
                            lineHeight: 0.95,
                            fontSize: {
                                xs: "2.6rem",
                                sm: "4rem",
                                md: "5.5rem",
                            },
                        }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        sx={{
                            maxWidth: 780,
                            color: "rgba(255,255,255,0.72)",
                            fontSize: { xs: 17, md: 20 },
                            lineHeight: 1.75,
                        }}
                    >
                        {description}
                    </Typography>

                    {actions}
                </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
                <GlassCard
                    sx={{
                        minHeight: 320,
                        overflow: "hidden",
                        position: "relative",
                        background:
                            "linear-gradient(145deg, rgba(158,232,255,0.12), rgba(179,140,255,0.08))",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 22,
                            borderRadius: 5,
                            border: "1px solid rgba(255,255,255,0.16)",
                            background:
                                "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
                        }}
                    />

                    <Box
                        sx={{
                            position: "absolute",
                            top: 52,
                            left: 48,
                            right: 48,
                            aspectRatio: "16 / 9",
                            borderRadius: 4,
                            background:
                                "radial-gradient(circle at 25% 35%, rgba(158,232,255,0.42), transparent 25%), radial-gradient(circle at 70% 45%, rgba(179,140,255,0.35), transparent 28%), rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        <MovieCreationRounded sx={{ fontSize: 70, color: "rgba(255,255,255,0.8)" }} />
                    </Box>

                    <Box
                        sx={{
                            position: "absolute",
                            left: 36,
                            right: 36,
                            bottom: 42,
                            height: 92,
                            borderRadius: 4,
                            backgroundColor: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            px: 2,
                            py: 1.5,
                        }}
                    >
                        <Box
                            sx={{
                                position: "relative",
                                height: 16,
                                mb: 1.5,
                                borderRadius: 999,
                                backgroundColor: "rgba(255,255,255,0.09)",
                            }}
                        >
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: "18%",
                                    width: "46%",
                                    height: "100%",
                                    borderRadius: 999,
                                    background: "linear-gradient(135deg, #9ee8ff, #b38cff)",
                                }}
                            />
                            {[18, 42, 64].map((left) => (
                                <Box
                                    key={left}
                                    sx={{
                                        position: "absolute",
                                        left: `${left}%`,
                                        top: -5,
                                        width: 10,
                                        height: 26,
                                        transform: "rotate(45deg)",
                                        borderRadius: 1,
                                        backgroundColor: "#fff",
                                    }}
                                />
                            ))}
                        </Box>

                        <Stack direction="row" spacing={1}>
                            {[34, 52, 70].map((width, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        width: `${width}px`,
                                        height: 18,
                                        borderRadius: 999,
                                        backgroundColor:
                                            index === 1
                                                ? "rgba(179,140,255,0.5)"
                                                : "rgba(158,232,255,0.45)",
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>
                </GlassCard>
            </Grid>
        </Grid>
    );
}

export function SectionHeader({ eyebrow, title, description, compact = false }) {
    return (
        <Stack spacing={1} sx={{ mb: compact ? 2.5 : 3.5 }}>
            {eyebrow && (
                <Typography
                    variant="overline"
                    sx={{
                        color: "#9ee8ff",
                        fontWeight: 950,
                        letterSpacing: 1.5,
                    }}
                >
                    {eyebrow}
                </Typography>
            )}

            <Typography
                variant={compact ? "h4" : "h3"}
                sx={{
                    fontWeight: 1000,
                    letterSpacing: -0.8,
                }}
            >
                {title}
            </Typography>

            {description && (
                <Typography
                    sx={{
                        maxWidth: 900,
                        color: "rgba(255,255,255,0.68)",
                        fontSize: compact ? 16 : 18,
                        lineHeight: 1.7,
                    }}
                >
                    {description}
                </Typography>
            )}
        </Stack>
    );
}

export function FeatureCard({ icon, title, description }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 5,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: panelBorder,
                color: "white",
                backdropFilter: "blur(18px)",
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                    <Box
                        sx={{
                            width: 54,
                            height: 54,
                            borderRadius: 4,
                            display: "grid",
                            placeItems: "center",
                            color: "#07111f",
                            background: "linear-gradient(135deg, #9ee8ff, #b38cff)",
                        }}
                    >
                        {icon}
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 950 }}>
                        {title}
                    </Typography>

                    <Typography sx={{ color: "rgba(255,255,255,0.66)", lineHeight: 1.75 }}>
                        {description}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

function SupportChip({ good, label }) {
    return (
        <Chip
            label={label}
            sx={{
                color: good ? "#9ee8ff" : "#ffb4b4",
                fontWeight: 850,
                backgroundColor: good ? "rgba(158,232,255,0.1)" : "rgba(255,100,100,0.1)",
                border: good ? "1px solid rgba(158,232,255,0.25)" : "1px solid rgba(255,100,100,0.22)",
            }}
        />
    );
}

function EditorSlider({ label, value, min, max, step, display, color = "#9ee8ff", onChange }) {
    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
                    {label}
                </Typography>
                <Typography sx={{ color, fontWeight: 950, fontSize: 13 }}>
                    {display}
                </Typography>
            </Stack>

            <Slider
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(_, nextValue) => onChange(Number(nextValue))}
                sx={{
                    color,
                    "& .MuiSlider-thumb": {
                        width: 16,
                        height: 16,
                    },
                }}
            />
        </Box>
    );
}

const smallTextFieldSx = {
    "& label": {
        color: "rgba(255,255,255,0.62)",
    },
    "& label.Mui-focused": {
        color: "#9ee8ff",
    },
    "& .MuiOutlinedInput-root": {
        color: "white",
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.055)",
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.12)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(158,232,255,0.45)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#9ee8ff",
        },
    },
};

const miniControlSx = {
    borderRadius: 999,
    color: "white",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
    "&:hover": {
        backgroundColor: "rgba(255,255,255,0.08)",
    },
};

function TransportControls({
                               videoUrl,
                               isPlaying,
                               isExporting,
                               duration,
                               currentTime,
                               trimStart,
                               trimEnd,
                               onPlayPause,
                               onRestart,
                               onSeek,
                               onTrimStartChange,
                               onTrimEndChange,
                           }) {
    return (
        <GlassCard sx={{ p: 1.5, backgroundColor: "rgba(0,0,0,0.18)" }}>
            <Stack spacing={1.25}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.25}
                    alignItems={{ xs: "stretch", md: "center" }}
                >
                    <Stack direction="row" spacing={1}>
                        <Button
                            disabled={!videoUrl || isExporting}
                            onClick={onPlayPause}
                            startIcon={isPlaying ? <PauseRounded /> : <PlayArrowRounded />}
                            variant="contained"
                            sx={primaryPillSx}
                        >
                            {isPlaying ? "Pause" : "Play"}
                        </Button>

                        <Button
                            disabled={!videoUrl || isExporting}
                            onClick={onRestart}
                            startIcon={<RestartAltRounded />}
                            sx={miniControlSx}
                        >
                            Restart
                        </Button>
                    </Stack>

                    <Box sx={{ flex: 1 }}>
                        <Slider
                            disabled={!videoUrl || isExporting}
                            min={trimStart}
                            max={trimEnd || duration || 1}
                            value={clamp(currentTime, trimStart, trimEnd || duration || 1)}
                            step={0.01}
                            onChange={(_, value) => onSeek(Number(value))}
                            sx={{
                                color: "#9ee8ff",
                                "& .MuiSlider-thumb": {
                                    boxShadow: "0 0 0 8px rgba(158,232,255,0.12)",
                                },
                            }}
                        />
                    </Box>

                    <Typography sx={{ minWidth: 145, fontWeight: 900, color: "rgba(255,255,255,0.78)" }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </Typography>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                    <TextField
                        label="Trim Start"
                        type="number"
                        size="small"
                        value={Number(trimStart.toFixed(2))}
                        onChange={(event) => onTrimStartChange(Number(event.target.value))}
                        inputProps={{ min: 0, max: trimEnd, step: 0.05 }}
                        sx={smallTextFieldSx}
                    />
                    <TextField
                        label="Trim End"
                        type="number"
                        size="small"
                        value={Number(trimEnd.toFixed(2))}
                        onChange={(event) => onTrimEndChange(Number(event.target.value))}
                        inputProps={{ min: trimStart, max: duration, step: 0.05 }}
                        sx={smallTextFieldSx}
                    />
                    <Typography sx={{ color: "rgba(255,255,255,0.52)", alignSelf: "center", fontSize: 13 }}>
                        Drag boxes in the timeline to move clips. Use left/right handles to resize them.
                    </Typography>
                </Stack>
            </Stack>
        </GlassCard>
    );
}

function TimelineView({
                          duration,
                          currentTime,
                          trimStart,
                          trimEnd,
                          visualClips,
                          audioClips,
                          drawingClips,
                          selectedKind,
                          selectedClipId,
                          selectedKeyframeId,
                          snapEnabled,
                          snapStep,
                          zoom,
                          markers,
                          onSeek,
                          onSelectClip,
                          onSelectKeyframe,
                          onUpdateClipTiming,
                          onUpdateKeyframeTime,
                          onDeleteMarker,
                      }) {
    const safeDuration = Math.max(duration || 0, 0.01);
    const timelineWidthPercent = Math.max(100, zoom * 100);
    const playheadLeft = clamp((currentTime / safeDuration) * timelineWidthPercent, 0, timelineWidthPercent);
    const trimStartLeft = clamp((trimStart / safeDuration) * timelineWidthPercent, 0, timelineWidthPercent);
    const trimEndLeft = clamp((trimEnd / safeDuration) * timelineWidthPercent, 0, timelineWidthPercent);

    const tracks = [
        {
            kind: "visual",
            label: "Video FX",
            icon: <TuneRounded fontSize="small" />,
            color: "#9ee8ff",
            clips: visualClips,
        },
        {
            kind: "audio",
            label: "Audio FX",
            icon: <GraphicEqRounded fontSize="small" />,
            color: "#7ef4b6",
            clips: audioClips,
        },
        {
            kind: "draw",
            label: "Drawing",
            icon: <BrushRounded fontSize="small" />,
            color: "#b38cff",
            clips: drawingClips,
        },
    ];

    const beginClipDrag = (event, kind, clip, mode) => {
        event.preventDefault();
        event.stopPropagation();

        if (clip.locked) {
            return;
        }

        const track = event.currentTarget.closest("[data-timeline-track='true']");
        if (!track || !duration) {
            return;
        }

        onSelectClip(kind, clip.id);

        const rect = track.getBoundingClientRect();
        const startX = event.clientX;
        const originalStart = clip.start;
        const originalEnd = clip.end;
        const originalLength = originalEnd - originalStart;

        const onMove = (moveEvent) => {
            const deltaSeconds = ((moveEvent.clientX - startX) / rect.width) * duration * zoom;
            let nextStart = originalStart;
            let nextEnd = originalEnd;
            let shiftDelta = 0;

            if (mode === "move") {
                nextStart = clamp(
                    snapTime(originalStart + deltaSeconds, snapEnabled, snapStep),
                    trimStart,
                    Math.max(trimStart, trimEnd - originalLength)
                );
                nextEnd = nextStart + originalLength;
                shiftDelta = nextStart - originalStart;
            }

            if (mode === "start") {
                nextStart = clamp(
                    snapTime(originalStart + deltaSeconds, snapEnabled, snapStep),
                    trimStart,
                    originalEnd - MIN_CLIP_LENGTH
                );
            }

            if (mode === "end") {
                nextEnd = clamp(
                    snapTime(originalEnd + deltaSeconds, snapEnabled, snapStep),
                    originalStart + MIN_CLIP_LENGTH,
                    trimEnd
                );
            }

            onUpdateClipTiming(kind, clip.id, nextStart, nextEnd, { shiftDelta });
        };

        const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    const beginKeyframeDrag = (event, kind, clip, keyframe) => {
        event.preventDefault();
        event.stopPropagation();

        if (clip.locked) {
            return;
        }

        const track = event.currentTarget.closest("[data-timeline-track='true']");
        if (!track || !duration) {
            return;
        }

        onSelectClip(kind, clip.id);
        onSelectKeyframe(keyframe.id);

        const rect = track.getBoundingClientRect();
        const startX = event.clientX;
        const originalTime = keyframe.time;

        const onMove = (moveEvent) => {
            const deltaSeconds = ((moveEvent.clientX - startX) / rect.width) * duration * zoom;
            const nextTime = clamp(
                snapTime(originalTime + deltaSeconds, snapEnabled, snapStep),
                clip.start,
                clip.end
            );

            onUpdateKeyframeTime(kind, clip.id, keyframe.id, nextTime);
        };

        const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    const handleTrackSeek = (event) => {
        if (!duration) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const nextTime = clamp(((event.clientX - rect.left) / rect.width) * duration * zoom, trimStart, trimEnd);

        onSeek(nextTime);
    };

    return (
        <GlassCard sx={{ p: 1.5, backgroundColor: "rgba(0,0,0,0.2)" }}>
            <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TimelineRounded sx={{ color: "#9ee8ff" }} />
                        <Typography sx={{ fontWeight: 950 }}>
                            Timeline Clips
                        </Typography>
                    </Stack>

                    <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: 13 }}>
                        Move center. Resize with arrows. Drag keyframe diamonds.
                    </Typography>
                </Stack>

                <Box sx={{ overflowX: "auto", pb: 1 }}>
                    <Box
                        sx={{
                            minWidth: `${timelineWidthPercent}%`,
                            display: "grid",
                            gridTemplateColumns: { xs: "92px 1fr", sm: "120px 1fr" },
                            gap: 1,
                            position: "relative",
                        }}
                    >
                        <Box />

                        <Box
                            onPointerDown={handleTrackSeek}
                            sx={{
                                position: "relative",
                                height: 34,
                                borderRadius: 2.5,
                                backgroundColor: "rgba(255,255,255,0.055)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                overflow: "hidden",
                                cursor: "pointer",
                            }}
                        >
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: `${trimStartLeft / timelineWidthPercent * 100}%`,
                                    width: `${Math.max(0, trimEndLeft - trimStartLeft) / timelineWidthPercent * 100}%`,
                                    backgroundColor: "rgba(158,232,255,0.08)",
                                }}
                            />

                            {[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((amount) => (
                                <Box
                                    key={amount}
                                    sx={{
                                        position: "absolute",
                                        left: `${amount * 100}%`,
                                        top: 0,
                                        bottom: 0,
                                        borderLeft: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            ml: 0.75,
                                            mt: 0.65,
                                            color: "rgba(255,255,255,0.5)",
                                            fontSize: 11,
                                            fontWeight: 800,
                                        }}
                                    >
                                        {formatTime(duration * amount)}
                                    </Typography>
                                </Box>
                            ))}

                            {markers.map((marker) => {
                                const left = clamp((marker.time / safeDuration) * 100, 0, 100);

                                return (
                                    <Tooltip key={marker.id} title={`${marker.label} ${formatTime(marker.time)}`}>
                                        <Box
                                            onPointerDown={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                onSeek(marker.time);
                                            }}
                                            onDoubleClick={() => onDeleteMarker(marker.id)}
                                            sx={{
                                                position: "absolute",
                                                left: `${left}%`,
                                                top: 3,
                                                width: 10,
                                                height: 28,
                                                borderRadius: 1,
                                                background: "linear-gradient(180deg, #ffffff, #ffc76b)",
                                                boxShadow: "0 0 15px rgba(255,199,107,0.45)",
                                                cursor: "pointer",
                                            }}
                                        />
                                    </Tooltip>
                                );
                            })}
                        </Box>

                        {tracks.map((track) => (
                            <React.Fragment key={track.kind}>
                                <Stack
                                    direction="row"
                                    spacing={0.75}
                                    alignItems="center"
                                    sx={{
                                        minHeight: 58,
                                        px: 1,
                                        borderRadius: 3,
                                        backgroundColor: "rgba(255,255,255,0.045)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                    }}
                                >
                                    <Box sx={{ color: track.color, display: "flex" }}>
                                        {track.icon}
                                    </Box>
                                    <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                                        {track.label}
                                    </Typography>
                                </Stack>

                                <Box
                                    data-timeline-track="true"
                                    onPointerDown={handleTrackSeek}
                                    sx={{
                                        position: "relative",
                                        minHeight: 58,
                                        borderRadius: 3,
                                        backgroundColor: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        overflow: "hidden",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 0,
                                            bottom: 0,
                                            left: `${trimStartLeft / timelineWidthPercent * 100}%`,
                                            width: `${Math.max(0, trimEndLeft - trimStartLeft) / timelineWidthPercent * 100}%`,
                                            backgroundColor: "rgba(255,255,255,0.035)",
                                        }}
                                    />

                                    {track.clips.map((clip) => {
                                        const left = clamp((clip.start / safeDuration) * 100, 0, 100);
                                        const width = clamp(((clip.end - clip.start) / safeDuration) * 100, 0, 100);
                                        const selected = selectedKind === track.kind && selectedClipId === clip.id;

                                        return (
                                            <Box
                                                key={clip.id}
                                                onPointerDown={(event) => beginClipDrag(event, track.kind, clip, "move")}
                                                sx={{
                                                    position: "absolute",
                                                    top: 7,
                                                    bottom: 7,
                                                    left: `${left}%`,
                                                    width: `${Math.max(width, 1.25)}%`,
                                                    minWidth: 48,
                                                    borderRadius: 2.4,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    overflow: "hidden",
                                                    cursor: clip.locked ? "not-allowed" : "grab",
                                                    color: "#07111f",
                                                    opacity: clip.enabled === false ? 0.46 : 1,
                                                    background: selected
                                                        ? `linear-gradient(135deg, ${track.color}, #ffffff)`
                                                        : `linear-gradient(135deg, ${alpha(track.color, 0.9)}, ${alpha(track.color, 0.55)})`,
                                                    border: selected
                                                        ? "2px solid rgba(255,255,255,0.95)"
                                                        : "1px solid rgba(255,255,255,0.45)",
                                                    boxShadow: selected
                                                        ? `0 0 0 4px ${alpha(track.color, 0.16)}`
                                                        : "none",
                                                }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    disabled={clip.locked}
                                                    onPointerDown={(event) => beginClipDrag(event, track.kind, clip, "start")}
                                                    sx={timelineHandleSx}
                                                >
                                                    <ChevronLeftRounded fontSize="small" />
                                                </IconButton>

                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    alignItems="center"
                                                    sx={{
                                                        minWidth: 0,
                                                        flex: 1,
                                                        px: 0.75,
                                                    }}
                                                >
                                                    {clip.locked ? <LockRounded fontSize="small" /> : <DragIndicatorRounded fontSize="small" />}
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography
                                                            noWrap
                                                            sx={{
                                                                fontSize: 12,
                                                                fontWeight: 950,
                                                                lineHeight: 1.1,
                                                            }}
                                                        >
                                                            {clip.label}
                                                        </Typography>
                                                        <Typography
                                                            noWrap
                                                            sx={{
                                                                fontSize: 10.5,
                                                                fontWeight: 850,
                                                                opacity: 0.75,
                                                            }}
                                                        >
                                                            {formatTime(clip.start)} → {formatTime(clip.end)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                <IconButton
                                                    size="small"
                                                    disabled={clip.locked}
                                                    onPointerDown={(event) => beginClipDrag(event, track.kind, clip, "end")}
                                                    sx={timelineHandleSx}
                                                >
                                                    <ChevronRightRounded fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        );
                                    })}

                                    {track.clips
                                        .filter((clip) => selectedKind === track.kind && clip.id === selectedClipId)
                                        .flatMap((clip) =>
                                            (clip.keyframes || []).map((keyframe) => ({
                                                clip,
                                                keyframe,
                                            }))
                                        )
                                        .map(({ clip, keyframe }) => {
                                            const left = clamp((keyframe.time / safeDuration) * 100, 0, 100);
                                            const active = keyframe.id === selectedKeyframeId;

                                            return (
                                                <Tooltip key={keyframe.id} title={`Keyframe ${formatTime(keyframe.time)}`}>
                                                    <Box
                                                        onPointerDown={(event) => beginKeyframeDrag(event, track.kind, clip, keyframe)}
                                                        sx={{
                                                            position: "absolute",
                                                            left: `${left}%`,
                                                            top: 1,
                                                            width: 15,
                                                            height: 15,
                                                            transform: "translateX(-50%) rotate(45deg)",
                                                            borderRadius: 0.75,
                                                            backgroundColor: active ? "#ffffff" : track.color,
                                                            border: "2px solid rgba(0,0,0,0.45)",
                                                            cursor: clip.locked ? "not-allowed" : "grab",
                                                            zIndex: 7,
                                                        }}
                                                    />
                                                </Tooltip>
                                            );
                                        })}
                                </Box>
                            </React.Fragment>
                        ))}

                        <Box
                            sx={{
                                position: "absolute",
                                top: 36,
                                bottom: 0,
                                left: `calc(120px + ${playheadLeft / timelineWidthPercent * 100}%)`,
                                width: 2,
                                backgroundColor: "#ffffff",
                                boxShadow: "0 0 18px rgba(255,255,255,0.85)",
                                pointerEvents: "none",
                                display: { xs: "none", sm: "block" },
                                zIndex: 10,
                            }}
                        />
                    </Box>
                </Box>
            </Stack>
        </GlassCard>
    );
}

const timelineHandleSx = {
    width: 26,
    height: "100%",
    borderRadius: 0,
    color: "#07111f",
    backgroundColor: "rgba(255,255,255,0.25)",
    "&:hover": {
        backgroundColor: "rgba(255,255,255,0.45)",
    },
    "&.Mui-disabled": {
        color: "rgba(0,0,0,0.35)",
    },
};

function ParameterEditor({
                             title,
                             icon,
                             clip,
                             keyframe,
                             paramDefs,
                             presets,
                             color,
                             onAddKeyframe,
                             onDeleteKeyframe,
                             onUpdateKeyframeTime,
                             onUpdateParam,
                             onApplyPreset,
                         }) {
    if (!clip || !keyframe) {
        return (
            <GlassCard>
                <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {icon}
                        <Typography variant="h6" sx={{ fontWeight: 950 }}>
                            {title}
                        </Typography>
                    </Stack>
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", lineHeight: 1.7 }}>
                        Select a video FX clip or audio FX clip to edit keyframes and parameters.
                    </Typography>
                </Stack>
            </GlassCard>
        );
    }

    return (
        <GlassCard>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                        {icon}
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 950 }}>
                                {title}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.56)", fontSize: 13 }}>
                                Editing {clip.label}
                            </Typography>
                        </Box>
                    </Stack>

                    <Button
                        size="small"
                        onClick={onAddKeyframe}
                        disabled={clip.locked}
                        startIcon={<KeyRounded />}
                        sx={{
                            borderRadius: 999,
                            color,
                            fontWeight: 900,
                            border: `1px solid ${alpha(color, 0.32)}`,
                        }}
                    >
                        Add Keyframe
                    </Button>
                </Stack>

                <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
                    {Object.entries(presets).map(([presetName, preset]) => (
                        <Chip
                            key={presetName}
                            label={preset.label}
                            onClick={() => !clip.locked && onApplyPreset(presetName)}
                            sx={{
                                color: "white",
                                fontWeight: 850,
                                backgroundColor: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                opacity: clip.locked ? 0.55 : 1,
                                "&:hover": {
                                    backgroundColor: alpha(color, 0.14),
                                },
                            }}
                        />
                    ))}
                </Stack>

                <TextField
                    label="Selected Keyframe Time"
                    type="number"
                    size="small"
                    disabled={clip.locked}
                    value={Number(keyframe.time.toFixed(2))}
                    onChange={(event) => onUpdateKeyframeTime(Number(event.target.value))}
                    inputProps={{ min: clip.start, max: clip.end, step: 0.05 }}
                    sx={smallTextFieldSx}
                />

                <Stack spacing={1.25}>
                    {paramDefs.map((param) => (
                        <EditorSlider
                            key={param.key}
                            label={param.label}
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            color={color}
                            value={Number(keyframe.values?.[param.key] ?? param.neutral)}
                            display={`${Number(keyframe.values?.[param.key] ?? param.neutral).toFixed(param.step < 1 ? 2 : 0)}${param.unit}`}
                            onChange={(value) => {
                                if (!clip.locked) {
                                    onUpdateParam(param.key, value);
                                }
                            }}
                        />
                    ))}
                </Stack>

                <Button
                    color="error"
                    disabled={clip.locked}
                    onClick={onDeleteKeyframe}
                    startIcon={<DeleteRounded />}
                    sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        alignSelf: "flex-start",
                    }}
                >
                    Delete Selected Keyframe
                </Button>
            </Stack>
        </GlassCard>
    );
}

export function BrowserVideoEditor() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const previewRef = useRef(null);
    const animationFrameRef = useRef(null);
    const selectedTextIdRef = useRef(null);
    const drawingStrokeRef = useRef(null);
    const dragTextIdRef = useRef(null);
    const downloadUrlRef = useRef("");
    const isExportingRef = useRef(false);

    const audioContextRef = useRef(null);
    const audioSourceRef = useRef(null);
    const audioNodesRef = useRef(null);

    const [videoUrl, setVideoUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [status, setStatus] = useState("Upload a video to start editing.");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [aspectRatio, setAspectRatio] = useState("16 / 9");

    const [volume, setVolume] = useState(1);
    const [speed, setSpeed] = useState(1);
    const [exportFps, setExportFps] = useState(30);
    const [timelineZoom, setTimelineZoom] = useState(1);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [snapStep, setSnapStep] = useState(0.05);

    const [textBoxes, setTextBoxes] = useState([]);
    const [visualClips, setVisualClips] = useState([]);
    const [audioClips, setAudioClips] = useState([]);
    const [drawingClips, setDrawingClips] = useState([]);
    const [markers, setMarkers] = useState([]);

    const [selectedKind, setSelectedKind] = useState(null);
    const [selectedClipId, setSelectedClipId] = useState(null);
    const [selectedKeyframeId, setSelectedKeyframeId] = useState(null);
    const [selectedTextId, setSelectedTextId] = useState(null);

    const [drawingMode, setDrawingMode] = useState(false);
    const [brush, setBrush] = useState({ ...DEFAULT_BRUSH });

    const [audioMeter, setAudioMeter] = useState(0);

    const selectedVisualClip = useMemo(
        () => visualClips.find((clip) => clip.id === selectedClipId && selectedKind === "visual") || null,
        [visualClips, selectedClipId, selectedKind]
    );

    const selectedAudioClip = useMemo(
        () => audioClips.find((clip) => clip.id === selectedClipId && selectedKind === "audio") || null,
        [audioClips, selectedClipId, selectedKind]
    );

    const selectedDrawingClip = useMemo(
        () => drawingClips.find((clip) => clip.id === selectedClipId && selectedKind === "draw") || null,
        [drawingClips, selectedClipId, selectedKind]
    );

    const selectedClip = selectedVisualClip || selectedAudioClip || selectedDrawingClip;

    const selectedText = useMemo(
        () => textBoxes.find((box) => box.id === selectedTextId) || null,
        [textBoxes, selectedTextId]
    );

    const selectedParamClip = selectedVisualClip || selectedAudioClip;
    const selectedParamType = selectedVisualClip ? "visual" : selectedAudioClip ? "audio" : null;
    const selectedParamDefs = selectedParamType === "audio" ? AUDIO_PARAMS : VISUAL_PARAMS;
    const selectedPresets = selectedParamType === "audio" ? AUDIO_PRESETS : VISUAL_PRESETS;
    const selectedNeutral = selectedParamType === "audio" ? AUDIO_NEUTRAL : VISUAL_NEUTRAL;
    const selectedParamColor = selectedParamType === "audio" ? "#7ef4b6" : "#9ee8ff";

    const selectedKeyframe = useMemo(() => {
        if (!selectedParamClip) {
            return null;
        }

        return selectedParamClip.keyframes.find((keyframe) => keyframe.id === selectedKeyframeId) || selectedParamClip.keyframes[0] || null;
    }, [selectedParamClip, selectedKeyframeId]);

    const activeVisualValues = useMemo(
        () => combineVisualClips(visualClips, currentTime),
        [visualClips, currentTime]
    );

    const activeAudioValues = useMemo(
        () => combineAudioClips(audioClips, currentTime),
        [audioClips, currentTime]
    );

    const support = useMemo(() => {
        if (typeof window === "undefined") {
            return {
                mediaRecorder: false,
                canvasCapture: false,
                pointerEvents: false,
                webAudio: false,
            };
        }

        return {
            mediaRecorder: "MediaRecorder" in window,
            canvasCapture: Boolean(window.HTMLCanvasElement?.prototype?.captureStream),
            pointerEvents: "PointerEvent" in window,
            webAudio: Boolean(window.AudioContext || window.webkitAudioContext),
        };
    }, []);

    useEffect(() => {
        isExportingRef.current = isExporting;
    }, [isExporting]);

    useEffect(() => {
        selectedTextIdRef.current = selectedTextId;
    }, [selectedTextId]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }

            if (downloadUrlRef.current) {
                URL.revokeObjectURL(downloadUrlRef.current);
            }

            if (audioContextRef.current) {
                audioContextRef.current.close?.();
            }
        };
    }, [videoUrl]);

    const drawFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
            return;
        }

        const ctx = canvas.getContext("2d");

        if (!ctx) {
            return;
        }

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const frameTime = video.currentTime || 0;
        const values = combineVisualClips(visualClips, frameTime);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.filter = filterString(values);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        drawSharpen(ctx, canvas.width, canvas.height, values.sharpen);
        drawNoise(ctx, canvas.width, canvas.height, values.noise);
        drawVignette(ctx, canvas.width, canvas.height, values.vignette);
        drawDrawingClips(ctx, drawingClips, frameTime, canvas.width, canvas.height);

        const shouldSkipSelectedTextEditor = !isExportingRef.current;

        textBoxes.forEach((box) => {
            if (shouldSkipSelectedTextEditor && box.id === selectedTextIdRef.current) {
                return;
            }

            drawTextBox(ctx, box, canvas.width, canvas.height);
        });
    }, [visualClips, drawingClips, textBoxes]);

    const applyAudioGraphValues = useCallback((values) => {
        const nodes = audioNodesRef.current;
        const context = audioContextRef.current;

        if (!nodes || !context) {
            return;
        }

        const now = context.currentTime;
        const safeLowpass = Math.max(values.lowpass, values.highpass + 80);
        const safeHighpass = Math.min(values.highpass, safeLowpass - 80);
        const delayMix = clamp(values.delayMix / 100, 0, 1);

        nodes.inputGain.gain.setTargetAtTime(clamp(values.gain / 100, 0, 2), now, 0.02);
        nodes.masterGain.gain.setTargetAtTime(clamp(volume, 0, 1), now, 0.02);
        nodes.bass.gain.setTargetAtTime(values.bass, now, 0.02);
        nodes.treble.gain.setTargetAtTime(values.treble, now, 0.02);
        nodes.lowpass.frequency.setTargetAtTime(safeLowpass, now, 0.02);
        nodes.highpass.frequency.setTargetAtTime(Math.max(10, safeHighpass), now, 0.02);
        nodes.delay.delayTime.setTargetAtTime(values.delayTime, now, 0.02);
        nodes.feedback.gain.setTargetAtTime(clamp(values.feedback / 100, 0, 0.9), now, 0.02);
        nodes.dryGain.gain.setTargetAtTime(1 - delayMix * 0.35, now, 0.02);
        nodes.wetGain.gain.setTargetAtTime(delayMix, now, 0.02);

        if (nodes.pan?.pan) {
            nodes.pan.pan.setTargetAtTime(clamp(values.pan / 100, -1, 1), now, 0.02);
        }
    }, [volume]);

    const ensureAudioGraph = useCallback(async () => {
        const video = videoRef.current;

        if (!video || !support.webAudio) {
            return null;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContextClass();
        }

        const context = audioContextRef.current;

        if (!audioSourceRef.current) {
            audioSourceRef.current = context.createMediaElementSource(video);
        }

        if (!audioNodesRef.current) {
            const inputGain = context.createGain();

            const bass = context.createBiquadFilter();
            bass.type = "lowshelf";
            bass.frequency.value = 180;

            const treble = context.createBiquadFilter();
            treble.type = "highshelf";
            treble.frequency.value = 3600;

            const highpass = context.createBiquadFilter();
            highpass.type = "highpass";
            highpass.frequency.value = 10;

            const lowpass = context.createBiquadFilter();
            lowpass.type = "lowpass";
            lowpass.frequency.value = 22050;

            const delay = context.createDelay(1.5);
            delay.delayTime.value = AUDIO_NEUTRAL.delayTime;

            const feedback = context.createGain();
            feedback.gain.value = 0;

            const dryGain = context.createGain();
            const wetGain = context.createGain();
            wetGain.gain.value = 0;

            const pan = context.createStereoPanner ? context.createStereoPanner() : context.createGain();
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;

            const masterGain = context.createGain();
            const streamDestination = context.createMediaStreamDestination();

            audioSourceRef.current.connect(inputGain);
            inputGain.connect(bass);
            bass.connect(treble);
            treble.connect(highpass);
            highpass.connect(lowpass);

            lowpass.connect(dryGain);
            lowpass.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wetGain);

            dryGain.connect(pan);
            wetGain.connect(pan);
            pan.connect(analyser);
            analyser.connect(masterGain);

            masterGain.connect(context.destination);
            masterGain.connect(streamDestination);

            audioNodesRef.current = {
                inputGain,
                bass,
                treble,
                highpass,
                lowpass,
                delay,
                feedback,
                dryGain,
                wetGain,
                pan,
                analyser,
                masterGain,
                streamDestination,
            };
        }

        if (context.state === "suspended") {
            await context.resume();
        }

        applyAudioGraphValues(activeAudioValues);

        return audioNodesRef.current;
    }, [activeAudioValues, applyAudioGraphValues, support.webAudio]);

    useEffect(() => {
        if (!videoUrl) {
            return undefined;
        }

        const render = () => {
            const video = videoRef.current;

            if (video) {
                const nextTime = video.currentTime || 0;
                setCurrentTime(nextTime);
                applyAudioGraphValues(combineAudioClips(audioClips, nextTime));

                if (trimEnd > trimStart && nextTime >= trimEnd && !isExportingRef.current) {
                    video.pause();
                    setIsPlaying(false);
                }

                const nodes = audioNodesRef.current;

                if (nodes?.analyser) {
                    const data = new Uint8Array(nodes.analyser.frequencyBinCount);
                    nodes.analyser.getByteFrequencyData(data);
                    const average = data.reduce((sum, item) => sum + item, 0) / Math.max(1, data.length);
                    setAudioMeter(clamp(average / 255, 0, 1));
                }
            }

            drawFrame();
            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [videoUrl, audioClips, trimStart, trimEnd, drawFrame, applyAudioGraphValues]);

    const seekTo = useCallback((time) => {
        return new Promise((resolve) => {
            const video = videoRef.current;

            if (!video) {
                resolve();
                return;
            }

            const targetTime = clamp(time, 0, Number.isFinite(video.duration) ? video.duration : time);
            let resolved = false;

            const finish = () => {
                if (resolved) {
                    return;
                }

                resolved = true;
                video.removeEventListener("seeked", finish);
                setCurrentTime(targetTime);
                requestAnimationFrame(drawFrame);
                resolve();
            };

            video.addEventListener("seeked", finish, { once: true });
            video.currentTime = targetTime;
            setTimeout(finish, 450);
        });
    }, [drawFrame]);

    const resetEditorLayers = () => {
        setTextBoxes([]);
        setVisualClips([]);
        setAudioClips([]);
        setDrawingClips([]);
        setMarkers([]);
        setSelectedTextId(null);
        setSelectedKind(null);
        setSelectedClipId(null);
        setSelectedKeyframeId(null);
        setDrawingMode(false);
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }

        if (downloadUrlRef.current) {
            URL.revokeObjectURL(downloadUrlRef.current);
            downloadUrlRef.current = "";
        }

        if (audioContextRef.current) {
            audioContextRef.current.close?.();
            audioContextRef.current = null;
            audioSourceRef.current = null;
            audioNodesRef.current = null;
        }

        const nextUrl = URL.createObjectURL(file);

        setVideoUrl(nextUrl);
        setFileName(file.name);
        setDuration(0);
        setCurrentTime(0);
        setTrimStart(0);
        setTrimEnd(0);
        setIsPlaying(false);
        setDownloadUrl("");
        setAudioMeter(0);
        setStatus("Video selected. Loading metadata and preparing canvas preview...");
        resetEditorLayers();

        event.target.value = "";
    };

    const paintLoadedVideoToCanvas = () => {
        requestAnimationFrame(() => {
            drawFrame();
            requestAnimationFrame(drawFrame);
        });
    };

    const handleLoadedMetadata = () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;

        setDuration(nextDuration);
        setTrimStart(0);
        setTrimEnd(nextDuration);
        setAspectRatio(`${video.videoWidth || 16} / ${video.videoHeight || 9}`);
        setStatus("Video metadata loaded. Canvas preview is preparing...");
        paintLoadedVideoToCanvas();
    };

    const handleLoadedData = () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        video.pause();
        video.currentTime = 0;
        setCurrentTime(0);
        paintLoadedVideoToCanvas();
        setStatus("Canvas preview is ready. The uploaded video is visible in the editor.");
    };

    const handlePlayPause = async () => {
        const video = videoRef.current;

        if (!videoUrl || !video) {
            setStatus("Upload a video first.");
            return;
        }

        video.playbackRate = speed;

        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
            return;
        }

        await ensureAudioGraph();

        if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
            await seekTo(trimStart);
        }

        try {
            await video.play();
            setIsPlaying(true);
            setStatus("Preview playing with canvas video, visual clips, and audio clips.");
        } catch (error) {
            setStatus("The browser blocked playback. Tap play again or check the video file.");
        }
    };

    const handleRestart = async () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        video.pause();
        setIsPlaying(false);
        await seekTo(trimStart);
        drawFrame();
    };

    const handleSeek = async (nextTime) => {
        const video = videoRef.current;

        if (video) {
            video.pause();
            setIsPlaying(false);
        }

        await seekTo(clamp(nextTime, trimStart, trimEnd || duration));
        drawFrame();
    };

    const updateTrimStart = async (value) => {
        const next = clamp(Number.isFinite(value) ? value : 0, 0, Math.max(0, trimEnd - MIN_CLIP_LENGTH));

        setTrimStart(next);

        if (currentTime < next) {
            await handleSeek(next);
        }
    };

    const updateTrimEnd = async (value) => {
        const next = clamp(Number.isFinite(value) ? value : duration, trimStart + MIN_CLIP_LENGTH, duration || trimStart + MIN_CLIP_LENGTH);

        setTrimEnd(next);

        if (currentTime > next) {
            await handleSeek(next);
        }
    };

    const getSafeNewClipRange = () => {
        const safeStart = clamp(currentTime || trimStart, trimStart, Math.max(trimStart, trimEnd - MIN_CLIP_LENGTH));
        const safeEnd = clamp(
            safeStart + Math.min(3, Math.max(MIN_CLIP_LENGTH, trimEnd - safeStart)),
            safeStart + MIN_CLIP_LENGTH,
            trimEnd || duration || safeStart + 3
        );

        return [safeStart, safeEnd];
    };

    const selectClip = (kind, id) => {
        const clip =
            kind === "visual"
                ? visualClips.find((item) => item.id === id)
                : kind === "audio"
                    ? audioClips.find((item) => item.id === id)
                    : drawingClips.find((item) => item.id === id);

        setSelectedKind(kind);
        setSelectedClipId(id);
        setSelectedTextId(null);
        setDrawingMode(kind === "draw");
        setSelectedKeyframeId(clip?.keyframes?.[clip.keyframes.length - 1]?.id || null);
    };

    const clearSelection = () => {
        setSelectedKind(null);
        setSelectedClipId(null);
        setSelectedTextId(null);
        setSelectedKeyframeId(null);
        setDrawingMode(false);
    };

    const addVisualClip = (presetName = "cinematic") => {
        if (!videoUrl) {
            setStatus("Upload a video before adding a visual effect clip.");
            return;
        }

        const preset = VISUAL_PRESETS[presetName] || VISUAL_PRESETS.cinematic;
        const [start, end] = getSafeNewClipRange();
        const clipId = makeId("visual");
        const firstKeyframeId = makeId("keyframe");
        const secondKeyframeId = makeId("keyframe");

        const nextClip = {
            id: clipId,
            type: "visual",
            label: `${preset.label} ${visualClips.length + 1}`,
            enabled: true,
            locked: false,
            start,
            end,
            blendMode: "normal",
            keyframes: [
                {
                    id: firstKeyframeId,
                    time: start,
                    values: { ...VISUAL_NEUTRAL },
                },
                {
                    id: secondKeyframeId,
                    time: end,
                    values: { ...preset.values },
                },
            ],
        };

        setVisualClips((previous) => [...previous, nextClip]);
        setSelectedKind("visual");
        setSelectedClipId(clipId);
        setSelectedKeyframeId(secondKeyframeId);
        setSelectedTextId(null);
        setDrawingMode(false);
        setStatus("Visual effect clip added. Resize it directly on the timeline.");
    };

    const addAudioClip = (presetName = "echo") => {
        if (!videoUrl) {
            setStatus("Upload a video before adding an audio effect clip.");
            return;
        }

        const preset = AUDIO_PRESETS[presetName] || AUDIO_PRESETS.echo;
        const [start, end] = getSafeNewClipRange();
        const clipId = makeId("audio");
        const firstKeyframeId = makeId("keyframe");
        const secondKeyframeId = makeId("keyframe");

        const nextClip = {
            id: clipId,
            type: "audio",
            label: `${preset.label} ${audioClips.length + 1}`,
            enabled: true,
            locked: false,
            start,
            end,
            keyframes: [
                {
                    id: firstKeyframeId,
                    time: start,
                    values: { ...AUDIO_NEUTRAL },
                },
                {
                    id: secondKeyframeId,
                    time: end,
                    values: { ...preset.values },
                },
            ],
        };

        setAudioClips((previous) => [...previous, nextClip]);
        setSelectedKind("audio");
        setSelectedClipId(clipId);
        setSelectedKeyframeId(secondKeyframeId);
        setSelectedTextId(null);
        setDrawingMode(false);
        setStatus("Audio effect clip added. Resize it directly on the timeline.");
    };

    const addDrawingClip = () => {
        if (!videoUrl) {
            setStatus("Upload a video before adding a drawing clip.");
            return;
        }

        const [start, end] = getSafeNewClipRange();
        const clipId = makeId("draw");

        const nextClip = {
            id: clipId,
            type: "draw",
            label: `Drawing ${drawingClips.length + 1}`,
            enabled: true,
            locked: false,
            start,
            end,
            blendMode: "source-over",
            brush: { ...brush },
            strokes: [],
        };

        setDrawingClips((previous) => [...previous, nextClip]);
        setSelectedKind("draw");
        setSelectedClipId(clipId);
        setSelectedKeyframeId(null);
        setSelectedTextId(null);
        setDrawingMode(true);
        setStatus("Drawing clip added. Move the playhead inside it, then draw on the canvas.");
    };

    const updateClipTiming = useCallback((kind, clipId, nextStart, nextEnd, options = {}) => {
        const applyTiming = (clip) => {
            if (clip.locked) {
                return clip;
            }

            const start = clamp(nextStart, trimStart, Math.max(trimStart, trimEnd - MIN_CLIP_LENGTH));
            const end = clamp(nextEnd, start + MIN_CLIP_LENGTH, trimEnd || duration || start + MIN_CLIP_LENGTH);
            const shiftDelta = Number(options.shiftDelta || 0);

            return {
                ...clip,
                start,
                end,
                keyframes: clip.keyframes
                    ? sortKeyframes(
                        clip.keyframes.map((keyframe) => ({
                            ...keyframe,
                            time: clamp(keyframe.time + shiftDelta, start, end),
                        }))
                    )
                    : clip.keyframes,
            };
        };

        if (kind === "visual") {
            setVisualClips((previous) => previous.map((clip) => (clip.id === clipId ? applyTiming(clip) : clip)));
        }

        if (kind === "audio") {
            setAudioClips((previous) => previous.map((clip) => (clip.id === clipId ? applyTiming(clip) : clip)));
        }

        if (kind === "draw") {
            setDrawingClips((previous) => previous.map((clip) => (clip.id === clipId ? applyTiming(clip) : clip)));
        }
    }, [duration, trimStart, trimEnd]);

    const updateClipPatch = (kind, clipId, patch) => {
        if (kind === "visual") {
            setVisualClips((previous) => previous.map((clip) => (clip.id === clipId ? { ...clip, ...patch } : clip)));
        }

        if (kind === "audio") {
            setAudioClips((previous) => previous.map((clip) => (clip.id === clipId ? { ...clip, ...patch } : clip)));
        }

        if (kind === "draw") {
            setDrawingClips((previous) => previous.map((clip) => (clip.id === clipId ? { ...clip, ...patch } : clip)));
        }
    };

    const updateSelectedClipPatch = (patch) => {
        if (!selectedKind || !selectedClipId) {
            return;
        }

        updateClipPatch(selectedKind, selectedClipId, patch);
    };

    const deleteSelectedClip = () => {
        if (!selectedKind || !selectedClipId) {
            return;
        }

        if (selectedKind === "visual") {
            setVisualClips((previous) => previous.filter((clip) => clip.id !== selectedClipId));
        }

        if (selectedKind === "audio") {
            setAudioClips((previous) => previous.filter((clip) => clip.id !== selectedClipId));
        }

        if (selectedKind === "draw") {
            setDrawingClips((previous) => previous.filter((clip) => clip.id !== selectedClipId));
        }

        clearSelection();
        setStatus("Selected timeline clip deleted.");
    };

    const duplicateSelectedClip = () => {
        if (!selectedKind || !selectedClip) {
            return;
        }

        const clipLength = selectedClip.end - selectedClip.start;
        const nextStart = clamp(selectedClip.end + 0.1, trimStart, Math.max(trimStart, trimEnd - clipLength));
        const nextEnd = clamp(nextStart + clipLength, nextStart + MIN_CLIP_LENGTH, trimEnd);
        const copyId = makeId(selectedKind);

        const copyClip = {
            ...selectedClip,
            id: copyId,
            label: `${selectedClip.label} Copy`,
            start: nextStart,
            end: nextEnd,
            locked: false,
            keyframes: selectedClip.keyframes
                ? selectedClip.keyframes.map((keyframe) => ({
                    ...keyframe,
                    id: makeId("keyframe"),
                    time: clamp(nextStart + (keyframe.time - selectedClip.start), nextStart, nextEnd),
                }))
                : selectedClip.keyframes,
            strokes: selectedClip.strokes ? selectedClip.strokes.map((stroke) => ({ ...stroke, id: makeId("stroke") })) : selectedClip.strokes,
        };

        if (selectedKind === "visual") {
            setVisualClips((previous) => [...previous, copyClip]);
        }

        if (selectedKind === "audio") {
            setAudioClips((previous) => [...previous, copyClip]);
        }

        if (selectedKind === "draw") {
            setDrawingClips((previous) => [...previous, copyClip]);
        }

        setSelectedClipId(copyId);
        setSelectedKeyframeId(copyClip.keyframes?.[0]?.id || null);
        setStatus("Selected clip duplicated.");
    };

    const splitSelectedClipAtPlayhead = () => {
        if (!selectedKind || !selectedClip || selectedClip.locked) {
            return;
        }

        if (currentTime <= selectedClip.start + MIN_CLIP_LENGTH || currentTime >= selectedClip.end - MIN_CLIP_LENGTH) {
            setStatus("Move the playhead inside the selected clip before splitting.");
            return;
        }

        const leftClip = {
            ...selectedClip,
            end: currentTime,
            keyframes: selectedClip.keyframes
                ? selectedClip.keyframes.map((keyframe) => ({
                    ...keyframe,
                    time: clamp(keyframe.time, selectedClip.start, currentTime),
                }))
                : selectedClip.keyframes,
        };

        const rightId = makeId(selectedKind);
        const rightClip = {
            ...selectedClip,
            id: rightId,
            label: `${selectedClip.label} Split`,
            start: currentTime,
            keyframes: selectedClip.keyframes
                ? selectedClip.keyframes.map((keyframe) => ({
                    ...keyframe,
                    id: makeId("keyframe"),
                    time: clamp(keyframe.time, currentTime, selectedClip.end),
                }))
                : selectedClip.keyframes,
        };

        const replaceSplit = (clips) =>
            clips.flatMap((clip) => {
                if (clip.id !== selectedClip.id) {
                    return [clip];
                }

                return [leftClip, rightClip];
            });

        if (selectedKind === "visual") {
            setVisualClips(replaceSplit);
        }

        if (selectedKind === "audio") {
            setAudioClips(replaceSplit);
        }

        if (selectedKind === "draw") {
            setDrawingClips(replaceSplit);
        }

        setSelectedClipId(rightId);
        setStatus("Selected clip split at the playhead.");
    };

    const nudgeSelectedClip = (mode, amount) => {
        if (!selectedKind || !selectedClip || selectedClip.locked) {
            return;
        }

        if (mode === "move") {
            const clipLength = selectedClip.end - selectedClip.start;
            const nextStart = clamp(selectedClip.start + amount, trimStart, trimEnd - clipLength);
            const nextEnd = nextStart + clipLength;
            updateClipTiming(selectedKind, selectedClip.id, nextStart, nextEnd, {
                shiftDelta: nextStart - selectedClip.start,
            });
        }

        if (mode === "start") {
            updateClipTiming(selectedKind, selectedClip.id, selectedClip.start + amount, selectedClip.end);
        }

        if (mode === "end") {
            updateClipTiming(selectedKind, selectedClip.id, selectedClip.start, selectedClip.end + amount);
        }
    };

    const addKeyframeAtPlayhead = () => {
        if (!selectedParamClip || !selectedParamType || selectedParamClip.locked) {
            setStatus("Select an unlocked visual or audio effect clip before adding a keyframe.");
            return;
        }

        const keyframeId = makeId("keyframe");
        const time = clamp(currentTime, selectedParamClip.start, selectedParamClip.end);
        const values = evaluateKeyframes(selectedParamDefs, selectedNeutral, selectedParamClip.keyframes, time);

        const updater = (clip) => ({
            ...clip,
            keyframes: sortKeyframes([
                ...clip.keyframes,
                {
                    id: keyframeId,
                    time,
                    values,
                },
            ]),
        });

        if (selectedParamType === "visual") {
            setVisualClips((previous) => previous.map((clip) => clip.id === selectedParamClip.id ? updater(clip) : clip));
        }

        if (selectedParamType === "audio") {
            setAudioClips((previous) => previous.map((clip) => clip.id === selectedParamClip.id ? updater(clip) : clip));
        }

        setSelectedKeyframeId(keyframeId);
        setStatus(`Keyframe added at ${formatTime(time)}.`);
    };

    const deleteSelectedKeyframe = () => {
        if (!selectedParamClip || !selectedKeyframe || selectedParamClip.locked) {
            return;
        }

        if (selectedParamClip.keyframes.length <= 1) {
            setStatus("A clip needs at least one keyframe.");
            return;
        }

        const remaining = selectedParamClip.keyframes.filter((keyframe) => keyframe.id !== selectedKeyframe.id);

        if (selectedParamType === "visual") {
            setVisualClips((previous) => previous.map((clip) => clip.id === selectedParamClip.id ? { ...clip, keyframes: remaining } : clip));
        }

        if (selectedParamType === "audio") {
            setAudioClips((previous) => previous.map((clip) => clip.id === selectedParamClip.id ? { ...clip, keyframes: remaining } : clip));
        }

        setSelectedKeyframeId(remaining[0]?.id || null);
        setStatus("Keyframe deleted.");
    };

    const updateKeyframeTime = (kind, clipId, keyframeId, nextTime) => {
        const update = (clip) => {
            if (clip.id !== clipId || clip.locked) {
                return clip;
            }

            return {
                ...clip,
                keyframes: sortKeyframes(
                    clip.keyframes.map((keyframe) =>
                        keyframe.id === keyframeId
                            ? {
                                ...keyframe,
                                time: clamp(nextTime, clip.start, clip.end),
                            }
                            : keyframe
                    )
                ),
            };
        };

        if (kind === "visual") {
            setVisualClips((previous) => previous.map(update));
        }

        if (kind === "audio") {
            setAudioClips((previous) => previous.map(update));
        }
    };

    const updateSelectedKeyframe = (patch) => {
        if (!selectedParamClip || !selectedKeyframe || selectedParamClip.locked) {
            return;
        }

        const updater = (clip) => ({
            ...clip,
            keyframes: sortKeyframes(
                clip.keyframes.map((keyframe) =>
                    keyframe.id === selectedKeyframe.id
                        ? { ...keyframe, ...patch }
                        : keyframe
                )
            ),
        });

        if (selectedParamType === "visual") {
            setVisualClips((previous) => previous.map((clip) => clip.id === selectedParamClip.id ? updater(clip) : clip));
        }

        if (selectedParamType === "audio") {
            setAudioClips((previous) => previous.map((clip) => clip.id === selectedParamClip.id ? updater(clip) : clip));
        }
    };

    const updateSelectedKeyframeTime = (time) => {
        if (!selectedParamClip) {
            return;
        }

        updateSelectedKeyframe({
            time: clamp(time, selectedParamClip.start, selectedParamClip.end),
        });
    };

    const updateSelectedKeyframeValue = (key, value) => {
        if (!selectedKeyframe) {
            return;
        }

        updateSelectedKeyframe({
            values: {
                ...selectedKeyframe.values,
                [key]: value,
            },
        });
    };

    const applyPresetToSelectedKeyframe = (presetName) => {
        if (!selectedKeyframe || !selectedPresets[presetName]) {
            return;
        }

        updateSelectedKeyframe({
            values: { ...selectedPresets[presetName].values },
        });

        setStatus(`${selectedPresets[presetName].label} values applied to selected keyframe.`);
    };

    const addMarkerAtPlayhead = () => {
        if (!videoUrl) {
            setStatus("Upload a video before adding a timeline marker.");
            return;
        }

        const nextMarker = {
            id: makeId("marker"),
            time: currentTime,
            label: `Marker ${markers.length + 1}`,
        };

        setMarkers((previous) => [...previous, nextMarker].sort((a, b) => a.time - b.time));
        setStatus(`Marker added at ${formatTime(currentTime)}.`);
    };

    const deleteMarker = (markerId) => {
        setMarkers((previous) => previous.filter((marker) => marker.id !== markerId));
    };

    const addTextBox = () => {
        const next = {
            id: makeId("text"),
            text: "New text",
            x: 50,
            y: 50,
            fontSize: 52,
            color: "#ffffff",
            fontWeight: 950,
            align: "center",
            shadow: true,
        };

        setTextBoxes((previous) => [...previous, next]);
        setSelectedTextId(next.id);
        setSelectedKind(null);
        setSelectedClipId(null);
        setSelectedKeyframeId(null);
        setDrawingMode(false);
        setStatus("Text box added. Drag the move handle to position it.");
    };

    const updateSelectedText = (patch) => {
        if (!selectedTextId) {
            return;
        }

        setTextBoxes((previous) =>
            previous.map((box) =>
                box.id === selectedTextId
                    ? { ...box, ...patch }
                    : box
            )
        );
    };

    const deleteSelectedText = () => {
        if (!selectedTextId) {
            return;
        }

        setTextBoxes((previous) => previous.filter((box) => box.id !== selectedTextId));
        setSelectedTextId(null);
        setStatus("Text box removed.");
    };

    const startTextDrag = (event) => {
        if (!selectedTextId || !previewRef.current || drawingMode) {
            return;
        }

        event.preventDefault();
        dragTextIdRef.current = selectedTextId;
        event.currentTarget.setPointerCapture?.(event.pointerId);
    };

    const moveTextDrag = (event) => {
        if (!dragTextIdRef.current || !previewRef.current) {
            return;
        }

        const rect = previewRef.current.getBoundingClientRect();
        const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
        const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);

        setTextBoxes((previous) =>
            previous.map((box) =>
                box.id === dragTextIdRef.current
                    ? { ...box, x, y }
                    : box
            )
        );
    };

    const endTextDrag = (event) => {
        dragTextIdRef.current = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
    };

    const updateBrush = (patch) => {
        setBrush((previous) => {
            const nextBrush = { ...previous, ...patch };

            if (selectedKind === "draw" && selectedClipId) {
                setDrawingClips((clips) =>
                    clips.map((clip) =>
                        clip.id === selectedClipId
                            ? { ...clip, brush: nextBrush }
                            : clip
                    )
                );
            }

            return nextBrush;
        });
    };

    const clearSelectedDrawingStrokes = () => {
        if (selectedKind !== "draw" || !selectedClipId || selectedDrawingClip?.locked) {
            return;
        }

        setDrawingClips((previous) =>
            previous.map((clip) =>
                clip.id === selectedClipId
                    ? { ...clip, strokes: [] }
                    : clip
            )
        );

        setStatus("Drawing strokes cleared.");
    };

    const undoLastStroke = () => {
        if (selectedKind !== "draw" || !selectedClipId || selectedDrawingClip?.locked) {
            return;
        }

        setDrawingClips((previous) =>
            previous.map((clip) =>
                clip.id === selectedClipId
                    ? { ...clip, strokes: clip.strokes.slice(0, -1) }
                    : clip
            )
        );
    };

    const getPointerPoint = (event) => {
        if (!previewRef.current || !selectedDrawingClip) {
            return null;
        }

        const rect = previewRef.current.getBoundingClientRect();
        const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
        const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
        const pressure = event.pressure && event.pressure > 0 ? event.pressure : 0.5;
        const localTime = clamp(currentTime - selectedDrawingClip.start, 0, selectedDrawingClip.end - selectedDrawingClip.start);

        return {
            x,
            y,
            pressure,
            pointerType: event.pointerType || "mouse",
            t: localTime,
        };
    };

    const appendPointToActiveStroke = (point) => {
        if (!drawingStrokeRef.current || selectedKind !== "draw" || !selectedClipId) {
            return;
        }

        const now = performance.now();
        const elapsed = Math.max(0, (now - drawingStrokeRef.current.startedAtMs) / 1000);
        const pointWithTiming = {
            ...point,
            t: clamp(drawingStrokeRef.current.startOffset + elapsed, 0, 9999),
        };

        drawingStrokeRef.current.points.push(pointWithTiming);

        const strokeId = drawingStrokeRef.current.id;

        setDrawingClips((previous) =>
            previous.map((clip) => {
                if (clip.id !== selectedClipId) {
                    return clip;
                }

                return {
                    ...clip,
                    strokes: clip.strokes.map((stroke) =>
                        stroke.id === strokeId
                            ? { ...stroke, points: [...drawingStrokeRef.current.points] }
                            : stroke
                    ),
                };
            })
        );
    };

    const handleCanvasPointerDown = (event) => {
        if (!drawingMode || !selectedDrawingClip || isExporting || selectedDrawingClip.locked) {
            return;
        }

        const isInsideClip = currentTime >= selectedDrawingClip.start && currentTime <= selectedDrawingClip.end;

        if (!isInsideClip) {
            setStatus("Move the playhead inside the selected drawing clip before drawing.");
            return;
        }

        const point = getPointerPoint(event);

        if (!point) {
            return;
        }

        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);

        const strokeId = makeId("stroke");
        const startOffset = clamp(currentTime - selectedDrawingClip.start, 0, selectedDrawingClip.end - selectedDrawingClip.start);

        const stroke = {
            id: strokeId,
            color: brush.color,
            size: brush.size,
            opacity: brush.opacity,
            pointerType: event.pointerType || "mouse",
            points: [{ ...point, t: startOffset }],
        };

        drawingStrokeRef.current = {
            id: strokeId,
            points: [...stroke.points],
            startedAtMs: performance.now(),
            startOffset,
        };

        setDrawingClips((previous) =>
            previous.map((clip) =>
                clip.id === selectedDrawingClip.id
                    ? {
                        ...clip,
                        brush: { ...brush },
                        strokes: [...clip.strokes, stroke],
                    }
                    : clip
            )
        );
    };

    const handleCanvasPointerMove = (event) => {
        if (!drawingStrokeRef.current || !drawingMode || !selectedDrawingClip) {
            return;
        }

        const point = getPointerPoint(event);

        if (!point) {
            return;
        }

        event.preventDefault();
        appendPointToActiveStroke(point);
    };

    const handleCanvasPointerUp = (event) => {
        if (!drawingStrokeRef.current) {
            return;
        }

        event.preventDefault();
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        drawingStrokeRef.current = null;
    };

    const exportWebM = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!videoUrl || !video || !canvas) {
            setStatus("Upload a video before exporting.");
            return;
        }

        if (!support.mediaRecorder || !support.canvasCapture) {
            setStatus("This browser does not support Canvas capture or MediaRecorder export.");
            return;
        }

        if (trimEnd <= trimStart) {
            setStatus("Choose a valid trim range before exporting.");
            return;
        }

        try {
            setIsExporting(true);
            setIsPlaying(false);
            setStatus("Exporting canvas video with visual clips, drawings, text, and audio FX...");
            setDownloadUrl("");

            if (downloadUrlRef.current) {
                URL.revokeObjectURL(downloadUrlRef.current);
                downloadUrlRef.current = "";
            }

            video.pause();
            video.playbackRate = speed;

            const nodes = await ensureAudioGraph();

            await seekTo(trimStart);
            drawFrame();

            const canvasStream = canvas.captureStream(exportFps);
            let audioTracks = nodes?.streamDestination?.stream?.getAudioTracks?.() || [];

            if (!audioTracks.length && typeof video.captureStream === "function") {
                audioTracks = video.captureStream().getAudioTracks();
            }

            const outputStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioTracks,
            ]);

            const mimeTypeOptions = [
                "video/webm;codecs=vp9,opus",
                "video/webm;codecs=vp8,opus",
                "video/webm",
            ];

            const mimeType = mimeTypeOptions.find((type) => MediaRecorder.isTypeSupported(type)) || "";
            const recorder = new MediaRecorder(outputStream, mimeType ? { mimeType } : undefined);
            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            const finished = new Promise((resolve) => {
                recorder.onstop = resolve;
            });

            const stopWhenDone = () => {
                if (video.currentTime >= trimEnd || video.ended) {
                    video.pause();

                    if (recorder.state !== "inactive") {
                        recorder.stop();
                    }

                    video.removeEventListener("timeupdate", stopWhenDone);
                }
            };

            video.addEventListener("timeupdate", stopWhenDone);

            recorder.start(250);
            await video.play();
            await finished;

            outputStream.getTracks().forEach((track) => track.stop());

            const blob = new Blob(chunks, {
                type: recorder.mimeType || "video/webm",
            });

            const nextDownloadUrl = URL.createObjectURL(blob);
            downloadUrlRef.current = nextDownloadUrl;
            setDownloadUrl(nextDownloadUrl);
            setStatus("Export ready. Download your edited WebM video.");
        } catch (error) {
            setStatus("Export failed. Try a shorter clip, smaller video, or a Chromium browser.");
        } finally {
            setIsExporting(false);
            setIsPlaying(false);
        }
    };

    const totalClipCount = visualClips.length + audioClips.length + drawingClips.length;

    return (
        <Grid container spacing={2.5}>
            <Grid item xs={12} lg={8}>
                <GlassCard sx={{ p: { xs: 1.5, md: 2 } }}>
                    <Stack spacing={2}>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            alignItems={{ xs: "stretch", sm: "center" }}
                            justifyContent="space-between"
                        >
                            <Stack spacing={0.25}>
                                <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                    Canvas Preview
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: 14 }}>
                                    {fileName || "No video selected"}
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1}>
                                <Button
                                    onClick={clearSelection}
                                    disabled={!videoUrl}
                                    sx={miniControlSx}
                                >
                                    Deselect
                                </Button>

                                <Button
                                    component="label"
                                    variant="contained"
                                    startIcon={<CloudUploadRounded />}
                                    sx={primaryPillSx}
                                >
                                    Upload Video
                                    <input
                                        hidden
                                        type="file"
                                        accept="video/*"
                                        onChange={handleFileChange}
                                    />
                                </Button>
                            </Stack>
                        </Stack>

                        <Box
                            ref={previewRef}
                            onPointerDown={handleCanvasPointerDown}
                            onPointerMove={handleCanvasPointerMove}
                            onPointerUp={handleCanvasPointerUp}
                            onPointerCancel={handleCanvasPointerUp}
                            sx={{
                                width: "100%",
                                aspectRatio,
                                minHeight: { xs: 220, md: 420 },
                                maxHeight: "72vh",
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: 5,
                                background:
                                    "linear-gradient(135deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))",
                                border: drawingMode
                                    ? "2px solid rgba(158,232,255,0.85)"
                                    : "1px solid rgba(255,255,255,0.12)",
                                display: "grid",
                                placeItems: "center",
                                touchAction: drawingMode ? "none" : "auto",
                                cursor: drawingMode ? "crosshair" : "default",
                            }}
                        >
                            {videoUrl ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        src={videoUrl}
                                        playsInline
                                        preload="auto"
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onLoadedData={handleLoadedData}
                                        onCanPlay={paintLoadedVideoToCanvas}
                                        onSeeked={paintLoadedVideoToCanvas}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        style={{ display: "none" }}
                                    />

                                    <canvas
                                        ref={canvasRef}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    />

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        useFlexGap
                                        flexWrap="wrap"
                                        sx={{
                                            position: "absolute",
                                            top: 12,
                                            left: 12,
                                            right: 12,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <Chip
                                            label={`Video FX: ${visualClips.length} clips`}
                                            sx={statusChipSx("#9ee8ff")}
                                        />
                                        <Chip
                                            label={`Audio FX: ${audioClips.length} clips`}
                                            sx={statusChipSx("#7ef4b6")}
                                        />
                                        <Chip
                                            label={`Draw: ${drawingClips.length} clips`}
                                            sx={statusChipSx("#b38cff")}
                                        />
                                        {drawingMode && (
                                            <Chip
                                                label="Drawing mode"
                                                sx={{
                                                    color: "#07111f",
                                                    fontWeight: 950,
                                                    background: "linear-gradient(135deg, #9ee8ff, #b38cff)",
                                                }}
                                            />
                                        )}
                                    </Stack>

                                    {selectedText && !drawingMode && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                left: `${selectedText.x}%`,
                                                top: `${selectedText.y}%`,
                                                transform: "translate(-50%, -50%)",
                                                width: { xs: 230, sm: 310 },
                                                zIndex: 4,
                                            }}
                                        >
                                            <Box
                                                onPointerDown={startTextDrag}
                                                onPointerMove={moveTextDrag}
                                                onPointerUp={endTextDrag}
                                                sx={{
                                                    cursor: "grab",
                                                    userSelect: "none",
                                                    mb: 0.75,
                                                    mx: "auto",
                                                    width: "fit-content",
                                                    px: 1,
                                                    py: 0.35,
                                                    borderRadius: 999,
                                                    color: "#07111f",
                                                    fontSize: 12,
                                                    fontWeight: 950,
                                                    background:
                                                        "linear-gradient(135deg, #9ee8ff, #b38cff)",
                                                }}
                                            >
                                                Move text
                                            </Box>

                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={1}
                                                value={selectedText.text}
                                                onChange={(event) =>
                                                    updateSelectedText({ text: event.target.value })
                                                }
                                                variant="outlined"
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        color: selectedText.color,
                                                        fontSize: {
                                                            xs: Math.max(18, selectedText.fontSize / 2.3),
                                                            sm: Math.max(20, selectedText.fontSize / 1.8),
                                                        },
                                                        fontWeight: selectedText.fontWeight,
                                                        textAlign: selectedText.align,
                                                        backgroundColor: "rgba(0,0,0,0.18)",
                                                        backdropFilter: "blur(8px)",
                                                        borderRadius: 3,
                                                        "& fieldset": {
                                                            borderColor: "rgba(158,232,255,0.75)",
                                                            borderWidth: 2,
                                                        },
                                                        "&:hover fieldset": {
                                                            borderColor: "#9ee8ff",
                                                        },
                                                        "&.Mui-focused fieldset": {
                                                            borderColor: "#b38cff",
                                                        },
                                                    },
                                                    "& textarea": {
                                                        textAlign: selectedText.align,
                                                    },
                                                }}
                                            />
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <Stack spacing={1.5} alignItems="center" sx={{ p: 3, textAlign: "center" }}>
                                    <MovieCreationRounded
                                        sx={{ fontSize: 72, color: "rgba(255,255,255,0.32)" }}
                                    />

                                    <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                        Upload a video to start
                                    </Typography>

                                    <Typography sx={{ color: "rgba(255,255,255,0.58)", maxWidth: 560 }}>
                                        After upload, the first decoded frame is drawn into the canvas immediately.
                                        Timeline boxes control video filters, audio filters, drawing, and text overlays.
                                    </Typography>
                                </Stack>
                            )}
                        </Box>

                        <TransportControls
                            videoUrl={videoUrl}
                            isPlaying={isPlaying}
                            isExporting={isExporting}
                            duration={duration}
                            currentTime={currentTime}
                            trimStart={trimStart}
                            trimEnd={trimEnd}
                            onPlayPause={handlePlayPause}
                            onRestart={handleRestart}
                            onSeek={handleSeek}
                            onTrimStartChange={updateTrimStart}
                            onTrimEndChange={updateTrimEnd}
                        />

                        <TimelineToolbar
                            videoUrl={videoUrl}
                            timelineZoom={timelineZoom}
                            setTimelineZoom={setTimelineZoom}
                            snapEnabled={snapEnabled}
                            setSnapEnabled={setSnapEnabled}
                            snapStep={snapStep}
                            setSnapStep={setSnapStep}
                            addMarkerAtPlayhead={addMarkerAtPlayhead}
                            totalClipCount={totalClipCount}
                            markerCount={markers.length}
                        />

                        <TimelineView
                            duration={duration}
                            currentTime={currentTime}
                            trimStart={trimStart}
                            trimEnd={trimEnd || duration}
                            visualClips={visualClips}
                            audioClips={audioClips}
                            drawingClips={drawingClips}
                            selectedKind={selectedKind}
                            selectedClipId={selectedClipId}
                            selectedKeyframeId={selectedKeyframeId}
                            snapEnabled={snapEnabled}
                            snapStep={snapStep}
                            zoom={timelineZoom}
                            markers={markers}
                            onSeek={handleSeek}
                            onSelectClip={selectClip}
                            onSelectKeyframe={setSelectedKeyframeId}
                            onUpdateClipTiming={updateClipTiming}
                            onUpdateKeyframeTime={updateKeyframeTime}
                            onDeleteMarker={deleteMarker}
                        />

                        <GlassCard sx={{ p: 1.5, backgroundColor: "rgba(0,0,0,0.18)" }}>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1.25}
                                alignItems={{ xs: "stretch", md: "center" }}
                                justifyContent="space-between"
                            >
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    <SupportChip good={support.mediaRecorder} label={support.mediaRecorder ? "MediaRecorder ready" : "No MediaRecorder"} />
                                    <SupportChip good={support.canvasCapture} label={support.canvasCapture ? "Canvas export ready" : "No Canvas capture"} />
                                    <SupportChip good={support.pointerEvents} label={support.pointerEvents ? "Pointer drawing ready" : "No Pointer Events"} />
                                    <SupportChip good={support.webAudio} label={support.webAudio ? "Web Audio ready" : "No Web Audio"} />
                                </Stack>

                                <Stack spacing={0.75} sx={{ minWidth: { md: 220 } }}>
                                    <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: 13, fontWeight: 850 }}>
                                        Audio Meter
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={audioMeter * 100}
                                        sx={{
                                            height: 8,
                                            borderRadius: 999,
                                            backgroundColor: "rgba(255,255,255,0.08)",
                                            "& .MuiLinearProgress-bar": {
                                                borderRadius: 999,
                                                background: "linear-gradient(135deg, #7ef4b6, #9ee8ff)",
                                            },
                                        }}
                                    />
                                </Stack>
                            </Stack>
                        </GlassCard>

                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                            {status}
                        </Typography>
                    </Stack>
                </GlassCard>
            </Grid>

            <Grid item xs={12} lg={4}>
                <Stack spacing={2.5}>
                    <AddClipPanel
                        videoUrl={videoUrl}
                        addVisualClip={addVisualClip}
                        addAudioClip={addAudioClip}
                        addDrawingClip={addDrawingClip}
                        addTextBox={addTextBox}
                    />

                    <SelectedClipPanel
                        selectedClip={selectedClip}
                        selectedKind={selectedKind}
                        updateSelectedClipPatch={updateSelectedClipPatch}
                        deleteSelectedClip={deleteSelectedClip}
                        duplicateSelectedClip={duplicateSelectedClip}
                        splitSelectedClipAtPlayhead={splitSelectedClipAtPlayhead}
                        nudgeSelectedClip={nudgeSelectedClip}
                    />

                    <ParameterEditor
                        title={selectedParamType === "audio" ? "Audio Effect Parameters" : "Video Filter Parameters"}
                        icon={selectedParamType === "audio" ? <GraphicEqRounded sx={{ color: "#7ef4b6" }} /> : <TuneRounded sx={{ color: "#9ee8ff" }} />}
                        clip={selectedParamClip}
                        keyframe={selectedKeyframe}
                        paramDefs={selectedParamDefs}
                        presets={selectedPresets}
                        color={selectedParamColor}
                        onAddKeyframe={addKeyframeAtPlayhead}
                        onDeleteKeyframe={deleteSelectedKeyframe}
                        onUpdateKeyframeTime={updateSelectedKeyframeTime}
                        onUpdateParam={updateSelectedKeyframeValue}
                        onApplyPreset={applyPresetToSelectedKeyframe}
                    />

                    <DrawingPanel
                        videoUrl={videoUrl}
                        drawingMode={drawingMode}
                        setDrawingMode={setDrawingMode}
                        brush={brush}
                        updateBrush={updateBrush}
                        selectedDrawingClip={selectedDrawingClip}
                        undoLastStroke={undoLastStroke}
                        clearSelectedDrawingStrokes={clearSelectedDrawingStrokes}
                    />

                    <TextPanel
                        selectedText={selectedText}
                        textBoxes={textBoxes}
                        selectedTextId={selectedTextId}
                        setSelectedTextId={(id) => {
                            setSelectedTextId(id);
                            setSelectedKind(null);
                            setSelectedClipId(null);
                            setSelectedKeyframeId(null);
                            setDrawingMode(false);
                        }}
                        updateSelectedText={updateSelectedText}
                        deleteSelectedText={deleteSelectedText}
                    />

                    <PlaybackExportPanel
                        videoUrl={videoUrl}
                        volume={volume}
                        setVolume={setVolume}
                        speed={speed}
                        setSpeed={(nextSpeed) => {
                            setSpeed(nextSpeed);

                            if (videoRef.current) {
                                videoRef.current.playbackRate = nextSpeed;
                            }
                        }}
                        exportFps={exportFps}
                        setExportFps={setExportFps}
                        isExporting={isExporting}
                        exportWebM={exportWebM}
                        downloadUrl={downloadUrl}
                        fileName={fileName}
                    />
                </Stack>
            </Grid>
        </Grid>
    );
}

function statusChipSx(color) {
    return {
        color,
        fontWeight: 900,
        backgroundColor: "rgba(0,0,0,0.52)",
        border: `1px solid ${alpha(color, 0.24)}`,
    };
}

function TimelineToolbar({
                             videoUrl,
                             timelineZoom,
                             setTimelineZoom,
                             snapEnabled,
                             setSnapEnabled,
                             snapStep,
                             setSnapStep,
                             addMarkerAtPlayhead,
                             totalClipCount,
                             markerCount,
                         }) {
    return (
        <GlassCard sx={{ p: 1.5, backgroundColor: "rgba(0,0,0,0.16)" }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.25}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
            >
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={`${totalClipCount} clips`} sx={toolbarChipSx} />
                    <Chip label={`${markerCount} markers`} sx={toolbarChipSx} />
                    <Chip label={snapEnabled ? `Snap ${snapStep}s` : "Snap off"} sx={toolbarChipSx} />
                    <Chip label={`Zoom ${timelineZoom.toFixed(1)}x`} sx={toolbarChipSx} />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                    <Button
                        disabled={!videoUrl}
                        onClick={addMarkerAtPlayhead}
                        startIcon={<AddRounded />}
                        sx={miniControlSx}
                    >
                        Marker
                    </Button>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontWeight: 850, fontSize: 13 }}>
                            Snap
                        </Typography>
                        <Switch
                            checked={snapEnabled}
                            onChange={(event) => setSnapEnabled(event.target.checked)}
                        />
                    </Stack>

                    <TextField
                        select
                        size="small"
                        label="Snap Step"
                        value={snapStep}
                        onChange={(event) => setSnapStep(Number(event.target.value))}
                        sx={{ ...smallTextFieldSx, minWidth: 125 }}
                    >
                        {[0.01, 0.05, 0.1, 0.25, 0.5, 1].map((step) => (
                            <MenuItem key={step} value={step}>
                                {step}s
                            </MenuItem>
                        ))}
                    </TextField>

                    <Box sx={{ width: { xs: "100%", sm: 150 } }}>
                        <Slider
                            min={1}
                            max={4}
                            step={0.25}
                            value={timelineZoom}
                            onChange={(_, value) => setTimelineZoom(Number(value))}
                            sx={{ color: "#9ee8ff" }}
                        />
                    </Box>
                </Stack>
            </Stack>
        </GlassCard>
    );
}

const toolbarChipSx = {
    color: "white",
    fontWeight: 850,
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
};

function AddClipPanel({ videoUrl, addVisualClip, addAudioClip, addDrawingClip, addTextBox }) {
    return (
        <GlassCard>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <LayersRounded sx={{ color: "#9ee8ff" }} />
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Add Timeline Clips
                    </Typography>
                </Stack>

                <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.65 }}>
                    Visual and audio filters are both applied as timeline boxes with keyframed parameters.
                </Typography>

                <Typography sx={{ fontWeight: 950, color: "#9ee8ff" }}>
                    Video FX
                </Typography>

                <Grid container spacing={1}>
                    {Object.entries(VISUAL_PRESETS).map(([presetName, preset]) => (
                        <Grid item xs={6} key={presetName}>
                            <Button
                                fullWidth
                                disabled={!videoUrl}
                                onClick={() => addVisualClip(presetName)}
                                startIcon={<TuneRounded />}
                                sx={smallActionButtonSx("#9ee8ff")}
                            >
                                {preset.label}
                            </Button>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                <Typography sx={{ fontWeight: 950, color: "#7ef4b6" }}>
                    Audio FX
                </Typography>

                <Grid container spacing={1}>
                    {Object.entries(AUDIO_PRESETS).map(([presetName, preset]) => (
                        <Grid item xs={6} key={presetName}>
                            <Button
                                fullWidth
                                disabled={!videoUrl}
                                onClick={() => addAudioClip(presetName)}
                                startIcon={<GraphicEqRounded />}
                                sx={smallActionButtonSx("#7ef4b6")}
                            >
                                {preset.label}
                            </Button>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Button
                        disabled={!videoUrl}
                        onClick={addDrawingClip}
                        startIcon={<BrushRounded />}
                        sx={smallActionButtonSx("#b38cff")}
                    >
                        Add Drawing Clip
                    </Button>

                    <Button
                        disabled={!videoUrl}
                        onClick={addTextBox}
                        startIcon={<TextFieldsRounded />}
                        sx={miniControlSx}
                    >
                        Add Text
                    </Button>
                </Stack>
            </Stack>
        </GlassCard>
    );
}

function smallActionButtonSx(color) {
    return {
        justifyContent: "flex-start",
        borderRadius: 999,
        color,
        fontWeight: 900,
        border: `1px solid ${alpha(color, 0.24)}`,
        backgroundColor: alpha(color, 0.055),
        "&:hover": {
            backgroundColor: alpha(color, 0.11),
        },
        "&.Mui-disabled": {
            color: "rgba(255,255,255,0.25)",
            borderColor: "rgba(255,255,255,0.08)",
        },
    };
}

function SelectedClipPanel({
                               selectedClip,
                               selectedKind,
                               updateSelectedClipPatch,
                               deleteSelectedClip,
                               duplicateSelectedClip,
                               splitSelectedClipAtPlayhead,
                               nudgeSelectedClip,
                           }) {
    return (
        <GlassCard>
            <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TimelineRounded sx={{ color: "#9ee8ff" }} />
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Selected Clip Controls
                    </Typography>
                </Stack>

                {selectedClip ? (
                    <>
                        <TextField
                            label="Clip Label"
                            size="small"
                            value={selectedClip.label}
                            onChange={(event) => updateSelectedClipPatch({ label: event.target.value })}
                            sx={smallTextFieldSx}
                        />

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                                label={selectedKind === "visual" ? "Video FX" : selectedKind === "audio" ? "Audio FX" : "Drawing"}
                                sx={toolbarChipSx}
                            />
                            <Chip
                                label={`${formatTime(selectedClip.start)} - ${formatTime(selectedClip.end)}`}
                                sx={toolbarChipSx}
                            />
                            <Chip
                                label={selectedClip.locked ? "Locked" : "Unlocked"}
                                sx={toolbarChipSx}
                            />
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Typography sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 850 }}>
                                Enabled
                            </Typography>
                            <Switch
                                checked={selectedClip.enabled !== false}
                                onChange={(event) => updateSelectedClipPatch({ enabled: event.target.checked })}
                            />
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Typography sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 850 }}>
                                Lock Clip
                            </Typography>
                            <Switch
                                checked={Boolean(selectedClip.locked)}
                                onChange={(event) => updateSelectedClipPatch({ locked: event.target.checked })}
                            />
                        </Stack>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Button
                                onClick={() => nudgeSelectedClip("move", -0.1)}
                                disabled={selectedClip.locked}
                                startIcon={<ChevronLeftRounded />}
                                sx={miniControlSx}
                            >
                                Move
                            </Button>
                            <Button
                                onClick={() => nudgeSelectedClip("move", 0.1)}
                                disabled={selectedClip.locked}
                                endIcon={<ChevronRightRounded />}
                                sx={miniControlSx}
                            >
                                Move
                            </Button>
                            <Button
                                onClick={() => nudgeSelectedClip("start", -0.1)}
                                disabled={selectedClip.locked}
                                startIcon={<ChevronLeftRounded />}
                                sx={miniControlSx}
                            >
                                Start
                            </Button>
                            <Button
                                onClick={() => nudgeSelectedClip("start", 0.1)}
                                disabled={selectedClip.locked}
                                endIcon={<ChevronRightRounded />}
                                sx={miniControlSx}
                            >
                                Start
                            </Button>
                            <Button
                                onClick={() => nudgeSelectedClip("end", -0.1)}
                                disabled={selectedClip.locked}
                                startIcon={<ChevronLeftRounded />}
                                sx={miniControlSx}
                            >
                                End
                            </Button>
                            <Button
                                onClick={() => nudgeSelectedClip("end", 0.1)}
                                disabled={selectedClip.locked}
                                endIcon={<ChevronRightRounded />}
                                sx={miniControlSx}
                            >
                                End
                            </Button>
                        </Stack>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Button
                                onClick={duplicateSelectedClip}
                                startIcon={<AddRounded />}
                                sx={miniControlSx}
                            >
                                Duplicate
                            </Button>

                            <Button
                                onClick={splitSelectedClipAtPlayhead}
                                disabled={selectedClip.locked}
                                startIcon={<ContentCutRounded />}
                                sx={miniControlSx}
                            >
                                Split
                            </Button>

                            <Button
                                onClick={() => updateSelectedClipPatch({ locked: !selectedClip.locked })}
                                startIcon={selectedClip.locked ? <LockOpenRounded /> : <LockRounded />}
                                sx={miniControlSx}
                            >
                                {selectedClip.locked ? "Unlock" : "Lock"}
                            </Button>
                        </Stack>

                        <Button
                            color="error"
                            onClick={deleteSelectedClip}
                            startIcon={<DeleteRounded />}
                            sx={{ borderRadius: 999, fontWeight: 900, alignSelf: "flex-start" }}
                        >
                            Delete Clip
                        </Button>
                    </>
                ) : (
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", lineHeight: 1.7 }}>
                        Click a timeline box to move it, resize it, lock it, duplicate it,
                        split it at the playhead, or edit its keyframes.
                    </Typography>
                )}
            </Stack>
        </GlassCard>
    );
}

function DrawingPanel({
                          videoUrl,
                          drawingMode,
                          setDrawingMode,
                          brush,
                          updateBrush,
                          selectedDrawingClip,
                          undoLastStroke,
                          clearSelectedDrawingStrokes,
                      }) {
    return (
        <GlassCard>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <BrushRounded sx={{ color: "#b38cff" }} />
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Drawing Brush
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 850 }}>
                        Drawing Mode
                    </Typography>
                    <Switch
                        disabled={!videoUrl}
                        checked={drawingMode}
                        onChange={(event) => setDrawingMode(event.target.checked)}
                    />
                </Stack>

                <TextField
                    label="Brush Color"
                    type="color"
                    size="small"
                    value={brush.color}
                    onChange={(event) => updateBrush({ color: event.target.value })}
                    sx={smallTextFieldSx}
                />

                <EditorSlider
                    label="Size"
                    value={brush.size}
                    min={1}
                    max={80}
                    step={1}
                    color="#b38cff"
                    display={`${brush.size}px`}
                    onChange={(value) => updateBrush({ size: value })}
                />

                <EditorSlider
                    label="Opacity"
                    value={brush.opacity}
                    min={1}
                    max={100}
                    step={1}
                    color="#b38cff"
                    display={`${brush.opacity}%`}
                    onChange={(value) => updateBrush({ opacity: value })}
                />

                <EditorSlider
                    label="Fade In"
                    value={brush.fadeIn}
                    min={0}
                    max={3}
                    step={0.05}
                    color="#b38cff"
                    display={`${brush.fadeIn.toFixed(2)}s`}
                    onChange={(value) => updateBrush({ fadeIn: value })}
                />

                <EditorSlider
                    label="Fade Out"
                    value={brush.fadeOut}
                    min={0}
                    max={3}
                    step={0.05}
                    color="#b38cff"
                    display={`${brush.fadeOut.toFixed(2)}s`}
                    onChange={(value) => updateBrush({ fadeOut: value })}
                />

                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 850 }}>
                        Use pressure
                    </Typography>
                    <Switch
                        checked={brush.usePressure}
                        onChange={(event) => updateBrush({ usePressure: event.target.checked })}
                    />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 850 }}>
                        Reveal stroke over time
                    </Typography>
                    <Switch
                        checked={brush.revealOverTime}
                        onChange={(event) => updateBrush({ revealOverTime: event.target.checked })}
                    />
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Button
                        onClick={undoLastStroke}
                        disabled={!selectedDrawingClip || selectedDrawingClip.locked}
                        sx={miniControlSx}
                    >
                        Undo Stroke
                    </Button>
                    <Button
                        onClick={clearSelectedDrawingStrokes}
                        disabled={!selectedDrawingClip || selectedDrawingClip.locked}
                        sx={miniControlSx}
                    >
                        Clear Drawing
                    </Button>
                </Stack>
            </Stack>
        </GlassCard>
    );
}

function TextPanel({
                       selectedText,
                       textBoxes,
                       selectedTextId,
                       setSelectedTextId,
                       updateSelectedText,
                       deleteSelectedText,
                   }) {
    return (
        <GlassCard>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextFieldsRounded sx={{ color: "#9ee8ff" }} />
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Text Overlays
                    </Typography>
                </Stack>

                {textBoxes.length > 0 && (
                    <TextField
                        select
                        label="Select text box"
                        size="small"
                        value={selectedTextId || ""}
                        onChange={(event) => setSelectedTextId(event.target.value)}
                        sx={smallTextFieldSx}
                    >
                        {textBoxes.map((box, index) => (
                            <MenuItem key={box.id} value={box.id}>
                                Text {index + 1}: {String(box.text).slice(0, 20)}
                            </MenuItem>
                        ))}
                    </TextField>
                )}

                {selectedText ? (
                    <>
                        <TextField
                            label="Text Color"
                            type="color"
                            size="small"
                            value={selectedText.color}
                            onChange={(event) => updateSelectedText({ color: event.target.value })}
                            sx={smallTextFieldSx}
                        />

                        <TextField
                            select
                            label="Text Align"
                            size="small"
                            value={selectedText.align}
                            onChange={(event) => updateSelectedText({ align: event.target.value })}
                            sx={smallTextFieldSx}
                        >
                            <MenuItem value="left">Left</MenuItem>
                            <MenuItem value="center">Center</MenuItem>
                            <MenuItem value="right">Right</MenuItem>
                        </TextField>

                        <EditorSlider
                            label="Font Size"
                            value={selectedText.fontSize}
                            min={12}
                            max={140}
                            step={1}
                            display={`${selectedText.fontSize}px`}
                            onChange={(value) => updateSelectedText({ fontSize: value })}
                        />

                        <EditorSlider
                            label="Font Weight"
                            value={selectedText.fontWeight}
                            min={100}
                            max={1000}
                            step={50}
                            display={`${selectedText.fontWeight}`}
                            onChange={(value) => updateSelectedText({ fontWeight: value })}
                        />

                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Typography sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 850 }}>
                                Shadow
                            </Typography>
                            <Switch
                                checked={selectedText.shadow}
                                onChange={(event) => updateSelectedText({ shadow: event.target.checked })}
                            />
                        </Stack>

                        <Button
                            color="error"
                            onClick={deleteSelectedText}
                            startIcon={<DeleteRounded />}
                            sx={{ borderRadius: 999, fontWeight: 900, alignSelf: "flex-start" }}
                        >
                            Delete Text
                        </Button>
                    </>
                ) : (
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", lineHeight: 1.7 }}>
                        Add text from the clip panel, then select it here or click it in the preview.
                    </Typography>
                )}
            </Stack>
        </GlassCard>
    );
}

function PlaybackExportPanel({
                                 videoUrl,
                                 volume,
                                 setVolume,
                                 speed,
                                 setSpeed,
                                 exportFps,
                                 setExportFps,
                                 isExporting,
                                 exportWebM,
                                 downloadUrl,
                                 fileName,
                             }) {
    return (
        <GlassCard>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <VolumeUpRounded sx={{ color: "#7ef4b6" }} />
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Playback and Export
                    </Typography>
                </Stack>

                <EditorSlider
                    label="Volume"
                    value={volume}
                    min={0}
                    max={1}
                    step={0.01}
                    color="#7ef4b6"
                    display={`${Math.round(volume * 100)}%`}
                    onChange={setVolume}
                />

                <EditorSlider
                    label="Speed"
                    value={speed}
                    min={0.25}
                    max={2}
                    step={0.05}
                    color="#9ee8ff"
                    display={`${speed.toFixed(2)}x`}
                    onChange={setSpeed}
                />

                <TextField
                    select
                    label="Export FPS"
                    size="small"
                    value={exportFps}
                    onChange={(event) => setExportFps(Number(event.target.value))}
                    sx={smallTextFieldSx}
                >
                    {[24, 30, 60].map((fps) => (
                        <MenuItem key={fps} value={fps}>
                            {fps} FPS
                        </MenuItem>
                    ))}
                </TextField>

                <Button
                    disabled={!videoUrl || isExporting}
                    onClick={exportWebM}
                    startIcon={<FileDownloadRounded />}
                    variant="contained"
                    sx={primaryPillSx}
                >
                    {isExporting ? "Exporting..." : "Export WebM"}
                </Button>

                {downloadUrl && (
                    <Button
                        href={downloadUrl}
                        download={`edited-${fileName || "video"}.webm`}
                        startIcon={<FileDownloadRounded />}
                        sx={miniControlSx}
                    >
                        Download Export
                    </Button>
                )}
            </Stack>
        </GlassCard>
    );
}