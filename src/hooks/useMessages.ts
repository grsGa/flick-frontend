import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';

const CONVERSATIONS_QUERY = gql`
  query Conversations {
    conversations {
      id
      participants {
        id
        username
        displayName
        avatarUrl
      }
      lastMessage {
        id
        content
        sender {
          id
        }
        createdAt
      }
      unreadCount
      createdAt
    }
  }
`;

const MESSAGES_QUERY = gql`
  query Messages($conversationId: ID!, $first: Int!, $after: String) {
    messages(conversationId: $conversationId, first: $first, after: $after) {
      edges {
        node {
          id
          conversationId
          sender {
            id
            username
            displayName
            avatarUrl
          }
          content
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

const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($input: CreateMessageInput!) {
    sendMessage(input: $input) {
      id
      conversationId
      sender {
        id
        username
        displayName
        avatarUrl
      }
      content
      read
      createdAt
    }
  }
`;

const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageSent($conversationId: ID!) {
    messageSent(conversationId: $conversationId) {
      id
      conversationId
      sender {
        id
        username
        displayName
        avatarUrl
      }
      content
      read
      createdAt
    }
  }
`;

export function useConversations() {
  const { data, loading, error } = useQuery(CONVERSATIONS_QUERY);

  return {
    conversations: data?.conversations || [],
    loading,
    error,
  };
}

export function useMessages(conversationId: string, first: number = 20, after?: string) {
  const { data, loading, error, fetchMore, subscribeToMore } = useQuery(MESSAGES_QUERY, {
    variables: { conversationId, first, after },
    skip: !conversationId,
  });

  return {
    messages: data?.messages?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.messages?.pageInfo,
    loading,
    error,
    fetchMore,
    subscribeToMore,
  };
}

export function useSendMessage() {
  const [sendMessage, { loading, error }] = useMutation(SEND_MESSAGE_MUTATION);

  return {
    sendMessage,
    loading,
    error,
  };
}

export function useMessageSubscription(conversationId: string) {
  const { data, loading, error } = useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { conversationId },
    skip: !conversationId,
  });

  return {
    message: data?.messageSent,
    loading,
    error,
  };
}