import db from '..'
import { transformUrl } from '../../search-index-old/pipeline'

export async function domainHasFavIcon(url: string) {
    const { hostname } = transformUrl(url)

    const res = await db.favIcons.get(hostname)
    return res != null
}
