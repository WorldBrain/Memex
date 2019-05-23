import { Tweet, User } from 'src/social-integration/types'

export function getTweetInfo(element: HTMLElement): Partial<Tweet> {
    const hashtags = []

    const { name, screenName, tweetId, userId } = element.dataset

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
        serviceId: tweetId,
        userId,
        createdWhen: Number(tweetTimeMs),
        text: tweetContent,
        hashtags,
        user,
    }
}
