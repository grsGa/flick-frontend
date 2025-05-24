import { gql } from '@apollo/client';
import { USER_FIELDS } from '../queries/user';

// 登录
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      refreshToken
      expiresAt
      user {
        ...UserFields
        roles
      }
    }
  }
  ${USER_FIELDS}
`;

// 注册
export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      refreshToken
      expiresAt
      user {
        ...UserFields
        roles
      }
    }
  }
  ${USER_FIELDS}
`;

// 刷新令牌
export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      refreshToken
      expiresAt
      user {
        ...UserFields
        roles
      }
    }
  }
  ${USER_FIELDS}
`;

// 更新个人资料
export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// 上传头像
export const UPLOAD_AVATAR = gql`
  mutation UploadAvatar($file: Upload!) {
    uploadAvatar(file: $file) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// 上传封面图片
export const UPLOAD_COVER_IMAGE = gql`
  mutation UploadCoverImage($file: Upload!) {
    uploadCoverImage(file: $file) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// 关注用户
export const FOLLOW_USER = gql`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// 取消关注用户
export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// 屏蔽用户
export const BLOCK_USER = gql`
  mutation BlockUser($userId: ID!) {
    blockUser(userId: $userId) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// 取消屏蔽用户
export const UNBLOCK_USER = gql`
  mutation UnblockUser($userId: ID!) {
    unblockUser(userId: $userId) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// 忘记密码请求
export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      message
      success
    }
  }
`;

// 重置密码
export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      message
      success
    }
  }
`;

// 验证电子邮件
export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      message
      success
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

// 请求邮箱验证邮件
export const REQUEST_EMAIL_VERIFICATION = gql`
  mutation RequestEmailVerification {
    requestEmailVerification {
      message
      success
    }
  }
`;

// 更新用户通知设置
export const UPDATE_NOTIFICATION_SETTINGS = gql`
  mutation UpdateNotificationSettings($settings: NotificationSettingsInput!) {
    updateNotificationSettings(settings: $settings) {
      message
      success
    }
  }
`;

// 更新用户角色 (管理员操作)
export const UPDATE_USER_ROLES = gql`
  mutation UpdateUserRoles($userId: ID!, $roles: [String!]!) {
    updateUserRoles(userId: $userId, roles: $roles) {
      id
      username
      roles
    }
  }
`; 