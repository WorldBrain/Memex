import leveljs from 'level-js'
import { AbstractLevelDOWN, AbstractChainedBatch } from 'abstract-leveldown'

class ChainedBatch extends AbstractChainedBatch {
    static INIT_STATE = []

    constructor(db) {
        super(db)
        this.operations = ChainedBatch.INIT_STATE
        this.db = db
    }

    get length() {
        return this.operations.length
    }

    runStandardMethod = newState => {
        this.operations = newState
        return this
    }

    _put = (key, value) =>
        this.runStandardMethod([
            ...this.operations,
            { type: 'put', key, value },
        ])

    _del = key =>
        this.runStandardMethod([...this.operations, { type: 'del', key }])

    _clear = () => this.runStandardMethod(ChainedBatch.INIT_STATE)

    _write = done => this.db.batch(this.operations, {}, done)
}

class LevelJS extends AbstractLevelDOWN {
    constructor(location) {
        super(location)
        this.instance = leveljs(location)
    }

    getStandardOverride = methodName => (...args) =>
        this.instance[methodName](...args)

    _open = this.getStandardOverride('open')
    _put = this.getStandardOverride('put')
    _del = this.getStandardOverride('del')
    _get = this.getStandardOverride('get')
    _batch = this.getStandardOverride('batch')
    _chainedBatch = () => new ChainedBatch(this)
}

export default LevelJS
