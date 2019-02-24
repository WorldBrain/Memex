export default async function checkOnline(): Promise<boolean> {
    let online = true
    await fetch('http://www.google.com', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => {
            online = true
        })
        .catch(err => {
            online = false
        })
    return online
}
