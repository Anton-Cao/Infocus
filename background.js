chrome.runtime.onInstalled.addListener(function() {

  // set default values
  chrome.storage.sync.get(["blacklist", "enabled", "timer", "timerEnabled", "difficulty", "disableQs", "removeQs"], function(data) {
    let newBlacklist = [];
    if (typeof data.blacklist != "undefined") {
      newBlacklist = data.blacklist;
    }
    let newEnabled = false;
    if (typeof data.enabled != "undefined") {
      newEnabled = data.enabled;
    }
    let newTimer = Date.now();
    if (typeof data.timer != "undefined") {
      newTimer = data.timer;
    }
    let newTimerEnabled = false;
    if (typeof data.timerEnabled != "undefined") {
      newTimerEnabled = data.timerEnabled;
    }
    let newDifficulty = 2;
    if (typeof data.difficulty != "undefined") {
      newDifficulty = data.difficulty;
    }
    let newDisableQs = 5;
    if (typeof data.disableQs != "undefined") {
      newDisableQs = data.disableQs;
    }
    let newRemoveQs = 2;
    if (typeof data.removeQs != "undefined") {
      newRemoveQs = data.removeQs;
    }
    chrome.storage.sync.set({blacklist: newBlacklist, enabled: newEnabled, timer: newTimer, timerEnabled: newTimerEnabled, difficulty: newDifficulty, disableQs: newDisableQs, removeQs: newRemoveQs});

  });
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

