function removeNode(node) {
    node.parentNode.removeChild(node)
}

export default async function removeScripts({rootElement}) {
    const scripts = Array.from(rootElement.querySelectorAll('script'))
    scripts.forEach(removeNode)

    // TODO Remove event handlers
}
