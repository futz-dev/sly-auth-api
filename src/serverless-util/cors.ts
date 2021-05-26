import cors from 'cors';

export interface Options {
  headers?: string[];
}

// TODO: Customizable origin
export function corsHandler(options: Options = {}): (
  req: cors.CorsRequest,
  res: {
    statusCode?: number;
    setHeader(key: string, value: string): any;
    end(): any;
  },
  next: (err?: any) => any,
) => void {
  return cors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Amz-Date',
      'X-Api-Key',
      'X-Amz-Security-Token',
      'X-Amz-User-Agent',
      ...(options.headers && options.headers.length ? options.headers : []),
    ],
    credentials: false,
    exposedHeaders: [
      'X-Amzn-Trace-Id',
      ...(options.headers && options.headers.length ? options.headers : []),
    ],
    optionsSuccessStatus: 200,
    preflightContinue: true,
  });
}
