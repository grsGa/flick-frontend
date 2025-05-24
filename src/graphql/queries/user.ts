import { gql } from '@apollo/client';

// 用户基本字段片段
export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    username
    email
    displayName
    avatarUrl
    coverImageUrl
    bio
    createdAt
    updatedAt
    followersCount
    followingCount
    postsCount
    isVerified
    isFollowing
    isFollowedBy
    hasBlocked
    isBlocked
  }
`;

// 获取当前用户信息
export const GET_ME = gql`
  query Me {
    me {
      ...UserFields
      roles
    }
  }
  ${USER_FIELDS}
`;

// 通过用户名获取用户信息
export const GET_USER_PROFILE = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// 获取用户详细信息
export const GET_USER = gql`
  query User($id: ID!) {
    user(id: $id) {
      ...UserFields
      roles
    }
  }
  ${USER_FIELDS}
`;

// 获取用户的帖子列表
export const GET_USER_POSTS = gql`
  query UserPosts($username: String!, $page: PageInput!) {
    userPosts(username: $username, page: $page) {
      posts {
        id
        content
        permalinkId
        createdAt
        updatedAt
        likesCount
        commentsCount
        sharesCount
        viewsCount
        isLiked
        isSaved
        status
        media {
          id
          url
          type
          thumbnailUrl
          width
          height
        }
        author {
          ...UserFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalPages
        totalCount
        currentPage
      }
    }
  }
  ${USER_FIELDS}
`;

// 获取用户关注者列表
export const GET_FOLLOWERS = gql`
  query Followers($id: ID!, $page: PageInput!) {
    user(id: $id) {
      id
      followers(page: $page) {
        users {
          ...UserFields
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          totalPages
          totalCount
          currentPage
        }
      }
    }
  }
  ${USER_FIELDS}
`;

// 获取用户正在关注的列表
export const GET_FOLLOWING = gql`
  query Following($id: ID!, $page: PageInput!) {
    user(id: $id) {
      id
      following(page: $page) {
        users {
          ...UserFields
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          totalPages
          totalCount
          currentPage
        }
      }
    }
  }
  ${USER_FIELDS}
`;

// 搜索用户
export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $page: PageInput!) {
    searchUsers(query: $query, page: $page) {
      users {
        ...UserFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalPages
        totalCount
        currentPage
      }
    }
  }
  ${USER_FIELDS}
`;

// 获取推荐关注的用户
export const GET_SUGGESTED_USERS = gql`
  query SuggestedUsers($limit: Int) {
    suggestedUsers(limit: $limit) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// 获取用户喜欢的帖子
export const GET_USER_LIKED_POSTS = gql`
  query UserLikedPosts($username: String!, $page: PageInput!) {
    userLikedPosts(username: $username, page: $page) {
      posts {
        id
        content
        permalinkId
        createdAt
        updatedAt
        likesCount
        commentsCount
        sharesCount
        viewsCount
        isLiked
        isSaved
        status
        media {
          id
          url
          type
          thumbnailUrl
          width
          height
        }
        author {
          ...UserFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalPages
        totalCount
        currentPage
      }
    }
  }
  ${USER_FIELDS}
`;

// 获取谁喜欢了帖子
export const GET_POST_LIKES = gql`
  query PostLikes($postId: ID!, $page: PageInput!) {
    postLikes(postId: $postId, page: $page) {
      users {
        ...UserFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalPages
        totalCount
        currentPage
      }
    }
  }
  ${USER_FIELDS}
`;

// 获取用户保存的帖子
export const GET_USER_SAVED_POSTS = gql`
  query UserSavedPosts($page: PageInput!) {
    userSavedPosts(page: $page) {
      posts {
        id
        content
        permalinkId
        createdAt
        updatedAt
        likesCount
        commentsCount
        sharesCount
        viewsCount
        isLiked
        isSaved
        status
        media {
          id
          url
          type
          thumbnailUrl
          width
          height
        }
        author {
          ...UserFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalPages
        totalCount
        currentPage
      }
    }
  }
  ${USER_FIELDS}
`;

// 获取Feed流帖子
export const GET_FEED = gql`
  query Feed($page: PageInput) {
    feed(page: $page) {
      posts {
        id
        content
        permalinkId
        createdAt
        likesCount
        commentsCount
        sharesCount
        viewsCount
        isLiked
        isSaved
        status
        media {
          id
          url
          type
          thumbnailUrl
        }
        author {
          id
          username
          displayName
          avatarUrl
          isVerified
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalCount
        currentPage
        totalPages
      }
    }
  }
`;

// 获取单篇帖子
export const GET_POST = gql`
  query Post($id: ID!) {
    post(id: $id) {
      id
      content
      permalinkId
      createdAt
      updatedAt
      likesCount
      commentsCount
      sharesCount
      viewsCount
      isLiked
      isSaved
      status
      media {
        id
        url
        type
        thumbnailUrl
      }
      author {
        id
        username
        displayName
        avatarUrl
        isVerified
      }
    }
  }
`;

// 根据永久链接获取帖子
export const GET_POST_BY_PERMALINK = gql`
  query PostByPermalink($username: String!, $permalinkId: String!) {
    postByPermalink(username: $username, permalinkId: $permalinkId) {
      id
      content
      permalinkId
      createdAt
      updatedAt
      likesCount
      commentsCount
      sharesCount
      viewsCount
      isLiked
      isSaved
      status
      media {
        id
        url
        type
        thumbnailUrl
      }
      author {
        id
        username
        displayName
        avatarUrl
        isVerified
      }
    }
  }
`;

// 健康检查
export const GET_HEALTH = gql`
  query Health {
    health {
      status
      time
      version
      services {
        name
        status
        message
      }
    }
  }
`; 