import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export const buildMaterializedPath = (...treeIds: AutoPk[]): string =>
    treeIds
        .map((id) => id.toString())
        .reduce(
            (prevId, nextId) => `${prevId}${prevId.length ? ',' : ''}${nextId}`,
            '',
        )
