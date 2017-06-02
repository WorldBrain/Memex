import React from 'react'
import PropTypes from 'prop-types'
import Waypoint from 'react-waypoint'

import { makeNonlinearTransform } from 'src/util/make-range-transform'
import niceTime from 'src/util/nice-time'
import VisitAsListItem from './VisitAsListItem'
import LoadingIndicator from './LoadingIndicator'

import styles from './ResultList.css'


// Map a time duration between log entries to a number of pixels between them.
const timeGapToSpaceGap = makeNonlinearTransform({
    // A gap of <5 mins gets no extra space, a >24 hours gap gets the maximum space.
    domain: [1000 * 60 * 5, 1000 * 60 * 60 * 24],
    // Minimum and maximum added space, in pixels.
    range: [0, 100],
    // Clamp excessive values to stay within the output range.
    clampOutput: true,
    // Use a logarithm to squeeze the larger numbers.
    nonlinearity: Math.log,
})

function computeRowGaps({searchResult}) {
    // The space and possibly a time stamp before each row
    return searchResult.rows.map((row, rowIndex) => {
        // Space between two rows depends on the time between them.
        const prevRow = searchResult.rows[rowIndex - 1]
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
        const marginTop = spaceGap - timestampHeight
        const timestampComponent = showTimestamp && (
            <time
                className={styles.timestamp}
                dateTime={new Date(timestamp)}
                style={{
                    height: timestampHeight,
                    fontSize: timestampHeight,
                }}
            >
                {niceTime(timestamp)}
            </time>
        )
        return {marginTop, timestampComponent}
    })
}

/**
 * Handles rendering view for infinite scroll waypoint component. Simply switches between
 * loading comp and waypoint comp to trigger infinite scroll event logic.
 */
const InfScrollWaypoint = ({isMoreLoading, handlePagination}) => isMoreLoading
    ? <LoadingIndicator />
    : <Waypoint onEnter={handlePagination} />

InfScrollWaypoint.propTypes = {
    isMoreLoading: PropTypes.bool.isRequired,
    handlePagination: PropTypes.func.isRequired,
}

const ResultList = ({searchResult, searchQuery, isFiltered, ...waypointProps}) => {
    // If there are no results, show a message.
    const noResultMessage = 'no results'
    if (searchResult.rows.length === 0 && searchQuery !== '') {
        return (
            <p className={styles.noResultMessage}>
                {noResultMessage}
            </p>
        )
    }

    const rowGaps = computeRowGaps({searchResult})

    return (
        <ul className={styles.root}>
            {searchResult.rows.map((row, rowIndex) => {
                const { marginTop, timestampComponent } = rowGaps[rowIndex]

                return (
                    <li
                        key={row.doc._id}
                        style={{
                            marginTop,
                        }}
                    >
                        {timestampComponent}
                        <VisitAsListItem
                            compact={row.isContextualResult}
                            doc={row.doc}
                        />
                    </li>
                )
            })}
            {!isFiltered && <InfScrollWaypoint {...waypointProps} />}
        </ul>
    )
}

ResultList.propTypes = {
    searchResult: PropTypes.object,
    searchQuery: PropTypes.string,
    isFiltered: PropTypes.bool.isRequired,
}

export default ResultList
