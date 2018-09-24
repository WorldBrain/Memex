import {
    AnnotationSender,
    StoredAnnotationRequestMap,
    AnnotationRequest,
} from '../types'
import DirectLinkingBackend from './backend'

// This thing sends the annotation back to the tab once it's loaded
export class AnnotationRequests {
    private requests: StoredAnnotationRequestMap = {}
    private preventAutomaticAnchoring = null

    constructor(private backend: DirectLinkingBackend, private annotationSender: AnnotationSender) {
    }

    pauseAutomaticAnchoring() {
        const prevent = {}
        prevent['promise'] = new Promise(resolve => {
            prevent['resolve'] = resolve
        })
        this.preventAutomaticAnchoring = prevent
    }

    resumeAutomaticAnchoring() {
        this.preventAutomaticAnchoring['resolve']()
        this.preventAutomaticAnchoring = null
    }

    request(request: AnnotationRequest) {
        let annotationPromise = this.backend.fetchAnnotationData(request)
        if (this.preventAutomaticAnchoring) {
            annotationPromise = annotationPromise.then(response => this.preventAutomaticAnchoring.promise.then(() => response))
        }
        this.requests[request.tabId] = { ...request, annotationPromise }
    }

    // Called when the tabs DOM is loaded, saying it wants a message when the annotation has been loaded
    followAnnotationRequest(tabId) {
        const request = this.requests[tabId]
        if (!request) {
            return false
        }

        request.annotationPromise = request.annotationPromise.then(annotation => {
            this.annotationSender({ annotation, tabId })
            return annotation
        })

        return true
    }
}
