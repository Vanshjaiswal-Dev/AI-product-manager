// ── AppError ──────────────────────────────────────────────────────────────────
// Typed error class used across all controllers.
// Using a class (instead of { statusCode } attached to a plain Error) allows
// `instanceof AppError` checks and guarantees the shape of every thrown error.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly rawOutput?: string;

  constructor(message: string, statusCode: number, rawOutput?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.rawOutput = rawOutput;
    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ── JWT payload ───────────────────────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}
