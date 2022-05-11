import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { SuggestOptions, SuggestResult } from '../types'
import { UnimplementedError, InvalidFindOptsError } from '../storage/errors'
import { Tag, Page } from '../models'
import { initErrHandler } from '../storage'

export type SuggestType = 'domain' | 'tag'

export class SuggestPlugin extends StorageBackendPlugin<DexieStorageBackend> {
    static SUGGEST_OP_ID = 'memex:dexie.suggest'
    static SUGGEST_OBJS_OP_ID = 'memex:dexie.suggestObjects'
    static SUGGEST_EXT_OP_ID = 'memex:dexie.extendedSuggest'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            SuggestPlugin.SUGGEST_OP_ID,
            this.suggest.bind(this),
        )
        backend.registerOperation(
            SuggestPlugin.SUGGEST_OBJS_OP_ID,
            this.suggestObjects.bind(this),
        )
        backend.registerOperation(
            SuggestPlugin.SUGGEST_EXT_OP_ID,
            this.suggestExtended.bind(this),
        )
    }

    async suggest({
        query = '',
        type,
        limit = 10,
    }: {
        query: string
        type: SuggestType
        limit?: number
    }) {
        const db = this.backend.dexieInstance
        const applyQuery = <T, Key>(where) =>
            where
                .startsWithIgnoreCase(query)
                .limit(limit)
                .uniqueKeys()
                .catch(initErrHandler([] as T[]))

        switch (type) {
            case 'domain': {
                const domains = await applyQuery<Page, string>(
                    db.table('pages').where('domain'),
                )
                const hostnames = await applyQuery<Page, string>(
                    db.table('pages').where('hostname'),
                )
                return [...new Set([...domains, ...hostnames])]
            }
            case 'tag':
            default:
                return applyQuery<Tag, [string, string]>(
                    db.table('tags').where('name'),
                )
        }
    }

    /**
     * NOTE: This is now only used for the space picker's suggestion functionality, and has been changed to
     *  deal with some space picker-specific stuff. Likely things won't work so nicely elsewhere
     */
    async suggestObjects<S, P = any>({
        collection,
        query,
        options = {},
    }: {
        collection: string
        query: any
        options?: SuggestOptions
    }) {
        const db = this.backend.dexieInstance
        // Grab first entry from the filter query; ignore rest for now
        const [[indexName, searchQuery], ...fields] = Object.entries<string>(
            query,
        )

        if (fields.length > 1) {
            throw new UnimplementedError(
                '`suggestObjects` only supports querying a single field.',
            )
        }

        const distinctTerms = searchQuery.split(/\s+/).filter(Boolean)
        const whereClause = db.table<S, P>(collection).where(indexName)

        let coll =
            options.ignoreCase &&
            options.ignoreCase.length &&
            options.ignoreCase[0] === indexName
                ? whereClause.startsWithAnyOfIgnoreCase(distinctTerms)
                : whereClause.startsWithAnyOf(distinctTerms)

        if (options.ignoreCase && options.ignoreCase[0] !== indexName) {
            throw new InvalidFindOptsError(
                `Specified ignoreCase field '${options.ignoreCase[0]}' is not in filter query`,
            )
        }

        coll = coll.limit(options.limit || 10)

        if (options.reverse) {
            coll = coll.reverse()
        }

        let suggestions: any[] = []
        const _pks: any[] = []
        if (options.multiEntryAssocField) {
            const records = await coll.distinct().toArray()
            records.forEach((record) => {
                _pks.push(record['id'])
                suggestions.push(record[options.multiEntryAssocField])
            })
        } else {
            suggestions = await coll.uniqueKeys()
        }

        const pks = options.includePks ? _pks : []

        return suggestions.map((suggestion: S, i) => ({
            suggestion,
            collection,
            pk: pks[i],
        })) as SuggestResult<S, P>
    }

    // Used to provide initial suggestions for tags that are not associated with the list.
    async suggestExtended({
        notInclude = [],
        type,
        limit = 20,
    }: {
        notInclude?: string[]
        type: SuggestType
        limit?: number
    }) {
        const db = this.backend.dexieInstance
        const applyQuery = (where) =>
            where
                .noneOf(notInclude)
                .limit(limit)
                .uniqueKeys()
                .catch(initErrHandler([]))

        switch (type) {
            case 'domain': {
                const domains = await applyQuery(
                    db.table('pages').where('domain'),
                )
                const hostnames = await applyQuery(
                    db.table('pages').where('hostname'),
                )
                return [...new Set([...domains, ...hostnames])]
            }
            case 'tag':
            default:
                return applyQuery(db.table('tags').where('name'))
        }
    }
}
