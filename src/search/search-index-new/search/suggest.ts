import Dexie from 'dexie'

import db from '..'
import { Tag, Page } from '../models'

type SuggestType = 'domain' | 'tag'

export async function suggest(query = '', type: SuggestType, limit = 10) {
    const applyQuery = <T, Key>(where: Dexie.WhereClause<T, Key>) =>
        where
            .startsWith(query)
            .limit(limit)
            .uniqueKeys()

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

    // return await applyQuery<Tag, [string, string]>(db.tags.where('name'))
}
