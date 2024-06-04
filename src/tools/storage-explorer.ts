import mapValues from 'lodash/mapValues'
import util from 'util'
import { URL } from 'whatwg-url'
import initStorex from 'src/search/memory-storex'
import {
    createBackgroundModules,
    getBackgroundStorageModules,
} from 'src/background-script/setup'
import { MemoryLocalStorage } from 'src/util/tests/local-storage'
import { createServices } from 'src/services'
import { createPersistentStorageManager } from 'src/storage/persistent-storage'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import DeprecatedStorageModules from 'src/background-script/deprecated-storage-modules'
import { createAuthServices } from 'src/services/local-services'
import { CloudflareImageSupportBackend } from '@worldbrain/memex-common/lib/image-support/backend'
import type { ExceptionCapturer } from '@worldbrain/memex-common/lib/firebase-backend/types'

type CommandLineArguments =
    | { command: 'list-collections' }
    | { command: 'list-operations' }
const COMMAND_MAP: { [Key in CommandLineArguments['command']]: true } = {
    'list-collections': true,
    'list-operations': true,
}
function printUsage() {
    console.error(`USAGE:`)
    console.error(`  storage-explorer list-collections`)
    console.error(`  storage-explorer list-operations`)
}

function parseCommandLineArgs():
    | { success: false; args: null }
    | { success: true; args: CommandLineArguments } {
    const command = process.argv[2] as CommandLineArguments['command']
    if (!command) {
        printUsage()
        return { success: false, args: null }
    }
    if (!COMMAND_MAP[command]) {
        console.error(`Unknown command '${command}'`)
        printUsage()
        return { success: false, args: null }
    }

    return { success: true, args: { command } }
}

async function main() {
    const { success: areArgsValid, args } = parseCommandLineArgs()
    if (!areArgsValid) {
        return
    }

    if (typeof window === 'undefined') {
        global['URL'] = URL
    }
    const captureException: ExceptionCapturer = async (err) => {
        console.warn('Got error in content sharing backend', err.message)
    }

    const authServices = createAuthServices({
        backend: 'memory',
    })
    const serverStorage = {} as any
    const services = createServices({
        backend: 'memory',
        serverStorage,
        authService: authServices.auth,
    })

    const storageManager = initStorex()
    const persistentStorageManager = createPersistentStorageManager({
        idbImplementation: inMemory(),
    })
    const backgroundModules = createBackgroundModules({
        manifestVersion: '3',
        backendEnv: 'staging',
        serverStorage,
        authServices,
        services,
        analyticsManager: null,
        storageManager,
        captureException,
        persistentStorageManager,
        localStorageChangesManager: null,
        browserAPIs: {
            storage: {
                local: new MemoryLocalStorage(),
            },
            bookmarks: {
                onCreated: { addListener: () => {} },
                onRemoved: { addListener: () => {} },
            },
        } as any,
        callFirebaseFunction: () => null as any,
        fetch: globalThis.fetch.bind(globalThis),
        // TODO: Implement these
        fetchPDFData: null,
        fetchPageData: null,
        imageSupportBackend: new CloudflareImageSupportBackend({
            env:
                process.env.NODE_ENV === 'production'
                    ? 'production'
                    : 'staging',
        }),
    })
    const storageModules = getBackgroundStorageModules(
        backgroundModules,
        new DeprecatedStorageModules({ storageManager }),
    )

    const display = console['log'].bind(console) // Circumvent linter
    if (args.command === 'list-operations') {
        const report = mapValues(storageModules, (storageModule) =>
            mapValues(storageModule.operations, (operation) => {
                operation = { ...operation }
                if (operation.operation === 'createObject') {
                    delete (operation as any).args
                }
                return operation
            }),
        )
        display(util.inspect(report, false, null, true))
    } else if (args.command === 'list-collections') {
        for (const [storageModuleName, storageModule] of Object.entries(
            storageModules,
        )) {
            display(`MODULE ${storageModuleName}:`)
            for (const collectionName of Object.keys(
                storageModule.getConfig().collections || {},
            )) {
                display(`  COLLECTION: ${collectionName}`)
            }
        }
    }
}

if (require.main === module) {
    main()
}
