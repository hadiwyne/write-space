import { openDB, DBSchema, IDBPDatabase } from 'idb'

/**
 * IndexedDB cache for WriteSpace
 * Stores posts, profiles, and feeds with automatic expiration
 */

interface WriteSpaceDB extends DBSchema {
    posts: {
        key: string
        value: {
            id: string
            data: unknown
            cachedAt: number
        }
        indexes: { 'by-date': number }
    }
    profiles: {
        key: string
        value: {
            username: string
            data: unknown
            cachedAt: number
        }
        indexes: { 'by-date': number }
    }
    feeds: {
        key: string
        value: {
            key: string
            posts: unknown[]
            cachedAt: number
        }
        indexes: { 'by-date': number }
    }
}

let dbPromise: Promise<IDBPDatabase<WriteSpaceDB>> | null = null

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<WriteSpaceDB>('writespace-cache', 1, {
            upgrade(db) {
                // Posts store
                const postStore = db.createObjectStore('posts', { keyPath: 'id' })
                postStore.createIndex('by-date', 'cachedAt')

                // Profiles store
                const profileStore = db.createObjectStore('profiles', { keyPath: 'username' })
                profileStore.createIndex('by-date', 'cachedAt')

                // Feeds store
                const feedStore = db.createObjectStore('feeds', { keyPath: 'key' })
                feedStore.createIndex('by-date', 'cachedAt')
            },
        })
    }
    return dbPromise
}

/**
 * Sanitizes data for IndexedDB storage to avoid DataCloneError.
 * Ensures the data is a plain object/array without functions or non-cloneable props.
 */
function sanitize<T>(data: T): T {
    try {
        return JSON.parse(JSON.stringify(data))
    } catch (err) {
        console.warn('IndexedDB sanitize error:', err)
        return data
    }
}

// ========== POSTS ==========

export async function getCachedPost(id: string): Promise<unknown | null> {
    try {
        const db = await getDB()
        const entry = await db.get('posts', id)
        if (!entry) return null
        // Cache for 30 minutes
        if (Date.now() - entry.cachedAt > 30 * 60 * 1000) {
            await db.delete('posts', id)
            return null
        }
        return entry.data
    } catch (err) {
        console.warn('IndexedDB getCachedPost error:', err)
        return null
    }
}

export async function setCachedPost(id: string, data: unknown): Promise<void> {
    try {
        const db = await getDB()
        await db.put('posts', { id, data: sanitize(data), cachedAt: Date.now() })
    } catch (err) {
        console.warn('IndexedDB setCachedPost error:', err)
    }
}

export async function setCachedPosts(posts: unknown[]): Promise<void> {
    try {
        const db = await getDB()
        const tx = db.transaction('posts', 'readwrite')
        const now = Date.now()

        for (const p of posts) {
            const id = (p as { id?: string })?.id
            if (id) {
                await tx.store.put({ id, data: sanitize(p), cachedAt: now })
            }
        }

        await tx.done
    } catch (err) {
        console.warn('IndexedDB setCachedPosts error:', err)
    }
}

// ========== FEEDS ==========

export async function getCachedFeed(key: string): Promise<unknown[] | null> {
    try {
        const db = await getDB()
        const entry = await db.get('feeds', key)
        if (!entry) return null
        // Cache for 5 minutes
        if (Date.now() - entry.cachedAt > 5 * 60 * 1000) {
            await db.delete('feeds', key)
            return null
        }
        return entry.posts
    } catch (err) {
        console.warn('IndexedDB getCachedFeed error:', err)
        return null
    }
}

export async function setCachedFeed(key: string, posts: unknown[]): Promise<void> {
    try {
        const db = await getDB()
        await db.put('feeds', { key, posts: sanitize(posts), cachedAt: Date.now() })
    } catch (err) {
        console.warn('IndexedDB setCachedFeed error:', err)
    }
}

// ========== PROFILES ==========

export async function getCachedProfile(username: string): Promise<unknown | null> {
    try {
        const db = await getDB()
        const entry = await db.get('profiles', username)
        if (!entry) return null
        // Cache for 15 minutes
        if (Date.now() - entry.cachedAt > 15 * 60 * 1000) {
            await db.delete('profiles', username)
            return null
        }
        return entry.data
    } catch (err) {
        console.warn('IndexedDB getCachedProfile error:', err)
        return null
    }
}

export async function setCachedProfile(username: string, data: unknown): Promise<void> {
    try {
        const db = await getDB()
        await db.put('profiles', { username, data: sanitize(data), cachedAt: Date.now() })
    } catch (err) {
        console.warn('IndexedDB setCachedProfile error:', err)
    }
}

export async function setCachedProfiles(profiles: unknown[]): Promise<void> {
    try {
        const db = await getDB()
        const tx = db.transaction('profiles', 'readwrite')
        const now = Date.now()

        for (const p of profiles) {
            const username = (p as { username?: string })?.username
            if (username) {
                await tx.store.put({ username, data: sanitize(p), cachedAt: now })
            }
        }

        await tx.done
    } catch (err) {
        console.warn('IndexedDB setCachedProfiles error:', err)
    }
}

// ========== CLEANUP ==========

/**
 * Clean up old entries to prevent database bloat
 * Call this periodically (e.g., on app mount)
 */
export async function cleanupOldEntries(): Promise<void> {
    try {
        const db = await getDB()
        const now = Date.now()

        // Clean posts older than 1 hour
        const postsTx = db.transaction('posts', 'readwrite')
        const postsIndex = postsTx.store.index('by-date')
        let postsCursor = await postsIndex.openCursor()
        while (postsCursor) {
            if (now - postsCursor.value.cachedAt > 60 * 60 * 1000) {
                await postsCursor.delete()
            }
            postsCursor = await postsCursor.continue()
        }

        // Clean feeds older than 30 minutes
        const feedsTx = db.transaction('feeds', 'readwrite')
        const feedsIndex = feedsTx.store.index('by-date')
        let feedsCursor = await feedsIndex.openCursor()
        while (feedsCursor) {
            if (now - feedsCursor.value.cachedAt > 30 * 60 * 1000) {
                await feedsCursor.delete()
            }
            feedsCursor = await feedsCursor.continue()
        }

        // Clean profiles older than 1 hour
        const profilesTx = db.transaction('profiles', 'readwrite')
        const profilesIndex = profilesTx.store.index('by-date')
        let profilesCursor = await profilesIndex.openCursor()
        while (profilesCursor) {
            if (now - profilesCursor.value.cachedAt > 60 * 60 * 1000) {
                await profilesCursor.delete()
            }
            profilesCursor = await profilesCursor.continue()
        }
    } catch (err) {
        console.warn('IndexedDB cleanup error:', err)
    }
}

/**
 * Clears ALL data from IndexedDB. Use on logout.
 */
export async function clearAllCaches(): Promise<void> {
    try {
        const db = await getDB()
        const tx = db.transaction(['posts', 'profiles', 'feeds'], 'readwrite')
        await Promise.all([
            tx.objectStore('posts').clear(),
            tx.objectStore('profiles').clear(),
            tx.objectStore('feeds').clear(),
        ])
        await tx.done
    } catch (err) {
        console.warn('IndexedDB clearAllCaches error:', err)
    }
}
