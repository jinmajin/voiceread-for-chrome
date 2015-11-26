var lastCharIndex = null;

chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == "voiceread");
  port.onMessage.addListener(function(msg) {
  	if (msg.type == "speak"){
    	chrome.tts.speak(msg.selected_text,
    		{
          voiceName: msg.voice_name, // 'native', 
          rate: msg.speech_rate,
    			onEvent: function(event){
            //port.postMessage(event);
    				if (event.charIndex != lastCharIndex && event.type == 'word'){
    					port.postMessage({evt: 'boundary'});
              lastCharIndex = event.charIndex;
            }
    			}
    		}
    	);
  	} else if (msg.type == "resume"){
  		chrome.tts.resume();
  	} else if (msg.type == "pause"){
  		chrome.tts.pause();
  	} else if (msg.type == "stop"){
  		chrome.tts.stop();
  	}
   });
});
