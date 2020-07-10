import StorageManager from '@worldbrain/storex'
import { ContentSharingInterface } from './types'
import ContentSharingStorage from './storage'

export default class ContentSharingBackground {
    remoteFunctions: ContentSharingInterface

    constructor(
        private options: {
            storageManager: StorageManager
            getContentSharing: () => Promise<ContentSharingStorage>
        },
    ) {
        this.remoteFunctions = {
            shareList: this.shareList,
            shareListEntries: this.shareListEntries,
        }
    }

    shareList: ContentSharingInterface['shareList'] = async () => {}

    shareListEntries: ContentSharingInterface['shareListEntries'] = async () => {}
}
