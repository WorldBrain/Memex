import qs from 'query-string'

import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter.js'

const overviewURL = 'overview/overview.html'
const input = document.getElementById('search')

input.addEventListener('keydown', event => {
    if (event.keyCode === 13) { // If 'Enter' pressed
        event.preventDefault() // So the form doesn't submit

        const { extractedQuery: query, startDate, endDate } = extractTimeFiltersFromQuery(input.value)
        const queryParams = qs.stringify({ query, startDate, endDate })

        browser.tabs.create({ url: `${overviewURL}?${queryParams}` }) // New tab with query
        window.close() // Close the popup
    }
})
import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter.js'

console.log('hello')

// document.getElementById('input')

var search = document.getElementById('input').innerHTML

extractTimeFiltersFromQuery(search)
