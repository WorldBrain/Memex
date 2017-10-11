import {
    rule,
    ruleset,
    dom,
    type,
    props,
    score,
    out,
    domSort,
} from 'fathom-web'
import { inlineTextLength, linkDensity } from 'fathom-web/utils'

/**
 * @param {fnode} fnode
 * @return {any} Object containing a `score` key derived from the element's text length
 */
const scoreByLength = ({ element }) => ({
    score: inlineTextLength(element),
})

// Based on: https://hacks.mozilla.org/2017/04/fathom-a-framework-for-understanding-web-pages/
// Meant to be similar to Readability-like extraction of a page's main-content
// Initial tests of this are pretty innaccurate; lots to learn to be able to tweak the rules and use it well
const rules = ruleset(
    rule(
        dom('p,div,li,blockquote,h1,h2,h3,h4,h5,h6'),
        props(scoreByLength).type('paragraphish'),
    ),
    rule(
        type('paragraphish'),
        score(fnode => {
            const paragraphishNote = fnode.noteFor('paragraphish')
            return paragraphishNote
                ? (1 - linkDensity(fnode, paragraphishNote.inlineLength)) * 1.5
                : (1 - linkDensity(fnode)) * 1.5
        }),
    ),
    rule(dom('p'), score(4.5).type('paragraphish')),
    rule(
        type('paragraphish').bestCluster({
            splittingDistance: 3,
            differentDepthCost: 6.5,
            differentTagCost: 2,
            sameTagCost: 0.5,
            strideCost: 0,
        }),
        out('content').allThrough(domSort),
    ),
)

export default rules
