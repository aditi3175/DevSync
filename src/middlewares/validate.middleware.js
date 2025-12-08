import { ZodError } from "zod";

export default function validateBody(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Validation failed",
            errors: err.errors,
          });
      }
      return next(err);
    }
  };
}
