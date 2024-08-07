import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { getRequestInfo } from "$lib/utils";

import type { AppRouter } from "@template/trpc/sveltekit";

/**
 * Motivation: For TRPC to work seamlessly SSR, we have to proxy the Request and Response headers
 * as if we're in the browser.
 * *
 * To do that, we always need to initialize the trpc client with:
 * - the request headers from the browser
 * - and assign back the response headers back to the browser.
 *
 * If you're doing session auth on http-only cookies, this is super important to use.
 *
 * Reference: Solution on how to read the response headers: https://discord-questions.trpc.io/m/1115562530283196466#solution-1115565818395230289
 *
 * @example
 * // Your data loader function:
 *
 * export const data = async (pageContext: PageContext) => {
 *    const { request, response } = pageContext;
 *
 *    // Every trpc request using this client will now include request headers
 *    // from the browser, and pass response headers back to the browser.
 *    const trpcClient = initTRPCSSRClient(request.header(), response.headers);
 *
 *    const result = await trpcClient.currentUser.query();
 * }
 */
export const initTRPCSSRClient = (
  /** Pass the request headers sent by the browser here. */
  requestHeaders: Headers,
  /**
   * Pass the response headers to be sent back to the browser here.
   * NOTE: In SvelteKit, we can't pass response.headers directly.
   * But there is an event.setHeaders` method that we can use for this case.
   */
  responseSetHeaders: (headers: Record<string, string>) => void,
) => {
  const { domainUrl } = getRequestInfo(requestHeaders);
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: domainUrl + "/api/trpc",

        // Proxy the Request headers from the browser -> server.
        headers: () => requestHeaders ?? {},

        // Proxy the Response headers from the server -> browser.
        fetch: async (url, options) => {
          const response = await fetch(url, options);

          // This is where we proxy it back.
          const responseHeaders: Record<string, string> = {};

          for (const [key, value] of response.headers) {
            // Don't set back the Content-Type header (Otherwise, content-type HTML would become a json).
            if (key.toLowerCase() === "content-type") continue;

            responseHeaders[key] = value;
          }

          responseSetHeaders(responseHeaders);

          return response;
        },
      }),
    ],
  });
};
