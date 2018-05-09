import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { setupRequestInterceptor } from './redirect'
import { AnnotationRequests } from './request'

const sendAnnotation = ({ tabId, annotation }) => {
    console.log('sending msg to', tabId)
    browser.tabs.sendMessage(tabId, { type: 'direct-link', annotation })
}
const requests = new AnnotationRequests(sendAnnotation)
makeRemotelyCallable(
    {
        followAnnotationRequest: ({ tab }) => {
            console.log('following request', tab.id)
            requests.followAnnotationRequest(tab.id)
        },
    },
    { insertExtraArg: true },
)

setupRequestInterceptor({ requests, webRequest: browser.webRequest })
