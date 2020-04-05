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
                .startsWith(query)
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
        const [[indexName, value], ...fields] = Object.entries<string>(query)

        if (fields.length > 1) {
            throw new UnimplementedError(
                '`suggestObjects` only supports querying a single field.',
            )
        }

        const whereClause = db.table<S, P>(collection).where(indexName)

        let coll =
            options.ignoreCase &&
            options.ignoreCase.length &&
            options.ignoreCase[0] === indexName
                ? whereClause.startsWithIgnoreCase(value)
                : whereClause.startsWith(value)

        if (options.ignoreCase && options.ignoreCase[0] !== indexName) {
            throw new InvalidFindOptsError(
                `Specified ignoreCase field '${options.ignoreCase[0]}' is not in filter query`,
            )
        }

        coll = coll.limit(options.limit || 10)

        if (options.reverse) {
            coll = coll.reverse()
        }

        const suggestions: any[] = await coll.uniqueKeys()

        const pks = options.includePks ? await coll.primaryKeys() : []

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
        const applyQuery = where =>
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
