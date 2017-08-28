import db from "../pouchdb"

export default async function setUnreadCount(itemToCount) {
    try {

        console.log("lets go 11")
        let items = 0
        console.log("items", items)

        let response = await db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: "notif",
            endkey: "notif\ufff0",
        })
        await console.log("response", response)

        let notifs = response.rows
        
        notifs.forEach(element => {
            if (!element.doc.viewed) {
                items++
            } 
        })
        console.log("items", items)
        return items
    } catch (err) {
        console.log("err", err)
    }
}


