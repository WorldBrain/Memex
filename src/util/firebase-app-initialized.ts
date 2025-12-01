import firebase from 'firebase/compat/app'
import 'firebase/compat/functions'
import 'firebase/compat/firestore'
import 'firebase/compat/storage'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_MEMEX_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_MEMEX_AUTH_DOMAIN,
    // databaseURL: import.meta.env.VITE_FIREBASE_MEMEX_DATABSE_URL,
    projectId: import.meta.env.VITE_FIREBASE_MEMEX_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MEMEX_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_MEMEX_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEMEX_MEASUREMENT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_MEMEX_STORAGE_BUCKET,
}

export const getFirebase = () => {
    console.log('firebase config', firebaseConfig)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig)
    }

    return firebase
}
