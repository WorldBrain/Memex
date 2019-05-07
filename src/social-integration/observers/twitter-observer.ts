import appendReactDOM from 'src/social-integration/append-react-dom'
import { EventEmitter } from 'events'
import { getTweetInfo } from './get-tweet-data'

export default class TwitterObserver {
    private observer: MutationObserver
    private observerConfig: MutationObserverInit
    public events: EventEmitter

    constructor({ document }: { document: Document }) {
        this.events = new EventEmitter()

        this.observerConfig = {
            childList: true,
            attributes: false,
            characterData: false,
            subtree: true,
        }

        this.observer = new MutationObserver((mutations: MutationRecord[]) => {
            mutations.forEach((mutation: MutationRecord) => {
                if (mutation.type === 'childList') {
                    const tweets = document.querySelectorAll(
                        '.tweet:not(.MemexAdded)',
                    )
                    if (!tweets.length) {
                        return
                    }
                    tweets.forEach(element =>
                        this.events.emit('newTweet', {
                            tweet: getTweetInfo(element),
                            element,
                        }),
                    )
                }
            })
        })

        this.observer.observe(document, this.observerConfig)
    }

    public stop() {
        this.observer.disconnect()
    }
}

export const addPostButton = ({
    target,
    element,
    destroy,
}: {
    target: Element
    element: Element
    destroy: () => void
}) => {
    const actionList = element.querySelector('.ProfileTweet-actionList')
    if (!actionList) {
        return
    }

    actionList.addEventListener('click', e => e.stopPropagation())

    destroy()

    actionList.appendChild(target)
    element.classList.add('MemexAdded')
}
