import { useQuery, useMutation, gql } from '@apollo/client';

const NOTIFICATIONS_QUERY = gql`
  query Notifications($first: Int!, $after: String) {
    notifications(first: $first, after: $after) {
      edges {
        node {
          id
          type
          actor {
            id
            username
            displayName
            avatarUrl
          }
          entity {
            ... on Post {
              id
              content
            }
            ... on Reply {
              id
              content
            }
            ... on User {
              id
              username
              displayName
            }
          }
          read
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      id
      read
    }
  }
`;

const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`;

export function useNotifications(first: number = 10, after?: string) {
  const { data, loading, error, fetchMore } = useQuery(NOTIFICATIONS_QUERY, {
    variables: { first, after },
  });

  return {
    notifications: data?.notifications?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.notifications?.pageInfo,
    loading,
    error,
    fetchMore,
  };
}

export function useMarkNotificationAsRead() {
  const [markNotificationAsRead, { loading, error }] = useMutation(MARK_NOTIFICATION_AS_READ, {
    refetchQueries: ['Notifications'],
  });

  return {
    markNotificationAsRead,
    loading,
    error,
  };
}

export function useMarkAllNotificationsAsRead() {
  const [markAllNotificationsAsRead, { loading, error }] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ, {
    refetchQueries: ['Notifications'],
  });

  return {
    markAllNotificationsAsRead,
    loading,
    error,
  };
}