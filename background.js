chrome.runtime.onInstalled.addListener(function() {

  // set default values
  chrome.storage.sync.set({blacklist: [], enabled: false, timer: Date.now(), timerEnabled: false, difficulty: 2, disableQs: 5, removeQs: 2});
  chrome.browserAction.setBadgeText({text: 'OFF'});
  chrome.browserAction.setBadgeBackgroundColor({color: '#999'});
  
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.storage.sync.get('enabled', function(result) {
    if ('url' in changeInfo) {
      chrome.storage.sync.get('blacklist', function(result) {
        const blacklist = result.blacklist;
        let blacklisted = false;
        for (let i = 0; i < blacklist.length; i++) {
          const pattern = blacklist[i];
          if (!!tab.url.match(pattern)) {
            blacklisted = true;
            break;
          }
        }
        if (blacklisted) {
          if (result.enabled) {
            chrome.tabs.executeScript(tab.id, {
              "code" : "window.history.length"
            }, function(result) {
              if (result <= 2) { // tab was recently opened, so should close tab
                chrome.tabs.remove(tab.id);
              } else { // should go back in history
                chrome.tabs.executeScript(tab.id, {"code": "window.history.back()"});
              }
            });
          } else {
            if (Math.random() > 0.8) { // if user is on banned site, randomly reminds to turn on Infocus
              chrome.notifications.create({
                type: "basic",
                iconUrl: "/images/infocus128.png",
                title: "Time to focus?",
                message: "Don't get lost down the rabbit hole..."
              });
            }
          }
        }
      });
    }
  });
});

// change badge when time runs out
function checkTime() {
  chrome.storage.sync.get(["timer", "timerEnabled"], function(data) {
    if (data.timerEnabled && Date.now() > data.timer) {
      chrome.storage.sync.set({"timerEnabled" : false, "enabled" : false}, function() {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "/images/infocus128.png",
          title: "Nice work!",
          message: "Infocus time is up."
        });
        chrome.browserAction.setBadgeText({text: 'OFF'});
        chrome.browserAction.setBadgeBackgroundColor({color: '#999'});
      });
    }
  });
  setTimeout(checkTime, 1000);
}
checkTime();

