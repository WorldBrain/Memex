$ = require('jquery')

{ simpleXPathJQuery, simpleXPathPure } = require('./xpath')

Util = {}

# Public: Flatten a nested array structure
#
# Returns an array
Util.flatten = (array) ->
  flatten = (ary) ->
    flat = []

    for el in ary
      flat = flat.concat(if el and $.isArray(el) then flatten(el) else el)

    return flat

  flatten(array)

# Public: Finds all text nodes within the elements in the current collection.
#
# Returns a new jQuery collection of text nodes.
Util.getTextNodes = (jq) ->
  getTextNodes = (node) ->
    if node and node.nodeType != Node.TEXT_NODE
      nodes = []

      # If not a comment then traverse children collecting text nodes.
      # We traverse the child nodes manually rather than using the .childNodes
      # property because IE9 does not update the .childNodes property after
      # .splitText() is called on a child text node.
      if node.nodeType != Node.COMMENT_NODE
        # Start at the last child and walk backwards through siblings.
        node = node.lastChild
        while node
          nodes.push getTextNodes(node)
          node = node.previousSibling

      # Finally reverse the array so that nodes are in the correct order.
      return nodes.reverse()
    else
      return node

  jq.map -> Util.flatten(getTextNodes(this))

# Public: determine the last text node inside or before the given node
Util.getLastTextNodeUpTo = (n) ->
  switch n.nodeType
    when Node.TEXT_NODE
      return n # We have found our text node.
    when Node.ELEMENT_NODE
      # This is an element, we need to dig in
      if n.lastChild? # Does it have children at all?
        result = Util.getLastTextNodeUpTo n.lastChild
        if result? then return result
    else
      # Not a text node, and not an element node.
  # Could not find a text node in current node, go backwards
  n = n.previousSibling
  if n?
    Util.getLastTextNodeUpTo n
  else
    null

# Public: determine the first text node in or after the given jQuery node.
Util.getFirstTextNodeNotBefore = (n) ->
  switch n.nodeType
    when Node.TEXT_NODE
      return n # We have found our text node.
    when Node.ELEMENT_NODE
      # This is an element, we need to dig in
      if n.firstChild? # Does it have children at all?
        result = Util.getFirstTextNodeNotBefore n.firstChild
        if result? then return result
    else
      # Not a text or an element node.
  # Could not find a text node in current node, go forward
  n = n.nextSibling
  if n?
    Util.getFirstTextNodeNotBefore n
  else
    null

Util.xpathFromNode = (el, relativeRoot) ->
  try
    result = simpleXPathJQuery.call el, relativeRoot
  catch exception
    console.log "MEMEX: jQuery-based XPath construction failed! Falling back to manual."
    result = simpleXPathPure.call el, relativeRoot
  result

Util.nodeFromXPath = (xp, root) ->
  steps = xp.substring(1).split("/")
  node = root
  for step in steps
    [name, idx] = step.split "["
    idx = if idx? then parseInt (idx?.split "]")[0] else 1
    node = findChild node, name.toLowerCase(), idx

  node

module.exports = {
  nodeFromXPath: Util.nodeFromXPath,
  xpathFromNode: Util.xpathFromNode,
  getTextNodes: Util.getTextNodes,
  getFirstTextNodeNotBefore: Util.getFirstTextNodeNotBefore,
  getLastTextNodeUpTo: Util.getLastTextNodeUpTo,
}
