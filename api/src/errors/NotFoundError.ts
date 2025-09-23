import { DomainError } from './DomainError';

export type NotFoundDetails = { id: string };

export class NotFoundError extends DomainError<NotFoundDetails> {
  constructor(details: NotFoundDetails, message = 'Post not found') {
    super('POST_NOT_FOUND', message, details);
    this.name = 'NotFoundError';
  }
}


