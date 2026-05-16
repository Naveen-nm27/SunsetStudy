import { z } from "zod";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const BlockTypeEnum = z.enum(["lecture", "sleep", "family", "work", "other"]);
const WeekdayEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const daysSchema = z
  .array(z.string())
  .default([])
  .transform((days) => days.map((d) => String(d).trim().toLowerCase()))
  .refine((days) => days.every((d) => WeekdayEnum.safeParse(d).success), {
    message: "days must contain only valid weekday strings",
  });

const baseBlockSchema = z.object({
  userObjectId: z.string().min(1, "userObjectId is required").trim(),
  title: z.string().min(1, "title is required").trim(),
  type: BlockTypeEnum,
  date: z.coerce.date({ message: "date must be a valid date" }),
  startTime: z.string().trim().regex(HHMM, 'startTime must be in "HH:MM" format'),
  endTime: z.string().trim().regex(HHMM, 'endTime must be in "HH:MM" format'),
  recurring: z.boolean().optional().default(false),
  days: daysSchema,
  note: z.string().trim().optional(),
});

export const createBlockSchema = baseBlockSchema.superRefine((data, ctx) => {
  if (data.recurring && data.days.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["days"],
      message: "days required when recurring is true",
    });
  }
});

export const updateBlockSchema = baseBlockSchema
  .omit({ userObjectId: true })
  .partial()
  .refine(
  (data) => Object.keys(data).length > 0,
  { message: "at least one field is required" }
);

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
  req.body = result.data;
  next();
};

