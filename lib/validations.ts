import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const createUserSchema = z.object({
  collegeEmail: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  quote: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "USER"]),
});

export const csvRowSchema = z.object({
  email: z.string({ message: "Email is missing" }).email("Invalid email format"),
  role: z.enum(["ADMIN", "USER"], { message: "Role must be ADMIN or USER" }),
  password: z.string({ message: "Password is missing" }).min(8, "Password must be at least 8 characters"),
});

export const questionSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9_]+$/, "Slug must be lowercase alphanumeric with underscores"),
  label: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    "text", "textarea", "number", "date", "email", "url",
    "select", "radio", "checkbox", "multi-select",
    "image", "gallery", "file",
    "social_links", "key_value_list",
    "toggle", "phone"
  ]),
  required: z.boolean().default(false),
  order: z.number().int(),
  options: z.array(z.string()).optional().nullable(),
  validation: z.record(z.string(), z.unknown()).optional().nullable(),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const adminResetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
});

export const wallPostSchema = z.object({
  imageUrl: z.string().min(1, "Image is required"),
  caption: z.string().min(1).max(500),
});
