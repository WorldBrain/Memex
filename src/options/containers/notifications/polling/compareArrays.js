import db from "../../../../pouchdb"
import desktopNotification from "./desktopNotification"

export default async function compareArrays(arr1) {
    console.log("compareArrays")
    
    db
        .allDocs({
            include_docs: true,
            attachments: true,
            startkey: "notif",
            endkey: "notif\ufff0",
        })
        // .then(res => 
        // console.log('arr1', arr1, 'arr2', res.rows)
        // return difference = arr1.filter(x => (res.rows).indexOf(x) == -1);
        // ).then(difference => 

        // if (difference > 0) {
        //  desktopNotification()
    // }).catch(err => console.log(err))
   
// if itemToCount < items 



}
