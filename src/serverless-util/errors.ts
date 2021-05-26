/* eslint-disable @typescript-eslint/dot-notation */
import { ValidateError } from 'tsoa';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from '@scaffoldly/serverless-util';
import { ErrorResponse, ErrorResponseTracking } from './interfaces';

const XRAY_ENV_TRACE_ID = '_X_AMZN_TRACE_ID';

export function errorHandler(version: string) {
  return (err: Error, req: Request, res: Response, next: NextFunction): Response | void => {
    const traceId = process.env[XRAY_ENV_TRACE_ID] || 'Unknown-Trace-Id';
    const tracking: ErrorResponseTracking = {
      method: req.method,
      path: req.path,
      version,
      source: (err && err instanceof Error && err.stack
        ? err.stack.split('\n')[1]
        : new Error().stack.split('\n')[2]
      ).trim(),
    };

    console.warn(
      `[Error] [${traceId}] [${err.name || Object.getPrototypeOf(err)}] Message: ${
        err.message
      } Tracking: ${JSON.stringify(tracking)}`,
      err,
    );

    let httpError: HttpError;

    if (err instanceof HttpError) {
      httpError = err;
    } else if (err instanceof ValidateError) {
      httpError = new HttpError(422, 'Validation Failed', { fields: err.fields });
    } else if (err['statusCode']) {
      httpError = new HttpError(err['statusCode'], err.message || err.name, err);
    } else {
      httpError = new HttpError(500, err.message || 'Internal Server Error', err);
    }

    res.status(httpError.statusCode).json({
      message: httpError.message,
      traceId,
      tracking,
      context: httpError.context,
    } as ErrorResponse);

    next();
  };
}
