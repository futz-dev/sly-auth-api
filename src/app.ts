import express from 'express';
import { readFileSync } from 'fs';
import packageJson from 'package.json';
import { RegisterRoutes } from './routes';

import {
  corsHandler,
  errorHandler,
  createApp,
  registerDocs,
  registerVersion,
} from './serverless-util';

import swaggerJson from './swagger.json';

const app = createApp();

app.use(corsHandler({ headers: ['x-auth-refresh'] }));

RegisterRoutes(app);

app.use(errorHandler(packageJson.version));

registerDocs(app, swaggerJson);
registerVersion(app, packageJson.version);

app.get('/auth/jwt.html', (_req: express.Request, res: express.Response) => {
  const file = readFileSync('./public/jwt.html');
  res.type('html');
  res.send(file);
});

export default app;
