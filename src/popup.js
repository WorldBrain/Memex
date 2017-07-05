import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter.js'

console.log('hello')

// document.getElementById('input')

var search = document.getElementById('input').innerHTML

extractTimeFiltersFromQuery(search)
