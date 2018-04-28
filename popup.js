document.addEventListener("DOMContentLoaded", function() {
  let sitesDiv = document.getElementById("sitesDiv");
  let toggleButton = document.getElementById("toggleButton");
  let addForm = document.getElementById("addForm");
  let addInput = document.getElementById("addInput");
  let messageP = document.getElementById("messageP");
  let noSitesP = document.getElementById("noSitesP");

  chrome.storage.sync.get(["enabled", "blacklist"], function(data) {
    // update button (and icon) according to memory
    toggle(toggleButton, data.enabled);

    // update list of blacklisted sites according to memory
    for (let i = 0; i < data.blacklist.length; i++) {
      addSite(data.blacklist[i], sitesDiv);
    }

    // if there are blacklisted sites, remove no sites message
    if (data.blacklist.length > 0) {
      noSitesP.style.display = "none";
    }
  });

  // toggle between enabled and disabled
  toggleButton.onclick = function(element) {
    chrome.storage.sync.get("enabled", function(data) {
      const newEnabled = !data.enabled;
      chrome.storage.sync.set({enabled : newEnabled}, function() {
        toggle(toggleButton, newEnabled);
      });
    });
  };

  // handle adding sites
  addForm.addEventListener("submit", function(event) {
    event.preventDefault();
    console.log("submitted!");
    let newSite = addInput.value;
    console.log(newSite);
    chrome.storage.sync.get("blacklist", function(data) {
      if (data.blacklist.includes(newSite)) {
        // notify user that site is already on blacklist
        messageP.innerText = newSite + " is already blacklisted.";
      } else if (newSite === "") {
        // notify user that site cannot be empty
        messageP.innerText = "Site cannot be empty";
      } else if ("chrome://extensions".match(newSite)) {
        // notify user that they cannot block the extensions page
        messageP.innerText = "Don't block chrome://extensions :3";
      } else {
        let curList = data.blacklist;
        curList.push(newSite);
        chrome.storage.sync.set({blacklist: curList}, function() {
          console.log(newSite + " added to blacklist");
          addInput.value = "";
          addInput.blur();
          addSite(newSite, sitesDiv);
          noSitesP.style.display = "none";
        });
      }
    });
  });

  // remove error message when input is changed
  addInput.addEventListener("input", function(event) {
    messageP.innerText = "";
  });
  
});

function toggle(button, on) {
  if (on) {
    button.className = "on";
    button.innerText = "On";
    chrome.browserAction.setIcon({
      path : {
        "16": "images/infocus16.png",
        "32": "images/infocus32.png",
        "48": "images/infocus48.png",
        "128": "images/infocus128.png"
      }
    });
    chrome.browserAction.setBadgeText({text: 'ON'});
    chrome.browserAction.setBadgeBackgroundColor({color: '#306FDF'});
  } else {
    button.className = "off";;
    button.innerText = "Off";
    chrome.browserAction.setIcon({
      path : {
        "16": "images/unfocus16.png",
        "32": "images/unfocus32.png",
        "48": "images/unfocus48.png",
        "128": "images/unfocus128.png"
      }
    });
    chrome.browserAction.setBadgeText({text: 'OFF'});
    chrome.browserAction.setBadgeBackgroundColor({color: '#999'});
  }
}

function addSite(site, sitesDiv) {
  let siteDiv = document.createElement("div");
  let siteName = document.createElement("p");
  let deleteButton = document.createElement("button");
  siteName.innerText = site;
  siteName.className = "site";
  siteDiv.appendChild(siteName);
  deleteButton.innerHTML = "&times;";
  deleteButton.className = "delete";
  deleteButton.onclick = function(element) {
    deleteSite(site);
  };
  siteDiv.appendChild(deleteButton);
  siteDiv.id = site + "-div";
  siteDiv.className = "siteDiv";
  sitesDiv.appendChild(siteDiv);
}

function deleteSite(site) {
  chrome.storage.sync.get("blacklist", function(data) {
    let newList = [];
    for (let i = 0; i < data.blacklist.length; i++) {
      if (data.blacklist[i] != site) {
        newList.push(data.blacklist[i]);
      }
    }
    if (newList.length == 0) {
      noSitesP.style.display = "";
    }
    chrome.storage.sync.set({blacklist : newList}, function() {
      let siteDiv = document.getElementById(site+"-div");
      siteDiv.parentNode.removeChild(siteDiv);
    });
  });
}

