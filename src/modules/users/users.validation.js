import { z } from "zod";

// Schema for creating a new user
export const createUserSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be 20 characters or fewer.")
    .trim(),

  userEmail: z
    .string()
    .email("Please enter a valid email address."),

  userPassword: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password needs at least one uppercase letter.")
    .regex(/[0-9]/, "Password needs at least one number.")
    .regex(/[^a-zA-Z0-9]/, "Password needs at least one special character."),
});

// Generic middleware factory to validate any schema
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.map(String).join(".") || "body",
      message: issue.message,
    }));
    return res.status(400).json({
      message: errors.map((e) => e.message).join(" "),
      errors,
    });
  }

  // Use the parsed & sanitized data
  req.body = result.data;
  next();
};