(function () {
  "use strict";

  var runtimeKey = Symbol.for("lamplight.living-light.v1");
  var runtime = document[runtimeKey];
  if (runtime) {
    runtime.start();
    return;
  }
  runtime = { state: "waiting", start: start };
  document[runtimeKey] = runtime;

  function start() {
    if (runtime.state === "lit" || !document.body) return;
    runtime.state = "starting";

  var currentSheen = null;
  var currentSheenRect = null;
  var dwellArm = null;
  var dwellTweens = new Map();
  var latestPointer = null;
  var frame = 0;
  var wireRects = [];
  var wireRectsDirty = true;
  var activeWire = null;
  var activePress = null;
  var keyboardPress = null;
  var inputModality = "pointer";
  var activeBeamField = null;
  var activeBeam = null;
  var pendingBeam = null;
  var focalCatchesByRoom = new Map();
  var focalRoomByCatch = new WeakMap();
  var warnedFocalCatches = new WeakSet();
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var interactiveSelector = "button, a[href], input, select, textarea, summary, [role=tab], [role=menuitem], .l-btn, .l-toggle, .l-check";

  function tokenStyles() {
    return window.getComputedStyle(document.documentElement);
  }

  function tokenNumber(styles, name, fallback) {
    var value = parseFloat(styles.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  }

  function tokenTime(styles, name, fallback) {
    var raw = styles.getPropertyValue(name).trim();
    var value = parseFloat(raw);
    if (!Number.isFinite(value)) return fallback;
    return raw.endsWith("ms") ? value : raw.endsWith("s") ? value * 1000 : value;
  }

  var computedTokens = tokenStyles();
  var DWELL_DELAY = tokenTime(computedTokens, "--lamp-dwell-delay", 1200);
  var DWELL_EASE = tokenTime(computedTokens, "--lamp-dwell-ease", 1600);
  var SIZE_MIN = tokenNumber(computedTokens, "--lamp-sheen-size-min", 140);
  var SIZE_MAX = tokenNumber(computedTokens, "--lamp-sheen-size-max", 460);
  var WIRE_RADIUS = tokenNumber(computedTokens, "--lamp-wire-gleam-radius", 140);

  function motionIsReduced(node) {
    if (node && node.closest && node.closest('[data-surface="folio"]')) return true;
    var bodyDeclared = document.body && document.body.dataset.motion;
    var room = node && node.closest ? node.closest(".l-room") : null;
    var declaredFull = bodyDeclared === "full";
    if (bodyDeclared === "reduced") return true;
    while (room) {
      if (room.dataset.motion === "reduced") return true;
      if (room.dataset.motion === "full") declaredFull = true;
      room = room.parentElement && room.parentElement.closest(".l-room");
    }
    if (declaredFull) return false;
    return reduced.matches;
  }

  function scheduleFrame() {
    if (!frame && !document.hidden) frame = window.requestAnimationFrame(runFrame);
  }

  function roomFor(node) {
    return node && (node.closest(".l-room") || document.body);
  }

  function syncFocalRoom(room) {
    var registered = focalCatchesByRoom.get(room);
    if (!registered) return;
    var catches = Array.from(registered).filter(function (catchNode) {
      return catchNode.isConnected && roomFor(catchNode) === room;
    }).sort(function (left, right) {
      if (left === right) return 0;
      return left.compareDocumentPosition(right) & 4 ? -1 : 1;
    });
    if (!catches.length) {
      focalCatchesByRoom.delete(room);
      return;
    }
    focalCatchesByRoom.set(room, new Set(catches));
    catches.forEach(function (catchNode, index) {
      if (!index) {
        delete catchNode.dataset.focalSuppressed;
        delete catchNode.dataset.focalAuthoring;
        return;
      }
      catchNode.dataset.focalSuppressed = "true";
      catchNode.dataset.focalAuthoring = "duplicate";
      if (!warnedFocalCatches.has(catchNode)) {
        warnedFocalCatches.add(catchNode);
        if (window.console && window.console.warn) {
          window.console.warn("Lamplight FocalCatch: only the first FocalCatch in a Room carries the focal light. This duplicate remains visible without the effect.", catchNode);
        }
      }
    });
  }

  function focalNodesWithin(node) {
    if (!node || node.nodeType !== 1) return [];
    var catches = node.matches(".l-focal-catch") ? [node] : [];
    return catches.concat(Array.from(node.querySelectorAll(".l-focal-catch")));
  }

  function registerFocalNode(catchNode, affectedRooms) {
    var room = roomFor(catchNode);
    var previousRoom = focalRoomByCatch.get(catchNode);
    if (previousRoom && previousRoom !== room) {
      var previous = focalCatchesByRoom.get(previousRoom);
      if (previous) previous.delete(catchNode);
      affectedRooms.add(previousRoom);
    }
    if (!focalCatchesByRoom.has(room)) focalCatchesByRoom.set(room, new Set());
    focalCatchesByRoom.get(room).add(catchNode);
    focalRoomByCatch.set(catchNode, room);
    affectedRooms.add(room);
  }

  function unregisterFocalNode(catchNode, affectedRooms) {
    var room = focalRoomByCatch.get(catchNode);
    if (!room) return;
    var registered = focalCatchesByRoom.get(room);
    if (registered) registered.delete(catchNode);
    focalRoomByCatch.delete(catchNode);
    affectedRooms.add(room);
  }

  function registerFocalCatches() {
    var affectedRooms = new Set();
    document.querySelectorAll(".l-focal-catch").forEach(function (catchNode) {
      registerFocalNode(catchNode, affectedRooms);
    });
    affectedRooms.forEach(syncFocalRoom);
  }

  function updateFocalCatches(changes) {
    var affectedRooms = new Set();
    changes.forEach(function (change) {
      if (change.type !== "childList") return;
      change.removedNodes.forEach(function (node) {
        focalNodesWithin(node).forEach(function (catchNode) {
          unregisterFocalNode(catchNode, affectedRooms);
        });
      });
      change.addedNodes.forEach(function (node) {
        focalNodesWithin(node).forEach(function (catchNode) {
          registerFocalNode(catchNode, affectedRooms);
        });
      });
    });
    affectedRooms.forEach(syncFocalRoom);
  }

  function nearestWire(node) {
    var room = roomFor(node);
    var origin = node.getBoundingClientRect();
    var centreX = origin.left + origin.width / 2;
    var centreY = origin.top + origin.height / 2;
    var nearest = null;
    room.querySelectorAll(".l-wire").forEach(function (wire) {
      var rect = wire.getBoundingClientRect();
      var x = Math.max(rect.left, Math.min(centreX, rect.right));
      var y = rect.top + rect.height / 2;
      var distance = Math.hypot(centreX - x, centreY - y);
      if (!nearest || distance < nearest.distance) nearest = { wire: wire, distance: distance };
    });
    return nearest && nearest.distance <= WIRE_RADIUS * 1.5 ? nearest.wire : null;
  }

  function spendNearestWire(node) {
    if (motionIsReduced(node)) return;
    var wire = nearestWire(node);
    if (!wire) return;
    wire.removeAttribute("data-press-trace");
    void wire.offsetWidth;
    wire.dataset.pressTrace = "spending";
    wire.addEventListener("animationend", function clearTrace(event) {
      if (event.animationName !== "l-spend-trace") return;
      wire.removeAttribute("data-press-trace");
    }, { once: true });
  }

  function holdPress(node, x, y, pointerId) {
    if (!node || node.disabled || motionIsReduced(node)) return;
    node.style.setProperty("--lx", x);
    node.style.setProperty("--ly", y);
    node.dataset.pressPhase = "held";
    activePress = { node: node, pointerId: pointerId };
  }

  function endPress(cancelled) {
    if (!activePress) return;
    var node = activePress.node;
    activePress = null;
    if (!node.isConnected || cancelled || node.disabled) {
      node.removeAttribute("data-press-phase");
      return;
    }
    if (motionIsReduced(node)) {
      node.removeAttribute("data-press-phase");
      return;
    }
    node.dataset.pressPhase = "released";
    spendNearestWire(node);
  }

  function clearPressEffects() {
    keyboardPress = null;
    if (activePress) endPress(true);
    document.querySelectorAll("[data-press-phase]").forEach(function (node) {
      node.removeAttribute("data-press-phase");
    });
    document.querySelectorAll("[data-press-trace]").forEach(function (wire) {
      wire.removeAttribute("data-press-trace");
    });
  }

  function ensureBeam(room) {
    var beam = room.querySelector(":scope > .l-focus-beam");
    if (beam) return beam;
    beam = document.createElement("span");
    beam.className = "l-focus-beam";
    beam.setAttribute("aria-hidden", "true");
    room.appendChild(beam);
    return beam;
  }

  function queueBeam(field) {
    if (!field || motionIsReduced(field)) {
      clearBeam();
      return;
    }
    if (activeBeamField && activeBeamField !== field) delete activeBeamField.dataset.beamFocus;
    activeBeamField = field;
    pendingBeam = field;
    scheduleFrame();
  }

  function placeBeam(field) {
    if (!field.isConnected) return clearBeam();
    var room = roomFor(field);
    var anchor = field.closest(".l-panel") || room;
    var roomRect = anchor === document.body
      ? { left: 0, top: -window.scrollY }
      : anchor.getBoundingClientRect();
    var fieldRect = field.getBoundingClientRect();
    var source = anchor.querySelector('.l-focal-catch:not([data-focal-suppressed="true"]) .l-focal-source');
    var sourceRect = source && source.getBoundingClientRect();
    var sourceX = sourceRect ? sourceRect.left + sourceRect.width / 2 : roomRect.left + 24;
    var sourceY = sourceRect ? sourceRect.top + sourceRect.height / 2 : roomRect.top + 24;
    var targetX = fieldRect.left + Math.min(fieldRect.width * .18, 72);
    var targetY = fieldRect.top + fieldRect.height / 2;
    var dx = targetX - sourceX;
    var dy = targetY - sourceY;
    var beam = ensureBeam(anchor);
    activeBeam = beam;
    beam.style.setProperty("--beam-x", (sourceX - roomRect.left) + "px");
    beam.style.setProperty("--beam-y", (sourceY - roomRect.top) + "px");
    beam.style.setProperty("--beam-length", Math.hypot(dx, dy) + "px");
    beam.style.setProperty("--beam-angle", (Math.atan2(dy, dx) * 180 / Math.PI) + "deg");
    beam.style.setProperty("--beam-visible", "1");
    beam.style.setProperty("--beam-scale", "1");
    field.dataset.beamFocus = "true";
  }

  function clearBeam() {
    if (activeBeamField) delete activeBeamField.dataset.beamFocus;
    activeBeamField = null;
    pendingBeam = null;
    if (activeBeam) {
      activeBeam.style.setProperty("--beam-visible", "0");
      activeBeam.style.setProperty("--beam-scale", "0");
    }
  }

  function adaptSheen(sheen) {
    currentSheen = sheen;
    currentSheenRect = sheen.getBoundingClientRect();
    var maximum = Math.max(currentSheenRect.width, currentSheenRect.height);
    var size = Math.max(SIZE_MIN, Math.min(SIZE_MAX, maximum * .95));
    sheen.style.setProperty("--lsize", size.toFixed(0) + "px");
  }

  function tweenDwell(sheen, target) {
    if (!sheen) return;
    dwellTweens.delete(sheen);
    var from = parseFloat(sheen.style.getPropertyValue("--ldwell")) || 0;
    if (motionIsReduced(sheen)) {
      sheen.style.setProperty("--ldwell", "0");
      return;
    }
    if (Math.abs(from - target) < .001) {
      sheen.style.setProperty("--ldwell", String(target));
      return;
    }
    dwellTweens.set(sheen, {
      from: from,
      target: target,
      started: performance.now()
    });
    scheduleFrame();
  }

  function runDwellTweens(now) {
    dwellTweens.forEach(function (tween, sheen) {
      if (!sheen.isConnected) {
        dwellTweens.delete(sheen);
        return;
      }
      if (motionIsReduced(sheen)) {
        sheen.style.setProperty("--ldwell", "0");
        dwellTweens.delete(sheen);
        return;
      }
      var progress = Math.min(1, (now - tween.started) / DWELL_EASE);
      var eased = progress < .5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      sheen.style.setProperty("--ldwell", (tween.from + (tween.target - tween.from) * eased).toFixed(3));
      if (progress >= 1) dwellTweens.delete(sheen);
    });
  }

  function armDwell(sheen) {
    if (motionIsReduced(sheen)) return;
    if (dwellArm) window.clearTimeout(dwellArm.timer);
    dwellArm = {
      sheen: sheen,
      timer: window.setTimeout(function () {
        tweenDwell(sheen, 1);
        dwellArm = null;
      }, DWELL_DELAY)
    };
  }

  function releaseDwell(sheen) {
    if (dwellArm && (!sheen || dwellArm.sheen === sheen)) {
      window.clearTimeout(dwellArm.timer);
      dwellArm = null;
    }
    if (sheen) tweenDwell(sheen, 0);
  }

  function placeLight(event) {
    if (motionIsReduced(event.target)) {
      releaseDwell(currentSheen);
      currentSheen = null;
      currentSheenRect = null;
      return;
    }
    var sheen = event.target.closest(".l-sheen");
    if (sheen !== currentSheen) {
      releaseDwell(currentSheen);
      if (sheen) adaptSheen(sheen);
      else {
        currentSheen = null;
        currentSheenRect = null;
      }
    }
    if (!sheen) return;
    var rect = currentSheenRect || (currentSheenRect = sheen.getBoundingClientRect());
    sheen.style.setProperty("--lx", (((event.clientX - rect.left) / rect.width) * 100).toFixed(1) + "%");
    sheen.style.setProperty("--ly", (((event.clientY - rect.top) / rect.height) * 100).toFixed(1) + "%");
    releaseDwell(sheen);
    var interactive = event.target.closest(interactiveSelector);
    if (interactive && sheen.contains(interactive)) armDwell(sheen);
  }

  function refreshWireRects() {
    wireRects = Array.from(document.querySelectorAll(".l-wire")).map(function (wire) {
      return { wire: wire, rect: wire.getBoundingClientRect() };
    }).filter(function (entry) {
      return entry.rect.width > 0 && entry.rect.height > 0;
    });
    wireRectsDirty = false;
  }

  function placeWireGleam(event) {
    if (motionIsReduced(event.target)) {
      if (activeWire) activeWire.style.setProperty("--wglow", "0");
      activeWire = null;
      return;
    }
    if (wireRectsDirty) refreshWireRects();
    var nearest = null;
    wireRects.forEach(function (entry) {
      var rect = entry.rect;
      var x = Math.max(rect.left, Math.min(event.clientX, rect.right));
      var y = rect.top + rect.height / 2;
      var distance = Math.hypot(event.clientX - x, event.clientY - y);
      if (distance > WIRE_RADIUS || (nearest && distance >= nearest.distance)) return;
      nearest = {
        wire: entry.wire,
        distance: distance,
        x: rect.width ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : .5
      };
    });
    if (activeWire && (!nearest || activeWire !== nearest.wire)) {
      activeWire.style.setProperty("--wglow", "0");
    }
    activeWire = nearest && nearest.wire;
    if (!nearest) return;
    nearest.wire.style.setProperty("--wx", (nearest.x * 100).toFixed(1) + "%");
    nearest.wire.style.setProperty("--wglow", (1 - nearest.distance / WIRE_RADIUS).toFixed(3));
  }

  function runFrame(now) {
    frame = 0;
    if (latestPointer) {
      var pointer = latestPointer;
      latestPointer = null;
      placeWireGleam(pointer);
      placeLight(pointer);
    }
    runDwellTweens(now);
    if (pendingBeam) {
      var field = pendingBeam;
      pendingBeam = null;
      placeBeam(field);
    }
    if (latestPointer || dwellTweens.size || pendingBeam) scheduleFrame();
  }

  document.addEventListener("pointermove", function (event) {
    latestPointer = event;
    scheduleFrame();
  }, { passive: true });

  document.addEventListener("pointerdown", function (event) {
    inputModality = "pointer";
    if (activeBeamField) clearBeam();
    releaseDwell(currentSheen);
    var press = event.target.closest(".l-btn");
    if (!press || motionIsReduced(press)) return;
    var rect = press.getBoundingClientRect();
    holdPress(
      press,
      (((event.clientX - rect.left) / rect.width) * 100).toFixed(1) + "%",
      (((event.clientY - rect.top) / rect.height) * 100).toFixed(1) + "%",
      event.pointerId
    );
  }, { passive: true });

  document.addEventListener("pointerup", function (event) {
    if (!activePress || activePress.pointerId !== event.pointerId) return;
    endPress(false);
  }, { passive: true });

  document.addEventListener("pointercancel", function (event) {
    if (!activePress || activePress.pointerId !== event.pointerId) return;
    endPress(true);
  }, { passive: true });

  document.addEventListener("lostpointercapture", function (event) {
    if (activePress && activePress.node === event.target) endPress(true);
  }, true);

  document.addEventListener("keydown", function (event) {
    inputModality = "keyboard";
    if ((event.key !== " " && event.key !== "Enter") || event.repeat) return;
    var button = event.target.closest(".l-btn");
    if (!button || button.disabled) return;
    keyboardPress = button;
    holdPress(button, "50%", "50%", "keyboard");
  });

  document.addEventListener("keyup", function (event) {
    if (!keyboardPress || (event.key !== " " && event.key !== "Enter")) return;
    keyboardPress = null;
    endPress(false);
  });

  window.addEventListener("blur", function () {
    clearPressEffects();
    clearBeam();
  });

  document.addEventListener("transitionend", function (event) {
    if (event.pseudoElement !== "::after" || event.propertyName !== "opacity") return;
    if (event.target.dataset.pressPhase === "released") event.target.removeAttribute("data-press-phase");
  });

  document.addEventListener("focusin", function (event) {
    var interactive = event.target.closest(interactiveSelector);
    if (!interactive) return;
    var field = event.target.closest(".l-field");
    if (field && inputModality === "keyboard") queueBeam(field);
    var sheen = interactive.closest(".l-sheen");
    if (!sheen) return;
    if (motionIsReduced(sheen)) {
      releaseDwell(sheen);
      return;
    }
    adaptSheen(sheen);
    var sheenRect = currentSheenRect;
    var controlRect = interactive.getBoundingClientRect();
    sheen.style.setProperty("--lx", (((controlRect.left + controlRect.width / 2 - sheenRect.left) / sheenRect.width) * 100).toFixed(1) + "%");
    sheen.style.setProperty("--ly", (((controlRect.top + controlRect.height / 2 - sheenRect.top) / sheenRect.height) * 100).toFixed(1) + "%");
    tweenDwell(sheen, 1);
  });

  document.addEventListener("focusout", function (event) {
    var field = event.target.closest(".l-field");
    var nextField = event.relatedTarget && event.relatedTarget.closest
      ? event.relatedTarget.closest(".l-field")
      : null;
    if (field && !nextField && (!event.relatedTarget || !field.contains(event.relatedTarget))) clearBeam();
    var sheen = event.target.closest(".l-sheen");
    if (!sheen || (event.relatedTarget && sheen.contains(event.relatedTarget))) return;
    releaseDwell(sheen);
  });

  window.addEventListener("scroll", function () {
    currentSheenRect = null;
    wireRectsDirty = true;
    releaseDwell(currentSheen);
    if (activeBeamField) queueBeam(activeBeamField);
  }, { passive: true });

  window.addEventListener("resize", function () {
    currentSheenRect = null;
    wireRectsDirty = true;
    if (activeBeamField) queueBeam(activeBeamField);
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      if (dwellTweens.size) scheduleFrame();
      return;
    }
    latestPointer = null;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  });

  document.addEventListener("pointerout", function (event) {
    if (event.relatedTarget) return;
    releaseDwell(currentSheen);
    if (activeWire) activeWire.style.setProperty("--wglow", "0");
    activeWire = null;
  }, { passive: true });

  if (document.body && "MutationObserver" in window) {
    new MutationObserver(function (changes) {
      if (changes.some(function (change) { return change.type === "childList"; })) wireRectsDirty = true;
      if (activeWire && motionIsReduced(activeWire)) activeWire.style.setProperty("--wglow", "0");
      updateFocalCatches(changes);
      if (activePress && motionIsReduced(activePress.node)) {
        clearPressEffects();
      }
      if (activeBeamField && motionIsReduced(activeBeamField)) {
        clearBeam();
      }
      if (currentSheen && motionIsReduced(currentSheen)) releaseDwell(currentSheen);
    }).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-motion", "data-surface"]
    });
  }
  if (document.body && "ResizeObserver" in window) {
    new ResizeObserver(function () { wireRectsDirty = true; }).observe(document.body);
  }
  if (reduced.addEventListener) reduced.addEventListener("change", function () {
    if (!reduced.matches) return;
    clearPressEffects();
    clearBeam();
    releaseDwell(currentSheen);
  });
  registerFocalCatches();
  runtime.state = "lit";
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
