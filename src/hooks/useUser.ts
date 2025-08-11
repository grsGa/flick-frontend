import { useQuery, useMutation, gql } from '@apollo/client';
import { User } from '@/graphql/types';

const USER_BY_USERNAME_QUERY = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
      displayName
      bio
      avatarUrl
      bannerUrl
      followersCount
      followingCount
      isFollowing
      isVerified
      createdAt
    }
  }
`;

const FOLLOW_USER_MUTATION = gql`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) {
      id
      isFollowing
      followersCount
    }
  }
`;

const UNFOLLOW_USER_MUTATION = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) {
      id
      isFollowing
      followersCount
    }
  }
`;

const RECOMMENDED_USERS_QUERY = gql`
  query RecommendedUsers($first: Int!) {
    recommendedUsers(first: $first) {
      id
      username
      displayName
      bio
      avatarUrl
      isFollowing
    }
  }
`;

export function useUserByUsername(username: string) {
  const { data, loading, error } = useQuery(USER_BY_USERNAME_QUERY, {
    variables: { username },
  });

  return {
    user: data?.userByUsername,
    loading,
    error,
  };
}

export function useFollowUser() {
  const [followUser, { loading, error }] = useMutation(FOLLOW_USER_MUTATION);

  return {
    followUser,
    loading,
    error,
  };
}

export function useUnfollowUser() {
  const [unfollowUser, { loading, error }] = useMutation(UNFOLLOW_USER_MUTATION);

  return {
    unfollowUser,
    loading,
    error,
  };
}

export function useRecommendedUsers(first: number = 5) {
  const { data, loading, error } = useQuery(RECOMMENDED_USERS_QUERY, {
    variables: { first },
  });

  return {
    users: data?.recommendedUsers || [],
    loading,
    error,
  };
}

const FOLLOWERS_QUERY = gql`
  query Followers($userId: ID!, $first: Int!, $after: String) {
    followers(userId: $userId, first: $first, after: $after) {
      edges {
        node {
          id
          username
          displayName
          bio
          avatarUrl
          isFollowing
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useFollowers(userId: string, first: number = 10) {
  const { data, loading, error, fetchMore } = useQuery(FOLLOWERS_QUERY, {
    variables: { userId, first },
    skip: !userId,
  });

  return {
    followers: data?.followers?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.followers?.pageInfo,
    loading,
    error,
    fetchMore,
  };
}

const FOLLOWING_QUERY = gql`
  query Following($userId: ID!, $first: Int!, $after: String) {
    following(userId: $userId, first: $first, after: $after) {
      edges {
        node {
          id
          username
          displayName
          bio
          avatarUrl
          isFollowing
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useFollowing(userId: string, first: number = 10) {
  const { data, loading, error, fetchMore } = useQuery(FOLLOWING_QUERY, {
    variables: { userId, first },
    skip: !userId,
  });

  return {
    following: data?.following?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.following?.pageInfo,
    loading,
    error,
    fetchMore,
  };
}
