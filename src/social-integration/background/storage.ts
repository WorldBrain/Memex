import Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-storage/lib/social-posts/constants'

import { SuggestPlugin } from 'src/search/plugins'
import { Tweet, User } from '../types'
import { PageList } from 'src/custom-lists/background/types'
import { Annotation } from 'src/direct-linking/types'
import { buildPostUrlId } from '../util'

export interface SocialStorageProps {
    storageManager: Storex
    tweetsColl?: string
    usersColl?: string
    tagsColl?: string
    bookmarksColl?: string
    listEntriesColl?: string
}

export default class SocialStorage extends StorageModule {
    static TWEETS_COLL = COLLECTION_NAMES.post
    static USERS_COLL = COLLECTION_NAMES.user
    static TAGS_COLL = COLLECTION_NAMES.tag
    static BMS_COLL = COLLECTION_NAMES.bookmark
    static LIST_ENTRIES_COLL = COLLECTION_NAMES.listEntry

    private storageManager: Storex
    private postsColl: string
    private usersColl: string
    private bookmarksColl: string
    private tagsColl: string
    private listEntriesColl: string

    constructor({
        storageManager,
        tweetsColl = SocialStorage.TWEETS_COLL,
        usersColl = SocialStorage.USERS_COLL,
        tagsColl = SocialStorage.TAGS_COLL,
        bookmarksColl = SocialStorage.BMS_COLL,
        listEntriesColl = SocialStorage.LIST_ENTRIES_COLL,
    }: SocialStorageProps) {
        super({ storageManager })
        this.storageManager = storageManager

        this.postsColl = tweetsColl
        this.usersColl = usersColl
        this.tagsColl = tagsColl
        this.bookmarksColl = bookmarksColl
        this.listEntriesColl = listEntriesColl
    }

    getConfig = (): StorageModuleConfig => ({
        collections: {
            ...COLLECTION_DEFINITIONS,
        },
        operations: {
            createSocialPost: {
                collection: this.postsColl,
                operation: 'createObject',
            },
            createSocialUser: {
                collection: this.usersColl,
                operation: 'createObject',
            },
            createListEntry: {
                collection: this.listEntriesColl,
                operation: 'createObject',
            },
            createHashTag: {
                collection: this.tagsColl,
                operation: 'createObject',
            },
            createSocialBookmark: {
                collection: this.bookmarksColl,
                operation: 'createObject',
            },
            deleteListEntry: {
                collection: this.listEntriesColl,
                operation: 'deleteObjects',
                args: { listId: '$listId:number', postId: '$postId:number' },
            },
            deleteSocialBookmark: {
                collection: this.bookmarksColl,
                operation: 'deleteObjects',
                args: { postId: '$postId:number' },
            },
            deleteSocialUser: {
                collection: this.usersColl,
                operation: 'deleteObject',
                args: { id: '$id:number' },
            },
            deleteListEntriesForPost: {
                collection: this.listEntriesColl,
                operation: 'deleteObjects',
                args: { postId: '$postId:number' },
            },
            deleteHashTagsForPost: {
                collection: this.tagsColl,
                operation: 'deleteObjects',
                args: { postId: '$postId:number' },
            },
            deleteSocialPost: {
                collection: this.postsColl,
                operation: 'deleteObject',
                args: { id: '$postId:number' },
            },
            findSocialPost: {
                collection: this.postsColl,
                operation: 'findObject',
                args: { id: '$id:number' },
            },
            findSocialUsers: {
                collection: this.usersColl,
                operation: 'findObjects',
                args: { id: { $in: '$userIds:number[]' } },
            },
            findSocialUsersExc: {
                collection: this.usersColl,
                operation: 'findObjects',
                args: [{ id: { $nin: '$userIds:number[]' } }, '$opts:any'],
            },
            findPostByServiceId: {
                collection: this.postsColl,
                operation: 'findObject',
                args: { serviceId: '$serviceId:string' },
            },
            findUserByServiceId: {
                collection: this.usersColl,
                operation: 'findObject',
                args: { serviceId: '$serviceId:string' },
            },
            findListEntriesForPost: {
                collection: this.listEntriesColl,
                operation: 'findObjects',
                args: { postId: '$postId:number' },
            },
            findHashTagsExc: {
                collection: this.tagsColl,
                operation: 'findObjects',
                args: [
                    { name: { $nin: '$excludedIds:number[]' } },
                    '$opts:any',
                ],
            },
            updateSocialPost: {
                collection: this.postsColl,
                operation: 'updateObject',
                args: [
                    {
                        id: '$id:pk',
                    },
                    {
                        $set: {
                            createdAt: '$createdAt:date',
                        },
                    },
                ],
            },
            countSocialPostsForUser: {
                collection: this.postsColl,
                operation: 'countObjects',
                args: { userId: '$userId:number' },
            },
            suggestUsers: {
                operation: SuggestPlugin.SUGGEST_OBJS_OP_ID,
                args: {
                    collection: this.usersColl,
                    query: { name: '$name:string' },
                    options: { includePks: true, ignoreCase: ['name'] },
                },
            },
            suggestHashTags: {
                operation: SuggestPlugin.SUGGEST_OBJS_OP_ID,
                args: {
                    collection: this.tagsColl,
                    query: { name: '$name:string' },
                    options: { ignoreCase: ['name'] },
                },
            },
        },
    })

    async addListEntry({
        createdAt = new Date(),
        ...entry
    }: {
        postId: number
        listId: number
        createdAt?: Date
    }): Promise<number> {
        const { object } = await this.operation('createListEntry', {
            createdAt,
            ...entry,
        })
        return object.id
    }

    async delListEntry({ listId, postId }: { listId: number; postId: number }) {
        return this.operation('deleteListEntry', { listId, postId })
    }

    private changeListsBeforeSending(
        lists: PageList[],
        pageEntries: any[],
    ): PageList[] {
        const mappedLists = lists.map(list => {
            const page = pageEntries.find(({ listId }) => listId === list.id)
            delete list['_name_terms']
            return {
                ...list,
                pages: [],
                active: Boolean(page),
            }
        })

        return mappedLists
    }

    async fetchAllLists({
        query = {},
        opts = {},
    }: {
        query?: any
        opts?: any
    }) {
        const x = await this.storageManager
            .collection('customLists')
            .findObjects<PageList>(query, opts)

        return this.changeListsBeforeSending(x, [])
    }

    async fetchListPagesByPostId({ postId }: { postId: number }) {
        const entries = await this.operation('findListEntriesForPost', {
            postId,
        })

        const listIds = entries.map(({ listId }) => listId)
        const lists = await this.fetchAllLists({
            query: {
                id: { $in: listIds },
            },
        })

        return this.changeListsBeforeSending(lists, entries)
    }

    async addSocialPost({
        hashtags,
        createdAt = new Date(),
        createdWhen,
        serviceId,
        ...rest
    }: Tweet): Promise<number> {
        const postExistsId = await this.getPostIdForServiceId({ serviceId })

        if (postExistsId) {
            return this.operation('updateSocialPost', {
                id: postExistsId,
                createdAt,
            })
        }

        const { object } = await this.operation('createSocialPost', {
            createdAt,
            createdWhen: new Date(createdWhen),
            serviceId,
            ...rest,
        })

        const postId = object.id

        await this.addSocialTags({ hashtags, postId })

        return postId
    }

    async addSocialUser({
        serviceId,
        name,
        username,
        isVerified,
        profilePic,
        type,
    }: User): Promise<number> {
        const { object } = await this.operation('createSocialUser', {
            name,
            username,
            isVerified,
            profilePic,
            type,
            serviceId,
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
                this.operation('createHashTag', {
                    name: hashtag,
                    postId,
                }),
            ),
        )
    }

    async addSocialBookmark({
        postId,
        time = new Date(),
    }: {
        postId: number
        time?: Date
    }): Promise<number> {
        const { object } = await this.operation('createSocialBookmark', {
            postId,
            createdAt: time,
        })

        return object.id
    }

    async addTagForPost({ name, url }: { name: string; url: string }) {
        return this.storageManager.collection('tags').createObject({
            name,
            url,
        })
    }

    async delTagForPost({ name, url }: { name: string; url: string }) {
        return this.storageManager.collection('tags').deleteObjects({
            name,
            url,
        })
    }

    async fetchSocialPostTags({ url }: { url: string }) {
        const tags = await this.storageManager
            .collection('tags')
            .findObjects({ url })

        return tags.map(({ name }) => name)
    }

    async delSocialBookmark({ postId }: { postId: number }) {
        return this.operation('deleteSocialBookmark', { postId })
    }

    private async maybeDeletePostAuthor({ postId }: { postId: number }) {
        const { userId } = await this.operation('findSocialPost', {
            id: postId,
        })

        const postCount = await this.operation('countSocialPostsForUser', {
            userId,
        })

        if (postCount > 1) {
            return
        }

        return this.operation('deleteSocialUser', { id: userId })
    }

    private async deletePostAnnots({ postUrlId }: { postUrlId: string }) {
        const annots = await this.storageManager
            .collection('annotations')
            .findObjects<Annotation>({ pageUrl: postUrlId })

        const annotIds = annots.map(annot => annot.url)

        return Promise.all([
            this.storageManager
                .collection('annotBookmarks')
                .deleteObjects({ url: { $in: annotIds } }),
            this.storageManager
                .collection('annotListEntries')
                .deleteObjects({ url: { $in: annotIds } }),
            this.storageManager
                .collection('annotations')
                .deleteObjects({ pageUrl: postUrlId }),
        ])
    }

    async delSocialPages({ postIds }: { postIds: number[] }) {
        for (const postId of postIds) {
            const postUrlId = buildPostUrlId({ postId }).url
            await this.maybeDeletePostAuthor({ postId })

            await Promise.all([
                this.operation('deleteSocialPost', { postId }),
                this.operation('deleteHashTagsForPost', { postId }),
                this.operation('deleteListEntriesForPost', { postId }),
                this.delSocialBookmark({ postId }),
                this.deletePostAnnots({ postUrlId }),
                this.storageManager
                    .collection('tags')
                    .deleteObjects({ url: postUrlId }),
            ])
        }
    }

    async getSocialPost({ id }: { id: number }): Promise<Tweet> {
        return this.operation('findSocialPost', { id })
    }

    async getUserIdForServiceId({
        serviceId,
    }: {
        serviceId: string
    }): Promise<number> {
        const user: User = await this.operation('findUserByServiceId', {
            serviceId,
        })

        if (user == null) {
            return null
        }

        return user.id
    }

    async getPostIdForServiceId({
        serviceId,
    }: {
        serviceId: string
    }): Promise<number> {
        const post: Tweet = await this.operation('findPostByServiceId', {
            serviceId,
        })

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
        const suggestions = await this.operation('suggestUsers', {
            name,
        })

        const userIds = suggestions.map(({ pk }) => pk)

        const users = await this.operation('findSocialUsers', { userIds })

        return this.attachImage(users, base64Img)
    }

    async fetchAllUsers({
        excludeIds,
        ...opts
    }: {
        excludeIds: number[]
        skip?: number
        limit?: number
        base64Img?: boolean
    }) {
        const users = await this.operation('findSocialUsersExc', {
            userIds: excludeIds,
            opts,
        })

        return this.attachImage(users, opts.base64Img)
    }

    async fetchAllHashtags({
        excludeIds,
        ...opts
    }: {
        excludeIds: number[]
        limit: number
        skip: number
    }) {
        const hashtags = await this.operation('findHashTagsExc', {
            excludedIds: excludeIds,
            opts,
        })

        return hashtags.map(({ name }) => name)
    }

    async fetchHashtagSuggestions({ name }: { name: string }) {
        const suggestions = await this.operation('suggestHashTags', { name })

        return suggestions.map(({ suggestion }) => suggestion)
    }
}
