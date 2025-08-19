import { useApolloClient } from '@apollo/client';
import { USER_POSTS_QUERY, HOME_FEED_QUERY } from './usePosts';

export function usePostRefresh() {
  const client = useApolloClient();

  const forceRefreshAfterPost = async (username: string, maxRetries = 3) => {
    console.log('[usePostRefresh] Starting force refresh for username:', username);
    
    let retryCount = 0;
    const attemptRefresh = async (): Promise<boolean> => {
      try {
        // 完全清除缓存
        await client.clearStore();
        console.log('[usePostRefresh] Cache cleared completely');
        
        // 等待一段时间确保数据库写入完成
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 强制从网络重新获取数据
        const [userPostsResult, homeFeedResult] = await Promise.all([
          client.query({
            query: USER_POSTS_QUERY,
            variables: { username, first: 10, after: null },
            fetchPolicy: 'network-only',
            errorPolicy: 'all'
          }),
          client.query({
            query: HOME_FEED_QUERY,
            variables: { first: 10 },
            fetchPolicy: 'network-only',
            errorPolicy: 'all'
          })
        ]);
        
        console.log('[usePostRefresh] Refresh completed successfully');
        console.log('[usePostRefresh] UserPosts count:', userPostsResult.data?.userPosts?.edges?.length || 0);
        console.log('[usePostRefresh] HomeFeed count:', homeFeedResult.data?.homeFeed?.edges?.length || 0);
        
        return true;
      } catch (error) {
        console.error('[usePostRefresh] Refresh attempt failed:', error);
        retryCount++;
        
        if (retryCount < maxRetries) {
          console.log(`[usePostRefresh] Retrying refresh (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return attemptRefresh();
        }
        
        return false;
      }
    };
    
    return attemptRefresh();
  };

  return { forceRefreshAfterPost };
}
