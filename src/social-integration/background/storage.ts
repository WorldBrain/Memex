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
    static TWEETS_COLL = consts.POSTS_COLL
    static USERS_COLL = consts.USERS_COLL
    static TAGS_COLL = consts.TAGS_COLL
    static BMS_COLL = consts.BMS_COLL
    static VISITS_COLL = consts.VISITS_COLL

    private postsColl: string
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
        visitsColl = SocialStorage.VISITS_COLL,
    }: SocialStorageProps) {
        super(storageManager)

        this.postsColl = tweetsColl
        this.usersColl = usersColl
        this.tagsColl = tagsColl
        this.bookmarksColl = bookmarksColl
        this.visitsColl = visitsColl

        this.storageManager.registry.registerCollection(this.postsColl, {
            version: new Date('2019-04-22'),
            fields: {
                id: { type: 'string' },
                text: { type: 'text' },
                url: { type: 'string' },
                createdAt: { type: 'datetime' },
                createdWhen: { type: 'datetime' },
            },
            indices: [{ field: 'url', pk: true }, { field: 'text' }],
            relationships: [{ childOf: this.usersColl, alias: 'userId' }],
        })

        this.storageManager.registry.registerCollection(this.usersColl, {
            version: new Date('2019-04-22'),
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
            ],
        })

        this.storageManager.registry.registerCollection(this.visitsColl, {
            version: new Date('2019-05-15'),
            fields: {
                createdAt: { type: 'datetime' },
            },
            indices: [{ field: 'createdAt' }],
            relationships: [
                {
                    childOf: this.postsColl,
                    alias: 'url',
                },
            ],
        })

        this.storageManager.registry.registerCollection(this.bookmarksColl, {
            version: new Date('2019-05-15'),
            fields: {
                createdAt: { type: 'datetime' },
            },
            indices: [{ field: 'createdAt' }],
            relationships: [{ singleChildOf: this.postsColl, alias: 'url' }],
        })
    }

    async addTweet({
        hashtags,
        url,
        createdWhen = new Date(),
        ...rest
    }: Tweet) {
        const { object } = await this.storageManager
            .collection(this.postsColl)
            .createObject({ url, createdWhen, ...rest })

        await this.addSocialVisit({ url, time: createdWhen })

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
        time = new Date(),
    }: {
        url: string
        time?: Date
    }) {
        return this.storageManager.collection(this.visitsColl).createObject({
            url,
            createdAt: time,
        })
    }

    async addSocialBookmark({
        url,
        time = new Date(),
    }: {
        url: string
        time?: Date
    }) {
        return this.storageManager.collection(this.bookmarksColl).createObject({
            url,
            createdAt: time,
        })
    }

    async delSocialBookmark({ url }: { url: string }) {
        return this.storageManager
            .collection(this.bookmarksColl)
            .deleteOneObject({ url })
    }

    async delSocialPages(urls: string[]) {
        return urls.map(async url => {
            await Promise.all([
                this.storageManager
                    .collection(this.visitsColl)
                    .deleteObjects({ url }),
                this.storageManager
                    .collection(this.postsColl)
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
            .collection(this.postsColl)
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
