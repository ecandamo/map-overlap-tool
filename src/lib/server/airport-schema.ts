import { z } from "zod";

export const airportReferenceSchema = z.object({
  iata: z.string().trim().toUpperCase().length(3, "IATA must be 3 characters"),
  city: z.string().trim().min(1, "City is required"),
  country: z.string().trim().min(1, "Country is required"),
  region: z.string().trim().min(1, "Region is required"),
  latitude: z.coerce.number().finite("Latitude must be a number").min(-90).max(90),
  longitude: z.coerce.number().finite("Longitude must be a number").min(-180).max(180)
});

export const airportBulkSchema = z.object({
  airports: z.array(airportReferenceSchema).min(1, "At least one airport is required")
});
