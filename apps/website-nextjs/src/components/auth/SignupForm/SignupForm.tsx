"use client";

import React, { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import type { FormFieldSignUpSchema } from "@template/sdk";
import { schema } from "@template/sdk";
import { cn } from "@template/ui";
import { Button } from "@template/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@template/ui/form";
import { Input } from "@template/ui/input";
import { isBoolean, isUndefined } from "@template/utils/assertion";

import type { State } from "~/components/auth/SignupForm/signup.action";
import { submitAction } from "~/components/auth/SignupForm/signup.action";
import { Icons } from "~/components/icons";
import { InputPassword } from "~/components/shared/InputPassword";

export default function SignupForm() {
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useFormState<State, FormFieldSignUpSchema>(
    submitAction,
    undefined,
  );

  const form = useForm<FormFieldSignUpSchema>({
    resolver: zodResolver(schema.signUp),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    errors: isUndefined(state) || isBoolean(state) ? undefined : state,
    reValidateMode: "onSubmit",
  });

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form
          id="signup-form"
          data-testid="signup-form"
          onSubmit={form.handleSubmit((input) => {
            startTransition(() => formAction(input));
          })}
        >
          <div className="grid gap-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="email"
                      placeholder="example@example.com"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <InputPassword
                      data-testid="password"
                      placeholder="비밀번호"
                      autoComplete="current-password"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 확인</FormLabel>
                  <FormControl>
                    <InputPassword
                      data-testid="confirm-password"
                      placeholder="비밀번호 확인"
                      autoComplete="current-password"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isPending}
              aria-disabled={isPending}
              data-testid="signup-button"
            >
              {isPending ? (
                <Icons.spinner className="mr-2 size-4 animate-spin" />
              ) : null}
              <span>회원가입</span>
            </Button>
          </div>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className={cn("bg-background px-2 text-muted-foreground")}>
            또는
          </span>
        </div>
      </div>
    </div>
  );
}
