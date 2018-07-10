import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import classNames from 'classnames'

import { OutLink } from 'src/common-ui/containers'
import DateRangeSelection from './DateRangeSelection'
import styles from './Overview.css'

const showInboxClass = ({ showInbox }) =>
    classNames({
        [styles.inbox]: true,
        [styles.activeInbox]: showInbox,
    })

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
            <div className={showInboxClass(props)} onClick={props.toggleInbox}>
                Inbox
                {props.unreadNotifCount !== 0 && (
                    <span className={styles.inboxCount}>
                        {props.unreadNotifCount}
                    </span>
                )}
            </div>
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
}

export default Header
