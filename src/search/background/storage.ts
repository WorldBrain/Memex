import { StorageManager } from '..'
import { FeatureStorage } from '../storage'
import { AnnotListParams } from './types'

export interface SearchStorageProps {
    storageManager: StorageManager
    annotationsColl?: string
}

export default class SearchStorage extends FeatureStorage {
    static ANNOTS_COLL = 'annotations'

    private annotsColl: string

    constructor({
        storageManager,
        annotationsColl = SearchStorage.ANNOTS_COLL,
    }: SearchStorageProps) {
        super(storageManager)

        this.annotsColl = annotationsColl
    }

    async listAnnotations({ url, limit = 10, skip = 0 }: AnnotListParams) {
        return this.storageManager
            .collection(this.annotsColl)
            .findObjects({ pageUrl: url }, { skip, limit })
    }
}
