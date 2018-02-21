import compromise from 'compromise'
import index from 'src/search/search-index'
import db from 'src/pouchdb'

const idb = index.db._db

async function getPageContent(pageId) {
    const pageData = await db.get(pageId)
    return pageData.content.fullText
}

export async function tagGenerator(pageId) {
    const pageContent = await getPageContent(pageId)
    const compromiseObject = compromise(pageContent)
    const nouns = compromiseObject.nouns().out('array')
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
window.db = db
