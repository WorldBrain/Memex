import React, {
    PureComponent,
    ReactEventHandler,
    KeyboardEventHandler,
} from 'react'
import { Link } from 'react-router'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import cx from 'classnames'

import { OutLink } from '../../../common-ui/containers'
import InboxButton from '../../../notifications/components/InboxButton'
import BackupStatus from '../../../notifications/components/BackupStatusContainer'
import { OVERVIEW_URL } from '../../../constants'
import SearchFilters from 'src/search-filters'

const styles = require('./Header.css')

export interface Props {
    searchPlaceholder?: string
    settingsIconUrl?: string
    settingsRoute?: string
    overviewUrl?: string
    pricingUrl?: string
    automaticBackupEnalbled?: boolean
    checkedIcon: string
    crossIcon: string
    query: string
    isSearchDisabled: boolean
    showUnreadCount: boolean
    showInbox: boolean
    unreadNotifCount: number
    startDate: number
    endDate: number
    showFilterBar: boolean
    showClearFiltersBtn: boolean
    onQueryKeyDown: KeyboardEventHandler<HTMLInputElement>
    onQueryChange: ReactEventHandler<HTMLInputElement>
    onStartDateChange: (date: number) => void
    onEndDateChange: (date: number) => void
    toggleInbox: () => void
    changeTooltip: () => void
    toggleFilterBar: () => void
    clearFilters: () => void
}

class Header extends PureComponent<Props> {
    static defaultProps = {
        searchPlaceholder: 'Search keywords and/or use # to filter by tag',
        pricingUrl: 'https://worldbrain.io/pricing',
        settingsIconUrl: '/img/settings.svg',
        checkedIcon: 'img/checked_green.svg',
        crossIcon: 'img/cross.svg',
        settingsRoute: '/settings',
        automaticBackupEnabled: localStorage.getItem('backup.has-subscription'),
        overviewUrl: OVERVIEW_URL,
    }

    private inputQueryEl: HTMLInputElement

    private setInputRef = (el: HTMLInputElement) => (this.inputQueryEl = el)

    componentDidMount() {
        this.inputQueryEl.focus()
    }

    render() {
        return (
            <React.Fragment>
                <div className={styles.navbar}>
                    <div/>
                    <div className={styles.container}>
                        <div className={styles.searchField}>
                            <input
                                id="query-search-bar"
                                className={styles.query}
                                onChange={this.props.onQueryChange}
                                placeholder={this.props.searchPlaceholder}
                                value={this.props.query}
                                ref={this.setInputRef}
                                onKeyDown={this.props.onQueryKeyDown}
                                disabled={this.props.isSearchDisabled}
                                autoComplete="off"
                            />
                        </div>
                        <button
                            className={cx(styles.button, {
                                [styles.activeButton]: this.props.showClearFiltersBtn,
                            })}
                            onClick={this.props.toggleFilterBar}
                        >
                            Filters
                            {this.props.showClearFiltersBtn && (
                                <ButtonTooltip
                                    tooltipText="Clear all Filters"
                                    position="bottom"
                                >
                                    <span
                                        className={styles.clearFilters}
                                        onClick={this.props.clearFilters}
                                    />
                                </ButtonTooltip>
                            )}
                        </button>
                    </div>
                    <div className={styles.links}>
                        <BackupStatus className={styles.backupStatus} />
                        {!this.props.automaticBackupEnalbled && (
                            <OutLink
                                className={styles.upgrade}
                                to={this.props.pricingUrl}
                            >
                                <span className={styles.upgradeIcon} />
                                ⭐️ Upgrade
                            </OutLink>
                        )}
                        <InboxButton
                            toggleInbox={this.props.toggleInbox}
                            showInbox={this.props.showInbox}
                            unreadNotifCount={this.props.unreadNotifCount}
                            showUnreadCount={this.props.showUnreadCount}
                        />
                        <Link to={this.props.settingsRoute}>
                            <span
                                title="Settings"
                                className={styles.settingsIcon}
                            />
                        </Link>
                    </div>
                </div>
                {this.props.showFilterBar && <SearchFilters />}
            </React.Fragment>
        )
    }
}

export default Header
