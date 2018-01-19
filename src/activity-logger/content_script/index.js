import throttle from 'lodash/fp/throttle'

import * as scrollStateFetchers from './scroll-state-fetchers'

// Set up sending of current scroll state data to the background script's tab states whenever
//  the 'scroll' event fires for this particular script
const sendCurrentSrollState = () =>
    browser.runtime.sendMessage({
        funcName: 'updateScrollState',
        scrollOffset: scrollStateFetchers.fetchScrollOffset(),
        windowHeight: scrollStateFetchers.fetchWindowHeight(),
        scrollableHeight: scrollStateFetchers.fetchScrollableHeight(),
    })

window.addEventListener('scroll', throttle(500)(sendCurrentSrollState))
