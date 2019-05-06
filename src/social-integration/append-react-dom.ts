import React from 'react'
import ReactDOM from 'react-dom'

export default function appendReactDOM(component, el, props) {
    let done
    if (typeof props === 'function') {
        done = props
        props = null
    }

    if (!props) {
        props = {}
    }

    el = el.length ? Array.prototype.slice.call : [el]

    el.forEach(function(dom) {
        const div = document.createElement('div')
        ReactDOM.render(
            React.createElement(component, props, null),
            div,
            function() {
                dom.appendChild(ReactDOM.findDOMNode(this))
                typeof done === 'function' && done()
            },
        )
    })
}
