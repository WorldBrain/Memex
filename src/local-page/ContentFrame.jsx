import React from 'react'
import PropTypes from 'prop-types'

import syncLocationHashes from 'src/util/sync-location-hashes'


function fixChromiumInjectedStylesheet(document) {
    // Pragmatic workaround for Chromium, which appears to inject two style
    // rules into extension pages (with font-size: 75%, for some reason?).
    const styleEl = document.createElement('style')
    styleEl.innerHTML = `body {
        font-size: inherit;
        font-family: inherit;
    }`
    document.head.insertAdjacentElement('afterbegin', styleEl)
}

export default class ContentFrame extends React.Component {
    onIframeLoaded() {
        const iframe = this.iframeEl
        const doc = iframe.contentDocument

        // Ensure a head element exists.
        if (!doc.head) {
            const head = doc.createElement('head')
            doc.documentElement.insertAdjacentElement('afterbegin', head)
        }

        // Make links open in the whole tab, not inside the iframe
        const baseEl = doc.createElement('base')
        baseEl.setAttribute('target', '_parent')
        doc.head.insertAdjacentElement('afterbegin', baseEl)

        // Workaround required for Chromium.
        fixChromiumInjectedStylesheet(doc)

        // Focus on the page so it receives e.g. keyboard input
        iframe.contentWindow.focus()

        // Keep the iframe's location #hash in sync with that of the window.
        syncLocationHashes([window, iframe.contentWindow], {initial: window})
    }

    render() {
        return (
            <iframe
                id='page'
                ref={el => { this.iframeEl = el }}
                sandbox='allow-same-origin allow-top-navigation allow-scripts'
                seamless
                srcDoc={this.props.html}
                // XXX The DOMContentLoaded event would be better, but how to listen to that?
                onLoad={() => this.onIframeLoaded()}
            />
        )
    }
}

ContentFrame.propTypes = {
    html: PropTypes.string.isRequired,
}
