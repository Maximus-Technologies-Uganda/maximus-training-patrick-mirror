export class DomainError<TDetails = unknown> extends Error {
  public readonly code: string;
  public readonly details?: TDetails;

  constructor(code: string, message: string, details?: TDetails) {
    super(message || code);
    this.name = 'DomainError';
    this.code = code;
    if (details !== undefined) {
      this.details = details as TDetails;
    }
  }
}


