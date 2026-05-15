import { z } from "zod";

const SubjectTypeEnum = z.enum(["academic", "hobby", "project"]);
const SubjectStatusEnum = z.enum(["active", "archived"]);

export const createSubjectSchema = z.object({
  userObjectId: z.string().min(1, "userObjectId is required").trim(),
  name: z.string().min(3, "name must be at least 3 characters").trim(),
  type: SubjectTypeEnum,
  description: z.string().trim().optional(),
  color: z.string().trim().optional(),
  status: SubjectStatusEnum.optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial().refine(
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
