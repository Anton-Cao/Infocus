document.addEventListener("DOMContentLoaded", function() {
  let disableForm = document.getElementById("disableForm");
  let disableInput = document.getElementById("disableInput");
  let removeForm = document.getElementById("removeForm");
  let removeInput = document.getElementById("removeInput");
  let regexCheckbox = document.getElementById("regexCheckbox");
  let motivForm = document.getElementById("motivForm");
  let motivInput = document.getElementById("motivInput");
  let notifMessForm = document.getElementById("notifMessForm");
  let notifMessInput = document.getElementById("notifMessInput");
  let notifTimeForm = document.getElementById("notifTimeForm");
  let notifTimeInput = document.getElementById("notifTimeInput");

  chrome.storage.sync.get(["disableQs", "removeQs", "regex", "motiv", "notifMess", "notifTime"], function(data) {
    disableInput.placeholder = "Currently " + data.disableQs.toString();
    removeInput.placeholder = "Currently " + data.removeQs.toString();
    regexCheckbox.checked = data.regex;
    motivInput.placeholder = data.motiv;
    notifMessInput.placeholder = data.notifMess;
    notifTimeInput.placeholder = "Currently " + data.notifTime.toString() + " mins";
  });

  disableForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let newQs = parseInt(disableInput.value);
    if (newQs) {
      chrome.storage.sync.set({"disableQs" : newQs}, function() {
        disableInput.placeholder = "Currently " + newQs.toString();
        disableInput.value = null;
      });
    }
  });

  removeForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let newQs = parseInt(removeInput.value);
    if (newQs) {
      chrome.storage.sync.set({"removeQs" : newQs}, function() {
        removeInput.placeholder = "Currently " + newQs.toString();
        removeInput.value = null;
      });
    }
  });

  regexCheckbox.onclick = function() {
    chrome.storage.sync.set({"regex" : regexCheckbox.checked});
  };

  motivForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let newMess = motivInput.value;
    if (newMess.length > 0) {
      chrome.storage.sync.set({"motiv": newMess}, function() {
        motivInput.placeholder = newMess;
        motivInput.value = null;
      });
    }
  });

  notifMessForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let newMess = notifMessInput.value;
    if (newMess.length > 0) {
      chrome.storage.sync.set({"notifMess": newMess}, function() {
        notifMessInput.placeholder = newMess;
        notifMessInput.value = null;
      });
    }
  });

  
  notifTimeForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let newTime = parseInt(notifTimeInput.value);
    if (newTime) {
      chrome.storage.sync.set({"notifTime": newTime}, function() {
        notifTimeInput.placeholder = "Currently " + newTime.toString() + " min";
        notifTimeInput.value = null;
      });
    }
  });
});
