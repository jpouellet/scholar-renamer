var spans = document.querySelectorAll('.nav-menu a span, ul.otherSitesCategorList li a span');
var href_re = new RegExp("^https://scholar\.vt\.edu/portal/site/~?([-0-9a-f]+)");
var data_re = new RegExp("^~?([-0-9a-f]+)$");
var clickedEl = null;
for (var i = 0; i < spans.length; i++) {
  (function(span, a) {
    // fix dumb redundant tooltip
    a.title = a.title.replace(span.textContent+': ', '');
    
    var uuid_search = (href_re.exec(a.href));
    var uuid;
    if (uuid_search === null && a.nextElementSibling !== null) {
      if ((uuid_search = data_re.exec(a.nextElementSibling.getAttribute('data'))) !== null) {
        uuid = uuid_search[1];
      } else {
        console.log("null uuid search results");
        return;
      }
    } if (uuid_search === null) {
      console.log("null uuid search results");
      return;   
    } else {
      uuid = uuid_search[1];
    };

    // rename
    chrome.storage.sync.get(uuid, function(items) {
      if (items.hasOwnProperty(uuid)) {
        console.log(a.textContent+' -> '+items[uuid]+' ('+uuid+')');
        span.textContent = items[uuid];
      }
    });
  })(spans[i], spans[i].parentElement);
};

function hasClass(element, cls) {
  return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}
document.addEventListener("mousedown", function(event) {
        if (event.button == 2) {
          var target = event.target;
          var parent;
          if (target.tagName.toLowerCase() !== "a" && target.tagName.toLowerCase() !== "span") {
            console.log("failed tag check " + target.tagName);
            return;
          }
          if (target.tagName.toLowerCase() === "a") {
            parent = target;
            var children = target.childNodes;
            for (i=0; i<children.length; i++) {
              if (children[i].tagName.toLowerCase() === "span") {
                target = children[i];
                break;
              }
              console.log("didn't find viable child");
              return;
            }
          } else {
            parent = target.parentElement;
          }
          
          if (!hasClass(parent.parentElement, "nav-menu") && !hasClass(parent.parentElement.parentElement, "otherSitesCategorList")) {
            console.log("failed class check " + parent.parentElement.className);
            return;
          }
          
          clickedEl = target;
        }
    }, true);

chrome.runtime.onMessage.addListener(function(site) {
  console.log(clickedEl);
  console.log('edit: '+site);
  
  var uuid = href_re.exec(clickedEl.parentElement.href)[1];
  if (uuid !== site) {
    console.error("href !== site");
    console.log(uuid);
    console.log(site);
    return;
  };

  //var span = elems[uuid];
  var span = clickedEl;
  var title = span.textContent;

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
      span.textContent = title;
      console.log(uuid+' ->X ('+span.textContent+')');
    } else {
      var obj = {};
      obj[uuid] = span.textContent;
      chrome.storage.sync.set(obj);
      chrome.storage.sync.get(uuid, function(value) {
        for (i=0; i<spans.length; i++) {
          var a = spans[i].parentElement;
          var uuid_search = (href_re.exec(a.href) || data_re.exec(a.nextElementSibling.getAttribute('data')));
          if (uuid_search === null) {
            continue;
          }
          itr_uuid = uuid_search[1];
          if (itr_uuid === uuid) {
            console.log(itr_uuid+' -> '+value[uuid]);
            spans[i].textContent = value[uuid];
          }
        }
      });
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
