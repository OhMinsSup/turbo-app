import { cache } from "react";
import { headers } from "next/headers";

import { createCaller, createTRPCContext } from "@template/trpc/nextjs";

import { getApiClient } from "~/store/api";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    session: null,
    headers: heads,
    client: getApiClient(),
  });
});

export const api = createCaller(createContext);