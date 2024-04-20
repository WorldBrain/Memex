import React from 'react'
import browser from 'webextension-polyfill'
import { remoteFunction } from 'src/util/webextensionRPC'
import Results from './Results'
import strictUriEncode from 'strict-uri-encode'
import ResultItem from './ResultItem'
import RemovedText from './RemovedText'
import * as constants from '../constants'
import { getLocalStorage } from '../utils'
import Notification from './Notification'
import { UPDATE_NOTIFS } from '../../notifications/notifications'
import * as actionTypes from '../../notifications/action-types'
import ActionButton from '../../notifications/components/ActionButton'
import OptIn from '../../notifications/components/OptIn'
import ToggleSwitch from '../../common-ui/components/ToggleSwitch'
import type { SearchEngineName, ResultItemProps } from '../types'
import CloudUpgradeBanner from 'src/personal-cloud/ui/components/cloud-upgrade-banner'
import { STORAGE_KEYS as CLOUD_STORAGE_KEYS } from 'src/personal-cloud/constants'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import { OVERVIEW_URL } from 'src/constants'
import { sleepPromise } from 'src/util/promises'
import styled from 'styled-components'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

const search = browser.runtime.getURL('/img/search.svg')

export interface Props {
    // results: ResultItemProps[]
    // len: number
    rerender: () => void
    searchEngine: SearchEngineName
    syncSettings: SyncSettingsStore<'dashboard' | 'searchInjection'>
    getRootElement: () => HTMLElement
    searchResDocs: ResultItemProps[]
    updateQuery: (query: string) => Promise<void>
    query: string
    openSettings: () => void
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
    isStickyContainer: boolean
}

class Container extends React.Component<Props, State> {
    readNotification: any
    fetchNotifById: any
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
        this.readNotification = remoteFunction('readNotification')
        this.fetchNotifById = remoteFunction('fetchNotifById')
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
        isStickyContainer: true,
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

        let isSticky = null

        isSticky = await this.props.syncSettings.searchInjection.get(
            'stickyContainerEnabled',
        )

        if (isSticky == null) {
            await this.props.syncSettings.searchInjection.set(
                'stickyContainerEnabled',
                false,
            )
            isSticky = false
        }

        let fetchNotif
        if (notification) {
            fetchNotif = await this.fetchNotifById(notification.id)
        }

        const hideResults =
            (await this.props.syncSettings.searchInjection.get(
                'hideMemexResults',
            )) ?? false
        const position =
            (await this.props.syncSettings.searchInjection.get(
                'memexResultsPosition',
            )) ?? 'side'

        this.setState({
            hideResults,
            position,
            isNotif: fetchNotif && !fetchNotif.readTime,
            notification,
            isStickyContainer: isSticky,
        })

        const target = document.getElementById(
            constants.REACT_ROOTS.searchEngineInjection,
        )

        if (isSticky) {
            target.style.position = 'sticky'
            target.style.top = '100px'
            target.style.zIndex = '100'
        } else {
            target.style.position = 'relative'
            target.style.top = 'unset'
            target.style.zIndex = 'unset'
        }
    }

    toggleStickyContainer = async (isSticky) => {
        this.setState({ isStickyContainer: isSticky })
        await this.props.syncSettings.searchInjection.set(
            'stickyContainerEnabled',
            isSticky,
        )

        const target = document.getElementById(
            constants.REACT_ROOTS.searchEngineInjection,
        )

        if (isSticky) {
            target.style.position = 'sticky'
            target.style.top = '100px'
            target.style.zIndex = '100'
        } else {
            target.style.position = 'relative'
            target.style.top = 'unset'
            target.style.zIndex = 'initial'
        }
    }

    handleResultLinkClick = () => {}

    renderResultItems() {
        if (this.props.searchResDocs == null) {
            return (
                <LoadingBox>
                    <LoadingIndicator />
                </LoadingBox>
            )
        } else if (this.props.searchResDocs.length > 0) {
            const resultItems = this.props.searchResDocs.map((result, i) => (
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
        } else if (this.props.searchResDocs.length === 0) {
            return (
                <NoResultsSection>
                    <IconBox heightAndWidth="30px" background="light">
                        <Icon
                            filePath={search}
                            heightAndWidth="20px"
                            color="prime1"
                            hoverOff
                        />
                    </IconBox>
                    <SectionTitle>No Results for this Query</SectionTitle>
                    <InfoText>
                        For more flexible search,
                        <SearchLink onClick={this.seeMoreResults}>
                            {' '}
                            go to the dashboard
                        </SearchLink>
                    </InfoText>
                </NoResultsSection>
            )
        }
    }

    seeMoreResults() {
        // Create a new tab with the query overview URL
        const query = new URL(location.href).searchParams.get('q')
        const finalQuery = strictUriEncode(query)

        this.openOverviewRPC('query=' + finalQuery)
    }

    async toggleHideResults(toggleState) {
        // Toggles hideResults (minimize) state
        // And also, sets dropdown to false
        const toggled = toggleState
        await this.props.syncSettings.searchInjection.set(
            'hideMemexResults',
            toggleState,
        )
        this.setState({
            hideResults: toggleState,
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
        await this.readNotification(this.state.notification.id)

        this.setState({
            isNotif: false,
        })
    }

    handleClickOpenNewTabButton(url) {
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
                        onChange={(val) => {}}
                        fromSearch
                    />
                </OptIn>
            )
        } else {
            return null
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
            return <RemovedText undo={this.undoRemove} />
        }

        if (!this.state.position) {
            return null
        }

        return (
            <>
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
                    totalCount={this.props.searchResDocs.length}
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
                    getRootElement={this.props.getRootElement}
                    isSticky={this.state.isStickyContainer}
                    toggleStickyContainer={this.toggleStickyContainer}
                    updateQuery={this.props.updateQuery}
                    query={this.props.query}
                    openSettings={this.props.openSettings}
                />
            </>
        )
    }
}

const SearchLink = styled.span`
    padding-left: 2px;
    cursor: pointer;
    color: ${(props) => props.theme.colors.prime1};
`

const NoResultsSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 30px 0px;
`
const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
    margin-top: 15px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 400;
    text-align: center;
`

const LoadingBox = styled.div`
    border-radius: 3px;
    margin-bottom: 30px;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
`

export default Container
