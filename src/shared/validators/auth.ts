import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    role: z.enum(["customer", "provider"], {
      message: "Choose how you'd like to use GearUp",
    }),
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
