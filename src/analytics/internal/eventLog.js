import db from './db'

/**
 * Save to internal storgae temporary then It'll save into Dexie
 *
 * @param {event} event
 */
export async function saveToDBEventLog(params) {
    await db.eventLog.add(params)
    console.log(await db.eventLog.toArray())

    // let eventLog = (await browser.storage.local.get('event_log'))['event_log']

    // if (eventLog === undefined) {
    //     eventLog = [params]
    // } else {
    //     eventLog.push(params)
    // }
    // await browser.storage.local.set({ event_log: eventLog })
}

export async function saveToDBEventLink(params) {
    await db.eventLink.add(params)
    console.log(await db.eventLink.toArray())
}

export async function saveToDBEventPage(params) {
    await db.eventPage.add(params)
    console.log(await db.eventPage.toArray())
}
