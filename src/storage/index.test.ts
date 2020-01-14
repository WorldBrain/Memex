import expect from 'expect'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { getDexieHistory } from '@worldbrain/storex-backend-dexie/lib/schema'
import { DexieSchema } from '@worldbrain/storex-backend-dexie/lib/types'
import { initPatchSchema } from 'src/search/storage/dexie-schema'
import { EXPECTED_SCHEMA_CHROME, EXPECTED_SCHEMA_FF } from './index.test.data'

function normalizeDexieHistory(dexieHistory: DexieSchema[]) {
    const fieldSeparator = ', '
    const normalizeCollectionSchema = (schema: string) => {
        const [first, ...rest] = schema.split(fieldSeparator)
        rest.sort()
        return [first, ...rest].join(fieldSeparator)
    }

    for (const entry of dexieHistory) {
        for (const collectionName of Object.keys(entry.schema)) {
            entry.schema[collectionName] = normalizeCollectionSchema(
                entry.schema[collectionName],
            )
        }
    }

    return dexieHistory
}

describe('Storage initialization', () => {
    it('should generate the correct Dexie schema for Chrome', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const patchSchema = initPatchSchema(true)
        const dexieHistory = patchSchema(
            getDexieHistory(setup.storageManager.registry),
        )

        expect(normalizeDexieHistory(dexieHistory)).toEqual(
            normalizeDexieHistory(EXPECTED_SCHEMA_CHROME),
        )
    })

    it('should generate the correct Dexie schema for Firefox', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const patchSchema = initPatchSchema(false)
        const dexieHistory = patchSchema(
            getDexieHistory(setup.storageManager.registry),
        )

        expect(normalizeDexieHistory(dexieHistory)).toEqual(
            normalizeDexieHistory(EXPECTED_SCHEMA_FF),
        )
    })
})
