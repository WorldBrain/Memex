import * as firebase from 'firebase/app'

const firebaseConfig = {
    staging: {
        apiKey: 'AIzaSyCyxWY7qZSWlncB_JDYOSzeTOfRnYhNcS8',
        authDomain: 'worldbrain-staging.firebaseapp.com',
        databaseURL: 'https://worldbrain-staging.firebaseio.com',
        projectId: 'worldbrain-staging',
        messagingSenderId: '840601505816',
        appId: '1:840601505816:web:69fbb7a789882e399fb36d',
    },
    // TODO: Add production keys
    production: {
        apiKey: 'AIzaSyCyxWY7qZSWlncB_JDYOSzeTOfRnYhNcS8',
        authDomain: 'worldbrain-staging.firebaseapp.com',
        databaseURL: 'https://worldbrain-staging.firebaseio.com',
        projectId: 'worldbrain-staging',
        messagingSenderId: '840601505816',
        appId: '1:840601505816:web:69fbb7a789882e399fb36d',
    },
}

if (!firebase.apps.length) {
    firebase.initializeApp(
        process.env.NODE_ENV === 'production'
            ? firebaseConfig.production
            : firebaseConfig.staging,
    )
}
export { firebase }
