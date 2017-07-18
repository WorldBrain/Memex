import React, { Component } from 'react'
import qs from 'query-string'

import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter.js'
import { remoteFunction } from 'src/util/webextensionRPC'
import { checkWithBlacklist } from 'src/blacklist'
import { getPageDocId, updateArchiveFlag } from './archive-button'
import Popup from './components/Popup'
import Button from './components/Button'
import LinkButton from './components/LinkButton'
import SplitButton from './components/SplitButton'

export const overviewURL = '/overview/overview.html'
export const optionsURL = '/options/options.html'
export const feedbackURL = 'https://www.reddit.com/r/WorldBrain'

class PopupContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            url: '',
            searchValue: '',
            currentTabPageDocId: '',
            blacklistBtnDisabled: true,
            archiveBtnDisabled: true,
            blacklistChoice: false,
        }

        this.blacklistConfirm = remoteFunction('quickBlacklistConfirm')
        this.onArchiveBtnClick = this.onArchiveBtnClick.bind(this)
        this.onSearchChange = this.onSearchChange.bind(this)
        this.onSearchEnter = this.onSearchEnter.bind(this)
    }

    async componentDidMount() {
        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true })

        // If we can't get the tab data, then can't init action button states
        if (!currentTab || !currentTab.url) { return }

        const updateState = newState => this.setState(oldState => ({ ...oldState, ...newState }))
        const noop = f => f // Don't do anything if error; state doesn't change

        updateState({ url: currentTab.url })
        this.getInitBlacklistBtnState(currentTab.url).then(updateState).catch(noop)
        this.getInitArchiveBtnState(currentTab.url).then(updateState).catch(noop)
    }

    async getInitArchiveBtnState(url) {
        const currentTabPageDocId = await getPageDocId(url)
        return {
            currentTabPageDocId,
            archiveBtnDisabled: false,
        }
    }

    async getInitBlacklistBtnState(url) {
        const notBlacklisted = await checkWithBlacklist()
        return { blacklistBtnDisabled: !notBlacklisted({ url }) }
    }

    onBlacklistBtnClick(domain = false) {
        const url = domain ? new URL(this.state.url).hostname : this.state.url

        return event => {
            event.preventDefault()
            this.blacklistConfirm(url)
            window.close()
        }
    }

    async onArchiveBtnClick(event) {
        event.preventDefault()

        try {
            await updateArchiveFlag(this.state.currentTabPageDocId)
        } catch (error) {
            // Can't do it for whatever reason
        } finally {
            window.close()
        }
    }

    onSearchChange(event) {
        const searchValue = event.target.value
        this.setState(state => ({ ...state, searchValue }))
    }

    onSearchEnter(event) {
        if (event.key === 'Enter') {
            event.preventDefault()

            const { extractedQuery, startDate, endDate } = extractTimeFiltersFromQuery(this.state.searchValue)
            const queryParams = qs.stringify({ query: extractedQuery, startDate, endDate })

            browser.tabs.create({ url: `${overviewURL}?${queryParams}` }) // New tab with query
            window.close() // Close the popup
        }
    }

    renderBlacklistButton() {
        const { blacklistChoice, blacklistBtnDisabled } = this.state
        const setBlacklistChoice = () => this.setState(state => ({ ...state, blacklistChoice: true }))

        if (!blacklistChoice) { // Standard blacklist button
            return (
                <Button icon='block' onClick={setBlacklistChoice} disabled={blacklistBtnDisabled}>
                    Blacklist Current Page
                </Button>
            )
        }

        // Domain vs URL choice button
        return (
            <SplitButton icon='block'>
                <Button onClick={this.onBlacklistBtnClick(true)}>Domain</Button>
                <Button onClick={this.onBlacklistBtnClick(false)}>URL</Button>
            </SplitButton>
        )
    }

    render() {
        const { searchValue, archiveBtnDisabled } = this.state

        return (
            <Popup searchValue={searchValue} onSearchChange={this.onSearchChange} onSearchEnter={this.onSearchEnter}>
                <LinkButton href={`${optionsURL}#/settings`} icon='settings'>
                    Settings
                </LinkButton>
                <LinkButton href={feedbackURL} icon='feedback'>
                    Feedback
                </LinkButton>
                <hr />
                <LinkButton href={`${optionsURL}#/import`} icon='file_download'>
                    Import History &amp; Bookmarks
                </LinkButton>
                <Button icon='archive' onClick={this.onArchiveBtnClick} disabled={archiveBtnDisabled}>
                    Archive Current Page
                </Button>
                {this.renderBlacklistButton()}
            </Popup>
        )
    }
}

export default PopupContainer
