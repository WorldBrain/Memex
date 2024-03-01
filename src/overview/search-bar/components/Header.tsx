import React, {
    PureComponent,
    ReactEventHandler,
    KeyboardEventHandler,
} from 'react'
import { Link } from 'react-router'
import cx from 'classnames'

import { OVERVIEW_URL } from 'src/constants'
import SearchFilters from 'src/search-filters'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

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
                    ></div>
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
                                <TooltipBox
                                    tooltipText="Clear all Filters"
                                    placement="bottom"
                                    getPortalRoot={null}
                                >
                                    <span
                                        className={styles.clearFilters}
                                        onClick={this.props.clearFilters}
                                    />
                                </TooltipBox>
                            )}
                        </div>
                    </div>
                    <div className={styles.links}>
                        {/* <BackupStatus localBackupSettings={} /> */}
                        {/*<InboxButton
                            toggleInbox={this.props.toggleInbox}
                            showInbox={this.props.showInbox}
                            unreadNotifCount={this.props.unreadNotifCount}
                            showUnreadCount={this.props.showUnreadCount}
                        />*/}
                        <Link to={this.props.settingsRoute}>
                            <div className={styles.settingsBox}>
                                <span
                                    title="Settings"
                                    className={styles.settingsIcon}
                                />
                            </div>
                        </Link>
                    </div>
                </div>
                {this.props.showFilterBar && <SearchFilters />}
            </React.Fragment>
        )
    }
}

export default Header
