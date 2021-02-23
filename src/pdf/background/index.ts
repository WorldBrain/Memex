import { WebRequest, Tabs } from 'webextension-polyfill-ts'

export class PDFBackground {
    private routeViewer: string
    private routeExtension: string
    private webRequest: WebRequest.Static

    constructor(opts: { extensionGetURL: (url: string) => string }) {
        this.routeViewer = opts.extensionGetURL('pdfjs/viewer.html')
        this.routeExtension = opts.extensionGetURL('/')
    }

    setupRequestInterceptors = (opts: {
        webRequest: WebRequest.Static
        tabs: Tabs.Static
    }) => {
        console.log('pdf request interceptor registering')

        this.webRequest = opts.webRequest

        this.webRequest.onBeforeRequest.addListener(
            (details) => {
                console.log('pdf request interceptor:', { details })

                if (details.url) {
                    let url = this.routeViewer + '?file=' + details.url
                    const i = details.url.indexOf('#')
                    if (i > 0) {
                        url += details.url.slice(i)
                    }
                    console.log('Redirecting ' + details.url + ' to ' + url)

                    // to get around the blocked state of the request, we update the original tab with the account screen.
                    // this is probably a bit glitchy at first, but we may be able to improve on that experience. For now it should be OK.
                    setTimeout(() => {
                        opts.tabs.update(details.tabId, { active: true, url })
                    }, 1)

                    return { redirectUrl: url }
                }
                return undefined
            },
            {
                types: ['main_frame', 'sub_frame'],
                urls: ['http://*/*.pdf', 'https://*/*.pdf'],
            },
            ['blocking'],
        )
    }
}
