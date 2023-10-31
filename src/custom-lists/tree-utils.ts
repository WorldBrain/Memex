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

type TreeClimbArgs<T, CBReturn> = {
    startingNode: T
    cb: (node: T, distance: number) => CBReturn
    getParent: (node: T) => T | null
}

export function forEachTreeClimb<T, Return>(
    params: TreeClimbArgs<T, Return>,
): void {
    mapTreeClimb(params)
}

export function mapTreeClimb<T, Return>({
    cb,
    getParent,
    startingNode,
}: TreeClimbArgs<T, Return>): Return[] {
    const returnVal: Return[] = []

    let distance = 0
    let currentNode = startingNode

    do {
        cb(currentNode, distance++)
        currentNode = getParent(currentNode)
    } while (currentNode != null)

    return returnVal
}

export function forEachTreeTraverse<T>(args: TreeTraverseArgs<T, void>): void {
    mapTreeTraverse(args)
}

export function mapTreeTraverse<T, Return>({
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
