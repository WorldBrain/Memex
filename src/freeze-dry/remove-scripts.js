function removeNode(node) {
    node.parentNode.removeChild(node)
}

export default async function removeScripts({rootElement}) {
    // Remove all <script> elements.
    const scripts = Array.from(rootElement.querySelectorAll('script'))
    scripts.forEach(removeNode)

    // Remove event handlers (onclick, onload, etcetera).
    const elements = Array.from(rootElement.querySelectorAll('*'))
    elements.forEach(element => {
        // A crude approach: any attribute starting with 'on' is removed.
        Array.from(element.attributes)
            .filter(attribute => attribute.name.startsWith('on'))
            .forEach(attribute => {
                element.removeAttribute(attribute.name)
            })
    })
}
