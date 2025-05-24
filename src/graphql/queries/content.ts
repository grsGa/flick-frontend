import { gql } from '@apollo/client';

// 获取用户Feed
export const GET_FEED = gql`
  query Feed($page: PageInput) {
    feed(page: $page) {
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

// 获取热门帖子
export const GET_TRENDING = gql`
  query Trending($page: PageInput) {
    trending(page: $page) {
      posts {
        id
        content
        permalinkId
        createdAt
        likesCount
        commentsCount
        isLiked
        isSaved
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

// 获取推荐内容
export const GET_RECOMMENDATIONS = gql`
  query Recommendations($page: PageInput) {
    recommendations(page: $page) {
      posts {
        id
        content
        permalinkId
        createdAt
        likesCount
        commentsCount
        isLiked
        isSaved
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

// 获取单个帖子
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

// 按永久链接获取帖子
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
        width
        height
        duration
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

// 获取帖子评论
export const GET_POST_COMMENTS = gql`
  query PostComments($postId: ID!, $page: PageInput) {
    post(id: $postId) {
      id
      comments(page: $page) {
        comments {
          id
          content
          createdAt
          updatedAt
          likesCount
          repliesCount
          isLiked
          author {
            id
            username
            displayName
            avatarUrl
            isVerified
          }
          parentComment {
            id
            author {
              id
              username
            }
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
  }
`;

// 获取已保存的帖子
export const GET_SAVED_POSTS = gql`
  query SavedPosts($page: PageInput) {
    savedPosts(page: $page) {
      posts {
        id
        content
        permalinkId
        createdAt
        likesCount
        commentsCount
        isLiked
        isSaved
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

// 获取点赞的帖子
export const GET_LIKED_POSTS = gql`
  query LikedPosts($page: PageInput) {
    likedPosts(page: $page) {
      posts {
        id
        content
        permalinkId
        createdAt
        likesCount
        commentsCount
        isLiked
        isSaved
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

// 获取用户帖子
export const GET_USER_POSTS = gql`
  query UserPosts($userId: ID, $username: String, $page: PageInput) {
    userPosts(userId: $userId, username: $username, page: $page) {
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