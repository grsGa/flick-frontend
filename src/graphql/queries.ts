import { gql } from '@apollo/client';

// User Posts Query
export const USER_POSTS_QUERY = gql`
  query UserPosts($username: String!, $first: Int!, $after: String) {
    userPosts(username: $username, first: $first, after: $after) {
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
            mimeType
            width
            height
            variants {
              thumbnail {
                url
                width
                height
                size
              }
              small {
                url
                width
                height
                size
              }
              medium {
                url
                width
                height
                size
              }
              large {
                url
                width
                height
                size
              }
              original {
                url
                width
                height
                size
              }
              preview {
                url
                width
                height
                size
              }
              lowRes {
                url
                width
                height
                size
              }
              midRes {
                url
                width
                height
                size
              }
              highRes {
                url
                width
                height
                size
              }
            }
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            replyCount
            repostCount
            viewCount
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

// Home Feed Query
export const HOME_FEED_QUERY = gql`
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
            mimeType
            width
            height
            variants {
              thumbnail {
                url
                width
                height
                size
              }
              small {
                url
                width
                height
                size
              }
              medium {
                url
                width
                height
                size
              }
              large {
                url
                width
                height
                size
              }
              original {
                url
                width
                height
                size
              }
              preview {
                url
                width
                height
                size
              }
              lowRes {
                url
                width
                height
                size
              }
              midRes {
                url
                width
                height
                size
              }
              highRes {
                url
                width
                height
                size
              }
            }
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            replyCount
            repostCount
            viewCount
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

// Timeline Query
export const GET_TIMELINE = gql`
  query GetTimeline($first: Int!, $after: String) {
    timeline(first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          updatedAt
          author {
            id
            username
            displayName
            avatarUrl
          }
          mediaAttachments {
            id
            url
            type
            variants {
              thumbnail {
                url
                width
                height
              }
              small {
                url
                width
                height
              }
              medium {
                url
                width
                height
              }
              large {
                url
                width
                height
              }
              original {
                url
                width
                height
              }
            }
          }
          stats {
            likeCount
            replyCount
            repostCount
          }
          interaction {
            isLiked
            isReposted
          }
          replyPermission
          visibility
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Following Timeline Query
export const GET_FOLLOWING_TIMELINE = gql`
  query GetFollowingTimeline($first: Int!, $after: String) {
    followingTimeline(first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          updatedAt
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
            mimeType
            width
            height
            variants {
              thumbnail {
                url
                width
                height
                size
              }
              small {
                url
                width
                height
                size
              }
              medium {
                url
                width
                height
                size
              }
              large {
                url
                width
                height
                size
              }
              original {
                url
                width
                height
                size
              }
              preview {
                url
                width
                height
                size
              }
              lowRes {
                url
                width
                height
                size
              }
              midRes {
                url
                width
                height
                size
              }
              highRes {
                url
                width
                height
                size
              }
            }
          }
          stats {
            likeCount
            replyCount
            repostCount
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            replyCount
            repostCount
            viewCount
          }
          replyPermission
          visibility
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Create Post Mutation
export const CREATE_POST_MUTATION = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      createdAt
      updatedAt
      visibility
      replyPermission
      hasMedia
      hasPoll
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
        mimeType
        width
        height
        variants {
          thumbnail {
            url
            width
            height
            size
          }
          small {
            url
            width
            height
            size
          }
          medium {
            url
            width
            height
            size
          }
          large {
            url
            width
            height
            size
          }
          original {
            url
            width
            height
            size
          }
          preview {
            url
            width
            height
            size
          }
          lowRes {
            url
            width
            height
            size
          }
          midRes {
            url
            width
            height
            size
          }
          highRes {
            url
            width
            height
            size
          }
        }
      }
      interaction {
        isLiked
        isBookmarked
        isReposted
        likeCount
        replyCount
        repostCount
      }
      tags
      mentionedUsers
    }
  }
`;

// Like Post Mutation
export const LIKE_POST_MUTATION = gql`
  mutation LikePost($input: LikePostInput!) {
    likePost(input: $input) {
      isLiked
      likeCount
    }
  }
`;
