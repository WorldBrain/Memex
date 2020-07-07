import { browser } from 'webextension-polyfill-ts'

const tagFull = browser.extension.getURL('/img/tag_full.svg')
const tagEmpty = browser.extension.getURL('/img/tag_empty.svg')
const heartFull = browser.extension.getURL('/img/heart_full.svg')
const heartEmpty = browser.extension.getURL('/img/heart_empty.svg')

// import tagFull from '/img/tag_full.svg'
// import tagEmpty from '/img/tag_empty.svg'
// import heartFull from '/img/heart_full.svg'
// import heartEmpty from '/img/heart_empty.svg'

export { tagFull, tagEmpty, heartEmpty, heartFull }
