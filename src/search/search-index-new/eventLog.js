import db from '.'
import { EventLog } from './models'

export async function storeEvent(event) {
    return db.transaction('rw', db.tables, async () => {
        const events = await EventLog(event)

        await events.save()
    })
}
