chrome.runtime.onInstalled.addListener(function() {

  chrome.storage.sync.set({blacklist: [], enabled: false}, function() {
    console.log("memory initialized");
  });
  
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    chrome.storage.sync.get('enabled', function(result) {
      if (result.enabled) {
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
              chrome.tabs.executeScript(tab.id, {
                "code" : "window.history.length"
              }, function(result) {
                if (result <= 2) { // tab was recently opened, so should close tab
                  chrome.tabs.remove(tab.id);
                } else { // should go back in history
                  chrome.tabs.executeScript(tab.id, {"code": "window.history.back()"});
                }
              });
              console.log(tab.url + " is blocked");
            }
          });
        }
      }
    });
  });
});
