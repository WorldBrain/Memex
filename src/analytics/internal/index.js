import Analytics from './analytics'
import sendToServer from './send-to-server'

const analytics = new Analytics({
    serverConnector: sendToServer,
})

export default analytics
