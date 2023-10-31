interface TreeTraverseArgs<T, CBReturn> {
    root: T
    strategy?: 'dfs' | 'bfs'
    cb: (node: T, index: number) => CBReturn
    getChildren: (node: T) => T[]
}

type TreeTraverseAsyncArgs<T, CBReturn> = Omit<
    TreeTraverseArgs<T, Promise<CBReturn>>,
    'getChildren'
> & {
    getChildren: (node: T) => Promise<T[]>
    concurrent?: boolean
}

export function forEachTree<T>(args: TreeTraverseArgs<T, void>): void {
    mapTree(args)
}

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

export async function forEachTreeAsync<T, Return>(
    args: TreeTraverseAsyncArgs<T, Return>,
): Promise<void> {
    await mapTreeAsync(args)
}

export async function mapTreeAsync<T, Return>({
    cb,
    root,
    concurrent,
    getChildren,
    strategy = 'bfs',
}: TreeTraverseAsyncArgs<T, Return>): Promise<Return[]> {
    const returnVal: Array<Return | Promise<Return>> = []

    const pendingNodes = [root]
    let i = 0
    while (pendingNodes.length) {
        const currentNode =
            strategy === 'bfs' ? pendingNodes.shift() : pendingNodes.pop()

        const promised = cb(currentNode, i++)
        returnVal.push(concurrent ? promised : await promised)

        const children = await getChildren(currentNode)
        pendingNodes.push(...children)
    }

    return Promise.all(returnVal)
}
