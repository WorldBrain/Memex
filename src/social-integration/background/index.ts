import Storex from '@worldbrain/storex'

import SocialStorage from './storage'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { Tweet, User, TweetUrl } from 'src/social-integration/types'
import fetchImage from 'src/social-integration/fetch-image'
import { deriveTweetUrlProps, buildPostUrlId } from '../util'

const dataURLtoBlob = require('dataurl-to-blob')

export default class SocialBackground {
    storage: SocialStorage

    constructor({ storageManager }: { storageManager: Storex }) {
        this.storage = new SocialStorage({ storageManager })
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            addTweet: this.addTweet.bind(this),
            addPostToList: this.addPostToList.bind(this),
            delPostFromList: this.delPostFromList.bind(this),
            fetchSocialPostLists: this.fetchSocialPostLists.bind(this),
            delSocialPages: this.delSocialPages.bind(this),
            addSocialBookmark: this.addSocialBookmark.bind(this),
            delSocialBookmark: this.delSocialBookmark.bind(this),
            addTagForTweet: this.addTagForTweet.bind(this),
            delTagForTweet: this.delTagForTweet.bind(this),
            fetchSocialPostTags: this.fetchSocialPostTags.bind(this),
            fetchUserSuggestions: this.fetchUserSuggestions.bind(this),
            fetchAllUsers: this.fetchAllUsers.bind(this),
            fetchAllHashtags: this.fetchAllHashtags.bind(this),
            fetchHashtagSuggestions: this.fetchHashtagSuggestions.bind(this),
        })
    }

    getPostIdFromUrl = (url: string): Promise<number> => {
        const { serviceId } = deriveTweetUrlProps({ url })

        return this.storage.getPostIdForServiceId({ serviceId })
    }

    async addTweet({ user, ...tweet }: Tweet) {
        const userId = await this.addUser(user)

        return this.storage.addSocialPost({ ...tweet, userId })
    }

    async addPostToList({ id, url }: TweetUrl & { id: number }) {
        const postId = await this.getPostIdFromUrl(url)

        return this.storage.addListEntry({ listId: id, postId })
    }

    async delPostFromList({ id, url }: TweetUrl & { id: number }) {
        const postId = await this.getPostIdFromUrl(url)

        return this.storage.delListEntry({ listId: id, postId })
    }

    async fetchSocialPostLists({ url }: { url: string }) {
        const postId = await this.getPostIdFromUrl(url)

        if (!postId) {
            return []
        }

        return this.storage.fetchListPagesByPostId({ postId })
    }

    async delSocialPages(urls: string[]) {
        const postIds = await Promise.all(urls.map(this.getPostIdFromUrl))
        return this.storage.delSocialPages({ postIds })
    }

    async addTagForTweet({ url, tag }: { url: string; tag: string }) {
        const postId = await this.getPostIdFromUrl(url)

        return this.storage.addTagForPost({
            name: tag,
            url: buildPostUrlId({ postId }).url,
        })
    }

    async delTagForTweet({ url, tag }: { url: string; tag: string }) {
        const postId = await this.getPostIdFromUrl(url)

        return this.storage.delTagForPost({
            name: tag,
            url: buildPostUrlId({ postId }).url,
        })
    }

    async fetchSocialPostTags({ url }: { url: string }) {
        const postId = await this.getPostIdFromUrl(url)
        const postUrl = buildPostUrlId({ postId }).url

        return this.storage.fetchSocialPostTags({ url: postUrl })
    }

    async addSocialBookmark({ url, time }: { url: string; time?: Date }) {
        const postId = await this.getPostIdFromUrl(url)
        return this.storage.addSocialBookmark({ postId, time })
    }

    async delSocialBookmark({ url }: { url: string }) {
        const postId = await this.getPostIdFromUrl(url)
        return this.storage.delSocialBookmark({ postId })
    }

    async addUser({
        profilePicUrl,
        serviceId,
        ...rest
    }: User): Promise<number> {
        // Use existing user if present
        const userId = await this.storage.getUserIdForServiceId({ serviceId })

        if (userId) {
            return userId
        }

        const profilePicURI = await fetchImage(profilePicUrl)
        const profilePic: Blob = profilePicURI
            ? dataURLtoBlob(profilePicURI)
            : undefined

        return this.storage.addSocialUser({
            ...rest,
            profilePic,
            serviceId,
        })
    }

    async fetchUserSuggestions({
        name,
        base64Img,
    }: {
        name: string
        base64Img?: boolean
    }) {
        return this.storage.fetchUserSuggestions({ name, base64Img })
    }

    async fetchAllUsers({
        excludeIds = [],
        skip = 0,
        limit = 20,
        base64Img = false,
    }) {
        excludeIds = await Promise.all(
            excludeIds.map(serviceId =>
                this.storage.getUserIdForServiceId({ serviceId }),
            ),
        )

        return this.storage.fetchAllUsers({
            excludeIds,
            skip,
            limit,
            base64Img,
        })
    }

    async fetchAllHashtags({ excludeIds = [], skip = 0, limit = 20 }) {
        return this.storage.fetchAllHashtags({
            excludeIds,
            limit,
            skip,
        })
    }

    async fetchHashtagSuggestions({ name }: { name: string }) {
        return this.storage.fetchHashtagSuggestions({ name })
    }
}
