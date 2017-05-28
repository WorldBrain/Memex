// Generic tree walking algorithms

// Given a node, return all nodes connected to it.
export const getAllNodes = ({getParent, getChildren}) => async node => {
    // First find the root, then crawl down each branch.
    let root = await getRoot({getParent})(node)
    const crawled = []
    const toCrawl = [root]
    let next
    while ((next = toCrawl.pop()) !== undefined) {
        if (crawled.includes(next) || toCrawl.includes(next)) {
            continue
        }
        const children = await getChildren(next)
        toCrawl.push(...children)
        crawled.push(next)
    }
    return crawled
}

// Get the root (uppermost parent) of the tree of the given node.
export const getRoot = ({getParent}) => async node => {
    let root = node
    let next
    while ((next = await getParent(root)) !== undefined) {
        root = next
    }
    return root
}
