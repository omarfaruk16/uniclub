export type ActionResult = {
  ok: boolean;
  message?: string;
  /** Field-level validation errors keyed by input name. */
  errors?: Record<string, string>;
  /** Bumped on every successful submit so forms can reset themselves. */
  nonce?: number;
  /** Extra values for the client (e.g. a dev-mode reset link). */
  data?: Record<string, string>;
};

export const ok = (message?: string): ActionResult => ({ ok: true, message, nonce: Date.now() });
export const fail = (message: string, errors?: Record<string, string>): ActionResult => ({
  ok: false,
  message,
  errors,
});
