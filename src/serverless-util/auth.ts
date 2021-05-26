import { HttpError } from '@scaffoldly/serverless-util';
import axios from 'axios';
import { JWT } from 'jose';
import { extractAuthorization, extractToken } from './http';
import { DecodedJwtPayload, HttpRequest } from './interfaces';

export async function authorize(
  request: HttpRequest,
  securityName: string,
): Promise<DecodedJwtPayload> {
  if (securityName !== 'jwt') {
    throw new Error(`Unsupported Security Name: ${securityName}`);
  }

  const authorization = extractAuthorization(request);
  if (!authorization) {
    throw new HttpError(401, 'Missing authorization header');
  }

  const token = extractToken(authorization);
  if (!token) {
    throw new Error('Unable to extract token');
  }

  const decoded = JWT.decode(token) as DecodedJwtPayload;
  if (!decoded) {
    throw new Error('Unable to decode token');
  }

  const { authorizeUrl } = decoded;
  if (!authorizeUrl) {
    throw new Error('Missing authorizeUrl in token payload');
  }

  console.log(`Authorizing ${decoded.aud} externally to ${authorizeUrl}`);

  const { data } = await axios.post(authorizeUrl, {
    token,
  });

  // TODO: Response caching

  console.log(`Authorization response`, data);

  const { authorized, payload, error } = data;

  if (error) {
    throw error;
  }

  if (!authorized) {
    throw new Error('Unauthorized');
  }

  return payload;
}
