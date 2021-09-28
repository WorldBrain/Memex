import type StorageManager from '@worldbrain/storex'
import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import * as DATA from './index.test.data'

describe('auth background tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should wipe user data upon login of a new user', async ({ device }) => {
        const { auth } = device.backgroundModules
        await insertTestData(device.storageManager)

        await auth.options.localExtSettingStore.set('mostRecentUser', TEST_USER)
        await auth.authService.loginWithEmailAndPassword(
            DATA.USER_1.email,
            'password',
        )

        await assertTestData(device.storageManager, { exists: true })
        expect(
            (await auth.options.localExtSettingStore.get('mostRecentUser')!)
                .email,
        ).toEqual(TEST_USER.email)

        await auth.handlePostLoginLogic()

        await assertTestData(device.storageManager, { exists: false })
        expect(
            (await auth.options.localExtSettingStore.get('mostRecentUser')!)
                .email,
        ).toEqual(DATA.USER_1.email)
    })

    it('should NOT wipe user data upon re-login of a user that was previously logged in', async ({
        device,
    }) => {
        const { auth } = device.backgroundModules
        await insertTestData(device.storageManager)

        await auth.options.localExtSettingStore.set('mostRecentUser', TEST_USER)
        await auth.authService.loginWithEmailAndPassword(
            TEST_USER.email,
            'password',
        )

        await assertTestData(device.storageManager, { exists: true })
        expect(
            await auth.options.localExtSettingStore.get('mostRecentUser'),
        ).toEqual(TEST_USER)

        await auth.handlePostLoginLogic()

        await assertTestData(device.storageManager, { exists: true })
        expect(
            await auth.options.localExtSettingStore.get('mostRecentUser'),
        ).toEqual(TEST_USER)
    })

    it('should NOT wipe user data upon first login of any user', async ({
        device,
    }) => {
        const { auth } = device.backgroundModules
        await insertTestData(device.storageManager)

        await auth.authService.loginWithEmailAndPassword(
            TEST_USER.email,
            'password',
        )

        await assertTestData(device.storageManager, { exists: true })
        expect(
            await auth.options.localExtSettingStore.get('mostRecentUser'),
        ).toEqual(null)

        await auth.handlePostLoginLogic()

        await assertTestData(device.storageManager, { exists: true })
        expect(
            await auth.options.localExtSettingStore.get('mostRecentUser'),
        ).toEqual(TEST_USER)
    })
})

async function insertTestData(storageManager: StorageManager) {
    await storageManager.collection('pages').createObject(DATA.PAGE_1)

    await storageManager
        .collection('annotations')
        .createObject(DATA.ANNOTATION_1)

    for (const name of DATA.TAGS_1) {
        await storageManager
            .collection('tags')
            .createObject({ url: DATA.PAGE_1.url, name })
        await storageManager
            .collection('tags')
            .createObject({ url: DATA.ANNOTATION_1.url, name })
    }
}

async function assertTestData(
    storageManager: StorageManager,
    { exists }: { exists: boolean },
) {
    expect(await storageManager.collection('pages').findAllObjects({})).toEqual(
        !exists ? [] : [expect.objectContaining(DATA.PAGE_1)],
    )

    expect(
        await storageManager.collection('annotations').findAllObjects({}),
    ).toEqual(!exists ? [] : [expect.objectContaining(DATA.ANNOTATION_1)])

    expect(await storageManager.collection('tags').findAllObjects({})).toEqual(
        !exists
            ? []
            : expect.arrayContaining(
                  DATA.TAGS_1.flatMap((name) => [
                      { name, url: DATA.PAGE_1.url },
                      { name, url: DATA.ANNOTATION_1.url },
                  ]),
              ),
    )
}
