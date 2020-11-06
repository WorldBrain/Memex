const fs = require('fs')
const path = require('path')

function collectModules(basePath, namespaceDir = null) {
    let paths = {}
    for (const dirName of fs.readdirSync(
        path.join(basePath, namespaceDir || ''),
    )) {
        if (dirName.startsWith('@')) {
            paths = { ...collectModules(basePath, dirName), ...paths }
        } else if (dirName === 'ui-logic') {
            continue
        } else if (namespaceDir) {
            const namespacedDir = [namespaceDir, dirName].join('/')
            paths[namespacedDir] = namespacedDir
        } else {
            paths[dirName] = dirName
        }
    }
    if (!namespaceDir) {
        paths['ui-logic-core'] = 'ui-logic/packages/ui-logic-core'
        paths['ui-logic-react'] = 'ui-logic/packages/ui-logic-react'
    }
    return paths
}

module.exports = {
    externalTsModules: collectModules(path.join(__dirname, '..', 'external')),
}
