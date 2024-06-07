document.getElementById('settings-form').addEventListener('submit', function(e) {
    const userName = document.getElementById('userName').value;
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({userName: userName}, function () {
        chrome.runtime.sendMessage({message: 'userName has been saved'});
    });
    chrome.storage.sync.set({apiKey: apiKey}, function() {
        chrome.runtime.sendMessage({message: 'apiKey has been saved'});
    });
});