  d3.layout.sentenceTree = function() {
    function d3_layout_hierarchyRebind(object, hierarchy) {
      d3.rebind(object, hierarchy, "sort", "children", "value");
      object.nodes = object;
      object.links = d3_layout_hierarchyLinks;
      return object;
    }
    function d3_layout_hierarchyChildren(d) {
      return d.children;
    }
    function d3_layout_hierarchyValue(d) {
      return d.value;
    }
    function d3_layout_hierarchySort(a, b) {
      return b.value - a.value;
    }
    function d3_layout_hierarchyLinks(nodes) {
      return d3.merge(nodes.map(function(parent) {
        return (parent.children || []).map(function(child) {
          return {
            source: parent,
            target: child
          };
        });
      }));
    }
    function d3_layout_treeSeparation(a, b) {
      return a.parent == b.parent ? 1 : 2;
    }
    function d3_layout_treeLeft(node) {
      var children = node.children;
      return children && children.length ? children[0] : node._tree.thread;
    }
    function d3_layout_treeRight(node) {
      var children = node.children, n;
      return children && (n = children.length) ? children[n - 1] : node._tree.thread;
    }
    function d3_layout_treeSearch(node, compare) {
      var children = node.children;
      if (children && (n = children.length)) {
        var child, n, i = -1;
        while (++i < n) {
          if (compare(child = d3_layout_treeSearch(children[i], compare), node) > 0) {
            node = child;
          }
        }
      }
      return node;
    }
    function d3_layout_treeRightmost(a, b) {
      return a.x - b.x;
    }
    function d3_layout_treeLeftmost(a, b) {
      return b.x - a.x;
    }
    function d3_layout_treeDeepest(a, b) {
      return a.depth - b.depth;
    }
    function d3_layout_treeVisitAfter(node, callback) {
      function visit(node, previousSibling) {
        var children = node.children;
        if (children && (n = children.length)) {
          var child, previousChild = null, i = -1, n;
          while (++i < n) {
            child = children[i];
            visit(child, previousChild);
            previousChild = child;
          }
        }
        callback(node, previousSibling);
      }
      visit(node, null);
    }
    function d3_layout_treeShift(node) {
      var shift = 0, change = 0, children = node.children, i = children.length, child;
      while (--i >= 0) {
        child = children[i]._tree;
        child.prelim += shift;
        child.mod += shift;
        shift += child.shift + (change += child.change);
      }
    }
    function d3_layout_treeMove(ancestor, node, shift) {
      ancestor = ancestor._tree;
      node = node._tree;
      var change = shift / (node.number - ancestor.number);
      ancestor.change += change;
      node.change -= change;
      node.shift += shift;
      node.prelim += shift;
      node.mod += shift;
    }
    function d3_layout_treeAncestor(vim, node, ancestor) {
      return vim._tree.ancestor.parent == node.parent ? vim._tree.ancestor : ancestor;
    }
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, height = 1, width = 1, nodeSize = false;
    function sentenceTree(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0];
      function d3_layout_numLeaves(root){
        d3_layout_treeVisitAfter(root, function(node, previousSibling){
            if (!node.children || !node.children.length)
              node._numLeaves=1;
            else{
              node._numLeaves=0;
              for (var i=0;i<node.children.length;i++)
                node._numLeaves+=node.children[i]._numLeaves;
            }
          }
        );
      }
      function d3_layout_assignNodeHeights(root){
        //total height is 1
        var leafIndex=0;
        var totalLeaves = root._numLeaves;
        var leaveGap = 1.0/(totalLeaves+1);
        d3_layout_treeVisitAfter(root, function(node, previousSibling){
            if (!node.children || !node.children.length)
            {
              //leaf
              node.x = leaveGap*(leafIndex+1);
              leafIndex++;
            }
            else{
              node.x=0;
              for (var i=0;i<node.children.length;i++)
                node.x+=node.children[i].x;
              node.x = node.x*1.0/node.children.length;
            }
          }
        );
      }
      function d3_layout_collapseName(root){
        var name = root.name?root.name:"";
        var children = root.children?root.children:[];
        children.forEach(function(c){
            var cName = d3_layout_collapseName(c);
            if (cName && cName.length)
              name = name.concat(" ").concat(cName);
          }
        );
        return name;
      }
      function d3_layout_collapse(root) {
        if (root.children) {
          root._children = root.children;
          root._name = root.name;
          root.name = d3_layout_collapseName(root);
          root.children = null;
        }
        else if (root._children)
        {
          root.children = root._children;
          root._children = null;
          root.name = root._name;
          root._name = null;
        }
      }
      d3_layout_treeVisitAfter(root, function(node, previousSibling) {
        node._tree = {
          ancestor: node,
          prelim: 0,
          mod: 0,
          change: 0,
          shift: 0,
          number: previousSibling ? previousSibling._tree.number + 1 : 0
        };
      });
      var left = d3_layout_treeSearch(root, d3_layout_treeLeftmost), right = d3_layout_treeSearch(root, d3_layout_treeRightmost), deep = d3_layout_treeSearch(root, d3_layout_treeDeepest), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2, y1 = deep.depth || 1;
      d3_layout_numLeaves(root);
      d3_layout_assignNodeHeights(root);
      d3_layout_treeVisitAfter(root, !nodeSize ? function(node) {
        node.x *= height;
        node.y = node.depth * width;
        node.collapse = function(){d3_layout_collapse(this);};
        delete node._tree;
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * height;
        node.y = node.depth / y1 * width;
        node.collapse = function(){d3_layout_collapse(this);};
        delete node._tree;
      });
      return nodes;
    }

    sentenceTree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return sentenceTree;
    };
    sentenceTree.size = function(x) {
      if (!arguments.length) return nodeSize ? null : [height,width];
      height = x[0];
      width = x[1];
      nodeSize = height == null;
      return sentenceTree;
    };
    sentenceTree.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? [height, width] : null;
      height = x[0];
      width = x[1];
      nodeSize = height != null;
      return sentenceTree;
    };
    return d3_layout_hierarchyRebind(sentenceTree, hierarchy);
  };
