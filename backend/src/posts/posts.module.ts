import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { MarkdownRenderer } from './renderers/markdown.renderer';
import { HtmlRenderer } from './renderers/html.renderer';

@Module({
  providers: [PostsService, MarkdownRenderer, HtmlRenderer],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
