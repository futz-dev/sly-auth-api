import express from 'express';
import * as packageJson from 'package.json';
import { readFileSync } from 'fs';
import { RegisterRoutes } from './routes';
import * as swaggerJson from './swagger.json';
import { corsHandler, errorHandler } from './serverless-util';

const app = express();

app.disable('x-powered-by');

app.use(express.json());
app.use(corsHandler({ headers: ['x-auth-refresh'] }));

RegisterRoutes(app);

app.use(errorHandler(packageJson.version));

app.get('/auth/openapi.json', (_req: express.Request, res: express.Response) => {
  // eslint-disable-next-line @typescript-eslint/dot-notation
  res.send(JSON.stringify(swaggerJson['default']));
});
app.get('/auth/jwt.html', (_req: express.Request, res: express.Response) => {
  const file = readFileSync('./public/jwt.html');
  res.type('html');
  res.send(file);
});

export default app;
