import { z } from "zod";

const TopicStatusEnum = z.enum(["not started", "in progress", "done"]);

export const createTopicSchema = z.object({
  subjectObjectId: z.string().min(1, "subjectObjectId is required").trim(),
  userObjectId: z.string().min(1, "userObjectId is required").trim(),
  name: z.string().min(1, "name is required").trim(),
  color: z.string().optional(),
  status: TopicStatusEnum.optional(),
});

export const updateTopicSchema = createTopicSchema
  .omit({ subjectObjectId: true, userObjectId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field is required",
  });

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
