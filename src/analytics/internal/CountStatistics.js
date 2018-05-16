import internalAnalytics from 'src/analytics/internal'

class CountStatistics {
    processEvent(event) {
        internalAnalytics.incrementvalue(event)
    }

    fromDexie(notifType) {
        internalAnalytics.loadInititalData(notifType)
    }
}

export default CountStatistics
