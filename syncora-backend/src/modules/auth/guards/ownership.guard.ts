import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private paramName: string = 'id') {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params[this.paramName];

    if (!user || !resourceId) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'MODERATOR') {
      return true;
    }

    if (user.id === resourceId) {
      return true;
    }

    throw new ForbiddenException('You can only access your own resources');
  }
}
