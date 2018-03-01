import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import * as searchInjector from './interface'
import * as constants from '../constants'

makeRemotelyCallable({
    fetchSearchInjection: searchInjector.fetchSearchInjection,
    toggleSearchInjection: searchInjector.toggleSearchInjection,
})

// Temporary placement of this functions
browser.runtime.onMessage.addListener(value => {
    switch (value.action) {
        case 'openOverviewPagewithParams':
            return openOverviewPagewithParams(value.queryParams)
        default:
            break
    }
})

async function openOverviewPagewithParams(queryParams) {
    await browser.tabs.create({
        url: `${constants.OVERVIEW_URL}?query=${queryParams}`,
    }) // New tab with query
}
