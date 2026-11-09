import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { mastera_ERROR_CODES } from '@mastera/contracts';

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: unknown): void;
}

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponse>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      return response.status(status).json(res);
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal Server Error';

    // Map domain error code to status
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';

    for (const [code] of Object.entries(mastera_ERROR_CODES)) {
      if (message.includes(code)) {
        errorCode = code;
        if (
          code === mastera_ERROR_CODES.PERMISSION_DENIED ||
          code === mastera_ERROR_CODES.OUT_OF_SCOPE
        ) {
          status = HttpStatus.FORBIDDEN;
        } else if (
          code === mastera_ERROR_CODES.CLAIM_SECRET_INVALID ||
          code === mastera_ERROR_CODES.DEVICE_MISMATCH_LOCKED
        ) {
          status = HttpStatus.UNAUTHORIZED;
        } else if (
          code === mastera_ERROR_CODES.ACCOUNT_EXISTS_LOGIN_REQUIRED ||
          code === mastera_ERROR_CODES.TRANSACTION_REFERENCE_DUPLICATE
        ) {
          status = HttpStatus.CONFLICT;
        } else {
          status = HttpStatus.BAD_REQUEST;
        }
        break;
      }
    }

    return response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
