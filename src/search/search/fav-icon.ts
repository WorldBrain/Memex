import db, { Storage } from '..'
import { transformUrl } from '../pipeline'

export async function domainHasFavIcon(url: string) {
    const { hostname } = transformUrl(url)

    const res = await db.favIcons.get(hostname).catch(Storage.initErrHandler())
    return res != null
}
