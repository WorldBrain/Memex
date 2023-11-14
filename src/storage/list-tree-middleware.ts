import type StorageManager from '@worldbrain/storex'
import type { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import type { ListTree } from 'src/custom-lists/background/types'
import type { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import {
    buildMaterializedPath,
    extractMaterializedPathIds,
} from 'src/content-sharing/utils'
import type { DexieMongoify } from '@worldbrain/storex-backend-dexie/lib/types'
import type CustomListBackground from 'src/custom-lists/background'
import type ContentSharingBackground from 'src/content-sharing/background'

export interface ListTreeMiddlewareSettings {
    storageManager: StorageManager
    customListsBG: CustomListBackground
    contentSharingBG: ContentSharingBackground
}

export const LIST_TREE_OPERATION_ALIASES = {
    moveTree: 'moveListTree',
    deleteTree: 'deleteListTree',
}

export class ListTreeMiddleware implements StorageMiddleware {
    private dexie: DexieMongoify

    constructor(private options: ListTreeMiddlewareSettings) {
        this.dexie = (options.storageManager
            .backend as DexieStorageBackend).dexieInstance
    }

    private async moveTree(
        localListId: number,
        parentListId: number,
        now?: number,
    ): Promise<void> {
        await this.dexie.transaction(
            'rw',
            this.dexie.table(COLLECTION_NAMES.listTrees),
            this.dexie.table(COLLECTION_NAMES.list),
            async () => {
                await this.options.customListsBG.storage.updateListTreeParent({
                    localListId,
                    parentListId,
                    now,
                })
            },
        )
    }

    private async deleteTree(localListId: number): Promise<void> {
        await this.dexie.transaction(
            'rw',
            this.dexie.table(COLLECTION_NAMES.listTrees), // TODO: Add other collections here...
            async (tx) => {
                await this.options.contentSharingBG.deleteListAndAllAssociatedData(
                    { localListId },
                )
                // TODO: Move this to inside deleteListAndAllAssociatedData
                // Link nodes are always leaves. Simply delete this node and finish up
                // if (rootNode.linkTarget != null) {
                //     await this.dexie
                //         .table(COLLECTION_NAMES.listTrees)
                //         .where('id')
                //         .equals(rootNode.id)
                //         .delete()
                //     return
                // }

                // const rootPath = buildMaterializedPath(
                //     ...extractMaterializedPathIds(
                //         rootNode.path ?? '',
                //         'number',
                //     ),
                // )
                // await this.getTreeNodes(rootPath).delete()
            },
        )
    }

    process: StorageMiddleware['process'] = async (context) => {
        const next = () => context.next.process(context)

        if (
            context.operation[0] === LIST_TREE_OPERATION_ALIASES.deleteTree &&
            context.operation[1] === COLLECTION_NAMES.listTrees
        ) {
            const localListId = context.operation[2]?.localListId as number
            if (localListId != null) {
                await this.deleteTree(localListId)
            }
            return
        }
        if (
            context.operation[0] === LIST_TREE_OPERATION_ALIASES.moveTree &&
            context.operation[1] === COLLECTION_NAMES.listTrees
        ) {
            const localListId = context.operation[2]?.localListId as number
            const newParentListId = context.operation[2]?.newParentListId as
                | number
                | null
            const now = context.operation[2]?.now as number
            if (localListId != null) {
                await this.moveTree(localListId, newParentListId, now)
            }
            return
        }
        return next()
    }
}
