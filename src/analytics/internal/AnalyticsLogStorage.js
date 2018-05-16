import { remoteFunction } from 'src/util/webextensionRPC'
const storeEventInDexie = remoteFunction('storeEvent')

export default async function storeEvent(params) {
    // Store the data in dexie db
    await storeEventInDexie(params)
}
