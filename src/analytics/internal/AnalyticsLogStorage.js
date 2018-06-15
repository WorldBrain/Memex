import { remoteFunction } from 'src/util/webextensionRPC'
const storeEventDexie = remoteFunction('storeEvent')

export default async function storeEvent(params) {
    // Store the data in dexie db
    await storeEventDexie(params)
}
