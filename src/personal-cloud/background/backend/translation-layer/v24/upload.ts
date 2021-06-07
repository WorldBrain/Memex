import { OperationBatch } from '@worldbrain/storex'
import {
    PersonalCloudUpdateType,
    PersonalCloudUpdatePush,
    TranslationLayerDependencies,
} from '../../types'
import {
    DataChangeType,
    LocationSchemeType,
    ContentLocatorType,
    ContentLocatorFormat,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { PersonalContentLocator } from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'

// READ BEFORE EDITING
// `updates` comes from the client-side and can contain tampered data. As sunch,
// any use of data coming from `updates` should be handled with care. There are
// locally defined functions for a few common operations, like `findObjects` and
// `deleteObjects` that scope those operations down to users' personal data. Any
// direct usage of `storageManager` should be handled with care and security in mind.

export async function uploadClientUpdateV24(
    params: TranslationLayerDependencies & {
        update: PersonalCloudUpdatePush
    },
) {
    const { storageManager } = params

    // NOTE: In any operation, userId should overwrite whatever is in the client-side provided object
    // to prevent users from overwriting each others' data
    const create = async (
        collection: string,
        toCreate: any,
        options?: { changeInfo?: any },
    ) => {
        const now = params.getNow()

        const batch: OperationBatch = [
            {
                placeholder: 'creation',
                operation: 'createObject',
                collection,
                args: {
                    ...toCreate,
                    user: params.userId,
                    createdByDevice: params.update.deviceId,
                    createdWhen: now,
                    updatedWhen: now,
                },
            },
            {
                placeholder: 'update-entry',
                operation: 'createObject',
                collection: 'personalDataChange',
                args: maybeWith(
                    {
                        createdWhen: now,
                        user: params.userId,
                        createdByDevice: params.update.deviceId,
                        type: DataChangeType.Create,
                        collection,
                    },
                    {
                        info: options?.changeInfo,
                    },
                ),
                replace: [
                    {
                        path: 'objectId',
                        placeholder: 'creation',
                    },
                ],
            },
        ]
        const result = await storageManager.operation('executeBatch', batch)
        const object = result.info.creation.object
        return object
    }
    const findOrCreate = async (
        collection: string,
        where: any,
        defaults: any = {},
    ) => {
        const existing = await storageManager
            .collection(collection)
            .findObject({ ...where, user: params.userId })
        if (existing) {
            return existing
        }
        return create(collection, { ...where, ...defaults })
    }
    const findOne = async (collection: string, where: any) => {
        return storageManager
            .collection(collection)
            .findObject({ ...where, user: params.userId }) as any
    }
    const findMany = async (collection: string, where: any) => {
        return storageManager
            .collection(collection)
            .findObjects({ ...where, user: params.userId }) as any
    }
    const findContentLocator = async (normalizedUrl: string) => {
        const contentLocator: PersonalContentLocator & {
            id: string | number
            personalContentMetadata: string | number
        } = await findOne('personalContentLocator', {
            locationScheme: LocationSchemeType.NormalizedUrlV1,
            location: normalizedUrl,
        })
        return contentLocator
    }
    const findContentMetadata = async (normalizedUrl: string) => {
        const contentLocator = await findContentLocator(normalizedUrl)
        if (!contentLocator) {
            return { contentMetadata: null, contentLocator: null }
        }
        const contentMetadata = await findOne('personalContentMetadata', {
            id: contentLocator.personalContentMetadata,
        })
        return { contentMetadata, contentLocator }
    }
    const updateById = async (
        collection: string,
        id: number | string,
        updates: any,
        options?: { changeInfo?: any },
    ) => {
        const now = params.getNow()
        const batch: OperationBatch = [
            {
                placeholder: 'update',
                operation: 'updateObjects',
                collection,
                where: { id, user: params.userId },
                updates: {
                    ...updates,
                    updatedWhen: now,
                    user: params.userId,
                },
            },
            {
                placeholder: 'update-entry',
                operation: 'createObject',
                collection: 'personalDataChange',
                args: maybeWith(
                    {
                        createdWhen: now,
                        user: params.userId,
                        createdByDevice: params.update.deviceId,
                        type: DataChangeType.Modify,
                        collection,
                        objectId: id,
                    },
                    {
                        info: options?.changeInfo,
                    },
                ),
            },
        ]
        await storageManager.operation('executeBatch', batch)
    }
    const deleteById = async (
        collection: string,
        id: number | string,
        changeInfo?: any,
    ) => {
        await deleteMany([{ collection, id, changeInfo }])
    }
    const deleteMany = async (
        references: Array<{
            collection: string
            id: number | string
            changeInfo?: any
        }>,
    ) => {
        const batch: OperationBatch = []
        for (const [index, reference] of references.entries()) {
            batch.push({
                placeholder: `deletion-${index}`,
                operation: 'deleteObjects',
                collection: reference.collection,
                where: {
                    user: params.userId,
                    id: reference.id,
                },
            })
            batch.push({
                placeholder: `entry-${index}`,
                operation: 'createObject',
                collection: 'personalDataChange',
                args: maybeWith(
                    {
                        createdWhen: params.getNow(),
                        user: params.userId,
                        createdByDevice: params.update.deviceId,
                        type: DataChangeType.Delete,
                        collection: reference.collection,
                        objectId: reference.id,
                    },
                    {
                        info: reference.changeInfo,
                    },
                ),
            })
        }
        await storageManager.operation('executeBatch', batch)
    }

    const { update } = params
    if (update.collection === 'pages') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
            const page = update.object
            const normalizedUrl = page.url

            let { contentLocator, contentMetadata } = await findContentMetadata(
                normalizedUrl,
            )
            const updates = {
                canonicalUrl: page.canonicalUrl,
                title: page.fullTitle,
                lang: page.lang,
                description: page.description,
            }

            if (!contentLocator) {
                contentMetadata = await create(
                    'personalContentMetadata',
                    updates,
                )
                contentLocator = await create('personalContentLocator', {
                    personalContentMetadata: contentMetadata.id,
                    locationType: ContentLocatorType.Remote,
                    locationScheme: LocationSchemeType.NormalizedUrlV1,
                    format: ContentLocatorFormat.HTML,
                    location: normalizedUrl,
                    originalLocation: page.fullUrl,
                    version: 0, // TODO: later, when visits are written, this is updated
                    valid: true,
                    primary: true,
                    // contentSize: null,
                    // fingerprint: null,
                    lastVisited: 0,
                })
            } else if (contentMetadata) {
                await updateById(
                    'personalContentMetadata',
                    contentMetadata.id,
                    updates,
                )
            }
        } else if (update.type === PersonalCloudUpdateType.Delete) {
            const normalizedUrl = update.where.url as string
            const firstConttentLocator = await findContentLocator(normalizedUrl)
            if (!firstConttentLocator) {
                return
            }
            const allContentLocators: Array<
                PersonalContentLocator & {
                    id: number | string
                }
            > = await findMany('personalContentLocator', {
                personalContentMetadata:
                    firstConttentLocator.personalContentMetadata,
            })
            const normalizedContentLocator = allContentLocators.find(
                (locator) =>
                    locator.locationScheme ===
                    LocationSchemeType.NormalizedUrlV1,
            )

            const references: Array<{
                collection: string
                id: number | string
            }> = allContentLocators.map((locator) => ({
                collection: 'personalContentLocator',
                id: locator.id,
            }))
            await deleteMany([
                {
                    collection: 'personalContentMetadata',
                    id: firstConttentLocator.personalContentMetadata,
                    changeInfo: normalizedContentLocator
                        ? { normalizedUrl: normalizedContentLocator.location }
                        : null,
                },
                ...references,
            ])
        }
    } else if (update.collection === 'visits') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
            const visit = update.object
            const normalizedUrl = visit.url
            const {
                contentMetadata,
                contentLocator,
            } = await findContentMetadata(normalizedUrl)
            if (!contentMetadata) {
                return
            }
            await create('personalContentRead', {
                personalContentMetadata: contentMetadata.id,
                personalContentLocator: contentLocator.id,
                readWhen: visit.time,
                readDuration: visit.duration ?? null,
                progressPercentage: visit.scrollPerc ?? null,
                scrollTotal: visit.scrollMaxPx ?? null,
                scrollProgress: visit.scrollPx ?? null,
            })
        } else if (update.type === PersonalCloudUpdateType.Delete) {
        }
    } else if (update.collection === 'tags') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
            const tagName = update.object.name
            const normalizedUrl = update.object.url

            const tag = await findOrCreate('personalTag', { name: tagName })

            const { contentMetadata } = await findContentMetadata(normalizedUrl)
            if (!contentMetadata) {
                return
            }

            await findOrCreate('personalTagConnection', {
                personalTag: tag.id,
                collection: 'personalContentMetadata',
                objectId: contentMetadata.id,
            })
        } else if (update.type === PersonalCloudUpdateType.Delete) {
            const tagName = update.where.name
            const normalizedUrl = update.where.url

            const [tag, { contentMetadata }] = await Promise.all([
                findOne('personalTag', {
                    name: tagName,
                }),
                findContentMetadata(normalizedUrl as string),
            ])
            if (!tag || !contentMetadata) {
                return
            }

            const tagConnection = await findOne('personalTagConnection', {
                peronalTag: tag.id,
                personalContentMetadata: contentMetadata.id,
            })
            await deleteById('personalTagConnection', tagConnection.id)
        }
    } else if (update.collection === 'customLists') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
        } else if (update.type === PersonalCloudUpdateType.Delete) {
        }
    } else if (update.collection === 'pageListEntries') {
        if (update.type === PersonalCloudUpdateType.Overwrite) {
        } else if (update.type === PersonalCloudUpdateType.Delete) {
        }
    }
}

function maybeWith(object: any, extras: any) {
    for (const [key, value] of Object.entries(extras)) {
        if (typeof value !== 'undefined' && value !== null) {
            object[key] = value
        }
    }

    return object
}
