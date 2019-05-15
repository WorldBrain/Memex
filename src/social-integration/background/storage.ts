import { FeatureStorage } from 'src/search/storage'
import { StorageManager } from 'src/search'
import { Tweet, User } from '../types'
import * as consts from '../constants'

export interface SocialStorageProps {
    storageManager: StorageManager
    tweetsColl?: string
    usersColl?: string
    tagsColl?: string
    bookmarksColl?: string
    visitsColl?: string
}

export default class SocialStorage extends FeatureStorage {
    static TWEETS_COLL = consts.TWEETS_COLL
    static USERS_COLL = consts.USERS_COLL
    static TAGS_COLL = consts.TAGS_COLL
    static BMS_COLL = consts.BMS_COLL
    static VISTS_COLL = consts.VISITS_COLL

    private tweetsColl: string
    private usersColl: string
    private bookmarksColl: string
    private tagsColl: string
    private visitsColl: string

    constructor({
        storageManager,
        tweetsColl = SocialStorage.TWEETS_COLL,
        usersColl = SocialStorage.USERS_COLL,
        tagsColl = SocialStorage.TAGS_COLL,
        bookmarksColl = SocialStorage.BMS_COLL,
        visitsColl = SocialStorage.VISTS_COLL,
    }: SocialStorageProps) {
        super(storageManager)

        this.tweetsColl = tweetsColl
        this.usersColl = usersColl
        this.tagsColl = tagsColl
        this.bookmarksColl = bookmarksColl
        this.visitsColl = visitsColl

        this.storageManager.registry.registerCollection(this.tweetsColl, [
            {
                version: new Date(2019, 4, 22),
                fields: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    createdAt: { type: 'datetime' },
                    text: { type: 'text' },
                    url: { type: 'string' },
                    createdWhen: { type: 'datetime' },
                },
                indices: [
                    { field: 'url', pk: true },
                    { field: 'userId' },
                    { field: 'text' },
                    { field: 'createdAt' },
                    { field: 'createdWhen' },
                ],
            },
        ])

        this.storageManager.registry.registerCollection(this.usersColl, [
            {
                version: new Date(2019, 4, 22),
                fields: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    username: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    profilePic: { type: 'blob' },
                    type: { type: 'string' },
                },
                indices: [
                    { field: 'id', pk: true },
                    { field: 'name' },
                    { field: 'username' },
                    { field: 'isVerified' },
                    { field: 'type' },
                ],
            },
        ])
    }

    async addTweet({
        hashtags,
        url,
        createdWhen = new Date(),
        ...rest
    }: Tweet) {
        await this.addSocialVisit({ url, time: createdWhen.getTime() })

        const { object } = await this.storageManager
            .collection(this.tweetsColl)
            .createObject({ url, createdWhen, ...rest })

        await this.addHashtags({ hashtags, url })

        return object.id
    }

    async addUser({ id, name, username, isVerified, profilePic, type }: User) {
        const { object } = await this.storageManager
            .collection(this.usersColl)
            .createObject({
                id,
                name,
                username,
                isVerified,
                profilePic,
                type,
            })

        return object.id
    }

    async addHashtags({ hashtags, url }: { hashtags: string[]; url: string }) {
        await Promise.all(
            hashtags.map(hashtag =>
                this.storageManager.collection(this.tagsColl).createObject({
                    name: hashtag,
                    url,
                }),
            ),
        )
    }

    async addSocialVisit({
        url,
        time = Date.now(),
    }: {
        url: string
        time?: number
    }) {
        return this.storageManager.collection(this.visitsColl).createObject({
            url,
            time,
            pageType: 'social',
        })
    }

    async delSocialPages(urls: string[]) {
        return urls.map(async url => {
            await Promise.all([
                this.storageManager
                    .collection(this.visitsColl)
                    .deleteObjects({ url }),
                this.storageManager
                    .collection(this.tweetsColl)
                    .deleteObjects({ url }),
                this.storageManager
                    .collection(this.tagsColl)
                    .deleteObjects({ url }),
                this.storageManager
                    .collection(this.bookmarksColl)
                    .deleteObjects({ url }),
            ])
        })
    }

    async getTweetByUrl(url: string) {
        return this.storageManager
            .collection(this.tweetsColl)
            .findOneObject<Tweet>({ url })
    }

    private encodeImage = (img: Blob, base64Img?: boolean) =>
        new Promise<string>((resolve, reject) => {
            if (!base64Img) {
                return resolve(URL.createObjectURL(img))
            }

            const reader = new FileReader()
            reader.onerror = reject
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(img)
        })

    private async attachImage(
        users: User[],
        base64Img: boolean,
    ): Promise<User[]> {
        return Promise.all(
            users.map(async user => {
                const profilePic = user.profilePic
                    ? await this.encodeImage(user.profilePic, base64Img)
                    : undefined

                return {
                    ...user,
                    profilePic,
                }
            }),
        )
    }

    async fetchUserSuggestions({
        name,
        base64Img,
    }: {
        name: string
        base64Img?: boolean
    }) {
        const suggestions = await this.storageManager
            .collection(this.usersColl)
            .suggestObjects<string, string>(
                { name },
                { includePks: true, ignoreCase: ['name'] },
            )

        const userIds = suggestions.map(({ pk }) => pk)

        const users = await this.storageManager
            .collection(this.usersColl)
            .findObjects<User>({
                id: { $in: userIds },
            })

        return this.attachImage(users, base64Img)
    }

    async fetchAllUsers({
        query = {},
        opts = {},
    }: {
        query?: any
        opts?: any
    }) {
        const users = await this.storageManager
            .collection(this.usersColl)
            .findObjects<User>(query, opts)

        return this.attachImage(users, opts.base64Img)
    }
}
