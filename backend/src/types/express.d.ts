// Augment the Express Request interface so that req.user is typed globally.
// This file is picked up automatically by TypeScript via `typeRoots` or
// the `include` glob in tsconfig.json.

import type { IUserDocument } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}
