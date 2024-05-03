import { redirect, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { parseWithZod } from "@conform-to/zod";
import { validateMethods } from "~/.server/utils/request.server";
import { navigation } from "~/constants/navigation";
import { schema } from "~/services/validate/sigin.validate";
import { prisma } from "~/.server/db.server";
import { comparePassword } from "~/.server/utils/password.server";
import {
  getSessionExpirationDate,
  getSessionStorage,
} from "~/.server/session.server";
import { sessionKey } from "~/.server/auth.server";
import { safeRedirect } from "remix-utils/safe-redirect";

export const loginAction = async ({ request, context }: ActionFunctionArgs) => {
  // 유효성 검사
  validateMethods(request, ["POST"], navigation.login);

  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema });

  // Report the submission to client if it is not successful
  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: submission.value.email,
      },
      select: {
        id: true,
        password: {
          select: {
            hash: true,
          },
        },
      },
    });

    if (!user) {
      return submission.reply({
        fieldErrors: {
          email: ["존재하지 않는 이메일입니다."],
        },
      });
    }

    const hash = user.password?.hash;
    if (!hash) {
      return submission.reply({
        fieldErrors: {
          password: ["비밀번호가 일치하지 않습니다."],
        },
      });
    }

    const validate = await comparePassword(
      submission.value.password,
      hash,
      "salt"
    );

    if (!validate) {
      return submission.reply({
        fieldErrors: {
          password: ["비밀번호가 일치하지 않습니다."],
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const session = await prisma.session.create({
      select: { id: true, expirationDate: true },
      data: {
        expirationDate: getSessionExpirationDate(),
        userId: user.id,
      },
    });

    const sessionStorage = getSessionStorage();

    const cookieSession = await sessionStorage.getSession(
      request.headers.get("cookie")
    );

    cookieSession.set(sessionKey, session.id);

    return redirect(safeRedirect(navigation.home), {
      headers: {
        "set-cookie": await sessionStorage.commitSession(cookieSession),
      },
    });
  } catch (e) {
    console.error(e);
    return submission.reply({
      formErrors: ["로그인에 실패했습니다. 다시 시도해주세요."],
    });
  }
};

export type RoutesActionData = typeof loginAction;