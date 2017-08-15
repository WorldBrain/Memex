import setUnreadCount from 'src/util/setUnreadCount.js'

setUnreadCount(0).then(function(res) {
    // let badge = document.getElementById('notifs')
    if (res === 0) {
        badge.removeAttribute("className")
    } else {
        // badge.setAttribute("data-badge", res)
        let badge = document.getElementById('notifs').innerHTML
        console.log("res", res)
        console.log(badge.innerHTML)
    }
})
    .catch(function(err) {
        console.log("err")
    })
