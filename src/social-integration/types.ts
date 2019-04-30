export interface User {
    id?: string
    name?: string
    username: string
    isVerified?: boolean
    profilePicUrl?: string
    profilePic?: any
    type: string
}

export interface Tweet {
    id: string
    userId: string
    createdAt: number
    text: string
    url: string
    hashtags?: Array<string>
    createdWhen?: Date

    user?: User
    hasBookmark?: boolean

    _text_terms?: string[]
}
