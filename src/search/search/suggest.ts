import Dexie from 'dexie'

import db, { Storage } from '..'
import { backend } from '../storex'
import { SuggestOptions, SuggestResult } from '../types'
import { UnimplementedError, InvalidFindOptsError } from '../storage/errors'
import { Tag, Page } from '../models'

type SuggestType = 'domain' | 'tag'

export async function suggest(query = '', type: SuggestType, limit = 10) {
    const applyQuery = <T, Key>(where: Dexie.WhereClause<T, Key>) =>
        where
            .startsWith(query)
            .limit(limit)
            .uniqueKeys()
            .catch(Storage.initErrHandler([] as T[]))

    switch (type) {
        case 'domain': {
            const domains = await applyQuery<Page, string>(
                db.pages.where('domain'),
            )
            const hostnames = await applyQuery<Page, string>(
                db.pages.where('hostname'),
            )
            return [...new Set([...domains, ...hostnames])]
        }
        case 'tag':
        default:
            return applyQuery<Tag, [string, string]>(db.tags.where('name'))
    }
}

export async function suggestObjects<S, P = any>(
    collection: string,
    query,
    options: SuggestOptions = {},
) {
    // Grab first entry from the filter query; ignore rest for now
    const [[indexName, value], ...fields] = Object.entries<string>(query)

    if (fields.length > 0) {
        throw new UnimplementedError(
            '`suggestObjects` only supports querying a single field.',
        )
    }

    const whereClause = backend.dexieInstance
        .table<S, P>(collection)
        .where(indexName)

    let coll =
        options.ignoreCase &&
        options.ignoreCase.length &&
        options.ignoreCase[0] === indexName
            ? whereClause.startsWithIgnoreCase(value)
            : whereClause.startsWith(value)

    if (options.ignoreCase[0] !== indexName) {
        throw new InvalidFindOptsError(
            `Specified ignoreCase field '${
                options.ignoreCase[0]
            }' is not in filter query`,
        )
    }

    coll = coll.limit(options.limit)

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
export async function extendedSuggest(
    notInclude = [],
    type: SuggestType,
    limit = 20,
) {
    const applyQuery = <T, Key>(where: Dexie.WhereClause<T, Key>) =>
        where
            .noneOf(notInclude)
            .limit(limit)
            .uniqueKeys()
            .catch(Storage.initErrHandler([] as T[]))

    switch (type) {
        case 'domain': {
            const domains = await applyQuery<Page, string>(
                db.pages.where('domain'),
            )
            const hostnames = await applyQuery<Page, string>(
                db.pages.where('hostname'),
            )
            return [...new Set([...domains, ...hostnames])]
        }
        case 'tag':
        default:
            return applyQuery<Tag, [string, string]>(db.tags.where('name'))
    }
}
