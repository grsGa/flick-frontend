import { create } from 'zustand';
import { 
  GET_FEED, 
  GET_POST, 
  GET_USER_POSTS, 
  LIKE_POST, 
  UNLIKE_POST, 
  SAVE_POST, 
  UNSAVE_POST, 
  DELETE_POST, 
  UPDATE_POST_STATUS,
  CREATE_POST,
  UPDATE_POST
} from '@/graphql';
import { CreatePostInput, PageInput, PostStatus, UpdatePostInput } from '@/graphql/types';
import { createPageInput } from '@/lib/utils';
import { initializeApollo } from '@/lib/apollo-client';

// 帖子类型定义
export interface PostItem {
  id: string;
  content: string;
  permalinkId: string;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  media?: {
    id: string;
    url: string;
    type: string;
    thumbnailUrl?: string;
  }[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  status: PostStatus;
}

// 帖子存储状态接口
interface PostStoreState {
  posts: PostItem[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  currentPage: number;
  likedPosts: Record<string, boolean>;
  savedPosts: Record<string, boolean>;
  
  // 操作方法
  fetchPosts: (page?: number, limit?: number) => Promise<void>;
  fetchPostsByUsername: (username: string, page?: number, limit?: number) => Promise<void>;
  fetchPostById: (id: string) => Promise<PostItem | null>;
  createPost: (input: CreatePostInput) => Promise<PostItem | null>;
  updatePost: (id: string, input: UpdatePostInput) => Promise<PostItem | null>;
  deletePost: (id: string) => Promise<boolean>;
  reset: () => void;
  
  // 交互方法
  likePost: (postId: string) => Promise<boolean>;
  unlikePost: (postId: string) => Promise<boolean>;
  savePost: (postId: string) => Promise<boolean>;
  unsavePost: (postId: string) => Promise<boolean>;
  updatePostStatus: (postId: string, status: PostStatus) => Promise<boolean>;
  
  // 帖子操作
  getPost: (id: string) => PostItem | undefined;
  syncPostLikeStatus: (postId: string, liked: boolean) => void;
  syncPostSaveStatus: (postId: string, saved: boolean) => void;
}

// 创建帖子存储
export const usePostStore = create<PostStoreState>((set, get) => ({
  posts: [],
  loading: false,
  hasMore: true,
  error: null,
  currentPage: 1,
  likedPosts: {},
  savedPosts: {},
  
  // 获取帖子列表 (Feed)
  fetchPosts: async (page = 1, limit = 10) => {
    try {
      set(state => ({ 
        loading: true, 
        error: null,
        currentPage: page === 1 ? 1 : state.currentPage
      }));
      
      const client = initializeApollo();
      const pageInput: PageInput = createPageInput(page, limit);
      
      const { data } = await client.query({
        query: GET_FEED,
        variables: { page: pageInput },
        fetchPolicy: 'network-only',
      });
      
      const newPosts = data?.feed?.posts || [];
      const pageInfo = data?.feed?.pageInfo;
      
      set(state => ({
        posts: page === 1 ? newPosts : [...state.posts, ...newPosts],
        loading: false,
        hasMore: pageInfo?.hasNextPage || false,
        currentPage: page,
        error: null
      }));
      
      // 同步点赞和保存状态
      newPosts.forEach((post: PostItem) => {
        if (post.isLiked !== undefined) {
          get().syncPostLikeStatus(post.id, post.isLiked);
        }
        if (post.isSaved !== undefined) {
          get().syncPostSaveStatus(post.id, post.isSaved);
        }
      });
      
      return;
    } catch (error) {
      console.error('获取帖子失败:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '获取帖子失败'
      });
    }
  },
  
  // 根据用户名获取帖子
  fetchPostsByUsername: async (username, page = 1, limit = 10) => {
    try {
      set({ 
        loading: true, 
        error: null,
      });
      
      const client = initializeApollo();
      const pageInput: PageInput = createPageInput(page, limit);
      
      const { data } = await client.query({
        query: GET_USER_POSTS,
        variables: { username, page: pageInput },
        fetchPolicy: 'network-only',
      });
      
      const newPosts = data?.userPosts?.posts || [];
      const pageInfo = data?.userPosts?.pageInfo;
      
      set(state => ({
        posts: page === 1 ? newPosts : [...state.posts, ...newPosts],
        loading: false,
        hasMore: pageInfo?.hasNextPage || false,
        currentPage: page,
        error: null
      }));
      
      // 同步点赞和保存状态
      newPosts.forEach((post: PostItem) => {
        if (post.isLiked !== undefined) {
          get().syncPostLikeStatus(post.id, post.isLiked);
        }
        if (post.isSaved !== undefined) {
          get().syncPostSaveStatus(post.id, post.isSaved);
        }
      });
      
      return;
    } catch (error) {
      console.error('获取用户帖子失败:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '获取用户帖子失败'
      });
    }
  },
  
  // 获取单个帖子
  fetchPostById: async (id) => {
    try {
      const client = initializeApollo();
      
      const { data } = await client.query({
        query: GET_POST,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      
      const post = data?.post;
      
      if (post) {
        // 更新状态
        if (post.isLiked !== undefined) {
          get().syncPostLikeStatus(post.id, post.isLiked);
        }
        if (post.isSaved !== undefined) {
          get().syncPostSaveStatus(post.id, post.isSaved);
        }
        
        return post;
      }
      
      return null;
    } catch (error) {
      console.error('获取帖子详情失败:', error);
      return null;
    }
  },
  
  // 创建帖子
  createPost: async (input) => {
    try {
      const client = initializeApollo();
      
      const { data } = await client.mutate({
        mutation: CREATE_POST,
        variables: { input },
      });
      
      const newPost = data?.createPost;
      
      if (newPost) {
        // 将新帖子添加到列表开头
        set(state => ({
          posts: [newPost, ...state.posts]
        }));
        
        return newPost;
      }
      
      return null;
    } catch (error) {
      console.error('创建帖子失败:', error);
      return null;
    }
  },
  
  // 更新帖子
  updatePost: async (id, input) => {
    try {
      const client = initializeApollo();
      
      const { data } = await client.mutate({
        mutation: UPDATE_POST,
        variables: { id, input },
      });
      
      const updatedPost = data?.updatePost;
      
      if (updatedPost) {
        // 更新列表中的帖子
        set(state => ({
          posts: state.posts.map(post => 
            post.id === id ? { ...post, ...updatedPost } : post
          )
        }));
        
        return updatedPost;
      }
      
      return null;
    } catch (error) {
      console.error('更新帖子失败:', error);
      return null;
    }
  },
  
  // 删除帖子
  deletePost: async (id) => {
    try {
      const client = initializeApollo();
      
      const { data } = await client.mutate({
        mutation: DELETE_POST,
        variables: { id },
      });
      
      if (data?.deletePost?.success) {
        // 从列表中移除帖子
        set(state => ({
          posts: state.posts.filter(post => post.id !== id)
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('删除帖子失败:', error);
      return false;
    }
  },
  
  // 更新帖子状态
  updatePostStatus: async (postId, status) => {
    try {
      const client = initializeApollo();
      
      const { data } = await client.mutate({
        mutation: UPDATE_POST_STATUS,
        variables: { postId, status },
      });
      
      if (data?.updatePostStatus?.id) {
        // 更新列表中的帖子状态
        set(state => ({
          posts: state.posts.map(post => 
            post.id === postId ? { ...post, status } : post
          )
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('更新帖子状态失败:', error);
      return false;
    }
  },
  
  // 重置状态
  reset: () => {
    set({
      posts: [],
      loading: false,
      hasMore: true,
      error: null,
      currentPage: 1
    });
  },
  
  // 获取单个帖子
  getPost: (id: string) => {
    return get().posts.find(post => post.id === id);
  },
  
  // 点赞帖子
  likePost: async (postId: string) => {
    try {
      const client = initializeApollo();
      
      const { data } = await client.mutate({
        mutation: LIKE_POST,
        variables: { postId },
      });
      
      if (data?.likePost) {
        // 更新本地状态
        set(state => {
          const updatedPosts = state.posts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                likesCount: data.likePost.likesCount,
                isLiked: true
              };
            }
            return post;
          });
          
          return {
            posts: updatedPosts,
            likedPosts: { ...state.likedPosts, [postId]: true }
          };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('点赞失败:', error);
      return false;
    }
  },
  
  // 取消点赞帖子
  unlikePost: async (postId: string) => {
    try {
      const client = initializeApollo();
      
      const { data } = await client.mutate({
        mutation: UNLIKE_POST,
        variables: { postId },
      });
      
      if (data?.unlikePost) {
        // 更新本地状态
        set(state => {
          const updatedPosts = state.posts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                likesCount: data.unlikePost.likesCount,
                isLiked: false
              };
            }
            return post;
          });
          
          const newLikedPosts = { ...state.likedPosts };
          delete newLikedPosts[postId];
          
          return {
            posts: updatedPosts,
            likedPosts: newLikedPosts
          };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('取消点赞失败:', error);
      return false;
    }
  },
  
  // 收藏帖子
  savePost: async (postId: string) => {
    try {
      const client = initializeApollo();
      
      const { data } = await client.mutate({
        mutation: SAVE_POST,
        variables: { postId },
      });
      
      if (data?.savePost?.success) {
        // 更新本地状态
        set(state => {
          const updatedPosts = state.posts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                isSaved: true
              };
            }
            return post;
          });
          
          return {
            posts: updatedPosts,
            savedPosts: { ...state.savedPosts, [postId]: true }
          };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('收藏失败:', error);
      return false;
    }
  },
  
  // 取消收藏帖子
  unsavePost: async (postId: string) => {
    try {
      const client = initializeApollo();
      
      const { data } = await client.mutate({
        mutation: UNSAVE_POST,
        variables: { postId },
      });
      
      if (data?.unsavePost?.success) {
        // 更新本地状态
        set(state => {
          const updatedPosts = state.posts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                isSaved: false
              };
            }
            return post;
          });
          
          const newSavedPosts = { ...state.savedPosts };
          delete newSavedPosts[postId];
          
          return {
            posts: updatedPosts,
            savedPosts: newSavedPosts
          };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('取消收藏失败:', error);
      return false;
    }
  },
  
  // 同步帖子点赞状态
  syncPostLikeStatus: (postId: string, liked: boolean) => {
    set(state => {
      if (liked) {
        return { likedPosts: { ...state.likedPosts, [postId]: true } };
      } else {
        const newLikedPosts = { ...state.likedPosts };
        delete newLikedPosts[postId];
        return { likedPosts: newLikedPosts };
      }
    });
  },
  
  // 同步帖子收藏状态
  syncPostSaveStatus: (postId: string, saved: boolean) => {
    set(state => {
      if (saved) {
        return { savedPosts: { ...state.savedPosts, [postId]: true } };
      } else {
        const newSavedPosts = { ...state.savedPosts };
        delete newSavedPosts[postId];
        return { savedPosts: newSavedPosts };
      }
    });
  }
})); 