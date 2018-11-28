import { Dexie } from '../types'
import { transformUrl } from '../pipeline'
import { initErrHandler } from '../storage'

export const domainHasFavIcon = (getDb: Promise<Dexie>) => async (
    url: string,
) => {
    const db = await getDb
    const { hostname } = transformUrl(url)

    const res = await db.favIcons.get(hostname).catch(initErrHandler())
    return res != null
}
