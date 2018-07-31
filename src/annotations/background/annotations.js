// Return dummy annotation data

const dummyAnnotations = doc => [
    {
        body: `Lorem ipsum dolor sit amet, consectetur adipiscing Random  comment at url ${
            doc.url
        }.`,
        highlight:
            'Lorem ipsum dolor sit amet, consectetur adipiscing dafkajf adjkfasdf asdfadf adfadfadsf.',
        timestamp: new Date().getTime(),
        url: doc.url,
        tags: [],
    },
    {
        body: `Lorem ipsum dolor sit amet, consectetur adipiscing Random  comment at url ${
            doc.url
        }.`,
        highlight:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vestibulum varius dui in cursus. Quisque facilisis ex semper volutpat sodales. Nulla tempus rhoncus ligula ac vehicula. Maecenas eget ante mattis, viverra lectus eu, dapibus ligula. Etiam eu dui vitae nunc laoreet scelerisque quis pharetra ex. Curabitur ex tortor, elementum id cursus at, porttitor a urna. Donec a mauris massa. Donec eget dolor nec metus malesuada egestas et',
        timestamp: new Date().getTime(),
        url: doc.url,
        tags: ['science'],
    },
    {
        body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vestibulum varius dui in cursus. Quisque facilisis ex semper volutpat sodales. Nulla tempus rhoncus ligula ac vehicula. Maecenas eget ante mattis, viverra lectus eu, dapibus ligula. Etiam eu dui vitae nunc laoreet scelerisque quis pharetra ex. Curabitur ex tortor, elementum id cursus at.Random  comment at url ${
            doc.url
        }.`,
        highlight:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vestibulum varius dui in cursus. Quisque facilisis ex semper volutpat sodales. Nulla tempus rhoncus ligula ac vehicula. Maecenas eget ante mattis, viverra lectus eu, dapibus ligula. Etiam eu dui vitae nunc laoreet scelerisque quis pharetra ex. Curabitur ex tortor, elementum id cursus at, porttitor a urna. Donec a mauris massa. Donec eget dolor nec metus malesuada egestas et',
        timestamp: new Date().getTime(),
        url: doc.url,
        tags: ['science', 'lorem', 'donum'],
    },
]
export const fetchAnnotations = doc => {
    return dummyAnnotations(doc)
}
