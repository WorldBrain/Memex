import React from 'react'
import PropTypes from 'prop-types'
import Waypoint from 'react-waypoint'

import VisitAsListItem from './VisitAsListItem'
import { LoadingIndicator } from 'src/common-ui/components'
import styles from './ResultList.css'


const ResultList = ({
    searchResult,
    searchQuery,
    isLoading,
    onBottomReached,
    resultsExhausted,
}) => {
    // If there are no results, show a message.
    if (searchResult.length === 0 && !isLoading) {
        return (
            <p className={styles.noResultMessage}>
                No results
            </p>
        )
    }

    const listItems = searchResult.map(({ latestResult: row }) => (
        <li key={row.doc._id}>
            <VisitAsListItem
                compact={row.isContextualResult}
                doc={row.doc}
            />
        </li>
    ))

    // Insert waypoint at the end of results to trigger loading new items when scrolling down
    if (!isLoading && !resultsExhausted) {
        const waypoint = <Waypoint onEnter={onBottomReached} key='waypoint' />
        listItems.push(waypoint)
    }

    return (
        <ul className={styles.root}>
            {listItems}
            {isLoading && <LoadingIndicator />}
        </ul>
    )
}

ResultList.propTypes = {
    searchResult: PropTypes.arrayOf(PropTypes.shape({
        latestResult: PropTypes.object.isRequired,
        rest: PropTypes.arrayOf(PropTypes.object).isRequired,
    })).isRequired,
    searchQuery: PropTypes.string,
    isLoading: PropTypes.bool,
    resultsExhausted: PropTypes.bool,
    onBottomReached: PropTypes.func,
}

export default ResultList
