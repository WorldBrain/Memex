import appendReactDOM from 'append-react-dom'
import SaveToMemex from './components/save-to-memex'

const observerConfig: MutationObserverInit = {
    childList: true,
    attributes: false,
    characterData: false,
    subtree: true,
}

const addMemexFunctionality = element => {
    const actionList = element.querySelector('.ProfileTweet-actionList')
    if (actionList) {
        appendReactDOM(SaveToMemex, actionList, { element })
        element.classList.add('MemexAdded')
    }
}

const handleNewItems = () => {
    const tweetActionLists = document.querySelectorAll(
        '.tweet:not(.MemexAdded)',
    )
    if (!tweetActionLists.length) {
        return
    }
    Array.from(tweetActionLists, addMemexFunctionality)
}

const appMutationHandler = mutations => {
    for (const mutation of mutations) {
        if (
            mutation.type === 'childList' &&
            (mutation.target.id === 'page-container' ||
                mutation.target.id === 'stream-items-id' ||
                mutation.target.id === 'permalink-overlay-body')
        ) {
            handleNewItems()
        }
    }
}

const startIntegration = () => {
    observer.observe(document, observerConfig)
    handleNewItems()
}

const observer: MutationObserver = new MutationObserver(appMutationHandler)

startIntegration()
