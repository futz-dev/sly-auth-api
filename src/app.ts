import express from 'express';
import * as packageJson from 'package.json';
import { RegisterRoutes } from './routes';
import * as swaggerJson from './swagger.json';
import { HEADER_X_AUTH_REFRESH } from './constants';
import { corsHandler } from './serverless-util/cors';
import { errorHandler } from './serverless-util/errors';

const app = express();

app.disable('x-powered-by');

app.use(express.json());
app.use(corsHandler({ headers: [HEADER_X_AUTH_REFRESH] }));

RegisterRoutes(app);

app.use(errorHandler(packageJson.version));

app.get('/openapi.json', (_req, res) => {
  // eslint-disable-next-line @typescript-eslint/dot-notation
  res.send(JSON.stringify(swaggerJson['default']));
});

export default app;
