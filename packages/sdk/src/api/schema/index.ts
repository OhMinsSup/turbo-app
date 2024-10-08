import { schema as authSchema } from "./auth.schema";

export type {
  FormFieldRefreshTokenSchema,
  FormFieldSignInSchema,
  FormFieldSignUpSchema,
  FormFieldVerifyTokenSchema,
  FormFieldSignoutSchema,
} from "./auth.schema";

export const schema = {
  ...authSchema,
};

export type Schema = typeof schema;
