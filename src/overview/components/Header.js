import React from 'react'
import PropTypes from 'prop-types'

import DateRangeSelection from './DateRangeSelection'
import styles from './Overview.css'

const Header = ({
    currentQueryParams: { query, startDate, endDate },
    ...props
}) => (
    <div className={styles.navbar}>
        <div className={styles.logo} />
        <div className={styles.container}>
            <div className={styles.searchField}>
                <input
                    className={styles.query}
                    onChange={props.onInputChange}
                    placeholder="Search your memory; use # to filter by tag"
                    value={query}
                    ref={props.setInputRef}
                />
                <DateRangeSelection
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={props.onStartDateChange}
                    onEndDateChange={props.onEndDateChange}
                />
            </div>
            <div
                className={styles.linkFilter}
                onClick={props.onShowFilterChange}
            >
                <img
                    src="/img/filter.png"
                    className={styles.iconFilter}
                    title="Click to view filters"
                />
            </div>
        </div>
        <div className={styles.links}>
            <a href="/options/options.html">
                <img src="/img/settings-icon.png" className={styles.icon} />
            </a>
        </div>
    </div>
)

Header.propTypes = {
    currentQueryParams: PropTypes.shape({
        query: PropTypes.string,
        startDate: PropTypes.number,
        endDate: PropTypes.number,
    }).isRequired,
    setInputRef: PropTypes.func.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onStartDateChange: PropTypes.func.isRequired,
    onEndDateChange: PropTypes.func.isRequired,
    onShowFilterChange: PropTypes.func.isRequired,
}

export default Header
