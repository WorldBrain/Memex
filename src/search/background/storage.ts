import { StorageManager } from '..'
import { FeatureStorage } from '../storage'
import { AnnotSearchParams } from './types'
import { Annotation } from 'src/direct-linking/types'
import { query } from 'src/overview/search-bar/selectors'

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

    private async filterByBookmarks(annots: Annotation[]) {
        const urls = annots.map(annot => annot.url)

        const results = await this.storageManager
            .collection('annotBookmarks')
            .findObjects<any>({ url: { $in: urls } })

        const resultSet = new Set(results.map(result => result.url))
        return annots.filter(annot => resultSet.has(annot.url))
    }

    private async filterByTags(
        annots: Annotation[],
        tagsInc: string[],
        tagsExc: string[],
    ) {
        const urls = annots.map(annot => annot.url)

        let query: object = { url: { $in: urls } }

        if (tagsExc && tagsExc.length) {
            query = { ...query, name: { $nin: tagsExc } }
        }
        if (tagsInc && tagsInc.length) {
            query = { ...query, name: { $in: tagsInc } }
        }

        const results = await this.storageManager
            .collection('tags')
            .findObjects<any>(query)

        const resultSet = new Set(results.map(result => result.url))
        return annots.filter(annot => resultSet.has(annot.url))
    }

    private async filterByCollections(
        annots: Annotation[],
        collections: string[],
    ) {
        const urls = annots.map(annot => annot.url)

        const listIds = await this.storageManager
            .collection('customLists')
            .findObjects<any>({ name: { $in: collections } })
        const results = await this.storageManager
            .collection('annotListEntries')
            .findObjects<any>({ url: { $in: urls }, listId: { $in: listIds } })

        const resultSet = new Set(results.map(result => result.url))
        return annots.filter(annot => resultSet.has(annot.url))
    }

    async listAnnotations({
        limit = 10,
        skip = 0,
        ...params
    }: AnnotSearchParams): Promise<Annotation[]> {
        const innerLimit = limit * 2
        let innerSkip = 0
        let results: Annotation[]
        let continueLookup = true

        while (continueLookup) {
            results = await this.storageManager
                .collection(this.annotsColl)
                .findObjects<Annotation>(
                    {
                        pageUrl: params.url,
                        createdWhen: {
                            $gte: params.endDate,
                            $lte: params.startDate,
                        },
                    },
                    { skip: innerSkip, limit: innerLimit },
                )

            // We've exhausted the DB results
            if (results.length < innerLimit) {
                continueLookup = false
            }

            innerSkip += innerLimit

            if (params.bookmarksOnly) {
                results = await this.filterByBookmarks(results)
            }

            if (params.tagsInc || params.tagsExc) {
                results = await this.filterByTags(
                    results,
                    params.tagsInc,
                    params.tagsExc,
                )
            }

            if (params.collections) {
                results = await this.filterByCollections(
                    results,
                    params.collections,
                )
            }
        }

        return results
    }

    async
}
