import db from './db'
import { STORAGE_KEY } from 'src/options/blacklist/constants'

export async function eventProcessor({ type, timestamp }) {
    // Without caching
    console.time('Aggregator value with dexie')
    const eventData = await db.eventAggregator
        .where('type')
        .equals(type)
        .toArray()

    await db.eventAggregator.put({
        type,
        data: {
            last_time_used: timestamp,
            count: eventData.length ? eventData[0].data.count + 1 : 1,
        },
    })

    console.timeEnd('Aggregator value with dexie')
    // console.log(await db.eventAggregator.toArray())

    // With localStorage
    console.time('Aggregator value with localStorage')
    const eventDataL = (await browser.storage.local.get(type))[type]

    await browser.storage.local.set({
        [type]: {
            count: eventDataL ? eventDataL.count + 1 : 1,
            last_time_used: timestamp,
        },
    })

    console.timeEnd('Aggregator value with localStorage')

    // console.log((await browser.storage.local.get(type))[type])
}
