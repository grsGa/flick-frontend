import { gql } from '@apollo/client';

// 创建帖子
export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      permalinkId
      createdAt
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
      }
    }
  }
`;

// 更新帖子
export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      content
      permalinkId
      updatedAt
      status
      media {
        id
        url
        type
        thumbnailUrl
      }
    }
  }
`;

// 删除帖子
export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      message
      success
    }
  }
`;

// 点赞帖子
export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likesCount
      isLiked
    }
  }
`;

// 取消点赞帖子
export const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      id
      likesCount
      isLiked
    }
  }
`;

// 收藏帖子
export const SAVE_POST = gql`
  mutation SavePost($postId: ID!) {
    savePost(postId: $postId) {
      message
      success
    }
  }
`;

// 取消收藏帖子
export const UNSAVE_POST = gql`
  mutation UnsavePost($postId: ID!) {
    unsavePost(postId: $postId) {
      message
      success
    }
  }
`;

// 上传媒体文件
export const UPLOAD_MEDIA = gql`
  mutation UploadMedia($file: Upload!) {
    uploadMedia(file: $file) {
      id
      url
      type
      thumbnailUrl
    }
  }
`;

// 创建评论
export const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      content
      createdAt
      author {
        id
        username
        displayName
        avatarUrl
      }
      likesCount
      repliesCount
    }
  }
`;

// 删除评论
export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id) {
      message
      success
    }
  }
`;

// 点赞评论
export const LIKE_COMMENT = gql`
  mutation LikeComment($commentId: ID!) {
    likeComment(commentId: $commentId) {
      id
      likesCount
      isLiked
    }
  }
`;

// 取消点赞评论
export const UNLIKE_COMMENT = gql`
  mutation UnlikeComment($commentId: ID!) {
    unlikeComment(commentId: $commentId) {
      id
      likesCount
      isLiked
    }
  }
`;

// 更新帖子状态 (管理员操作)
export const UPDATE_POST_STATUS = gql`
  mutation UpdatePostStatus($postId: ID!, $status: PostStatus!) {
    updatePostStatus(postId: $postId, status: $status) {
      id
      status
    }
  }
`; 