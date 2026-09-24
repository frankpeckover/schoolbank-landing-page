(function () {
  var dialog = document.getElementById("login-dialog");
  var triggers = document.querySelectorAll(".app-login-trigger");
  var closeButton = document.querySelector("[data-login-close]");
  var searchInput = document.getElementById("organisation-search");
  var list = document.getElementById("organisation-list");
  var status = document.querySelector("[data-login-status]");
  var organisations = [];
  var hasLoaded = false;
  var maxVisibleOrganisations = 5;

  if (!dialog || !triggers.length || !searchInput || !list) {
    return;
  }

  function openDialog() {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    loadOrganisations();
    window.setTimeout(function () {
      searchInput.focus();
    }, 40);
  }

  function closeDialog() {
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function setStatus(message) {
    list.innerHTML = "";
    status = document.createElement("p");
    status.className = "organisation-status";
    status.textContent = message;
    list.appendChild(status);
  }

  function loadOrganisations() {
    if (hasLoaded) {
      renderOrganisations(searchInput.value);
      return;
    }

    hasLoaded = true;
    setStatus("Loading organisations...");

    fetch("/api/public/organisation", {
      headers: {
        accept: "application/json"
      }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Organisation lookup failed");
        }

        return response.json();
      })
      .then(function (payload) {
        organisations = Array.isArray(payload.organisations) ? payload.organisations : [];
        renderOrganisations(searchInput.value);
      })
      .catch(function () {
        hasLoaded = false;
        setStatus("We couldn't load organisations. Please try again or contact support.");
      });
  }

  function renderOrganisations(query) {
    var normalisedQuery = query.trim().toLowerCase();
    var matches = organisations.filter(function (organisation) {
      var name = String(organisation.name || "").toLowerCase();
      var slug = String(organisation.slug || "").toLowerCase();
      return !normalisedQuery || name.indexOf(normalisedQuery) !== -1 || slug.indexOf(normalisedQuery) !== -1;
    });

    list.innerHTML = "";

    if (!organisations.length) {
      setStatus("No organisations are available for login yet.");
      return;
    }

    if (!matches.length) {
      setStatus("No organisations match that search.");
      return;
    }

    matches.slice(0, maxVisibleOrganisations).forEach(function (organisation) {
      var button = document.createElement("button");
      button.className = "organisation-option";
      button.type = "button";
      button.setAttribute("role", "option");
      button.dataset.loginUrl = organisation.loginUrl || "";

      var name = document.createElement("span");
      name.className = "organisation-option-name";
      name.textContent = organisation.name || "Unnamed organisation";

      var action = document.createElement("span");
      action.className = "organisation-option-action";
      action.textContent = "Continue";

      button.appendChild(name);
      button.appendChild(action);

      button.addEventListener("click", function () {
        if (button.dataset.loginUrl) {
          window.location.href = button.dataset.loginUrl;
        }
      });

      list.appendChild(button);
    });
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", openDialog);
  });

  if (closeButton) {
    closeButton.addEventListener("click", closeDialog);
  }

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
      closeDialog();
    }
  });

  searchInput.addEventListener("input", function () {
    renderOrganisations(searchInput.value);
  });
})();
