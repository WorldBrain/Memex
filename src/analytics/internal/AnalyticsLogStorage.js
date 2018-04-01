import db from './db'

class AnalyticsLogStorage {
    async storeEvent(params) {
        await db.eventLog.add(params)
    }
}

export default AnalyticsLogStorage
