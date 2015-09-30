chrome.runtime.onMessage.addListener(function(msg, sender, response) {
    if ((msg.from === 'popup') && (msg.subject === 'text')) {
        var text = window.getSelection().toString();
        response(text);
    }
});