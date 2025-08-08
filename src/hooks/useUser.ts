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
      isFollowing
      followersCount
    }
  }
`;

const UNFOLLOW_USER_MUTATION = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) {
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