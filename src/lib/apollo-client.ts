import { ApolloClient, InMemoryCache, createHttpLink, from, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP link for queries and mutations
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
});

console.log('[Apollo Client] GraphQL endpoint:', process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql');

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  console.log('[Apollo Client] Setting auth headers:', { hasToken: !!token, tokenPreview: token?.substring(0, 20) + '...' });
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// Request interceptor to log all requests
const requestLink = setContext((operation, { headers }) => {
  console.log('[Apollo Client] ===== OUTGOING REQUEST =====');
  console.log('[Apollo Client] Operation:', operation.operationName);
  console.log('[Apollo Client] Variables:', JSON.stringify(operation.variables, null, 2));
  console.log('[Apollo Client] Query:', operation.query.loc?.source.body);
  console.log('[Apollo Client] Headers:', headers);
  console.log('[Apollo Client] =====================================');
  return { headers };
});

// Response interceptor to log all responses
const responseLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    console.log('[Apollo Client] ===== RESPONSE RECEIVED =====');
    console.log('[Apollo Client] Operation:', operation.operationName);
    console.log('[Apollo Client] Response data:', response.data);
    console.log('[Apollo Client] Response errors:', response.errors);
    console.log('[Apollo Client] =====================================');
    return response;
  });
});

// Error link for debugging
const errorLink = onError(({ graphQLErrors, networkError, operation, forward, response }) => {
  console.log('[Apollo Client] ===== ERROR INTERCEPTED =====');
  console.log('[Apollo Client] Operation:', operation.operationName);
  console.log('[Apollo Client] Variables:', JSON.stringify(operation.variables, null, 2));
  console.log('[Apollo Client] Response:', response);
  console.log('[Apollo Client] =====================================');

  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error('[Apollo Client] GraphQL error:', { message, locations, path })
    );
  }

  if (networkError) {
    console.error('[Apollo Client] Network error:', networkError);
    console.error('[Apollo Client] Network error type:', typeof networkError);
    console.error('[Apollo Client] Network error keys:', Object.keys(networkError));
    if ('statusCode' in networkError) {
      console.error('[Apollo Client] HTTP status:', networkError.statusCode);
    }
    if ('result' in networkError) {
      console.error('[Apollo Client] Error response:', networkError.result);
    }
    if ('response' in networkError) {
      console.error('[Apollo Client] Raw response:', networkError.response);
    }
  }
});

// WebSocket link for subscriptions
const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || 'ws://localhost:8080/graphql',
  })
) : null;

// Split link based on operation type
const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink,
    )
  : httpLink;

// Create Apollo Client
const client = new ApolloClient({
  link: from([errorLink, responseLink, requestLink, authLink, splitLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          userPosts: {
            keyArgs: ['username'],
            merge(existing, incoming, { args }) {
              console.log('[Apollo Cache] Merging userPosts:', { existing, incoming, args });
              if (!existing) {
                return incoming;
              }
              if (!args?.after) {
                // 如果没有after参数，说明是初始查询，直接返回新数据
                return incoming;
              }
              // 合并数据：保留现有edges，追加新的edges
              return {
                ...incoming,
                edges: [...(existing.edges || []), ...(incoming.edges || [])],
              };
            }
          },
          homeFeed: {
            keyArgs: [],
            merge(existing, incoming, { args }) {
              console.log('[Apollo Cache] Merging homeFeed:', { existing, incoming, args });
              return incoming;
            }
          }
        }
      },
      PostConnection: {
        fields: {
          edges: {
            merge(existing = [], incoming = []) {
              console.log('[Apollo Cache] Merging PostConnection edges:', { existing: existing.length, incoming: incoming.length });
              return incoming;
            }
          }
        }
      }
    }
  }),
});

export default client;
