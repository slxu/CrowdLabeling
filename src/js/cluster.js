(function(){
d3.cluster = function(){
  var cluster = {};
  var w = document.getElementById('chart').clientWidth,
      h = document.getElementById('chart').clientHeight,
      ratio = w / h,
      fill = d3.scale.category10(),
      nodeData = [],
      linkData = [],
      groupData = [],
      idToGroup = {},
      nodeBundle = null,
      textBundle = null,
      force = null;

  var cX = w / 2,
      cY = h / 2,
      marginLeft = 50,
      marginRight = 50,
      marginTop = 50,
      marginBottom = 50,
      nodeRadius = 12,
      gravity = .03,
      kForceX = 100 / ratio,
      kForceY = 70;

  var multiGroups = function() {
    var g = [];
    groupData.forEach(function(d) {
      if (d.nodes.length > 1)
        g.push(d);
    });
    return g;
  };

  var svg = d3.select("#chart").append("svg")
        .attr("width", w)
        .attr("height", h);

    svg.style("opacity", 1e-6)
      .transition()
        .duration(1000)
        .style("opacity", 1);

  function initNode(){
    // init node position
    var row = Math.floor(Math.sqrt(nodeData.length / ratio)) + 1;
    var column = Math.floor(row * ratio) + 1;
    console.log(row + 'x' + column);
    var index = 0;
    var margin = 100;
    var xGap = (w-margin*2)/column;
    var yGap = (h-margin*2)/row;
    for (var i = 0; i < row; i++) {
      for (var j = 0; j < column; j++) {
        var node = nodeData[index];
        node.x = 100 + j * xGap;
        node.y = 100 + i * yGap;
        node.links = [];
        // node.index = index + 1;
        // node.abbrText = "token" + (index+1);
        createNewGroup([node]);

        index ++;
        // console.log(index);
        if (index == nodeData.length)
          return;
      }
    }
  }

  cluster.start = function(filename) {
    d3.json(filename, function(obj) {
      nodeData = obj['items'];
      initNode();

      force = d3.layout.force()
        .nodes(nodeData)
        .links([])
        .size([w, h])
        .gravity(gravity)
        .start();

      var drag = d3.behavior.drag()
        .origin(d3.d3_identity)
        .on("dragstart.force", dragstart)
        .on("drag.force", dragmove)
        .on("dragend.force", dragend);

      nodeBundle = svg.selectAll("g.bundle")
          .data(nodeData)
        .enter().append("g")
          .attr("class", "bundle")
          .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
          })
          .call(drag);

      nodeBundle.append("circle")
        .attr("class", "shadow")
        .attr("r", nodeRadius * 2.5)
          .style("fill", 'red')
          .style("opacity", .2)
          .style("visibility", "hidden");

      nodeBundle.append("circle")
        .attr("class", "node")
        .attr("r", nodeRadius)
        .style("fill", nodeFill)
        .style("stroke", function(d, i) { return d3.rgb(d.groupId).darker(2); })
        .style("stroke-width", 1.5)
        .append("title")
          .text(function(d) { return d.text; });

      nodeBundle.append("text")
        .attr("text-anchor", "middle")
        .attr("y", (nodeRadius + 10) + "px")
        .attr("fill", "#000")
        .attr("stroke", "#000")
        .attr("stroke-width", ".5px")
        .attr("font-size", "11px")
        .text(function(d) { return d.abbrText; });

      nodeBundle.append("text")
        .attr("text-anchor", "middle")
        .attr("y", "5px")
        .attr("fill", "#fff")
        .attr("stroke", "#fff")
        .attr("stroke-width", ".5px")
        .attr("font-size", "15px")
        .text(function(d) { return d.index + 1; });

      force.on("tick", function(e) {
        // Push different nodes in different directions for clustering.
        nodeData.forEach(function(o, i) {
          var group = idToGroup[o.groupId];
          var forceX = (group.cx - cX) / kForceX;
          var forceY = (group.cy - cY) / kForceY;
          o.x += forceX * e.alpha;
          o.y += forceY * e.alpha;
        });

        updateTempLink();
        updateLink();
        updateNodeBundle();
        updateGroupShadow();
      });
    });
  }

var dragNode = null;
var selectedNode = null;

function dragmove(d) {
  d.px = d3.event.x, d.py = d3.event.y;
  force.resume();
  updateSelectedNode(d);
}

function dragstart(d) {
  d.fixed |= 2;
  dragNode = d;
  selectedNode = null;
  removeElement(idToGroup[d.groupId].nodes, d);

  var group = idToGroup[d.groupId];
  // console.log("[drag] node: " + d.x + "," + d.y); 
  // console.log("[drag] group " + group.id + ": " + group.cx + "," + group.cy);

  svg.selectAll("circle.shadow")
    .style("visibility", "visible");
}

function dragend(d) {
  d.fixed &= ~6;
  
  svg.selectAll("circle.shadow").style("visibility", "hidden");

  var oldGroup = idToGroup[d.groupId];
  if (selectedNode != null) {
    var newGroup = idToGroup[selectedNode.groupId];
    if (newGroup != oldGroup) {
      var connected = connectedComponent(d);
      connected.forEach(function(v) {
        v.groupId = newGroup.id;
        newGroup.nodes.push(v);
        removeElement(oldGroup.nodes, v);
      });
    } else {
      oldGroup.nodes.push(d);
    }

    addLink(d, selectedNode);

  } else {
    oldGroup.nodes.push(d);
  }

  if (oldGroup.nodes.length == 0)
    removeGroup(oldGroup);
  else
    updateGroupCenter(oldGroup);

  dragNode = null;
  selectedNode = null;
  updateTempLink(); // will remove temp links
}

function updateSelectedNode(v) {
  selectedNode = null;

  var candidate = null;
  var minDist = w * w;
  for (var i = 0; i < nodeData.length; i++) {
    var node = nodeData[i];
    if (v == node)
      continue;
    var dist = (v.x - node.x)*(v.x - node.x) + (v.y - node.y)*(v.y - node.y);
    if (dist < minDist) {
      minDist = dist;
      candidate = node;
    } 
  }

  if (minDist <= 20*nodeRadius*nodeRadius) {
    selectedNode = candidate;
  }
}

function updateNodeBundle() {
  nodeBundle
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  svg.selectAll("circle.node")
    .style("fill", nodeFill)
    .style("stroke", function(d, i) { return d3.rgb(d.groupId).darker(2); });
}

function updateTempLink() {
  var data = [];
  
  if (dragNode != null && selectedNode != null) {
    data = [{
      source: dragNode,
      target: selectedNode
    }];
  }
  var templink = svg.selectAll("path.templink")
      .data(data)
      .attr("d", linkPath);

  templink.enter().insert("path", "g")
    .attr("class", "templink");

  templink.exit().remove();
}

function updateLink() {
  var link = svg.selectAll("path.link")
    .data(linkData)
      .attr("d", linkPath);

  link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", linkPath)
    .on("click", removeLink);

  link.exit().remove();
}

function updateGroupShadow() {
  var groupShadow = svg.selectAll("path.group")
    .data(multiGroups())
      .attr("d", groupPath)
      .style("fill", groupFill)
      .style("stroke", groupFill);

  groupShadow.enter().insert("path", ".link")
    .attr("class", "group")
    .style("stroke-width", 40)
    .style("stroke-linejoin", "round")
    .style("opacity", .2)
    .attr("d", groupPath);

  groupShadow.exit().remove();
}

function addLink(src, dst) {
  var link = {source: src, target: dst}
  linkData.push(link);
  src.links.push(link);
  dst.links.push(link);
}

function removeLink(d) {
  removeElement(linkData, d);
  var src = d.source;
  var dst = d.target;
  removeElement(src.links, d);
  removeElement(dst.links, d);
  svg.selectAll("path.link")
    .data(linkData)
      .exit().remove();

  var group = idToGroup[src.groupId];
  var srcConnected = connectedComponent(src);
  var dstConnected = connectedComponent(dst);

  if (!(src in dstConnected)) {
    var splitOut;
    if (srcConnected.length >= dstConnected.length)
      splitOut = dstConnected;
    else 
      splitOut = srcConnected;
    
    var newGroup = createNewGroup(splitOut);
    splitOut.forEach(function(v) {
      removeElement(group.nodes, v);
    });

    updateGroupCenter(group);
    updateGroupCenter(newGroup);
    
    updateGroupShadow();
    updateLink();
    updateNodeBundle();
  }
}

function groupPath(d) { 
  return "M" + convexhull(d.nodes).join("L") + "Z"; 
}

function linkPath(d) {
  return "M" + d.source.x + "," + d.source.y
    + "L" + d.target.x + "," + d.target.y;
}

function groupFill(d) { 
  if (d.nodes.length == 1)
    return 'white';
  else
    return fill(d.id); 
}

function nodeFill(d) {
  var group = idToGroup[d.groupId];
  if (group.nodes.length < 2)
    return '#aaa';
  else
    return fill(d.groupId);
}

function connectedComponent(v) {
  var component = [v];
  var visited = {};
  visited[v.id] = true;
  var open = 0;
  var closed = 1;
  while (open < closed) {
    var tmp = closed;
    for (; open < tmp; open++) {
      var node = component[open];
      for (var i = 0; i < node.links.length; i++) {
        var l = node.links[i];
        if (!(l.source.id in visited)) {
          component.push(l.source);
          visited[l.source.id] = true;
          closed ++;
        } else if (!(l.target.id in visited)) {
          component.push(l.target);
          visited[l.target.id] = true;
          closed ++;
        }
      }
    }
  }
  return component;
}

function convexhull(nodes) {
  nodeArr = [];
  if (nodes.length == 2) {
    v1 = nodes[0];
    v2 = nodes[1];
    r = 0.1;
    nodeArr.push([v1.x+r, v1.y+r])
    nodeArr.push([v1.x+r, v1.y-r])
    nodeArr.push([v1.x-r, v1.y+r])
    nodeArr.push([v1.x-r, v1.y-r])
    nodeArr.push([v2.x+r, v2.y+r])
    nodeArr.push([v2.x+r, v2.y-r])
    nodeArr.push([v2.x-r, v2.y+r])
    nodeArr.push([v2.x-r, v2.y-r])
  } else
    nodeArr = nodes.map(function(v) { return [v.x, v.y]; });

  return d3.geom.hull(nodeArr);
}

function updateGroupCenter(g) {
  g.cx = 0;
  g.cy = 0;
  g.nodes.forEach(function(n) {
    g.cx += n.x;
    g.cy += n.y;
  });
  g.cx /= g.nodes.length;
  g.cy /= g.nodes.length;
  var box = boundingBox(g);
  if (box.left <= marginLeft)
    g.cx = marginLeft + box.diameter/2;
  else if (box.right >= w - marginRight)
    g.cx = w - marginRight - box.diameter/2;
  if (box.top <= marginTop)
    g.cy = marginTop + box.diameter/2;
  else if (box.bottom >= h - marginBottom) 
    g.cy = h - marginBottom - box.diameter/2;
}

function boundingBox(g) {

  var box = new Object();
  
  if (g.nodes.length == 1) {
    var v = g.nodes[0];
    box.left = v.x - nodeRadius - 10;
    box.right = v.x + nodeRadius + 10;
    box.top = v.y - nodeRadius - 10;
    box.bottom = v.y + nodeRadius + 10;
  } else {
    convex = convexhull(g.nodes);
    box.left = convex[0][0];
    box.right = convex[0][0];
    box.top = convex[0][1];
    box.bottom = convex[0][1];
    convex.forEach(function(d) {
      if (d[0] < box.left)
        box.left = d[0];
      if (d[0] > box.right)
        box.right = d[0];
      if (d[1] > box.top)
        box.top = d[1];
      if (d[1] < box.bottom)
        box.bottom = d[1];
    });
  }
  box.diameter = Math.max(box.right - box.left, box.bottom - box.top);
  return box;
}

function removeElement(arr, element) {
  var i = 0;
  for (; i < arr.length; i++)
    if (arr[i] == element)
      break;
  if (i < arr.length)
    arr.splice(i, 1);
}

function createNewGroup(nodes) {
  var id = 0;

  while (true) {
    if (! (id in idToGroup))
      break;
    id += 1;
  }
  
  var group = new Object();
  group.id = id;
  group.nodes = nodes;
  group.cx = 0;
  group.cy = 0;
  nodes.forEach(function(d) {
    group.cx += d.x;
    group.cy += d.y;
    d.groupId = id;
  });
  group.cx /= nodes.length;
  group.cy /= nodes.length;

  console.log('new group ' + id + ': ' + group.cx + "," + group.cy);

  groupData.push(group);
  idToGroup[id] = group;
  
  return group;
}

function removeGroup(g) {
  removeElement(groupData, g);
  delete idToGroup[g.id];
  console.log('remove group ' + g.id);
}
return cluster;
};
})();