interface TreeTraverseArgs<T, CBReturn> {
    root: T
    strategy?: 'dfs' | 'bfs'
    cb: (node: T) => CBReturn
    sortFn?: (a: T, b: T) => number
    getChildren: (node: T) => T[]
}

export function forEachTree<T>(args: TreeTraverseArgs<T, void>): void {
    mapTree(args)
}

export function mapTree<T, Return>({
    cb,
    root,
    sortFn,
    getChildren,
    strategy = 'bfs',
}: TreeTraverseArgs<T, Return>): Return[] {
    const returnVal: Return[] = []

    const pendingNodes = [root]
    while (pendingNodes.length) {
        const currentNode =
            strategy === 'bfs' ? pendingNodes.shift() : pendingNodes.pop()

        returnVal.push(cb(currentNode))

        const children = getChildren(currentNode)
        if (sortFn) {
            children.sort(sortFn)
        }
        pendingNodes.push(...children)
    }

    return returnVal
}
