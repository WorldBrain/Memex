type TreeTraverseArgs<T, CBReturn> = {
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
    shouldEndEarly?: (node: T, distance: number) => boolean
}

type TreeClimbAsyncArgs<T, CBReturn> = Omit<
    TreeClimbArgs<T, Promise<CBReturn>>,
    'getParent'
> & {
    getParent: (node: T) => Promise<T | null>
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
    shouldEndEarly,
}: TreeClimbArgs<T, Return>): Return[] {
    const returnVal: Return[] = []

    let distance = 0
    let currentNode = startingNode

    do {
        returnVal.push(cb(currentNode, distance))
        if (shouldEndEarly?.(currentNode, distance)) {
            break
        }
        currentNode = getParent(currentNode)
        distance++
    } while (currentNode != null)

    return returnVal
}

export async function forEachTreeClimbAsync<T, Return>(
    params: TreeClimbAsyncArgs<T, Return>,
): Promise<void> {
    await mapTreeClimbAsync(params)
}

export async function mapTreeClimbAsync<T, Return>({
    cb,
    getParent,
    startingNode,
    shouldEndEarly,
}: TreeClimbAsyncArgs<T, Return>): Promise<Return[]> {
    const returnVal: Return[] = []

    let distance = 0
    let currentNode = startingNode

    do {
        returnVal.push(await cb(currentNode, distance))
        if (shouldEndEarly?.(currentNode, distance)) {
            break
        }
        currentNode = await getParent(currentNode)
        distance++
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

export async function forEachTreeTraverseAsync<T, Return>(
    args: TreeTraverseAsyncArgs<T, Return>,
): Promise<void> {
    await mapTreeTraverseAsync(args)
}

export async function mapTreeTraverseAsync<T, Return>({
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
