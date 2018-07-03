import Analytics from './analytics'
import sendToServer from './send-to-server'
import { remoteFunction } from 'src/util/webextensionRPC'

const analytics = new Analytics({
    serverConnector: sendToServer,
    remoteFunction,
})

export default analytics
