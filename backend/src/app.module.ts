import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheControlInterceptor } from './common/interceptors/cache.interceptor';
import { AbsoluteUrlInterceptor } from './common/interceptors/absolute-url.interceptor';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { FeedModule } from './feed/feed.module';
import { DraftsModule } from './drafts/drafts.module';
import { DocumentsModule } from './documents/documents.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { CollectionsModule } from './collections/collections.module';
import { RepostsModule } from './reposts/reposts.module';
import { ThemesModule } from './themes/themes.module';
import { PresenceModule } from './presence/presence.module';
import { SeriesModule } from './series/series.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PresenceModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    FeedModule,
    DraftsModule,
    DocumentsModule,
    SearchModule,
    NotificationsModule,
    BookmarksModule,
    CollectionsModule,
    RepostsModule,
    ThemesModule,
    SeriesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useValue: new CacheControlInterceptor(300) }, // 5 min cache headers
    { provide: APP_INTERCEPTOR, useClass: AbsoluteUrlInterceptor }, // rewrite relative image URLs to absolute for cross-origin frontends
  ],
})
export class AppModule { }
