import setUnreadCount from 'src/util/setUnreadCount.js'

setUnreadCount(0).then(function(res) {
    let badge = document.getElementById('notifs')
    // badge.innerHTML = 'feedback'
    badge.setAttribute("data-badge", res)
    console.log('does this run?')
    console.log(badge.innerHTML)
})
    .catch(function(err) {
        console.log("err")
    })
