import { generateRoutes, generateSpec } from 'tsoa';

(async () => {
  await generateSpec({
    basePath: 'todo',
    outputDirectory: 'src',
    specVersion: 3,
    securityDefinitions: {
      jwt: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  });

  await generateRoutes({
    basePath: 'todo',
    routesDir: 'src',
    authenticationModule: 'src/auth.ts',
  });
})();
