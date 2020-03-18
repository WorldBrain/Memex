import AnalyticsManager from './analytics'
import FirebaseAnalyticsBackend from './backend/firebase'

const analytics = new AnalyticsManager({
    backend: new FirebaseAnalyticsBackend(),
})

export default analytics
