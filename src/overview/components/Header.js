import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

import { OutLink } from 'src/common-ui/containers'
import DateRangeSelection from './DateRangeSelection'
import styles from './Overview.css'
import InboxButton from 'src/notifications/components/InboxButton'

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
                    onKeyDown={props.onQuerySearchKeyDown}
                    disabled={props.isSearchDisabled}
                />
                <DateRangeSelection
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={props.onStartDateChange}
                    onEndDateChange={props.onEndDateChange}
                    disabled={props.isSearchDisabled}
                />
            </div>
        </div>
        <div className={styles.links}>
            <InboxButton
                toggleInbox={props.toggleInbox}
                showInbox={props.showInbox}
                unreadNotifCount={props.unreadNotifCount}
                showUnreadCount={props.showUnreadCount}
            />
            <OutLink
                className={styles.upgrade}
                to="https://worldbrain.io/pricing"
            >
                Upgrade Memex
            </OutLink>
            <Link to="/settings">
                <img src="/img/settings-icon.png" className={styles.icon} />
            </Link>
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
    onQuerySearchKeyDown: PropTypes.func.isRequired,
    isSearchDisabled: PropTypes.bool,
    toggleInbox: PropTypes.func.isRequired,
    showInbox: PropTypes.bool.isRequired,
    unreadNotifCount: PropTypes.number.isRequired,
    showUnreadCount: PropTypes.bool.isRequired,
}

export default Header
