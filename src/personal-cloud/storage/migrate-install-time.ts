import StorageManager from '@worldbrain/storex'
import { Visit } from 'src/search'

export async function migrateInstallTime({
    fallbackNow = Date.now(),
    ...deps
}: {
    fallbackNow?: number
    storageManager: StorageManager
    setInstallTime: (time: number) => Promise<void>
    getOldInstallTime: () => Promise<number | null>
}): Promise<void> {
    const oldValue = await deps.getOldInstallTime()
    if (
        typeof oldValue === 'number' &&
        oldValue > new Date('2017-01-01').getTime()
    ) {
        await deps.setInstallTime(oldValue)
        return
    }

    const [oldestVisit] = (await deps.storageManager
        .collection('visits')
        .findAllObjects({}, { order: [['time', 'asc']], limit: 1 })) as Visit[]

    await deps.setInstallTime(oldestVisit?.time ?? fallbackNow)
}
