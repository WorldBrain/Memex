import fs from 'fs'

export function staticFilesToPatterns(filesDict = {}) {
    const patterns = []

    for (const file in filesDict) {
        patterns.push({ from: file, to: filesDict[file] })
    }

    return patterns
}

export const doesFileExist = (path) =>
    new Promise((resolve) => fs.access(path, (err) => resolve(err == null)))
