import axios from 'axios';
import { JWT } from 'jose';
import { DecodedJwtPayload } from '../interfaces/Jwt';
import { extractAuthorization, HttpRequest } from './http';

export async function authorize(
  request: HttpRequest,
  securityName: string,
  scopes?: string[],
): Promise<DecodedJwtPayload> {
  if (securityName !== 'jwt') {
    throw new Error(`Unsupported Security Name: ${securityName}`);
  }

  const token = extractAuthorization(request);
  if (!token) {
    throw new Error('Missing token');
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
    scopes,
    method: request.method,
    host: request.hostname,
    path: request.path,
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
