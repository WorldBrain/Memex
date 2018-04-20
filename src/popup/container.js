import React, { Component } from 'react'
import PropTypes from 'prop-types'
import qs from 'query-string'

import analytics, { updateLastActive } from 'src/analytics'
import extractQueryFilters from 'src/util/nlp-time-filter'
import { remoteFunction } from 'src/util/webextensionRPC'
import { isLoggable, getPauseState } from 'src/activity-logger'
import { IndexDropdown } from 'src/common-ui/containers'
import Popup from './components/Popup'
import Button from './components/Button'
import BlacklistConfirm from './components/BlacklistConfirm'
import HistoryPauser from './components/HistoryPauser'
import LinkButton from './components/LinkButton'
import SplitButton from './components/SplitButton'
import * as constants from './constants'
import UpgradeButton from './components/UpgradeButton'
import ButtonIcon from './components/ButtonIcon'
import styles from './components/Button.css'

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

        // Behaviour switching flags
        domainDelete: false,
        isPaused: false,
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

        this.getInitPageData()
            .then(updateState)
            .catch(noop)
        this.getInitPauseState()
            .then(updateState)
            .catch(noop)
        this.getInitBlacklistBtnState()
            .then(updateState)
            .catch(noop)
    }

    async getInitPageData() {
        return { page: await this.pageLookup(this.state.url) }
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
        return !this.state.isLoggable || this.state.page == null
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

            const queryFilters = extractQueryFilters(this.state.searchValue)
            const queryParams = qs.stringify(queryFilters)

            browser.tabs.create({
                url: `${constants.OVERVIEW_URL}?${queryParams}`,
            }) // New tab with query
            window.close() // Close the popup
        }
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

    renderChildren() {
        const { blacklistConfirm, pauseValue, isPaused, tagMode } = this.state
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
                    initFilters={this.pageTags}
                    source="tag"
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
            </div>
        )
    }

    render() {
        const { searchValue, tagMode } = this.state

        return (
            <Popup
                shouldRenderSearch={!tagMode}
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
