import appendReactDOM from 'src/social-integration/append-react-dom'

export default class TwitterObserver {
    private observer: MutationObserver
    private observerConfig: MutationObserverInit
    private component: React.ReactNode

    constructor({
        document,
        component,
    }: {
        document: Document
        component: React.ReactNode
    }) {
        this.component = component

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
                    Array.from(tweets, this.addButton)
                }
            })
        })

        this.observer.observe(document, this.observerConfig)
    }

    private addButton = element => {
        const actionList = element.querySelector('.ProfileTweet-actionList')
        if (actionList) {
            actionList.addEventListener('click', e => e.stopPropagation())
            appendReactDOM(this.component, actionList, { element })
            element.classList.add('MemexAdded')
        }
    }

    public stop() {
        this.observer.disconnect()
    }
}
