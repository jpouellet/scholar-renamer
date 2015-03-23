var spans = document.querySelectorAll('.nav-menu a span');
var href_re = new RegExp("^https://scholar\.vt\.edu/portal/site/~?([-0-9a-f]+)");
var data_re = new RegExp("^~?([-0-9a-f]+)$");
var elems = {};
var titles = {};
for (var i = 0; i < spans.length; i++) {
  (function(span, a) {
    // fix dumb redundant tooltip
    a.title = a.title.replace(span.textContent+': ', '');

    var uuid = (href_re.exec(a.href) || data_re.exec(a.nextElementSibling.getAttribute('data')))[1];
    elems[uuid] = span;
    titles[uuid] = span.textContent;

    // rename
    chrome.storage.sync.get(uuid, function(items) {
      if (items.hasOwnProperty(uuid)) {
        console.log(a.textContent+' -> '+items[uuid]+' ('+uuid+')');
        span.textContent = items[uuid];
      }
    });
  })(spans[i], spans[i].parentElement);
}

chrome.runtime.onMessage.addListener(function(site) {
  console.log('edit: '+site);

  // just assume all non-uuid things are ~pid for "My Workspace"
  var uuid = (site[0] === '~' && Object.keys(elems)[0] || site);

  var span = elems[uuid];

  // keep track of old href
  var href = span.parentElement.href;

  // remove link
  span.parentElement.removeAttribute('href');

  // make it editable & select all its text
  span.contentEditable = true;
  var range = document.createRange();
  range.selectNodeContents(span);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  span.focus();

  // handle when we're done editing
  function done() {
    if (span.textContent === '') {
      chrome.storage.sync.remove(uuid);
      span.textContent = titles[uuid];
      console.log(uuid+' ->X ('+span.textContent+')');
    } else {
      var obj = {};
      obj[uuid] = span.textContent;
      chrome.storage.sync.set(obj);
      console.log(uuid+' -> '+span.textContent);
    }
    span.contentEditable = false;
    span.parentElement.href = href;

    // only fire once
    span.removeEventListener('blur', onblur);
    span.removeEventListener('keydown', onkeydown);
  }
  // there must be a cleaner way...
  function onblur() { done(); }
  function onkeydown(e) {
    if (e.keyCode === 13) { // enter/return
      e.preventDefault();
      done();
    }
  }
  span.addEventListener('blur', onblur);
  span.addEventListener('keydown', onkeydown);
});
