import { z } from "zod";

export const RoznamchaSchema = z.object({
  date: z.string().optional(),
  gariNo: z.string().min(1, "Vehicle number is required"),
  driverName: z.string().min(1, "Driver name is required"),
  maal: z.string().optional().default(""),
  dieselLiter: z.coerce.number().min(0, "Diesel liters cannot be negative").default(0),
  kiraya: z.coerce.number().min(0, "Kiraya cannot be negative").default(0),
  kharcha: z.coerce.number().min(0, "Kharcha cannot be negative").default(0),
  advance: z.coerce.number().min(0, "Advance cannot be negative").default(0),
});

export const GariSchema = z.object({
  gariNo: z.string().min(1, "Vehicle number is required"),
  driverName: z.string().optional().default(""),
  malik: z.enum(["Apni", "Kiraye Wali"]).default("Apni"),
  phone: z.string().optional().default(""),
});

export type RoznamchaInput = z.infer<typeof RoznamchaSchema>;
export type GariInput = z.infer<typeof GariSchema>;
