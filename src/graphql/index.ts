/**
 * GraphQL查询和变更的统一导出
 */

// 查询
import * as UserQueries from './queries/user';
import * as ContentQueries from './queries/content';

// 变更
import * as UserMutations from './mutations/user';
import * as ContentMutations from './mutations/content';

// 类型重新导出
export * from './types';

// 导出所有查询和变更
export {
  // 查询
  UserQueries,
  ContentQueries,
  
  // 变更
  UserMutations,
  ContentMutations
}; 