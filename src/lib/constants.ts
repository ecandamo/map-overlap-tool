import { ColorConfig } from "@/lib/types";

export const REQUIRED_COLUMNS = ["IATA", "city", "country", "region", "volume"] as const;

export const DEFAULT_COLORS: ColorConfig = {
  apiOnly: "#0f766e",
  clientOnly: "#7c3aed",
  overlap: "#ea580c"
};

export const DEFAULT_THEME = "light";

export const EMPTY_UPLOAD_STATE = {
  fileName: "",
  status: "idle"
} as const;

export const REGION_ALL = "All regions";
