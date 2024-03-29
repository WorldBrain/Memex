import fs from 'fs'

export function staticFilesToPatterns(filesDict = {}) {
    const patterns = []

    for (const file in filesDict) {
        patterns.push({ from: file, to: filesDict[file] })
    }

    return patterns
}

export const doesFileExist = (path) => fs.existsSync(path)

export const buildingManifestV3 = process.env.MANIFEST_VERSION !== '2'
