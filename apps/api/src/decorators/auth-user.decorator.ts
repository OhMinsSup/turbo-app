import type { Request as ExpressRequest } from "express";
import {
  createParamDecorator,
  ExecutionContext,
  HttpStatus,
} from "@nestjs/common";

import { HttpResultStatus } from "@template/sdk";

import type { PassportUser } from "../routes/auth/strategies/jwt.auth.strategy";
import { assertHttpError } from "../libs/error";

export interface Request extends ExpressRequest {
  user?: PassportUser;
}

interface DecoratorOptions {
  allowUndefined?: boolean;
}

export const AuthUser = createParamDecorator(
  (options: DecoratorOptions | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    assertHttpError(
      !options?.allowUndefined && (!request.user || !request.user.user),
      {
        resultCode: HttpResultStatus.LOGIN_REQUIRED,
        message: "이 작업을 수행할 권한이 없습니다.",
        result: null,
      },
      "이 작업을 수행할 권한이 없습니다.",
      HttpStatus.FORBIDDEN,
    );

    return request.user ? request.user.user : undefined;
  },
);

export const OptionalAuthUser = createParamDecorator(
  (options: DecoratorOptions | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user ? request.user.user : null;
  },
);
