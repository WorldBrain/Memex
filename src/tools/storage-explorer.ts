import fromPairs from 'lodash/fromPairs'
import mapValues from 'lodash/mapValues'
import util from 'util'
import { URL } from 'whatwg-url'
import initStorex from 'src/search/memory-storex'
import {
    createBackgroundModules,
    getBackgroundStorageModules,
} from 'src/background-script/setup'
import { MemoryLocalStorage } from 'src/util/tests/local-storage'

type CommandLineArguments = {}

function printUsage() {
    console.error(`USAGE: storage-explorer list-operations`)
}

function parseCommandLineArgs():
    | { success: false; args: null }
    | { success: true; args: CommandLineArguments } {
    const command = process.argv[2]
    if (!command) {
        printUsage()
        return { success: false, args: null }
    }
    if (command !== 'list-operations') {
        console.error(`Unknown command '${command}'`)
        printUsage()
        return { success: false, args: null }
    }

    return { success: true, args: {} }
}

async function main() {
    const { success: areArgsValid, args } = parseCommandLineArgs()
    if (!areArgsValid) {
        return
    }

    if (typeof window === 'undefined') {
        global['URL'] = URL
    }

    const storageManager = initStorex()
    const backgroundModules = createBackgroundModules({
        storageManager,
        browserAPIs: {
            storage: {
                local: new MemoryLocalStorage(),
            },
            bookmarks: {
                onCreated: { addListener: () => {} },
                onRemoved: { addListener: () => {} },
            },
        } as any,
    })
    const storageModules = getBackgroundStorageModules(backgroundModules)
    const report = mapValues(storageModules, storageModule =>
        mapValues(storageModule.operations, operation => {
            operation = { ...operation }
            if (operation.operation === 'createObject') {
                delete operation.args
            }
            return operation
        }),
    )
    console.log(util.inspect(report, false, null, true))
}

if (require.main === module) {
    main()
}
