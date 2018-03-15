import 'babel-polyfill'
import './background'
Symbol.asyncIterator =
    Symbol.asyncIterator || Symbol.for('Symbol.asyncIterator')
