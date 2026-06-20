import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class AbsoluteUrlInterceptor implements NestInterceptor {
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (this.config.get<string>('API_PUBLIC_URL') || 'http://localhost:3000').replace(/\/$/, '');
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((body) => (body == null ? body : this.normalizePostImageUrls(body))),
    );
  }

  private normalizePostImageUrls(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (value instanceof StreamableFile) return value;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      if (!value.includes('/posts/images/')) return value;
      return value.replace(/(https?:\/\/[^/]+)?(\/posts\/images\/[a-zA-Z0-9-]+)/g, (_match, _prefix, path) => this.baseUrl + path);
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
