import SendToServer from './SendToServer'

const sendToServer = new SendToServer({
    url: process.env.REDASH_HOST,
})

export default sendToServer
