import db from "../options/containers/notifications/index-pouch"

export default async function setUnreadCount(itemToCount) {
    let items = itemToCount
    try {
        const response = await db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: "notif",
            endkey: "notif\ufff0",
        })

        response.rows.forEach(element => {
            if (!element.doc.viewed) {
                items++
            }
        })
        return items
    } catch (err) {
        console.log("err", err)
    }
}
