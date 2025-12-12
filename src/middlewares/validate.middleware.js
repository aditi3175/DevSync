import { ZodError } from "zod";

export default function validateBody(schema) {
  return (req, res, next) => {
    // Check if schema is valid
    if (!schema || typeof schema.parse !== "function") {
      console.error(
        "Validation Middleware Error: Schema is invalid or missing."
      );
      return res.status(500).json({
        success: false,
        message: "Internal Server Error: Missing validation schema setup",
      });
    }

    try {
      // Zod handles context internally, so just invoke it normally
      const parsed = schema.parse(req.body);

      req.body = parsed;
      return next();
    } catch (err) {
      console.error("Validation Error:", err);

      if (err instanceof ZodError) {
        const fieldErrors = err.errors.reduce((acc, error) => {
          const path = error.path.join(".");
          acc[path] = error.message;
          return acc;
        }, {});

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: fieldErrors,
        });
      }

      // For non-Zod errors
      return res.status(500).json({
        success: false,
        message: "Internal validation error",
      });
    }
  };
}
