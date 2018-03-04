import db from '.'
import normalizeUrl from 'src/util/encode-url-for-id'

const deletePages = applyQuery =>
    db.transaction('rw', db.tables, async () => {
        const pages = await applyQuery(db.pages).toArray()

        await Promise.all(pages.map(page => page.delete()))
    })

export function delPages(urls) {
    const normalized = urls.map(normalizeUrl)

    return deletePages(table => table.where('url').anyOf(normalized))
}

export function delPagesByDomain(url) {
    const normalized = normalizeUrl(url)

    return deletePages(table => table.where('url').startsWith(normalized))
}

// WARNING: Inefficient; goes through entire table
export function delPagesByPattern(pattern) {
    const re = new RegExp(pattern, 'i')

    return deletePages(table => table.filter(page => re.test(page.url)))
}
