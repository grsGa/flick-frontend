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
        viewCount
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

// Subscription queries for real-time updates
export const POST_CREATED_SUBSCRIPTION = gql`
  subscription PostCreated {
    postCreated {
      post {
        id
        content
        createdAt
        updatedAt
        visibility
        replyPermission
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
          variants {
            thumbnail
            small
            medium
            large
          }
        }
        metrics {
          replyCount
          repostCount
          likeCount
          bookmarkCount
        }
        interactions {
          isLiked
          isReposted
          isBookmarked
          likeCount
          replyCount
          repostCount
          viewCount
        }
        parentId
        rootId
        mentionedUsers {
          id
          username
          displayName
        }
        tags
        pollData {
          id
          options {
            id
            text
            voteCount
          }
          totalVotes
          expiresAt
          allowMultipleChoices
        }
      }
      eventType
      createdAt
    }
  }
`;

export const MEDIA_PROCESSED_SUBSCRIPTION = gql`
  subscription MediaProcessed($postId: ID!) {
    mediaProcessed(postId: $postId) {
      postId
      mediaId
      status
      variants {
        thumbnail
        small
        medium
        large
      }
      eventType
      processedAt
    }
  }
`;

// Reply-related queries using unified Post model
export const GET_POST_REPLIES = gql`
  query GetPostReplies($postId: ID!, $first: Int!, $after: String) {
    postReplies(postId: $postId, first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          updatedAt
          parentId
          rootId
          isReply
          replyLevel
          author {
            id
            username
            displayName
            avatarUrl
            isVerified
          }
          parentPost {
            id
            author {
              id
              username
              displayName
            }
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
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const CREATE_REPLY_MUTATION = gql`
  mutation CreateReply($input: CreateReplyInput!) {
    createReply(input: $input) {
      id
      content
      createdAt
      updatedAt
      parentId
      rootId
      isReply
      replyLevel
      author {
        id
        username
        displayName
        avatarUrl
        isVerified
      }
      parentPost {
        id
        author {
          id
          username
          displayName
        }
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
`;

export const DELETE_REPLY_MUTATION = gql`
  mutation DeleteReply($replyId: ID!) {
    deleteReply(replyId: $replyId)
  }
`;
