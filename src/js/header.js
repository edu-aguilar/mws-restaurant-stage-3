
const setHeaderBehavior = () => {
  let prevScrollpos = window.pageYOffset;
  let headerElem = document.querySelector("body > header");
  let headerHeight = headerElem.offsetHeight;
  let alert = createAlert();
  document.body.appendChild(alert);

  window.onscroll = () => {
    var currentScrollPos = window.pageYOffset;

    if (currentScrollPos > headerHeight) {
      headerElem.style.top = prevScrollpos > currentScrollPos ? '0' : `-${headerHeight}px`;
    }
    prevScrollpos = currentScrollPos;

  }

  function createAlert() {
    var connectionAlert = document.createElement("p");
    connectionAlert.setAttribute("tabindex", "-1");
    connectionAlert.setAttribute("id", "connectionAlert");
    connectionAlert.className = 'connection-alert';
    var alertText = document.createTextNode("Connection lost!! your requests will be performed when connection returns");
    connectionAlert.appendChild(alertText);
    return connectionAlert;
  }

}

module.exports = {
  setBehavior: setHeaderBehavior
}