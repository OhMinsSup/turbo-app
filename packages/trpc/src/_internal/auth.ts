import type { ApiClient, TokenResponse, UserResponse } from "@template/sdk";
import { getTokenFromCookie } from "@template/utils/cookie";
import { isAccessTokenExpireDate } from "@template/utils/date";
import { jwtDecode } from "@template/utils/jwt";

import { mergeClearAuthTokens, mergeTokenHeaders } from "./misc";

interface ValidateRefreshTokenParams {
  accessToken: string;
  refreshToken?: string | null;
  resHeaders: Headers;
  client: ApiClient;
}

export async function validateAuth(params: ValidateRefreshTokenParams) {
  const { accessToken, refreshToken, client, resHeaders } = params;
  // refresh token이 없는 경우 재발급 안되게 처리
  if (!refreshToken) {
    return {
      status: "action:invalidRefreshToken" as const,
      tokens: null,
      headers: mergeClearAuthTokens(resHeaders),
    };
  }

  // accessToken의 decode해서 만료일자를 가져온다.
  const decode = jwtDecode(accessToken);
  if (!decode) {
    return {
      status: "action:dencodeTokenError" as const,
      tokens: null,
      headers: mergeClearAuthTokens(resHeaders),
    };
  }

  // access token이 만료되기 5분 전에 refresh token을 사용하여 access token을 갱신한다.
  if (decode.exp && isAccessTokenExpireDate(decode.exp * 1000)) {
    try {
      // 발급이 완료된 상태
      const refreshRes = await client.rpc("refresh").patch({
        refreshToken,
      });

      const {
        result: { tokens },
      } = refreshRes;

      return {
        status: "action:refreshed" as const,
        tokens,
        headers: mergeTokenHeaders(tokens, resHeaders),
      };
    } catch (error) {
      // 발급이 실패한 상태
      return {
        status: "action:invalidRefreshToken" as const,
        tokens: null,
        headers: mergeClearAuthTokens(resHeaders),
      };
    }
  }

  // refresh를 할 필요가 없는 경우
  return {
    status: "action:notRefreshed" as const,
    tokens: null,
    headers: resHeaders,
  };
}

interface VerifyTokenParams {
  accessToken: string;
  client: ApiClient;
}

/**
 * 토큰이 유효한지 체크
 */
export async function verify(params: VerifyTokenParams) {
  const { accessToken, client } = params;
  try {
    // 토큰이 유효한지 체크
    const response = await client.rpc("verify").post({
      token: accessToken,
    });
    return response.result;
  } catch (error) {
    return false;
  }
}

interface GetUserInfoParams {
  accessToken: string;
  client: ApiClient;
}

/**
 * 유저 정보를 가져온다.
 */
export async function getUserInfo(params: GetUserInfoParams) {
  const { accessToken, client } = params;

  try {
    const response = await client.rpc("me").setAuthToken(accessToken).get();
    return response.result;
  } catch (error) {
    return null;
  }
}

interface AuthParams {
  headers: Headers;
  resHeaders: Headers;
  client: ApiClient;
}

type AuthFunctionResult =
  | {
      status: "action:loggedIn";
      user: UserResponse;
      headers: Headers;
    }
  | {
      status: "action:notLogin";
      user: null;
      headers: Headers;
    }
  | {
      status: "action:invalidToken";
      user: null;
      headers: Headers;
    }
  | {
      status: "action:refreshed";
      user: UserResponse;
      headers: Headers;
    }
  | {
      status: "action:notRefreshed";
      user: null;
      headers: Headers;
    }
  | {
      status: "action:error";
      user: null;
      headers: Headers;
    }
  | {
      status: "action:invalidRefreshToken";
      user: null;
      headers: Headers;
    }
  | {
      status: "action:dencodeTokenError";
      user: null;
      headers: Headers;
    };

/**
 * 인증 체크
 */
export async function auth(params: AuthParams): Promise<AuthFunctionResult> {
  const { headers, client, resHeaders } = params;
  const cookieString = headers.get("Cookie");
  if (!cookieString) {
    return {
      status: "action:notLogin" as const,
      user: null,
      headers: mergeClearAuthTokens(resHeaders),
    };
  }

  const { refreshToken, accessToken } = getTokenFromCookie(cookieString);
  // 쿠키는 존재하지만 인증 토큰이 존재하는지 체크가 필요
  if (!accessToken) {
    // accessToken이 없는 경우 refreshToken으로 accessToken을 갱신한다.
    if (refreshToken) {
      const response = await refresh({
        headers,
        client,
        resHeaders,
      });

      return response;
    }
    return {
      status: "action:notLogin" as const,
      user: null,
      headers: mergeClearAuthTokens(resHeaders),
    };
  }

  try {
    const ok = await verify({
      accessToken,
      client,
    });
    // 토큰이 존재하는 해당 토큰이 잘못된 토큰인지 체크한다.
    if (!ok) {
      return {
        status: "action:invalidToken" as const,
        user: null,
        headers: mergeClearAuthTokens(resHeaders),
      };
    }

    // accessToken이 만료되기 5분 전에 refreshToken으로 accessToken을 갱신한다.
    const {
      status,
      tokens,
      headers: newHeaders,
    } = await validateAuth({
      accessToken,
      refreshToken,
      resHeaders,
      client,
    });

    switch (status) {
      case "action:refreshed": {
        // 새로운 토큰 정보를 header에 적용시킨 후 유저 정보를 가져온다.
        const userRes = await getUserInfo({
          accessToken: tokens.accessToken.token,
          client,
        });

        if (!userRes) {
          return {
            status: "action:notLogin" as const,
            user: null,
            headers: mergeClearAuthTokens(resHeaders),
          };
        }

        return {
          status,
          user: userRes,
          headers: newHeaders,
        };
      }
      case "action:notRefreshed": {
        // refreshToken으로 accessToken을 갱신할 필요가 없는 경우
        break;
      }
      default: {
        // 재발급시 에러가 발생하는 경우
        return {
          status,
          user: null,
          headers: newHeaders,
        };
      }
    }

    const userRes = await getUserInfo({
      accessToken,
      client,
    });

    if (!userRes) {
      return {
        status: "action:notLogin" as const,
        user: null,
        headers: mergeClearAuthTokens(resHeaders),
      };
    }

    return {
      status: "action:loggedIn" as const,
      user: userRes,
      headers: newHeaders,
    };
  } catch (error) {
    console.error(error);
    return {
      status: "action:error" as const,
      user: null,
      headers: mergeClearAuthTokens(resHeaders),
    };
  }
}

interface RefreshParams {
  headers: Headers;
  resHeaders: Headers;
  client: ApiClient;
}

type RefreshFunctionResult =
  | {
      status: "action:refreshed";
      user: UserResponse;
      headers: Headers;
    }
  | {
      status: "action:notLogin";
      user: null;
      headers: Headers;
    }
  | {
      status: "action:error";
      user: null;
      headers: Headers;
    };

/**
 * 토큰을 갱신한다.
 */
export async function refresh(
  params: RefreshParams,
): Promise<RefreshFunctionResult> {
  const { headers, client, resHeaders } = params;
  const cookieString = headers.get("Cookie");
  if (!cookieString) {
    return {
      status: "action:notLogin" as const,
      user: null,
      headers: mergeClearAuthTokens(resHeaders),
    };
  }

  const { refreshToken } = getTokenFromCookie(cookieString);
  if (!refreshToken) {
    return {
      status: "action:notLogin" as const,
      user: null,
      headers: mergeClearAuthTokens(resHeaders),
    };
  }

  try {
    const refreshRes = await client.rpc("refresh").patch({
      refreshToken,
    });

    const {
      result: { tokens },
    } = refreshRes;

    const userRes = await getUserInfo({
      accessToken: tokens.accessToken.token,
      client,
    });

    if (!userRes) {
      return {
        status: "action:notLogin" as const,
        user: null,
        headers: mergeClearAuthTokens(resHeaders),
      };
    }

    return {
      status: "action:refreshed" as const,
      user: userRes,
      headers: mergeTokenHeaders(tokens, resHeaders),
    };
  } catch (error) {
    return {
      status: "action:error" as const,
      user: null,
      headers: mergeClearAuthTokens(resHeaders),
    };
  }
}

/**
 * 로그아웃
 */
export function signout(defaultHeaders?: Headers): Headers {
  return mergeClearAuthTokens(defaultHeaders);
}

/**
 * 로그인
 */
export function signin(
  token: TokenResponse,
  defaultHeaders?: Headers,
): Headers {
  return mergeTokenHeaders(token, defaultHeaders);
}
