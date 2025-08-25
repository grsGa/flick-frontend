import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Create a simple server-side Apollo client for SSR
export function getClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: createHttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
      // Important for SSR: disable credentials to avoid CORS issues
      fetchOptions: { cache: 'no-store' },
    }),
  });
}
