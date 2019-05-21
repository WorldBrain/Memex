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
    listEntriesColl?: string
}

export default class SocialStorage extends FeatureStorage {
    static TWEETS_COLL = consts.POSTS_COLL
    static USERS_COLL = consts.USERS_COLL
    static TAGS_COLL = consts.TAGS_COLL
    static BMS_COLL = consts.BMS_COLL
    static VISITS_COLL = consts.VISITS_COLL
    static LIST_ENTRIES_COLL = consts.LIST_ENTRIES_COLL

    private postsColl: string
    private usersColl: string
    private bookmarksColl: string
    private tagsColl: string
    private visitsColl: string
    private listEntriesColl: string

    constructor({
        storageManager,
        tweetsColl = SocialStorage.TWEETS_COLL,
        usersColl = SocialStorage.USERS_COLL,
        tagsColl = SocialStorage.TAGS_COLL,
        bookmarksColl = SocialStorage.BMS_COLL,
        visitsColl = SocialStorage.VISITS_COLL,
        listEntriesColl = SocialStorage.LIST_ENTRIES_COLL,
    }: SocialStorageProps) {
        super(storageManager)

        this.postsColl = tweetsColl
        this.usersColl = usersColl
        this.tagsColl = tagsColl
        this.bookmarksColl = bookmarksColl
        this.visitsColl = visitsColl
        this.listEntriesColl = listEntriesColl

        this.storageManager.registry.registerCollection(this.postsColl, {
            version: new Date('2019-04-22'),
            fields: {
                text: { type: 'text' },
                serviceId: { type: 'string' },
                createdAt: { type: 'datetime' },
                createdWhen: { type: 'datetime' },
            },
            indices: [{ field: 'text' }, { field: 'serviceId' }],
            relationships: [
                {
                    childOf: this.usersColl,
                    alias: 'userId',
                    fieldName: 'userId',
                },
            ],
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
                    alias: 'postId',
                    fieldName: 'postId',
                },
            ],
        })

        this.storageManager.registry.registerCollection(this.bookmarksColl, {
            version: new Date('2019-05-15'),
            fields: {
                createdAt: { type: 'datetime' },
            },
            indices: [{ field: 'createdAt' }],
            relationships: [
                {
                    singleChildOf: this.postsColl,
                    alias: 'postId',
                    fieldName: 'postId',
                },
            ],
        })

        this.storageManager.registry.registerCollection(this.tagsColl, {
            version: new Date('2019-05-17'),
            fields: {
                name: { type: 'string' },
            },
            indices: [{ field: 'name' }],
            relationships: [
                {
                    childOf: this.postsColl,
                    alias: 'postId',
                    fieldName: 'postId',
                },
            ],
        })

        this.storageManager.registry.registerCollection(this.listEntriesColl, {
            version: new Date('2019-05-17'),
            fields: {
                createdAt: { type: 'datetime' },
            },
            relationships: [
                {
                    childOf: 'customLists',
                    alias: 'listId',
                    fieldName: 'listId',
                },
                {
                    childOf: this.postsColl,
                    alias: 'postId',
                    fieldName: 'postId',
                },
            ],
        })
    }

    async addListEntry({
        createdAt = new Date(),
        ...entry
    }: {
        postId: number
        listId: number
        createdAt?: Date
    }) {
        const { object } = await this.storageManager
            .collection(this.listEntriesColl)
            .createObject({ createdAt, ...entry })
        return object.id
    }

    async addSocialPost({ hashtags, createdAt = new Date(), ...rest }: Tweet) {
        const { object } = await this.storageManager
            .collection(this.postsColl)
            .createObject({ createdAt, ...rest })

        const postId = object.id

        await this.addSocialVisit({ postId, time: createdAt })
        await this.addSocialTags({ hashtags, postId })

        return postId
    }

    async addSocialUser({
        id,
        name,
        username,
        isVerified,
        profilePic,
        type,
    }: User) {
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

    async addSocialTags({
        hashtags,
        postId,
    }: {
        hashtags: string[]
        postId: number
    }) {
        await Promise.all(
            hashtags.map(hashtag =>
                this.storageManager.collection(this.tagsColl).createObject({
                    name: hashtag,
                    postId,
                }),
            ),
        )
    }

    async addSocialVisit({
        postId,
        time = new Date(),
    }: {
        postId: number
        time?: Date
    }) {
        return this.storageManager.collection(this.visitsColl).createObject({
            postId,
            createdAt: time,
        })
    }

    async addSocialBookmark({
        postId,
        time = new Date(),
    }: {
        postId: number
        time?: Date
    }) {
        return this.storageManager.collection(this.bookmarksColl).createObject({
            postId,
            createdAt: time,
        })
    }

    async delSocialBookmark({ postId }: { postId: number }) {
        return this.storageManager
            .collection(this.bookmarksColl)
            .deleteOneObject({ postId })
    }

    async delSocialPages({ postIds }: { postIds: number[] }) {
        for (const postId of postIds) {
            await Promise.all([
                this.storageManager
                    .collection(this.postsColl)
                    .deleteObjects({ id: postId }),
                this.storageManager
                    .collection(this.visitsColl)
                    .deleteObjects({ postId }),
                this.storageManager
                    .collection(this.tagsColl)
                    .deleteObjects({ postId }),
                this.storageManager
                    .collection(this.bookmarksColl)
                    .deleteObjects({ postId }),
            ])
        }
    }

    async getSocialPost({ id }: { id: number }): Promise<Tweet> {
        return this.storageManager
            .collection(this.postsColl)
            .findOneObject<Tweet>({ id })
    }

    async getPostIdForServiceId({
        serviceId,
    }: {
        serviceId: string
    }): Promise<number> {
        const post = await this.storageManager
            .collection(this.postsColl)
            .findObject<Tweet>({ serviceId })

        if (post == null) {
            return null
        }

        return post.id
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

    async fetchAllHashtags({
        query = {},
        opts = {},
    }: {
        query?: any
        opts?: any
    }) {
        const hashtags = await this.storageManager
            .collection(this.tagsColl)
            .findObjects(query, opts)

        return hashtags.map(({ name }) => name)
    }

    async fetchHashtagSuggestions({ name }: { name: string }) {
        const suggestions = await this.storageManager
            .collection(this.tagsColl)
            .suggestObjects<string, string>({ name }, { ignoreCase: ['name'] })

        return suggestions.map(({ suggestion }) => suggestion)
    }
}
