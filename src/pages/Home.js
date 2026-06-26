import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Box,
    Button,
    Chip,
    Container,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import {
    AutoAwesomeRounded,
    BrushRounded,
    CloudUploadRounded,
    FileDownloadRounded,
    GraphicEqRounded,
    KeyRounded,
    LayersRounded,
    MovieCreationRounded,
    TimelineRounded,
    TuneRounded,
    VolumeUpRounded,
} from "@mui/icons-material";
import {
    AppNavBar,
    FeatureCard,
    GlassCard,
    GradientPage,
    PageHero,
    SectionHeader,
    primaryPillSx,
} from "../components/components";

export default function Home() {
    return (
        <GradientPage>
            <AppNavBar />

            <Container maxWidth="xl" sx={{ py: { xs: 4, md: 7 } }}>
                <PageHero
                    eyebrow="Browser Video Editor"
                    title="Edit video with canvas preview, timeline clips, filters, audio FX, and drawing."
                    description="Upload a video, see it render directly inside the canvas, add resizable effect boxes on the timeline, animate filter and audio parameters with keyframes, draw over frames, and export the final browser-rendered WebM."
                    actions={
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                            <Button
                                component={RouterLink}
                                to="/video"
                                size="large"
                                variant="contained"
                                startIcon={<MovieCreationRounded />}
                                sx={primaryPillSx}
                            >
                                Open Editor
                            </Button>

                            <Button
                                component={RouterLink}
                                to="/video"
                                size="large"
                                variant="outlined"
                                startIcon={<CloudUploadRounded />}
                                sx={{
                                    borderRadius: 999,
                                    px: 3,
                                    py: 1.25,
                                    fontWeight: 900,
                                    color: "white",
                                    borderColor: "rgba(255,255,255,0.25)",
                                    "&:hover": {
                                        borderColor: "rgba(255,255,255,0.45)",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                    },
                                }}
                            >
                                Upload Video
                            </Button>
                        </Stack>
                    }
                />

                <Grid container spacing={2.5} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={4}>
                        <FeatureCard
                            icon={<TimelineRounded />}
                            title="Resizable timeline boxes"
                            description="Click, drag, and resize visual, audio, and drawing clips directly on the timeline instead of using duration sliders."
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FeatureCard
                            icon={<KeyRounded />}
                            title="Keyframed parameters"
                            description="Animate brightness, contrast, blur, hue, opacity, gain, pan, bass, treble, lowpass, highpass, echo mix, and feedback."
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FeatureCard
                            icon={<BrushRounded />}
                            title="Canvas frame drawing"
                            description="Draw over the current frame with mouse, touch, pen, or USB drawing tablet pressure input."
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: { xs: 5, md: 8 } }}>
                    <SectionHeader
                        eyebrow="Frontend-only editor"
                        title="One timeline for video filters, audio effects, drawings, and text"
                        description="The hidden video element feeds the canvas preview. The same render path is used for export, so visual effects, drawings, and text are burned into the final canvas stream."
                    />

                    <Grid container spacing={2.5}>
                        <Grid item xs={12} md={6}>
                            <GlassCard>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                        <TuneRounded sx={{ color: "#9ee8ff" }} />
                                        <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                            Video filter clips
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
                                        {[
                                            "Brightness",
                                            "Contrast",
                                            "Saturation",
                                            "Blur",
                                            "Grayscale",
                                            "Sepia",
                                            "Hue",
                                            "Opacity",
                                            "Sharpen",
                                            "Noise",
                                            "Vignette",
                                        ].map((item) => (
                                            <Chip
                                                key={item}
                                                label={item}
                                                sx={{
                                                    color: "white",
                                                    fontWeight: 800,
                                                    backgroundColor: "rgba(255,255,255,0.08)",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                }}
                                            />
                                        ))}
                                    </Stack>

                                    <Typography sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
                                        Each visual clip has a start, end, keyframes, and parameter values.
                                        The editor evaluates active clips at the playhead and applies the result
                                        directly to the canvas frame.
                                    </Typography>
                                </Stack>
                            </GlassCard>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <GlassCard>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                        <GraphicEqRounded sx={{ color: "#b38cff" }} />
                                        <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                            Audio effect clips
                                        </Typography>
                                    </Stack>

                                    <Grid container spacing={1.25}>
                                        {[
                                            {
                                                icon: <VolumeUpRounded />,
                                                text: "Gain and fade automation",
                                            },
                                            {
                                                icon: <GraphicEqRounded />,
                                                text: "Bass, treble, lowpass, highpass",
                                            },
                                            {
                                                icon: <TuneRounded />,
                                                text: "Delay mix, delay time, feedback",
                                            },
                                            {
                                                icon: <TimelineRounded />,
                                                text: "Audio clips resize like video clips",
                                            },
                                            {
                                                icon: <LayersRounded />,
                                                text: "Separate timeline tracks",
                                            },
                                            {
                                                icon: <FileDownloadRounded />,
                                                text: "Export uses processed audio when supported",
                                            },
                                        ].map((item) => (
                                            <Grid item xs={12} sm={6} key={item.text}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    sx={{
                                                        p: 1.25,
                                                        borderRadius: 3,
                                                        backgroundColor: "rgba(255,255,255,0.055)",
                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                    }}
                                                >
                                                    <Box sx={{ color: "#9ee8ff", display: "flex" }}>
                                                        {item.icon}
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                                                        {item.text}
                                                    </Typography>
                                                </Stack>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Stack>
                            </GlassCard>
                        </Grid>
                    </Grid>
                </Box>

                <GlassCard
                    sx={{
                        mt: { xs: 5, md: 8 },
                        p: { xs: 3, md: 4 },
                        background:
                            "linear-gradient(135deg, rgba(158,232,255,0.14), rgba(179,140,255,0.12))",
                    }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        justifyContent="space-between"
                    >
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <AutoAwesomeRounded sx={{ color: "#9ee8ff" }} />
                                <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                    Adobe-style browser foundation
                                </Typography>
                            </Stack>

                            <Typography sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 780 }}>
                                This version gives you a stronger timeline system: clip boxes can be moved,
                                trimmed, resized with handles, and edited with detailed video/audio parameters.
                            </Typography>
                        </Box>

                        <Button
                            component={RouterLink}
                            to="/video"
                            variant="contained"
                            startIcon={<MovieCreationRounded />}
                            sx={primaryPillSx}
                        >
                            Launch Editor
                        </Button>
                    </Stack>
                </GlassCard>
            </Container>
        </GradientPage>
    );
}