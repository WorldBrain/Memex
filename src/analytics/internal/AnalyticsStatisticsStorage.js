import internalAnalytics from 'src/search/search-index-new'

class AnalyticsStatisticsStorage {
    constructor(notifType) {
        this.notifType = notifType
    }

    store(notifType) {
        if (this.notifType === notifType) {
            internalAnalytics.incrementvalue(notifType)
        }
    }
}

export default AnalyticsStatisticsStorage
