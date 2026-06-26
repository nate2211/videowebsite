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
    ContentCutRounded,
    FileDownloadRounded,
    KeyRounded,
    LayersRounded,
    MovieCreationRounded,
    TextFieldsRounded,
    TimelineRounded,
    TuneRounded,
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
                    title="Edit, keyframe, and draw directly on video frames."
                    description="Upload a video, create effect clips, keyframe filter parameters, draw with mouse or drawing tablet input, and export the final canvas-rendered edit from the browser."
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
                            title="Effect duration clips"
                            description="Create timeline clips so filters and drawing layers only apply during selected video ranges."
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FeatureCard
                            icon={<KeyRounded />}
                            title="Filter keyframes"
                            description="Animate brightness, contrast, saturation, blur, grayscale, sepia, hue, opacity, sharpen, noise, and vignette."
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FeatureCard
                            icon={<BrushRounded />}
                            title="Frame drawing"
                            description="Draw directly over the video using mouse, touch, stylus, or USB drawing pad pressure input."
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: { xs: 5, md: 8 } }}>
                    <SectionHeader
                        eyebrow="Frontend-only stack"
                        title="Canvas-rendered editor with drawing layers"
                        description="The preview and export use the same canvas render path, so filters, keyframes, text, and drawings are all burned into the exported video."
                    />

                    <Grid container spacing={2.5}>
                        <Grid item xs={12} md={6}>
                            <GlassCard>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                        <TuneRounded sx={{ color: "#9ee8ff" }} />
                                        <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                            Keyframeable filter parameters
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
                                        Each effect clip stores its own start time, end time, and
                                        keyframes. During playback, the editor calculates the active
                                        values for the current frame and applies them to the canvas.
                                    </Typography>
                                </Stack>
                            </GlassCard>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <GlassCard>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                        <LayersRounded sx={{ color: "#b38cff" }} />
                                        <Typography variant="h5" sx={{ fontWeight: 950 }}>
                                            Drawing layer features
                                        </Typography>
                                    </Stack>

                                    <Grid container spacing={1.25}>
                                        {[
                                            {
                                                icon: <BrushRounded />,
                                                text: "Draw with mouse, touch, pen, or tablet",
                                            },
                                            {
                                                icon: <TimelineRounded />,
                                                text: "Drawing clips have start and end time",
                                            },
                                            {
                                                icon: <TuneRounded />,
                                                text: "Brush size, color, opacity, pressure",
                                            },
                                            {
                                                icon: <KeyRounded />,
                                                text: "Progressive reveal over duration",
                                            },
                                            {
                                                icon: <TextFieldsRounded />,
                                                text: "Text overlays still work",
                                            },
                                            {
                                                icon: <FileDownloadRounded />,
                                                text: "Export includes drawings",
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
                                    Adobe-style foundation
                                </Typography>
                            </Stack>

                            <Typography sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 760 }}>
                                This gives you the foundation for timeline layers, per-frame effects,
                                brush strokes, pressure-aware drawing, and browser-side rendering.
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