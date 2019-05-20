import { TweetUrl, TweetUrlProps } from './types'
import { TWEET_URL_PATTERN } from './constants'

export function deriveTweetUrlProps({ url }: TweetUrl): TweetUrlProps {
    const matchRes = url.match(TWEET_URL_PATTERN)

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
