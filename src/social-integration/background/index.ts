import SocialStorage from './storage'
import { StorageManager } from 'src/search/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { Tweet, User, TweetUrl } from 'src/social-integration/types'
import fetchImage from 'src/social-integration/fetch-image'
import { deriveTweetUrlProps } from '../util'

const dataURLtoBlob = require('dataurl-to-blob')

export default class SocialBackground {
    private storage: SocialStorage

    constructor({ storageManager }: { storageManager: StorageManager }) {
        this.storage = new SocialStorage({ storageManager })
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            addTweet: this.addTweet.bind(this),
            delSocialPages: this.delSocialPages.bind(this),
            addSocialBookmark: this.addSocialBookmark.bind(this),
            delSocialBookmark: this.delSocialBookmark.bind(this),
            fetchUserSuggestions: this.fetchUserSuggestions.bind(this),
            fetchAllUsers: this.fetchAllUsers.bind(this),
            fetchAllHashtags: this.fetchAllHashtags.bind(this),
            fetchHashtagSuggestions: this.fetchHashtagSuggestions.bind(this),
        })
    }

    private getPostIdFromUrl = (url: string): Promise<number> => {
        const { serviceId } = deriveTweetUrlProps({ url })

        return this.storage.getPostIdForServiceId({ serviceId })
    }

    async addTweet({ user, ...tweet }: Tweet) {
        await this.addUser(user)

        return this.storage.addSocialPost(tweet)
    }

    async delSocialPages(urls: string[]) {
        const postIds = await Promise.all(urls.map(this.getPostIdFromUrl))
        return this.storage.delSocialPages({ postIds })
    }

    async addSocialBookmark({ url, time }: { url: string; time?: Date }) {
        const postId = await this.getPostIdFromUrl(url)
        return this.storage.addSocialBookmark({ postId, time })
    }

    async delSocialBookmark({ url }: { url: string }) {
        const postId = await this.getPostIdFromUrl(url)
        return this.storage.delSocialBookmark({ postId })
    }

    async addUser({ profilePicUrl, ...rest }: User) {
        const profilePicURI = await fetchImage(profilePicUrl)
        const profilePic: Blob = profilePicURI
            ? dataURLtoBlob(profilePicURI)
            : undefined

        return this.storage.addSocialUser({
            ...rest,
            profilePic,
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
        const query = {
            id: {
                $nin: excludeIds,
            },
        }

        const opts = {
            limit,
            skip,
            base64Img,
        }

        return this.storage.fetchAllUsers({
            query,
            opts,
        })
    }

    async fetchAllHashtags({ excludeIds = [], skip = 0, limit = 20 }) {
        const query = {
            name: {
                $nin: excludeIds,
            },
        }

        const opts = {
            limit,
            skip,
        }

        return this.storage.fetchAllHashtags({
            query,
            opts,
        })
    }

    async fetchHashtagSuggestions({ name }: { name: string }) {
        return this.storage.fetchHashtagSuggestions({ name })
    }
}
