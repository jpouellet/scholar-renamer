var re = new RegExp("^https://scholar\.vt\.edu/portal/site/(~?[-0-9a-zA-Z]+)");

function och(info, tab) {
  console.log("item " + info.menuItemId + " was clicked");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
  var site = re.exec(info.linkUrl)[1];
  chrome.tabs.sendMessage(tab.id, site);
}

chrome.contextMenus.onClicked.addListener(och);

chrome.runtime.onInstalled.addListener(function() {
  console.log('init'); // XXX
  var menu = chrome.contextMenus.create({
    "title": "Edit",
    "id": "edit",
    "contexts": ["link"],
    "targetUrlPatterns": ["https://scholar.vt.edu/portal/site/*"]
  });
});
