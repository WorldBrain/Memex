// Functions to return dummy data for now

const random = () => Math.random() > 0

export const fetchAnnotation = doc => {
    if (random())
        return {
            body: `Random  comment at url ${doc.url}`,
            highlight:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vestibulum varius dui in cursus. Quisque facilisis ex semper volutpat sodales. Nulla tempus rhoncus ligula ac vehicula. Maecenas eget ante mattis, viverra lectus eu, dapibus ligula. Etiam eu dui vitae nunc laoreet scelerisque quis pharetra ex. Curabitur ex tortor, elementum id cursus at, porttitor a urna. Donec a mauris massa. Donec eget dolor nec metus malesuada egestas et',
            timestamp: new Date().getTime(),
        }
    else return undefined
}
