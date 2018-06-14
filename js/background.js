chrome.runtime.onInstalled.addListener(function() {

  // set default values
  chrome.storage.sync.get(["blacklist", "enabled", "timer", "timerEnabled", "difficulty", "disableQs", "removeQs", "regex", "notifMess", "notifTime", "unfocusTime"], function(data) {
    let newBlacklist = [];
    if (typeof data.blacklist != "undefined") {
      newBlacklist = data.blacklist;
    }
    let newEnabled = false;
    if (typeof data.enabled != "undefined") {
      newEnabled = data.enabled;
    }

    if (newEnabled) {
      chrome.browserAction.setBadgeText({text: 'ON'});
      chrome.browserAction.setBadgeBackgroundColor({color: '#306FDF'});
    } else {
      chrome.browserAction.setBadgeText({text: 'OFF'});
      chrome.browserAction.setBadgeBackgroundColor({color: '#999'});
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

    let newNotifMess = "Don't get lost down the rabbit hole...";
    if (typeof data.notifMess != "undefined") {
      newNotifMess = data.notifMess;
    }

    let newNotifTime = 10; // minutes
    if (typeof data.notifTime != "undefined") {
      newNotifTime = data.notifTime;
    }

    let newUnfocusTime = 0; // seconds spent on blacklisted sites
    if (typeof data.unfocusTime != "undefined") {
      newUnfocusTime = data.unfocusTime;
    }

    chrome.storage.sync.set({blacklist: newBlacklist, enabled: newEnabled, timer: newTimer, timerEnabled: newTimerEnabled, difficulty: newDifficulty, disableQs: newDisableQs, removeQs: newRemoveQs, regex: newRegex, notifMess: newNotifMess, notifTime: newNotifTime, unfocusTime: newUnfocusTime});

  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if ('url' in changeInfo) {
    processTab(tab);
  }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    processTab(tab);
  });
});

// keyboard shortcut
chrome.commands.onCommand.addListener(function(command) {
  if (command == "enable") {
    chrome.storage.sync.get('enabled', function(data) {
      if (!data.enabled) {
        chrome.storage.sync.set({enabled : true});
        chrome.browserAction.setBadgeText({text: 'ON'});
        chrome.browserAction.setBadgeBackgroundColor({color: '#306FDF'});
      }
    });
  }
});

// function that gets called whenever new tab is visited/created
function processTab(tab) {
  chrome.storage.sync.get(['enabled', 'blacklist', 'regex', 'notifMess', 'notifTime'], function(result) {
    let blacklisted = checkBlacklist(tab.url, result.blacklist, result.regex);
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
      } 
    }
  });
}

function checkBlacklist(url, blacklist, regex) {
  let blacklisted = false;
  for (let i = 0; i < blacklist.length; i++) {
    const pattern = blacklist[i];

    if (regex) {
      if (!!url.match(new RegExp(pattern.replace(/\\/g, "\\\\")))) {
        blacklisted = true;
        break;
      }
    } else {
      if (extractRootDomain(url).toLowerCase() == pattern.toLowerCase()) {
        blacklisted = true;
        break;
      }
      // if . in pattern, assume they pasted the full url
      if (pattern.indexOf(".") > -1 && url.indexOf(pattern) > -1) {
        blacklisted = true;
        break;
      }
    }
  }
  return blacklisted;
}


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

const refreshTime = 5000; //ms, should be factor of 60 * 1000
function checkTime() {
  chrome.storage.sync.get(["timer", "timerEnabled", "enabled", "unfocusTime", "blacklist", "regex", "notifTime", "notifMess"], function(data) {

    // change badge when time runs out
    if (data.timerEnabled && Date.now() > data.timer) {
      chrome.storage.sync.set({"timerEnabled" : false, "enabled" : false, "unfocusTime" : 0}, function() {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "/images/infocus128.png",
          title: "Nice work!",
          message: "Infocus time is up. Take a break, you deserve it!"
        });
        chrome.browserAction.setBadgeText({text: 'OFF'});
        chrome.browserAction.setBadgeBackgroundColor({color: '#999'});
      });
    }

    // update unfocus time
    if (!data.enabled) {
      chrome.tabs.query(
        {currentWindow: true, active : true},
        function(tabArray) {
          if (typeof tabArray[0] != "undefined") {
            let blacklisted = checkBlacklist(tabArray[0].url, data.blacklist, data.regex);
            if (blacklisted) {
              if (data.unfocusTime % 60 == 0 && data.unfocusTime / 60 >= data.notifTime) {
                chrome.notifications.create({
                  type: "basic",
                  iconUrl: "/images/infocus128.png",
                  title: "Time to focus?",
                  message: "You have spent " + (data.unfocusTime / 60).toString() + " minute(s) unfocused. " + data.notifMess
                });
              }
              chrome.storage.sync.set({"unfocusTime" : data.unfocusTime + refreshTime / 1000});
            }
          }
        }
      );
    }
  });
  
  setTimeout(checkTime, refreshTime);
}
checkTime();

