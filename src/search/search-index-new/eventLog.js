import db from '.'
import { EventLog } from './models'

export async function storeEvent(event) {
    console.log(event)
    return db.transaction('rw', db.tables, async () => {
        const events = new EventLog(event)

        await events.save()
    })
}
