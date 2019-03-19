import React, {
    PureComponent,
    ReactEventHandler,
    KeyboardEventHandler,
} from 'react'
import { Link } from 'react-router'

import { OutLink } from '../../../common-ui/containers'
import InboxButton from '../../../notifications/components/InboxButton'
import { OVERVIEW_URL } from '../../../constants'
import DateRangeSelection from './DateRangeSelection'

const styles = require('./Header.css')

export interface Props {
    searchPlaceholder?: string
    settingsIconUrl?: string
    settingsRoute?: string
    overviewUrl?: string
    pricingUrl?: string
    query: string
    isSearchDisabled: boolean
    showUnreadCount: boolean
    showInbox: boolean
    unreadNotifCount: number
    startDate: number
    endDate: number
    onQueryKeyDown: KeyboardEventHandler<HTMLInputElement>
    onQueryChange: ReactEventHandler<HTMLInputElement>
    onStartDateChange: (date: number) => void
    onEndDateChange: (date: number) => void
    toggleInbox: () => void
    changeTooltip: () => void
}

class Header extends PureComponent<Props> {
    static defaultProps = {
        searchPlaceholder: 'Search keywords and/or use # to filter by tag',
        pricingUrl: 'https://worldbrain.io/pricing',
        settingsIconUrl: '/img/settings.svg',
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
            <div className={styles.navbar}>
                <a href={this.props.overviewUrl}>
                    <div className={styles.logo} />
                </a>
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
                        <DateRangeSelection
                            startDate={this.props.startDate}
                            endDate={this.props.endDate}
                            onStartDateChange={this.props.onStartDateChange}
                            onEndDateChange={this.props.onEndDateChange}
                            disabled={this.props.isSearchDisabled}
                            changeTooltip={this.props.changeTooltip}
                        />
                    </div>
                </div>
                <div className={styles.links}>
                    <OutLink
                        className={styles.upgrade}
                        to={this.props.pricingUrl}
                    >
                        <span
                            className={styles.upgradeIcon}
                        />
                        ⭐️ Upgrade
                    </OutLink>
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
        )
    }
}

export default Header
