import { FeatureStorage } from 'src/search/storage'
import { StorageManager } from 'src/search'

import { Tweet, User } from 'src/social-integration/types'

export interface TwitterStorageProps {
    storageManager: StorageManager
    tweetsColl?: string
    usersColl?: string
    tagsColl?: string
    bookmarksColl?: string
}

export default class TwitterStorage extends FeatureStorage {
    static TWEETS_COLL = 'tweets'
    static USERS_COLL = 'users'
    static TAGS_COLL = 'tags'
    static BMS_COLL = 'bookmarks'

    private tweetsColl: string
    private usersColl: string
    private bookmarksColl: string
    private tagsColl: string

    constructor({
        storageManager,
        tweetsColl = TwitterStorage.TWEETS_COLL,
        usersColl = TwitterStorage.USERS_COLL,
        tagsColl = TwitterStorage.TAGS_COLL,
        bookmarksColl = TwitterStorage.BMS_COLL,
    }: TwitterStorageProps) {
        super(storageManager)

        this.tweetsColl = tweetsColl
        this.usersColl = usersColl
        this.tagsColl = tagsColl
        this.bookmarksColl = bookmarksColl

        this.storageManager.registry.registerCollection(this.tweetsColl, [
            {
                version: new Date(2019, 4, 22),
                fields: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    createdAt: { type: 'int' },
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

        const users = await Promise.all(
            userIds
                .map(async userId => {
                    const user = await this.storageManager
                        .collection(this.usersColl)
                        .findObject<User>({ id: userId })

                    if (!user) {
                        return null
                    }

                    return {
                        ...user,
                        profilePic: user.profilePic
                            ? await this.encodeImage(user.profilePic, base64Img)
                            : undefined,
                    }
                })
                .filter(user => user !== null),
        )

        return users
    }

    async delTweets(urls: string[]) {
        urls.map(async url => {
            await Promise.all([
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

        return true
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

        return Promise.all(
            users.map(async user => {
                return {
                    ...user,
                    profilePic: user.profilePic
                        ? await this.encodeImage(
                              user.profilePic,
                              opts.base64Img,
                          )
                        : undefined,
                }
            }),
        )
    }

    async getTweetByUrl(url: string) {
        return this.storageManager
            .collection(this.tweetsColl)
            .findOneObject<Tweet>({ url })
    }
}
