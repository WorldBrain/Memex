export default async function desktopNotification() {
    console.log("desktopNotification")
    document.addEventListener("DOMContentLoaded", function() {
        if (Notification.permission !== "granted") {
            Notification.requestPermission()
        }
    })
    if (!Notification) {
        alert(
            "Desktop notifications not available in your browser. Try Chromium."
        );
        return;
    }

    if (Notification.permission !== "granted") {
        Notification.requestPermission()
    } else {
        var notification = new Notification("You have a new notification!", {
            icon: "img/worldbrain-logo-narrow-bw.png",
            body: "Click to view"
        });

        notification.onclick = function() {
            window.open(
                "chrome-extension://jpadmikhkbmpcenfjkimlicjjghmiddh/options/options.html#/notifications"
            );
        };
    }
}
