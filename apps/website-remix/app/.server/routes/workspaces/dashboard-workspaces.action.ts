import type { ActionFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";

import type { Session } from "@template/auth";
import { HttpStatusCode } from "@template/common";

import { hardPurgeWorkspaceList } from "~/.server/cache/workspace";
import {
  patchFavoriteWorkspace,
  patchFavoriteWorkspaceRequestBody,
  postWorkspace,
  postWorkspaceRequestBody,
} from "~/.server/data/workspace";
import { auth, getSession } from "~/.server/utils/auth";
import { redirectWithToast } from "~/.server/utils/toast";
import { PAGE_ENDPOINTS } from "~/constants/constants";
import {
  defaultToastErrorMessage,
  toValidationErrorFormat,
} from "~/libs/error";

const createWorkspaceAction = async (
  args: ActionFunctionArgs,
  {
    session,
    headers,
  }: {
    session: Session;
    headers: Request["headers"];
  },
) => {
  const [requestBody] = await postWorkspaceRequestBody(args.request);

  const [ok, result, response] = await postWorkspace({
    session,
    requestBody,
  });

  if (!ok) {
    switch (response.statusCode) {
      case HttpStatusCode.BAD_REQUEST: {
        return data(
          {
            success: false as const,
            error: toValidationErrorFormat(response),
          },
          {
            headers,
          },
        );
      }
      default: {
        throw redirectWithToast(
          args.request.url,
          defaultToastErrorMessage(result.message),
          {
            headers,
          },
        );
      }
    }
  }

  hardPurgeWorkspaceList();

  return data(
    {
      success: true as const,
      workspace: result,
    },
    { headers },
  );
};

const favoriteWorkspaceAction = async (
  args: ActionFunctionArgs,
  { session, headers }: { session: Session; headers: Request["headers"] },
) => {
  const [workspaceId, requestBody] = await patchFavoriteWorkspaceRequestBody(
    args.request,
  );

  const [ok, result] = await patchFavoriteWorkspace({
    workspaceId,
    requestBody,
    session,
  });

  if (!ok) {
    throw redirectWithToast(
      args.request.url,
      defaultToastErrorMessage(result.message),
      {
        headers,
      },
    );
  }

  hardPurgeWorkspaceList();

  return data(
    {
      success: true as const,
      workspace: result,
    },
    { headers },
  );
};

export const action = async (args: ActionFunctionArgs) => {
  const { authClient, headers } = auth.handler(args);

  const { session } = await getSession(authClient);

  if (!session) {
    throw redirect(
      `${PAGE_ENDPOINTS.AUTH.SIGNIN}?redirectTo=${args.request.url}`,
      { headers },
    );
  }

  const method = args.request.method.toUpperCase();

  if (method === "POST") {
    return await createWorkspaceAction(args, { session, headers });
  } else if (method === "PATCH") {
    return await favoriteWorkspaceAction(args, { session, headers });
  } else {
    throw redirectWithToast(
      args.request.url,
      defaultToastErrorMessage("지원하지 않는 메소드입니다."),
      {
        headers,
      },
    );
  }
};

export type RoutesActionData = typeof action;
