var id = 0;

function replace(match) {
    var token = 'token' + id;
    id++;
    return "<kbd class='custom'>" + id + "</kbd><span class='tolabel " + token + "'>";
}

function onUploadClick() {
  $.get('data/APW20001221.0431.0227.html', function(response) {
    var content = response;
    var display = document.getElementById("display");
    var lines = content.trim().split('\n');

    // remove first and last line
    lines.splice(0, 1);
    lines.splice(lines.length - 1, 1);

    id = 0;
    content = lines.join('\n');
    content = content.replace(/<label[^>]*>/g, replace);
    content = content.replace(/<\/label>/g, "</span>");
    console.log(content);
    display.innerHTML = content;

    var cluster = d3.cluster();
      console.log(cluster);
      cluster.start('data/cluster.json');
  });
}




