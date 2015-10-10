// Saves options to chrome.storage
function save_options() {
  var page_width = $('#page_width').val();
  var char_spacing = $('#char_spacing').val();
  var line_spacing = $('#line_spacing').val();
  var font_size = $('#font_size').val();
  var font_color = $('#font_color').val();
  var background_color = $('#background_color').val();
  var highlight_color = $('#highlight_color').val();
  var speech_rate = $('#speech_rate').val();
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
    var status = $('#status');
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
    fontColor: "#DDD",
    backgroundColor: "#222",
    highlightColor: "#0000FF",
    speechRate: 300
  }, function(settings) {
    $('#page_width').val(settings.pageWidth);
    $('#char_spacing').val(settings.charSpacing);
    $('#line_spacing').val(settings.lineSpacing);
    $('#font_size').val(settings.fontSize);
    $('#font_color').val(settings.fontColor);
    $('#background_color').val(settings.backgroundColor);
    $('#highlight_color').val(settings.highlightColor);
    $('#speech_rate').val(settings.speechRate);
    $('#speech_rate_value').html($('#speech_rate').val() + 'wpm');
  });
}

document.addEventListener('DOMContentLoaded', function() {
  $('#save').click(save_options);
  restore_options();
  $('#speech_rate').on('input', function() {
    $('#speech_rate_value').html($('#speech_rate').val() + 'wpm');
  });
});