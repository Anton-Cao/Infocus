chrome.runtime.onInstalled.addListener(function() {

  // set default values
  chrome.storage.sync.get(["blacklist", "enabled", "timer", "timerEnabled", "difficulty", "disableQs", "removeQs", "regex"], function(data) {
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
    let newRegex = false;
    if (typeof data.regex != "undefined") {
      newRegex = data.regex;
    }
    chrome.storage.sync.set({blacklist: newBlacklist, enabled: newEnabled, timer: newTimer, timerEnabled: newTimerEnabled, difficulty: newDifficulty, disableQs: newDisableQs, removeQs: newRemoveQs, regex: newRegex});

  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.storage.sync.get(['enabled', 'blacklist', 'regex'], function(result) {
    if ('url' in changeInfo) {
      const blacklist = result.blacklist;
      let blacklisted = false;
      for (let i = 0; i < blacklist.length; i++) {
        const pattern = blacklist[i];

        if (result.regex) {
          if (!!tab.url.match(new RegExp(pattern.replace(/\\/g, "\\\\")))) {
            blacklisted = true;
            break;
          }
        } else {
          if (extractRootDomain(tab.url).toLowerCase() == pattern.toLowerCase()) {
            blacklisted = true;
            break;
          }
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
    }
  });
});

// https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
function extractHostname(url) {
  let hostname;
  //find & remove protocol (http, ftp, etc.) and get hostname

  if (url.indexOf("://") > -1) {
    hostname = url.split('/')[2];
  }
  else {
    hostname = url.split('/')[0];
  }

  //find & remove port number
  hostname = hostname.split(':')[0];
  //find & remove "?"
  hostname = hostname.split('?')[0];

  return hostname;
}

// To address those who want the "root domain," use this function:
function extractRootDomain(url) {
  let domain = extractHostname(url),
      splitArr = domain.split('.'),
      arrLen = splitArr.length;

  //extracting the root domain here
  //if there is a subdomain 
  if (arrLen > 2) {
    domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
    //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
    if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
      //this is using a ccTLD
      domain = splitArr[arrLen - 3] + '.' + domain;
    }
  }
  return domain.split('.')[0]; 
}


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

