import type StorageManager from '@worldbrain/storex'
import type { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import type CustomListBackground from 'src/custom-lists/background'
import type ContentSharingBackground from 'src/content-sharing/background'
import { COLLECTION_NAMES as LIST_COLL_NAMES } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

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
    constructor(private options: ListTreeMiddlewareSettings) {}

    process: StorageMiddleware['process'] = async (context) => {
        const next = () => context.next.process(context)

        if (
            context.operation[0] === LIST_TREE_OPERATION_ALIASES.deleteTree &&
            context.operation[1] === LIST_COLL_NAMES.listTrees
        ) {
            const localListId = context.operation[2]?.localListId as number

            if (localListId != null) {
                await this.options.contentSharingBG.performDeleteListAndAllAssociatedData(
                    { localListId },
                )
            }
            return
        }
        if (
            context.operation[0] === LIST_TREE_OPERATION_ALIASES.moveTree &&
            context.operation[1] === LIST_COLL_NAMES.listTrees
        ) {
            const localListId = context.operation[2]?.localListId as number
            const parentListId = context.operation[2]?.newParentListId as
                | number
                | null
            const now = context.operation[2]?.now as number

            if (localListId != null) {
                await this.options.customListsBG.storage.updateListTreeParent({
                    localListId,
                    parentListId,
                    now,
                })
            }
            return
        }
        return next()
    }
}
