document.addEventListener("DOMContentLoaded", function() {
  let disableForm = document.getElementById("disableForm");
  let disableInput = document.getElementById("disableInput");
  let removeForm = document.getElementById("removeForm");
  let removeInput = document.getElementById("removeInput");
  let regexCheckbox = document.getElementById("regexCheckbox");

  chrome.storage.sync.get(["disableQs", "removeQs", "regex"], function(data) {
    disableInput.placeholder = "Currently " + data.disableQs.toString();
    removeInput.placeholder = "Currently " + data.removeQs.toString();
    regexCheckbox.checked = data.regex;
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

  regexCheckbox.onclick = function() {
    chrome.storage.sync.set({"regex" : regexCheckbox.checked});
  };
});
