const errors = [
  "BAD_REQUEST",
  "EVENT_NOT_FOUND",
  "INVALID_PAYLOAD",
  "TASK_NOT_FOUND",
  "TIMEOUT",
  "TOO_MANY_ATTEMPTS",
  "UNKNOWN_ERROR",
] as const;

type DIP_ERROR_CODE_KEY = (typeof errors)[number];

export class DIPError extends Error {
  public readonly code: (typeof errors)[number];

  constructor(opts: { message?: string; code: DIP_ERROR_CODE_KEY }) {
    const message = opts.message ?? opts.code;
    super(message);
    this.code = opts.code;
    this.name = this.constructor.name;
  }
}
