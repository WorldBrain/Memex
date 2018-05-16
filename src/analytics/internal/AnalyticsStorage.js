import AnalyticsLogStorage from './AnalyticsLogStorage'
import AnalyticsStatisticsStorage from './AnalyticsStatisticsStorage'

export default async function storeEventAndStatistics({ event, statistics }) {
    // Process data to store the data
    await AnalyticsLogStorage(event)

    if (statistics) {
        const statistic = new AnalyticsStatisticsStorage(statistics.notifType)
        statistic.store(statistics)
    }
}
