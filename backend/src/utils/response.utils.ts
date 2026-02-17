import { Post, User } from '@prisma/client';

export type StandardPost = Post & {
    isLiked?: boolean;
    isBookmarked?: boolean;
    isReposted?: boolean;
    _count?: {
        likes?: number;
        comments?: number;
        reposts?: number;
    };
    repostData?: any;
};

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
