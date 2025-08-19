import { redirect } from 'next/navigation';

// This page is responsible for redirecting the base profile URL
// to the default "posts" tab.
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  redirect(`/profile/${username}/posts`);
}
