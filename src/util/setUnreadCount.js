import db from "../options/containers/notifications/index-pouch"

export default async function setUnreadCount(itemToCount) {
    try {
        const response = await db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: "notif",
            endkey: "notif\ufff0",
        })

        response.rows.forEach(element => {
            if (!element.doc.viewed) {
                itemToCount++
            }
        })
        return itemToCount
    } catch (err) {
        console.log("err", err)
    }
}
