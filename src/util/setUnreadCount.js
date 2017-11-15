import db from '../pouchdb'

export default async function setUnreadCount(itemToCount) {
    try {

        console.log('lets go 74')
        let items = 0

        let response = await db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: 'notifs',
            endkey: 'notifs\ufff0',
        })
        let notifs = response.rows
        
        notifs.forEach(element => {
            if (!element.doc.viewed) {
                items++
            } 
        })
        return items
    } catch (err) {
        console.log('err', err)
    }
}


