document.addEventListener("DOMContentLoaded", function() {
  let sitesDiv = document.getElementById("sitesDiv");
  let testDiv = document.getElementById("testDiv");
  let testTitle = document.getElementById("testTitle");
  let testStatus = document.getElementById("testStatus");
  let testP = document.getElementById("testP");
  let testForm = document.getElementById("testForm");
  let testInput = document.getElementById("testInput");
  let cancelButton = document.getElementById("cancelButton");
  let testQuote = document.getElementById("testQuote");
  let timerForm = document.getElementById("timerForm");
  let timerInput = document.getElementById("timerInput");
  let minutesDatalist = document.getElementById("minutes");
  let toggleButton = document.getElementById("toggleButton");
  let addForm = document.getElementById("addForm");
  let addInput = document.getElementById("addInput");
  let messageP = document.getElementById("messageP");
  let noSitesP = document.getElementById("noSitesP");
  let timeLeft = 0; 
  let timerEnabled = false;
  let difficulty = 2;
  let disableQs = 5;
  let removeQs = 2;
  const msInMin = 60 * 1000;

  // initial setup
  chrome.storage.sync.get(["enabled", "blacklist", "timer", "timerEnabled", "difficulty", "disableQs", "removeQs"], function(data) {
    // update button (and icon) according to memory
    toggle(data.enabled);
    if (data.timerEnabled) {
      if (data.timer > Date.now()) {
        timeLeft = data.timer - Date.now();
        timerEnabled = true;
      } else {
        turnOff();
      }
    }
    updateTimer(); // gets called every second

    // update list of blacklisted sites according to memory
    for (let i = 0; i < data.blacklist.length; i++) {
      addSite(data.blacklist[i]);
    }

    // if there are blacklisted sites, remove no sites message
    if (data.blacklist.length > 0) {
      noSitesP.style.display = "none";
    }

    difficulty = data.difficulty;
    disableQs = data.disableQs;
    removeQs = data.removeQs;
  });


  /*
    Code relevant to activating/deactivating
  */
  
  timerForm.addEventListener("submit", function(event) {
    event.preventDefault();
    turnOn();
  });

  // toggle between enabled and disabled
  toggleButton.onclick = function(element) {
    chrome.storage.sync.get(["enabled"], function(data) {
      if (data.enabled) {
        // TODO: make it difficult to turn off
        test(disableQs);
      } else {
        turnOn();
      }
    });
  };

  // handles enabling blocking/adding time
  function turnOn() {
    let minutes = parseInt(timerInput.value);
    if (minutes.length > 0) {
      chrome.storage.sync.get(["timer", "timerEnabled"], function(data) {
        let newTime = Date.now() + minutes * msInMin;
        if (data.timerEnabled) {
          newTime = data.timer + minutes * msInMin;
        }
        chrome.storage.sync.set({timer: newTime, enabled: true, timerEnabled: true}, function() {
          timerInput.value = "";
          toggle(true);
          timeLeft = newTime - Date.now();
          timerEnabled = true;
          toggleButton.innerText = formatTime(timeLeft);
        });
      });
    } else {
      chrome.storage.sync.set({enabled : true}, function() {
        toggle(true);
      }); 
    }
  }

  // updates timer every second
  function updateTimer() {
    if (timeLeft > 0 && timerEnabled) {
      toggleButton.innerText = formatTime(timeLeft);
      timerInput.placeholder = "+Time (min)";
      timeLeft -= 1000;
    } else if (timerEnabled){
      turnOff();
    }
    setTimeout(updateTimer, 1000);
  }

  function turnOff() {
    timerEnabled = false;
    chrome.storage.sync.set({"timerEnabled" : false, "enabled" : false}, function() {
      timerInput.placeholder = "Timer (min)";
      toggle(false);
    });
  }
  
  function toggle(on) {
    if (on) {
      toggleButton.className = "on";
      toggleButton.innerText = "ON";
      chrome.browserAction.setBadgeText({text: 'ON'});
      chrome.browserAction.setBadgeBackgroundColor({color: '#306FDF'});
    } else {
      toggleButton.className = "off";
      toggleButton.innerText = "OFF";
      chrome.browserAction.setBadgeText({text: 'OFF'});
      chrome.browserAction.setBadgeBackgroundColor({color: '#999'});
    }
  }

  // gives user math questions to solve in order to disable the extension lol
  let rounds = 0; // number of questions that have to be answered
  let correct = 0; // number correct so far
  let arg = null; // site to remove
  let curAns = 0; // correct answer to question that is currently being asked
  function test(r, a=null) { // if a is provided, assume removing site, else disabling
    rounds = r;
    arg = a; 
    testDiv.style.display = "inline-block";
    testTitle.innerText = "Answer " + r.toString() + " questions to";
    if (a) {
      testTitle.innerText += " remove " + arg;
    } else {
      testTitle.innerText += " disable Infocus";
    }
    testStatus.innerText = "Solved " + correct.toString() + " out of " + rounds.toString();
    askQuestion();
  }

  function askQuestion() {
    const x = rInt(1, Math.pow(10, difficulty));
    const y = rInt(1, Math.pow(10, difficulty));
    testP.innerText = "What is " + x.toString() + " + " + y.toString() + "?";
    curAns = x + y;
  }
  
  testForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let answer = parseInt(testInput.value);
    if (answer) {
      if (answer == curAns) {
        correct += 1;
      } else {
        testStatus.classList.add("apply-shake");
      }
      testInput.value = null;
      testStatus.innerText = "Solved " + correct.toString() + " out of " + rounds.toString();
      askQuestion();
      if (correct == rounds) {
        endTest();
        if (arg) {
          deleteSite(arg);
        } else {
          turnOff();
        }
      }
    }
  });
  
  testStatus.addEventListener("animationend", function(event) {
    testStatus.classList.remove("apply-shake");
  });

  cancelButton.onclick = function() {
    endTest();
  };

  function endTest() {
    rounds = 0;
    correct = 0;
    success = null;
    testDiv.style.display = "none";    
  }
  
  /*
    Code relevant to blocked sites
   */
  
  // handle adding sites
  addForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let newSite = addInput.value;
    chrome.storage.sync.get("blacklist", function(data) {
      if (data.blacklist.includes(newSite)) {
        messageP.innerText = newSite + " is already blacklisted.";
      } else if (newSite == "") {
        messageP.innerText = "Site cannot be empty";
      } else if ("chrome://extensions".match(newSite)) {
        messageP.innerText = "Don't block chrome://extensions :3";
      } else {
        let curList = data.blacklist;
        curList.push(newSite);
        chrome.storage.sync.set({blacklist: curList}, function() {
          addInput.value = "";
          addSite(newSite);
          noSitesP.style.display = "none";
        });
      }
    });
  });

  // remove error message when input is changed
  addInput.addEventListener("input", function(event) {
    messageP.innerText = "";
  });


  function addSite(site) {
    let siteDiv = document.createElement("div");
    let siteName = document.createElement("p");
    let deleteButton = document.createElement("button");
    siteName.innerText = site;

    const maxLen = 20;
    if (site.length > maxLen) {
      siteName.innerText = site.substring(0, 18) + "...";
    }

    siteName.className = "site";
    siteDiv.appendChild(siteName);
    deleteButton.innerHTML = "&times;";
    deleteButton.className = "delete";
    deleteButton.onclick = function(element) {
      test(removeQs, site);
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

  
});




/*
  Helper functions
*/

// helper function for formatTime
function padZeroes(time) {
  let out = time.toString();
  while (out.length < 2) {
    out = "0" + out;
  }
  return out;
}

// given millis, format as hh:mm:ss
function formatTime(millis) {
  let s = Math.floor(millis / 1000);
  let m = Math.floor(s / 60);
  s -= 60 * m;
  let h = Math.floor(m / 60);
  m -= 60 * h;
  return padZeroes(h) + ":" + padZeroes(m) + ":" + padZeroes(s);
}

// returns random integer between lower and upper
function rInt(lower, upper) {
  return lower + Math.floor(Math.random() * (upper - lower));
}
