import 'babel-polyfill'
import { TwitterObserver } from '../observers'
import SaveToMemex from './components'
import { injectCSS } from 'src/search-injection/dom'
import { browser } from 'webextension-polyfill-ts'

injectCSS(browser.extension.getURL('/twitter.css'))

const twitterObserver = new TwitterObserver({
    document,
    component: SaveToMemex,
})
