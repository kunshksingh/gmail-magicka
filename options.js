document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({apiKey: apiKey}, function() {
        console.log('API Key saved: ' + apiKey);
        // Optionally, display a message to the user that the API key was saved.
    });
});