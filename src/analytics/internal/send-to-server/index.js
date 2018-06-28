import SendToServer from './send-to-server'
import { API_HOST } from '../constants'

const sendToServer = new SendToServer({
    url: API_HOST,
})

export default sendToServer
