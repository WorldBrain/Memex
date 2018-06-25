import SendToServer from './SendToServer'
import { API_HOST } from '../constants'

const sendToServer = new SendToServer({
    url: API_HOST,
})

export default sendToServer
