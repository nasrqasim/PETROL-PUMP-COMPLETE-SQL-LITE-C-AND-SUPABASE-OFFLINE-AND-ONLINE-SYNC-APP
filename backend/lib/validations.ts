import { z } from "zod";

export const RoznamchaSchema = z.object({
  date: z.string().optional(),
  gariNo: z.string().min(1, "Vehicle number is required"),
  driverName: z.string().min(1, "Driver name is required"),
  maal: z.string().optional().default(""),
  unit: z.string().optional().default(""),
  unitQuantity: z.coerce.number().min(0, "Quantity cannot be negative").optional().default(0),
  pricePerUnit: z.coerce.number().min(0, "Price per unit cannot be negative").optional().default(0),
  dieselLiter: z.coerce.number().min(0, "Diesel liters cannot be negative").default(0),
  kiraya: z.coerce.number().min(0, "Freight cannot be negative").default(0),
  kharcha: z.coerce.number().min(0, "Trip expenses cannot be negative").default(0),
  otherExpenseName: z.string().optional().default(""),
  otherExpenseAmount: z.coerce.number().min(0, "Other expense cannot be negative").optional().default(0),
  advance: z.coerce.number().min(0, "Advance cannot be negative").default(0),

  // Customer & Location Enhancements
  customerId: z.coerce.number().optional(),
  customerName: z.string().optional().default(""),
  fromLocation: z.string().optional().default(""),
  toLocation: z.string().optional().default(""),
  deliveryAddress: z.string().optional().default(""),
  paymentStatus: z.string().optional().default("Credit / Pay Later"),
  paymentMethod: z.string().optional().default("Cash"),
  bankAccountId: z.coerce.number().optional(),
  paidAmount: z.coerce.number().optional().default(0),
  advanceUsed: z.coerce.number().optional().default(0),
});

export const GariSchema = z.object({
  gariNo: z.string().min(1, "Vehicle number is required"),
  driverName: z.string().optional().default(""),
  malik: z.enum(["Apni", "Kiraye Wali"]).default("Apni"),
  phone: z.string().optional().default(""),
});

export type RoznamchaInput = z.infer<typeof RoznamchaSchema>;
export type GariInput = z.infer<typeof GariSchema>;
