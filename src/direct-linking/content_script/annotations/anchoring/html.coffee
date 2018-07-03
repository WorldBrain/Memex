{
  FragmentAnchor
  RangeAnchor
  TextPositionAnchor
  TextQuoteAnchor
} = require('./types')


querySelector = (type, root, selector, options) ->
  doQuery = (resolve, reject) ->
    try
      anchor = type.fromSelector(root, selector, options)
      range = anchor.toRange(options)
      resolve(range)
    catch error
      reject(error)
  return new Promise(doQuery)


###*
# Anchor a set of selectors.
#
# This function converts a set of selectors into a document range.
# It encapsulates the core anchoring algorithm, using the selectors alone or
# in combination to establish the best anchor within the document.
#
# :param Element root: The root element of the anchoring context.
# :param Array selectors: The selectors to try.
# :param Object options: Options to pass to the anchor implementations.
# :return: A Promise that resolves to a Range on success.
# :rtype: Promise
####
exports.anchor = (root, selectors, options = {}) ->
  # Selectors
  fragment = null
  position = null
  quote = null
  range = null

  # Collect all the selectors
  for selector in selectors ? []
    switch selector.type
      when 'FragmentSelector'
        fragment = selector
      when 'TextPositionSelector'
        position = selector
        options.hint = position.start  # TextQuoteAnchor hint
      when 'TextQuoteSelector'
        quote = selector
      when 'RangeSelector'
        range = selector

  # Assert the quote matches the stored quote, if applicable
  maybeAssertQuote = (range) ->
    if quote?.exact? and range.toString() != quote.exact
      throw new Error('quote mismatch')
    else
      return range

  # From a default of failure, we build up catch clauses to try selectors in
  # order, from simple to complex.
  promise = Promise.reject('unable to anchor')

  if quote?
    promise = promise.catch ->
      # Note: similarity of the quote is implied.
      return querySelector(TextQuoteAnchor, root, quote, options)

  if fragment?
    promise = promise.catch ->
      return querySelector(FragmentAnchor, root, fragment, options)
      .then(maybeAssertQuote)

  if range?
    promise = promise.catch ->
      return querySelector(RangeAnchor, root, range, options)
      .then(maybeAssertQuote)

  if position?
    promise = promise.catch ->
      return querySelector(TextPositionAnchor, root, position, options)
      .then(maybeAssertQuote)

  
  return promise


exports.describe = (root, range, options = {}) ->
  types = [FragmentAnchor, RangeAnchor, TextPositionAnchor, TextQuoteAnchor]

  selectors = for type in types
    try
      anchor = type.fromRange(root, range, options)
      selector = anchor.toSelector(options)
    catch
      continue

  return selectors
  