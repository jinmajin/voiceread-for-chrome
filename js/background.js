chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == "voiceread");
  port.onMessage.addListener(function(msg) {
    chrome.tts.speak(msg.selected_text);
    port.postMessage({response: "speaking"});
   });
});