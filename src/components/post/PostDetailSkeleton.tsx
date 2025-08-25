import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="mr-4 hover:bg-gray-100"
            disabled
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">帖子</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <Card className="bg-white border-gray-200 rounded-none border-x-0 border-t-0">
          <div className="p-4">
            {/* Author Info Skeleton */}
            <div className="flex items-start space-x-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 bg-gray-200" />
                <Skeleton className="h-3 w-24 bg-gray-200" />
              </div>
            </div>

            {/* Post Content Skeleton */}
            <div className="mb-4 space-y-2">
              <Skeleton className="h-4 w-full bg-gray-200" />
              <Skeleton className="h-4 w-4/5 bg-gray-200" />
              <Skeleton className="h-4 w-3/5 bg-gray-200" />
            </div>

            {/* Media Skeleton */}
            <div className="mb-4">
              <Skeleton className="h-64 w-full rounded-2xl bg-gray-200" />
            </div>

            <Separator className="bg-gray-200 mb-4" />

            {/* Actions Skeleton */}
            <div className="flex items-center justify-around py-2">
              <Skeleton className="h-8 w-16 bg-gray-200" />
              <Skeleton className="h-8 w-16 bg-gray-200" />
              <Skeleton className="h-8 w-16 bg-gray-200" />
              <Skeleton className="h-8 w-16 bg-gray-200" />
              <Skeleton className="h-8 w-16 bg-gray-200" />
            </div>
          </div>
        </Card>

        {/* Replies Skeleton */}
        <div className="space-y-0">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white border-gray-200 rounded-none border-x-0 border-t-0">
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-3 w-20 bg-gray-200" />
                      <Skeleton className="h-3 w-16 bg-gray-200" />
                    </div>
                    <Skeleton className="h-4 w-full bg-gray-200" />
                    <Skeleton className="h-4 w-3/4 bg-gray-200" />
                    <div className="flex items-center space-x-4 mt-2">
                      <Skeleton className="h-6 w-12 bg-gray-200" />
                      <Skeleton className="h-6 w-12 bg-gray-200" />
                      <Skeleton className="h-6 w-12 bg-gray-200" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
