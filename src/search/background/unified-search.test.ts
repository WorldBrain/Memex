import type Storex from '@worldbrain/storex'
import * as DATA from './unified-search.test.data'

async function insertTestData(storageManager: Storex) {
    for (const doc of DATA.BOOKMARKS) {
        await storageManager.collection('bookmarks').createObject(doc)
    }
    for (const doc of DATA.VISITS) {
        await storageManager.collection('visits').createObject(doc)
    }
    for (const doc of DATA.ANNOTATIONS) {
        await storageManager.collection('annotations').createObject(doc)
    }
}
