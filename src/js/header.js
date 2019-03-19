
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

module.exports = {
  setBehavior: setHeaderBehavior
}