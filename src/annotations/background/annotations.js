// Functions to return dummy data for now

const random = () => Math.random() > 0

export const fetchAnnotation = doc => {
    console.log(doc)
    if (random())
        return {
            body: `Random  comment at url ${doc.url}`,
            timestamp: new Date().getTime(),
        }
    else return undefined
}
