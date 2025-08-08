import { useQuery, useMutation, gql } from '@apollo/client';
import { Tweet } from '@/graphql/types';

// GraphQL queries and mutations
const HOME_FEED_QUERY = gql`
  query HomeFeed($first: Int!, $after: String) {
    homeFeed(first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          author {
            id
            username
            displayName
            avatarUrl
            isVerified
          }
          media {
            id
            url
            type
          }
          interaction {
            isLiked
            isBookmarked
            isRetweeted
            likeCount
            commentCount
            retweetCount
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const USER_TWEETS_QUERY = gql`
  query UserTweets($username: String!, $first: Int!, $after: String) {
    userTweets(username: $username, first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          author {
            id
            username
            displayName
            avatarUrl
            isVerified
          }
          media {
            id
            url
            type
          }
          interaction {
            isLiked
            isBookmarked
            isRetweeted
            likeCount
            commentCount
            retweetCount
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const CREATE_TWEET_MUTATION = gql`
  mutation CreateTweet($input: CreateTweetInput!) {
    createTweet(input: $input) {
      id
      content
      createdAt
      author {
        id
        username
        displayName
        avatarUrl
        isVerified
      }
      media {
        id
        url
        type
      }
      interaction {
        isLiked
        isBookmarked
        isRetweeted
        likeCount
        commentCount
        retweetCount
      }
    }
  }
`;

const LIKE_TWEET_MUTATION = gql`
  mutation LikeTweet($input: LikeTweetInput!) {
    likeTweet(input: $input) {
      isLiked
      likeCount
    }
  }
`;

export function useHomeFeed(first: number = 10, after?: string) {
  const { data, loading, error, fetchMore } = useQuery(HOME_FEED_QUERY, {
    variables: { first, after },
  });

  return {
    tweets: data?.homeFeed?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.homeFeed?.pageInfo,
    loading,
    error,
    fetchMore,
  };
}

export function useUserTweets(username: string, first: number = 10, after?: string) {
  const { data, loading, error, fetchMore } = useQuery(USER_TWEETS_QUERY, {
    variables: { username, first, after },
  });

  return {
    tweets: data?.userTweets?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.userTweets?.pageInfo,
    loading,
    error,
    fetchMore,
  };
}

export function useCreateTweet() {
  const [createTweet, { loading, error }] = useMutation(CREATE_TWEET_MUTATION, {
    update(cache, { data: { createTweet } }) {
      // Update cache with new tweet
      // This would be more complex in a real implementation
    }
  });

  return {
    createTweet,
    loading,
    error,
  };
}

export function useLikeTweet() {
  const [likeTweet, { loading, error }] = useMutation(LIKE_TWEET_MUTATION);

  return {
    likeTweet,
    loading,
    error,
  };
}