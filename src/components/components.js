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
    CloudUploadRounded,
    DeleteRounded,
    FileDownloadRounded,
    HomeRounded,
    KeyRounded,
    MovieCreationRounded,
    PauseRounded,
    PlayArrowRounded,
    RestartAltRounded,
    TextFieldsRounded,
    TimelineRounded,
    TuneRounded,
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

const NEUTRAL_FILTER_VALUES = {
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

const FILTER_PARAMETERS = [
    {
        key: "brightness",
        label: "Brightness",
        min: 0,
        max: 250,
        step: 1,
        unit: "%",
        neutral: 100,
    },
    {
        key: "contrast",
        label: "Contrast",
        min: 0,
        max: 250,
        step: 1,
        unit: "%",
        neutral: 100,
    },
    {
        key: "saturation",
        label: "Saturation",
        min: 0,
        max: 300,
        step: 1,
        unit: "%",
        neutral: 100,
    },
    {
        key: "blur",
        label: "Blur",
        min: 0,
        max: 40,
        step: 0.25,
        unit: "px",
        neutral: 0,
    },
    {
        key: "grayscale",
        label: "Grayscale",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        neutral: 0,
    },
    {
        key: "sepia",
        label: "Sepia",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        neutral: 0,
    },
    {
        key: "hue",
        label: "Hue Rotate",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
        neutral: 0,
    },
    {
        key: "opacity",
        label: "Opacity",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        neutral: 100,
    },
    {
        key: "sharpen",
        label: "Sharpen",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        neutral: 0,
    },
    {
        key: "noise",
        label: "Noise",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        neutral: 0,
    },
    {
        key: "vignette",
        label: "Vignette",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        neutral: 0,
    },
];

const EFFECT_PRESETS = {
    clean: {
        label: "Clean",
        values: {
            ...NEUTRAL_FILTER_VALUES,
        },
    },
    cinematic: {
        label: "Cinematic",
        values: {
            brightness: 96,
            contrast: 126,
            saturation: 88,
            blur: 0,
            grayscale: 0,
            sepia: 10,
            hue: -4,
            opacity: 100,
            sharpen: 12,
            noise: 0,
            vignette: 38,
        },
    },
    flash: {
        label: "Flash",
        values: {
            brightness: 165,
            contrast: 120,
            saturation: 115,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            hue: 0,
            opacity: 100,
            sharpen: 0,
            noise: 0,
            vignette: 0,
        },
    },
    dream: {
        label: "Dream Blur",
        values: {
            brightness: 112,
            contrast: 92,
            saturation: 132,
            blur: 5,
            grayscale: 0,
            sepia: 6,
            hue: 8,
            opacity: 100,
            sharpen: 0,
            noise: 0,
            vignette: 18,
        },
    },
    vintage: {
        label: "Vintage",
        values: {
            brightness: 104,
            contrast: 112,
            saturation: 78,
            blur: 0,
            grayscale: 8,
            sepia: 42,
            hue: -8,
            opacity: 100,
            sharpen: 5,
            noise: 18,
            vignette: 28,
        },
    },
    fadeOut: {
        label: "Fade Out",
        values: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            hue: 0,
            opacity: 0,
            sharpen: 0,
            noise: 0,
            vignette: 0,
        },
    },
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

function makeId(prefix) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTime(value) {
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
    const minutes = Math.floor(safe / 60);
    const seconds = Math.floor(safe % 60);
    const tenths = Math.floor((safe % 1) * 10);

    return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function interpolateValues(a, b, amount) {
    const output = {};

    FILTER_PARAMETERS.forEach((param) => {
        output[param.key] = lerp(
            Number(a?.[param.key] ?? param.neutral),
            Number(b?.[param.key] ?? param.neutral),
            amount
        );
    });

    return output;
}

function sortKeyframes(keyframes) {
    return [...keyframes].sort((a, b) => a.time - b.time);
}

function evaluateKeyframes(keyframes, time) {
    const sorted = sortKeyframes(keyframes);

    if (!sorted.length) {
        return { ...NEUTRAL_FILTER_VALUES };
    }

    if (time <= sorted[0].time) {
        return {
            ...NEUTRAL_FILTER_VALUES,
            ...sorted[0].values,
        };
    }

    if (time >= sorted[sorted.length - 1].time) {
        return {
            ...NEUTRAL_FILTER_VALUES,
            ...sorted[sorted.length - 1].values,
        };
    }

    for (let index = 0; index < sorted.length - 1; index += 1) {
        const current = sorted[index];
        const next = sorted[index + 1];

        if (time >= current.time && time <= next.time) {
            const span = Math.max(0.001, next.time - current.time);
            const amount = clamp((time - current.time) / span, 0, 1);

            return interpolateValues(current.values, next.values, amount);
        }
    }

    return { ...NEUTRAL_FILTER_VALUES };
}

function combineActiveEffects(effectClips, time) {
    const combined = { ...NEUTRAL_FILTER_VALUES };

    effectClips
        .filter((clip) => clip.enabled !== false)
        .filter((clip) => time >= clip.start && time <= clip.end)
        .forEach((clip) => {
            const values = evaluateKeyframes(clip.keyframes, time);

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

function hexToRgba(hex, alphaValue) {
    const cleaned = String(hex || "#ffffff").replace("#", "");
    const bigint = parseInt(cleaned.length === 3
        ? cleaned.split("").map((char) => char + char).join("")
        : cleaned, 16);

    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alphaValue})`;
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
            const brush = {
                ...DEFAULT_BRUSH,
                ...clip.brush,
            };

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

                    const previousPressure = brush.usePressure
                        ? clamp(previous.pressure || 0.5, 0.12, 1)
                        : 1;
                    const currentPressure = brush.usePressure
                        ? clamp(current.pressure || 0.5, 0.12, 1)
                        : 1;

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
                                Timeline Drawing Editor
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

export function BrowserVideoEditor() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const previewRef = useRef(null);
    const animationFrameRef = useRef(null);
    const isExportingRef = useRef(false);
    const selectedTextIdRef = useRef(null);
    const downloadUrlRef = useRef(null);
    const dragTextIdRef = useRef(null);
    const drawingStrokeRef = useRef(null);

    const [videoUrl, setVideoUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [range, setRange] = useState([0, 0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [status, setStatus] = useState("Upload a video to start editing.");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [aspectRatio, setAspectRatio] = useState("16 / 9");

    const [volume, setVolume] = useState(1);
    const [speed, setSpeed] = useState(1);

    const [textBoxes, setTextBoxes] = useState([]);
    const [selectedTextId, setSelectedTextId] = useState(null);

    const [effectClips, setEffectClips] = useState([]);
    const [selectedEffectId, setSelectedEffectId] = useState(null);
    const [selectedKeyframeId, setSelectedKeyframeId] = useState(null);

    const [drawingClips, setDrawingClips] = useState([]);
    const [selectedDrawingClipId, setSelectedDrawingClipId] = useState(null);
    const [drawingMode, setDrawingMode] = useState(false);
    const [brush, setBrush] = useState({ ...DEFAULT_BRUSH });

    const trimStart = range[0] || 0;
    const trimEnd = range[1] || duration || 0;

    const selectedText = useMemo(
        () => textBoxes.find((box) => box.id === selectedTextId) || null,
        [textBoxes, selectedTextId]
    );

    const selectedEffect = useMemo(
        () => effectClips.find((clip) => clip.id === selectedEffectId) || null,
        [effectClips, selectedEffectId]
    );

    const selectedKeyframe = useMemo(() => {
        if (!selectedEffect) {
            return null;
        }

        return selectedEffect.keyframes.find((keyframe) => keyframe.id === selectedKeyframeId) || null;
    }, [selectedEffect, selectedKeyframeId]);

    const selectedDrawingClip = useMemo(
        () => drawingClips.find((clip) => clip.id === selectedDrawingClipId) || null,
        [drawingClips, selectedDrawingClipId]
    );

    const activeValues = useMemo(
        () => combineActiveEffects(effectClips, currentTime),
        [effectClips, currentTime]
    );

    const support = useMemo(() => {
        if (typeof window === "undefined") {
            return {
                mediaRecorder: false,
                canvasCapture: false,
                pointerEvents: false,
                pressure: false,
            };
        }

        return {
            mediaRecorder: "MediaRecorder" in window,
            canvasCapture: Boolean(window.HTMLCanvasElement?.prototype?.captureStream),
            pointerEvents: "PointerEvent" in window,
            pressure: "PointerEvent" in window,
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
        const values = combineActiveEffects(effectClips, frameTime);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.filter = filterString(values);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        drawSharpen(ctx, canvas.width, canvas.height, values.sharpen);
        drawNoise(ctx, canvas.width, canvas.height, values.noise);
        drawVignette(ctx, canvas.width, canvas.height, values.vignette);

        drawDrawingClips(ctx, drawingClips, frameTime, canvas.width, canvas.height);

        const shouldSkipSelected = !isExportingRef.current;

        textBoxes.forEach((box) => {
            if (shouldSkipSelected && box.id === selectedTextIdRef.current) {
                return;
            }

            drawTextBox(ctx, box, canvas.width, canvas.height);
        });
    }, [effectClips, drawingClips, textBoxes]);

    useEffect(() => {
        if (!videoUrl) {
            return undefined;
        }

        const render = () => {
            drawFrame();
            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [videoUrl, drawFrame]);

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
                resolve();
            };

            video.addEventListener("seeked", finish, { once: true });
            video.currentTime = targetTime;

            setTimeout(finish, 450);
        });
    }, []);

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
            downloadUrlRef.current = null;
        }

        const nextUrl = URL.createObjectURL(file);

        setVideoUrl(nextUrl);
        setFileName(file.name);
        setDuration(0);
        setCurrentTime(0);
        setRange([0, 0]);
        setIsPlaying(false);
        setDownloadUrl("");
        setStatus("Video loaded. Waiting for metadata...");
        setSelectedTextId(null);
        setTextBoxes([]);
        setEffectClips([]);
        setSelectedEffectId(null);
        setSelectedKeyframeId(null);
        setDrawingClips([]);
        setSelectedDrawingClipId(null);
        setDrawingMode(false);
    };

    const handleLoadedMetadata = () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;

        setDuration(nextDuration);
        setRange([0, nextDuration]);
        setAspectRatio(`${video.videoWidth || 16} / ${video.videoHeight || 9}`);
        setStatus("Ready. Add effect clips, drawing clips, and keyframes.");
        drawFrame();
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        setCurrentTime(video.currentTime);

        if (trimEnd > trimStart && video.currentTime >= trimEnd) {
            video.pause();
            setIsPlaying(false);
        }
    };

    const handlePlayPause = async () => {
        const video = videoRef.current;

        if (!videoUrl || !video) {
            setStatus("Upload a video first.");
            return;
        }

        video.volume = volume;
        video.playbackRate = speed;

        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
            return;
        }

        if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
            await seekTo(trimStart);
        }

        try {
            await video.play();
            setIsPlaying(true);
            setStatus("Preview playing with filters and drawing layers.");
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
        setCurrentTime(trimStart);
        drawFrame();
    };

    const handleRangeChange = async (_, value) => {
        if (!Array.isArray(value)) {
            return;
        }

        const start = clamp(value[0], 0, duration);
        const end = clamp(value[1], start + 0.1, duration);

        setRange([start, end]);

        const video = videoRef.current;

        if (video && (video.currentTime < start || video.currentTime > end)) {
            video.currentTime = start;
            setCurrentTime(start);
        }
    };

    const handlePlayheadChange = async (_, value) => {
        const nextTime = clamp(Number(value), trimStart, trimEnd || duration);

        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }

        await seekTo(nextTime);
        drawFrame();
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
        setStatus("Text box added. Drag the move handle to position it.");
    };

    const updateSelectedText = (patch) => {
        if (!selectedTextId) {
            return;
        }

        setTextBoxes((previous) =>
            previous.map((box) =>
                box.id === selectedTextId
                    ? {
                        ...box,
                        ...patch,
                    }
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
                    ? {
                        ...box,
                        x,
                        y,
                    }
                    : box
            )
        );
    };

    const endTextDrag = (event) => {
        dragTextIdRef.current = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
    };

    const addEffectClip = (presetName = "cinematic") => {
        if (!videoUrl) {
            setStatus("Upload a video before adding an effect clip.");
            return;
        }

        const preset = EFFECT_PRESETS[presetName] || EFFECT_PRESETS.cinematic;
        const safeStart = clamp(currentTime || trimStart, trimStart, Math.max(trimStart, trimEnd - 0.25));
        const safeEnd = clamp(safeStart + 3, safeStart + 0.25, trimEnd || duration || safeStart + 3);

        const clipNumber = effectClips.length + 1;
        const clipId = makeId("effect");
        const firstKeyframeId = makeId("keyframe");
        const secondKeyframeId = makeId("keyframe");

        const nextClip = {
            id: clipId,
            label: `${preset.label} ${clipNumber}`,
            enabled: true,
            start: safeStart,
            end: safeEnd,
            keyframes: [
                {
                    id: firstKeyframeId,
                    time: safeStart,
                    values: {
                        ...NEUTRAL_FILTER_VALUES,
                    },
                },
                {
                    id: secondKeyframeId,
                    time: safeEnd,
                    values: {
                        ...preset.values,
                    },
                },
            ],
        };

        setEffectClips((previous) => [...previous, nextClip]);
        setSelectedEffectId(clipId);
        setSelectedKeyframeId(secondKeyframeId);
        setStatus("Effect clip added. Select keyframes and adjust filter parameter values.");
    };

    const deleteSelectedEffect = () => {
        if (!selectedEffectId) {
            return;
        }

        setEffectClips((previous) => previous.filter((clip) => clip.id !== selectedEffectId));
        setSelectedEffectId(null);
        setSelectedKeyframeId(null);
        setStatus("Effect clip deleted.");
    };

    const updateSelectedEffect = (patch) => {
        if (!selectedEffectId) {
            return;
        }

        setEffectClips((previous) =>
            previous.map((clip) =>
                clip.id === selectedEffectId
                    ? {
                        ...clip,
                        ...patch,
                    }
                    : clip
            )
        );
    };

    const updateSelectedEffectRange = (_, value) => {
        if (!selectedEffect || !Array.isArray(value)) {
            return;
        }

        const start = clamp(value[0], trimStart, trimEnd);
        const end = clamp(value[1], start + 0.1, trimEnd);

        setEffectClips((previous) =>
            previous.map((clip) => {
                if (clip.id !== selectedEffect.id) {
                    return clip;
                }

                return {
                    ...clip,
                    start,
                    end,
                    keyframes: clip.keyframes.map((keyframe) => ({
                        ...keyframe,
                        time: clamp(keyframe.time, start, end),
                    })),
                };
            })
        );
    };

    const addKeyframeAtPlayhead = () => {
        if (!selectedEffect) {
            setStatus("Select an effect clip before adding a keyframe.");
            return;
        }

        const time = clamp(currentTime, selectedEffect.start, selectedEffect.end);
        const currentValues = evaluateKeyframes(selectedEffect.keyframes, time);
        const keyframeId = makeId("keyframe");

        setEffectClips((previous) =>
            previous.map((clip) => {
                if (clip.id !== selectedEffect.id) {
                    return clip;
                }

                return {
                    ...clip,
                    keyframes: sortKeyframes([
                        ...clip.keyframes,
                        {
                            id: keyframeId,
                            time,
                            values: currentValues,
                        },
                    ]),
                };
            })
        );

        setSelectedKeyframeId(keyframeId);
        setStatus(`Keyframe added at ${formatTime(time)}.`);
    };

    const deleteSelectedKeyframe = () => {
        if (!selectedEffect || !selectedKeyframe) {
            return;
        }

        if (selectedEffect.keyframes.length <= 1) {
            setStatus("An effect clip needs at least one keyframe.");
            return;
        }

        const remaining = selectedEffect.keyframes.filter((keyframe) => keyframe.id !== selectedKeyframe.id);

        setEffectClips((previous) =>
            previous.map((clip) =>
                clip.id === selectedEffect.id
                    ? {
                        ...clip,
                        keyframes: remaining,
                    }
                    : clip
            )
        );

        setSelectedKeyframeId(remaining[0]?.id || null);
        setStatus("Keyframe deleted.");
    };

    const updateSelectedKeyframe = (patch) => {
        if (!selectedEffect || !selectedKeyframe) {
            return;
        }

        setEffectClips((previous) =>
            previous.map((clip) => {
                if (clip.id !== selectedEffect.id) {
                    return clip;
                }

                return {
                    ...clip,
                    keyframes: sortKeyframes(
                        clip.keyframes.map((keyframe) =>
                            keyframe.id === selectedKeyframe.id
                                ? {
                                    ...keyframe,
                                    ...patch,
                                }
                                : keyframe
                        )
                    ),
                };
            })
        );
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
        if (!selectedKeyframe) {
            return;
        }

        const preset = EFFECT_PRESETS[presetName];

        if (!preset) {
            return;
        }

        updateSelectedKeyframe({
            values: {
                ...preset.values,
            },
        });

        setStatus(`${preset.label} values applied to selected keyframe.`);
    };

    const addDrawingClip = () => {
        if (!videoUrl) {
            setStatus("Upload a video before adding a drawing clip.");
            return;
        }

        const safeStart = clamp(currentTime || trimStart, trimStart, Math.max(trimStart, trimEnd - 0.25));
        const safeEnd = clamp(safeStart + 3, safeStart + 0.25, trimEnd || duration || safeStart + 3);
        const clipId = makeId("draw");

        const nextClip = {
            id: clipId,
            label: `Drawing ${drawingClips.length + 1}`,
            enabled: true,
            start: safeStart,
            end: safeEnd,
            blendMode: "source-over",
            brush: { ...brush },
            strokes: [],
        };

        setDrawingClips((previous) => [...previous, nextClip]);
        setSelectedDrawingClipId(clipId);
        setDrawingMode(true);
        setStatus("Drawing clip added. Draw on the preview using mouse, stylus, touch, or USB tablet.");
    };

    const updateSelectedDrawingClip = (patch) => {
        if (!selectedDrawingClipId) {
            return;
        }

        setDrawingClips((previous) =>
            previous.map((clip) =>
                clip.id === selectedDrawingClipId
                    ? {
                        ...clip,
                        ...patch,
                    }
                    : clip
            )
        );
    };

    const updateSelectedDrawingClipRange = (_, value) => {
        if (!selectedDrawingClip || !Array.isArray(value)) {
            return;
        }

        const start = clamp(value[0], trimStart, trimEnd);
        const end = clamp(value[1], start + 0.1, trimEnd);

        updateSelectedDrawingClip({
            start,
            end,
        });
    };

    const deleteSelectedDrawingClip = () => {
        if (!selectedDrawingClipId) {
            return;
        }

        setDrawingClips((previous) => previous.filter((clip) => clip.id !== selectedDrawingClipId));
        setSelectedDrawingClipId(null);
        setDrawingMode(false);
        setStatus("Drawing clip deleted.");
    };

    const clearSelectedDrawingStrokes = () => {
        if (!selectedDrawingClipId) {
            return;
        }

        setDrawingClips((previous) =>
            previous.map((clip) =>
                clip.id === selectedDrawingClipId
                    ? {
                        ...clip,
                        strokes: [],
                    }
                    : clip
            )
        );

        setStatus("Drawing strokes cleared from selected clip.");
    };

    const undoLastStroke = () => {
        if (!selectedDrawingClipId) {
            return;
        }

        setDrawingClips((previous) =>
            previous.map((clip) =>
                clip.id === selectedDrawingClipId
                    ? {
                        ...clip,
                        strokes: clip.strokes.slice(0, -1),
                    }
                    : clip
            )
        );
    };

    const updateBrush = (patch) => {
        setBrush((previous) => {
            const nextBrush = {
                ...previous,
                ...patch,
            };

            if (selectedDrawingClipId) {
                setDrawingClips((clips) =>
                    clips.map((clip) =>
                        clip.id === selectedDrawingClipId
                            ? {
                                ...clip,
                                brush: nextBrush,
                            }
                            : clip
                    )
                );
            }

            return nextBrush;
        });
    };

    const getPointerPoint = (event) => {
        if (!previewRef.current) {
            return null;
        }

        const rect = previewRef.current.getBoundingClientRect();
        const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
        const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
        const pressure = event.pressure && event.pressure > 0 ? event.pressure : 0.5;
        const localTime = selectedDrawingClip
            ? clamp(currentTime - selectedDrawingClip.start, 0, selectedDrawingClip.end - selectedDrawingClip.start)
            : 0;

        return {
            x,
            y,
            pressure,
            pointerType: event.pointerType || "mouse",
            t: localTime,
        };
    };

    const appendPointToActiveStroke = (point) => {
        if (!drawingStrokeRef.current || !selectedDrawingClipId) {
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
                if (clip.id !== selectedDrawingClipId) {
                    return clip;
                }

                return {
                    ...clip,
                    strokes: clip.strokes.map((stroke) =>
                        stroke.id === strokeId
                            ? {
                                ...stroke,
                                points: [...drawingStrokeRef.current.points],
                            }
                            : stroke
                    ),
                };
            })
        );
    };

    const handleCanvasPointerDown = (event) => {
        if (!drawingMode || !selectedDrawingClip || isExporting) {
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
            points: [
                {
                    ...point,
                    t: startOffset,
                },
            ],
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
            setStatus("Exporting video with filters, drawings, and text...");
            setDownloadUrl("");

            if (downloadUrlRef.current) {
                URL.revokeObjectURL(downloadUrlRef.current);
                downloadUrlRef.current = null;
            }

            video.pause();
            video.volume = volume;
            video.playbackRate = speed;

            await seekTo(trimStart);
            drawFrame();

            const canvasStream = canvas.captureStream(30);
            let audioTracks = [];

            if (typeof video.captureStream === "function") {
                const sourceStream = video.captureStream();
                audioTracks = sourceStream.getAudioTracks();
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

            const mimeType =
                mimeTypeOptions.find((type) => MediaRecorder.isTypeSupported(type)) || "";

            const recorder = new MediaRecorder(
                outputStream,
                mimeType ? { mimeType } : undefined
            );

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
            canvasStream.getTracks().forEach((track) => track.stop());

            const blob = new Blob(chunks, {
                type: recorder.mimeType || "video/webm",
            });

            const nextDownloadUrl = URL.createObjectURL(blob);
            downloadUrlRef.current = nextDownloadUrl;
            setDownloadUrl(nextDownloadUrl);
            setStatus("Export ready. Download your edited WebM video.");
        } catch (error) {
            setStatus("Export failed. Try a shorter clip or smaller video file.");
        } finally {
            setIsExporting(false);
            setIsPlaying(false);
        }
    };

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
                                    Preview Canvas
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: 14 }}>
                                    {fileName || "No video selected"}
                                </Typography>
                            </Stack>

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
                                        preload="metadata"
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onTimeUpdate={handleTimeUpdate}
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

                                    <ActiveStatusBadge
                                        values={activeValues}
                                        drawingMode={drawingMode}
                                        selectedDrawingClip={selectedDrawingClip}
                                    />

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

                                    <Typography sx={{ color: "rgba(255,255,255,0.58)", maxWidth: 540 }}>
                                        This version supports keyframed filters, drawing clips,
                                        pointer tracking, pen pressure, text overlays, and browser export.
                                    </Typography>
                                </Stack>
                            )}
                        </Box>

                        <TransportControls
                            videoUrl={videoUrl}
                            isExporting={isExporting}
                            isPlaying={isPlaying}
                            handlePlayPause={handlePlayPause}
                            handleRestart={handleRestart}
                            range={range}
                            duration={duration}
                            trimStart={trimStart}
                            trimEnd={trimEnd}
                            currentTime={currentTime}
                            handleRangeChange={handleRangeChange}
                            handlePlayheadChange={handlePlayheadChange}
                        />

                        <TimelineView
                            duration={duration}
                            trimStart={trimStart}
                            trimEnd={trimEnd}
                            currentTime={currentTime}
                            effectClips={effectClips}
                            drawingClips={drawingClips}
                            selectedEffectId={selectedEffectId}
                            selectedDrawingClipId={selectedDrawingClipId}
                            selectedKeyframeId={selectedKeyframeId}
                            onSelectEffect={setSelectedEffectId}
                            onSelectDrawing={setSelectedDrawingClipId}
                            onSelectKeyframe={setSelectedKeyframeId}
                            onSeek={handlePlayheadChange}
                        />

                        <GlassCard
                            sx={{
                                p: 1.5,
                                backgroundColor: "rgba(0,0,0,0.18)",
                            }}
                        >
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1.25}
                                alignItems={{ xs: "stretch", md: "center" }}
                                justifyContent="space-between"
                            >
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    <Chip
                                        label={support.mediaRecorder ? "MediaRecorder ready" : "No MediaRecorder"}
                                        sx={supportChipSx(support.mediaRecorder)}
                                    />
                                    <Chip
                                        label={support.canvasCapture ? "Canvas export ready" : "No Canvas capture"}
                                        sx={supportChipSx(support.canvasCapture)}
                                    />
                                    <Chip
                                        label={support.pointerEvents ? "Pointer drawing ready" : "No Pointer Events"}
                                        sx={supportChipSx(support.pointerEvents)}
                                    />
                                    <Chip
                                        label="USB tablets use pointer/pen input"
                                        sx={{
                                            color: "white",
                                            fontWeight: 800,
                                            backgroundColor: "rgba(179,140,255,0.16)",
                                        }}
                                    />
                                </Stack>

                                <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
                                    {status}
                                </Typography>
                            </Stack>
                        </GlassCard>
                    </Stack>
                </GlassCard>
            </Grid>

            <Grid item xs={12} lg={4}>
                <Stack spacing={2.5}>
                    <PlaybackPanel
                        volume={volume}
                        setVolume={setVolume}
                        speed={speed}
                        setSpeed={setSpeed}
                        videoRef={videoRef}
                    />

                    <EffectClipPanel
                        videoUrl={videoUrl}
                        isExporting={isExporting}
                        effectClips={effectClips}
                        selectedEffect={selectedEffect}
                        selectedKeyframe={selectedKeyframe}
                        selectedEffectId={selectedEffectId}
                        selectedKeyframeId={selectedKeyframeId}
                        trimStart={trimStart}
                        trimEnd={trimEnd}
                        duration={duration}
                        currentTime={currentTime}
                        addEffectClip={addEffectClip}
                        deleteSelectedEffect={deleteSelectedEffect}
                        updateSelectedEffect={updateSelectedEffect}
                        updateSelectedEffectRange={updateSelectedEffectRange}
                        addKeyframeAtPlayhead={addKeyframeAtPlayhead}
                        deleteSelectedKeyframe={deleteSelectedKeyframe}
                        updateSelectedKeyframe={updateSelectedKeyframe}
                        updateSelectedKeyframeValue={updateSelectedKeyframeValue}
                        applyPresetToSelectedKeyframe={applyPresetToSelectedKeyframe}
                        setSelectedEffectId={setSelectedEffectId}
                        setSelectedKeyframeId={setSelectedKeyframeId}
                        seekTo={seekTo}
                    />

                    <DrawingPanel
                        videoUrl={videoUrl}
                        isExporting={isExporting}
                        drawingMode={drawingMode}
                        setDrawingMode={setDrawingMode}
                        brush={brush}
                        updateBrush={updateBrush}
                        drawingClips={drawingClips}
                        selectedDrawingClip={selectedDrawingClip}
                        selectedDrawingClipId={selectedDrawingClipId}
                        setSelectedDrawingClipId={setSelectedDrawingClipId}
                        addDrawingClip={addDrawingClip}
                        updateSelectedDrawingClip={updateSelectedDrawingClip}
                        updateSelectedDrawingClipRange={updateSelectedDrawingClipRange}
                        deleteSelectedDrawingClip={deleteSelectedDrawingClip}
                        clearSelectedDrawingStrokes={clearSelectedDrawingStrokes}
                        undoLastStroke={undoLastStroke}
                        trimStart={trimStart}
                        trimEnd={trimEnd}
                        duration={duration}
                    />

                    <TextPanel
                        videoUrl={videoUrl}
                        isExporting={isExporting}
                        addTextBox={addTextBox}
                        textBoxes={textBoxes}
                        selectedText={selectedText}
                        selectedTextId={selectedTextId}
                        setSelectedTextId={setSelectedTextId}
                        updateSelectedText={updateSelectedText}
                        deleteSelectedText={deleteSelectedText}
                    />

                    <ExportPanel
                        videoUrl={videoUrl}
                        isExporting={isExporting}
                        exportWebM={exportWebM}
                        downloadUrl={downloadUrl}
                    />
                </Stack>
            </Grid>
        </Grid>
    );
}

function PlaybackPanel({ volume, setVolume, speed, setSpeed, videoRef }) {
    return (
        <GlassCard>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TuneRounded sx={{ color: "#9ee8ff" }} />
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Playback controls
                    </Typography>
                </Stack>

                <EditorSlider
                    label="Volume"
                    value={volume}
                    min={0}
                    max={1}
                    step={0.01}
                    display={`${Math.round(volume * 100)}%`}
                    onChange={(value) => {
                        setVolume(value);

                        if (videoRef.current) {
                            videoRef.current.volume = value;
                        }
                    }}
                />

                <EditorSlider
                    label="Speed"
                    value={speed}
                    min={0.25}
                    max={2}
                    step={0.05}
                    display={`${speed.toFixed(2)}x`}
                    onChange={(value) => {
                        setSpeed(value);

                        if (videoRef.current) {
                            videoRef.current.playbackRate = value;
                        }
                    }}
                />
            </Stack>
        </GlassCard>
    );
}

function EffectClipPanel({
                             videoUrl,
                             isExporting,
                             effectClips,
                             selectedEffect,
                             selectedKeyframe,
                             selectedEffectId,
                             selectedKeyframeId,
                             trimStart,
                             trimEnd,
                             duration,
                             addEffectClip,
                             deleteSelectedEffect,
                             updateSelectedEffect,
                             updateSelectedEffectRange,
                             addKeyframeAtPlayhead,
                             deleteSelectedKeyframe,
                             updateSelectedKeyframe,
                             updateSelectedKeyframeValue,
                             applyPresetToSelectedKeyframe,
                             setSelectedEffectId,
                             setSelectedKeyframeId,
                             seekTo,
                         }) {
    return (
        <>
            <GlassCard>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TimelineRounded sx={{ color: "#9ee8ff" }} />
                        <Typography variant="h6" sx={{ fontWeight: 950 }}>
                            Filter effect clips
                        </Typography>
                    </Stack>

                    <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.65 }}>
                        Effect clips apply filter parameters only during their selected duration.
                    </Typography>

                    <Grid container spacing={1}>
                        {Object.entries(EFFECT_PRESETS).map(([key, preset]) => (
                            <Grid item xs={6} key={key}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => addEffectClip(key)}
                                    disabled={!videoUrl || isExporting}
                                    sx={smallActionButtonSx}
                                >
                                    + {preset.label}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>

                    {effectClips.length > 0 && (
                        <Stack spacing={1}>
                            {effectClips.map((clip, index) => (
                                <Button
                                    key={clip.id}
                                    onClick={() => {
                                        setSelectedEffectId(clip.id);
                                        setSelectedKeyframeId(clip.keyframes[0]?.id || null);
                                    }}
                                    variant={clip.id === selectedEffectId ? "contained" : "outlined"}
                                    sx={listButtonSx(clip.id === selectedEffectId)}
                                >
                                    <span>{index + 1}. {clip.label}</span>
                                    <span>{formatTime(clip.start)} - {formatTime(clip.end)}</span>
                                </Button>
                            ))}
                        </Stack>
                    )}

                    {selectedEffect && (
                        <>
                            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                            <TextField
                                label="Effect name"
                                value={selectedEffect.label}
                                onChange={(event) => updateSelectedEffect({ label: event.target.value })}
                                InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                                sx={inputSx}
                            />

                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={toggleRowSx}
                            >
                                <Typography sx={{ fontWeight: 850 }}>Enable effect clip</Typography>
                                <Switch
                                    checked={selectedEffect.enabled !== false}
                                    onChange={(event) =>
                                        updateSelectedEffect({ enabled: event.target.checked })
                                    }
                                />
                            </Stack>

                            <Box>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography sx={{ fontWeight: 850 }}>Effect duration</Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: 13 }}>
                                        {formatTime(selectedEffect.start)} - {formatTime(selectedEffect.end)}
                                    </Typography>
                                </Stack>

                                <Slider
                                    value={[selectedEffect.start, selectedEffect.end]}
                                    min={trimStart}
                                    max={trimEnd || duration || 1}
                                    step={0.1}
                                    onChange={updateSelectedEffectRange}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={formatTime}
                                    sx={{ color: "#9ee8ff" }}
                                />
                            </Box>

                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteRounded />}
                                onClick={deleteSelectedEffect}
                                sx={{
                                    borderRadius: 999,
                                    fontWeight: 900,
                                }}
                            >
                                Delete Effect Clip
                            </Button>
                        </>
                    )}
                </Stack>
            </GlassCard>

            <GlassCard>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <KeyRounded sx={{ color: "#b38cff" }} />
                        <Typography variant="h6" sx={{ fontWeight: 950 }}>
                            Filter keyframes
                        </Typography>
                    </Stack>

                    {selectedEffect ? (
                        <>
                            <Button
                                variant="contained"
                                startIcon={<AddRounded />}
                                onClick={addKeyframeAtPlayhead}
                                disabled={!videoUrl || isExporting}
                                sx={primaryPillSx}
                            >
                                Add Keyframe At Playhead
                            </Button>

                            <Stack spacing={1}>
                                {sortKeyframes(selectedEffect.keyframes).map((keyframe, index) => (
                                    <Button
                                        key={keyframe.id}
                                        onClick={() => {
                                            setSelectedKeyframeId(keyframe.id);
                                            seekTo(keyframe.time);
                                        }}
                                        variant={keyframe.id === selectedKeyframeId ? "contained" : "outlined"}
                                        sx={listButtonSx(keyframe.id === selectedKeyframeId)}
                                    >
                                        <span>Keyframe {index + 1}</span>
                                        <span>{formatTime(keyframe.time)}</span>
                                    </Button>
                                ))}
                            </Stack>

                            {selectedKeyframe && (
                                <>
                                    <Box>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography sx={{ fontWeight: 850 }}>Keyframe time</Typography>
                                            <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: 13 }}>
                                                {formatTime(selectedKeyframe.time)}
                                            </Typography>
                                        </Stack>

                                        <Slider
                                            value={selectedKeyframe.time}
                                            min={selectedEffect.start}
                                            max={selectedEffect.end}
                                            step={0.1}
                                            onChange={(_, value) =>
                                                updateSelectedKeyframe({
                                                    time: clamp(Number(value), selectedEffect.start, selectedEffect.end),
                                                })
                                            }
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={formatTime}
                                            sx={{ color: "#b38cff" }}
                                        />
                                    </Box>

                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        {Object.entries(EFFECT_PRESETS).map(([key, preset]) => (
                                            <Button
                                                key={key}
                                                size="small"
                                                variant="outlined"
                                                onClick={() => applyPresetToSelectedKeyframe(key)}
                                                sx={smallActionButtonSx}
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </Stack>

                                    <EffectValueEditor
                                        values={selectedKeyframe.values}
                                        updateValue={updateSelectedKeyframeValue}
                                    />

                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteRounded />}
                                        onClick={deleteSelectedKeyframe}
                                        sx={{
                                            borderRadius: 999,
                                            fontWeight: 900,
                                        }}
                                    >
                                        Delete Keyframe
                                    </Button>
                                </>
                            )}
                        </>
                    ) : (
                        <Typography sx={{ color: "rgba(255,255,255,0.58)", lineHeight: 1.7 }}>
                            Add or select an effect clip first, then keyframe its filter parameters.
                        </Typography>
                    )}
                </Stack>
            </GlassCard>
        </>
    );
}

function DrawingPanel({
                          videoUrl,
                          isExporting,
                          drawingMode,
                          setDrawingMode,
                          brush,
                          updateBrush,
                          drawingClips,
                          selectedDrawingClip,
                          selectedDrawingClipId,
                          setSelectedDrawingClipId,
                          addDrawingClip,
                          updateSelectedDrawingClip,
                          updateSelectedDrawingClipRange,
                          deleteSelectedDrawingClip,
                          clearSelectedDrawingStrokes,
                          undoLastStroke,
                          trimStart,
                          trimEnd,
                          duration,
                      }) {
    return (
        <GlassCard>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <BrushRounded sx={{ color: "#9ee8ff" }} />
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Drawing clips
                    </Typography>
                </Stack>

                <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.65 }}>
                    Drawing clips are timeline layers. Mouse, touch, stylus, and USB drawing pads
                    work through pointer input. Pen pressure is used when your browser/device exposes it.
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={addDrawingClip}
                    disabled={!videoUrl || isExporting}
                    sx={primaryPillSx}
                >
                    Add Drawing Clip
                </Button>

                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={toggleRowSx}
                >
                    <Typography sx={{ fontWeight: 850 }}>Draw mode</Typography>
                    <Switch
                        checked={drawingMode}
                        onChange={(event) => setDrawingMode(event.target.checked)}
                        disabled={!selectedDrawingClip}
                    />
                </Stack>

                {drawingClips.length > 0 && (
                    <Stack spacing={1}>
                        {drawingClips.map((clip, index) => (
                            <Button
                                key={clip.id}
                                onClick={() => {
                                    setSelectedDrawingClipId(clip.id);
                                    updateBrush(clip.brush || DEFAULT_BRUSH);
                                }}
                                variant={clip.id === selectedDrawingClipId ? "contained" : "outlined"}
                                sx={listButtonSx(clip.id === selectedDrawingClipId)}
                            >
                                <span>{index + 1}. {clip.label}</span>
                                <span>{clip.strokes.length} strokes</span>
                            </Button>
                        ))}
                    </Stack>
                )}

                {selectedDrawingClip && (
                    <>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                        <TextField
                            label="Drawing clip name"
                            value={selectedDrawingClip.label}
                            onChange={(event) => updateSelectedDrawingClip({ label: event.target.value })}
                            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                            sx={inputSx}
                        />

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={toggleRowSx}
                        >
                            <Typography sx={{ fontWeight: 850 }}>Enable drawing clip</Typography>
                            <Switch
                                checked={selectedDrawingClip.enabled !== false}
                                onChange={(event) =>
                                    updateSelectedDrawingClip({ enabled: event.target.checked })
                                }
                            />
                        </Stack>

                        <Box>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography sx={{ fontWeight: 850 }}>Drawing duration</Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: 13 }}>
                                    {formatTime(selectedDrawingClip.start)} - {formatTime(selectedDrawingClip.end)}
                                </Typography>
                            </Stack>

                            <Slider
                                value={[selectedDrawingClip.start, selectedDrawingClip.end]}
                                min={trimStart}
                                max={trimEnd || duration || 1}
                                step={0.1}
                                onChange={updateSelectedDrawingClipRange}
                                valueLabelDisplay="auto"
                                valueLabelFormat={formatTime}
                                sx={{ color: "#9ee8ff" }}
                            />
                        </Box>

                        <TextField
                            label="Brush color"
                            type="color"
                            value={brush.color}
                            onChange={(event) => updateBrush({ color: event.target.value })}
                            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                            sx={inputSx}
                        />

                        <EditorSlider
                            label="Brush size"
                            value={brush.size}
                            min={1}
                            max={90}
                            step={1}
                            display={`${brush.size}px`}
                            onChange={(value) => updateBrush({ size: value })}
                        />

                        <EditorSlider
                            label="Brush opacity"
                            value={brush.opacity}
                            min={0}
                            max={100}
                            step={1}
                            display={`${brush.opacity}%`}
                            onChange={(value) => updateBrush({ opacity: value })}
                        />

                        <EditorSlider
                            label="Fade in"
                            value={brush.fadeIn}
                            min={0}
                            max={5}
                            step={0.1}
                            display={`${brush.fadeIn.toFixed(1)}s`}
                            onChange={(value) => updateBrush({ fadeIn: value })}
                        />

                        <EditorSlider
                            label="Fade out"
                            value={brush.fadeOut}
                            min={0}
                            max={5}
                            step={0.1}
                            display={`${brush.fadeOut.toFixed(1)}s`}
                            onChange={(value) => updateBrush({ fadeOut: value })}
                        />

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={toggleRowSx}
                        >
                            <Typography sx={{ fontWeight: 850 }}>Use pen pressure</Typography>
                            <Switch
                                checked={brush.usePressure}
                                onChange={(event) => updateBrush({ usePressure: event.target.checked })}
                            />
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={toggleRowSx}
                        >
                            <Typography sx={{ fontWeight: 850 }}>Reveal drawing over time</Typography>
                            <Switch
                                checked={brush.revealOverTime}
                                onChange={(event) => updateBrush({ revealOverTime: event.target.checked })}
                            />
                        </Stack>

                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={undoLastStroke}
                                    sx={smallActionButtonSx}
                                >
                                    Undo Stroke
                                </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={clearSelectedDrawingStrokes}
                                    sx={smallActionButtonSx}
                                >
                                    Clear Clip
                                </Button>
                            </Grid>
                        </Grid>

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteRounded />}
                            onClick={deleteSelectedDrawingClip}
                            sx={{
                                borderRadius: 999,
                                fontWeight: 900,
                            }}
                        >
                            Delete Drawing Clip
                        </Button>
                    </>
                )}
            </Stack>
        </GlassCard>
    );
}

function TextPanel({
                       videoUrl,
                       isExporting,
                       addTextBox,
                       textBoxes,
                       selectedText,
                       selectedTextId,
                       setSelectedTextId,
                       updateSelectedText,
                       deleteSelectedText,
                   }) {
    return (
        <GlassCard>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextFieldsRounded sx={{ color: "#b38cff" }} />
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Text overlay
                    </Typography>
                </Stack>

                <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={addTextBox}
                    disabled={!videoUrl || isExporting}
                    sx={primaryPillSx}
                >
                    Add Text Box
                </Button>

                {textBoxes.length > 0 && (
                    <Stack spacing={1}>
                        {textBoxes.map((box, index) => (
                            <Button
                                key={box.id}
                                onClick={() => setSelectedTextId(box.id)}
                                variant={box.id === selectedTextId ? "contained" : "outlined"}
                                sx={listButtonSx(box.id === selectedTextId)}
                            >
                                <span>Text Box {index + 1}</span>
                                <span>{box.text.slice(0, 14) || "Empty"}</span>
                            </Button>
                        ))}
                    </Stack>
                )}

                {selectedText ? (
                    <>
                        <TextField
                            label="Text"
                            multiline
                            minRows={2}
                            value={selectedText.text}
                            onChange={(event) =>
                                updateSelectedText({ text: event.target.value })
                            }
                            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                            sx={inputSx}
                        />

                        <TextField
                            label="Text color"
                            type="color"
                            value={selectedText.color}
                            onChange={(event) =>
                                updateSelectedText({ color: event.target.value })
                            }
                            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                            sx={inputSx}
                        />

                        <EditorSlider
                            label="Font size"
                            value={selectedText.fontSize}
                            min={18}
                            max={140}
                            step={1}
                            display={`${selectedText.fontSize}px`}
                            onChange={(value) => updateSelectedText({ fontSize: value })}
                        />

                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <EditorSlider
                                    label="X"
                                    value={selectedText.x}
                                    min={0}
                                    max={100}
                                    step={1}
                                    display={`${Math.round(selectedText.x)}%`}
                                    onChange={(value) => updateSelectedText({ x: value })}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <EditorSlider
                                    label="Y"
                                    value={selectedText.y}
                                    min={0}
                                    max={100}
                                    step={1}
                                    display={`${Math.round(selectedText.y)}%`}
                                    onChange={(value) => updateSelectedText({ y: value })}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteRounded />}
                            onClick={deleteSelectedText}
                            sx={{
                                borderRadius: 999,
                                fontWeight: 900,
                            }}
                        >
                            Delete Selected Text
                        </Button>
                    </>
                ) : (
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", lineHeight: 1.7 }}>
                        Add a text box, then select it to edit wording, size, color, and position.
                    </Typography>
                )}
            </Stack>
        </GlassCard>
    );
}

function ExportPanel({ videoUrl, isExporting, exportWebM, downloadUrl }) {
    return (
        <GlassCard>
            <Stack spacing={1.5}>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>
                    Export
                </Typography>

                <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>
                    Export uses the canvas render, so your filters, drawings, text, and keyframes
                    are included in the final WebM.
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<FileDownloadRounded />}
                    onClick={exportWebM}
                    disabled={!videoUrl || isExporting}
                    sx={primaryPillSx}
                >
                    {isExporting ? "Exporting..." : "Export WebM"}
                </Button>

                {downloadUrl && (
                    <Button
                        component="a"
                        href={downloadUrl}
                        download={`drawing-video-edit-${Date.now()}.webm`}
                        variant="outlined"
                        startIcon={<FileDownloadRounded />}
                        sx={{
                            borderRadius: 999,
                            color: "white",
                            borderColor: "rgba(255,255,255,0.2)",
                            fontWeight: 900,
                        }}
                    >
                        Download Export
                    </Button>
                )}
            </Stack>
        </GlassCard>
    );
}

function TransportControls({
                               videoUrl,
                               isExporting,
                               isPlaying,
                               handlePlayPause,
                               handleRestart,
                               range,
                               duration,
                               trimStart,
                               trimEnd,
                               currentTime,
                               handleRangeChange,
                               handlePlayheadChange,
                           }) {
    return (
        <Stack spacing={1.5}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", md: "center" }}
            >
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        startIcon={isPlaying ? <PauseRounded /> : <PlayArrowRounded />}
                        onClick={handlePlayPause}
                        disabled={!videoUrl || isExporting}
                        sx={primaryPillSx}
                    >
                        {isPlaying ? "Pause" : "Play"}
                    </Button>

                    <Tooltip title="Restart from trim start">
                        <span>
                            <IconButton
                                onClick={handleRestart}
                                disabled={!videoUrl || isExporting}
                                sx={{
                                    width: 48,
                                    height: 48,
                                    color: "white",
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    border: panelBorder,
                                }}
                            >
                                <RestartAltRounded />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Stack>

                <Box sx={{ flex: 1 }}>
                    <Slider
                        value={range}
                        min={0}
                        max={duration || 1}
                        step={0.1}
                        onChange={handleRangeChange}
                        disabled={!videoUrl || isExporting}
                        valueLabelDisplay="auto"
                        valueLabelFormat={formatTime}
                        sx={{
                            color: "#9ee8ff",
                            "& .MuiSlider-thumb": {
                                boxShadow: "0 0 0 8px rgba(158,232,255,0.08)",
                            },
                        }}
                    />

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        sx={{ color: "rgba(255,255,255,0.58)", fontSize: 13 }}
                    >
                        <span>Start: {formatTime(trimStart)}</span>
                        <span>Now: {formatTime(currentTime)}</span>
                        <span>End: {formatTime(trimEnd)}</span>
                    </Stack>
                </Box>
            </Stack>

            <Box>
                <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontWeight: 850 }}>Playhead</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: 13 }}>
                        {formatTime(currentTime)}
                    </Typography>
                </Stack>

                <Slider
                    value={currentTime}
                    min={trimStart}
                    max={trimEnd || duration || 1}
                    step={0.05}
                    onChange={handlePlayheadChange}
                    disabled={!videoUrl || isExporting}
                    sx={{
                        color: "#b38cff",
                    }}
                />
            </Box>
        </Stack>
    );
}

function TimelineView({
                          duration,
                          trimStart,
                          trimEnd,
                          currentTime,
                          effectClips,
                          drawingClips,
                          selectedEffectId,
                          selectedDrawingClipId,
                          selectedKeyframeId,
                          onSelectEffect,
                          onSelectDrawing,
                          onSelectKeyframe,
                          onSeek,
                      }) {
    const safeDuration = Math.max(0.001, duration || trimEnd || 1);

    const pct = (time) => clamp((time / safeDuration) * 100, 0, 100);

    const handleClickTimeline = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const amount = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const nextTime = clamp(amount * safeDuration, trimStart, trimEnd || safeDuration);

        onSeek(null, nextTime);
    };

    const rows = [
        ...effectClips.map((clip) => ({
            type: "effect",
            clip,
        })),
        ...drawingClips.map((clip) => ({
            type: "drawing",
            clip,
        })),
    ];

    return (
        <GlassCard
            sx={{
                p: 1.5,
                backgroundColor: "rgba(0,0,0,0.18)",
            }}
        >
            <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TimelineRounded sx={{ color: "#9ee8ff" }} />
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Timeline layers
                    </Typography>
                </Stack>

                <Box
                    onClick={handleClickTimeline}
                    sx={{
                        position: "relative",
                        minHeight: Math.max(132, 50 + rows.length * 46),
                        borderRadius: 4,
                        backgroundColor: "rgba(255,255,255,0.045)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        overflow: "hidden",
                        cursor: "crosshair",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: `${pct(trimStart)}%`,
                            width: `${Math.max(0, pct(trimEnd) - pct(trimStart))}%`,
                            backgroundColor: "rgba(158,232,255,0.045)",
                            borderLeft: "1px solid rgba(158,232,255,0.28)",
                            borderRight: "1px solid rgba(158,232,255,0.28)",
                        }}
                    />

                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: `${pct(currentTime)}%`,
                            width: 2,
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 18px rgba(255,255,255,0.8)",
                            zIndex: 5,
                        }}
                    />

                    {rows.length === 0 && (
                        <Stack
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                                minHeight: 130,
                                color: "rgba(255,255,255,0.55)",
                                textAlign: "center",
                                px: 2,
                            }}
                        >
                            <Typography sx={{ fontWeight: 800 }}>
                                Add filter clips or drawing clips to build your edit.
                            </Typography>
                        </Stack>
                    )}

                    {rows.map(({ type, clip }, index) => {
                        const left = pct(clip.start);
                        const width = Math.max(1.5, pct(clip.end) - pct(clip.start));
                        const selected =
                            type === "effect"
                                ? clip.id === selectedEffectId
                                : clip.id === selectedDrawingClipId;

                        return (
                            <Box
                                key={`${type}-${clip.id}`}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    if (type === "effect") {
                                        onSelectEffect(clip.id);
                                    } else {
                                        onSelectDrawing(clip.id);
                                    }
                                }}
                                sx={{
                                    position: "absolute",
                                    top: 18 + index * 46,
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    height: 30,
                                    borderRadius: 999,
                                    background: selected
                                        ? "linear-gradient(135deg, #9ee8ff, #b38cff)"
                                        : type === "effect"
                                            ? "linear-gradient(135deg, rgba(158,232,255,0.45), rgba(179,140,255,0.38))"
                                            : "linear-gradient(135deg, rgba(255,255,255,0.38), rgba(158,232,255,0.24))",
                                    border: selected
                                        ? "2px solid rgba(255,255,255,0.9)"
                                        : "1px solid rgba(255,255,255,0.22)",
                                    color: selected ? "#06101d" : "white",
                                    fontWeight: 950,
                                    fontSize: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    px: 1.25,
                                    overflow: "visible",
                                    whiteSpace: "nowrap",
                                    zIndex: selected ? 3 : 2,
                                }}
                            >
                                {type === "effect" ? "FX" : "DRAW"} · {clip.label}

                                {type === "effect" && clip.keyframes.map((keyframe) => {
                                    const localPct = clamp(
                                        ((keyframe.time - clip.start) / Math.max(0.001, clip.end - clip.start)) * 100,
                                        0,
                                        100
                                    );

                                    return (
                                        <Box
                                            key={keyframe.id}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onSelectEffect(clip.id);
                                                onSelectKeyframe(keyframe.id);
                                            }}
                                            sx={{
                                                position: "absolute",
                                                left: `${localPct}%`,
                                                top: "50%",
                                                width: 12,
                                                height: 12,
                                                transform: "translate(-50%, -50%) rotate(45deg)",
                                                borderRadius: 0.75,
                                                backgroundColor:
                                                    keyframe.id === selectedKeyframeId ? "#ffffff" : "#07111f",
                                                border: "1px solid rgba(255,255,255,0.85)",
                                                boxShadow:
                                                    keyframe.id === selectedKeyframeId
                                                        ? "0 0 18px rgba(255,255,255,0.95)"
                                                        : "none",
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
                >
                    <span>{formatTime(0)}</span>
                    <span>Trim: {formatTime(trimStart)} - {formatTime(trimEnd)}</span>
                    <span>{formatTime(duration)}</span>
                </Stack>
            </Stack>
        </GlassCard>
    );
}

function ActiveStatusBadge({ values, drawingMode, selectedDrawingClip }) {
    const isNeutral =
        Math.round(values.brightness) === 100 &&
        Math.round(values.contrast) === 100 &&
        Math.round(values.saturation) === 100 &&
        Math.round(values.blur) === 0 &&
        Math.round(values.grayscale) === 0 &&
        Math.round(values.sepia) === 0 &&
        Math.round(values.hue) === 0 &&
        Math.round(values.opacity) === 100 &&
        Math.round(values.sharpen) === 0 &&
        Math.round(values.noise) === 0 &&
        Math.round(values.vignette) === 0;

    return (
        <Box
            sx={{
                position: "absolute",
                top: 14,
                left: 14,
                zIndex: 5,
                px: 1.25,
                py: 0.75,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
            }}
        >
            <Typography sx={{ fontSize: 12, fontWeight: 950, color: drawingMode ? "#9ee8ff" : isNeutral ? "rgba(255,255,255,0.66)" : "#9ee8ff" }}>
                {drawingMode && selectedDrawingClip
                    ? `Drawing: ${selectedDrawingClip.label}`
                    : isNeutral
                        ? "No active filter"
                        : `Active FX: B ${Math.round(values.brightness)} / C ${Math.round(values.contrast)} / Blur ${values.blur.toFixed(1)}`}
            </Typography>
        </Box>
    );
}

function EffectValueEditor({ values, updateValue }) {
    return (
        <Stack spacing={1.35}>
            {FILTER_PARAMETERS.map((param) => (
                <EditorSlider
                    key={param.key}
                    label={param.label}
                    value={values[param.key] ?? param.neutral}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    display={`${Number(values[param.key] ?? param.neutral).toFixed(param.step < 1 ? 1 : 0)}${param.unit}`}
                    onChange={(value) => updateValue(param.key, value)}
                />
            ))}
        </Stack>
    );
}

function EditorSlider({
                          label,
                          value,
                          min,
                          max,
                          step,
                          display,
                          onChange,
                      }) {
    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontWeight: 850 }}>{label}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: 13 }}>
                    {display}
                </Typography>
            </Stack>

            <Slider
                value={Number(value)}
                min={min}
                max={max}
                step={step}
                onChange={(_, nextValue) => onChange(Number(nextValue))}
                sx={{
                    color: "#9ee8ff",
                    "& .MuiSlider-rail": {
                        color: alpha("#ffffff", 0.3),
                    },
                }}
            />
        </Box>
    );
}

const inputSx = {
    "& .MuiInputBase-root": {
        color: "white",
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.055)",
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(255,255,255,0.14)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(255,255,255,0.28)",
    },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#9ee8ff",
    },
};

const smallActionButtonSx = {
    borderRadius: 999,
    color: "white",
    borderColor: "rgba(255,255,255,0.18)",
    fontWeight: 900,
    textTransform: "none",
    "&:hover": {
        borderColor: "rgba(158,232,255,0.55)",
        backgroundColor: "rgba(158,232,255,0.08)",
    },
};

const toggleRowSx = {
    p: 1,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.08)",
};

function listButtonSx(active) {
    return {
        justifyContent: "space-between",
        borderRadius: 3,
        color: active ? "#07111f" : "white",
        fontWeight: 900,
        borderColor: "rgba(255,255,255,0.16)",
        background: active
            ? "linear-gradient(135deg, #9ee8ff, #b38cff)"
            : "rgba(255,255,255,0.04)",
    };
}

function supportChipSx(active) {
    return {
        color: "white",
        fontWeight: 800,
        backgroundColor: active
            ? "rgba(158,232,255,0.12)"
            : "rgba(255,90,90,0.14)",
    };
}