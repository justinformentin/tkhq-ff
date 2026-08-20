import { Request } from 'express';
import {
  DEFAULT_ENVIRONMENT,
  Environment,
  InvalidEnvironmentError,
  isEnvironment,
} from '../config/environments';

// Every route is scoped to one environment, chosen by ?env=. An unknown value
// is rejected rather than silently falling back, so a typo can't send a write
// to the wrong environment.
export function envOf(req: Request): Environment {
  const value = req.query.env ?? DEFAULT_ENVIRONMENT;

  if (!isEnvironment(value)) {
    throw new InvalidEnvironmentError(String(value));
  }

  return value;
}
