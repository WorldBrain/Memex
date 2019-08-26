const fs = require('fs')
const path = require('path')

function collectModules(basePath, namespaceDir = null) {
    const paths = []
    for (const dirName of fs.readdirSync(
        path.join(basePath, namespaceDir || ''),
    )) {
        if (dirName.startsWith('@')) {
            paths.push(...collectModules(basePath, dirName))
        } else if (namespaceDir) {
            paths.push([namespaceDir, dirName].join('/'))
        } else {
            paths.push(dirName)
        }
    }
    return paths
}

export const externalTsModules = collectModules(
    path.join(__dirname, '..', 'external'),
)
