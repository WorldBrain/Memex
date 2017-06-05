// Set a limit to not hang forever if something is more fundamentally broken.
const MAX_ATTEMPTS = 9999

export default async function updateDoc(db, docId, updateFunc) {
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
