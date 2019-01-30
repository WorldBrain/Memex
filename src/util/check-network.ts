export default async function checkOnline(): Promise<boolean> {
    let online = false
    await fetch('www.google.com', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .catch(err => {
            online = false
        })
        .then(res => {
            online = true
        })
        .catch(err => {
            online = false
        })
    return online
}
