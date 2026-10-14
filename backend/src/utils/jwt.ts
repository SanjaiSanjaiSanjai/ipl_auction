import jwt, { JwtPayload } from 'jsonwebtoken';
import {Types} from 'mongoose';
import { NotFound } from '../errors/notfound.error.ts';
import { Unauthorize } from '../errors/unauthorize.error.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-a-long-random-secret';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'replace-with-a-long-random-access-token-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'replace-with-a-long-random-refresh-token-secret';

if (!JWT_SECRET || !JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new NotFound('JWT secret keys are not defined in the environment variables.',[{field: 'JWT secret keys', message: 'Please define JWT_SECRET, JWT_ACCESS_SECRET, and JWT_REFRESH_SECRET in your environment variables.',issue: 'Missing JWT secret keys'}]);
}

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
  if (!decoded){
    throw new Unauthorize('Unauthorized: Invalid token', [
      {
        field: 'Authorization',
        message: 'Invalid token',
        issue: 'Token verification failed',
      },
    ]);
  }
  return decoded as JwtPayload;
};
