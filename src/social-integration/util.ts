import { TweetUrl, TweetUrlProps } from './types'
import {
    POSTS_COLL,
    TWEET_URL_MATCH_PATTERN,
    POST_URL_ID_MATCH_PATTERN,
} from './constants'

export function deriveTweetUrlProps({ url }: TweetUrl): TweetUrlProps {
    const matchRes = url.match(TWEET_URL_MATCH_PATTERN)

    if (matchRes == null || matchRes.length !== 3) {
        return { username: null, serviceId: null }
    }

    return { username: matchRes[1], serviceId: matchRes[2] }
}

export function buildTweetUrl({
    serviceId,
    username,
}: TweetUrlProps): TweetUrl {
    return { url: `twitter.com/${username}/status/${serviceId}` }
}

export function derivePostUrlIdProps({ url }: TweetUrl): { postId: number } {
    let postId: number = null
    const matchRes = url.match(POST_URL_ID_MATCH_PATTERN)

    if (matchRes == null || matchRes.length !== 2) {
        return { postId }
    }

    try {
        postId = Number(matchRes[1])
    } catch (err) {}

    return { postId }
}

export function buildPostUrlId({ postId }: { postId: number }): TweetUrl {
    return { url: `${POSTS_COLL}:${postId}` }
}
