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
    function d3_layout_treeAncestor(vim, node, ancestor) {
      return vim._tree.ancestor.parent == node.parent ? vim._tree.ancestor : ancestor;
    }
    function d3_layout_renderedTextSize(string, fontSize) {
        var paper = Raphael(0, 0, 0, 0);
            paper.canvas.style.visibility = 'hidden';
        var el = paper.text(0, 0, string);
            el.attr('font-size', fontSize);
        var bBox = el.getBBox();
        paper.remove();
        return {
            width: bBox.width,
            height: bBox.height
        };
    }
    function d3_layout_computeDepthGap(root, width, textMargin, textSize){
      var minGap = Number.MAX_VALUE;
      d3_layout_treeVisitAfter(root, function(node, previousSibling){
          if (!node.children || !node.children.length) {
            var myTextLength=0;
            if (node.name) {
              myTextLength = d3_layout_renderedTextSize(node.name, textSize).width;
            }
            if (node.depth>0) {
              var myGap = (width - 2*textMargin - myTextLength)/node.depth
              if (myGap < minGap)
                minGap = myGap;
            }
          }
        });      
      return minGap;
    }
    function removeDuplicates(subTreeRoots) {
      var subTreeRootsNeedMerge=new Array();
      subTreeRoots.forEach(function(d){
        if (subTreeRootsNeedMerge.indexOf(d)<0)
          subTreeRootsNeedMerge.push(d);
      });
      return subTreeRootsNeedMerge;
    }
    function nearestCommonAncestorOrdered(subTreeRoots){
      var subTreeRoots = subTreeRoots.slice(0);
      var minDepth = d3.min(subTreeRoots, function(d){
        return d.depth;
      });
      
      for (var i=0;i<subTreeRoots.length;i++) {
        while (subTreeRoots[i].depth>minDepth) {
          subTreeRoots[i] = subTreeRoots[i].parent;
        }
      }
      
      subTreeRoots = removeDuplicates(subTreeRoots);
      var lastSubTreeRoots=null;
      while (subTreeRoots.length>1) {
        lastSubTreeRoots=subTreeRoots.slice(0);
        for (var i=0;i<subTreeRoots.length;i++) {
          subTreeRoots[i] = subTreeRoots[i].parent;
        }
        subTreeRoots = removeDuplicates(subTreeRoots);
      }
      if (lastSubTreeRoots==null)
        return null;

      if (subTreeRoots.length==1)
      {
        var ancestor = subTreeRoots[0];
        var correctOrderedChildren=new Array();
        lastSubTreeRoots.forEach(function(d){
          correctOrderedChildren.push({"node":d,"idx":ancestor.children.indexOf(d)});
        });
        correctOrderedChildren.sort(function(a,b){
          return a.idx-b.idx;
        });
        var orderedChildren=new Array();
        var lastIdx=correctOrderedChildren[0].idx-1;
        correctOrderedChildren.forEach(function(d){
          if (d.idx != lastIdx+1){
            lastIdx=-1;
            return;
          }
          lastIdx+=1;
          orderedChildren.push(d.node);
        });
        if (lastIdx>=0)
          return [ancestor,orderedChildren];
        else
          return null;
      }
      else
        return null;
    }
    function changeDepth(root,deltaDepth) {
      root.depth+=deltaDepth;
      if (root.children && root.children.length)
        root.children.forEach(function(d) {
          changeDepth(d,deltaDepth);
        });
    }
    function d3_layout_cutEdgeMergeRear(selectedSubTrees) {
      if (selectedSubTrees && selectedSubTrees.length==1) {
        var selectedParent = selectedSubTrees[0].parent;
        var selectedChild = selectedSubTrees[0];
        var selectedGrandChildren = selectedChild.children;
        if (selectedGrandChildren && selectedGrandChildren.length) {
          var childIdx = selectedParent.children.indexOf(selectedChild);
          selectedParent.children.splice(childIdx,1);
          selectedGrandChildren.forEach(function(e){
            e.parent = selectedParent;
            changeDepth(e,-1);
            selectedParent.children.splice(childIdx,0,e);
            childIdx++;
          });
        }
        return selectedParent;
      }
      return null;
    }
    function d3_layout_cutEdgeMergeFront(selectedSubTrees) {
      //can only remove first child or last child
      if (selectedSubTrees && selectedSubTrees.length==1) {
        var selectedParent = selectedSubTrees[0].parent;
        var selectedChild = selectedSubTrees[0];
        if (selectedParent.depth!=0) {
          var grandParent = selectedParent.parent;
          //if it's root-> leaf, don't cut
          if (selectedParent.children.length==1) {
            // single child, should remove the parent node
            for (var i=0;i<grandParent.children.length;i++)
              if (grandParent.children[i] == selectedParent)
              {
                grandParent.children[i] = selectedChild;
                selectedChild.parent = grandParent;
                changeDepth(selectedChild,-1);
                break;
              }
          }
          else if (selectedParent.children[0] == selectedSubTrees[0]) {
            //first child
            for (var i=0;i<grandParent.children.length;i++)
              if (grandParent.children[i] == selectedParent)
              {
                grandParent.children.splice(i,0,selectedChild); selectedChild.parent = grandParent;
                selectedParent.children.splice(0,1);
                changeDepth(selectedChild,-1);
                break;
              }
          } else if
          (selectedParent.children[selectedParent.children.length-1] == selectedSubTrees[0]) {
            //last child
            for (var i=0;i<grandParent.children.length;i++)
              if (grandParent.children[i] == selectedParent)
              {
                grandParent.children.splice(i+1,0,selectedChild);
                selectedChild.parent = grandParent;
                selectedParent.children.splice(selectedParent.children.length-1,1);
                changeDepth(selectedChild,-1);
                break;
              }
          }
          return grandParent;
        }
      }
      return null;
    }
    function addMergeNode(parentNode, childrenNodes) {
      var newNode={};
      newNode.parent = parentNode;
      newNode.children= childrenNodes;
      newNode.depth= parentNode.depth+1;
      childrenNodes.forEach(function(d){
        d.parent=newNode;
        changeDepth(d,1);
      });
      var newChildren=new Array();
      var newNodeAdded=false;
      parentNode.children.forEach(function(d) {
        if (childrenNodes.indexOf(d)<0)
          newChildren.push(d);
        else
          if (!newNodeAdded) {
            newChildren.push(newNode);
            newNodeAdded=true;
          }
      });
      parentNode.children = newChildren;
    }
    function d3_layout_mergeSelectedSubTrees(selectedSubTrees){
      if (selectedSubTrees && selectedSubTrees.length) {
        var ancestorChildren = nearestCommonAncestorOrdered(selectedSubTrees);
        if (ancestorChildren)
        {
          var ancestor = ancestorChildren[0];
          var aChildren = ancestorChildren[1];
          addMergeNode(ancestor,aChildren);
          return ancestor;
        }
        return null;
      }
      return null;
    }
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, height = 1, width = 1, nodeSize = false, textSize=10, textMargin=10;
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
      var depthGap = d3_layout_computeDepthGap(root, width, textMargin, textSize);
      d3_layout_treeVisitAfter(root, !nodeSize ? function(node) {
        node.x *= height;
        node.y = node.depth * depthGap+textMargin;
        node.collapse = function(){d3_layout_collapse(this);};
        delete node._tree;
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * height;
        node.y = node.depth / y1 * depthGap + textMargin;
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
    sentenceTree.textSize = function(x) {
      if (!arguments.length) return textSize>0 ? textSize : null;
      if (x>0)
        textSize = x;
      return sentenceTree;
    };
    sentenceTree.textMargin = function(x) {
      if (!arguments.length) return textMargin>0 ? textMargin : null;
      if (x>0)
        textMargin = x;
      return sentenceTree;
    };
    sentenceTree.cutEdgeMergeRear = d3_layout_cutEdgeMergeRear;
    sentenceTree.cutEdgeMergeFront = d3_layout_cutEdgeMergeFront;
    sentenceTree.mergeSelectedSubTrees = d3_layout_mergeSelectedSubTrees;

    return d3_layout_hierarchyRebind(sentenceTree, hierarchy);
  };
