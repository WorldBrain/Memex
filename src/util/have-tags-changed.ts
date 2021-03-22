export function haveTagsChanged(before: string[], after: string[]): boolean {
    if (before.length !== after.length) {
        return true
    }

    const afterSet = new Set(after)
    return !before.every((tag) => afterSet.has(tag))
}
