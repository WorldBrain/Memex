export function haveArraysChanged<T extends string | number>(
    before: T[],
    after: T[],
): boolean {
    if (before.length !== after.length) {
        return true
    }

    const afterSet = new Set(after)
    return !before.every((tag) => afterSet.has(tag))
}
