import get from 'lodash/fp/get'
import DiffMatchPatch from 'diff-match-patch'

export const Sameness = {
    EXACTLY: 5, // Perfect match, containing exactly the same data.
    OSTENSIBLY: 4, // Semantically the same, differing only in e.g. whitespace.
    MOSTLY: 3, // Only minor visible edits, e.g. some typo corrections.
    PARTLY: 2, // Some content changed, e.g. parts were added or (re)moved.
    HARDLY: 1, // Whole page seems newly created, but with similar purpose.
    UNRELATED: 0, // Completely different topic, e.g. domain was transferred.
    UNKNOWN: NaN, // Not enough information to make a comparison.
}

// Get a rough similarity metric between strings (a number between 0 and 1).
function stringSimilarity(text1, text2) {
    const dmp = new DiffMatchPatch()
    dmp.Diff_Timeout = 0.1
    const diff = dmp.diff_main(text1, text2)
    dmp.diff_cleanupSemantic(diff)
    const distance = dmp.diff_levenshtein(diff)
    const maxDistance = Math.max(text1.length, text2.length)
    const similarity = 1 - distance / maxDistance
    return similarity
}

// Tell how similar two strings are in a qualitative way.
function textSameness(text1, text2) {
    if (!text1 || !text2) {
        return Sameness.UNKNOWN
    }

    if (text1 === text2) {
        return Sameness.EXACTLY
    }

    const normaliseWhitespace = s => s.trim().replace(/s+/g, ' ')
    if (normaliseWhitespace(text1) === normaliseWhitespace(text2)) {
        return Sameness.OSTENSIBLY
    }

    const textSimilarity = stringSimilarity(text1, text2)

    if (textSimilarity > 0.9) {
        return Sameness.MOSTLY
    }

    if (textSimilarity > 0.7) {
        return Sameness.PARTLY
    }

    if (textSimilarity > 0.5) {
        return Sameness.HARDLY
    }

    return Sameness.UNRELATED
}

// Tell to which degree two versions of a page can be considered to be the same.
export default function determinePageSameness(page1, page2) {
    const pages = [page1, page2]

    // We start from the maximum score, and lower it when we discover differences.
    let score = Sameness.EXACTLY

    // First a quick check for exact equality of the stored 'freeze-dried' pages.
    const hashes = pages.map(
        get(['_attachments', 'frozen-page.html', 'digest']),
    )
    if (hashes.every(hash => hash === hashes[0])) {
        if (hashes[0] !== undefined) {
            // If the stored pages are exactly the same, no need to compare their contents.
            return Sameness.EXACTLY
        } else {
            // If neither page was freeze-dried, we ignore just this test and compare the content.
        }
    } else {
        // The stored pages differ to some unknown extent. We go on to compare the content, but
        // we lower the maximum possible score so we cannot return EXACTLY.
        score = Sameness.OSTENSIBLY
    }

    // Compare extracted content, and return the lowest score among them.
    const fieldsToCompare = {
        'content.title': textSameness,
        'content.fullText': textSameness,
    }
    for (const field in fieldsToCompare) {
        const compare = fieldsToCompare[field]
        const fieldSameness = compare(...pages.map(get(field)))
        score = Math.min(score, fieldSameness)
    }

    return score
}
