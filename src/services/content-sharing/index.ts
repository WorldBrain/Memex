import { ContentSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import {
    SharedListReference,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
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
        keyString?: string
    }): string {
        const link = getListShareUrl({
            remoteListId: params.listReference.id as string,
        })

        return params.keyString ? `${link}?key=${params.keyString}` : link
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

        const foundLinks = sharedListKeys.map((key) => {
            const keyString = key.reference.id as string
            return {
                keyString,
                roleID: key.roleID,
                link: this.getKeyLink({
                    listReference: params.listReference,
                    keyString,
                }),
            }
        })

        // There will always be a static reader link for collections that
        //  are already shared. In Memex ext, that would be the case if this service
        //  method is called.
        const readerLink = {
            link: this.getKeyLink({ listReference: params.listReference }),
            roleID: SharedListRoleID.Commenter,
        }

        return {
            links: [readerLink, ...foundLinks],
        }
    }

    generateKeyLink: ContentSharingServiceInterface['generateKeyLink'] = async (
        params,
    ) => {
        let keyString: string | undefined

        if (params.key.roleID !== SharedListRoleID.Commenter) {
            const createListResult = await this.dependencies.storage.contentSharing.createListKey(
                params,
            )
            keyString = createListResult.keyString
        }

        return {
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
            listReference: params.listReference,
            keyString: this.getKeyStringFromLink(params),
        })
    }

    hasCurrentKey: ContentSharingServiceInterface['hasCurrentKey'] = () => {
        throw new Error('TODO: Implement me')
    }

    processCurrentKey: ContentSharingServiceInterface['processCurrentKey'] = async () => {
        throw new Error('TODO: Implement me')
    }
}
