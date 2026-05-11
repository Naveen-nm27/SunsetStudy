import { z } from "zod";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const SessionStatusEnum = z.enum(["planned", "completed"]);

export const createSessionSchema = z.object({
  userObjectId: z.string().min(1, "userObjectId is required").trim(),
  subjectObjectId: z.string().min(1, "subjectObjectId is required").trim(),
  topicObjectId: z.string().min(1, "topicObjectId is required").trim(),
  date: z.coerce.date({ message: "date must be a valid date" }),
  startTime: z.string().trim().regex(HHMM, 'startTime must be in "HH:MM" format'),
  endTime: z.string().trim().regex(HHMM, 'endTime must be in "HH:MM" format'),
  rating: z
    .union([z.number().int().min(1).max(5), z.null()])
    .optional(),
  review: z.string().trim().optional(),
  status: SessionStatusEnum.optional(),
});

export const updateSessionSchema = createSessionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "at least one field is required" }
);

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  req.body = result.data;
  next();
};

