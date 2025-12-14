import { z } from "zod";

export const createMonitorSchema = z
  .object({
    name: z
      .string({ required_error: "Monitor name is required" })
      .min(1, "Monitor name cannot be empty")
      .trim(),

    url: z
      .string({ required_error: "URL is required" })
      .url("Must be a valid URL"),

    method: z
      .enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"], {
        errorMap: () => ({ message: "Invalid HTTP method" }),
      })
      .optional()
      .default("GET"),

    headers: z.record(z.string(), z.string()).optional().default({}),

    body: z.string().nullable().optional().default(null),

    frequencyMinutes: z
      .number({ required_error: "Frequency is required" })
      .min(1, "Frequency must be at least 1 minute")
      .optional()
      .default(5),

    timeoutMs: z
      .number()
      .min(1000, "Timeout must be at least 1000ms")
      .optional()
      .default(5000),

    assertions: z
      .array(z.string().min(1, "Assertion cannot be empty"))
      .optional()
      .default([]),

    enabled: z.boolean().optional().default(true),
  })
  .strict(); // strict mode to catch unexpected fields

export const updateMonitorSchema = createMonitorSchema.partial().strict();
