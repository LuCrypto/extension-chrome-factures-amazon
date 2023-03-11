console.log('background.js loaded');

chrome.browserAction.onClicked.addListener(buttonClicked);

function buttonClicked(tab) {
    console.log('button clicked')

    chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
        console.log('token 2 : ', token);
        // sessionStorage.setItem('tokenGoogle', token)

        let msg = {
            token: token
        }
        console.log('on envoie un message: ', msg)
        chrome.tabs.sendMessage(tab.id, msg);
    });
}

// chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
//     console.log('token 2 : ', token);
//     sessionStorage.setItem('tokenGoogle', token)
// });

// // Direct
// console.log('popup.js 2 loaded');