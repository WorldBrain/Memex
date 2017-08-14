import assocPath from 'lodash/fp/assocPath'


// Set a limit to not hang forever if something is more fundamentally broken.
const MAX_ATTEMPTS = 9999

async function updateDoc(db, docId, updateFunc) {
    let conflict
    let attemptCount = 0
    do {
        const doc = await db.get(docId)
        const updatedDoc = await updateFunc(doc)
        try {
            await db.put(updatedDoc)
            conflict = false
        } catch (err) {
            if (err.name === 'conflict' && ++attemptCount < MAX_ATTEMPTS) {
                // Try again.
                conflict = true
            } else {
                throw err
            }
        }
    } while (conflict)
}
export default updateDoc

// A shorthand for adding/updating an attachment to an existing document.
export async function setAttachment(db, docId, attachmentId, blob) {
    await updateDoc(db, docId,
        doc => assocPath(
            ['_attachments', attachmentId],
            {content_type: blob.type, data: blob}
        )(doc)
    )
}
