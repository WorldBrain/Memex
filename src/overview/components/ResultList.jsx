import React from 'react'

import { makeRangeTransform, makeNonlinearTransform } from '../../util/make-range-transform'
import niceTime from '../../util/nice-time'
import VisitAsListItem from './VisitAsListItem'

import styles from './ResultList.css'

// import { getDomain } from 'tldjs' // https://github.com/oncletom/tld.js/issues/86
import tldjs from 'tldjs'
const getDomain = tldjs.getDomain.bind(tldjs)

function shouldBeClustered(visit1, visit2) {
    return getDomain(visit1.url) === getDomain(visit2.url)
}

// Map a time duration between log entries to a number of pixels between them.
const timeGapToSpaceGap = makeNonlinearTransform({
    // A gap of <5 mins gets no extra space, a >24 hours gap gets the maximum space.
    domain: [1000*60*5, 1000*60*60*24],
    // Minimum and maximum added space, in pixels.
    range: [0, 100],
    // Clamp excessive values to stay within the output range.
    clampOutput: true,
    // Use a logarithm to squeeze the larger numbers.
    nonlinearity: Math.log,
})

const ResultList = ({searchResult}) => {
    // The space and possibly a time stamp before each row
    const rowGaps = searchResult.rows.map((row, rowIndex) => {
        // Space between two rows depends on the time between them.
        const prevRow = searchResult.rows[rowIndex-1]
        const prevTimestamp = prevRow ? prevRow.doc.visitStart : new Date()
        const timestamp = row.doc.visitStart
        let spaceGap = 0
        if (timestamp) {
            spaceGap = timeGapToSpaceGap(prevTimestamp - timestamp)
        }
        // We add a timestamp if the gap is large (in pixels)
        const showTimestamp = (spaceGap > 40)
        // Height of timestamp.
        const timestampHeight = showTimestamp ? 16 : 0
        let marginTop = spaceGap - timestampHeight
        const timestampComponent = showTimestamp
            ? <time
                className={styles.timestamp}
                dateTime={new Date(timestamp)}
                style={{
                    height: timestampHeight,
                    fontSize: timestampHeight,
                }}
            >
                {niceTime(timestamp)}
            </time>
            : null
        return {marginTop, timestampComponent}
    })

    return <ul className={styles.root}>
        {searchResult.rows.map((row, rowIndex) => {
            let { marginTop, timestampComponent } = rowGaps[rowIndex]

            // Cluster successive & related visits closer together.
            const nextRow = searchResult.rows[rowIndex+1]
            // ...unless there is a gap between the rows.
            const gapBelowThisRow = nextRow && rowGaps[rowIndex+1].marginTop
            const clustered = nextRow && gapBelowThisRow===0
                && shouldBeClustered(row.doc, nextRow.doc)
                && row.isContextualResult === nextRow.isContextualResult

            return <li
                key={row.doc._id}
                style={{
                    marginTop,
                }}
                className={clustered ? styles.clustered : undefined}
            >
                {timestampComponent}
                <VisitAsListItem
                    compact={row.isContextualResult}
                    doc={row.doc}
                />
            </li>
        })}
    </ul>
}

export default ResultList
