import React from "react";
import { Container, Stack, Typography } from "@mui/material";
import { MovieCreationRounded } from "@mui/icons-material";
import {
    AppNavBar,
    BrowserVideoEditor,
    GradientPage,
    SectionHeader,
} from "../components/components";

export default function Video() {
    return (
        <GradientPage>
            <AppNavBar />

            <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                    <MovieCreationRounded sx={{ color: "#9ee8ff" }} />
                    <Typography
                        variant="overline"
                        sx={{
                            color: "#9ee8ff",
                            fontWeight: 950,
                            letterSpacing: 1.6,
                        }}
                    >
                        Video Editor
                    </Typography>
                </Stack>

                <SectionHeader
                    title="Timeline video editor with filters, keyframes, and drawing"
                    description="Upload a video, create filter clips, draw directly on frames, use drawing tablet pressure input, and export the canvas-rendered edit."
                    compact
                />

                <BrowserVideoEditor />
            </Container>
        </GradientPage>
    );
}