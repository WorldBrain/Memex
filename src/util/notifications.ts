import { Notifications, browser } from 'webextension-polyfill-ts'

import {
    CreateNotification,
    NotifOpts,
    NotificationCreator,
    NotificationClickListener,
} from 'src/util/notification-types'
import browserIsChrome from './check-browser'

export const DEF_ICON_URL = '/img/worldbrain-logo-narrow.png'
export const DEF_TYPE = 'basic'

export interface Props {
    notificationsAPI: Notifications.Static
    browserIsChrome: () => boolean
}

export class Creator implements NotificationCreator {
    private onClickListeners = new Map<string, NotificationClickListener>()

    static DEF_OPTS: Partial<NotifOpts> = {
        type: DEF_TYPE,
        iconUrl: DEF_ICON_URL,
        requireInteraction: true,
    }

    constructor(private props: Props) {}

    /**
     * Firefox supports only a subset of notif options. If you pass unknowns, it throws Errors.
     * So filter them down if browser is FF, else nah.
     */
    private filterOpts({
        type,
        iconUrl,
        title,
        message,
        ...rest
    }: NotifOpts): NotifOpts {
        const opts = { type, iconUrl, title, message }
        return !this.props.browserIsChrome() ? opts : { ...opts, ...rest }
    }

    create: CreateNotification = async (notifOptions, onClick = f => f) => {
        const id = await this.props.notificationsAPI.create(
            this.filterOpts({
                ...Creator.DEF_OPTS,
                ...(notifOptions as NotifOpts),
            }),
        )

        this.onClickListeners.set(id, onClick)

        return
    }

    setupListeners = () =>
        this.props.notificationsAPI.onClicked.addListener(id => {
            this.props.notificationsAPI.clear(id)

            this.onClickListeners.get(id)(id)
            this.onClickListeners.delete(id)
        })
}

const instance = new Creator({
    notificationsAPI: browser.notifications,
    browserIsChrome,
})

export const setupNotificationClickListener = instance.setupListeners

export default instance.create
