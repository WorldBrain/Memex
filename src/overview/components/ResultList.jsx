import React from 'react'
import PropTypes from 'prop-types'
import Waypoint from 'react-waypoint'
import classNames from 'classnames'

import { makeNonlinearTransform } from 'src/util/make-range-transform'
import { niceDate } from 'src/util/nice-time'

import VisitAsListItem from './VisitAsListItem'
import LoadingIndicator from './LoadingIndicator'
import styles from './ResultList.css'


// Draw a line between gaps of at most 20 minutes.
const maxBridgableTimeGap = 1000 * 60 * 20

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
        let showConnection = false
        if (timestamp && prevTimestamp) {
            const timeGap = prevTimestamp - timestamp

            spaceGap = timeGapToSpaceGap(timeGap)

            if (prevRow && (timeGap < maxBridgableTimeGap)) {
                showConnection = true
            }
        }

        // On the day boundaries, we show the date.
        const dateString = niceDate(timestamp)
        const prevDateString = niceDate(prevTimestamp)
        const showDate = (dateString !== prevDateString)
        const timestampComponent = showDate && (
            <time
                className={styles.timestamp}
                dateTime={new Date(timestamp)}
                style={{
                    height: 16,
                    fontSize: 16,
                }}
            >
                {dateString}
            </time>
        )

        return {marginTop: spaceGap, showConnection, timestampComponent}
    })
}

const ResultList = ({
    searchResult,
    searchQuery,
    waitingForResults,
    onBottomReached,
}) => {
    // If there are no results, show a message.
    const noResultMessage = 'no results'
    if (searchResult.rows.length === 0
        && searchQuery !== ''
        && !waitingForResults
    ) {
        return (
            <p className={styles.noResultMessage}>
                {noResultMessage}
            </p>
        )
    }

    const rowGaps = computeRowGaps({searchResult})

    const listItems = searchResult.rows.map((row, rowIndex) => {
        const { marginTop, showConnection, timestampComponent } = rowGaps[rowIndex]

        return (
            <li
                key={row.doc._id}
                style={{
                    marginTop,
                }}
                className={classNames({
                    [styles.showConnection]: showConnection,
                })}
            >
                <div>
                    {timestampComponent}
                    <VisitAsListItem
                        compact={row.isContextualResult}
                        doc={row.doc}
                    />
                </div>
            </li>
        )
    })

    // Insert waypoint to trigger loading new items when scrolling down.
    if (!waitingForResults && !searchResult.resultsExhausted) {
        const waypoint = <Waypoint onEnter={onBottomReached} key='waypoint' />
        // Put the waypoint a bit before the bottom, except if the list is short.
        const waypointPosition = Math.max(Math.min(5, listItems.length), listItems.length - 5)
        listItems.splice(waypointPosition, 0, waypoint)
    }

    return (
        <ul className={styles.root}>
            {listItems}
            {waitingForResults && <LoadingIndicator />}
        </ul>
    )
}

ResultList.propTypes = {
    searchResult: PropTypes.object,
    searchQuery: PropTypes.string,
    waitingForResults: PropTypes.bool,
    onBottomReached: PropTypes.func,
}

export default ResultList
