import React, {
    PureComponent,
    ReactEventHandler,
    KeyboardEventHandler,
} from 'react'
import { Link } from 'react-router'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import cx from 'classnames'

import InboxButton from 'src/notifications/components/InboxButton'
import BackupStatus from 'src/backup-restore/ui/backup-status-bar/BackupStatusBarContainer'
import { OVERVIEW_URL } from 'src/constants'
import BackToSearch from 'src/overview/sidebar-left/components/BackToSearch'
import SearchFilters from 'src/search-filters'

const styles = require('./Header.css')

export interface Props {
    searchPlaceholder?: string
    settingsIconUrl?: string
    settingsRoute?: string
    overviewUrl?: string
    pricingUrl?: string
    checkedIcon: string
    crossIcon: string
    query: string
    isSearchDisabled: boolean
    showUnreadCount: boolean
    showInbox: boolean
    unreadNotifCount: number
    showFilterBar: boolean
    showClearFiltersBtn: boolean
    onQueryKeyDown: KeyboardEventHandler<HTMLInputElement>
    onQueryChange: ReactEventHandler<HTMLInputElement>
    toggleInbox: () => void
    toggleFilterBar: () => void
    clearFilters: React.MouseEventHandler<HTMLSpanElement>
}

class Header extends PureComponent<Props> {
    static defaultProps = {
        searchPlaceholder: 'Search keywords and/or use # to filter by tag',
        pricingUrl: 'https://worldbrain.io/pricing',
        settingsIconUrl: '/img/settings.svg',
        checkedIcon: 'img/checked_green.svg',
        crossIcon: 'img/cross.svg',
        settingsRoute: '/settings',
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
                    <div className={styles.collectionsPlaceholder} />
                    <div
                        className={cx(styles.backtosearch, {
                            [styles.hideContainer]: !this.props.showInbox,
                        })}
                    >
                        {this.props.showInbox && <BackToSearch />}
                    </div>
                    <div
                        className={cx(styles.container, {
                            [styles.hideContainer]: this.props.showInbox,
                        })}
                    >
                        <div className={styles.searchField}>
                            <span className={styles.searchIconContainer}>
                                <img
                                    src="/img/search.svg"
                                    className={styles.searchIconImg}
                                />
                            </span>
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
                        <div
                            className={cx(styles.button, {
                                [styles.activeButton]: this.props
                                    .showClearFiltersBtn,
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
                        </div>
                    </div>
                    <div className={styles.links}>
                        <BackupStatus />
                        {/*<InboxButton
                            toggleInbox={this.props.toggleInbox}
                            showInbox={this.props.showInbox}
                            unreadNotifCount={this.props.unreadNotifCount}
                            showUnreadCount={this.props.showUnreadCount}
                        />*/}
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
