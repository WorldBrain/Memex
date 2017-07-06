import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter.js'

console.log('hello')

console.log(document.getElementById('search'))

console.log(document.getElementById('search').value)

extractTimeFiltersFromQuery(document.getElementById('search').value)

