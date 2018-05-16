import CountStatistics from './CountStatistics'

class AnalyticsStatisticsStorage {
    constructor(notifType) {
        this.notifType = notifType
    }

    store(event) {
        const stats = new CountStatistics()
        if (this.notifType === event.notifType) {
            stats.processEvent(event)
        }
    }
}

export default AnalyticsStatisticsStorage
