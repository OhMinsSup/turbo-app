import type { SessionData, SessionStorage } from '@remix-run/node';
import { createCookieSessionStorage, redirect } from '@remix-run/node';
import { createId as cuid } from '@paralleldrive/cuid2';
import { z } from 'zod';

import { combineHeaders } from '../http/request.server.js';

export const NAME = 'client-remix-with-solana.toast';

export const toastKey = 'toast';

const ToastSchema = z.object({
  description: z.string(),
  id: z.string().default(() => cuid()),
  title: z.string().optional(),
  type: z.enum(['message', 'success', 'error']).default('message'),
});

export type Toast = z.infer<typeof ToastSchema>;
export type ToastInput = z.input<typeof ToastSchema>;

export const toastSessionStorage: SessionStorage<SessionData, SessionData> =
  createCookieSessionStorage({
    cookie: {
      name: NAME,
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
      secrets: [process.env.TOAST_SECRET],
    },
  });

export async function redirectWithToast(
  url: string,
  toast: ToastInput,
  init?: ResponseInit,
) {
  return redirect(url, {
    ...init,
    headers: combineHeaders(init?.headers, await createToastHeaders(toast)),
  });
}

export async function createToastHeaders(toastInput: ToastInput) {
  const session = await toastSessionStorage.getSession();
  const toast = ToastSchema.parse(toastInput);
  session.flash(toastKey, toast);
  const cookie = await toastSessionStorage.commitSession(session);
  return new Headers({ 'set-cookie': cookie });
}

export async function getToast(request: Request) {
  const session = await toastSessionStorage.getSession(
    request.headers.get('cookie'),
  );
  const result = ToastSchema.safeParse(session.get(toastKey));
  const toast = result.success ? result.data : null;
  return {
    toast,
    headers: toast
      ? new Headers({
          'set-cookie': await toastSessionStorage.destroySession(session),
        })
      : null,
  };
}
