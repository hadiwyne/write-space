import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { MarkdownRenderer } from './renderers/markdown.renderer';
import { HtmlRenderer } from './renderers/html.renderer';
import { AuthModule } from '../auth/auth.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { RepostsModule } from '../reposts/reposts.module';

@Module({
  imports: [AuthModule, BookmarksModule, RepostsModule],
  providers: [PostsService, MarkdownRenderer, HtmlRenderer],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
