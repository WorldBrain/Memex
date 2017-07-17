import React, { Component } from 'react'
import qs from 'query-string'

import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter.js'
import Popup from './components/Popup'
import Button from './components/Button'
import LinkButton from './components/LinkButton'
import { getCurrentTabPageDocId, updateArchiveFlag } from './archive-button'
import { getCurrentPageBlacklistedState } from './blacklist-button'

export const overviewURL = '/overview/overview.html'
export const optionsURL = '/options/options.html'
export const feedbackURL = 'https://www.reddit.com/r/WorldBrain'

class PopupContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            searchValue: '',
            currentTabPageDocId: '',
            blacklistBtnDisabled: true,
            archiveBtnDisabled: true,
        }

        this.onArchiveBtnClick = this.onArchiveBtnClick.bind(this)
        this.onSearchChange = this.onSearchChange.bind(this)
        this.onSearchEnter = this.onSearchEnter.bind(this)
    }

    async componentDidMount() {
        try {
            const currentTabPageDocId = await getCurrentTabPageDocId()
            this.setState(state => ({ ...state, currentTabPageDocId, archiveBtnDisabled: false }))
        } catch (error) {
            // Can't get the ID at this time
        }

        try {
            const isCurrentPageBlacklisted = await getCurrentPageBlacklistedState()
            this.setState(state => ({ ...state, blacklistBtnDisabled: isCurrentPageBlacklisted }))
        } catch (error) {
            // Can't check with the blacklist at this time
        }
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
            </Popup>
        )
    }
}

export default PopupContainer
