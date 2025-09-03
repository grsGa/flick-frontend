import { ApolloClient, InMemoryCache, from, ApolloLink, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP link for queries and mutations
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
  fetch: async (uri, options) => {
    // Reduced logging - only log errors and important requests
    const isImportantRequest = options?.body?.includes('userByUsername') || options?.body?.includes('login');
    
    if (isImportantRequest) {
      console.log('[Apollo Client] Important request to:', uri);
    }
    
    try {
      const response = await fetch(uri, options);
      
      if (!response.ok && isImportantRequest) {
        console.log('[Apollo Client] Response error:', response.status, response.statusText);
      }
      
      return response;
    } catch (error) {
      console.error('[Apollo Client] Network error:', error.message);
      throw error;
    }
  }
});

// Create different clients for server and browser
const createApolloClient = () => {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // Simple server-only client for SSR
    return new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
      ssrMode: true,
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
        },
        query: {
          errorPolicy: 'all',
        },
      },
    });
  }

  // Full-featured browser client
  console.log('[Apollo Client] GraphQL endpoint:', process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql');

  const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = localStorage.getItem('token');
    console.log('[Apollo Client] Setting auth headers:', { hasToken: !!token, tokenPreview: token?.substring(0, 20) + '...' });
    // return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      }
    }
  });

  // Request interceptor - reduced logging
  const requestLink = setContext((operation, { headers }) => {
    const isImportantOperation = ['UserByUsername', 'Login', 'Upload'].includes(operation.operationName || '');
    
    if (isImportantOperation) {
      console.log('[Apollo Client] Operation:', operation.operationName, 'Variables:', operation.variables);
    }
    
    return { headers };
  });

  // Error link - focused error logging
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message }) =>
        console.error('[Apollo Client] GraphQL error in', operation.operationName, ':', message)
      );
    }

    if (networkError) {
      console.error('[Apollo Client] Network error in', operation.operationName, ':', networkError.message);
      
      // Log specific network issues that might cause infinite loops
      if (networkError.message.includes('Failed to fetch') || 
          networkError.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.warn('[Apollo Client] Resource exhaustion detected - check for infinite loops');
      }
    }
  });

  // Response interceptor - minimal logging
  const responseLink = new ApolloLink((operation, forward) => {
    return forward(operation).map((response) => {
      const isImportantOperation = ['UserByUsername', 'Login', 'Upload'].includes(operation.operationName || '');
      
      if (isImportantOperation && (response.errors || !response.data)) {
        console.log('[Apollo Client] Response for', operation.operationName, ':', {
          hasData: !!response.data,
          hasErrors: !!response.errors
        });
      }
      
      return response;
    });
  });

  // WebSocket link for subscriptions
  const wsLink = new GraphQLWsLink(
    createClient({
      url: process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || 'ws://localhost:8080/graphql',
    })
  );

  // Split link based on operation type
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    from([responseLink, httpLink]),
  );

  return new ApolloClient({
    link: from([errorLink, requestLink, authLink, splitLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            userPosts: {
              keyArgs: ['username'],
              merge(existing, incoming, { args }) {
                if (!existing) {
                  return incoming;
                }
                if (!args?.after) {
                  return incoming;
                }
                return {
                  ...incoming,
                  edges: [...(existing.edges || []), ...(incoming.edges || [])],
                };
              }
            },
            homeFeed: {
              keyArgs: [],
              merge(existing, incoming) {
                return incoming;
              }
            },
            userByUsername: {
              keyArgs: ['username'],
              merge(existing, incoming) {
                return incoming;
              }
            }
          }
        },
        PostConnection: {
          fields: {
            edges: {
              merge(existing = [], incoming = []) {
                return incoming;
              }
            }
          }
        }
      }
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
};

const client = createApolloClient();

export default client;
