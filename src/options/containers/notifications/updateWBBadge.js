import setUnreadCount from "../../../util/setUnreadCount.js"

// export default function updateWBBadge() {
//     setUnreadCount(0).then(function(res) {
//         var ba = chrome.browserAction
//         ba.setBadgeBackgroundColor({ color: [62, 185, 149, 128] })
//         if (res > 0) {
//             ba.setBadgeText({ text: "" + res })
//         } else {
//             ba.setBadgeText({ text: "" })
//         }
//     })
//         .catch(function(err) {
//             console.log("err")
//         })
// }

export default async function updateWBBadge() {
    let ba = chrome.browserAction
    try {
        let res = await setUnreadCount(0)
        await ba.setBadgeBackgroundColor({ color: [62, 185, 149, 128] })
        await ba.setBadgeText({ text: "" + res })
    } catch (err) {
        console.err("err", err)
    }
};

// async function doAsyncOp () {
//     try {
//     var val = await asynchronousOperation();
//     val = await asynchronousOperation(val);
//     return await asynchronousOperation(val);
//   } catch (err) {
//     console.err(err);
//   }
// };
