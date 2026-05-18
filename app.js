(function () {
  var STORAGE_KEY = "climb-log-v3";
  var OLD_STORAGE_KEY = "climb-log-v2";
  var THEME_KEY = "climb-log-theme";
  var gymEditing = false;

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

  var styleColors = {
    Dynamic: "#68a96f",
    Coordination: "#f0b93f",
    Power: "#ef6a2e",
    Balance: "#72a6c8",
  };

  var state = loadState();

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function defaultState() {
    return {
      profile: {
        name: "SHOKO",
        bio: "Climbing since 2026",
        avatar: "",
      },
      gyms: [{ id: createId(), name: "Demo Gym" }],
      routes: [],
    };
  }

  function loadState() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(OLD_STORAGE_KEY);
      var parsed = saved ? JSON.parse(saved) : defaultState();
      parsed.profile = parsed.profile || defaultState().profile;
      parsed.gyms = (parsed.gyms || []).map(function (gym) {
        return { id: gym.id || createId(), name: gym.name || "Gym" };
      });
      parsed.routes = parsed.routes || [];
      return parsed;
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
    return gym ? gym.name : "\u672a\u77e5\u5ca9\u9986";
  }

  function getTypeLabel(type) {
    return typeLabels[type] || type || "-";
  }

  function getStyleLabel(style) {
    return styleLabels[style] || style || "\u672a\u9009";
  }

  function shortGrade(grade) {
    var value = String(grade || "");
    if (value === "Advanced") return "Adv.";
    if (value === "Intermediate") return "Inter.";
    if (value === "Competition") return "Comp.";
    if (value === "Beginner") return "Beg.";
    return value;
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

  function routeDates() {
    return Array.from(new Set(state.routes.map(function (route) { return route.date; }).filter(Boolean))).sort();
  }

  function currentStreak() {
    var dates = routeDates();
    if (!dates.length) return 0;
    var set = {};
    dates.forEach(function (date) { set[date] = true; });
    var cursor = new Date(today() + "T00:00:00");
    var streak = 0;
    while (set[cursor.toISOString().slice(0, 10)]) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function renderGymOptions() {
    var selected = $("#gymSelect").value;
    $("#gymSelect").innerHTML = "";
    state.gyms.forEach(function (gym) {
      var option = document.createElement("option");
      option.value = gym.id;
      option.textContent = gym.name;
      $("#gymSelect").appendChild(option);
    });
    if (selected && state.gyms.some(function (gym) { return gym.id === selected; })) {
      $("#gymSelect").value = selected;
    }
    renderTodayGym();
  }

  function renderTodayGym() {
    $("#todayGymName").textContent = getGymName($("#gymSelect").value || (state.gyms[0] && state.gyms[0].id));
  }

  function renderGyms() {
    var container = $("#gymList");
    container.innerHTML = "";
    if (!state.gyms.length) {
      container.appendChild(emptyNode());
      return;
    }
    state.gyms.forEach(function (gym) {
      var row = document.createElement("div");
      row.className = "gym-row";
      row.setAttribute("data-gym-id", gym.id);
      row.innerHTML =
        "<span>" + escapeHtml(gym.name) + "</span>" +
        (gymEditing ? '<button type="button" data-action="delete-gym">\u5220\u9664</button>' : "<em>›</em>");
      container.appendChild(row);
    });
  }

  function renderRecent() {
    var container = $("#recentList");
    container.innerHTML = "";
    var routes = state.routes.slice().sort(function (a, b) {
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    }).slice(0, 3);
    if (!routes.length) {
      container.appendChild(emptyNode("\u36824\u6ca1\u6709\u6700\u8fd1\u8bb0\u5f55\u3002"));
      return;
    }
    routes.forEach(function (route, index) {
      var card = document.createElement("article");
      card.className = "recent-card";
      card.setAttribute("data-route-id", route.id);
      card.innerHTML =
        '<div class="grade-badge badge-' + (index % 3) + '">' + escapeHtml(shortGrade(route.grade)) + "</div>" +
        "<div><strong>" + escapeHtml(getStyleLabel(route.style)) + "</strong><span>" + escapeHtml(getGymName(route.gymId)) + (route.note ? " · " + escapeHtml(route.note) : "") + "</span></div>" +
        (route.photo ? '<img class="recent-thumb" src="' + route.photo + '" alt="photo" />' : "") +
        '<button type="button" data-action="delete-route" aria-label="\u5220\u9664">🗑</button>';
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

  function renderStatsSummary() {
    $("#totalRoutes").textContent = state.routes.length;
    $("#climbDays").textContent = routeDates().length;
    $("#statsStreak").textContent = currentStreak();
    $("#homeStreak").textContent = currentStreak();
  }

  function renderToday() {
    var count = state.routes.filter(function (route) { return route.date === $("#dateInput").value; }).length;
    $("#todayRouteCount").textContent = count;
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
      var hasTypeData = state.routes.some(function (route) {
        return (route.type || "Boulder") === type;
      });
      if (!hasTypeData) return;
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

  function renderStyleChart() {
    var canvas = $("#styleCanvas");
    var legend = $("#styleLegend");
    var ctx = canvas.getContext("2d");
    var counts = countBy(state.routes, function (route) { return route.style || "Dynamic"; });
    var keys = ["Dynamic", "Coordination", "Power", "Balance"];
    var total = keys.reduce(function (sum, key) { return sum + (counts[key] || 0); }, 0) || 1;
    var start = -Math.PI / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    keys.forEach(function (key) {
      var value = counts[key] || 0;
      var end = start + (value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(110, 110);
      ctx.arc(110, 110, 86, start, end);
      ctx.closePath();
      ctx.fillStyle = styleColors[key];
      ctx.fill();
      start = end;
    });
    ctx.beginPath();
    ctx.arc(110, 110, 42, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--panel").trim() || "#fff";
    ctx.fill();
    ctx.fillStyle = "#777";
    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("▲", 110, 120);
    legend.innerHTML = "";
    keys.forEach(function (key) {
      var value = counts[key] || 0;
      var percent = Math.round((value / total) * 100);
      var item = document.createElement("div");
      item.innerHTML = '<span style="background:' + styleColors[key] + '"></span><em>' + getStyleLabel(key) + '</em><strong>' + percent + "%</strong>";
      legend.appendChild(item);
    });
  }

  function renderAll() {
    renderProfile();
    renderGymOptions();
    renderGyms();
    renderRecent();
    renderStatsSummary();
    renderToday();
    renderGradeHeatmap();
    renderStyleChart();
  }

  function renderProfile() {
    var profile = state.profile || defaultState().profile;
    var avatarTargets = ["#homeAvatar", "#statsAvatar", "#statsProfileAvatar", "#settingsAvatar"];
    avatarTargets.forEach(function (selector) {
      var node = $(selector);
      if (!node) return;
      if (profile.avatar) {
        node.style.backgroundImage = "url(" + profile.avatar + ")";
      } else {
        node.style.backgroundImage = "";
      }
    });
    $("#statsUserName").textContent = profile.name || "SHOKO";
    $("#settingsUserName").textContent = profile.name || "SHOKO";
    $("#statsUserBio").textContent = profile.bio || "Climbing since 2026";
    $("#settingsUserBio").textContent = profile.bio || "\u70ed\u7231\u6500\u5ca9\u7684\u8bb0\u5f55\u8005";
    $("#profileNameInput").value = profile.name || "";
    $("#profileBioInput").value = profile.bio || "";
  }

  function addGym(name) {
    var trimmedName = String(name || "").trim();
    if (!trimmedName) return null;
    var existing = state.gyms.find(function (gym) { return gym.name === trimmedName; });
    if (existing) return existing;
    var gym = { id: createId(), name: trimmedName };
    state.gyms.push(gym);
    saveState();
    renderAll();
    return gym;
  }

  function deleteRoute(routeId) {
    if (!window.confirm("\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u8bb0\u5f55\u5417\uff1f")) return;
    state.routes = state.routes.filter(function (route) { return route.id !== routeId; });
    saveState();
    renderAll();
  }

  function deleteGym(gymId) {
    if (!window.confirm("\u5220\u9664\u5ca9\u9986\u4f1a\u540c\u65f6\u5220\u9664\u5b83\u4e0b\u9762\u7684\u8bb0\u5f55\uff0c\u786e\u5b9a\u5417\uff1f")) return;
    state.gyms = state.gyms.filter(function (gym) { return gym.id !== gymId; });
    state.routes = state.routes.filter(function (route) { return route.gymId !== gymId; });
    saveState();
    renderAll();
  }

  function updateGradeOptions(type) {
    var input = $("#gradeInput");
    var previous = input.value;
    var options = gradeOptions[type] || gradeOptions.Boulder;
    input.innerHTML = "";
    options.forEach(function (grade) {
      var option = document.createElement("option");
      option.value = grade;
      option.textContent = grade;
      input.appendChild(option);
    });
    input.value = options.indexOf(previous) === -1 ? options[Math.min(4, options.length - 1)] : previous;
  }

  function readPhotoFile(file) {
    return new Promise(function (resolve) {
      if (!file) return resolve("");
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { resolve(""); };
      reader.readAsDataURL(file);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_KEY, theme);
    $("#themeSelect").value = theme;
  }

  function initTheme() {
    applyTheme(window.localStorage.getItem(THEME_KEY) || "chalk");
  }

  function init() {
    initTheme();
    $("#dateInput").value = today();
    updateGradeOptions($("#typeInput").value);

    $("#gymSelect").addEventListener("change", renderTodayGym);
    $("#dateInput").addEventListener("change", renderToday);
    $("#todayButton").addEventListener("click", function () {
      $("#dateInput").value = today();
      renderToday();
    });

    $("#routeForm").addEventListener("submit", function (event) {
      event.preventDefault();
      if (!state.gyms.length) return window.alert("\u8bf7\u5148\u6dfb\u52a0\u4e00\u4e2a\u5ca9\u9986\u3002");
      readPhotoFile($("#photoInput").files && $("#photoInput").files[0]).then(function (photo) {
        state.routes.push({
          id: createId(),
          gymId: $("#gymSelect").value,
          date: $("#dateInput").value,
          type: $("#typeInput").value,
          grade: $("#gradeInput").value,
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
        renderAll();
      });
    });

    $("#typePicks").addEventListener("click", function (event) {
      var button = event.target.closest("[data-type]");
      if (!button) return;
      $("#typeInput").value = button.getAttribute("data-type");
      updateGradeOptions($("#typeInput").value);
      $all("#typePicks .pill").forEach(function (pill) { pill.classList.toggle("active", pill === button); });
    });

    $("#stylePicks").addEventListener("click", function (event) {
      var button = event.target.closest("[data-style]");
      if (!button) return;
      $("#styleInput").value = button.getAttribute("data-style");
      $all("#stylePicks .pill").forEach(function (pill) { pill.classList.toggle("active", pill === button); });
    });

    $("#photoInput").addEventListener("change", function () {
      var file = $("#photoInput").files && $("#photoInput").files[0];
      if (!file) return;
      readPhotoFile(file).then(function (photo) {
        $("#photoPreview").innerHTML = '<img src="' + photo + '" alt="photo" />';
        $("#photoPreview").classList.remove("hidden");
      });
    });

    $("#recentList").addEventListener("click", function (event) {
      var button = event.target.closest("[data-action='delete-route']");
      if (!button) return;
      deleteRoute(button.closest("[data-route-id]").getAttribute("data-route-id"));
    });

    $("#showAllRecent").addEventListener("click", function () {
      setActiveView("stats");
    });

    $("#gymForm").addEventListener("submit", function (event) {
      event.preventDefault();
      var gym = addGym($("#gymNameInput").value);
      if (gym) {
        $("#gymNameInput").value = "";
        $("#gymSelect").value = gym.id;
        renderTodayGym();
      }
    });

    $("#toggleGymEdit").addEventListener("click", function () {
      gymEditing = !gymEditing;
      $("#toggleGymEdit").textContent = gymEditing ? "\u5b8c\u6210" : "\u7f16\u8f91";
      renderGyms();
    });

    $("#gymList").addEventListener("click", function (event) {
      var button = event.target.closest("[data-action='delete-gym']");
      if (!button) return;
      deleteGym(button.closest("[data-gym-id]").getAttribute("data-gym-id"));
    });

    $("#profileCard").addEventListener("click", function () {
      $("#profileEditor").classList.toggle("hidden");
    });

    $("#saveProfileButton").addEventListener("click", function () {
      var file = $("#profileAvatarInput").files && $("#profileAvatarInput").files[0];
      readPhotoFile(file).then(function (avatar) {
        state.profile = {
          name: $("#profileNameInput").value.trim() || "SHOKO",
          bio: $("#profileBioInput").value.trim() || "Climbing since 2026",
          avatar: avatar || (state.profile && state.profile.avatar) || "",
        };
        $("#profileAvatarInput").value = "";
        saveState();
        renderProfile();
        $("#profileEditor").classList.add("hidden");
      });
    });

    $("#themeSelect").addEventListener("change", function () {
      applyTheme($("#themeSelect").value);
      renderStyleChart();
    });

    $(".tabbar").addEventListener("click", function (event) {
      var tab = event.target.closest("[data-view]");
      if (tab) setActiveView(tab.getAttribute("data-view"));
    });

    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
