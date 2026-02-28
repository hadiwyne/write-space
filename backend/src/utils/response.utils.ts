import { Post, User } from '@prisma/client';

export type StandardPost = Post & {
    isLiked?: boolean;
    isBookmarked?: boolean;
    isReposted?: boolean;
    isOwnPost?: boolean;
    _count?: {
        likes?: number;
        comments?: number;
        reposts?: number;
    };
    repostData?: any;
};

/** Masked author for anonymous posts: no real user id/username is ever sent. */
function maskedAnonymousAuthor(post: { id: string; anonymousAlias?: string | null }) {
    const alias = post.anonymousAlias || 'Anonymous';
    return {
        id: post.id,
        username: null,
        displayName: alias,
        avatarUrl: null,
        avatarShape: null,
        avatarFrame: null,
        badgeUrl: null,
    };
}

export function mapPost(post: any, userId?: string | null): StandardPost {
    const result = { ...post };

    // Flatten interaction flags
    if (userId) {
        result.isLiked = Array.isArray(post.likes) && post.likes.length > 0;
        result.isBookmarked = Array.isArray(post.bookmarks) && post.bookmarks.length > 0;
        result.isReposted = Array.isArray(post.reposts) && post.reposts.length > 0;
    } else {
        result.isLiked = false;
        result.isBookmarked = false;
        result.isReposted = false;
    }

    // True anonymity: never expose real author for anonymous posts
    if (post.isAnonymous) {
        result.author = maskedAnonymousAuthor(post);
        result.authorId = post.id;
        result.isOwnPost = userId != null && post.authorId === userId;
    }

    // Remove the underlying arrays to keep the response lean
    delete result.likes;
    delete result.bookmarks;
    delete result.reposts;

    return result;
}

export function mapUser(user: any, viewerId?: string | null) {
    const result = { ...user };

    if (viewerId) {
        result.isFollowing = Array.isArray(user.followers) && user.followers.length > 0;
        result.hasRequested = Array.isArray(user.followRequestsReceived) && user.followRequestsReceived.length > 0;
    } else {
        result.isFollowing = false;
        result.hasRequested = false;
    }

    delete result.followers;
    delete result.followRequestsReceived;

    return result;
}
