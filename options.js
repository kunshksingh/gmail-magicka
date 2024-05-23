document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const userName = document.getElementById('userName').value;
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({userName: userName}, function () {
        
    });
    chrome.storage.sync.set({apiKey: apiKey}, function() {

    });
});