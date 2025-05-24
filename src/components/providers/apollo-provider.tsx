import { ApolloProvider as BaseApolloProvider } from '@apollo/client';
import { FC, ReactNode } from 'react';
import { useApollo } from '@/lib/apollo-client';
import { NormalizedCacheObject } from '@apollo/client';

interface ApolloProviderProps {
  children: ReactNode;
  initialState?: NormalizedCacheObject | null;
}

/**
 * Apollo客户端提供者组件
 * 
 * 包装应用，提供Apollo Client实例
 * 支持服务端渲染和客户端状态管理
 */
export const ApolloProvider: FC<ApolloProviderProps> = ({ 
  children,
  initialState = null
}) => {
  const client = useApollo(initialState);

  return (
    <BaseApolloProvider client={client}>
      {children}
    </BaseApolloProvider>
  );
}; 