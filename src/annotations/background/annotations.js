// Functions to return dummy data for now

const random = () => Math.random() > 5

export const fetchAnnotation = doc => {
    console.log(doc)
    if (random())
        return {
            body: `Random  comment #${doc.id}`,
            timestamp: new Date().getTime(),
        }
    else return undefined
}
