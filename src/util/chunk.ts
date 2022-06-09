export function chunk<T = any>(array: T[], size: number): T[][] {
    const result: T[][] = []

    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size))
    }

    return result
}

export async function* iterateChunks<T = any, R = any>(
    array: T[],
    size: number,
    cb: (t: T, i: number, arr: T[]) => Promise<R>,
) {
    for (const items of chunk(array, size)) {
        yield await Promise.all(items.map(cb))
    }
}

export async function mapChunks<T = any, R = any>(
    array: T[],
    size: number,
    cb: (t: T, i: number, arr: T[]) => Promise<R>,
    onError?: (err: Error, item: T) => void,
) {
    const result = []

    for (const items of chunk(array, size)) {
        const res = await Promise.all(
            onError != null
                ? items.map((...args) =>
                      cb(...args).catch((err) => onError(err, args[0])),
                  )
                : items.map(cb),
        )
        result.push(...res)
    }

    return result
}
