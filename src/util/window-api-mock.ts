import type { WindowAPISubset } from 'src/sidebar/annotations-sidebar/containers/types'

export const DEFAULT_INNER_WIDTH = 1000

export class WindowMock implements WindowAPISubset {
    eventListeners: { [name: string]: () => void | Promise<void> }
    lastOpenedUrl: string | null
    innerWidth: WindowAPISubset['innerWidth']
    location: WindowAPISubset['location']
    selection: Selection

    constructor(
        private options: {
            innerWidth?: number
            fullPageUrl: string
            testSelection?: Selection
        },
    ) {
        this.innerWidth = options.innerWidth ?? DEFAULT_INNER_WIDTH
        const hrefUrl = new URL(options.fullPageUrl)
        this.location = {
            href: options.fullPageUrl,
            search: hrefUrl.search,
        }
        this.selection = options.testSelection
    }

    open: WindowAPISubset['open'] = (url) => {
        this.lastOpenedUrl = url.toString()
        return null
    }

    addEventListener = ((type: string, listener: () => void) => {
        this.eventListeners[type] = listener
    }) as WindowAPISubset['addEventListener']

    removeEventListener = ((type: string, listener: () => void) => {
        delete this.eventListeners[type]
    }) as WindowAPISubset['removeEventListener']

    getSelection: WindowAPISubset['getSelection'] = () => {
        if (!this.selection) {
            throw new Error('Selection mock not set')
        }
        return this.selection
    }
}
