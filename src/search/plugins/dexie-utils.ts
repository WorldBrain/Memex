import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

export interface RegexpQueryArgs {
    collection: string
    fieldName: string
    pattern: string | RegExp
}

export interface GetPksProps {
    collection: string
    fieldName?: string
    opName?: 'anyOf' | 'equals'
    opValue?: any
    filter?: (doc: any) => boolean
    reverse?: boolean
}

export class DexieUtilsPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static FIND_BY_PK_OP = 'memex:dexie.findByPk'
    static GET_PKS_OP = 'memex:dexie.getPks'
    static NUKE_DB_OP = 'memex:dexie.recreateDatabase'
    static REGEXP_COUNT_OP = 'memex:dexie.countByRegexp'
    static REGEXP_DELETE_OP = 'memex:dexie.deleteByRegexp'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            DexieUtilsPlugin.FIND_BY_PK_OP,
            this.findByPk.bind(this),
        )
        backend.registerOperation(
            DexieUtilsPlugin.GET_PKS_OP,
            this.getPks.bind(this),
        )
        backend.registerOperation(
            DexieUtilsPlugin.REGEXP_DELETE_OP,
            this.deleteByRegexp.bind(this),
        )
        backend.registerOperation(
            DexieUtilsPlugin.REGEXP_COUNT_OP,
            this.countByRegexp.bind(this),
        )
        backend.registerOperation(
            DexieUtilsPlugin.NUKE_DB_OP,
            this.recreateDatabase.bind(this),
        )
    }

    /**
     * NOTE: This is SUPER innefficient.
     */
    private queryByRegexp({ collection, fieldName, pattern }: RegexpQueryArgs) {
        const re =
            typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern

        return this.backend.dexieInstance
            .table(collection)
            .filter(doc => re.test(doc[fieldName]))
    }

    getPks = ({
        collection,
        fieldName,
        opName,
        opValue,
        filter,
        reverse,
    }: GetPksProps) => {
        const table = this.backend.dexieInstance.table(collection)
        let coll

        switch (opName) {
            case 'anyOf':
                coll = table.where(fieldName).anyOf(opValue)
                break
            case 'equals':
                coll = table.where(fieldName).equals(opValue)
                break
            default:
                coll = table.toCollection()
        }

        if (filter) {
            coll = coll.filter(filter)
        }

        if (reverse) {
            coll = coll.reverse()
        }

        return coll.primaryKeys()
    }

    async deleteByRegexp(args: RegexpQueryArgs) {
        const pageUrls = await this.queryByRegexp(args).primaryKeys()

        await this.backend.executeBatch([
            {
                collection: 'pages',
                operation: 'deleteObjects',
                where: { url: { $in: pageUrls } },
            },
            {
                collection: 'visits',
                operation: 'deleteObjects',
                where: { url: { $in: pageUrls } },
            },
            {
                collection: 'bookmarks',
                operation: 'deleteObjects',
                where: { url: { $in: pageUrls } },
            },
            {
                collection: 'tags',
                operation: 'deleteObjects',
                where: { url: { $in: pageUrls } },
            },
            {
                collection: 'pageListEntries',
                operation: 'deleteObjects',
                where: { pageUrl: { $in: pageUrls } },
            },
            {
                collection: 'annotations',
                operation: 'deleteObjects',
                where: { pageUrl: { $in: pageUrls } },
            },
        ])
    }

    countByRegexp = (args: RegexpQueryArgs) => this.queryByRegexp(args).count()

    /**
     * NOTE: Super dangerous; deletes all data
     */
    recreateDatabase = async () => {
        await this.backend.dexieInstance.delete()
        await this.backend.dexieInstance.open()
    }

    findByPk = <T = any>({ collection, pk }: { collection: string; pk: any }) =>
        this.backend.dexieInstance.table<T>(collection).get(pk)
}
