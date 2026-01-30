import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { MarkdownRenderer } from './renderers/markdown.renderer';
import { HtmlRenderer } from './renderers/html.renderer';
import { LatexRenderer } from './renderers/latex.renderer';

@Module({
  providers: [PostsService, MarkdownRenderer, HtmlRenderer, LatexRenderer],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
