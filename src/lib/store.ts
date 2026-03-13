"use client";

import { create } from "zustand";

import { DEFAULT_COLORS } from "@/lib/constants";
import { MapPoint, ParsedCsvResult, ThemeMode } from "@/lib/types";

type AppState = {
  region: string;
  theme: ThemeMode;
  colors: {
    apiOnly: string;
    clientOnly: string;
    overlap: string;
  };
  apiResult?: ParsedCsvResult;
  clientResult?: ParsedCsvResult;
  points: MapPoint[];
  airportsLoaded: boolean;
  setRegion: (region: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setColor: (key: keyof typeof DEFAULT_COLORS, value: string) => void;
  setResults: (results: { apiResult?: ParsedCsvResult; clientResult?: ParsedCsvResult; points: MapPoint[] }) => void;
  setAirportsLoaded: (ready: boolean) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  region: "All regions",
  theme: "light",
  colors: DEFAULT_COLORS,
  points: [],
  airportsLoaded: false,
  setRegion: (region) => set({ region }),
  setTheme: (theme) => set({ theme }),
  setColor: (key, value) =>
    set((state) => ({
      colors: {
        ...state.colors,
        [key]: value
      }
    })),
  setResults: ({ apiResult, clientResult, points }) => set({ apiResult, clientResult, points }),
  setAirportsLoaded: (airportsLoaded) => set({ airportsLoaded }),
  reset: () =>
    set({
      region: "All regions",
      apiResult: undefined,
      clientResult: undefined,
      points: []
    })
}));
