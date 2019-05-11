import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import { TwitterObserver, addPostButton } from '../observers'
import SaveToMemexContainer from './components'
import { injectCSS } from 'src/search-injection/dom'
import { browser } from 'webextension-polyfill-ts'
import configureStore from 'src/social-integration/store'
import { Tweet } from '../types'

injectCSS(browser.extension.getURL('/twitter.css'))

const store = configureStore()

const twitterObserver = new TwitterObserver({
    document,
})

twitterObserver.events.on('newTweet', ({ element }: { element: Element }) => {
    const target = document.createElement('div')

    target.setAttribute('id', 'memexButton')
    target.classList.add(...['ProfileTweet-action', 'ProfileTweet-action--stm'])
    target.addEventListener('click', e => e.stopPropagation())

    const destroy = () => {
        const btn = element.querySelector('#memexButton')

        if (btn) {
            btn.parentNode.removeChild(btn)
        }
    }

    ReactDOM.render(
        <Provider store={store}>
            <ErrorBoundary component={RuntimeError}>
                <SaveToMemexContainer element={element} />
            </ErrorBoundary>
        </Provider>,
        target,
    )

    addPostButton({ target, element, destroy })
})
