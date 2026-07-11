import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Home from "./pages/Home";
import Video from "./pages/Video";
import Stream from "./pages/Stream";
import Archive from "./pages/Archive";
import Player from "./pages/Player";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#9ee8ff",
    },
    secondary: {
      main: "#b38cff",
    },
    background: {
      default: "#050711",
      paper: "#0a1020",
    },
  },
  typography: {
    fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 800,
    },
  },
  shape: {
    borderRadius: 18,
  },
});

export default function App() {
  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video" element={<Video />} />
            <Route path="/stream" element={<Stream />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/player" element={<Player />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
  );
}