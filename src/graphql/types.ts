// GraphQL类型定义
export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isVerified: boolean;
  isBlocked?: boolean;
  hasBlocked?: boolean;
  roles?: string[];
}

export interface Media {
  id: string;
  url: string;
  type: MediaType;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  createdAt?: string;
}

export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  GIF = "GIF",
  AUDIO = "AUDIO",
  DOCUMENT = "DOCUMENT"
}

export interface Post {
  id: string;
  content: string;
  permalinkId: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  media?: Media[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  status: PostStatus;
}

export enum PostStatus {
  PUBLISHED = "PUBLISHED",
  HIDDEN = "HIDDEN",
  DELETED = "DELETED"
}

export enum PostVisibility {
  PUBLIC = "PUBLIC",
  FOLLOWERS = "FOLLOWERS",
  PRIVATE = "PRIVATE"
}

export interface Comment {
  id: string;
  content: string;
  post?: Post;
  createdAt: string;
  updatedAt: string;
  author: User;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  parentComment?: Comment;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
  totalCount: number;
  currentPage: number;
}

export interface PostsResponse {
  posts: Post[];
  pageInfo: PageInfo;
}

export interface CommentsResponse {
  comments: Comment[];
  pageInfo: PageInfo;
}

export interface UsersResponse {
  users: User[];
  pageInfo: PageInfo;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pageInfo: PageInfo;
}

export interface PageInput {
  page: number;
  limit: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  user?: User;
  actor?: User;
  post?: Post;
  comment?: Comment;
}

export enum NotificationType {
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  FOLLOW = "FOLLOW",
  MENTION = "MENTION",
  DIRECT_MESSAGE = "DIRECT_MESSAGE",
  SYSTEM = "SYSTEM"
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  inviteCode?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface CreatePostInput {
  content: string;
  mediaIds?: string[];
  visibility?: PostVisibility;
}

export interface UpdatePostInput {
  content?: string;
  mediaIds?: string[];
  visibility?: PostVisibility;
}

export interface CreateCommentInput {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export interface HealthStatus {
  status: string;
  time: string;
  version?: string;
  services?: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  status: string;
  message?: string;
} 