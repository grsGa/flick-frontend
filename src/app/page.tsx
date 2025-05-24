'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Camera, Users, PlusCircle } from 'lucide-react';
import { withGuest } from '@/lib/auth-context';

function LandingPage() {
  return (
    <PageLayout>
      <section className="py-24 lg:py-36 flex flex-col items-center text-center px-4 sm:px-6 bg-gradient-to-b from-background to-muted/50">
        <div className="space-y-8 w-full max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            与朋友分享你的精彩瞬间
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-lg sm:text-xl md:text-2xl">
            Flick 是一个社交分享平台，你可以上传照片、视频、分享生活故事，与朋友互动并发现有趣内容。
          </p>
          
          {/* 装饰性元素 */}
          <div className="relative w-full max-w-3xl mx-auto h-12 opacity-80">
            <div className="absolute -left-4 top-0 w-16 h-16 bg-primary/20 rounded-full blur-2xl"></div>
            <div className="absolute right-8 bottom-0 w-20 h-20 bg-primary/30 rounded-full blur-3xl"></div>
            <div className="absolute left-1/3 -top-8 w-14 h-14 bg-primary/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">为什么选择</span> Flick
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-primary/30 rounded-full"></div>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            <div className="flex flex-col items-center text-center space-y-5 bg-background p-8 rounded-xl shadow-lg border border-muted hover:border-primary/20 hover:shadow-primary/5 transition-all duration-300">
              <div className="bg-primary/10 p-5 rounded-full">
                <Camera className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">分享故事</h3>
              <p className="text-muted-foreground text-lg">
                上传照片和视频，讲述你的故事，与朋友分享生活中的精彩瞬间。
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-5 bg-background p-8 rounded-xl shadow-lg border border-muted hover:border-primary/20 hover:shadow-primary/5 transition-all duration-300">
              <div className="bg-primary/10 p-5 rounded-full">
                <PlusCircle className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">发现新鲜事</h3>
              <p className="text-muted-foreground text-lg">
                探索个性化推荐内容，发现感兴趣的话题和创作者。
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-5 bg-background p-8 rounded-xl shadow-lg border border-muted hover:border-primary/20 hover:shadow-primary/5 transition-all duration-300">
              <div className="bg-primary/10 p-5 rounded-full">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">互动交流</h3>
              <p className="text-muted-foreground text-lg">
                点赞、评论、分享，与朋友和社区成员互动，建立联系。
              </p>
            </div>
          </div>
          
          <div className="mt-24 text-center">
            <p className="text-xl text-muted-foreground mb-4">加入我们的平台，开始分享精彩故事</p>
            <div className="inline-flex items-center justify-center relative">
              <span className="relative z-10 text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Flick - 分享生活的每一刻
              </span>
              <div className="absolute w-full h-3 bg-primary/10 bottom-0 left-0 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

// 使用withGuest高阶组件包装根页面，确保只有未登录用户可以访问
export default withGuest(LandingPage);
