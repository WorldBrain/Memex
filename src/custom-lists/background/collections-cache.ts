import { CollectionsCacheInterface, PageList, CollectionStatus } from './types'

export default class CollectionsCache implements CollectionsCacheInterface {
    private collections: Map<number, PageList> = new Map()

    addCollection = (collection: PageList) => {
        this.collections.set(collection.id, collection)
    }

    addCollections = (collections: PageList[]) =>
        collections.forEach(this.addCollection)

    removeCollection = (id: number) => {
        this.collections.delete(id)
    }

    getCollectionStatus = (id: number): CollectionStatus | null => {
        const match = this.collections.get(id)

        if (!match) {
            return null
        }

        return {
            isCollaborative: !!match.isCollaborative,
            isOwn: !match.isFollowed,
        }
    }

    getCollectionsByStatus = ({
        isOwn,
        isCollaborative,
    }: CollectionStatus): PageList[] => {
        const collections: PageList[] = []

        for (const collection of this.collections.values()) {
            if (
                !!collection.isCollaborative === isCollaborative &&
                !!collection.isFollowed !== isOwn
            ) {
                collections.push(collection)
            }
        }

        return collections
    }
}
