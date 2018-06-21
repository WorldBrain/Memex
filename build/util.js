export function staticFilesToPatterns(filesDict = {}) {
    const patterns = []

    for (const file in filesDict) {
        patterns.push({ from: file, to: filesDict[file] })
    }

    return patterns
}
