import SendToServer from './SendToServer'

const sendToServer = new SendToServer({
    url: process.env.ANALYTICS_HOST,
})

export default sendToServer
