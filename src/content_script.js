import 'babel-polyfill'
import { RemoteFunctionRegistry } from './util/webextensionRPC'
import 'src/activity-logger/content_script'
import 'src/page-analysis/content_script'
import 'src/search-injection/content_script'
import initContentTooltip from 'src/content-tooltip/content_script'
import 'src/direct-linking/content_script'
import initRibbon from './sidebar-overlay/content_script'
import 'src/backup/content_script'
import ToolbarNotifications from 'src/toolbar-notification/content_script'

const remoteFunctionRegistry = new RemoteFunctionRegistry()

const toolbarNotifications = new ToolbarNotifications()
toolbarNotifications.registerRemoteFunctions(remoteFunctionRegistry)
// toolbarNotifications.showToolbarNotification('tooltip-first-close')
window['toolbarNotifications'] = toolbarNotifications

initContentTooltip({ toolbarNotifications })
initRibbon({ toolbarNotifications })
