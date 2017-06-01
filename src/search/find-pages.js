import get from 'lodash/fp/get'
import update from 'lodash/fp/update'

import db, { normaliseFindResult, resultRowsById } from 'src/pouchdb'
import { pageKeyPrefix } from 'src/page-storage'
import { revisePageFields } from 'src/page-analysis'
import { getAllNodes } from 'src/util/tree-walker'


// Resolve redirects from (deduplicated) pages, replacing them in the results.
// XXX: We only replace the row.doc, and not row.id, row.key, nor row.value.
async function resolveRedirects(pagesResult) {
    // Get the targets of all docs' 'seeInstead' links.
    const targetPageIds = pagesResult.rows.map(get('doc.seeInstead._id'))
        .filter(x => x)

    // If these pages contain no redirects, easy job for us.
    if (targetPageIds.length === 0) return pagesResult

    // Fetch the targeted pages.
    // Note that multi-step redirections are resolved recursively here.
    // XXX: a cycle of redirections would kill us.
    const targetPagesResult = await getPages({
        pageIds: targetPageIds,
        followRedirects: true,
    })

    // Replace each page doc with its redirection target (if it had any).
    const targetRowsById = resultRowsById(targetPagesResult)
    const resolvedPagesResult = update('rows', rows => rows.map(
        update('doc', doc => (!doc.seeInstead)
            // Leave pages without a 'seeInstead' redirection link untouched...
            ? doc
            // ...and replace the contents of the others with the correct page.
            : {...targetRowsById[doc.seeInstead._id].doc}
        )
    ))(pagesResult)

    return resolvedPagesResult
}

// Post-process result list after any retrieval of pages from the database.
async function postprocessPagesResult({pagesResult, followRedirects}) {
    // Let the page analysis module augment or revise the document attributes.
    pagesResult = update('rows', rows => rows.map(
        // We can skip those pages that will replaced by a redirect anyway.
        update('doc', doc => doc.seeInstead ? doc : revisePageFields(doc))
    ))(pagesResult)

    if (followRedirects) {
        // Resolve pages that redirect to other pages.
        pagesResult = await resolveRedirects(pagesResult)
    }

    return pagesResult
}

// Get all pages for a given array of page ids
export async function getPages({pageIds, ...otherOptions}) {
    let pagesResult = await db.allDocs({
        keys: pageIds,
        include_docs: true,
    })
    pagesResult = await postprocessPagesResult({...otherOptions, pagesResult})
    return pagesResult
}

export async function findPagesByUrl({url, ...otherOptions}) {
    const findResult = await db.find({
        selector: {
            _id: { $gte: pageKeyPrefix, $lte: `${pageKeyPrefix}\uffff` },
            url,
        },
    })
    let pagesResult = normaliseFindResult(findResult)
    pagesResult = await postprocessPagesResult({...otherOptions, pagesResult})
    return pagesResult
}

// Find all pages that are (indirectly) connected through 'seeInstead' links.
export async function getEquivalentPages({pageId}) {
    const page = await db.get(pageId)
    // The pages connected by redirects form a tree we can walk through.
    const pageRedirectionTreeWalker = {
        getParent: getPageRedirectTarget,
        getChildren: getRedirectersToPage,
    }
    const equivalentPages = await getAllNodes(pageRedirectionTreeWalker)(page)
    // Shape the list of pages like a PouchDB result object.
    const result = normaliseFindResult({docs: equivalentPages})
    return result
}

async function getPageRedirectTarget(page) {
    if (page.seeInstead && page.seeInstead._id) {
        const parent = await db.get(page.seeInstead._id)
        return parent
    } else {
        return undefined
    }
}

async function getRedirectersToPage(page) {
    const findResult = await db.find({
        selector: {
            'seeInstead._id': page._id,
        },
    })
    return findResult.docs
}
