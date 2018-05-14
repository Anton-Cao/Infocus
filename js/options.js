document.addEventListener("DOMContentLoaded", function() {
  let disableForm = document.getElementById("disableForm");
  let disableInput = document.getElementById("disableInput");
  let removeForm = document.getElementById("removeForm");
  let removeInput = document.getElementById("removeInput");

  chrome.storage.sync.get(["disableQs", "removeQs"], function(data) {
    disableInput.placeholder = "Currently " + data.disableQs.toString();
    removeInput.placeholder = "Currently " + data.removeQs.toString();
  });

  disableForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let newQs = parseInt(disableInput.value);
    chrome.storage.sync.set({"disableQs" : newDifficulty}, function() {
      disableInput.placeholder = "Currently " + newQs.toString();
      disableInput.value = null;
    });
  });

  removeForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let newQs = parseInt(removeInput.value);
    chrome.storage.sync.set({"removeQs" : newQs}, function() {
      removeInput.placeholder = "Currently " + newQs.toString();
      removeInput.value = null;
    });
  });
});
