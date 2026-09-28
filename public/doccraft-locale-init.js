(function () {
  var match = document.cookie.match(/(?:^|;\s*)doccraft_locale=(th|en)(?:;|$)/);
  if (match && (match[1] === 'th' || match[1] === 'en')) {
    document.documentElement.lang = match[1];
  }
})();
