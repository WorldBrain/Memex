import React from 'react'

import { makeRangeTransform, makeNonlinearTransform } from '../../util/make-range-transform'
import niceTime from '../../util/nice-time'
import VisitAsListItem from './VisitAsListItem'


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

const ResultList = ({searchResult}) => (
    <ul className="ResultList">
        {searchResult.rows.map((row, rowIndex) => {

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
            const timestampComponent = showTimestamp
                ? <time
                    className="timestamp"
                    dateTime={new Date(timestamp)}
                    style={{
                        height: timestampHeight,
                        fontSize: timestampHeight,
                    }}
                >
                    {niceTime(timestamp)}
                </time>
                : null

            return <li
                key={row.doc._id}
                style={{
                    marginTop: spaceGap - timestampHeight,
                }}
            >
                {timestampComponent}
                <VisitAsListItem
                    doc={row.doc}
                />
            </li>
        })}
    </ul>
)

export default ResultList
