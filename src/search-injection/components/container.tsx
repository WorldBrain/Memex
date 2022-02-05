import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { remoteFunction, runInBackground } from 'src/util/webextensionRPC'
import Results from './Results'
import strictUriEncode from 'strict-uri-encode'
import ResultItem from './ResultItem'
import RemovedText from './RemovedText'
import * as constants from '../constants'
import { getLocalStorage } from '../utils'
import Notification from './Notification'
import { UPDATE_NOTIFS } from '../../notifications/notifications'
import * as actionTypes from '../../notifications/action-types'
import { actionRegistry } from '../../notifications/registry'
import ActionButton from '../../notifications/components/ActionButton'
import OptIn from '../../notifications/components/OptIn'
import ToggleSwitch from '../../common-ui/components/ToggleSwitch'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import type { SearchEngineName, ResultItemProps } from '../types'
import PioneerPlanBanner from 'src/common-ui/components/pioneer-plan-banner'
import CloudUpgradeBanner from 'src/personal-cloud/ui/components/cloud-upgrade-banner'
import { STORAGE_KEYS as CLOUD_STORAGE_KEYS } from 'src/personal-cloud/constants'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import { OVERVIEW_URL } from 'src/constants'
import { sleepPromise } from 'src/util/promises'

export interface Props {
    // results: ResultItemProps[]
    // len: number
    rerender: () => void
    searchEngine: SearchEngineName
    syncSettings: SyncSettingsStore<'dashboard' | 'searchInjection'>
    query
    requestSearcher
    position
}

interface State {
    isCloudUpgradeBannerShown: boolean
    isSubscriptionBannerShown: boolean
    hideResults: boolean
    dropdown: boolean
    removed: boolean
    isNotif: boolean
    position: null | 'side' | 'above'
    notification: any
    searchResults: ResultItemProps[]
}

class Container extends React.Component<Props, State> {
    trackEvent: any
    readNotification: any
    fetchNotifById: any
    processEvent: any
    openOverviewRPC: any
    syncSettings: Props['syncSettings']

    constructor(props: Props) {
        super(props)
        this.renderResultItems = this.renderResultItems.bind(this)
        this.seeMoreResults = this.seeMoreResults.bind(this)
        this.toggleHideResults = this.toggleHideResults.bind(this)
        this.toggleDropdown = this.toggleDropdown.bind(this)
        this.closeDropdown = this.closeDropdown.bind(this)
        this.removeResults = this.removeResults.bind(this)
        this.undoRemove = this.undoRemove.bind(this)
        this.changePosition = this.changePosition.bind(this)
        this.handleClickTick = this.handleClickTick.bind(this)
        this.trackEvent = remoteFunction('trackEvent')
        this.readNotification = remoteFunction('readNotification')
        this.fetchNotifById = remoteFunction('fetchNotifById')
        this.processEvent = remoteFunction('processEvent')
        this.openOverviewRPC = remoteFunction('openOverviewTab')
        this.syncSettings = props.syncSettings
    }

    state: State = {
        isCloudUpgradeBannerShown: false,
        isSubscriptionBannerShown: false,
        hideResults: true,
        dropdown: false,
        removed: false,
        position: null,
        isNotif: true,
        notification: {},
        searchResults: [],
    }

    async componentDidMount() {
        let notification
        for (const notif of UPDATE_NOTIFS) {
            if (notif.search) {
                notification = {
                    ...notif.search,
                    id: notif.id,
                }
            }
        }

        const hideResults =
            (await this.props.syncSettings.searchInjection.get(
                'hideMemexResults',
            )) ?? false
        const position =
            (await this.props.syncSettings.searchInjection.get(
                'memexResultsPosition',
            )) ?? 'side'

        const subBannerShownAfter = await this.props.syncSettings.dashboard.get(
            'subscribeBannerShownAfter',
        )
        const isCloudEnabled = await getLocalStorage(CLOUD_STORAGE_KEYS.isSetUp)

        let fetchNotif
        if (notification) {
            fetchNotif = await this.fetchNotifById(notification.id)
        }

        this.setState({
            hideResults,
            position,
            isNotif: fetchNotif && !fetchNotif.readTime,
            notification,
            isCloudUpgradeBannerShown: !isCloudEnabled,
            isSubscriptionBannerShown:
                subBannerShownAfter != null && subBannerShownAfter < Date.now(),
        })

        const limit = constants.LIMIT[this.props.position]
        const query = this.props.query

        const searchRes = await this.props.requestSearcher({
            query,
            limit: limit,
        })
        const searchResDocs = searchRes.docs.slice(0, limit)

        this.setState({
            searchResults: searchResDocs,
        })
    }

    handleResultLinkClick = () =>
        this.processEvent({
            type: EVENT_NAMES.CLICK_RESULT_LINK,
        })

    renderResultItems() {
        const resultItems = this.state.searchResults.map((result, i) => (
            <>
                <ResultItem
                    key={i}
                    onLinkClick={this.handleResultLinkClick}
                    searchEngine={this.props.searchEngine}
                    {...result}
                    displayTime={result.displayTime}
                    url={result.url}
                    title={result.title}
                    tags={result.tags}
                />
            </>
        ))

        return resultItems
    }

    seeMoreResults() {
        // Create a new tab with the query overview URL
        const query = new URL(location.href).searchParams.get('q')
        const finalQuery = strictUriEncode(query)

        this.openOverviewRPC('query=' + finalQuery)
    }

    async toggleHideResults() {
        // Toggles hideResults (minimize) state
        // And also, sets dropdown to false
        const toggled = !this.state.hideResults
        await this.props.syncSettings.searchInjection.set(
            'hideMemexResults',
            toggled,
        )
        this.setState({
            hideResults: toggled,
            dropdown: false,
        })
    }

    toggleDropdown() {
        this.setState((state) => ({
            ...state,
            dropdown: !state.dropdown,
        }))
    }

    closeDropdown() {
        this.setState({
            dropdown: false,
        })
    }

    /**
     * Handles persisting the enabled (removed) state for current search engine, without affecting other
     * search engine preferences.
     *
     * @param {boolean} isEnabled
     */
    async _persistEnabledChange(isEnabled) {
        const prevState =
            (await this.props.syncSettings.searchInjection.get(
                'searchEnginesEnabled',
            )) ?? constants.SEARCH_INJECTION_DEFAULT

        await this.props.syncSettings.searchInjection.set(
            'searchEnginesEnabled',
            {
                ...prevState,
                [this.props.searchEngine]: isEnabled,
            },
        )
    }

    async removeResults() {
        // Sets the search injection key to false
        // And sets removed state to true
        // Triggering the Removed text UI to pop up
        await this._persistEnabledChange(false)

        this.trackEvent({
            category: 'Search integration',
            action: 'Disabled',
            name: 'Content script',
        })

        this.setState({
            removed: true,
            dropdown: false,
        })
    }

    async undoRemove() {
        await this._persistEnabledChange(true)

        this.setState({
            removed: false,
        })
    }

    async changePosition() {
        const currPos = this.state.position
        const newPos = currPos === 'above' ? 'side' : 'above'
        await this.props.syncSettings.searchInjection.set(
            'memexResultsPosition',
            newPos,
        )
        this.props.rerender()
    }

    async handleClickTick() {
        this.processEvent({
            type: EVENT_NAMES.READ_NOTIFICATION_SEARCH_ENGINE,
            details: {
                notificationId: this.state.notification.id,
            },
        })

        await this.readNotification(this.state.notification.id)

        this.setState({
            isNotif: false,
        })
    }

    handleToggleStorageOption(action, value) {
        this.processEvent({
            type: EVENT_NAMES.TOGGLE_STORAGE_SEARCH_ENGINE,
            details: {
                notificationId: this.state.notification.id,
            },
        })

        action = {
            ...action,
            value,
        }

        actionRegistry[action.type]({
            definition: action,
        })
    }

    handleClickOpenNewTabButton(url) {
        this.processEvent({
            type: EVENT_NAMES.CLICK_OPEN_NEW_LINK_BUTTON_SEARCH,
            details: {
                notificationId: this.state.notification.id,
            },
        })

        window.open(url, '_blank').focus()
    }

    async openDashboard() {
        await browser.tabs.create({ url: OVERVIEW_URL })
    }

    private handleSubBannerDismiss: React.MouseEventHandler = async (e) => {
        this.setState({ isSubscriptionBannerShown: false })
        await this.props.syncSettings.dashboard.set(
            'subscribeBannerShownAfter',
            null,
        )
    }

    renderButton() {
        const { buttons } = this.state.notification
        const { action } = buttons[0]

        if (action.type === actionTypes.OPEN_URL) {
            return (
                <ActionButton
                    handleClick={() =>
                        this.handleClickOpenNewTabButton(action.url)
                    }
                    fromSearch
                >
                    {` ${buttons[0].label} `}
                </ActionButton>
            )
        } else if (action.type === actionTypes.TOGGLE_SETTING) {
            return (
                <OptIn fromSearch label={buttons[0].label}>
                    <ToggleSwitch
                        defaultValue
                        onChange={(val) =>
                            this.handleToggleStorageOption(action, val)
                        }
                        fromSearch
                    />
                </OptIn>
            )
        } else {
            return (
                <ActionButton
                    handleClick={actionRegistry[action.type]({
                        definition: action,
                    })}
                >
                    {` ${buttons[0].label} `}
                </ActionButton>
            )
        }
    }

    renderNotification() {
        const { isNotif } = this.state

        if (!isNotif || !this.state.notification.id) {
            return null
        }

        return (
            <Notification
                title={this.state.notification.title}
                message={this.state.notification.message}
                button={this.renderButton()}
                handleTick={this.handleClickTick}
            />
        )
    }

    render() {
        // If the state.removed is true, show the RemovedText component
        if (this.state.removed) {
            return (
                <RemovedText
                    undo={this.undoRemove}
                    position={this.state.position}
                />
            )
        }

        if (!this.state.position) {
            return null
        }

        return (
            <>
                {this.state.isCloudUpgradeBannerShown && (
                    <CloudUpgradeBanner
                        onGetStartedClick={() => this.openOverviewRPC()}
                        direction="column"
                        width={this.state.position === 'side' && '420px'}
                    />
                )}
                {/* {this.state.isSubscriptionBannerShown && (
                    <PioneerPlanBanner
                        onHideClick={this.handleSubBannerDismiss}
                        direction="column"
                        showCloseButton={true}
                    />
                )} */}
                <Results
                    position={this.state.position}
                    searchEngine={this.props.searchEngine}
                    totalCount={this.state.searchResults.length}
                    seeMoreResults={this.seeMoreResults}
                    toggleHideResults={this.toggleHideResults}
                    hideResults={this.state.hideResults}
                    toggleDropdown={this.toggleDropdown}
                    closeDropdown={this.closeDropdown}
                    dropdown={this.state.dropdown}
                    removeResults={this.removeResults}
                    changePosition={this.changePosition}
                    renderResultItems={this.renderResultItems}
                    renderNotification={this.renderNotification()}
                />
            </>
        )
    }
}

export default Container
