import React from 'react';

export default function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  // This layout doesn't render any UI itself. It just passes the children (the page) through.
  // Its purpose is to properly scope the dynamic route segment and stabilize the params passing.
  return <>{children}</>;
}
