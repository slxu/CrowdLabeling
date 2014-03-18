var id = 0;
var cluster = null;
var onSpanClick = null;
var onOutputClick = null;

function replace(match) {
  var token = 'token' + id;
  var replace = '<kbd class="custom" draggable="true" contenteditable="false">' + id + '</kbd><span class="tolabel ' + token + '" onclick="onSpanClick()">';
  id++;
  return replace;
}

function onStartClick() {
  var select = document.getElementById("docselect");
  var doc = select.options[select.selectedIndex].value;
  console.log(doc);
  $.get('data/cluster/' + doc + '.html', function(response) {
    var content = response;
    var display = document.getElementById("input");
    var lines = content.trim().split('\n');

    // remove first and last line
    lines.splice(0, 1);
    lines.splice(lines.length - 1, 1);

    id = 0;
    content = lines.join('\n');
    content = content.replace(/<label[^>]*>/g, replace);
    content = content.replace(/<\/label>/g, "</span>");
    // console.log(content);
    display.innerHTML = content;

    cluster = d3.cluster();
    console.log('data/cluster/' + doc +'.json');
    cluster.start('data/cluster/' + doc +'.json');
    onSpanClick = cluster.onSpanClick;
    onOutputClick = cluster.onOutputClick;

    document.getElementById("output_btn").disabled = false;
    document.getElementById("start_btn").disabled = true;
  });
}




