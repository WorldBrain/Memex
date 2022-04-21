import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/functions'
import 'firebase/firestore'

const firebaseConfig = {
    apiKey: process.env.FIREBASE_MEMEX_API_KEY,
    authDomain: process.env.FIREBASE_MEMEX_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_MEMEX_DATABSE_URL,
    projectId: process.env.FIREBASE_MEMEX_PROJECT_ID,
    messagingSenderId: process.env.FIREBASE_MEMEX_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_MEMEX_APP_ID,
    measurementId: process.env.FIREBASE_MEMEX_MEASUREMENT_ID,
    storageBucket: process.env.FIREBASE_MEMEX_STORAGE_BUCKET,
}

export const getFirebase = () => {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig)
    }
    return firebase
}
