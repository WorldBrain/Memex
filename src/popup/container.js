import React, { Component } from 'react'
import PropTypes from 'prop-types'
import qs from 'query-string'
import { initSingleLookup } from 'src/search/search-index/util'
import { generatePageDocId } from 'src/page-storage'

import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter'
import { remoteFunction } from 'src/util/webextensionRPC'
import { isLoggable, getPauseState } from 'src/activity-logger'
import * as blacklistI from 'src/blacklist'
import Popup from './components/Popup'
import Button from './components/Button'
import BlacklistConfirm from './components/BlacklistConfirm'
import HistoryPauser from './components/HistoryPauser'
import LinkButton from './components/LinkButton'
import SplitButton from './components/SplitButton'
import * as constants from './constants'

import styles from './components/Popup.css'
import setUnreadCount from '../util/setUnreadCount'

import { itemBtnBlacklisted } from './components/Button.css'

// Transforms URL checking results to state types
const getBlacklistButtonState = ({ loggable, blacklist }) => {
    if (!blacklist) return constants.BLACKLIST_BTN_STATE.BLACKLISTED
    if (!loggable) return constants.BLACKLIST_BTN_STATE.DISABLED
    return constants.BLACKLIST_BTN_STATE.UNLISTED
}

const getBookmarkButtonState = ({ loggable, bookmark, blacklist }) => {
    if (!loggable || blacklist === constants.BLACKLIST_BTN_STATE.DISABLED)
        return constants.BOOKMARK_BTN_STATE.DISABLED
    if (bookmark) return constants.BOOKMARK_BTN_STATE.BOOKMARK
    return constants.BOOKMARK_BTN_STATE.UNBOOKMARK
}

class PopupContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            url: '',
            searchValue: '',
            pauseValue: 20,
            currentTabPageDocId: '',
            blacklistBtn: constants.BLACKLIST_BTN_STATE.DISABLED,
            isPaused: false,
            blacklistChoice: false,
            blacklistConfirm: false,
            bookmarkBtn: constants.BOOKMARK_BTN_STATE.DISABLED,
            domainDelete: false,
            notifs: [],
            isLoading: false,
            isError: false,
        }

        this.toggleLoggingPause = remoteFunction('toggleLoggingPause')
        this.deleteDocs = remoteFunction('deleteDocsByUrl')
        this.createBookmarkByExtension = remoteFunction(
            'createBookmarkByExtension',
        )
        this.removeBookmarkByUrl = remoteFunction('removeBookmarkByUrl')

        this.onSearchChange = this.onSearchChange.bind(this)
        this.onPauseChange = this.onPauseChange.bind(this)
        this.onSearchEnter = this.onSearchEnter.bind(this)
        this.onPauseConfirm = this.onPauseConfirm.bind(this)
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

        updateState({ url: currentTab.url })
        this.getInitPauseState()
            .then(updateState)
            .catch(noop)
        this.getInitBlacklistBtnState(currentTab.url)
            .then(updateState)
            .catch(noop)
        this.getInitBookmarkBtnState(currentTab.url)
            .then(updateState)
            .catch(noop)
        this.getInitNotificationState()
            .then(updateState)
            .catch(noop)
    }

    async getInitNotificationState() {
        const res = await setUnreadCount(0)
        return res === 0 ? { unread: false } : { unread: true, notifs: res }
    }

    async getInitPauseState() {
        return { isPaused: await getPauseState() }
    }

    async getInitBlacklistBtnState(url) {
        const blacklist = await blacklistI.fetchBlacklist()

        const result = {
            loggable: isLoggable({ url }),
            blacklist: !blacklistI.isURLBlacklisted(url, blacklist),
        }

        return { blacklistBtn: getBlacklistButtonState(result) }
    }

    async getInitBookmarkBtnState(url) {
        const pageId = await generatePageDocId({ url })
        const lookup = initSingleLookup()
        const dbResult = await lookup(pageId)
        const result = {
            loggable: isLoggable({ url }),
            bookmark: dbResult.bookmarks.size !== 0,
            blacklist: this.state.blacklistBtn,
        }

        return { bookmarkBtn: getBookmarkButtonState(result) }
    }

    onBlacklistBtnClick(domainDelete = false) {
        const url = domainDelete
            ? new URL(this.state.url).hostname
            : this.state.url

        return event => {
            event.preventDefault()
            blacklistI.addToBlacklist(url)
            this.setState(state => ({
                ...state,
                blacklistChoice: false,
                blacklistConfirm: true,
                blacklistBtn: constants.BLACKLIST_BTN_STATE.BLACKLISTED,
                url,
                domainDelete,
            }))
        }
    }

    onPauseConfirm(event) {
        event.preventDefault()
        const { isPaused, pauseValue } = this.state

        // Tell background script to do on extension level
        this.toggleLoggingPause(pauseValue)

        // Do local level state toggle and reset
        this.setState(state => ({
            ...state,
            isPaused: !isPaused,
            pauseValue: 20,
        }))
    }

    onPauseChange(event) {
        const pauseValue = event.target.value
        this.setState(state => ({ ...state, pauseValue }))
    }

    onSearchChange(event) {
        const searchValue = event.target.value
        this.setState(state => ({ ...state, searchValue }))
    }

    onSearchEnter(event) {
        if (event.key === 'Enter') {
            event.preventDefault()

            const queryFilters = extractTimeFiltersFromQuery(
                this.state.searchValue,
            )
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
        this.deleteDocs(this.state.url, this.state.domainDelete)
        this.resetBlacklistConfirmState()
    }

    setBlacklistChoice = () =>
        this.setState(state => ({ ...state, blacklistChoice: true }))

    renderBlacklistButton() {
        const { blacklistChoice, blacklistBtn } = this.state

        if (!blacklistChoice) {
            // Standard blacklist button
            return blacklistBtn ===
                constants.BLACKLIST_BTN_STATE.BLACKLISTED ? (
                <LinkButton
                    href={`${constants.OPTIONS_URL}#/blacklist`}
                    icon="block"
                    btnClass={itemBtnBlacklisted}
                >
                    This Page is Blacklisted. Undo>>
                </LinkButton>
            ) : (
                <Button
                    icon="block"
                    onClick={this.setBlacklistChoice}
                    disabled={
                        blacklistBtn === constants.BLACKLIST_BTN_STATE.DISABLED
                    }
                >
                    Blacklist Current Page
                </Button>
            )
        }

        // Domain vs URL choice button
        return (
            <SplitButton icon="block">
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
        if (
            this.state.bookmarkBtn === constants.BOOKMARK_BTN_STATE.UNBOOKMARK
        ) {
            this.createBookmarkByExtension(this.state.url)
        } else if (
            this.state.bookmarkBtn === constants.BOOKMARK_BTN_STATE.BOOKMARK
        ) {
            this.removeBookmarkByUrl(this.state.url)
        }
        window.close()
    }

    renderChildren() {
        const {
            notifs,
            searchValue,
            blacklistConfirm,
            pauseValue,
            isPaused,
        } = this.state

        if (blacklistConfirm) {
            return (
                <BlacklistConfirm
                    onConfirmClick={this.handleDeleteBlacklistData}
                    onDenyClick={this.resetBlacklistConfirmState}
                />
            )
        }

        return (
            <div>
                <Button
                    onClick={this.handleAddBookmark}
                    icon={
                        this.state.bookmarkBtn ===
                        constants.BOOKMARK_BTN_STATE.BOOKMARK
                            ? 'star'
                            : 'star_border'
                    }
                    disabled={
                        this.state.bookmarkBtn ===
                        constants.BOOKMARK_BTN_STATE.DISABLED
                    }
                >
                    {this.state.bookmarkBtn ===
                    constants.BOOKMARK_BTN_STATE.BOOKMARK
                        ? 'Unbookmark this Page'
                        : 'Bookmark this Page'}
                </Button>
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
                    href={`${constants.OPTIONS_URL}#/blacklist`}
                    icon="settings"
                >
                    Settings
                </LinkButton>
                <LinkButton
                    href={`${constants.OPTIONS_URL}#/import`}
                    icon="file_download"
                >
                    Import History &amp; Bookmarks
                </LinkButton>
                <LinkButton href={constants.FEEDBACK_URL} icon="feedback">
                    I need Help!
                </LinkButton>
                <LinkButton
                    href={`${constants.OPTIONS_URL}#/notifications`}
                    icon="notifications"
                >
                    Notifications{' '}
                    <span
                        className={
                            this.state.unread ? styles.badge : styles.loadbadge
                        }
                    >
                        {this.state.notifs}
                    </span>
                </LinkButton>
            </div>
        )
    }

    render() {
        const { searchValue } = this.state

        return (
            <Popup
                searchValue={searchValue}
                onSearchChange={this.onSearchChange}
                onSearchEnter={this.onSearchEnter}
            >
                {this.renderChildren()}
            </Popup>
        )
    }
}

PopupContainer.propTypes = {
    pauseValues: PropTypes.arrayOf(PropTypes.number).isRequired,
}
PopupContainer.defaultProps = {
    pauseValues: [5, 10, 20, 30, 60, 120, 180, Infinity],
}

export default PopupContainer
