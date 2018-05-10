import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import DirectLinkingBackend from './backend'
import { setupRequestInterceptor } from './redirect'
import { AnnotationRequests } from './request'

const backend = new DirectLinkingBackend()
const sendAnnotation = ({ tabId, annotation }) => {
    browser.tabs.sendMessage(tabId, { type: 'direct-link', annotation })
}
const requests = new AnnotationRequests(backend, sendAnnotation)
makeRemotelyCallable(
    {
        followAnnotationRequest: ({ tab }) => {
            requests.followAnnotationRequest(tab.id)
        },
        createDirectLink: (info, request) => {
            return backend.createDirectLink(request)
        },
    },
    { insertExtraArg: true },
)

setupRequestInterceptor({ requests, webRequest: browser.webRequest })
