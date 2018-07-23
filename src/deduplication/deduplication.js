// See for explanation: https://github.com/WebMemex/webmemex-extension/issues/22#issuecomment-282329412

import get from 'lodash/fp/get'
import maxBy from 'lodash/fp/maxBy'

import { getTimestamp } from 'src/activity-logger'
import determinePageSameness, { Sameness } from './sameness'

function samenessLinkType({ sameness }) {
    const types = {
        [Sameness.EXACTLY]: 'sameAs',
        [Sameness.OSTENSIBLY]: 'updatedBy',
        [Sameness.MOSTLY]: 'updatedBy',
        [Sameness.PARTLY]: 'updatedBy',
        [Sameness.HARDLY]: 'replacedBy',
        [Sameness.UNRELATED]: 'replacedBy',
        [Sameness.UNKNOWN]: undefined,
    }
    return types[sameness]
}

async function forgetPageContents({ page, pageId = page._id }) {
    // Remove stored content, screenshots, etcetera.
    // await updateDoc(db, pageId, doc => ({
    //     ...doc,
    //     content: undefined,
    //     _attachments: {},
    // }))
}

async function addLink({ targetId, sourceId, linkType }) {
    // await updateDoc(db, sourceId, doc => ({
    //     ...doc,
    //     [linkType]: { _id: targetId },
    // }))
}

async function replaceWithRedirect({ oldPage, newPage, sameness }) {
    await forgetPageContents({ page: oldPage })
    // Add a reference that indicates where to find usable content instead.
    await addLink({
        targetId: newPage._id,
        sourceId: oldPage._id,
        linkType: 'seeInstead',
    })
    // Also express the type of relation (degree of sameness) between the pages.
    await addLink({
        targetId: newPage._id,
        sourceId: oldPage._id,
        linkType: samenessLinkType({ sameness }),
    })
}

// Tells whether the record quality of one page is better than that of the other.
function hasHigherFidelity(page, comparisonPage) {
    const hasFrozenPage = page =>
        get(['_attachments', 'frozen-page.html'])(page) !== undefined
    if (hasFrozenPage(page) && !hasFrozenPage(comparisonPage)) {
        // page was successfully freeze-dried, while comparisonPage was not.
        return true
    }
    return false
}

export default async function tryDedupePage({ page, samePageCandidates }) {
    if (samePageCandidates.length === 0) {
        return { page }
    }

    // For simplicity, only try the most recent candidate.
    const candidatePage = maxBy(doc => getTimestamp(doc))(samePageCandidates)

    // Measure how similar they are.
    const sameness = determinePageSameness(page, candidatePage)

    // Choose the action to take.
    if (
        sameness >= Sameness.EXACTLY &&
        !candidatePage.protected &&
        // Even if they seem to represent the same content, ensure we don't delete a better copy.
        !hasHigherFidelity(candidatePage, page)
    ) {
        // Forget the old page's contents. Replace them with a link to the new
        // page.
        await replaceWithRedirect({
            oldPage: candidatePage,
            newPage: page,
            sameness,
        })
    } else {
        // Do nothing, leave as duplicate. We do create a link for information
        // if they are similar enough.
        if (sameness >= Sameness.PARTLY) {
            await addLink({
                sourceId: candidatePage._id,
                targetId: page._id,
                linkType: samenessLinkType({ sameness }),
            })
        }
    }
    // Same page is returned.
    return { page }
}
