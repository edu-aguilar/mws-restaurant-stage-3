window.addEventListener('load', (event) => {
  setHeaderBehavior();
  hideMapLibraryLinks();
});

const setHeaderBehavior = () => {
  let prevScrollpos = window.pageYOffset;
  let headerElem = document.querySelector("body > header");
  let headerHeight = headerElem.offsetHeight;

  window.onscroll = () => {
    var currentScrollPos = window.pageYOffset;

    if (currentScrollPos > headerHeight) {
      headerElem.style.top = prevScrollpos > currentScrollPos ? '0' : `-${headerHeight}px`;
    }
    prevScrollpos = currentScrollPos;

  }
}

const hideMapLibraryLinks = () => {
  let mapLinks = document.querySelectorAll('div.leaflet-bottom.leaflet-right');
  mapLinks.forEach(map => map.style.visibility = 'hidden');
}