import { ContentSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import { ContentSharingStorage } from 'src/content-sharing/background/storage'
import { getListShareUrl } from 'src/content-sharing/utils'

export default class ContentSharingService
    implements ContentSharingServiceInterface {
    constructor(
        private dependencies: {
            storage: { contentSharing: ContentSharingStorage }
        },
    ) {}

    private getKeyLink(params: {
        listReference: SharedListReference
        keyString: string
    }): string {
        return (
            getListShareUrl({
                remoteListId: params.listReference.id as string,
            }) +
            '?key=' +
            params.keyString
        )
    }

    private getKeyStringFromLink(params: { link: string }): string {
        const matchRes = params.link.match(/\?key=(\w+)/)

        if (matchRes == null || matchRes.length < 2) {
            throw new Error('Could not find key string in link')
        }

        return matchRes[1]
    }

    getExistingKeyLinksForList: ContentSharingServiceInterface['getExistingKeyLinksForList'] = async (
        params,
    ) => {
        const sharedListKeys = await this.dependencies.storage.contentSharing.getListKeys(
            { listReference: params.listReference },
        )

        return {
            links: sharedListKeys.map((key) => {
                const keyString = key.reference.id as string
                return {
                    keyString,
                    roleID: key.roleID,
                    link: this.getKeyLink({
                        listReference: params.listReference,
                        keyString,
                    }),
                }
            }),
        }
    }

    generateKeyLink: ContentSharingServiceInterface['generateKeyLink'] = async (
        params,
    ) => {
        const {
            keyString,
        } = await this.dependencies.storage.contentSharing.createListKey(params)
        return {
            keyString,
            link: this.getKeyLink({
                listReference: params.listReference,
                keyString,
            }),
        }
    }

    deleteKeyLink: ContentSharingServiceInterface['deleteKeyLink'] = async (
        params,
    ) => {
        await this.dependencies.storage.contentSharing.deleteListKey({
            keyString: this.getKeyStringFromLink(params),
        })
    }

    processCurrentKey: ContentSharingServiceInterface['processCurrentKey'] = async () => {
        throw new Error('TODO: Implement me')
    }
}
