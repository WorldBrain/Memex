import db from '..'
import { FavIcon } from '../models'
import { transformUrl } from '../pipeline'

export async function domainHasFavIcon(url: string) {
    const { hostname } = transformUrl(url)

    const res = await db.favIcons.get(hostname)
    return res != null
}
