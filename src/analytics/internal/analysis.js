import db from './db'
import { STORAGE_KEY } from 'src/options/blacklist/constants'

export async function EventProcessor({ type, timestamp }) {
    const startTime1 = Date.now()
    // Without caching
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
    let time = Date.now() - startTime1
    console.log(`Query with Dexie runs in : ${time} ms`)
    // console.log(await db.eventAggregator.toArray())

    const startTime2 = Date.now()
    // With localStorage
    const eventDataL = (await browser.storage.local.get(type))[type]

    await browser.storage.local.set({
        [type]: {
            count: eventDataL ? eventDataL.count + 1 : 1,
            last_time_used: timestamp,
        },
    })
    time = Date.now() - startTime2
    console.log(`Query with localStorage runs in : ${time} ms`)

    // console.log((await browser.storage.local.get(type))[type])
}
