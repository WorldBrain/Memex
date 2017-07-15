import React, { Component } from 'react'
import qs from 'query-string'

import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter.js'
import Popup from './components/Popup'
import Button from './components/Button'
import LinkButton from './components/LinkButton'

export const overviewURL = 'overview/overview.html'
export const optionsURL = 'options/options.html'
export const feedbackURL = 'https://www.reddit.com/r/WorldBrain'

class PopupContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            searchValue: '',
        }

        this.onSearchChange = this.onSearchChange.bind(this)
        this.onSearchEnter = this.onSearchEnter.bind(this)
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
        const { searchValue } = this.state

        return (
            <Popup searchValue={searchValue} onSearchChange={this.onSearchChange} onSearchEnter={this.onSearchEnter}>
                <LinkButton href={`${optionsURL}#/settings`} icon='settings'>
                    Settings
                </LinkButton>
                <LinkButton href={feedbackURL} icon='feedback'>
                    Feedback
                </LinkButton>
                <LinkButton href={`${optionsURL}#/import`} icon='file_download'>
                    Import History &amp; Bookmarks
                </LinkButton>
                <Button icon='archive'>
                    Archive Current Page
                </Button>
            </Popup>
        )
    }
}

export default PopupContainer
