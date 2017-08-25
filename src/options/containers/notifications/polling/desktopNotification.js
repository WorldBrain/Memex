export default async function desktopNotification() {
    console.log("desktopNotification")
    
    // document.addEventListener("DOMContentLoaded", function() {
    //     if (Notification.permission !== "granted")
    //         Notification.requestPermission();
    // });

    
        // if (!Notification) {
        //     alert(
        //         "Desktop notifications not available in your browser. Try Chromium."
        //     );
        //     return;
        // }

        // if (Notification.permission !== "granted")
        //     Notification.requestPermission();
        // else {
            var notification = new Notification("Notification title", {
                icon:
                    "http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png",
                body: "Hey there! You've been notified!"
            });

            notification.onclick = function() {
                window.open(
                    "chrome-extension://jpadmikhkbmpcenfjkimlicjjghmiddh/options/options.html#/notifications"
                );
            };
        }
