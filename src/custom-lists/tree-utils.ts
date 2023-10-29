interface TreeTraverseArgs<T, CBReturn> {
    root: T
    strategy?: 'dfs' | 'bfs'
    cb: (node: T, index: number) => CBReturn
    getChildren: (node: T) => T[]
}

/**
 * Assumes no cycles.
 */
export function forEachTree<T>(args: TreeTraverseArgs<T, void>): void {
    mapTree(args)
}

/**
 * Assumes no cycles.
 */
export function mapTree<T, Return>({
    cb,
    root,
    getChildren,
    strategy = 'bfs',
}: TreeTraverseArgs<T, Return>): Return[] {
    const returnVal: Return[] = []

    const pendingNodes = [root]
    let i = 0
    while (pendingNodes.length) {
        const currentNode =
            strategy === 'bfs' ? pendingNodes.shift() : pendingNodes.pop()

        returnVal.push(cb(currentNode, i++))

        const children = getChildren(currentNode)
        pendingNodes.push(...children)
    }

    return returnVal
}
