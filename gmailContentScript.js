// Function to check if the URL indicates viewing an email thread
function isThreadView() {
    const regex = /mail\.google\.com\/mail\/u\/\d+\/#inbox\/.*/;
    return regex.test(window.location.href);
}

// document.addEventListener('DOMContentLoaded', function() {
function initTalkbudButton() {
    const observer = new MutationObserver((mutations) => {
        console.log('Mutations observed!');
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                const spans = document.querySelectorAll('span[role="link"]'); 
                const replyButton = Array.from(spans).find(span => span.textContent.includes("Reply")); 
        
                if (replyButton && !document.getElementById('talkbud-button')) {
                    const talkbudButton = replyButton.cloneNode(true);
                    talkbudButton.textContent = 'Reply with Magicka 🔮';
                    talkbudButton.id = 'talkbud-button';
                    talkbudButton.addEventListener('click', function() {
                        console.log('Talkbud button clicked!');
                        replyButton.click();
                        setTimeout(() => { // Wait for the reply area to open
                            const messageBox = document.querySelector('div[aria-label="Message Body"]'); // Assume Gmail uses divs with contenteditable typically
                            if (messageBox) {
                                messageBox.textContent = ''; // Clear the message box
                                const emailThreadData = scrapeEmailThread();
                                console.log('Email thread data:', emailThreadData);
                                var user_input = prompt("Please provide briefly what you would like to say in the email.");
                                const replyMessage = generateReply(emailThreadData, user_input).then(replyMessage => {
                                    if (!replyMessage) {
                                        alert('Failed to generate reply. Please try again.');
                                        return;
                                    }
                                    typeMessage(messageBox, replyMessage); // Call typeMessage function to simulate typing
                                })
                                .catch(error => {
                                    console.error("Error processing email response:", error);
                                    alert('An error occurred. Please try again.');
                                });
                                typeMessage(messageBox, replyMessage); // Call typeMessage function to simulate typing
                            }
                        }, 500); 
                    });
                    replyButton.parentNode.insertBefore(talkbudButton, replyButton.nextSibling);
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Check if the current view is a thread view on load and whenever the URL changes
if (isThreadView()) {
    initTalkbudButton();
}

window.addEventListener('hashchange', function() {
    console.log('Hash changed!');
    if (isThreadView()) {
        console.log('Thread view detected!');
        initTalkbudButton();
    }
});

function expRandom(max) {
    return Math.floor(Math.log(1 - Math.random()) / Math.log(1 - 1 / max));
}

function typeMessage(element, message) {
    let index = 0;
    const minDelay = 5; // Minimum delay between keystrokes in milliseconds
    const maxDelay = 45; // Maximum delay between keystrokes in milliseconds

    function typeCharacter() {
        if (index < message.length) {
            element.textContent += message.charAt(index);
            index++;
            // Generate a random delay between minDelay and maxDelay with exponential distribution
            const delay = Math.floor(minDelay + expRandom(maxDelay - minDelay));
            setTimeout(typeCharacter, delay);
        }
    }

    typeCharacter();
}

function scrapeEmailThread() {
    expandEmailItems(); // Expand all emails in the thread to ensure all content is visible
    const emailItems = document.querySelectorAll('[role="listitem"]');
    let emailThreadData = [];

    emailItems.forEach(item => {
        // Locate the sender's name using the 'email' attribute, which should be more stable.
        const senderNameSpan = item.querySelector('span[email]');
        // Capture all the text within the email body using aria-labels or roles that indicate readable content.
        //const emailContentDivs = item.querySelectorAll('[role="gridcell"], [role="article"]');  Adjusted to look for roles typical to content areas.

        //Select all the text within .MSONormal divs, which are common in Gmail emails.
        const emailContentDivs = item.querySelectorAll('.MsoNormal');
        let emailContent = '';

        emailContentDivs.forEach(content => {
            emailContent += content.textContent + ' '; // Accumulating all content snippets.
        });

        if (senderNameSpan && emailContent) {
            const senderName = senderNameSpan.textContent.trim();
            emailThreadData.push({ last_sender: senderName, content: emailContent.trim() });
        }
    });

    return emailThreadData;
}


function expandEmailItems() {
    // Query all elements that might have an expandable aria-label
    document.querySelectorAll('[aria-label]').forEach(element => {
        const label = element.getAttribute('aria-label');
        if (label && label.includes('older messages')) {
            // Check if the label contains a number and 'older messages'
            const match = label.match(/(\d+) older messages/);
            if (match && match[1]) {
                // If it matches, simulate a click to expand
                element.click();
            }
        }
    });
    
    // Expand all other items that are not expanded yet
    document.querySelectorAll('[role="listitem"][aria-expanded="false"]').forEach(item => {
        item.click();
    });
}


async function generateReply(emailThreadData, user_input) {
    //const name = "Kunsh Singh" //TODO: Make this dynamic to the user's actual name in storage!
    chrome.storage.sync.get('userName', function(data){
        if(data.userName){
            userName = data.userName;
        }
    });
    if (!userName) {
        console.error('Nane not found!');
        alert('Please specify your name in extension settings');
        return;
    }

    const email = JSON.stringify(emailThreadData);
    const systemPrompt = "You are loved. You are given the following email thread:\n\n"+email+"\nAs "+userName+", reply to the following email thread! Match the tone of voice you've used in the conversation and your intent. Finally and most importantly, the user will provide text for a rough idea of what they want to say. Use this as a guide to help you craft a response!";
    

    const apiUrl = 'https://api.openai.com/v1/chat/completions'; // OpenAI's endpoint
    const body  = {
        model: "gpt-4-turbo-2024-04-09", // Specifying the model
        messages: [{role: "system", content: systemPrompt}, {role: "user", content: user_input}],
        temperature: 1, 
    };

    // Retrieve the API key from storage
    chrome.storage.sync.get('apiKey', function(data) {
        if (data.apiKey) {
            apiKey = data.apiKey;
        }
    });
    if (!apiKey) {
        console.error('API Key not found!');
        alert('API Key not found! Please set your API Key in the extension options.');
        return;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            console.log('Response generated successfully!');
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('No response generated');
        }
    } catch (error) {
        console.error('Error generating email response:', error);
    }
}

