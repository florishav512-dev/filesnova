import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: () => Promise.resolve(null), // No backend queries needed for static site
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Static site doesn't need API requests, all processing is client-side
export async function apiRequest(): Promise<Response> {
  throw new Error('API requests not available in static build');
}