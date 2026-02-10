import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    // Always try to authenticate, but don't fail if no token or invalid token
    try {
      await super.canActivate(context);
    } catch {
      // Authentication failed - set user to null but allow request to proceed
      const request = context.switchToHttp().getRequest();
      request.user = null;
    }
    return true;
  }
}
