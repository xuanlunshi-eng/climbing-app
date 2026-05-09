(function () {
  var STORAGE_KEY = "climb-log-v2";

  var typeLabels = {
    Boulder: "\u62b1\u77f3",
    AutoBelay: "\u81ea\u4fdd",
    TopRope: "\u9876\u7ef3",
    Lead: "\u5148\u950b",
    Speed: "\u901f\u5ea6",
    Rope: "\u7ef3\u7d22",
  };

  var styleLabels = {
    Dynamic: "\u52a8\u6001",
    Coordination: "\u534f\u8c03",
    Balance: "\u5e73\u8861",
    Power: "\u529b\u91cf",
  };

  var gradeOptions = {
    Boulder: ["VB", "V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10+"],
    AutoBelay: ["5.6", "5.7", "5.8", "5.9", "5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a+"],
    TopRope: ["5.6", "5.7", "5.8", "5.9", "5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a+"],
    Lead: ["5.7", "5.8", "5.9", "5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a", "5.12b+"],
    Speed: ["Beginner", "Intermediate", "Advanced", "Competition"],
    Rope: ["5.6", "5.7", "5.8", "5.9", "5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a+"],
  };

  var state = loadState();

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function text(key) {
    var dict = {
      allGyms: "\u5168\u90e8\u5ca9\u9986",
      unknownGym: "\u672a\u77e5\u5ca9\u9986",
      noArea: "\u672a\u586b\u533a\u57df",
      routes: "\u6761\u7ebf\u8def",
      gym: "\u5ca9\u9986",
      empty: "\u8fd8\u6ca1\u6709\u6570\u636e\uff0c\u5148\u8bb0\u5f55\u4e00\u6761\u7ebf\u8def\u5427\u3002",
      missingGym: "\u8bf7\u5148\u6dfb\u52a0\u4e00\u4e2a\u5ca9\u9986\u3002",
      copied: "\u6570\u636e\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f\u3002",
      style: "\u98ce\u683c",
      delete: "\u5220\u9664",
      deleteRouteConfirm: "\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u7ebf\u8def\u8bb0\u5f55\u5417\uff1f",
      deleteGymConfirm: "\u5220\u9664\u8fd9\u4e2a\u5ca9\u9986\u4f1a\u540c\u65f6\u5220\u9664\u5b83\u4e0b\u9762\u7684\u7ebf\u8def\u8bb0\u5f55\uff0c\u786e\u5b9a\u5417\uff1f",
      photo: "\u7167\u7247",
    };
    return dict[key] || key;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function defaultState() {
    return {
      gyms: [{ id: createId(), name: "Demo Gym", city: "Shanghai" }],
      routes: [],
    };
  }

  function loadState() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultState();
    } catch (error) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      window.alert("Save failed. Photos may be too large for browser storage.");
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function getGymName(id) {
    var gym = state.gyms.find(function (item) {
      return item.id === id;
    });
    return gym ? gym.name : text("unknownGym");
  }

  function getTypeLabel(type) {
    return typeLabels[type] || type || "-";
  }

  function getStyleLabel(style) {
    return styleLabels[style] || style || "";
  }

  function emptyNode(message) {
    var node = $("#emptyTemplate").content.firstElementChild.cloneNode(true);
    if (message) node.textContent = message;
    return node;
  }

  function setActiveView(viewName) {
    $all(".view").forEach(function (view) {
      view.classList.remove("active");
    });
    $("#view-" + viewName).classList.add("active");
    $all(".tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-view") === viewName);
    });
  }

  function renderGymOptions() {
    var gymSelect = $("#gymSelect");
    var historyGymFilter = $("#historyGymFilter");
    gymSelect.innerHTML = "";
    historyGymFilter.innerHTML = "";

    var allOption = document.createElement("option");
    allOption.value = "All";
    allOption.textContent = text("allGyms");
    historyGymFilter.appendChild(allOption);

    state.gyms.forEach(function (gym) {
      var option = document.createElement("option");
      option.value = gym.id;
      option.textContent = gym.name;
      gymSelect.appendChild(option);

      var filterOption = document.createElement("option");
      filterOption.value = gym.id;
      filterOption.textContent = gym.name;
      historyGymFilter.appendChild(filterOption);
    });
  }

  function renderGyms() {
    var container = $("#gymList");
    container.innerHTML = "";
    if (!state.gyms.length) {
      container.appendChild(emptyNode());
      return;
    }

    state.gyms.forEach(function (gym) {
      var routeCount = state.routes.filter(function (route) {
        return route.gymId === gym.id;
      }).length;
      var card = document.createElement("article");
      card.className = "item-card";
      card.setAttribute("data-gym-id", gym.id);
      card.innerHTML =
        '<div class="item-top"><div>' +
        '<div class="item-title">' + escapeHtml(gym.name) + "</div>" +
        '<div class="item-subtitle">' + escapeHtml(gym.city || text("noArea")) + " - " + routeCount + " " + text("routes") + "</div>" +
        "</div>" +
        '<div class="item-actions"><span class="badge sent">' + text("gym") + "</span>" +
        '<button class="danger-button" type="button" data-action="delete-gym" aria-label="' + text("delete") + '">x</button></div></div>';
      container.appendChild(card);
    });
  }

  function countBy(items, getKey) {
    return items.reduce(function (result, item) {
      var key = getKey(item) || "-";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
  }

  function renderGradeHeatmap() {
    var container = $("#gradeHeatmap");
    container.innerHTML = "";
    if (!state.routes.length) {
      container.appendChild(emptyNode());
      return;
    }

    var counts = countBy(state.routes, function (route) {
      return (route.type || "Boulder") + "::" + route.grade;
    });
    var max = Object.keys(counts).reduce(function (result, key) {
      return Math.max(result, counts[key]);
    }, 1);

    Object.keys(gradeOptions).forEach(function (type) {
      var grades = gradeOptions[type].slice();
      state.routes.forEach(function (route) {
        if ((route.type || "Boulder") === type && grades.indexOf(route.grade) === -1) {
          grades.push(route.grade);
        }
      });

      var rowHasData = grades.some(function (grade) {
        return counts[type + "::" + grade];
      });
      if (!rowHasData) return;

      var row = document.createElement("div");
      row.className = "heatmap-row";
      row.innerHTML = '<div class="heatmap-label">' + escapeHtml(getTypeLabel(type)) + '</div><div class="heatmap-cells"></div>';
      var cells = row.querySelector(".heatmap-cells");
      grades.forEach(function (grade) {
        var value = counts[type + "::" + grade] || 0;
        var cell = document.createElement("div");
        cell.className = "heatmap-cell";
        cell.style.setProperty("--heat", String(value / max));
        cell.innerHTML = "<strong>" + escapeHtml(grade) + "</strong><span>" + value + "</span>";
        cells.appendChild(cell);
      });
      container.appendChild(row);
    });
  }

  function renderStats() {
    renderGradeHeatmap();
  }

  function renderRouteCards(container, routes) {
    var lastDate = "";
    routes.forEach(function (route) {
      if (route.date !== lastDate) {
        var heading = document.createElement("div");
        heading.className = "date-heading";
        heading.textContent = route.date === today() ? "\u4eca\u5929" : route.date;
        container.appendChild(heading);
        lastDate = route.date;
      }

      var card = document.createElement("article");
      card.className = "item-card";
      card.setAttribute("data-route-id", route.id);
      card.innerHTML =
        '<div class="item-top"><div>' +
        '<div class="item-title">' +
        escapeHtml(route.grade) +
        " - " +
        escapeHtml(getTypeLabel(route.type)) +
        (route.style ? " - " + escapeHtml(getStyleLabel(route.style)) : "") +
        "</div>" +
        '<div class="item-subtitle">' +
        escapeHtml(getGymName(route.gymId)) +
        " - " +
        route.date +
        " - " +
        route.attempts +
        " tries</div></div>" +
        '<div class="item-actions"><button class="danger-button" type="button" data-action="delete-route" aria-label="' + text("delete") + '">x</button></div></div>' +
        (route.photo ? '<img class="route-photo" src="' + route.photo + '" alt="' + text("photo") + '" />' : "") +
        (route.note ? '<div class="item-note">' + escapeHtml(route.note) + "</div>" : "");
      container.appendChild(card);
    });
  }

  function renderRoutes() {
    var container = $("#routeList");
    var gymFilter = $("#historyGymFilter").value;
    var typeFilter = $("#historyTypeFilter").value;
    container.innerHTML = "";

    var routes = state.routes
      .filter(function (route) {
        return gymFilter === "All" || route.gymId === gymFilter;
      })
      .filter(function (route) {
        return typeFilter === "All" || route.type === typeFilter;
      })
      .sort(function (a, b) {
        return b.date.localeCompare(a.date) || String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      });

    if (!routes.length) {
      container.appendChild(emptyNode());
      return;
    }
    renderRouteCards(container, routes);
  }

  function renderToday() {
    var count = state.routes.filter(function (route) {
      return route.date === today();
    }).length;
    $("#todayDateLabel").textContent = today();
    $("#todayRouteCount").textContent = count;
  }

  function renderAll() {
    renderGymOptions();
    renderGyms();
    renderStats();
    renderRoutes();
    renderToday();
  }

  function addGym(name, city) {
    var trimmedName = String(name || "").trim();
    if (!trimmedName) return null;
    var existing = state.gyms.find(function (gym) {
      return gym.name === trimmedName;
    });
    if (existing) return existing;

    var gym = { id: createId(), name: trimmedName, city: String(city || "").trim() };
    state.gyms.push(gym);
    saveState();
    renderAll();
    return gym;
  }

  function deleteRoute(routeId) {
    if (!window.confirm(text("deleteRouteConfirm"))) return;
    state.routes = state.routes.filter(function (route) {
      return route.id !== routeId;
    });
    saveState();
    renderAll();
  }

  function deleteGym(gymId) {
    if (!window.confirm(text("deleteGymConfirm"))) return;
    state.gyms = state.gyms.filter(function (gym) {
      return gym.id !== gymId;
    });
    state.routes = state.routes.filter(function (route) {
      return route.gymId !== gymId;
    });
    saveState();
    renderAll();
  }

  function updateGradeSuggestions(type) {
    var input = $("#gradeInput");
    var options = gradeOptions[type] || gradeOptions.Boulder;
    var previous = input.value;
    input.innerHTML = "";
    options.forEach(function (grade) {
      var option = document.createElement("option");
      option.value = grade;
      option.textContent = grade;
      input.appendChild(option);
    });
    input.value = options.indexOf(previous) === -1 ? options[0] : previous;
  }

  function readPhotoFile(file) {
    return new Promise(function (resolve) {
      if (!file) {
        resolve("");
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function () {
        resolve("");
      };
      reader.readAsDataURL(file);
    });
  }

  function init() {
    $("#dateInput").value = today();
    updateGradeSuggestions($("#typeInput").value);

    $("#todayButton").addEventListener("click", function () {
      $("#dateInput").value = today();
    });

    $("#routeForm").addEventListener("submit", function (event) {
      event.preventDefault();
      if (!state.gyms.length) {
        window.alert(text("missingGym"));
        return;
      }

      readPhotoFile($("#photoInput").files && $("#photoInput").files[0]).then(function (photo) {
        state.routes.push({
          id: createId(),
          gymId: $("#gymSelect").value,
          date: $("#dateInput").value,
          type: $("#typeInput").value,
          grade: String($("#gradeInput").value).trim(),
          attempts: Number($("#attemptsInput").value || 1),
          style: $("#styleInput").value,
          note: $("#noteInput").value.trim(),
          photo: photo,
          createdAt: new Date().toISOString(),
        });
        saveState();

        $("#noteInput").value = "";
        $("#photoInput").value = "";
        $("#photoPreview").classList.add("hidden");
        $("#photoPreview").innerHTML = "";
        $("#attemptsInput").value = "1";
        $("#dateInput").value = today();
        renderAll();
        setActiveView("today");
      });
    });

    $("#gymForm").addEventListener("submit", function (event) {
      event.preventDefault();
      var gym = addGym($("#gymNameInput").value, $("#gymCityInput").value);
      if (gym) {
        $("#gymNameInput").value = "";
        $("#gymCityInput").value = "";
        $("#gymSelect").value = gym.id;
      }
    });

    $("#typePicks").addEventListener("click", function (event) {
      var button = event.target.closest("[data-type]");
      if (!button) return;
      $("#typeInput").value = button.getAttribute("data-type");
      updateGradeSuggestions($("#typeInput").value);
      $all("#typePicks .quick-chip").forEach(function (chip) {
        chip.classList.toggle("active", chip === button);
      });
    });

    $("#stylePicks").addEventListener("click", function (event) {
      var button = event.target.closest("[data-style]");
      if (!button) return;
      var value = button.getAttribute("data-style");
      var nextValue = $("#styleInput").value === value ? "" : value;
      $("#styleInput").value = nextValue;
      $all("#stylePicks .quick-chip").forEach(function (chip) {
        chip.classList.toggle("active", chip.getAttribute("data-style") === nextValue);
      });
    });

    $("#attemptMinus").addEventListener("click", function () {
      $("#attemptsInput").value = String(Math.max(1, Number($("#attemptsInput").value || 1) - 1));
    });

    $("#attemptPlus").addEventListener("click", function () {
      $("#attemptsInput").value = String(Number($("#attemptsInput").value || 1) + 1);
    });

    $("#toggleNoteButton").addEventListener("click", function () {
      $("#noteField").classList.toggle("collapsed");
      if (!$("#noteField").classList.contains("collapsed")) {
        $("#noteInput").focus();
      }
    });

    $("#photoInput").addEventListener("change", function () {
      var file = $("#photoInput").files && $("#photoInput").files[0];
      var preview = $("#photoPreview");
      if (!file) {
        preview.classList.add("hidden");
        preview.innerHTML = "";
        return;
      }
      readPhotoFile(file).then(function (photo) {
        preview.innerHTML = '<img src="' + photo + '" alt="' + text("photo") + '" />';
        preview.classList.remove("hidden");
      });
    });

    $(".tabbar").addEventListener("click", function (event) {
      var tab = event.target.closest("[data-view]");
      if (tab) setActiveView(tab.getAttribute("data-view"));
    });

    $("#historyGymFilter").addEventListener("change", renderRoutes);
    $("#historyTypeFilter").addEventListener("change", renderRoutes);

    $("#routeList").addEventListener("click", function (event) {
      var button = event.target.closest('[data-action="delete-route"]');
      if (!button) return;
      var card = button.closest("[data-route-id]");
      if (card) deleteRoute(card.getAttribute("data-route-id"));
    });

    $("#gymList").addEventListener("click", function (event) {
      var button = event.target.closest('[data-action="delete-gym"]');
      if (!button) return;
      var card = button.closest("[data-gym-id]");
      if (card) deleteGym(card.getAttribute("data-gym-id"));
    });

    window.addEventListener("resize", renderGradeHeatmap);

    $("#exportButton").addEventListener("click", function () {
      var payload = JSON.stringify(state, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload).then(function () {
          window.alert(text("copied"));
        });
        return;
      }
      window.prompt("Copy data", payload);
    });

    if (location.protocol.indexOf("http") === 0 && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    }

    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
