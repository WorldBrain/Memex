import React, { Component } from 'react'
import PropTypes from 'prop-types'
import qs from 'query-string'

import analytics, { updateLastActive } from 'src/analytics'
import { initSingleLookup } from 'src/search/search-index/util'
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
import { generatePageDocId } from 'src/page-storage'
import UpgradeButton from './components/UpgradeButton'
import ButtonIcon from './components/ButtonIcon'
import styles from './components/Button.css'

// Transforms URL checking results to state types
const getBlacklistButtonState = ({ loggable, blacklisted }) => {
    if (blacklisted) {
        return constants.BLACKLIST_BTN_STATE.BLACKLISTED
    }

    return loggable
        ? constants.BLACKLIST_BTN_STATE.UNLISTED
        : constants.BLACKLIST_BTN_STATE.DISABLED
}

const getBookmarkButtonState = ({ loggable, bookmark, blacklist }) => {
    if (!loggable || blacklist === constants.BLACKLIST_BTN_STATE.DISABLED) {
        return constants.BOOKMARK_BTN_STATE.DISABLED
    }

    if (bookmark) {
        return constants.BOOKMARK_BTN_STATE.BOOKMARK
    }

    return constants.BOOKMARK_BTN_STATE.UNBOOKMARK
}

class PopupContainer extends Component {
    static propTypes = {
        pauseValues: PropTypes.arrayOf(PropTypes.number).isRequired,
    }

    static defaultProps = {
        pauseValues: [5, 10, 20, 30, 60, 120, 180, Infinity],
    }

    constructor(props) {
        super(props)

        this.fetchBlacklist = remoteFunction('fetchBlacklist')
        this.addToBlacklist = remoteFunction('addToBlacklist')
        this.isURLBlacklisted = remoteFunction('isURLBlacklisted')
        this.toggleLoggingPause = remoteFunction('toggleLoggingPause')
        this.deleteDocs = remoteFunction('deleteDocsByUrl')
        this.removeBookmarkByUrl = remoteFunction('removeBookmarkByUrl')
        this.createBookmarkByUrl = remoteFunction('createBookmarkByUrl')

        this.onSearchChange = this.onSearchChange.bind(this)
        this.onPauseChange = this.onPauseChange.bind(this)
        this.onSearchEnter = this.onSearchEnter.bind(this)
        this.onPauseConfirm = this.onPauseConfirm.bind(this)
    }

    state = {
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
        tabID: null,
        tagMode: false,
        isTagBtnDisabled: true,
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

        updateState({ url: currentTab.url, tabID: currentTab.id })
        this.getInitPauseState()
            .then(updateState)
            .catch(noop)
        this.getInitBlacklistBtnState(currentTab.url)
            .then(updateState)
            .then(() => this.getDBDepBtnsState(currentTab.url))
            .then(updateState)
            .catch(noop)
    }

    getInitPauseState = async () => ({ isPaused: await getPauseState() })

    async getInitBlacklistBtnState(url) {
        const blacklist = await this.fetchBlacklist()

        return {
            blacklistBtn: getBlacklistButtonState({
                loggable: isLoggable({ url }),
                blacklisted: await this.isURLBlacklisted(url, blacklist),
            }),
        }
    }

    /**
     * Handles getting the init state of buttons depending on DB state (page existence), among other
     * async sources.
     *
     * @param {string} url
     * @return {Promise<any>} Resolves to object describing the changes to state.
     */
    async getDBDepBtnsState(url) {
        const pageId = await generatePageDocId({ url })
        const lookup = initSingleLookup()
        const dbResult = await lookup(pageId)
        const result = {
            loggable: isLoggable({ url }),
            bookmark: dbResult == null ? false : dbResult.bookmarks.size !== 0,
            blacklist: this.state.blacklistBtn,
        }

        return {
            bookmarkBtn: getBookmarkButtonState(result),
            isTagBtnDisabled: !result.loggable || dbResult == null,
        }
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
                blacklistBtn: constants.BLACKLIST_BTN_STATE.BLACKLISTED,
                url,
                domainDelete,
            }))
        }
    }

    onPauseConfirm(event) {
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

        this.deleteDocs(
            this.state.url,
            this.state.domainDelete ? 'domain' : 'url',
        )
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
                    btnClass={styles.itemBtnBlacklisted}
                >
                    This Page is Blacklisted. Undo>>
                </LinkButton>
            ) : (
                <Button
                    onClick={this.setBlacklistChoice}
                    disabled={
                        blacklistBtn === constants.BLACKLIST_BTN_STATE.DISABLED
                    }
                    btnClass={styles.blacklist}
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
            this.createBookmarkByUrl(this.state.url, this.state.tabID)
        } else if (
            this.state.bookmarkBtn === constants.BOOKMARK_BTN_STATE.BOOKMARK
        ) {
            this.removeBookmarkByUrl(this.state.url)
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
                disabled={this.state.isTagBtnDisabled}
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
            return <IndexDropdown url={this.state.url} popup tag />
        }

        return (
            <div>
                <Button
                    onClick={this.handleAddBookmark}
                    btnClass={
                        this.state.bookmarkBtn ===
                        constants.BOOKMARK_BTN_STATE.BOOKMARK
                            ? styles.bmk
                            : styles.notBmk
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
                    href={constants.OPTIONS_URL}
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
