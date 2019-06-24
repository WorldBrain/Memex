import { DBGet } from '../types'
import { transformUrl } from '../pipeline'
import { initErrHandler } from '../storage'

export const domainHasFavIcon = (getDb: DBGet) => async (url: string) => {
    const db = await getDb()
    const { hostname } = transformUrl(url)

    const res = await db
        .collection('favIcons')
        .findOneObject({ hostname })
        .catch(initErrHandler())
    return res != null
}
