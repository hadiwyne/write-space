import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Cache-Control interceptor for API responses.
 */
@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
    constructor(private readonly maxAge: number = 300) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse();

        return next.handle().pipe(
            tap(() => {
                const request = context.switchToHttp().getRequest();
                if (request.method === 'GET') {
                    response.setHeader(
                        'Cache-Control',
                        `public, max-age=${this.maxAge}`,
                    );
                    response.setHeader('ETag', `W/"${Date.now()}"`);
                }
            }),
        );
    }
}
