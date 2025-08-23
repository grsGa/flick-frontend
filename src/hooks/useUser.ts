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
  mutation FollowUser($userID: String!) {
    followUser(userID: $userID) {
      id
      username
      displayName
      avatarUrl
      isFollowing
      followersCount
      followingCount
    }
  }
`;

const UNFOLLOW_USER_MUTATION = gql`
  mutation UnfollowUser($userID: String!) {
    unfollowUser(userID: $userID) {
      id
      username
      displayName
      avatarUrl
      isFollowing
      followersCount
      followingCount
    }
  }
`;

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      displayName
      bio
      location
      website
      avatarUrl
      bannerUrl
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
  const [followUser, { loading, error }] = useMutation(FOLLOW_USER_MUTATION, {
    update(cache, { data }) {
      console.log('Follow mutation response:', data);
      if (data?.followUser) {
        const { id, username, displayName, avatarUrl, isFollowing, followersCount, followingCount } = data.followUser;
        console.log('Updating cache for user:', id, 'isFollowing:', isFollowing, 'followersCount:', followersCount);
        
        // Update user data in cache using single approach
        const cacheId = cache.identify({ __typename: 'User', id });
        console.log('Cache ID:', cacheId);
        
        cache.writeFragment({
          id: cacheId,
          fragment: gql`
            fragment UpdatedUser on User {
              id
              username
              displayName
              avatarUrl
              isFollowing
              followersCount
              followingCount
            }
          `,
          data: {
            id,
            username,
            displayName,
            avatarUrl,
            isFollowing,
            followersCount,
            followingCount,
            __typename: 'User'
          }
        });
        
        console.log('Cache updated with writeFragment');
      }
    },
    refetchQueries: (result) => {
      console.log('Follow refetchQueries called with result:', result);
      return ['UserByUsername', 'Followers', 'Following'];
    },
  });

  return {
    followUser,
    loading,
    error,
  };
}

export function useUnfollowUser() {
  const [unfollowUser, { loading, error }] = useMutation(UNFOLLOW_USER_MUTATION, {
    update(cache, { data }) {
      console.log('Unfollow mutation response:', data);
      if (data?.unfollowUser) {
        const { id, username, displayName, avatarUrl, isFollowing, followersCount, followingCount } = data.unfollowUser;
        console.log('Updating cache for user:', id, 'isFollowing:', isFollowing, 'followersCount:', followersCount);
        
        // Update user data in cache using single approach
        const cacheId = cache.identify({ __typename: 'User', id });
        console.log('Cache ID:', cacheId);
        
        cache.writeFragment({
          id: cacheId,
          fragment: gql`
            fragment UpdatedUser on User {
              id
              username
              displayName
              avatarUrl
              isFollowing
              followersCount
              followingCount
            }
          `,
          data: {
            id,
            username,
            displayName,
            avatarUrl,
            isFollowing,
            followersCount,
            followingCount,
            __typename: 'User'
          }
        });
        
        console.log('Cache updated with writeFragment');
      }
    },
    refetchQueries: (result) => {
      console.log('Unfollow refetchQueries called with result:', result);
      return ['UserByUsername', 'Followers', 'Following'];
    },
  });

  return {
    unfollowUser,
    loading,
    error,
  };
}

export function useUpdateProfile() {
  const [updateProfile, { loading, error }] = useMutation(UPDATE_PROFILE_MUTATION);

  return {
    updateProfile,
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
  const { data, loading, error, fetchMore, refetch } = useQuery(FOLLOWERS_QUERY, {
    variables: { userId, first },
    skip: !userId,
    fetchPolicy: 'cache-first', // Use cache-first to prevent unnecessary network requests
  });

  return {
    followers: data?.followers?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.followers?.pageInfo,
    loading,
    error,
    fetchMore,
    refetch,
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
  const { data, loading, error, fetchMore, refetch } = useQuery(FOLLOWING_QUERY, {
    variables: { userId, first },
    skip: !userId,
    fetchPolicy: 'cache-first', // Use cache-first to prevent unnecessary network requests
  });

  return {
    following: data?.following?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.following?.pageInfo,
    loading,
    error,
    fetchMore,
    refetch,
  };
}
