import { Tweet, User } from 'src/social-integration/types'
import normalizeUrl from 'src/util/encode-url-for-id'

export function getTweetInfo(element): Tweet {
    const hashtags = []
    const baseTwitter = 'https://twitter.com'

    const { name, permalinkPath, screenName, tweetId, userId } = element.dataset

    const images = element.getElementsByClassName('Emoji Emoji--forText')
    for (const img of images) {
        img.replaceWith(img['alt'])
    }

    const tweetContent = element
        .querySelector('.tweet-text')
        .textContent.replace('http', ' http')
        .replace('pic.twitter', ' pic.twitter')

    const profilePicUrl = element.querySelector('.js-action-profile-avatar').src
    const tweetTimeMs = element.querySelector('._timestamp').dataset.timeMs

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

    const tweet: Tweet = {
        id: tweetId,
        userId,
        createdAt: Number(tweetTimeMs),
        text: tweetContent,
        url: normalizeUrl(baseTwitter + permalinkPath),
        hashtags,
        user,
    }

    return tweet
}
