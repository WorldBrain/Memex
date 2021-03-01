import * as Global from './global'
Global.main({ loadRemotely: false }).then((inPageUI) => {
    inPageUI.events.on('stateChanged', (event) => {
        const sidebarState = event?.changes?.sidebar

        if (sidebarState === true) {
            document.body.classList.add('memexSidebarOpen')
        } else if (sidebarState === false) {
            document.body.classList.remove('memexSidebarOpen')
        }
    })
})
