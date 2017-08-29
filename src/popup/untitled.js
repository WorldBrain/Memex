class Whatever extends React.Component {
  state = { // Default state
    notifs = [],
    isLoading: false,
    isError: false,
  } 

  async componentDidMount() {
     try {
       this.setState(state => ({ ...state, isLoading: true })) 
       // Set the loading state right before the async call
       const notifs = await setUnreadCount()  
       // Do the async call
       this.setState(state => ({ ...state, notifs })) 
       // Set the newly received notifs (only gets here after some time if everything is OK)
    } catch (error) {
       this.setState(state => ({ ...state, isError: true })) 
       // Set error state (only gets here if some error happened in the fetchNotifs call)
    } finally {
      this.setState(state => ({ ...state, isLoading: false })) 
      // Finally turn off the loading state (it will always get here, no matter if an error was encountered or not)
    }
  }
}

  <LinkButton href={`${optionsURL}#/notifications`} icon='notifications'>
      Notifications <span
          className={
              this.state.unread ? styles.badge : styles.nobadge
          }>{this.state.unreadCount} 

          </span>
  </LinkButton>

          let res = await setUnreadCount()
                console.log("popup res", res)
        if (res === 0) {
            this.setState({unread: false})
        } else {
            this.setState({unread: true})
            this.setState(state => ({ ...state, unreadCount: res }))
        }
    }
render() {
  return (
    <ul>
       {this.state.isLoading
         ? <li>Loading... please wait</li>
         : this.state.notifs.map((notif, count) => <li key={count}>{notif.message}
          </li>
       })
    </ul>
  )
}