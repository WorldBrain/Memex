import React, { Component } from 'react'
import PropTypes from 'prop-types'
import qs from 'query-string'

import analytics, { updateLastActive } from 'src/analytics'
import internalAnalytics from 'src/analytics/internal'
import extractQueryFilters from 'src/util/nlp-time-filter'
import { remoteFunction } from 'src/util/webextensionRPC'
import { isLoggable, getPauseState } from 'src/activity-logger'
import { getTooltipState, setTooltipState } from 'src/content-tooltip/utils'
import {
    IndexDropdown,
    AddListDropdownContainer,
} from 'src/common-ui/containers'
import Popup from './components/Popup'
import Button from './components/Button'
import BlacklistConfirm from './components/BlacklistConfirm'
import HistoryPauser from './components/HistoryPauser'
import LinkButton from './components/LinkButton'
import SplitButton from './components/SplitButton'
import * as constants from './constants'
import UpgradeButton from './components/UpgradeButton'
import ButtonIcon from './components/ButtonIcon'
import ToggleTooltip from './components/ToggleTooltip'
import styles from './components/Button.css'
import unreadNotifications from 'src/util/unread-notifications'

class PopupContainer extends Component {
    static propTypes = {
        pauseValues: PropTypes.arrayOf(PropTypes.number).isRequired,
    }

    static defaultProps = {
        pauseValues: [5, 10, 20, 30, 60, 120, 180, Infinity],
    }

    constructor(props) {
        super(props)

        this.pageLookup = remoteFunction('pageLookup')
        this.fetchBlacklist = remoteFunction('fetchBlacklist')
        this.addToBlacklist = remoteFunction('addToBlacklist')
        this.isURLBlacklisted = remoteFunction('isURLBlacklisted')
        this.toggleLoggingPause = remoteFunction('toggleLoggingPause')
        this.deletePages = remoteFunction('delPages')
        this.deletePagesByDomain = remoteFunction('delPagesByDomain')
        this.removeBookmarkByUrl = remoteFunction('delBookmark')
        this.createBookmarkByUrl = remoteFunction('addBookmark')
        this.listsContainingPage = remoteFunction('fetchListPagesByUrl')
        this.fetchAllLists = remoteFunction('fetchAllLists')
        this.initTagSuggestions = remoteFunction('extendedSuggest')
    }

    state = {
        url: '',
        tabID: null,
        searchValue: '',
        pauseValue: 20,

        // Used to derive button disabled states among other states
        isLoggable: false,
        isBlacklisted: false,
        page: null, // Contains the reverse index doc, if available

        // View switching flags
        blacklistChoice: false,
        blacklistConfirm: false,
        tagMode: false,
        listMode: false,

        // Behaviour switching flags
        domainDelete: false,
        isPaused: false,

        // Tooltip Flag
        isTooltipEnabled: true,

        unreadNotifCount: 0,
    }

    async componentDidMount() {
        const [currentTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        })

        // If we can't get the tab data, then can't init action button states
        if (!currentTab || !currentTab.url) {
            return
        }

        const updateState = newState =>
            this.setState(oldState => ({ ...oldState, ...newState }))
        const noop = f => f // Don't do anything if error; state doesn't change

        updateState({
            url: currentTab.url,
            tabID: currentTab.id,
            isLoggable: isLoggable({ url: currentTab.url }),
        })

        this.insertRibbon = remoteFunction('insertRibbon', {
            tabId: currentTab.id,
        })
        this.removeRibbon = remoteFunction('removeRibbon', {
            tabId: currentTab.id,
        })
        this.openSidebar = remoteFunction('toggleSidebarOverlay', {
            tabId: currentTab.id,
        })

        this.getInitPageData()
            .then(updateState)
            .catch(noop)
        this.getInitPauseState()
            .then(updateState)
            .catch(noop)
        this.getInitBlacklistBtnState()
            .then(updateState)
            .catch(noop)
        this.getInitTooltipState()
            .then(updateState)
            .catch(noop)
        this.getInitNotificationState()
            .then(updateState)
            .catch(noop)
    }

    async getInitNotificationState() {
        const res = await unreadNotifications()
        return { unreadNotifCount: res }
    }

    async getInitTooltipState() {
        const isTooltipEnabled = await getTooltipState()
        return { isTooltipEnabled }
    }

    async getInitPageData() {
        const listsAssocWithPage = await this.listsContainingPage({
            url: this.state.url,
        })
        const page = await this.pageLookup(this.state.url)

        // Get ids of all the lists associated with the page.
        const listIds = listsAssocWithPage.map(({ id }) => id)
        // Get 20 more tags that are not related related to the list.
        const tags = await this.initTagSuggestions(page.tags, 'tag')

        // Get rest 20 lists not associated with the page.
        const lists = await this.fetchAllLists({
            // query: {
            //     id: { $nin: listIds },
            // },
            // opts: { limit: 20 },
            excludeIds: listIds,
            limit: 20,
        })
        return {
            page,
            initListSuggestions: [...listsAssocWithPage, ...lists],
            initTagSuggestions: [...page.tags, ...tags],
            lists: listsAssocWithPage,
        }
    }

    async getInitPauseState() {
        const isPaused = await getPauseState()

        return { isPaused }
    }

    async getInitBlacklistBtnState() {
        const blacklist = await this.fetchBlacklist()

        return {
            isBlacklisted: await this.isURLBlacklisted(
                this.state.url,
                blacklist,
            ),
        }
    }

    get blacklistBtnState() {
        if (this.state.isBlacklisted) {
            return constants.BLACKLIST_BTN_STATE.BLACKLISTED
        }

        return this.state.isLoggable
            ? constants.BLACKLIST_BTN_STATE.UNLISTED
            : constants.BLACKLIST_BTN_STATE.DISABLED
    }

    get isTagBtnDisabled() {
        return !this.state.isLoggable
    }

    get bookmarkBtnState() {
        // Cannot bookmark
        if (!this.state.isLoggable || this.state.isBlacklisted) {
            return constants.BOOKMARK_BTN_STATE.DISABLED
        }

        // Already a bookmark
        if (this.state.page != null && this.state.page.hasBookmark) {
            return constants.BOOKMARK_BTN_STATE.BOOKMARK
        }

        // Not yet bookmarked
        return constants.BOOKMARK_BTN_STATE.UNBOOKMARK
    }

    get pageTags() {
        // No assoc. page indexed, or tagless page
        if (this.state.page == null || this.state.page.tags == null) {
            return []
        }

        return this.state.page.tags
    }

    onBlacklistBtnClick(domainDelete = false) {
        const url = domainDelete
            ? new URL(this.state.url).hostname
            : this.state.url

        return event => {
            event.preventDefault()

            analytics.trackEvent({
                category: 'Popup',
                action: domainDelete ? 'Blacklist domain' : 'Blacklist site',
            })

            internalAnalytics.processEvent({
                type: domainDelete ? 'blacklistDomain' : 'blacklistSite',
            })

            this.addToBlacklist(url)
            this.setState(state => ({
                ...state,
                blacklistChoice: false,
                blacklistConfirm: true,
                isBlacklisted: true,
                url,
                domainDelete,
            }))
        }
    }

    onPauseConfirm = event => {
        event.preventDefault()
        const { isPaused, pauseValue } = this.state

        analytics.trackEvent({
            category: 'Popup',
            action: isPaused ? 'Resume indexing' : 'Pause indexing',
            value: isPaused ? undefined : pauseValue,
        })

        internalAnalytics.processEvent({
            type: isPaused ? 'resumeIndexing' : 'pauseIndexing',
        })

        // Tell background script to do on extension level
        this.toggleLoggingPause(pauseValue)
        updateLastActive() // Consider user active (analytics)

        // Do local level state toggle and reset
        this.setState(state => ({
            ...state,
            isPaused: !isPaused,
            pauseValue: 20,
        }))
    }

    onPauseChange = event => {
        const pauseValue = event.target.value
        this.setState(state => ({ ...state, pauseValue }))
    }

    onSearchChange = event => {
        const searchValue = event.target.value
        this.setState(state => ({ ...state, searchValue }))
    }

    onSearchEnter = event => {
        if (event.key === 'Enter') {
            event.preventDefault()
            analytics.trackEvent({
                category: 'Search',
                action: 'Popup search',
            })

            internalAnalytics.processEvent({
                type: 'searchPopup',
            })

            const queryFilters = extractQueryFilters(this.state.searchValue)
            const queryParams = qs.stringify(queryFilters)

            browser.tabs.create({
                url: `${constants.OVERVIEW_URL}?${queryParams}`,
            }) // New tab with query
            window.close() // Close the popup
        }
    }

    toggleTooltip = async () => {
        const isTooltipEnabled = !this.state.isTooltipEnabled
        await setTooltipState(isTooltipEnabled)

        if (isTooltipEnabled) {
            await this.insertRibbon()
            await this.openSidebar()
            window.close()
        } else {
            this.removeRibbon()
            setTimeout(() => window.close(), 500)
        }

        this.setState({
            isTooltipEnabled,
        })
    }

    // Hides full-popup confirm
    resetBlacklistConfirmState = () =>
        this.setState(state => ({ ...state, blacklistConfirm: false }))

    handleDeleteBlacklistData = () => {
        analytics.trackEvent({
            category: 'Popup',
            action: 'Delete blacklisted pages',
        })

        if (this.state.domainDelete) {
            this.deletePagesByDomain(this.state.url)
        } else {
            this.deletePages([this.state.url])
        }
        this.resetBlacklistConfirmState()
    }

    setBlacklistChoice = () =>
        this.setState(state => ({ ...state, blacklistChoice: true }))

    renderBlacklistButton() {
        if (!this.state.blacklistChoice) {
            // Standard blacklist button
            return this.blacklistBtnState ===
                constants.BLACKLIST_BTN_STATE.BLACKLISTED ? (
                <LinkButton
                    href={`${constants.OPTIONS_URL}#/blacklist`}
                    itemClass={styles.itemBlacklisted}
                    btnClass={styles.itemBtnBlacklisted}
                >
                    This Page is Blacklisted. Undo>>
                </LinkButton>
            ) : (
                <Button
                    onClick={this.setBlacklistChoice}
                    disabled={
                        this.blacklistBtnState ===
                        constants.BLACKLIST_BTN_STATE.DISABLED
                    }
                    btnClass={styles.blacklist}
                >
                    Blacklist Current Page
                </Button>
            )
        }

        // Domain vs URL choice button
        return (
            <SplitButton iconClass={styles.blacklist}>
                <Button onClick={this.onBlacklistBtnClick(true)}>Domain</Button>
                <Button onClick={this.onBlacklistBtnClick(false)}>URL</Button>
            </SplitButton>
        )
    }

    renderPauseChoices() {
        const pauseValueToOption = (val, i) => (
            <option key={i} value={val}>
                {val === Infinity ? '∞' : val}
            </option>
        )

        return this.props.pauseValues.map(pauseValueToOption)
    }

    handleAddBookmark = () => {
        if (this.bookmarkBtnState === constants.BOOKMARK_BTN_STATE.UNBOOKMARK) {
            this.createBookmarkByUrl({
                url: this.state.url,
                tabId: this.state.tabID,
            })
        } else if (
            this.bookmarkBtnState === constants.BOOKMARK_BTN_STATE.BOOKMARK
        ) {
            this.removeBookmarkByUrl({ url: this.state.url })
        }

        updateLastActive() // Consider user active (analytics)
        window.close()
    }

    toggleTagPopup = () =>
        this.setState(state => ({
            ...state,
            tagMode: !state.tagMode,
        }))

    toggleListPopup = () =>
        this.setState(state => ({
            ...state,
            listMode: !state.listMode,
        }))

    renderTagButton() {
        return (
            <Button
                onClick={this.toggleTagPopup}
                disabled={this.isTagBtnDisabled}
                btnClass={styles.tag}
            >
                Add Tag(s)
            </Button>
        )
    }

    renderAddToList = () => (
        <Button
            onClick={this.toggleListPopup}
            disabled={this.isTagBtnDisabled}
            btnClass={styles.addToList}
        >
            Add To Collection(s)
        </Button>
    )

    renderChildren() {
        const {
            blacklistConfirm,
            pauseValue,
            isPaused,
            tagMode,
            listMode,
            unreadNotifCount,
        } = this.state
        if (blacklistConfirm) {
            return (
                <BlacklistConfirm
                    onConfirmClick={this.handleDeleteBlacklistData}
                    onDenyClick={this.resetBlacklistConfirmState}
                />
            )
        }

        if (tagMode) {
            return (
                <IndexDropdown
                    url={this.state.url}
                    tabId={this.state.tabID}
                    initFilters={this.pageTags}
                    initSuggestions={this.state.initTagSuggestions}
                    source="tag"
                />
            )
        }

        if (listMode) {
            return (
                <AddListDropdownContainer
                    mode="popup"
                    results={this.state.lists || []}
                    initSuggestions={this.state.initListSuggestions}
                    url={this.state.url}
                />
            )
        }

        return (
            <div>
                <Button
                    onClick={this.handleAddBookmark}
                    btnClass={
                        this.bookmarkBtnState ===
                        constants.BOOKMARK_BTN_STATE.BOOKMARK
                            ? styles.bmk
                            : styles.notBmk
                    }
                    disabled={
                        this.bookmarkBtnState ===
                        constants.BOOKMARK_BTN_STATE.DISABLED
                    }
                >
                    {this.bookmarkBtnState ===
                    constants.BOOKMARK_BTN_STATE.BOOKMARK
                        ? 'Unbookmark this Page'
                        : 'Bookmark this Page'}
                </Button>
                {this.renderTagButton()}
                {this.renderAddToList()}
                <hr />
                <HistoryPauser
                    onConfirm={this.onPauseConfirm}
                    onChange={this.onPauseChange}
                    value={pauseValue}
                    isPaused={isPaused}
                >
                    {this.renderPauseChoices()}
                </HistoryPauser>
                {this.renderBlacklistButton()}
                <hr />
                <ToggleTooltip
                    isChecked={this.state.isTooltipEnabled}
                    handleChange={this.toggleTooltip}
                />
                <hr />
                <LinkButton
                    btnClass={styles.voteIcon}
                    href="https://worldbrain.io/vote_feature"
                >
                    Vote for Next Features
                </LinkButton>
                <UpgradeButton />
                <ButtonIcon
                    href={`${constants.OPTIONS_URL}#/settings`}
                    icon="settings"
                    buttonType={1}
                    btnClass={styles.settings}
                />
                <ButtonIcon
                    href="https://worldbrain.io/help"
                    icon="help"
                    btnClass={styles.help}
                />
                <ButtonIcon
                    href={`${constants.OVERVIEW_URL}?showInbox=true`}
                    icon="notification"
                    btnClass={styles.notification}
                    value={unreadNotifCount}
                    isNotif
                />
            </div>
        )
    }

    render() {
        const { searchValue, tagMode, listMode } = this.state

        return (
            <Popup
                shouldRenderSearch={tagMode === listMode}
                searchValue={searchValue}
                onSearchChange={this.onSearchChange}
                onSearchEnter={this.onSearchEnter}
            >
                {this.renderChildren()}
            </Popup>
        )
    }
}

export default PopupContainer
