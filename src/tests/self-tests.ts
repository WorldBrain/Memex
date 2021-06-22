import StorageManager from '@worldbrain/storex'
import { BackgroundModules } from 'src/background-script/setup'
import { ServerStorage } from 'src/storage/types'
import { WorldbrainAuthService } from '@worldbrain/memex-common/lib/authentication/worldbrain'
import FirestorePersonalCloudBackend from 'src/personal-cloud/background/backend/firestore'

export function createSelfTests(options: {
    backgroundModules: BackgroundModules
    storageManager: StorageManager
    getServerStorage: () => Promise<ServerStorage>
}) {
    const { backgroundModules } = options
    const { personalCloud } = backgroundModules

    const ensureTestUser = async () => {
        const authService = backgroundModules.auth
            .authService as WorldbrainAuthService
        if (!(await authService.getCurrentUser())) {
            try {
                await authService.firebase
                    .auth()
                    .signInWithEmailAndPassword('test@test.com', 'testing')
            } catch (e) {
                await authService.firebase
                    .auth()
                    .createUserWithEmailAndPassword('test@test.com', 'testing')
            }
        }
        const user = await authService.getCurrentUser()
        if (!user) {
            throw new Error(`Could not authenticate user`)
        }
        return user
    }

    const tests = {
        cloudSend: async () => {
            await clearDb(options.storageManager)
            console.log('Cleared local database')

            const user = await ensureTestUser()
            console.log('Self test user:', user.id)

            const serverStorage = await options.getServerStorage()
            await clearDb(serverStorage.storageManager, {
                getWhere: async (collectionName) => {
                    if (!collectionName.startsWith('personal')) {
                        return null
                    }
                    const objects = (await serverStorage.storageManager
                        .collection(collectionName)
                        .findObjects({
                            user: user.id,
                        })) as any[]
                    if (!objects.length) {
                        return null
                    }
                    const where = {
                        user: user.id,
                        id: { $in: objects.map((object) => object.id) },
                    }
                    if (collectionName === 'personalDeviceInfo') {
                        console.log(collectionName, where)
                    }
                    return where
                },
            })
            console.log('Cleared Firestore personal cloud collections')

            await personalCloud.options.settingStore.set('deviceId', null)
            await personalCloud.loadDeviceId()
            console.log('Generated device ID:', personalCloud.deviceId!)
            // // const cloudBackend = personalCloud.options.backend as FirestorePersonalCloudBackend

            await backgroundModules.tags.addTagToPage({
                url: 'https://www.getmemex.com/',
                tag: 'test-tag',
            })
            console.log(`Added tag 'test-tag' to 'https://www.getmemex.com'`)
            await personalCloud.waitForSync()
            console.log('Waited for sync to cloud from this device')

            console.log('End of self test')
        },
        cloudReceive: async () => {
            await ensureTestUser()
            await personalCloud.options.settingStore.set('deviceId', null)
            await personalCloud.loadDeviceId()
        },
    }
    return tests
}

async function clearDb(
    storageManager: StorageManager,
    options?: {
        getWhere?: (
            collectionName?: string,
        ) => Promise<{ [key: string]: any } | null>
    },
) {
    const getWhere = options?.getWhere ?? (async () => ({}))

    await Promise.all(
        Object.keys(storageManager.registry.collections).map(
            async (collectionName) => {
                const where = await getWhere(collectionName)
                if (!where) {
                    return
                }

                try {
                    await storageManager.backend.operation(
                        'deleteObjects',
                        collectionName,
                        where,
                    )
                } catch (e) {
                    console.error(
                        `Failed to clear personal cloud collection: ${collectionName}`,
                    )
                    console.error(e)
                    throw new Error(
                        `Failed to clear personal cloud collection: ${collectionName}`,
                    )
                }
            },
        ),
    )
}
