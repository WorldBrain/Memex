import compromise from 'compromise'
import index from 'src/search/search-index'
import db from 'src/pouchdb'

const idb = index.db._db
const DOMAIN_TAGS = {
    'news.google.com': ['news', 'science', 'politics', 'technology'],
}
async function getPageContent(pageId) {
    const pageData = await db.get(pageId)
    return pageData.content.fullText
}
async function getDomain(pageId) {
    let returnData
    await idb.createReadStream({ gte: pageId, limit: 1 }).on('data', data => {
        returnData = data
    })
    return returnData
}
export async function tagGenerator(pageId) {
    const pageContent = await getPageContent(pageId)
    const domain = await getDomain(pageId)
    const compromiseObject = compromise(pageContent)
    let nouns = compromiseObject
        .nouns()
        .not(['this', 'is', 'a', 'my', 'your'])
        .out('array')
    if (domain in DOMAIN_TAGS) nouns = nouns.concat(DOMAIN_TAGS[domain])
    const nounFrequency = {}
    for (const noun of nouns) {
        for (const nounToken of noun.split(' ')) {
            if (!(nounToken.toLowerCase() in nounFrequency))
                nounFrequency[nounToken] = 1
            else nounFrequency[nounToken] = nounFrequency[nounToken] + 1
        }
    }
    const nounFrequencyEntries = Object.entries(nounFrequency)
    nounFrequencyEntries.sort((a, b) => {
        return b[1] - a[1]
    })
    return nounFrequencyEntries.slice(0, 10).map(e => {
        return e[0]
    })
}

window.tagGenerator = tagGenerator
window.idb = idb
