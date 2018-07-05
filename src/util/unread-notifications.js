import { remoteFunction } from 'src/util/webextensionRPC'

const getUnreadCount = remoteFunction('getUnreadCount')

export default async function unreadNotifNumber() {
    return await getUnreadCount()
}
