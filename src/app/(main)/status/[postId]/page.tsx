import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getClient } from '@/lib/apollo-server';
import { gql } from '@apollo/client';
import PostDetailView from '@/components/post/PostDetailView';
import PostDetailSkeleton from '@/components/post/PostDetailSkeleton';

const GET_POST_DETAIL = gql`
  query GetPostDetail($id: ID!) {
    post(id: $id) {
      id
      content
      author {
        id
        username
        displayName
        avatarUrl
        isVerified
      }
      visibility
      replyPermission
      parentId
      repostId
      hasMedia
      hasPoll
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
        }
      }
      mediaAttachments {
        id
        url
        type
      }
      mentionedUsers
      tags
      poll {
        id
        question
        options {
          id
          text
          voteCount
        }
        durationMinutes
        expiresAt
        isExpired
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
      createdAt
      updatedAt
    }
  }
`;

interface PostDetailPageProps {
  params: {
    postId: string;
  };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = (await params);

  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_POST_DETAIL,
      variables: { id: postId },
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    });

    if (!data?.post) {
      notFound();
    }

    return (
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetailView post={data.post} />
      </Suspense>
    );
  } catch (error) {
    console.error('[PostDetailPage] Error fetching post:', error);
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PostDetailPageProps) {
  const { postId } = (await params);

  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_POST_DETAIL,
      variables: { id: postId },
      fetchPolicy: 'cache-first',
    });

    if (!data?.post) {
      return {
        title: 'Post not found',
      };
    }

    const post = data.post;
    const truncatedContent = post.content.length > 100 
      ? post.content.substring(0, 100) + '...' 
      : post.content;

    return {
      title: `${post.author.displayName || post.author.username} on Flick: "${truncatedContent}"`,
      description: post.content,
      openGraph: {
        title: `${post.author.displayName || post.author.username} on Flick`,
        description: post.content,
        images: post.media?.length > 0 ? [post.media[0].url] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${post.author.displayName || post.author.username} on Flick`,
        description: post.content,
        images: post.media?.length > 0 ? [post.media[0].url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Post not found',
    };
  }
}
