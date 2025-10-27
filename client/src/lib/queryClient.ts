import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);

  // Handle empty responses
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }

  return {};
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });

        // SECURITY: Immediately clear cache on auth failure
        if (res.status === 401) {
          console.log('🚨 [QUERY] 401 detected - clearing all cached data');
          queryClient.clear();
          sessionStorage.clear();
          const theme = localStorage.getItem('theme');
          localStorage.clear();
          if (theme) localStorage.setItem('theme', theme);
        }

        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }

          throw new Error(`${res.status}: ${await res.text()}`);
        }

        return res.json();
      },
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error.message.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 0, // Always fetch fresh data for auth-related queries
      cacheTime: 0, // Don't cache auth data
    },
    mutations: {
      onError: (error: any) => {
        // SECURITY: Clear cache on mutation auth errors
        if (error.message.includes('401')) {
          console.log('🚨 [MUTATION] 401 detected - clearing all cached data');
          queryClient.clear();
          sessionStorage.clear();
          const theme = localStorage.getItem('theme');
          localStorage.clear();
          if (theme) localStorage.setItem('theme', theme);
        }
        console.error("Mutation error:", error);
      },
    },
  },
});