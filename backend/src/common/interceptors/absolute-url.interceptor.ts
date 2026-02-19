import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


const POST_IMAGE_URL_TO_RELATIVE = /(https?:\/\/[^/]+)?(\/posts\/images\/[a-zA-Z0-9-]+)/g;

@Injectable()
export class AbsoluteUrlInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((body) => (body == null ? body : this.normalizePostImageUrls(body))),
    );
  }

  private normalizePostImageUrls(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (value instanceof StreamableFile) return value;
    if (typeof value === 'string') {
      if (!value.includes('/posts/images/')) return value;
      return value.replace(POST_IMAGE_URL_TO_RELATIVE, (_match, _prefix, path) => path);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizePostImageUrls(item));
    }
    if (typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = this.normalizePostImageUrls(v);
      }
      return out;
    }
    return value;
  }
}
