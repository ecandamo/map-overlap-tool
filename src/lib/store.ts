"use client";

import { create } from "zustand";

import { DEFAULT_COLORS } from "@/lib/constants";
import { MapPoint, ParsedCsvResult, ThemeMode } from "@/lib/types";

type AppState = {
  region: string;
  theme: ThemeMode;
  clientName: string;
  volumeUnits: string;
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
  setClientName: (clientName: string) => void;
  setVolumeUnits: (volumeUnits: string) => void;
  setColor: (key: keyof typeof DEFAULT_COLORS, value: string) => void;
  setResults: (results: { apiResult?: ParsedCsvResult; clientResult?: ParsedCsvResult; points: MapPoint[] }) => void;
  setAirportsLoaded: (ready: boolean) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  region: "All regions",
  theme: "light",
  clientName: "",
  volumeUnits: "",
  colors: DEFAULT_COLORS,
  points: [],
  airportsLoaded: false,
  setRegion: (region) => set({ region }),
  setTheme: (theme) => set({ theme }),
  setClientName: (clientName) => set({ clientName }),
  setVolumeUnits: (volumeUnits) => set({ volumeUnits }),
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
      clientName: "",
      volumeUnits: "",
      apiResult: undefined,
      clientResult: undefined,
      points: []
    })
}));
