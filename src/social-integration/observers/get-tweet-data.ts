import { Tweet, TweetUrl, User } from 'src/social-integration/types'
import normalizeUrl from 'src/util/encode-url-for-id'

export type TweetInfo = Partial<Tweet> & TweetUrl

export function getTweetInfo(element: HTMLElement): TweetInfo {
    const hashtags = []
    const baseTwitter = 'https://twitter.com'

    const { name, permalinkPath, screenName, tweetId, userId } = element.dataset

    const images = element.getElementsByClassName(
        'Emoji Emoji--forText',
    ) as HTMLCollectionOf<any>
    for (const img of images) {
        img.replaceWith(img['alt'])
    }

    const tweetContent = element
        .querySelector('.tweet-text')
        .textContent.replace('http', ' http')
        .replace('pic.twitter', ' pic.twitter')

    const profilePicUrl = element.querySelector<HTMLImageElement>(
        '.js-action-profile-avatar',
    ).src
    const tweetTimeMs = element.querySelector<HTMLElement>('._timestamp')
        .dataset.timeMs

    const hashtagNodes = element.querySelectorAll('.twitter-hashtag')

    for (const i of hashtagNodes) {
        hashtags.push(i.textContent.toLowerCase().replace('#', ''))
    }

    const isVerified = element.querySelector('.Icon.Icon--verified') !== null

    const user: User = {
        id: userId,
        name,
        username: screenName,
        isVerified,
        profilePicUrl,
        type: 'twitter',
    }

    return {
        id: tweetId,
        userId,
        createdAt: new Date(Number(tweetTimeMs)),
        text: tweetContent,
        url: normalizeUrl(baseTwitter + permalinkPath),
        hashtags,
        user,
    }
}
