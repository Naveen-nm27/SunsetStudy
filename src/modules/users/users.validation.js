import { z } from "zod";

// Schema for creating a new user
export const createUserSchema = z.object({
  userName: z
    .string()
    .min(3, "username must be at least 3 characters")
    .max(20, "username must be at most 20 characters")
    .trim(),

  userEmail: z
    .string()
    .email("must be a valid email address"),

  userPassword: z
    .string()
    .min(8, "password must be at least 8 characters")
    .regex(/[A-Z]/, "password needs at least one uppercase letter")
    .regex(/[0-9]/, "password needs at least one number")
    .regex(/[^a-zA-Z0-9]/, "password needs at least one special character"),
});

// Generic middleware factory to validate any schema
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.errors,
    });
  }

  // Use the parsed & sanitized data
  req.body = result.data;
  next();
};