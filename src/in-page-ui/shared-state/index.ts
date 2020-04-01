import { InPageUIInterface } from './types'
import { RibbonControllerInterface } from '../ribbon/types'
import { SidebarUIControllerInterface } from '../sidebar/types'

export class InPageUI implements InPageUIInterface {
    state: 'ribbon' | 'sidebar' | null = null

    constructor(
        private options: {
            ribbonController: RibbonControllerInterface
            sidebarController: SidebarUIControllerInterface
        },
    ) {}

    showSidebar(options?: {
        action?: 'comment' | 'tag' | 'list' | 'bookmark' | 'annotate'
    }): void {
        if (this.state !== 'sidebar') {
            if (this.state === 'ribbon') {
                this.options.ribbonController.hideRibbon()
            }

            this.options.sidebarController.showSidebar()
            this.state = 'sidebar'
        }
    }

    hideSidebar() {
        if (this.state === 'sidebar') {
            this.options.sidebarController.hideSidebar()
        }

        this.state = null
    }

    toggleSidebar(): void {
        if (this.state === 'sidebar') {
            this.hideSidebar()
        } else {
            this.showSidebar()
        }
    }

    toggleHighlights(): void {}
}
