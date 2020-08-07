export interface User {
    id?: number
    name: string
    username: string
    serviceId?: string
    isVerified?: boolean
    profilePicUrl?: string
    profilePic?: any
    type: 'twitter'
}

export interface Tweet {
    id?: number
    userId: number
    text: string
    hashtags: Array<string>
    createdWhen: Date | number
    createdAt: Date
    serviceId?: string
    user?: User
    _text_terms?: string[]
}

export interface TweetUrl {
    url: string
}

export interface TweetUrlProps {
    username: string
    serviceId: string
}

export interface SocialPage extends Tweet {
    hasBookmark?: boolean
    annotsCount?: number
}
