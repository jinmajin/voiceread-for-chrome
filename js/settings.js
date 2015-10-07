// Saves options to chrome.storage
function save_options() {
  var page_width = document.getElementById('page_width').value;
  var char_spacing = document.getElementById('char_spacing').value;
  var line_spacing = document.getElementById('line_spacing').value;
  var font_size = document.getElementById('font_size').value;
  var font_color = document.getElementById('font_color').value;
  var background_color = document.getElementById('background_color').value;
  var highlight_color = document.getElementById('highlight_color').value;
  var speech_rate = document.getElementById('speech_rate').value;
  chrome.storage.sync.set({
    pageWidth: page_width,
    charSpacing: char_spacing,
    lineSpacing: line_spacing,
    fontSize: font_size,
    fontColor: font_color,
    backgroundColor: background_color,
    highlightColor: highlight_color,
    speechRate: speech_rate
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores selection state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    pageWidth: 40,
    charSpacing: 5,
    lineSpacing: 10,
    fontSize: 50,
    fontColor: "#DDDDDD",
    backgroundColor: "#222222",
    highlightColor: "#0000FF",
    speechRate: 300
  }, function(settings) {
    document.getElementById('page_width').value = settings.pageWidth;
    document.getElementById('char_spacing').value = settings.charSpacing;
    document.getElementById('line_spacing').value = settings.lineSpacing;
    document.getElementById('font_size').value = settings.fontSize;
    document.getElementById('font_color').value = settings.fontColor;
    document.getElementById('background_color').value = settings.backgroundColor;
    document.getElementById('highlight_color').value = settings.highlightColor;
    document.getElementById('speech_rate').value = settings.speechRate;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('save').addEventListener('click', save_options);
  restore_options();
});