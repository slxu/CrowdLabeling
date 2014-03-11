function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    
    // files is a FileList of File objects. List some properties.
    var output = [];
    f = files[0];
    var reader = new FileReader();
    reader.readAsText(f);
    reader.onload = function(e) { 
          var content = e.target.result;
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
    }
}


document.getElementById('files1').addEventListener('change', handleFileSelect, false);