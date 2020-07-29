import Storex from '@worldbrain/storex'

export const seedClientSyncLogEntries = (db: Storex) => async ({
    amount = 100,
    sharedOnChance = 0.5,
    needsIntegrationChance = 0.5,
}: {
    amount?: number
    sharedOnChance?: number
    needsIntegrationChance?: number
}) => {
    const time = Date.now()

    const data = [...Array(amount)].map((a, index) => ({
        needsIntegration: Math.random() > needsIntegrationChance,
        sharedOn: Math.random() > sharedOnChance ? time - index : undefined,
        collection: 'testCollection',
        operation: 'create',
        createdOn: time - index,
        deviceId: 'test',
        value: {},
        pk: index,
    }))

    for (const entry of data) {
        await db.collection('clientSyncLogEntry').createObject(entry)
    }
}

const setup = (db: Storex) => ({
    seedClientSyncLogEntries: seedClientSyncLogEntries(db),
})

export default setup
