const scriptRel = "modulepreload";
const assetsURL = function(dep) {
  return "/extensions/ComfyUI-Mape-Helpers/tweak/" + dep;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    const links = document.getElementsByTagName("link");
    promise = Promise.all(deps.map((dep) => {
      dep = assetsURL(dep);
      if (dep in seen)
        return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      const isBaseRelative = !!importerUrl;
      if (isBaseRelative) {
        for (let i2 = links.length - 1; i2 >= 0; i2--) {
          const link2 = links[i2];
          if (link2.href === dep && (!isCss || link2.rel === "stylesheet")) {
            return;
          }
        }
      } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
        return;
      }
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) {
        link.as = "script";
        link.crossOrigin = "";
      }
      link.href = dep;
      document.head.appendChild(link);
      if (isCss) {
        return new Promise((res, rej) => {
          link.addEventListener("load", res);
          link.addEventListener("error", () => rej(new Error(`Unable to preload CSS for ${dep}`)));
        });
      }
    }));
  }
  return promise.then(() => baseModule()).catch((err) => {
    const e2 = new Event("vite:preloadError", { cancelable: true });
    e2.payload = err;
    window.dispatchEvent(e2);
    if (!e2.defaultPrevented) {
      throw err;
    }
  });
};
const equalFn = (a2, b) => a2 === b;
const $PROXY = Symbol("solid-proxy");
const $TRACK = Symbol("solid-track");
const signalOptions = {
  equals: equalFn
};
let runEffects = runQueue;
const STALE = 1;
const PENDING = 2;
const UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner = null;
let Transition = null;
let ExternalSourceConfig = null;
let Listener = null;
let Updates = null;
let Effects = null;
let ExecCount = 0;
function createRoot(fn, detachedOwner) {
  const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root2 = unowned ? UNOWNED : {
    owned: null,
    cleanups: null,
    context: current ? current.context : null,
    owner: current
  }, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root2)));
  Owner = root2;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s3 = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || void 0
  };
  const setter = (value2) => {
    if (typeof value2 === "function") {
      value2 = value2(s3.value);
    }
    return writeSignal(s3, value2);
  };
  return [readSignal.bind(s3), setter];
}
function createRenderEffect(fn, value, options) {
  const c2 = createComputation(fn, value, false, STALE);
  updateComputation(c2);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c2 = createComputation(fn, value, false, STALE), s3 = SuspenseContext && useContext(SuspenseContext);
  if (s3)
    c2.suspense = s3;
  if (!options || !options.render)
    c2.user = true;
  Effects ? Effects.push(c2) : updateComputation(c2);
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c2 = createComputation(fn, value, true, 0);
  c2.observers = null;
  c2.observerSlots = null;
  c2.comparator = options.equals || void 0;
  updateComputation(c2);
  return readSignal.bind(c2);
}
function batch(fn) {
  return runUpdates(fn, false);
}
function untrack(fn) {
  if (Listener === null)
    return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig)
      ;
    return fn();
  } finally {
    Listener = listener;
  }
}
function onMount(fn) {
  createEffect(() => untrack(fn));
}
function onCleanup(fn) {
  if (Owner === null)
    ;
  else if (Owner.cleanups === null)
    Owner.cleanups = [fn];
  else
    Owner.cleanups.push(fn);
  return fn;
}
function getListener() {
  return Listener;
}
function getOwner() {
  return Owner;
}
function useContext(context) {
  return Owner && Owner.context && Owner.context[context.id] !== void 0 ? Owner.context[context.id] : context.defaultValue;
}
function children(fn) {
  const children2 = createMemo(fn);
  const memo = createMemo(() => resolveChildren(children2()));
  memo.toArray = () => {
    const c2 = memo();
    return Array.isArray(c2) ? c2 : c2 != null ? [c2] : [];
  };
  return memo;
}
let SuspenseContext;
function readSignal() {
  if (this.sources && this.state) {
    if (this.state === STALE)
      updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current = node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i2 = 0; i2 < node.observers.length; i2 += 1) {
          const o4 = node.observers[i2];
          const TransitionRunning = Transition && Transition.running;
          if (TransitionRunning && Transition.disposed.has(o4))
            ;
          if (TransitionRunning ? !o4.tState : !o4.state) {
            if (o4.pure)
              Updates.push(o4);
            else
              Effects.push(o4);
            if (o4.observers)
              markDownstream(o4);
          }
          if (!TransitionRunning)
            o4.state = STALE;
        }
        if (Updates.length > 1e6) {
          Updates = [];
          if (false)
            ;
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn)
    return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(node, node.value, time);
}
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner, listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue);
    } else
      node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c2 = {
    fn,
    state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Owner === null)
    ;
  else if (Owner !== UNOWNED) {
    {
      if (!Owner.owned)
        Owner.owned = [c2];
      else
        Owner.owned.push(c2);
    }
  }
  return c2;
}
function runTop(node) {
  if (node.state === 0)
    return;
  if (node.state === PENDING)
    return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback))
    return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (node.state)
      ancestors.push(node);
  }
  for (let i2 = ancestors.length - 1; i2 >= 0; i2--) {
    node = ancestors[i2];
    if (node.state === STALE) {
      updateComputation(node);
    } else if (node.state === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init) {
  if (Updates)
    return fn();
  let wait = false;
  if (!init)
    Updates = [];
  if (Effects)
    wait = true;
  else
    Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait)
      Effects = null;
    Updates = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    runQueue(Updates);
    Updates = null;
  }
  if (wait)
    return;
  const e2 = Effects;
  Effects = null;
  if (e2.length)
    runUpdates(() => runEffects(e2), false);
}
function runQueue(queue) {
  for (let i2 = 0; i2 < queue.length; i2++)
    runTop(queue[i2]);
}
function runUserEffects(queue) {
  let i2, userLength = 0;
  for (i2 = 0; i2 < queue.length; i2++) {
    const e2 = queue[i2];
    if (!e2.user)
      runTop(e2);
    else
      queue[userLength++] = e2;
  }
  for (i2 = 0; i2 < userLength; i2++)
    runTop(queue[i2]);
}
function lookUpstream(node, ignore) {
  node.state = 0;
  for (let i2 = 0; i2 < node.sources.length; i2 += 1) {
    const source = node.sources[i2];
    if (source.sources) {
      const state = source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount))
          runTop(source);
      } else if (state === PENDING)
        lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  for (let i2 = 0; i2 < node.observers.length; i2 += 1) {
    const o4 = node.observers[i2];
    if (!o4.state) {
      o4.state = PENDING;
      if (o4.pure)
        Updates.push(o4);
      else
        Effects.push(o4);
      o4.observers && markDownstream(o4);
    }
  }
}
function cleanNode(node) {
  let i2;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
      if (obs && obs.length) {
        const n2 = obs.pop(), s3 = source.observerSlots.pop();
        if (index < obs.length) {
          n2.sourceSlots[s3] = index;
          obs[index] = n2;
          source.observerSlots[index] = s3;
        }
      }
    }
  }
  if (node.owned) {
    for (i2 = node.owned.length - 1; i2 >= 0; i2--)
      cleanNode(node.owned[i2]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i2 = node.cleanups.length - 1; i2 >= 0; i2--)
      node.cleanups[i2]();
    node.cleanups = null;
  }
  node.state = 0;
}
function castError(err) {
  if (err instanceof Error)
    return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function handleError(err, owner = Owner) {
  const error = castError(err);
  throw error;
}
function resolveChildren(children2) {
  if (typeof children2 === "function" && !children2.length)
    return resolveChildren(children2());
  if (Array.isArray(children2)) {
    const results = [];
    for (let i2 = 0; i2 < children2.length; i2++) {
      const result = resolveChildren(children2[i2]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }
    return results;
  }
  return children2;
}
const FALLBACK = Symbol("fallback");
function dispose(d2) {
  for (let i2 = 0; i2 < d2.length; i2++)
    d2[i2]();
}
function mapArray(list, mapFn, options = {}) {
  let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [], i2, j2;
    newItems[$TRACK];
    return untrack(() => {
      let newLen = newItems.length, newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot((disposer) => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j2 = 0; j2 < newLen; j2++) {
          items[j2] = newItems[j2];
          mapped[j2] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++)
          ;
        for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = /* @__PURE__ */ new Map();
        newIndicesNext = new Array(newEnd + 1);
        for (j2 = newEnd; j2 >= start; j2--) {
          item = newItems[j2];
          i2 = newIndices.get(item);
          newIndicesNext[j2] = i2 === void 0 ? -1 : i2;
          newIndices.set(item, j2);
        }
        for (i2 = start; i2 <= end; i2++) {
          item = items[i2];
          j2 = newIndices.get(item);
          if (j2 !== void 0 && j2 !== -1) {
            temp[j2] = mapped[i2];
            tempdisposers[j2] = disposers[i2];
            indexes && (tempIndexes[j2] = indexes[i2]);
            j2 = newIndicesNext[j2];
            newIndices.set(item, j2);
          } else
            disposers[i2]();
        }
        for (j2 = start; j2 < newLen; j2++) {
          if (j2 in temp) {
            mapped[j2] = temp[j2];
            disposers[j2] = tempdisposers[j2];
            if (indexes) {
              indexes[j2] = tempIndexes[j2];
              indexes[j2](j2);
            }
          } else
            mapped[j2] = createRoot(mapper);
        }
        mapped = mapped.slice(0, len = newLen);
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j2] = disposer;
      if (indexes) {
        const [s3, set] = createSignal(j2);
        indexes[j2] = set;
        return mapFn(newItems[j2], s3);
      }
      return mapFn(newItems[j2]);
    }
  };
}
let hydrationEnabled = false;
function createComponent(Comp, props) {
  if (hydrationEnabled)
    ;
  return untrack(() => Comp(props || {}));
}
const narrowedError = (name) => `Stale read from <${name}>.`;
function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
}
function Switch(props) {
  let keyed = false;
  const equals = (a2, b) => (keyed ? a2[1] === b[1] : !a2[1] === !b[1]) && a2[2] === b[2];
  const conditions = children(() => props.children), evalConditions = createMemo(() => {
    let conds = conditions();
    if (!Array.isArray(conds))
      conds = [conds];
    for (let i2 = 0; i2 < conds.length; i2++) {
      const c2 = conds[i2].when;
      if (c2) {
        keyed = !!conds[i2].keyed;
        return [i2, c2, conds[i2]];
      }
    }
    return [-1];
  }, void 0, {
    equals
  });
  return createMemo(() => {
    const [index, when, cond] = evalConditions();
    if (index < 0)
      return props.fallback;
    const c2 = cond.children;
    const fn = typeof c2 === "function" && c2.length > 0;
    return fn ? untrack(() => c2(keyed ? when : () => {
      if (untrack(evalConditions)[0] !== index)
        throw narrowedError("Match");
      return cond.when;
    })) : c2;
  }, void 0, void 0);
}
function Match(props) {
  return props;
}
function reconcileArrays(parentNode, a2, b) {
  let bLength = b.length, aEnd = a2.length, bEnd = bLength, aStart = 0, bStart = 0, after = a2[aEnd - 1].nextSibling, map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a2[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a2[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
      while (bStart < bEnd)
        parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a2[aStart]))
          a2[aStart].remove();
        aStart++;
      }
    } else if (a2[aStart] === b[bEnd - 1] && b[bStart] === a2[aEnd - 1]) {
      const node = a2[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a2[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a2[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = /* @__PURE__ */ new Map();
        let i2 = bStart;
        while (i2 < bEnd)
          map.set(b[i2], i2++);
      }
      const index = map.get(a2[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i2 = aStart, sequence = 1, t2;
          while (++i2 < aEnd && i2 < bEnd) {
            if ((t2 = map.get(a2[i2])) == null || t2 !== index + sequence)
              break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a2[aStart];
            while (bStart < index)
              parentNode.insertBefore(b[bStart++], node);
          } else
            parentNode.replaceChild(b[bStart++], a2[aStart++]);
        } else
          aStart++;
      } else
        a2[aStart++].remove();
    }
  }
}
const $$EVENTS = "_$DX_DELEGATE";
function render(code2, element, init, options = {}) {
  let disposer;
  createRoot((dispose2) => {
    disposer = dispose2;
    element === document ? code2() : insert(element, code2(), element.firstChild ? null : void 0, init);
  }, options.owner);
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template(html, isCE, isSVG) {
  let node;
  const create = () => {
    const t2 = document.createElement("template");
    t2.innerHTML = html;
    return isSVG ? t2.content.firstChild.firstChild : t2.content.firstChild;
  };
  const fn = isCE ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
function delegateEvents(eventNames, document2 = window.document) {
  const e2 = document2[$$EVENTS] || (document2[$$EVENTS] = /* @__PURE__ */ new Set());
  for (let i2 = 0, l2 = eventNames.length; i2 < l2; i2++) {
    const name = eventNames[i2];
    if (!e2.has(name)) {
      e2.add(name);
      document2.addEventListener(name, eventHandler$1);
    }
  }
}
function setAttribute(node, name, value) {
  if (value == null)
    node.removeAttribute(name);
  else
    node.setAttribute(name, value);
}
function className(node, value) {
  if (value == null)
    node.removeAttribute("class");
  else
    node.className = value;
}
function addEventListener(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else
      node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, handler[0] = (e2) => handlerFn.call(node, handler[1], e2));
  } else
    node.addEventListener(name, handler);
}
function style$1(node, value, prev) {
  if (!value)
    return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string")
    return nodeStyle.cssText = value;
  typeof prev === "string" && (nodeStyle.cssText = prev = void 0);
  prev || (prev = {});
  value || (value = {});
  let v2, s3;
  for (s3 in prev) {
    value[s3] == null && nodeStyle.removeProperty(s3);
    delete prev[s3];
  }
  for (s3 in value) {
    v2 = value[s3];
    if (v2 !== prev[s3]) {
      nodeStyle.setProperty(s3, v2);
      prev[s3] = v2;
    }
  }
  return prev;
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function insert(parent, accessor, marker, initial) {
  if (marker !== void 0 && !initial)
    initial = [];
  if (typeof accessor !== "function")
    return insertExpression(parent, accessor, initial, marker);
  createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
}
function eventHandler$1(e2) {
  const key = `$$${e2.type}`;
  let node = e2.composedPath && e2.composedPath()[0] || e2.target;
  if (e2.target !== node) {
    Object.defineProperty(e2, "target", {
      configurable: true,
      value: node
    });
  }
  Object.defineProperty(e2, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  while (node) {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== void 0 ? handler.call(node, data, e2) : handler.call(node, e2);
      if (e2.cancelBubble)
        return;
    }
    node = node._$host || node.parentNode || node.host;
  }
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  while (typeof current === "function")
    current = current();
  if (value === current)
    return current;
  const t2 = typeof value, multi = marker !== void 0;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t2 === "string" || t2 === "number") {
    if (t2 === "number")
      value = value.toString();
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data !== value && (node.data = value);
      } else
        node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else
        current = parent.textContent = value;
    }
  } else if (value == null || t2 === "boolean") {
    current = cleanChildren(parent, current, marker);
  } else if (t2 === "function") {
    createRenderEffect(() => {
      let v2 = value();
      while (typeof v2 === "function")
        v2 = v2();
      current = insertExpression(parent, v2, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
      return () => current;
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi)
        return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker);
      } else
        reconcileArrays(parent, current, array);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, array);
    }
    current = array;
  } else if (value.nodeType) {
    if (Array.isArray(current)) {
      if (multi)
        return current = cleanChildren(parent, current, marker, value);
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else
      parent.replaceChild(value, parent.firstChild);
    current = value;
  } else
    ;
  return current;
}
function normalizeIncomingArray(normalized, array, current, unwrap2) {
  let dynamic = false;
  for (let i2 = 0, len = array.length; i2 < len; i2++) {
    let item = array[i2], prev = current && current[i2], t2;
    if (item == null || item === true || item === false)
      ;
    else if ((t2 = typeof item) === "object" && item.nodeType) {
      normalized.push(item);
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
    } else if (t2 === "function") {
      if (unwrap2) {
        while (typeof item === "function")
          item = item();
        dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value)
        normalized.push(prev);
      else
        normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes(parent, array, marker = null) {
  for (let i2 = 0, len = array.length; i2 < len; i2++)
    parent.insertBefore(array[i2], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === void 0)
    return parent.textContent = "";
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i2 = current.length - 1; i2 >= 0; i2--) {
      const el = current[i2];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i2)
          isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
        else
          isParent && el.remove();
      } else
        inserted = true;
    }
  } else
    parent.insertBefore(node, marker);
  return [node];
}
const setupImagePreview = async () => {
  const {
    ImagePreviews: ImagePreviews2
  } = await __vitePreload(() => Promise.resolve().then(() => imagePreviews), true ? void 0 : void 0);
  const root2 = document.createElement(`div`);
  document.body.appendChild(root2);
  render(() => createComponent(ImagePreviews2, {}), root2);
  return;
};
const setupMainApp = async () => {
  const {
    registerPlugin: registerPlugin2
  } = await __vitePreload(() => Promise.resolve().then(() => plugin), true ? void 0 : void 0);
  registerPlugin2();
  (async function init() {
    if (typeof app === `undefined`) {
      setTimeout(init);
      return;
    }
    const {
      MapeTweak: MapeTweak2
    } = await __vitePreload(() => Promise.resolve().then(() => bar), true ? void 0 : void 0);
    const root2 = document.createElement(`div`);
    document.body.appendChild(root2);
    render(() => createComponent(MapeTweak2, {}), root2);
  })();
};
if (window.standaloneImagePreview) {
  setupImagePreview();
} else {
  setupMainApp();
}
function isMapeVariableNode(node_or_nodeType) {
  let title = node_or_nodeType.type;
  if (node_or_nodeType.IS_MAPE_VARIABLE) {
    return true;
  }
  if (title === void 0) {
    title = node_or_nodeType.comfyClass;
  }
  if (!title) {
    return false;
  }
  return title.startsWith(TYPE);
}
const isNodeGetter = (node) => {
  var _a, _b, _c;
  return !!(isMapeVariableNode(node) && ((_c = (_b = (_a = node.outputs) == null ? void 0 : _a[0]) == null ? void 0 : _b.links) == null ? void 0 : _c.length));
};
const isNodeSetter = (node) => {
  var _a, _b;
  return !!(isMapeVariableNode(node) && ((_b = (_a = node.inputs) == null ? void 0 : _a[0]) == null ? void 0 : _b.link));
};
const PREFIX = `mape_tweak_`;
const PREFIX_IMAGEPREIVEW = `mape_imagepreview_`;
const TWEAK_FLOATING = `mape_tweak_pos_`;
const PREFIX_GROUP = `mape_group`;
const TYPE = `mape Variable`;
const MISSING_INPUT = `*`;
const getNodes$1 = () => graph._nodes;
const getNodeById = (id, nodes) => nodes ? nodes.find((node) => node.id === id) : graph.getNodeById(id);
const getMapeNodes = (nodes = getNodes$1()) => nodes.filter(isMapeVariableNode);
const getMapeSetNodes = (nodes = getNodes$1()) => getMapeNodes(nodes).filter(isNodeSetter);
const getGroups = () => graph._groups;
const getSelectedNode = () => {
  var _a;
  return (_a = getSelectedNodes$1()) == null ? void 0 : _a[0];
};
const getSelectedNodes$1 = () => Object.values(graph.list_of_graphcanvas[0].selected_nodes);
function isDefined(value) {
  return value !== void 0;
}
const comfyImageSrc = (image) => image ? `/view?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}&rand=${42}` : void 0;
const calculateDistance = (x1, y1, x2, y2) => {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  return distance;
};
const distanceSort = (tweaks) => {
  const positions = Object.fromEntries(Object.values(tweaks).map((tweak) => [tweak.name, tweak.pos ?? [0, 0]]));
  const minX = Math.min(...Object.values(positions).map(([x2, _y]) => x2));
  const minY = Math.min(...Object.values(positions).map(([_x, y2]) => y2));
  const distances = Object.fromEntries(Object.entries(positions).map(([key, [x2, y2]]) => {
    return [key, calculateDistance(minX, minY, x2, y2)];
  }));
  return (a2, b) => {
    return distances[a2.name] - distances[b.name];
  };
};
const distanceSortGeneric = (items, idKey, posKey) => {
  const positions = Object.fromEntries(items.map((item) => [item[idKey], item[posKey] ?? [0, 0]]));
  const minX = Math.min(...Object.values(positions).map(([x2, _y]) => x2));
  const minY = Math.min(...Object.values(positions).map(([_x, y2]) => y2));
  const distances = Object.fromEntries(Object.entries(positions).map(([key, [x2, y2]]) => {
    return [key, calculateDistance(minX, minY, x2, y2)];
  }));
  return (a2, b) => {
    return distances[a2[idKey]] - distances[b[idKey]];
  };
};
const getBestRatio = (size, count, vidRatio = 0.35) => {
  let maxArea = 1;
  let targetCols = 1;
  let targetRows = 1;
  let targetHeight = 1;
  let targetWidth = 1;
  let tWidth = 1;
  let tHeight = 1;
  const width = size[0];
  const height = size[1];
  const availableRatio = height / width;
  for (let i2 = 1; i2 <= count; i2++) {
    const cols = i2;
    const rows = Math.ceil(count / cols);
    if (rows / cols * vidRatio > availableRatio) {
      tHeight = Math.floor(height / rows);
      tWidth = Math.floor(tHeight / vidRatio);
    } else {
      tWidth = Math.floor(width / cols);
      tHeight = Math.floor(tWidth * vidRatio);
    }
    const area = tWidth * tHeight * count;
    if (maxArea === void 0 || area > maxArea) {
      maxArea = area;
      targetHeight = tHeight;
      targetWidth = tWidth;
      targetCols = cols;
      targetRows = rows;
    }
  }
  return {
    targetCols,
    targetRows,
    targetHeight,
    targetWidth
  };
};
var _tmpl$$7 = /* @__PURE__ */ template(`<div class=imagePreviews>`), _tmpl$2$6 = /* @__PURE__ */ template(`<div class=imagePreviewTweaks><label>Image Previews</label><label>Display type`), _tmpl$3$4 = /* @__PURE__ */ template(`<img class=fullImage>`), _tmpl$4$3 = /* @__PURE__ */ template(`<div class=mosaicGrid><div class=inner>`), _tmpl$5$3 = /* @__PURE__ */ template(`<div class=flipbookFps><label for="">FPS</label><input type=number step=1 min=1 max=120><label for=flipflop title="Reverse at end of clip instead of restarting">Flip Flop</label><input id=flipflop type=checkbox>`), _tmpl$6$3 = /* @__PURE__ */ template(`<div class=content><div class=bigPreview><div class=zoom>x`), _tmpl$7$2 = /* @__PURE__ */ template(`<div class=button>`), _tmpl$8$2 = /* @__PURE__ */ template(`<div class=thumbnails>`), _tmpl$9$2 = /* @__PURE__ */ template(`<div class=thumb><img class=smallImage>`), _tmpl$10$2 = /* @__PURE__ */ template(`<div class=mosaicImage><img class=smallImage>`), _tmpl$11$2 = /* @__PURE__ */ template(`<div class=imagePreviewHelp><p>Shift + Click a link and enable tweak to have it show up in the images preview window.</p><video src=https://comfyui.ma.pe/help/imagePreview.mp4>`);
const localStoragePreviewImagesKey = `mape_image_previews`;
const IMAGE_PREVIEW_FPS = `${PREFIX_IMAGEPREIVEW}FPS`;
const ImagePreviews = () => {
  const [canvasZoom, setCanvasZoom] = createSignal(1);
  const [canvasOffset, setCanvasOffset] = createSignal([0, 0]);
  const [selectedImageIndex, setSelectedImageIndex] = createSignal(0);
  const [selectedTweakId, setSelectedTweak] = createSignal(`images`);
  const [imageSets, setImageSets] = createSignal({});
  const [displayType, setDisplayType] = createSignal(localStorage.mapeImageDisplayType ?? `single`);
  let flipbookTimeout;
  createEffect(() => {
    selectedTweakId();
    setFlipbookIndex(0);
  });
  const [flipbookIndex, setFlipbookIndex] = createSignal(0);
  const [flipbookFps, setFlipbookFps] = createSignal(localStorage[IMAGE_PREVIEW_FPS] ? JSON.parse(localStorage[IMAGE_PREVIEW_FPS]) : {});
  const [flipflop, setFlipflop] = createSignal(localStorage.mape_tweak_flipflop ? true : false);
  createEffect(() => {
    localStorage[IMAGE_PREVIEW_FPS] = JSON.stringify(flipbookFps());
  });
  createEffect(() => {
    if (flipflop()) {
      localStorage.mape_tweak_flipflop = true;
    } else {
      delete localStorage.mape_tweak_flipflop;
    }
  });
  let direction = 1;
  const incrementFlipbook = () => {
    clearTimeout(flipbookTimeout);
    if (displayType() === `flipbook`) {
      flipbookTimeout = setTimeout(incrementFlipbook, 1e3 / (flipbookFps()[selectedTweakId()] ?? 12));
      if (!value() || !value().value) {
        setFlipbookIndex(0);
        return;
      }
      const count = value().value.length;
      if (count === 1) {
        setFlipbookIndex(0);
        return;
      }
      if (flipflop()) {
        const tmpIndex = flipbookIndex() + direction;
        if (tmpIndex < 0 || tmpIndex >= count) {
          direction = -direction;
        }
        const nextFlipbookIndex = flipbookIndex() + direction;
        setFlipbookIndex(nextFlipbookIndex);
      } else {
        let nextFlipbookIndex = flipbookIndex() + 1;
        if (nextFlipbookIndex >= count) {
          nextFlipbookIndex = 0;
        }
        setFlipbookIndex(nextFlipbookIndex);
      }
    }
  };
  onCleanup(() => {
    clearTimeout(flipbookTimeout);
  });
  createEffect(() => {
    localStorage.mapeImageDisplayType = displayType();
    setFlipbookIndex(0);
    direction = 1;
    if (displayType() === `flipbook`) {
      setFlipbookIndex(0);
      setTimeout(incrementFlipbook);
    }
  });
  if (localStorage[localStoragePreviewImagesKey]) {
    setImageSets(JSON.parse(localStorage[localStoragePreviewImagesKey]));
  }
  function handleStorageChange(event) {
    const {
      key,
      newValue
    } = event;
    if (key === localStoragePreviewImagesKey && newValue) {
      setImageSets(JSON.parse(newValue));
      if (!value()) {
        setSelectedTweak(Object.keys(imageSets())[0] ?? ``);
      }
      if (value() && value().value && value().value.length <= selectedImageIndex()) {
        setSelectedImageIndex(0);
      }
    }
  }
  window.addEventListener(`storage`, handleStorageChange);
  const value = () => imageSets()[selectedTweakId()];
  const containerTransform = () => `scale(${scaledCanvasZoom()}) translate(calc(-50% + ${canvasOffset()[0]}px), calc(-50% + ${canvasOffset()[1]}px))`;
  let imageZoomContainerRef;
  const [containerSize, setContainerSize] = createSignal([100, 100]);
  createEffect(() => {
    displayType();
    if (!imageZoomContainerRef) {
      return;
    }
    setContainerSize([imageZoomContainerRef.clientWidth, imageZoomContainerRef.clientHeight]);
  });
  window.addEventListener(`resize`, () => {
    if (!imageZoomContainerRef) {
      return;
    }
    setContainerSize([imageZoomContainerRef.clientWidth, imageZoomContainerRef.clientHeight]);
  });
  const [aspectRatio, setAspectRatio] = createSignal(1);
  const [imageSize, setImageSize] = createSignal([1, 1]);
  createEffect(() => {
    const image = getAllImages()[0];
    if (!image) {
      return;
    }
    const imageSrc = comfyImageSrc(image);
    const img = new Image();
    img.addEventListener(`load`, () => {
      setAspectRatio(img.height / img.width);
      setImageSize([img.width, img.height]);
    });
    img.src = imageSrc;
  });
  const maximizeImageSize = () => {
    const pos = getBestRatio(containerSize(), getAllImages().length, aspectRatio());
    const containerHeight = pos.targetHeight * pos.targetRows;
    const containerWidth = pos.targetWidth * pos.targetCols;
    const data = {
      imageWidth: Math.min(imageSize()[0], pos.targetWidth),
      imageHeight: Math.min(imageSize()[1], pos.targetHeight),
      containerHeight,
      containerWidth,
      ratio: Math.min(1, Math.max(pos.targetWidth, pos.targetHeight) / Math.max(...imageSize()))
    };
    return data;
  };
  const reset = (all = false) => {
    setSelectedImageIndex(0);
    if (all) {
      setCanvasOffset([0, 0]);
      setCanvasZoom(1);
    }
  };
  const getAllImages = () => (value() ?? {}).value ?? [];
  const calculateNonLinearZoom = (zoomFactor) => {
    const nonLinearFactor = 2.5;
    return Math.pow(zoomFactor, nonLinearFactor);
  };
  const scaledCanvasZoom = () => calculateNonLinearZoom(canvasZoom());
  return (() => {
    var _el$ = _tmpl$$7();
    insert(_el$, (() => {
      var _c$ = createMemo(() => !!value());
      return () => _c$() ? [(() => {
        var _el$2 = _tmpl$2$6(), _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling;
        insert(_el$2, () => Object.values(imageSets()).sort(distanceSort(imageSets())).map((tweak) => {
          return (() => {
            var _el$18 = _tmpl$7$2();
            _el$18.$$click = () => {
              reset();
              setSelectedImageIndex(0);
              setSelectedTweak(tweak.name);
            };
            insert(_el$18, () => tweak.name);
            createRenderEffect(() => _el$18.classList.toggle("active", !!(tweak.name === selectedTweakId())));
            return _el$18;
          })();
        }), _el$4);
        insert(_el$2, () => [{
          id: `single`,
          text: `Single image`
        }, {
          id: `mosaic`,
          text: `Grid view`
        }, {
          id: `flipbook`,
          text: `Flipbook`
        }].map((button) => {
          return (() => {
            var _el$19 = _tmpl$7$2();
            _el$19.$$click = () => {
              reset();
              setDisplayType(button.id);
            };
            insert(_el$19, () => button.text);
            createRenderEffect(() => _el$19.classList.toggle("active", !!(displayType() === button.id)));
            return _el$19;
          })();
        }), null);
        return _el$2;
      })(), (() => {
        var _el$5 = _tmpl$6$3(), _el$6 = _el$5.firstChild, _el$16 = _el$6.firstChild, _el$17 = _el$16.firstChild;
        insert(_el$5, (() => {
          var _c$3 = createMemo(() => !!(displayType() === `single` && getAllImages().length > 1));
          return () => _c$3() ? (() => {
            var _el$20 = _tmpl$8$2();
            insert(_el$20, () => getAllImages().map((image, i2) => {
              return (() => {
                var _el$21 = _tmpl$9$2(), _el$22 = _el$21.firstChild;
                _el$21.$$click = () => {
                  setSelectedImageIndex(i2);
                };
                createRenderEffect((_p$) => {
                  var _v$8 = !!(i2 === selectedImageIndex()), _v$9 = comfyImageSrc(image);
                  _v$8 !== _p$.e && _el$21.classList.toggle("active", _p$.e = _v$8);
                  _v$9 !== _p$.t && setAttribute(_el$22, "src", _p$.t = _v$9);
                  return _p$;
                }, {
                  e: void 0,
                  t: void 0
                });
                return _el$21;
              })();
            }));
            return _el$20;
          })() : null;
        })(), _el$6);
        _el$6.addEventListener("wheel", (e2) => {
          const rect = imageZoomContainerRef.getClientRects()[0];
          const [mouseX, mouseY] = [e2.clientX, e2.clientY];
          const {
            x: canvasX,
            y: canvasY,
            width: canvasWidth,
            height: canvasHeight
          } = rect;
          const cursorProcX = (mouseX - canvasX) / canvasWidth;
          const cursorProcY = (mouseY - canvasY) / canvasHeight;
          setCanvasZoom(Math.max(0.1, canvasZoom() - (e2.deltaY > 0 ? 0.075 : -0.075)));
          (() => {
            setCanvasOffset([0, 0]);
            const rect2 = imageZoomContainerRef.getClientRects()[0];
            const {
              x: canvasAfterX,
              y: canvasAfterY,
              width: canvasAfterWidth,
              height: canvasAfterHeight
            } = rect2;
            const cursorProcAfterX = (mouseX - canvasAfterX) / canvasAfterWidth;
            const cursorProcAfterY = (mouseY - canvasAfterY) / canvasAfterHeight;
            const procDeltaX = cursorProcAfterX - cursorProcX;
            const procDeltaY = cursorProcAfterY - cursorProcY;
            const xOffset = procDeltaX * canvasAfterWidth / scaledCanvasZoom();
            const yOffset = procDeltaY * canvasAfterHeight / scaledCanvasZoom();
            setCanvasOffset([canvasOffset()[0] + xOffset, canvasOffset()[1] + yOffset]);
          })();
        });
        _el$6.$$mousedown = (e2) => {
          const startX = e2.clientX;
          const startY = e2.clientY;
          const [initialX, initialY] = canvasOffset();
          const handleMouseMove = (e3) => {
            e3.preventDefault();
            const currentX = e3.clientX;
            const currentY = e3.clientY;
            const deltaX = startX - currentX;
            const deltaY = startY - currentY;
            setCanvasOffset([initialX - deltaX / scaledCanvasZoom(), initialY - deltaY / scaledCanvasZoom()]);
          };
          const handleMouseUp = () => {
            document.removeEventListener(`mousemove`, handleMouseMove);
            document.removeEventListener(`mouseup`, handleMouseUp);
          };
          document.addEventListener(`mousemove`, handleMouseMove);
          document.addEventListener(`mouseup`, handleMouseUp);
        };
        _el$6.$$dblclick = () => {
          reset(true);
        };
        insert(_el$6, createComponent(Switch, {
          get children() {
            return [createComponent(Match, {
              get when() {
                return displayType() === `single`;
              },
              get children() {
                var _el$7 = _tmpl$3$4();
                var _ref$ = imageZoomContainerRef;
                typeof _ref$ === "function" ? use(_ref$, _el$7) : imageZoomContainerRef = _el$7;
                createRenderEffect((_p$) => {
                  var _v$ = containerTransform(), _v$2 = comfyImageSrc((value().value ?? [])[selectedImageIndex()]);
                  _v$ !== _p$.e && ((_p$.e = _v$) != null ? _el$7.style.setProperty("transform", _v$) : _el$7.style.removeProperty("transform"));
                  _v$2 !== _p$.t && setAttribute(_el$7, "src", _p$.t = _v$2);
                  return _p$;
                }, {
                  e: void 0,
                  t: void 0
                });
                return _el$7;
              }
            }), createComponent(Match, {
              get when() {
                return displayType() === `mosaic`;
              },
              get children() {
                var _el$8 = _tmpl$4$3(), _el$9 = _el$8.firstChild;
                _el$8.$$dblclick = () => {
                  reset(true);
                };
                var _ref$2 = imageZoomContainerRef;
                typeof _ref$2 === "function" ? use(_ref$2, _el$8) : imageZoomContainerRef = _el$8;
                insert(_el$9, () => getAllImages().map((image, i2) => {
                  return (() => {
                    var _el$23 = _tmpl$10$2(), _el$24 = _el$23.firstChild;
                    _el$23.$$click = () => {
                      setSelectedImageIndex(i2);
                    };
                    createRenderEffect((_p$) => {
                      var _v$10 = `${maximizeImageSize().imageWidth}px`, _v$11 = `${maximizeImageSize().imageHeight}px`, _v$12 = comfyImageSrc(image);
                      _v$10 !== _p$.e && ((_p$.e = _v$10) != null ? _el$23.style.setProperty("width", _v$10) : _el$23.style.removeProperty("width"));
                      _v$11 !== _p$.t && ((_p$.t = _v$11) != null ? _el$23.style.setProperty("height", _v$11) : _el$23.style.removeProperty("height"));
                      _v$12 !== _p$.a && setAttribute(_el$24, "src", _p$.a = _v$12);
                      return _p$;
                    }, {
                      e: void 0,
                      t: void 0,
                      a: void 0
                    });
                    return _el$23;
                  })();
                }));
                createRenderEffect((_p$) => {
                  var _v$3 = containerTransform(), _v$4 = `${maximizeImageSize().containerWidth}px`, _v$5 = `${maximizeImageSize().containerHeight}px`;
                  _v$3 !== _p$.e && ((_p$.e = _v$3) != null ? _el$8.style.setProperty("transform", _v$3) : _el$8.style.removeProperty("transform"));
                  _v$4 !== _p$.t && ((_p$.t = _v$4) != null ? _el$9.style.setProperty("width", _v$4) : _el$9.style.removeProperty("width"));
                  _v$5 !== _p$.a && ((_p$.a = _v$5) != null ? _el$9.style.setProperty("height", _v$5) : _el$9.style.removeProperty("height"));
                  return _p$;
                }, {
                  e: void 0,
                  t: void 0,
                  a: void 0
                });
                return _el$8;
              }
            }), createComponent(Match, {
              get when() {
                return displayType() === `flipbook`;
              },
              get children() {
                return [(() => {
                  var _el$10 = _tmpl$5$3(), _el$11 = _el$10.firstChild, _el$12 = _el$11.nextSibling, _el$13 = _el$12.nextSibling, _el$14 = _el$13.nextSibling;
                  _el$12.$$input = (e2) => {
                    setFlipbookFps({
                      ...flipbookFps(),
                      [selectedTweakId()]: Math.max(1, parseInt(e2.currentTarget.value, 10))
                    });
                  };
                  _el$14.addEventListener("change", () => {
                    setFlipflop(!flipflop());
                  });
                  createRenderEffect(() => _el$12.value = flipbookFps()[selectedTweakId()] ?? 12);
                  createRenderEffect(() => _el$14.checked = flipflop());
                  return _el$10;
                })(), (() => {
                  var _el$15 = _tmpl$3$4();
                  var _ref$3 = imageZoomContainerRef;
                  typeof _ref$3 === "function" ? use(_ref$3, _el$15) : imageZoomContainerRef = _el$15;
                  createRenderEffect((_p$) => {
                    var _v$6 = containerTransform(), _v$7 = comfyImageSrc((value().value ?? [])[flipbookIndex()]);
                    _v$6 !== _p$.e && ((_p$.e = _v$6) != null ? _el$15.style.setProperty("transform", _v$6) : _el$15.style.removeProperty("transform"));
                    _v$7 !== _p$.t && setAttribute(_el$15, "src", _p$.t = _v$7);
                    return _p$;
                  }, {
                    e: void 0,
                    t: void 0
                  });
                  return _el$15;
                })()];
              }
            })];
          }
        }), _el$16);
        _el$16.$$click = () => {
          reset(true);
        };
        insert(_el$16, (() => {
          var _c$4 = createMemo(() => displayType() === `mosaic`);
          return () => _c$4() ? parseFloat((maximizeImageSize().ratio * scaledCanvasZoom()).toFixed(2)) : parseFloat(scaledCanvasZoom().toFixed(2));
        })(), _el$17);
        return _el$5;
      })()] : null;
    })(), null);
    insert(_el$, (() => {
      var _c$2 = createMemo(() => !!!value());
      return () => _c$2() ? (() => {
        var _el$25 = _tmpl$11$2(), _el$26 = _el$25.firstChild, _el$27 = _el$26.nextSibling;
        _el$27.muted = true;
        _el$27.autoplay = true;
        _el$27.loop = true;
        return _el$25;
      })() : null;
    })(), null);
    createRenderEffect(() => {
      var _a, _b;
      return _el$.classList.toggle("hasMultiple", !!(((_b = (_a = value()) == null ? void 0 : _a.value) == null ? void 0 : _b.length) > 0));
    });
    return _el$;
  })();
};
delegateEvents(["dblclick", "mousedown", "input", "click"]);
const imagePreviews = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ImagePreviews,
  localStoragePreviewImagesKey
}, Symbol.toStringTag, { value: "Module" }));
const $RAW = Symbol("store-raw"), $NODE = Symbol("store-node"), $HAS = Symbol("store-has"), $SELF = Symbol("store-self");
function wrap$1(value) {
  let p2 = value[$PROXY];
  if (!p2) {
    Object.defineProperty(value, $PROXY, {
      value: p2 = new Proxy(value, proxyTraps$1)
    });
    if (!Array.isArray(value)) {
      const keys = Object.keys(value), desc = Object.getOwnPropertyDescriptors(value);
      for (let i2 = 0, l2 = keys.length; i2 < l2; i2++) {
        const prop = keys[i2];
        if (desc[prop].get) {
          Object.defineProperty(value, prop, {
            enumerable: desc[prop].enumerable,
            get: desc[prop].get.bind(p2)
          });
        }
      }
    }
  }
  return p2;
}
function isWrappable(obj) {
  let proto;
  return obj != null && typeof obj === "object" && (obj[$PROXY] || !(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype || Array.isArray(obj));
}
function unwrap(item, set = /* @__PURE__ */ new Set()) {
  let result, unwrapped, v2, prop;
  if (result = item != null && item[$RAW])
    return result;
  if (!isWrappable(item) || set.has(item))
    return item;
  if (Array.isArray(item)) {
    if (Object.isFrozen(item))
      item = item.slice(0);
    else
      set.add(item);
    for (let i2 = 0, l2 = item.length; i2 < l2; i2++) {
      v2 = item[i2];
      if ((unwrapped = unwrap(v2, set)) !== v2)
        item[i2] = unwrapped;
    }
  } else {
    if (Object.isFrozen(item))
      item = Object.assign({}, item);
    else
      set.add(item);
    const keys = Object.keys(item), desc = Object.getOwnPropertyDescriptors(item);
    for (let i2 = 0, l2 = keys.length; i2 < l2; i2++) {
      prop = keys[i2];
      if (desc[prop].get)
        continue;
      v2 = item[prop];
      if ((unwrapped = unwrap(v2, set)) !== v2)
        item[prop] = unwrapped;
    }
  }
  return item;
}
function getNodes(target, symbol) {
  let nodes = target[symbol];
  if (!nodes)
    Object.defineProperty(target, symbol, {
      value: nodes = /* @__PURE__ */ Object.create(null)
    });
  return nodes;
}
function getNode(nodes, property, value) {
  if (nodes[property])
    return nodes[property];
  const [s3, set] = createSignal(value, {
    equals: false,
    internal: true
  });
  s3.$ = set;
  return nodes[property] = s3;
}
function proxyDescriptor$1(target, property) {
  const desc = Reflect.getOwnPropertyDescriptor(target, property);
  if (!desc || desc.get || !desc.configurable || property === $PROXY || property === $NODE)
    return desc;
  delete desc.value;
  delete desc.writable;
  desc.get = () => target[$PROXY][property];
  return desc;
}
function trackSelf(target) {
  getListener() && getNode(getNodes(target, $NODE), $SELF)();
}
function ownKeys(target) {
  trackSelf(target);
  return Reflect.ownKeys(target);
}
const proxyTraps$1 = {
  get(target, property, receiver) {
    if (property === $RAW)
      return target;
    if (property === $PROXY)
      return receiver;
    if (property === $TRACK) {
      trackSelf(target);
      return receiver;
    }
    const nodes = getNodes(target, $NODE);
    const tracked = nodes[property];
    let value = tracked ? tracked() : target[property];
    if (property === $NODE || property === $HAS || property === "__proto__")
      return value;
    if (!tracked) {
      const desc = Object.getOwnPropertyDescriptor(target, property);
      if (getListener() && (typeof value !== "function" || target.hasOwnProperty(property)) && !(desc && desc.get))
        value = getNode(nodes, property, value)();
    }
    return isWrappable(value) ? wrap$1(value) : value;
  },
  has(target, property) {
    if (property === $RAW || property === $PROXY || property === $TRACK || property === $NODE || property === $HAS || property === "__proto__")
      return true;
    getListener() && getNode(getNodes(target, $HAS), property)();
    return property in target;
  },
  set() {
    return true;
  },
  deleteProperty() {
    return true;
  },
  ownKeys,
  getOwnPropertyDescriptor: proxyDescriptor$1
};
function setProperty(state, property, value, deleting = false) {
  if (!deleting && state[property] === value)
    return;
  const prev = state[property], len = state.length;
  if (value === void 0) {
    delete state[property];
    if (state[$HAS] && state[$HAS][property] && prev !== void 0)
      state[$HAS][property].$();
  } else {
    state[property] = value;
    if (state[$HAS] && state[$HAS][property] && prev === void 0)
      state[$HAS][property].$();
  }
  let nodes = getNodes(state, $NODE), node;
  if (node = getNode(nodes, property, prev))
    node.$(() => value);
  if (Array.isArray(state) && state.length !== len) {
    for (let i2 = state.length; i2 < len; i2++)
      (node = nodes[i2]) && node.$();
    (node = getNode(nodes, "length", len)) && node.$(state.length);
  }
  (node = nodes[$SELF]) && node.$();
}
function mergeStoreNode(state, value) {
  const keys = Object.keys(value);
  for (let i2 = 0; i2 < keys.length; i2 += 1) {
    const key = keys[i2];
    setProperty(state, key, value[key]);
  }
}
function updateArray(current, next) {
  if (typeof next === "function")
    next = next(current);
  next = unwrap(next);
  if (Array.isArray(next)) {
    if (current === next)
      return;
    let i2 = 0, len = next.length;
    for (; i2 < len; i2++) {
      const value = next[i2];
      if (current[i2] !== value)
        setProperty(current, i2, value);
    }
    setProperty(current, "length", len);
  } else
    mergeStoreNode(current, next);
}
function updatePath(current, path, traversed = []) {
  let part, prev = current;
  if (path.length > 1) {
    part = path.shift();
    const partType = typeof part, isArray = Array.isArray(current);
    if (Array.isArray(part)) {
      for (let i2 = 0; i2 < part.length; i2++) {
        updatePath(current, [part[i2]].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "function") {
      for (let i2 = 0; i2 < current.length; i2++) {
        if (part(current[i2], i2))
          updatePath(current, [i2].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "object") {
      const {
        from = 0,
        to = current.length - 1,
        by = 1
      } = part;
      for (let i2 = from; i2 <= to; i2 += by) {
        updatePath(current, [i2].concat(path), traversed);
      }
      return;
    } else if (path.length > 1) {
      updatePath(current[part], path, [part].concat(traversed));
      return;
    }
    prev = current[part];
    traversed = [part].concat(traversed);
  }
  let value = path[0];
  if (typeof value === "function") {
    value = value(prev, traversed);
    if (value === prev)
      return;
  }
  if (part === void 0 && value == void 0)
    return;
  value = unwrap(value);
  if (part === void 0 || isWrappable(prev) && isWrappable(value) && !Array.isArray(value)) {
    mergeStoreNode(prev, value);
  } else
    setProperty(current, part, value);
}
function createStore(...[store, options]) {
  const unwrappedStore = unwrap(store || {});
  const isArray = Array.isArray(unwrappedStore);
  const wrappedStore = wrap$1(unwrappedStore);
  function setStore(...args) {
    batch(() => {
      isArray && args.length === 1 ? updateArray(unwrappedStore, args[0]) : updatePath(unwrappedStore, args);
    });
  }
  return [wrappedStore, setStore];
}
const $ROOT = Symbol("store-root");
function applyState(target, parent, property, merge, key) {
  const previous = parent[property];
  if (target === previous)
    return;
  const isArray = Array.isArray(target);
  if (property !== $ROOT && (!isWrappable(target) || !isWrappable(previous) || isArray !== Array.isArray(previous) || key && target[key] !== previous[key])) {
    setProperty(parent, property, target);
    return;
  }
  if (isArray) {
    if (target.length && previous.length && (!merge || key && target[0] && target[0][key] != null)) {
      let i2, j2, start, end, newEnd, item, newIndicesNext, keyVal;
      for (start = 0, end = Math.min(previous.length, target.length); start < end && (previous[start] === target[start] || key && previous[start] && target[start] && previous[start][key] === target[start][key]); start++) {
        applyState(target[start], previous, start, merge, key);
      }
      const temp = new Array(target.length), newIndices = /* @__PURE__ */ new Map();
      for (end = previous.length - 1, newEnd = target.length - 1; end >= start && newEnd >= start && (previous[end] === target[newEnd] || key && previous[start] && target[start] && previous[end][key] === target[newEnd][key]); end--, newEnd--) {
        temp[newEnd] = previous[end];
      }
      if (start > newEnd || start > end) {
        for (j2 = start; j2 <= newEnd; j2++)
          setProperty(previous, j2, target[j2]);
        for (; j2 < target.length; j2++) {
          setProperty(previous, j2, temp[j2]);
          applyState(target[j2], previous, j2, merge, key);
        }
        if (previous.length > target.length)
          setProperty(previous, "length", target.length);
        return;
      }
      newIndicesNext = new Array(newEnd + 1);
      for (j2 = newEnd; j2 >= start; j2--) {
        item = target[j2];
        keyVal = key && item ? item[key] : item;
        i2 = newIndices.get(keyVal);
        newIndicesNext[j2] = i2 === void 0 ? -1 : i2;
        newIndices.set(keyVal, j2);
      }
      for (i2 = start; i2 <= end; i2++) {
        item = previous[i2];
        keyVal = key && item ? item[key] : item;
        j2 = newIndices.get(keyVal);
        if (j2 !== void 0 && j2 !== -1) {
          temp[j2] = previous[i2];
          j2 = newIndicesNext[j2];
          newIndices.set(keyVal, j2);
        }
      }
      for (j2 = start; j2 < target.length; j2++) {
        if (j2 in temp) {
          setProperty(previous, j2, temp[j2]);
          applyState(target[j2], previous, j2, merge, key);
        } else
          setProperty(previous, j2, target[j2]);
      }
    } else {
      for (let i2 = 0, len = target.length; i2 < len; i2++) {
        applyState(target[i2], previous, i2, merge, key);
      }
    }
    if (previous.length > target.length)
      setProperty(previous, "length", target.length);
    return;
  }
  const targetKeys = Object.keys(target);
  for (let i2 = 0, len = targetKeys.length; i2 < len; i2++) {
    applyState(target[targetKeys[i2]], previous, targetKeys[i2], merge, key);
  }
  const previousKeys = Object.keys(previous);
  for (let i2 = 0, len = previousKeys.length; i2 < len; i2++) {
    if (target[previousKeys[i2]] === void 0)
      setProperty(previous, previousKeys[i2], void 0);
  }
}
function reconcile(value, options = {}) {
  const {
    merge,
    key = "id"
  } = options, v2 = unwrap(value);
  return (state) => {
    if (!isWrappable(state) || !isWrappable(v2))
      return v2;
    const res = applyState(v2, {
      [$ROOT]: state
    }, $ROOT, merge, key);
    return res === void 0 ? state : res;
  };
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var src = {};
var ast = {};
Object.defineProperty(ast, "__esModule", { value: true });
var tokenizePrompt$1 = {};
var __extends = commonjsGlobal && commonjsGlobal.__extends || /* @__PURE__ */ function() {
  var extendStatics = function(d2, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b2) {
      d3.__proto__ = b2;
    } || function(d3, b2) {
      for (var p2 in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p2))
          d3[p2] = b2[p2];
    };
    return extendStatics(d2, b);
  };
  return function(d2, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d2, b);
    function __() {
      this.constructor = d2;
    }
    d2.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
Object.defineProperty(tokenizePrompt$1, "__esModule", { value: true });
tokenizePrompt$1.TokenReader = tokenizePrompt$1.TokenError = tokenizePrompt$1.tokenizePrompt = void 0;
function tokenizePrompt(input) {
  var tokens = [];
  var current = "";
  var startPosition = 0;
  var stopPosition = 0;
  var escaping = false;
  function submit() {
    if (current !== "") {
      tokens.push([current, startPosition]);
      current = "";
    }
    startPosition = stopPosition;
  }
  function append(c3) {
    current += c3;
    stopPosition++;
  }
  function skip() {
    stopPosition++;
  }
  for (var _i = 0, _a = input.replace(/，/g, ",").replace(/：/g, ":").replace(/（/g, "(").replace(/）/g, ")"); _i < _a.length; _i++) {
    var c2 = _a[_i];
    if (escaping) {
      escaping = false;
      append(c2);
    } else {
      switch (c2) {
        case "\\": {
          escaping = true;
          append(c2);
          break;
        }
        case "(":
        case ")":
        case "[":
        case "]":
        case "<":
        case ">":
        case ":":
        case ",":
        case "|": {
          submit();
          append(c2);
          submit();
          break;
        }
        case " ": {
          skip();
          submit();
          break;
        }
        default: {
          append(c2);
        }
      }
    }
  }
  submit();
  return tokens;
}
tokenizePrompt$1.tokenizePrompt = tokenizePrompt;
var TokenError = (
  /** @class */
  function(_super) {
    __extends(TokenError2, _super);
    function TokenError2(message, token, position) {
      var _this = _super.call(this, message) || this;
      _this.token = token;
      _this.position = position;
      return _this;
    }
    return TokenError2;
  }(Error)
);
tokenizePrompt$1.TokenError = TokenError;
var TokenReader = (
  /** @class */
  function() {
    function TokenReader2(tokens) {
      this.tokens = tokens;
      this.index = 0;
    }
    TokenReader2.prototype.position = function() {
      if (this.index < this.tokens.length) {
        return this.tokens[this.index][1];
      } else {
        return void 0;
      }
    };
    TokenReader2.prototype.look = function() {
      if (this.index < this.tokens.length) {
        return this.tokens[this.index][0];
      } else {
        return void 0;
      }
    };
    TokenReader2.prototype.lookMany = function(count) {
      return this.tokens.slice(this.index, this.index + count).map(function(_a) {
        var text = _a[0];
        return text;
      });
    };
    TokenReader2.prototype.next = function() {
      if (this.index < this.tokens.length) {
        this.index++;
      }
    };
    TokenReader2.prototype.error = function(message) {
      var token = this.look();
      if (token === void 0) {
        throw new TokenError("Error happened at the end of the input: ".concat(message));
      } else {
        var position = this.position();
        throw new TokenError("Error happened at (".concat(token, ",").concat(position, "):").concat(message), token, position);
      }
    };
    return TokenReader2;
  }()
);
tokenizePrompt$1.TokenReader = TokenReader;
var parsePrompt$1 = {};
Object.defineProperty(parsePrompt$1, "__esModule", { value: true });
parsePrompt$1.parsePrompt = void 0;
var tokenizePrompt_1 = tokenizePrompt$1;
function escapeToken(token) {
  return token.replace(/\\(.)/g, "$1");
}
function parseTagPrompt(reader) {
  var tokens = [];
  parsing:
    while (true) {
      var look = reader.look();
      switch (look) {
        case "(":
        case ")":
        case "[":
        case "]":
        case "<":
        case ">":
        case ":":
        case ",":
        case "|":
        case void 0: {
          break parsing;
        }
        default: {
          tokens.push(look);
          reader.next();
        }
      }
    }
  if (tokens.length === 0) {
    reader.error("Tag expected");
  } else {
    return {
      kind: "tag",
      name: tokens.map(escapeToken).join(" "),
      tokens
    };
  }
}
function parsePositivePrompt(reader) {
  reader.next();
  var contents = parsePromptContents(reader, false);
  while (true) {
    var _a = reader.lookMany(2), colon = _a[0], number = _a[1];
    if (colon !== ":") {
      break;
    }
    if (!Number.isNaN(Number.parseFloat(number))) {
      break;
    }
    reader.next();
    contents.push.apply(contents, parsePromptContents(reader, false));
  }
  if (reader.look() === ":") {
    reader.next();
    var _b = parseWeight(reader), weight = _b[0], weightText = _b[1];
    if (reader.look() === ",") {
      reader.next();
    }
    if (reader.look() === ")" || reader.look() === "}" || reader.look() === void 0) {
      reader.next();
    }
    return {
      kind: "ew",
      weight,
      weightText,
      contents
    };
  }
  if (reader.look() === ")" || reader.look() === "}" || reader.look() === void 0) {
    reader.next();
  }
  return {
    kind: "pw",
    contents
  };
}
function parseNegativePrompt(reader) {
  reader.next();
  var contents = parsePromptContents(reader, false);
  if (reader.look() === "]" || reader.look() === "}" || reader.look() === void 0) {
    reader.next();
  }
  return {
    kind: "nw",
    contents
  };
}
function parseContentToken(reader, name) {
  var look = reader.look();
  switch (look) {
    case "(":
    case ")":
    case "[":
    case "]":
    case "<":
    case ">":
    case ":":
    case ",":
    case void 0: {
      reader.error("".concat(name, " expected"));
    }
    default: {
      return escapeToken(look);
    }
  }
}
function parseFilename(reader) {
  var result = parseContentToken(reader, "Filename");
  reader.next();
  return result;
}
function parseNumber(reader, name) {
  function isInt(s3) {
    var int = Number.parseInt(s3);
    return !Number.isNaN(int) && "".concat(int) === s3;
  }
  {
    var _a = reader.lookMany(3), first = _a[0], second = _a[1], third = _a[2];
    if (isInt(first) && second === "," && isInt(third)) {
      reader.next();
      reader.next();
      reader.next();
      return [Number.parseFloat("".concat(first, ".").concat(third)), "".concat(first).concat(second).concat(third)];
    }
  }
  {
    var _b = reader.lookMany(2), first = _b[0], second = _b[1];
    if (first.endsWith(".") && isInt(first.substring(0, first.length - 1)) && isInt(second)) {
      reader.next();
      reader.next();
      return [Number.parseFloat("".concat(first).concat(second)), "".concat(first, " ").concat(second)];
    }
  }
  var numberText = parseContentToken(reader, name);
  var number = Number.parseFloat(numberText);
  if (Number.isNaN(number)) {
    reader.error("Incorrect ".concat(name.toLowerCase(), " format: ").concat(numberText));
  }
  reader.next();
  return [number, numberText];
}
function parseWeight(reader) {
  return parseNumber(reader, "Weight");
}
function parseMultiplier(reader) {
  return parseNumber(reader, "Multiplier");
}
function parseAnglePrompt(reader, kind) {
  reader.next();
  reader.next();
  if (reader.look() !== ":") {
    reader.error('":" expected');
  }
  reader.next();
  var filename = parseFilename(reader);
  if (reader.look() === ":") {
    reader.next();
    var _a = parseMultiplier(reader), multiplier = _a[0], multiplierText = _a[1];
    if (reader.look() === ">") {
      reader.next();
      return {
        kind,
        filename,
        multiplier,
        multiplierText
      };
    }
  }
  if (reader.look() === ">") {
    reader.next();
    return {
      kind,
      filename
    };
  }
  reader.next();
  reader.error('">" expected');
}
function parsePromptContent(reader, topLevel) {
  switch (reader.look()) {
    case "(":
      return parsePositivePrompt(reader);
    case "[":
      return parseNegativePrompt(reader);
    case "<": {
      var modelName = reader.lookMany(2)[1];
      switch (modelName) {
        case "lora":
        case "hypernet":
          return parseAnglePrompt(reader, modelName);
        default: {
          reader.next();
          return void 0;
        }
      }
      break;
    }
    case ",":
      reader.error("Prompt expected");
    default: {
      var tagPrompt = parseTagPrompt(reader);
      if (topLevel && reader.look() === ":" && !Number.isNaN(Number.parseFloat(reader.lookMany(2)[1]))) {
        reader.next();
        var _a = parseWeight(reader), weight = _a[0], weightText = _a[1];
        return {
          kind: "ew",
          weight,
          weightText,
          contents: [tagPrompt]
        };
      } else {
        return tagPrompt;
      }
    }
  }
}
function parsePromptContents(reader, topLevel) {
  var contents = [];
  while (true) {
    var look = reader.look();
    switch (look) {
      case ",": {
        reader.next();
        break;
      }
      case ":":
      case ")":
      case "]":
      case ">":
      case "|":
      case void 0: {
        return contents;
      }
      default: {
        var content = parsePromptContent(reader, topLevel);
        if (content !== void 0) {
          contents.push(content);
        }
      }
    }
  }
}
function parsePrompt(input) {
  var _a;
  var reader = typeof input === "string" ? new tokenizePrompt_1.TokenReader((0, tokenizePrompt_1.tokenizePrompt)(input)) : input instanceof Array ? new tokenizePrompt_1.TokenReader(input) : input;
  var prompts = [];
  var newPrompt = false;
  parsing:
    while (true) {
      newPrompt = false;
      skipping:
        while (true) {
          switch (reader.look()) {
            case "|": {
              newPrompt = true;
              reader.next();
              break;
            }
            case ")":
            case "]":
            case ">":
            case ":": {
              reader.next();
              continue parsing;
            }
            case void 0:
              return prompts;
            default:
              break skipping;
          }
        }
      var contents = parsePromptContents(reader, true);
      if (newPrompt || prompts.length === 0) {
        prompts.push({
          kind: "prompt",
          contents
        });
      } else {
        (_a = prompts[prompts.length - 1].contents).push.apply(_a, contents);
      }
    }
}
parsePrompt$1.parsePrompt = parsePrompt;
var printPrompt$1 = {};
Object.defineProperty(printPrompt$1, "__esModule", { value: true });
printPrompt$1.printPrompt = void 0;
function printPromptContents(contents) {
  var printed = "";
  var lastPromptIsTag = false;
  for (var _i = 0, contents_1 = contents; _i < contents_1.length; _i++) {
    var content = contents_1[_i];
    if (content.kind === "tag" && lastPromptIsTag) {
      printed += ", ";
    } else if (printed !== "") {
      printed += " ";
    }
    switch (content.kind) {
      case "pw": {
        printed += "(".concat(printPromptContents(content.contents), ")");
        break;
      }
      case "nw": {
        printed += "[".concat(printPromptContents(content.contents), "]");
        break;
      }
      case "ew": {
        printed += "(".concat(printPromptContents(content.contents), ":").concat(content.weightText ? content.weightText : content.weight, ")");
        break;
      }
      case "lora":
      case "hypernet": {
        printed += "<".concat(content.kind, ":").concat(content.filename, ":").concat(content.multiplierText ? content.multiplierText : content.multiplier, ">");
        break;
      }
      default:
        printed += content.name;
    }
    lastPromptIsTag = content.kind === "tag";
  }
  return printed;
}
function printPrompt(prompt2) {
  return printPromptContents(prompt2.contents);
}
printPrompt$1.printPrompt = printPrompt;
var evaluatePrompt$1 = {};
Object.defineProperty(evaluatePrompt$1, "__esModule", { value: true });
evaluatePrompt$1.evaluatePrompt = void 0;
function evaluatePromptContents(contents, currentAttention, defaultAttention, evaluated) {
  var _a, _b;
  for (var _i = 0, contents_1 = contents; _i < contents_1.length; _i++) {
    var content = contents_1[_i];
    switch (content.kind) {
      case "pw": {
        evaluatePromptContents(content.contents, currentAttention * defaultAttention, defaultAttention, evaluated);
        break;
      }
      case "nw": {
        evaluatePromptContents(content.contents, currentAttention / defaultAttention, defaultAttention, evaluated);
        break;
      }
      case "ew": {
        evaluatePromptContents(content.contents, currentAttention * content.weight, defaultAttention, evaluated);
        break;
      }
      case "lora": {
        evaluated.loras.push({ filename: content.filename, multiplier: (_a = content.multiplier) !== null && _a !== void 0 ? _a : 1 });
        break;
      }
      case "hypernet": {
        evaluated.hypernets.push({ filename: content.filename, multiplier: (_b = content.multiplier) !== null && _b !== void 0 ? _b : 1 });
        break;
      }
      default:
        evaluated.tags.push({ tag: content.name, weight: currentAttention });
    }
  }
}
function evaluatePrompt(input, defaultAttention) {
  if (defaultAttention === void 0) {
    defaultAttention = 1.1;
  }
  var evaluated = {
    tags: [],
    loras: [],
    hypernets: []
  };
  evaluatePromptContents(input.contents, 1, defaultAttention, evaluated);
  return evaluated;
}
evaluatePrompt$1.evaluatePrompt = evaluatePrompt;
(function(exports) {
  var __createBinding = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o4, m2, k2, k22) {
    if (k22 === void 0)
      k22 = k2;
    var desc = Object.getOwnPropertyDescriptor(m2, k2);
    if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m2[k2];
      } };
    }
    Object.defineProperty(o4, k22, desc);
  } : function(o4, m2, k2, k22) {
    if (k22 === void 0)
      k22 = k2;
    o4[k22] = m2[k2];
  });
  var __exportStar = commonjsGlobal && commonjsGlobal.__exportStar || function(m2, exports2) {
    for (var p2 in m2)
      if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p2))
        __createBinding(exports2, m2, p2);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(ast, exports);
  __exportStar(tokenizePrompt$1, exports);
  __exportStar(parsePrompt$1, exports);
  __exportStar(printPrompt$1, exports);
  __exportStar(evaluatePrompt$1, exports);
})(src);
const jsonClone = (data) => {
  return JSON.parse(JSON.stringify(data));
};
var _tmpl$$6 = /* @__PURE__ */ template(`<div class=prompt><div class=arrows><div class="arrow down"title="Move down">▼</div></div><label><input></label><div class=weight title="Click scroll wheel button to reset to 1"></div><button class=less title="Use Scroll Wheel to quickly change value">- 0.05</button><input type=range step=0.05><button class=more title="Use Scroll Wheel to quickly change value">+ 0.05</button><button class=remove title="Remove token">X</button><input type=checkbox>`), _tmpl$2$5 = /* @__PURE__ */ template(`<div class="arrow up"title="Move up">▲`), _tmpl$3$3 = /* @__PURE__ */ template(`<div class=promptTweaker><div class=buttons><button title="Use Scroll Wheel to quickly change all values">- 0.05 All</button><button title="Move all values 5% towards 1">Compress 5%</button><button title="Converts weights so they all add up to 1">Normalize</button><button title="Use Scroll Wheel to quickly change all values">+ 0.05 All</button></div><div class=promptTweakerPrompts>`);
const promptRemoveStart = `🔒`;
const promptRemoveEnd = `🔏`;
const convertParenthesisToExplicitWeights = (prompts) => {
  const replaceType = (prompt2) => {
    var _a, _b;
    if (prompt2.kind === `pw`) {
      prompt2 = {
        kind: `ew`,
        weight: 1.1,
        weightText: `1.1`,
        contents: (_a = prompt2.contents) == null ? void 0 : _a.map(replaceType)
      };
    }
    if (prompt2.kind === `nw`) {
      prompt2 = {
        kind: `ew`,
        weight: 0.9,
        weightText: `0.9`,
        contents: (_b = prompt2.contents) == null ? void 0 : _b.map(replaceType)
      };
    }
    return prompt2;
  };
  return prompts.map((subPrompt) => {
    subPrompt.contents = subPrompt.contents.flatMap((s3) => {
      const merged = replaceType(s3);
      const collapsed = collapsePromptWeights(merged);
      return collapsed;
    });
    return subPrompt;
  });
};
function collapsePromptWeights(data, weight = 1) {
  if (data.contents && data.contents.length > 0) {
    return data.contents.flatMap((c2) => {
      return collapsePromptWeights(c2, weight * (data.weight ?? 1));
    });
  } else {
    const truncatedWeight = truncatePromptValue(weight);
    return {
      kind: `ew`,
      weight: truncatedWeight,
      weightText: truncatedWeight.toString(),
      contents: [data]
    };
  }
}
function lerp$1(a2, b, alpha) {
  return a2 + alpha * (b - a2);
}
function findValueByKey(data, key) {
  if (!data) {
    return void 0;
  }
  if (typeof data[key] !== `undefined`) {
    return data[key];
  }
  if (data.contents) {
    for (const item of data.contents) {
      const result = findValueByKey(item, key);
      if (result !== void 0) {
        return result;
      }
    }
  }
  return void 0;
}
const truncatePromptValue = (value) => parseFloat(value.toFixed(2));
const PromptTweaker = (p2) => {
  const [formattedPrompt, setFormattedPrompt] = createStore([]);
  const update = () => {
    p2.update([{
      contents: formattedPrompt
    }].map(src.printPrompt).join(`, `));
  };
  createEffect(() => {
    const raw = src.parsePrompt(p2.prompt);
    const parsed = convertParenthesisToExplicitWeights(raw);
    setFormattedPrompt(parsed[0] ? reconcile(parsed[0].contents) : []);
  });
  const minPromptWeight = createMemo(() => Math.min(...formattedPrompt.map((p3) => p3.weight ?? 1)));
  const maxPromptWeight = createMemo(() => Math.max(...formattedPrompt.map((p3) => p3.weight ?? 1)));
  const movePrompt = (name, direction) => {
    const from = formattedPrompt.findIndex((p3) => findValueByKey(p3, `name`) === name);
    const to = from + direction;
    if (to < 0) {
      return;
    }
    const count = formattedPrompt.length;
    if (to === count) {
      return;
    }
    const cloneData = jsonClone(formattedPrompt);
    const fromPrompt = cloneData[from];
    const toPrompt = cloneData[to];
    cloneData[to] = fromPrompt;
    cloneData[from] = toPrompt;
    setFormattedPrompt(reconcile(cloneData));
    update();
  };
  const tweakPromptAll = (cb) => {
    for (const [promptIndex, prompt2] of formattedPrompt.entries()) {
      setFormattedPrompt(promptIndex, `weight`, truncatePromptValue(cb(prompt2.weight ?? -666)));
      setFormattedPrompt(promptIndex, `weightText`, (prompt2.weight ?? -666).toString());
    }
    update();
  };
  const tweakPrompt = (promptName, cb, id = `weight`) => {
    var _a;
    const promptIndex = formattedPrompt.findIndex((p3) => findValueByKey(p3, `name`) === promptName);
    if (id === `weight`) {
      setFormattedPrompt(promptIndex, id, truncatePromptValue(cb(formattedPrompt[promptIndex][id])));
      setFormattedPrompt(promptIndex, `weightText`, (_a = formattedPrompt[promptIndex].weight) == null ? void 0 : _a.toString());
    } else if (id === `name`) {
      setFormattedPrompt(promptIndex, `contents`, 0, id, cb(formattedPrompt[promptIndex][id]));
    } else {
      alert(`Implement ${id}`);
    }
    update();
  };
  const onWheelAll = (e2) => {
    const amount = e2.deltaY < 0 ? 0.05 : -0.05;
    tweakPromptAll((weight) => weight + amount);
  };
  const normalizeWeights = () => {
    const totalWeight = formattedPrompt.reduce((p3, c2) => p3 + (c2.weight ?? 0), 0);
    tweakPromptAll((weight) => parseFloat((weight / totalWeight).toFixed(3)));
  };
  const renderPromptLine = (prompt2, lookIndex) => {
    const promptName = () => findValueByKey(prompt2, `name`) ?? ``;
    const isDisabled = () => promptName().includes(promptRemoveStart) && promptName().includes(promptRemoveEnd);
    return (() => {
      var _el$ = _tmpl$$6(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$2.nextSibling, _el$5 = _el$4.firstChild, _el$6 = _el$4.nextSibling, _el$7 = _el$6.nextSibling, _el$8 = _el$7.nextSibling, _el$9 = _el$8.nextSibling, _el$10 = _el$9.nextSibling, _el$11 = _el$10.nextSibling;
      _el$.addEventListener("wheel", (e2) => {
        const amount = e2.deltaY < 0 ? 0.05 : -0.05;
        tweakPrompt(promptName(), (weight) => weight + amount);
      });
      insert(_el$2, (() => {
        var _el$12 = _tmpl$2$5();
        _el$12.$$click = () => {
          movePrompt(promptName(), -1);
        };
        return _el$12;
      })(), _el$3);
      _el$3.$$click = () => {
        movePrompt(promptName(), 1);
      };
      _el$5.addEventListener("change", (e2) => {
        const value = e2.currentTarget.value;
        tweakPrompt(promptName(), () => value, `name`);
      });
      _el$6.$$mousedown = (e2) => {
        if (e2.which !== 2) {
          return;
        }
        tweakPrompt(promptName(), () => 1);
        update();
      };
      _el$6.$$dblclick = () => {
        document.querySelector(`.comfy-queue-btn`).click();
      };
      insert(_el$6, () => (findValueByKey(prompt2, `weight`) ?? 1).toFixed(2));
      _el$7.$$click = () => {
        tweakPrompt(promptName(), (weight) => weight - 0.05);
      };
      _el$8.addEventListener("change", (e2) => {
        tweakPrompt(promptName(), () => parseFloat(e2.currentTarget.value));
      });
      _el$8.$$input = (e2) => {
        const value = formattedPrompt[lookIndex()].weight;
        if (!value || value < 0 || value > 2) {
          return;
        }
        tweakPrompt(promptName(), () => parseFloat(e2.currentTarget.value));
      };
      _el$9.$$click = () => {
        tweakPrompt(promptName(), (weight) => weight + 0.05);
      };
      _el$10.$$click = () => {
        setFormattedPrompt(formattedPrompt.filter((u3) => findValueByKey(u3, `name`) !== findValueByKey(prompt2, `name`)));
        update();
      };
      _el$11.addEventListener("change", () => {
        if (isDisabled()) {
          tweakPrompt(promptName(), () => {
            var _a;
            return (_a = findValueByKey(prompt2, `name`)) == null ? void 0 : _a.replace(promptRemoveStart, ``).replace(promptRemoveEnd, ``);
          }, `name`);
        } else {
          tweakPrompt(promptName(), () => promptRemoveStart + (findValueByKey(prompt2, `name`) ?? ``) + promptRemoveEnd, `name`);
        }
        update();
      });
      createRenderEffect((_p$) => {
        var _v$ = !!isDisabled(), _v$2 = findValueByKey(prompt2, `name`), _v$3 = Math.min(minPromptWeight(), 0), _v$4 = Math.max(maxPromptWeight(), 2), _v$5 = isDisabled() ? `Temporarily disabled token` : `Click to temporarily disable token`;
        _v$ !== _p$.e && _el$.classList.toggle("tmp", _p$.e = _v$);
        _v$2 !== _p$.t && setAttribute(_el$5, "title", _p$.t = _v$2);
        _v$3 !== _p$.a && setAttribute(_el$8, "min", _p$.a = _v$3);
        _v$4 !== _p$.o && setAttribute(_el$8, "max", _p$.o = _v$4);
        _v$5 !== _p$.i && setAttribute(_el$11, "title", _p$.i = _v$5);
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0,
        i: void 0
      });
      createRenderEffect(() => _el$5.value = findValueByKey(prompt2, `name`));
      createRenderEffect(() => _el$8.value = findValueByKey(prompt2, `weight`));
      createRenderEffect(() => _el$11.checked = !isDisabled());
      return _el$;
    })();
  };
  return (() => {
    var _el$13 = _tmpl$3$3(), _el$14 = _el$13.firstChild, _el$15 = _el$14.firstChild, _el$16 = _el$15.nextSibling, _el$17 = _el$16.nextSibling, _el$18 = _el$17.nextSibling, _el$19 = _el$14.nextSibling;
    _el$14.addEventListener("wheel", onWheelAll);
    _el$15.$$click = () => {
      tweakPromptAll((weight) => weight - 0.05);
    };
    _el$16.$$click = () => {
      tweakPromptAll((weight) => lerp$1(weight, 1, 0.05));
    };
    _el$17.$$click = normalizeWeights;
    _el$18.$$click = () => {
      tweakPromptAll((weight) => weight + 0.05);
    };
    insert(_el$19, createComponent(For, {
      each: formattedPrompt,
      children: renderPromptLine
    }));
    return _el$13;
  })();
};
delegateEvents(["click", "dblclick", "mousedown", "input"]);
var _tmpl$$5 = /* @__PURE__ */ template(`<div class=settingsPopup><div class=close>❌</div><div class=header>Settings</div><div class=modalContent><div class=mapeSettings>`), _tmpl$2$4 = /* @__PURE__ */ template(`<input type=text>`), _tmpl$3$2 = /* @__PURE__ */ template(`<input type=color>`), _tmpl$4$2 = /* @__PURE__ */ template(`<input type=number>`), _tmpl$5$2 = /* @__PURE__ */ template(`<input type=checkbox>`), _tmpl$6$2 = /* @__PURE__ */ template(`<div class=mapeSetting><label class=name></label><div class=reset title="Reset to default value">♻️</div><label class=value>`);
const defaults = {
  nodeAlignOffsetY: {
    name: `Offset Y pixel amount`,
    value: {
      type: `number`,
      value: 50
    }
  },
  nodeOrganizeSpacingInputY: {
    name: `Node organize input Y spacing`,
    value: {
      type: `number`,
      value: 15
    }
  },
  nodeOrganizeSpacingOutputY: {
    name: `Node organize output Y spacing`,
    value: {
      type: `number`,
      value: 34
    }
  },
  nodeOrganizeSpacingInputX: {
    name: `Node organize input X spacing`,
    value: {
      type: `number`,
      value: 200
    }
  },
  nodeOrganizeSpacingOutputX: {
    name: `Node organize output X spacing`,
    value: {
      type: `number`,
      value: 60
    }
  },
  alwaysPromptVariableName: {
    name: `Prompt for variable name`,
    value: {
      type: `bool`,
      value: false
    }
  },
  collapseNodesOnOrganize: {
    name: `Collapse GET/SET when organizing node`,
    value: {
      type: `bool`,
      value: true
    }
  },
  resizeNodeWidthOnAlignment: {
    name: `Resize node on left alignment`,
    value: {
      type: `bool`,
      value: true
    }
  },
  showAllConnectionsOnFocus: {
    name: `Show connections for all nodes when focusing variable`,
    value: {
      type: `bool`,
      value: true
    }
  },
  organizeSideNodes: {
    name: `Organize variables when dragging/selecting parent node`,
    value: {
      type: `bool`,
      value: true
    }
  },
  replaceSearch: {
    name: `Hijack Comfy node search to allow fuzzy search (Might break)`,
    value: {
      type: `bool`,
      value: true
    }
  },
  showConnectionOnNodeHover: {
    name: `Show connections when hovering a node`,
    value: {
      type: `bool`,
      value: false
    }
  },
  showAllConnectionsOnNodeHover: {
    name: `Show all connections when hovering a node`,
    value: {
      type: `bool`,
      value: false
    }
  },
  animateSelectedNode: {
    name: `Animate connections of the selected node`,
    value: {
      type: `bool`,
      value: false
    }
  },
  animateAllNodes: {
    name: `Animate connections of all nodes`,
    value: {
      type: `bool`,
      value: false
    }
  },
  selectedNodeConnectionOpacity: {
    name: `Opacity % of selected node connections`,
    value: {
      type: `number`,
      value: 100
    }
  },
  nodeConnectionOpacity: {
    name: `Opacity % of node connections`,
    value: {
      type: `number`,
      value: 10
    }
  },
  dblClickToRename: {
    name: `Double click regular node to set title`,
    value: {
      type: `bool`,
      value: true
    }
  },
  setIcon: {
    name: `Set title icon`,
    value: {
      type: `string`,
      value: `💾 `
    }
  },
  setBackgroundColor: {
    name: `Set title background color`,
    value: {
      type: `color`,
      value: `#212121`
    }
  },
  getIcon: {
    name: `Get title icon`,
    value: {
      type: `string`,
      value: ``
    }
  },
  getBackgroundColor: {
    name: `Get title background`,
    value: {
      type: `color`,
      value: `#212121`
    }
  },
  dblClickToRenameGroup: {
    name: `Double click groups to set title`,
    value: {
      type: `bool`,
      value: true
    }
  },
  profileNodes: {
    name: `Show node runtime duration`,
    value: {
      type: `bool`,
      value: true
    }
  },
  ignorePromptForExplodeHeal: {
    name: `Ignore prompt when splitting/healing links`,
    value: {
      type: `bool`,
      value: false
    }
  },
  filterOutIncompatibleTypes: {
    name: `Filter out incompatible types when shift dragging an input`,
    value: {
      type: `bool`,
      value: false
    }
  }
  // connection focused opacity
  // connection focused color
  // connection focused dashed
  // connection unfocused opacity
  // connection unfocused color
  // connection unfocused dashed
};
const [settings, setSettings] = createStore(JSON.parse(JSON.stringify(defaults)));
const rawSettings = localStorage[`mape_helpers_settings`];
if (rawSettings) {
  try {
    const savedSettings = JSON.parse(rawSettings);
    for (const [key, value] of Object.entries(savedSettings)) {
      setSettings(key, `value`, `value`, value);
    }
  } catch {
    console.error(`Failed to parse settings`);
  }
}
const getSetting = (name) => {
  return settings[name].value.value;
};
const Settings = (p2) => {
  const saveToLocalStorage = () => {
    localStorage[`mape_helpers_settings`] = JSON.stringify(Object.fromEntries(Object.entries(settings).map(([key, meta]) => [key, meta.value.value])));
  };
  createEffect(() => {
    JSON.stringify(settings);
    saveToLocalStorage();
  });
  return (() => {
    var _el$ = _tmpl$$5(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling, _el$5 = _el$4.firstChild;
    addEventListener(_el$2, "click", p2.close, true);
    insert(_el$5, () => Object.entries(settings).map(([id, {
      name,
      value
    }]) => {
      return (() => {
        var _el$6 = _tmpl$6$2(), _el$7 = _el$6.firstChild, _el$8 = _el$7.nextSibling, _el$9 = _el$8.nextSibling;
        setAttribute(_el$7, "for", id);
        insert(_el$7, name);
        _el$8.$$click = () => {
          setSettings(id, `value`, `value`, defaults[id].value.value);
        };
        insert(_el$9, createComponent(Switch, {
          get children() {
            return [createComponent(Match, {
              get when() {
                return value.type === `string`;
              },
              get children() {
                var _el$10 = _tmpl$2$4();
                _el$10.$$input = (e2) => {
                  setSettings(id, `value`, `value`, e2.currentTarget.value);
                };
                setAttribute(_el$10, "id", id);
                createRenderEffect(() => _el$10.value = value.value);
                return _el$10;
              }
            }), createComponent(Match, {
              get when() {
                return value.type === `color`;
              },
              get children() {
                var _el$11 = _tmpl$3$2();
                _el$11.$$input = (e2) => {
                  setSettings(id, `value`, `value`, e2.currentTarget.value);
                };
                setAttribute(_el$11, "id", id);
                createRenderEffect(() => _el$11.value = value.value);
                return _el$11;
              }
            }), createComponent(Match, {
              get when() {
                return value.type === `number`;
              },
              get children() {
                var _el$12 = _tmpl$4$2();
                _el$12.$$input = (e2) => {
                  setSettings(id, `value`, `value`, parseFloat(e2.currentTarget.value));
                };
                setAttribute(_el$12, "id", id);
                createRenderEffect(() => _el$12.value = value.value);
                return _el$12;
              }
            }), createComponent(Match, {
              get when() {
                return value.type === `bool`;
              },
              get children() {
                var _el$13 = _tmpl$5$2();
                _el$13.addEventListener("change", (e2) => {
                  setSettings(id, `value`, `value`, e2.currentTarget.checked);
                });
                setAttribute(_el$13, "id", id);
                createRenderEffect(() => _el$13.checked = value.value);
                return _el$13;
              }
            })];
          }
        }));
        return _el$6;
      })();
    }));
    return _el$;
  })();
};
delegateEvents(["click", "input"]);
const formatVariables = (name) => {
  return name.toLowerCase().replace(/_./g, (str) => str.replace(`_`, ``).toUpperCase());
};
const getLinks = () => graph.links ?? [];
const getLinkById = (linkId, links = getLinks()) => links[linkId];
const getWidgetValue = (node, slot = 0) => {
  var _a;
  if (!node) {
    return void 0;
  }
  if (node.widgets && node.widgets[slot]) {
    return node.widgets[slot].value;
  }
  if (node.widgets_values) {
    return (_a = node.widgets_values) == null ? void 0 : _a[slot];
  }
  return void 0;
};
const graphAdd = (node) => {
  graph.add(node);
};
const setWidgetValue = (node, value, slot = 0) => {
  if (!node.widgets_values) {
    node.widgets_values = [];
  }
  node.widgets_values[slot] = value;
  node.widgets[slot].value = value;
};
const graphRemove = (node) => {
  graph.remove(node);
};
const traverseInputReroute = (node, slot = 0) => {
  var _a, _b;
  if (node.type !== `Reroute`) {
    return [node, slot];
  }
  const rerouteNode = node;
  const linkId = (_b = (_a = rerouteNode.inputs) == null ? void 0 : _a[0]) == null ? void 0 : _b.link;
  if (!linkId) {
    return [rerouteNode, slot];
  }
  const originLink = getLinkById(linkId);
  if (!originLink) {
    return [rerouteNode, slot];
  }
  const nextNode = getNodeById(originLink.origin_id);
  if (!nextNode) {
    return [rerouteNode, slot];
  }
  setTimeout(() => {
    graphRemove(rerouteNode);
  });
  return traverseInputReroute(nextNode, originLink.origin_slot);
};
const traverseOutputReroute = (node) => {
  var _a, _b;
  if (node.type !== `Reroute`) {
    return node;
  }
  const rerouteNode = node;
  const links = (_a = rerouteNode.outputs[0]) == null ? void 0 : _a.links;
  if (!links) {
    return rerouteNode;
  }
  const linkId = links[0];
  if (!linkId) {
    return rerouteNode;
  }
  const originLink = getLinkById(linkId);
  if (!originLink) {
    return rerouteNode;
  }
  const nextNode = getNodeById(originLink.target_id);
  if (!nextNode) {
    return rerouteNode;
  }
  if (((_b = rerouteNode.outputs[0].links) == null ? void 0 : _b.length) === 1) {
    setTimeout(() => {
      graphRemove(rerouteNode);
    });
  }
  return traverseOutputReroute(nextNode);
};
const convertLinkToGetSet = (link, safe = false) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const {
    type
  } = link;
  if (type === `*`) {
    return;
  }
  let {
    origin_id,
    target_id,
    origin_slot,
    target_slot
  } = link;
  let originNode = getNodeById(origin_id);
  let targetNode = getNodeById(target_id);
  if (!originNode || !targetNode) {
    return false;
  }
  if (originNode.type === `Reroute`) {
    let slot = 0;
    [originNode, slot] = traverseInputReroute(originNode);
    origin_id = originNode == null ? void 0 : originNode.id;
    origin_slot = slot;
    if (typeof origin_slot === `undefined` || origin_slot === -1) {
      origin_slot = 0;
    }
  }
  if (targetNode.type === `Reroute`) {
    targetNode = traverseOutputReroute(targetNode);
    target_id = targetNode == null ? void 0 : targetNode.id;
    target_slot = targetNode == null ? void 0 : targetNode.inputs.findIndex((slot) => slot.type === type);
    if (typeof target_slot === `undefined` || target_slot === -1) {
      target_slot = 0;
    }
  }
  if (typeof origin_id === `undefined` || typeof target_id === `undefined` || !originNode || !targetNode) {
    return false;
  }
  if (safe && (isMapeVariableNode(originNode) || isMapeVariableNode(targetNode))) {
    return false;
  }
  let valueType = formatVariables(((_a = targetNode.getInputInfo(target_slot)) == null ? void 0 : _a.name) ?? type.toLowerCase());
  if (!valueType) {
    valueType = formatVariables(((_c = (_b = originNode == null ? void 0 : originNode.outputs) == null ? void 0 : _b[origin_slot]) == null ? void 0 : _c.name) ?? ((_e = (_d = originNode == null ? void 0 : originNode.outputs) == null ? void 0 : _d[origin_slot]) == null ? void 0 : _e.type.toString()) ?? `newVariable_from_${origin_id}_to_${target_id}`);
  }
  let variableNameExists = false;
  let setterAlreadyExists = false;
  if (!isMapeVariableNode(originNode)) {
    const outputLinks = (_g = (_f = originNode.outputs) == null ? void 0 : _f[origin_slot]) == null ? void 0 : _g.links;
    if (outputLinks) {
      for (const linkId of outputLinks) {
        const toNode = getNodeById(((_h = getLinkById(linkId)) == null ? void 0 : _h.target_id) ?? -1);
        if (toNode && isMapeVariableNode(toNode) && isNodeSetter(toNode)) {
          valueType = getWidgetValue(toNode);
          setterAlreadyExists = true;
        }
      }
    }
    if (!setterAlreadyExists) {
      for (const node of getMapeNodes()) {
        const value = getWidgetValue(node);
        const duplicateSource = valueType === value && isNodeSetter(node);
        if (!duplicateSource) {
          continue;
        }
        const linkId = (_i = node.inputs[0]) == null ? void 0 : _i.link;
        const sourceId = (_j = getLinkById(linkId)) == null ? void 0 : _j.origin_id;
        if (sourceId === originNode.id) {
          setterAlreadyExists = true;
        } else {
          variableNameExists = true;
        }
      }
      if (variableNameExists) {
        valueType += `_from_${origin_id}_to_${target_id}`;
      }
    }
  } else {
    valueType = getWidgetValue(originNode);
    setterAlreadyExists = true;
  }
  let newSetNode;
  if (!setterAlreadyExists) {
    newSetNode = LiteGraph.createNode(`mape Variable`);
    const targetSetPos = originNode.getConnectionPos(false, origin_slot);
    newSetNode.pos = [targetSetPos[0] + 20, targetSetPos[1]];
    newSetNode.inputs[0].name = type;
    newSetNode.inputs[0].type = type;
    newSetNode.inputs[0].widget = targetNode.inputs[target_slot].widget;
    setWidgetValue(newSetNode, valueType);
    graphAdd(newSetNode);
    newSetNode.flags.collapsed = true;
    let preValues = [];
    if (originNode.widgets) {
      preValues = Object.values(originNode.widgets).map((w2) => w2.value);
    } else if (originNode.widgets_values) {
      preValues = jsonClone(originNode.widgets_values);
    }
    originNode.connect(origin_slot, newSetNode, 0);
    originNode.widgets_values = preValues;
    if (originNode.type === `PrimitiveNode`) {
      setTimeout(() => {
        if (!originNode) {
          return;
        }
        originNode.connect(origin_slot, newSetNode, 0);
        for (const [i2, value] of preValues.entries()) {
          setWidgetValue(originNode, value, i2);
        }
        newSetNode == null ? void 0 : newSetNode.setSize(newSetNode.computeSize());
      });
    }
  }
  const newGetNode = LiteGraph.createNode(`mape Variable`);
  const targetGetPos = targetNode.getConnectionPos(true, target_slot);
  newGetNode.pos = [targetGetPos[0] - 150, targetGetPos[1]];
  newGetNode.outputs[0].name = type;
  newGetNode.outputs[0].type = type;
  newGetNode.outputs[0].widget = targetNode.inputs[target_slot].widget;
  graphAdd(newGetNode);
  setWidgetValue(newGetNode, valueType);
  newGetNode.flags.collapsed = true;
  newGetNode == null ? void 0 : newGetNode.setSize(newGetNode.computeSize());
  newGetNode.connect(0, targetNode, target_slot);
  if (safe || !variableNameExists || getSetting(`alwaysPromptVariableName`)) {
    return;
  }
  setTimeout(() => {
    window.setPrompt(`Variable name`, graph.list_of_graphcanvas[0].last_mouse_position, (value) => {
      setWidgetValue(newGetNode, value);
      if (newSetNode) {
        setWidgetValue(newSetNode, value);
      }
    }, valueType);
  }, 100);
};
const notifyUpdate = (type = `valueUpdated`) => {
  window.dispatchEvent(new CustomEvent(`mapeTweak`, {
    detail: {
      message: type
    }
  }));
};
const debouceUpdate = /* @__PURE__ */ ((message = `valueUpdated`) => {
  let updateTimeout;
  let sinceTrigger = 0;
  const triggerTime = 250;
  return () => {
    const delta = Date.now() - sinceTrigger;
    if (delta > triggerTime) {
      sinceTrigger = Date.now();
      notifyUpdate(message);
    }
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      sinceTrigger = Date.now();
      notifyUpdate(message);
    }, triggerTime);
  };
})();
function drawProfileText(ctx, text) {
  if (!text) {
    return;
  }
  ctx.save();
  ctx.fillStyle = `#000`;
  ctx.fillText(text, 5 + 1, -LiteGraph.NODE_TITLE_HEIGHT - 2 + 1);
  ctx.fillStyle = `#fff`;
  ctx.fillText(text, 5, -LiteGraph.NODE_TITLE_HEIGHT - 2);
  ctx.restore();
}
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
const EXACT_HERE = `eexxaacctt`;
const lazyRepeat = (chars, limit) => limit == 0 ? `` : limit == 1 ? `${chars}??` : limit == Infinity ? `${chars}*?` : `${chars}{0,${limit}}?`;
function uFuzzy() {
  const opts = {
    // term segmentation & punct/whitespace merging
    interSplit: `[^A-Za-z\\d']+`,
    intraSplit: `[a-z][A-Z]`,
    // intra bounds that will be used to increase lft1/rgt1 info counters
    intraBound: `[A-Za-z]\\d|\\d[A-Za-z]|[a-z][A-Z]`,
    // allowance between terms
    interChars: `.`,
    interIns: Infinity,
    // allowance between chars in terms
    intraChars: `[a-z\\d']`,
    // internally case-insensitive
    intraIns: 0,
    intraContr: `'[a-z]{1,2}\\b`
  };
  const {
    intraIns,
    intraContr,
    intraSplit: _intraSplit,
    interSplit: _interSplit,
    intraBound: _intraBound,
    intraChars
  } = opts;
  const quotedAny = `".+?"`;
  const EXACTS_RE = new RegExp(quotedAny, `gi`);
  const NEGS_RE = new RegExp(
    `(?:\\s+|^)-(?:${intraChars}+|${quotedAny})`,
    `gi`
  );
  const withIntraSplit = !!_intraSplit;
  const intraSplit = new RegExp(_intraSplit, `g`);
  const interSplit = new RegExp(_interSplit, `g`);
  const trimRe = new RegExp(`^${_interSplit}|${_interSplit}$`, `g`);
  const contrsRe = new RegExp(intraContr, `gi`);
  const split = (needle) => {
    const exacts = [];
    needle = needle.replace(EXACTS_RE, (m2) => {
      exacts.push(m2);
      return EXACT_HERE;
    });
    needle = needle.replace(trimRe, ``).toLocaleLowerCase();
    if (withIntraSplit)
      needle = needle.replace(intraSplit, (m2) => `${m2[0]} ${m2[1]}`);
    let j2 = 0;
    return needle.split(interSplit).filter((t2) => t2 != ``).map((v2) => v2 === EXACT_HERE ? exacts[j2++] : v2);
  };
  const prepQuery = (needle) => {
    let parts = split(needle);
    if (parts.length == 0) {
      return [void 0];
    }
    const contrs = Array(parts.length).fill(``);
    parts = parts.map(
      (p2, pi) => p2.replace(contrsRe, (m2) => {
        contrs[pi] = m2;
        return ``;
      })
    );
    const intraInsTpl = lazyRepeat(intraChars, intraIns);
    let reTpl = parts.map(
      (p2, pi) => p2[0] === `"` ? escapeRegExp(p2.slice(1, -1)) : p2.split(``).join(intraInsTpl) + contrs[pi]
    );
    const interCharsTpl = lazyRepeat(opts.interChars, opts.interIns);
    reTpl = reTpl.join(interCharsTpl);
    return [new RegExp(reTpl, `i`)];
  };
  const filter2 = (haystack, needle, idxs) => {
    const [query] = prepQuery(needle);
    if (!query) {
      return [];
    }
    const out = [];
    if (idxs != null) {
      for (let i2 = 0; i2 < idxs.length; i2++) {
        const idx = idxs[i2];
        query.test(haystack[idx]) && out.push(idx);
      }
    } else {
      for (let i2 = 0; i2 < haystack.length; i2++)
        query.test(haystack[i2]) && out.push(i2.toString());
    }
    return out;
  };
  const search = (haystack, needle) => {
    let preFiltered = void 0;
    const outOfOrder = 2;
    let needles = null;
    let matches = [];
    needle = needle.replace(NEGS_RE, (m2) => {
      let neg = m2.trim().slice(1);
      if (neg[0] === `"`)
        neg = escapeRegExp(neg.slice(1, -1));
      return ``;
    });
    const terms = split(needle);
    if (terms.length == 0) {
      return [];
    }
    if (terms.length > 1) {
      const terms2 = terms.slice().sort(
        (a2, b) => b.length - a2.length
      );
      for (let ti = 0; ti < terms2.length; ti++) {
        if ((preFiltered == null ? void 0 : preFiltered.length) == 0) {
          return [];
        }
        preFiltered = filter2(haystack, terms2[ti], preFiltered);
      }
      if (terms.length > outOfOrder)
        return preFiltered;
      needles = permute(terms).map((perm) => perm.join(` `));
      matches.length = 0;
      const matchedIdxs = /* @__PURE__ */ new Set();
      for (let ni = 0; ni < needles.length; ni++) {
        if (matchedIdxs.size < (preFiltered == null ? void 0 : preFiltered.length)) {
          const preFiltered2 = preFiltered == null ? void 0 : preFiltered.filter(
            (idx) => !matchedIdxs.has(idx)
          );
          const matched = filter2(haystack, needles[ni], preFiltered2);
          for (let j2 = 0; j2 < matched.length; j2++)
            matchedIdxs.add(matched[j2]);
          matches.push(matched);
        } else {
          matches.push([]);
        }
      }
    }
    if (needles == null) {
      needles = [needle];
      matches = [
        (preFiltered == null ? void 0 : preFiltered.length) > 0 ? preFiltered : filter2(haystack, needle)
      ];
    }
    return matches.flat();
  };
  return search;
}
function permute(arr) {
  arr = arr.slice();
  const length = arr.length;
  const result = [arr.slice()];
  const c2 = new Array(length).fill(0);
  let i2 = 1;
  let k2;
  let p2;
  while (i2 < length) {
    if (c2[i2] < i2) {
      k2 = i2 % 2 && c2[i2];
      p2 = arr[i2];
      arr[i2] = arr[k2];
      arr[k2] = p2;
      ++c2[i2];
      i2 = 1;
      result.push(arr.slice());
    } else {
      c2[i2] = 0;
      ++i2;
    }
  }
  return result;
}
const filter$1 = uFuzzy();
function fuzzySearch(needle, haystack) {
  return filter$1([haystack], needle).length > 0;
}
const getToSetNode = (node) => {
  const type = getWidgetValue(node);
  return getMapeSetNodes().find((n2) => getWidgetValue(n2) === type);
};
const getNodesByType = (widgetType, type) => {
  const nodes = getNodes$1().filter(isMapeVariableNode);
  const filteredNodes = type === `get` ? nodes.filter(isNodeGetter) : nodes.filter(isNodeSetter);
  return filteredNodes.filter((node) => getWidgetValue(node) === widgetType);
};
const joinAllConnections = () => {
  const selectedNodeIds = Object.fromEntries(getSelectedNodes$1().map((node) => [node.id, true]));
  const selectedNodeCount = Object.keys(selectedNodeIds).length;
  const types = Object.keys(Object.fromEntries(getMapeSetNodes().map((n2) => [getWidgetValue(n2), true])));
  for (const type of types) {
    const setter = getNodesByType(type, `set`)[0];
    if (!setter) {
      continue;
    }
    const linkId = setter.inputs[0].link;
    if (!linkId) {
      continue;
    }
    const {
      origin_id: setOriginId,
      origin_slot: setOriginSlot,
      target_id: setTargetId
    } = getLinkById(linkId);
    const originNode = getNodeById(setOriginId);
    if (!originNode) {
      continue;
    }
    let shouldRemoveSet = false;
    const getters = getNodesByType(type, `get`);
    for (const getter of getters) {
      let shouldRemoveGet = false;
      for (const output of getter.outputs) {
        if (output.links)
          for (const linkId2 of output.links) {
            const {
              target_id: getTargetId,
              target_slot: getTargetSlot,
              origin_id: getOriginId
            } = getLinkById(linkId2);
            const targetNode = getNodeById(getTargetId);
            try {
              if (selectedNodeCount === 0 || selectedNodeIds[getOriginId] || selectedNodeIds[getTargetId] || selectedNodeIds[setOriginId] || selectedNodeIds[setTargetId]) {
                originNode.connect(setOriginSlot, targetNode, getTargetSlot);
                shouldRemoveGet = true;
                shouldRemoveSet = true;
              }
            } catch (e2) {
              console.error(e2);
            }
          }
      }
      if (shouldRemoveGet) {
        graphRemove(getter);
      }
    }
    if (shouldRemoveSet) {
      const getters2 = getNodesByType(type, `get`);
      if (selectedNodeCount === 0) {
        graphRemove(setter);
      } else if (getters2.length === 0) {
        graphRemove(setter);
      }
    }
  }
  if (selectedNodeCount === 0) {
    for (const node of getMapeNodes()) {
      graphRemove(node);
    }
  }
};
function easeInOut(t2) {
  return 0.5 - 0.5 * Math.cos(Math.PI * t2);
}
function lerp(a2, b, alpha) {
  alpha = easeInOut(alpha);
  return a2 + alpha * (b - a2);
}
const jumpToPosition = ([x2, y2], lGraph) => {
  const drag = lGraph.ds;
  const windowWidth = document.body.clientWidth;
  const windowHeight = document.body.clientHeight;
  const scale = drag.scale;
  const toX = -x2 + windowWidth * 0.5 / scale;
  const toY = -y2 + windowHeight * 0.5 / scale;
  const duration = 250;
  const end = Date.now() + duration;
  const fromX = drag.offset[0];
  const fromY = drag.offset[1];
  const update = () => {
    const delta = end - Date.now();
    if (Date.now() < end) {
      requestAnimationFrame(update);
    } else {
      drag.offset[0] = toX;
      drag.offset[1] = toY;
      lGraph.setDirty(true, true);
      return;
    }
    const proc = 1 - delta / duration;
    drag.offset[0] = lerp(fromX, toX, proc);
    drag.offset[1] = lerp(fromY, toY, proc);
    lGraph.setDirty(true, true);
  };
  requestAnimationFrame(update);
};
const jumpToNode = (node) => {
  var _a;
  const lGraph = (_a = node.graph) == null ? void 0 : _a.list_of_graphcanvas[0];
  const [x2, y2] = node.pos;
  const [width, height] = node.size;
  jumpToPosition([x2 + width / 2, y2 + height / 2], lGraph);
  lGraph == null ? void 0 : lGraph.selectNode(node);
};
const organizeNode = (selectedNodes, focus = false) => {
  var _a, _b, _c;
  if (selectedNodes.length === 0) {
    return;
  }
  const offsetXInput = getSetting(`nodeOrganizeSpacingInputX`);
  const offsetXOutput = getSetting(`nodeOrganizeSpacingOutputX`);
  if (selectedNodes.filter((n2) => !isMapeVariableNode(n2)).length === 0) {
    return;
  }
  for (const selectedNode2 of selectedNodes) {
    let inputIndex = 0;
    let outputIndex = 0;
    const offsetInputY = getSetting(`nodeOrganizeSpacingInputY`);
    const offsetOutputY = getSetting(`nodeOrganizeSpacingOutputY`);
    const nodesFixed = [];
    if (!selectedNode2.graph) {
      continue;
    }
    for (const input of selectedNode2.inputs ?? []) {
      const linkId = input.link;
      if (!linkId) {
        continue;
      }
      const {
        origin_id,
        target_slot
      } = getLinkById(linkId);
      const originNode = getNodeById(origin_id);
      if (!originNode) {
        continue;
      }
      if (originNode.type !== TYPE) {
        continue;
      }
      if (originNode.outputs && originNode.outputs[0] && originNode.outputs[0].links && originNode.outputs[0].links.length > 1) {
        return;
      }
      const targetSetPos = selectedNode2.getConnectionPos(true, target_slot);
      originNode.pos = [targetSetPos[0] - offsetXInput, targetSetPos[1] + 15 + inputIndex * offsetInputY];
      inputIndex += 1;
      nodesFixed.push(originNode);
      originNode.flags.collapsed = getSetting(`collapseNodesOnOrganize`);
    }
    for (const output of selectedNode2.outputs ?? []) {
      if (!output.links) {
        continue;
      }
      if (!selectedNode2.graph) {
        continue;
      }
      for (const linkId of output.links) {
        const {
          target_id
        } = getLinkById(linkId);
        const originNode = getNodeById(target_id);
        if (!originNode) {
          console.error(`Failed`, selectedNode2.id, `>`, target_id);
          continue;
        }
        if (originNode.type !== TYPE) {
          continue;
        }
        const links = (_b = (_a = originNode.outputs) == null ? void 0 : _a[0]) == null ? void 0 : _b.links;
        if (links && links.length > 1) {
          return;
        }
        const targetSetPos = selectedNode2.getConnectionPos(false, 0);
        originNode.pos = [targetSetPos[0] + offsetXOutput, targetSetPos[1] + 15 + outputIndex * offsetOutputY];
        outputIndex += 1;
        nodesFixed.push(originNode);
        originNode.flags.collapsed = getSetting(`collapseNodesOnOrganize`);
      }
    }
    if (focus && selectedNodes.length === 1) {
      const focused = [selectedNode2, ...nodesFixed];
      const lGraph2 = selectedNode2.graph.list_of_graphcanvas[0];
      lGraph2.selectNodes(focused);
    }
  }
  const selectedNode = selectedNodes[0];
  if (!selectedNode) {
    return;
  }
  const lGraph = (_c = selectedNode.graph) == null ? void 0 : _c.list_of_graphcanvas[0];
  lGraph.setDirty(true, true);
  debouceUpdate();
};
const renameNode = (selectedNode) => {
  const fromName = getWidgetValue(selectedNode);
  setTimeout(() => {
    var _a, _b, _c;
    window.setPrompt(`Rename variable`, ((_c = (_b = (_a = selectedNode.graph) == null ? void 0 : _a.list_of_graphcanvas) == null ? void 0 : _b[0]) == null ? void 0 : _c.last_mouse_position) ?? [document.body.clientWidth / 2, document.body.clientHeight / 2], (toName) => {
      if (!toName) {
        return;
      }
      if (localStorage[`mape_tweak_${fromName}`]) {
        localStorage[`mape_tweak_${toName}`] = localStorage[`mape_tweak_${fromName}`];
        delete localStorage[`mape_tweak_${fromName}`];
      }
      if (localStorage[`${TWEAK_FLOATING}${fromName}`]) {
        localStorage[`${TWEAK_FLOATING}${toName}`] = localStorage[`${TWEAK_FLOATING}${fromName}`];
        delete localStorage[`${TWEAK_FLOATING}${fromName}`];
      }
      for (const node of graph._nodes) {
        if (getWidgetValue(node) === fromName) {
          setWidgetValue(node, toName);
        }
      }
      notifyUpdate(`rename`);
    }, fromName);
  });
};
const nodeIsLive = (node) => {
  if (!node) {
    return false;
  }
  if (node.mode === 0) {
    return true;
  }
  if (node.mode === 2) {
    return false;
  }
  return true;
};
const traverseLink = (link, nodes = getNodes$1(), links = getLinks(), type, name = ``, first) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  if (!link) {
    return;
  }
  const linkOriginNode = getNodeById(link.origin_id, nodes);
  const outputName = name || ((_b = (_a = linkOriginNode == null ? void 0 : linkOriginNode.outputs) == null ? void 0 : _a[link.origin_slot]) == null ? void 0 : _b.name);
  if (!linkOriginNode) {
    return;
  }
  if (isMapeVariableNode(linkOriginNode)) {
    const linkType = getWidgetValue(linkOriginNode);
    for (const node of nodes.filter(isMapeVariableNode).filter(isNodeSetter)) {
      const varName = getWidgetValue(node);
      if (varName === linkType) {
        const input = node.inputs[0];
        if (input.link) {
          return traverseLink(
            links[input.link],
            nodes,
            links,
            type,
            outputName
          );
        }
      }
    }
    throw new Error(`Failed to resolve virtual link`);
  }
  const isDisabled = linkOriginNode.mode === 4;
  if (isDisabled) {
    if (!linkOriginNode.inputs) {
      return;
    }
    const inputLinks = linkOriginNode.inputs.map((input) => links[input.link]).filter((link3) => (link3 == null ? void 0 : link3.type) === type).sort((a2, b) => {
      var _a2, _b2, _c2, _d2;
      const aOutput = (_b2 = (_a2 = getNodeById(a2.target_id, nodes)) == null ? void 0 : _a2.outputs[a2.target_slot]) == null ? void 0 : _b2.name;
      const bOutput = (_d2 = (_c2 = getNodeById(b.target_id, nodes)) == null ? void 0 : _c2.outputs[b.target_slot]) == null ? void 0 : _d2.name;
      if (aOutput === outputName) {
        return -1;
      }
      if (bOutput === outputName) {
        return 1;
      }
      if (a2.type === type) {
        return -1;
      }
      if (b.type === type) {
        return 1;
      }
      return 0;
    });
    const link2 = inputLinks[0];
    if (link2 && link2.type === type) {
      return traverseLink(link2, nodes, links, type, outputName);
    }
    const linkId = (_c = linkOriginNode.inputs[0]) == null ? void 0 : _c.link;
    if (linkId) {
      return traverseLink(links[linkId], nodes, links, type, outputName);
    } else {
      return;
    }
  }
  if (linkOriginNode.type === `Reroute`) {
    const linkId = (_d = linkOriginNode.inputs[0]) == null ? void 0 : _d.link;
    if (linkId) {
      return traverseLink(links[linkId], nodes, links, type, outputName);
    } else {
      return;
    }
  }
  if (!first && linkOriginNode.outputs) {
    const matchingOutputs = linkOriginNode.outputs.filter(
      (output) => (output == null ? void 0 : output.type) === type
    );
    if (matchingOutputs.length === 1 && matchingOutputs[0]) {
      const linkId = (_f = (_e = matchingOutputs == null ? void 0 : matchingOutputs[0]) == null ? void 0 : _e.links) == null ? void 0 : _f[0];
      if (linkId) {
        const link2 = getLinkById(linkId, links);
        if (link2) {
          return {
            originId: link2.origin_id,
            originIndex: link2.origin_slot
          };
        }
      }
    } else {
      const sortedMatches = matchingOutputs.sort((a2, b) => {
        const aOutput = a2 == null ? void 0 : a2.name;
        const bOutput = b == null ? void 0 : b.name;
        if (aOutput === outputName) {
          return -1;
        }
        if (bOutput === outputName) {
          return 1;
        }
        if (a2.type === type) {
          return -1;
        }
        if (b.type === type) {
          return 1;
        }
        return 0;
      });
      if (sortedMatches[0]) {
        const linkId = (_h = (_g = sortedMatches == null ? void 0 : sortedMatches[0]) == null ? void 0 : _g.links) == null ? void 0 : _h[0];
        if (linkId) {
          const link2 = getLinkById(linkId, links);
          if (link2) {
            return {
              originId: link2.origin_id,
              originIndex: link2.origin_slot
            };
          }
        }
      }
    }
  }
  if (link.type === type) {
    return {
      originId: link.origin_id,
      originIndex: link.origin_slot
    };
  }
};
const resolveLinks = (nodes = getNodes$1(), links = getLinks()) => {
  const nodeGet = {};
  const nodeSet = {};
  for (const node of nodes.filter(isMapeVariableNode).filter(isNodeSetter)) {
    const varName = getWidgetValue(node);
    const input = node.inputs[0];
    if (input.link) {
      const link = getLinkById(input.link, links);
      if (link) {
        const linkMeta = traverseLink(
          link,
          nodes,
          links,
          link.type,
          void 0,
          true
        );
        if (!linkMeta) {
          nodeSet[varName] = {
            originId: link.origin_id,
            originIndex: link.origin_slot
          };
        } else {
          nodeSet[varName] = linkMeta;
        }
      }
    }
  }
  for (const node of nodes.filter(isMapeVariableNode).filter(isNodeGetter)) {
    const varName = getWidgetValue(node);
    nodeGet[node.id] = varName;
  }
  const internalLinks = {};
  const liveNodes = nodes.filter(nodeIsLive);
  const mapeNodes = liveNodes.filter(isMapeVariableNode);
  const setterNodes = mapeNodes.filter(isNodeSetter);
  for (const setNode of setterNodes) {
    internalLinks[setNode.id] = [];
    const setNodeType = getWidgetValue(setNode);
    for (const getNode2 of mapeNodes) {
      const getNodeType = getWidgetValue(getNode2);
      if (setNodeType === getNodeType && setNode.id !== getNode2.id) {
        internalLinks[setNode.id].push(getNode2.id);
      }
    }
  }
  return {
    nodeSet,
    nodeGet,
    internalLinks
  };
};
const getSelectedNodes = () => Object.values(
  graph.list_of_graphcanvas[0].selected_nodes
);
const splitAllConnections = () => {
  const selectedNodeIds = Object.fromEntries(getSelectedNodes().map((node) => [node.id, true]));
  const selectedNodeCount = Object.keys(selectedNodeIds).length;
  Object.values(getLinks()).filter(Boolean).sort((a2, b) => a2.origin_id - b.origin_id).map((link) => {
    if (selectedNodeCount === 0 || selectedNodeIds[link.target_id] || selectedNodeIds[link.origin_id]) {
      convertLinkToGetSet(link, true);
    }
  });
  organizeNode(getNodes$1());
};
const setNodeInputOutputType = (node, type) => {
  var _a, _b, _c;
  const colors = (_a = app.canvas) == null ? void 0 : _a.default_connection_color_byType;
  const inputs = (_b = node.inputs) == null ? void 0 : _b[0];
  const outputs = (_c = node.outputs) == null ? void 0 : _c[0];
  if (inputs) {
    inputs.name = type;
    inputs.type = type;
    inputs.color_on = colors[type];
  }
  if (outputs) {
    outputs.name = type;
    outputs.type = type;
    outputs.color_on = colors[type];
  }
};
const updateLabels = (node) => {
  const updateTypeBasedOnLink = (linkId, useSourceNodeType = false, callback = (_type) => {
  }) => {
    if (!node.graph) {
      return;
    }
    const linkMeta = Object.values(getLinks()).filter(Boolean).find((link) => {
      return link.id === linkId;
    });
    if (!linkMeta) {
      return;
    }
    if (useSourceNodeType) {
      const sourceNode = getNodeById(linkMeta.origin_id);
      if (!sourceNode) {
        return;
      }
      const type2 = sourceNode.outputs[linkMeta.origin_slot].type.toString();
      setNodeInputOutputType(node, type2);
      callback(type2);
      return;
    }
    if (!linkMeta) {
      setNodeInputOutputType(node, MISSING_INPUT);
      return;
    }
    const type = linkMeta.type;
    setNodeInputOutputType(node, type);
    callback(type);
  };
  setTimeout(() => {
    var _a, _b, _c, _d, _e, _f;
    if (isNodeSetter(node)) {
      const linkId = (_b = (_a = node.inputs) == null ? void 0 : _a[0]) == null ? void 0 : _b.link;
      if (!linkId) {
        return;
      }
      updateTypeBasedOnLink(linkId, true, (type) => {
        const value = getWidgetValue(node);
        if (localStorage[`mape_tweak_${value}`]) {
          localStorage[`mape_tweak_${value}`] = type;
        }
      });
    } else if (isNodeGetter(node)) {
      const linkId = (_e = (_d = (_c = node.outputs) == null ? void 0 : _c[0]) == null ? void 0 : _d.links) == null ? void 0 : _e[0];
      if (linkId) {
        updateTypeBasedOnLink(linkId);
      }
    } else
      ;
    if (isNodeSetter(node)) {
      const value = getWidgetValue(node);
      if (!((_f = node.widgets) == null ? void 0 : _f[1])) {
        node.addWidget(`toggle`, `tweak`, !!localStorage[`mape_tweak_${value}`], (enabled) => {
          var _a2, _b2;
          const type = (_b2 = (_a2 = node.inputs) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.type;
          const value2 = getWidgetValue(node);
          if (enabled) {
            localStorage[`mape_tweak_${value2}`] = type;
          } else {
            delete localStorage[`mape_tweak_${value2}`];
          }
          debouceUpdate();
        });
      }
      node.setProperty(`tweak`, !!localStorage[`mape_tweak_${value}`]);
    }
  });
};
const root = ``;
const registerPlugin = async () => {
  const { app: app2 } = await __vitePreload(() => import(`${root}/scripts/app.js`), true ? __vite__mapDeps([]) : void 0);
  let settings2;
  app2.registerExtension({
    name: `cg.customnodes.mape_helpers_boostrap`,
    async init() {
      const _conf = app2.graph.onConfigure;
      app2.graph.onConfigure = function(...args) {
        [settings2] = args;
        _conf.apply(this, args);
      };
    }
  });
  const { api } = await __vitePreload(() => import(`${root}/scripts/api.js`), true ? __vite__mapDeps([]) : void 0);
  const { setWidgetConfig } = await __vitePreload(() => import(`${root}/extensions/core/widgetInputs.js`), true ? __vite__mapDeps([]) : void 0);
  let _graphToPrompt;
  async function prepareGraphForServerPrompt() {
    const originalPrompt = jsonClone(
      await _graphToPrompt.apply(app2)
    );
    const prompt2 = jsonClone(await _graphToPrompt.apply(app2));
    const { nodeGet, nodeSet } = resolveLinks(
      prompt2.workflow.nodes,
      Object.fromEntries(
        prompt2.workflow.links.map(
          ([
            id,
            origin_id,
            origin_slot,
            target_id,
            target_slot,
            type
          ]) => {
            return [
              id,
              {
                id,
                origin_id,
                origin_slot,
                target_id,
                target_slot,
                type
              }
            ];
          }
        )
      )
    );
    prompt2.output = Object.fromEntries(
      Object.entries(prompt2.output).filter(([_key, value]) => value.class_type !== TYPE).map(([key, node]) => {
        node.inputs = Object.fromEntries(
          Object.entries(node.inputs).map(
            ([inputKey, inputValue]) => {
              if (Array.isArray(inputValue)) {
                const [badId, _badSlot] = inputValue;
                const type = nodeGet[badId];
                const good = nodeSet[type];
                if (!type || !good) {
                  return [inputKey, inputValue];
                }
                const goodNode = getNodeById(good.originId);
                if (!goodNode) {
                  return [inputKey, inputValue];
                }
                if (goodNode.type === `PrimitiveNode`) {
                  return [
                    inputKey,
                    getWidgetValue(goodNode)
                  ];
                }
                if (goodNode.updateLink) {
                  const newLink = goodNode.updateLink({
                    origin_id: good.originId,
                    origin_slot: good.originIndex
                  });
                  if (newLink) {
                    return [
                      inputKey,
                      [
                        newLink.origin_id,
                        newLink.origin_slot
                      ]
                    ];
                  }
                }
                return [
                  inputKey,
                  [
                    good.originId.toString(),
                    good.originIndex
                  ]
                ];
              } else {
                return [inputKey, inputValue];
              }
            }
          )
        );
        return [key, node];
      })
    );
    const clearTmpPromptRegex = new RegExp(
      `${promptRemoveStart}.*?${promptRemoveEnd}`,
      `g`
    );
    prompt2.output = Object.fromEntries(
      Object.entries(prompt2.output).map(([key, node]) => {
        node.inputs = Object.fromEntries(
          Object.entries(node.inputs).map(
            ([inputKey, inputValue]) => {
              if (Array.isArray(inputValue)) {
                return [inputKey, inputValue];
              } else if (typeof inputValue === `string`) {
                return [
                  inputKey,
                  inputValue.replaceAll(clearTmpPromptRegex, ``).replace(/\(:\d+\.?\d+?\)/g, ``)
                ];
              } else {
                return [inputKey, inputValue];
              }
            }
          )
        );
        return [key, node];
      }).filter(Boolean)
    );
    return { prompt: prompt2, originalPrompt };
  }
  let showLines = false;
  let showLinesHover = false;
  let manualSelectedNode = void 0;
  const _showLinkMenu = LGraphCanvas.prototype.showLinkMenu;
  const convertLinkIntoNodes = function(link, e2) {
    if (!e2.shiftKey) {
      _showLinkMenu.apply(this, [link, e2]);
      return false;
    }
    convertLinkToGetSet(link);
    return false;
  };
  const restorePrimitives = (settings22) => {
    setTimeout(() => {
      for (const node of settings22.nodes) {
        if (node.type !== `PrimitiveNode`) {
          continue;
        }
        const actualNode = getNodeById(node.id);
        if (!actualNode) {
          continue;
        }
        for (const [i2, value] of (node.widgets_values ?? []).entries()) {
          if (actualNode.widgets && actualNode.widgets[i2]) {
            setWidgetValue(actualNode, value, i2);
          }
        }
      }
      app2.graph.setDirtyCanvas(true, true);
      debouceUpdate();
    });
  };
  const plugin2 = {
    name: `cg.customnodes.mape_helpers`,
    async beforeRegisterNodeDef(nodeType, nodeData) {
      for (const override of [
        `onAdded`,
        `onConnectInput`,
        `onConnectionsChange`,
        `onConnectOutput`,
        `onRemoved`,
        `onSelected`,
        `onDeselected`,
        `onPropertyChanged`,
        `onWidgetChanged`,
        `onMouseMove`
      ]) {
        const ref = nodeType.prototype[override];
        nodeType.prototype[override] = function(...args) {
          debouceUpdate();
          ref == null ? void 0 : ref.apply(this, args);
        };
      }
      if (nodeData.display_name !== TYPE) {
        const _dblClick = nodeType.prototype.onDblClick;
        nodeType.prototype.onDblClick = function(...args) {
          _dblClick == null ? void 0 : _dblClick.apply(this, args);
          const mousePos = args[1];
          const [, y2] = mousePos;
          if (!getSetting(`dblClickToRename`) || y2 > 0) {
            return;
          }
          const newName = prompt(`Name`, this.title);
          if (newName) {
            this.title = newName;
          }
        };
        const orig = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function(...args) {
          if (getSetting(`profileNodes`)) {
            const [ctx] = args;
            drawProfileText(
              ctx,
              this.executionDuration || ``
            );
          }
          return orig == null ? void 0 : orig.apply(this, args);
        };
        return;
      }
      if (typeof window.graph === `undefined`) {
        window.graph = app2.graph;
      }
      if (typeof window.app === `undefined`) {
        window.app = app2;
      }
      const onConnectionsChange = nodeType.prototype.onConnectionsChange;
      nodeType.prototype.onConnectionsChange = function(...args) {
        const [side] = args;
        const node = this;
        const type = side === 2 ? `output` : `input`;
        if (type === `output`) {
          if (isNodeSetter(node)) {
            node.disconnectOutput(0);
            return;
          }
        } else {
          if (isNodeGetter(node)) {
            node.disconnectInput(0);
            return;
          }
        }
        if (isMapeVariableNode(node) && side == 1) {
          updateLabels(node);
        }
        onConnectionsChange == null ? void 0 : onConnectionsChange.apply(node, args);
      };
      nodeType.prototype.getTitle = function() {
        const node = this;
        const isSetter = isNodeSetter(node);
        const icon = isSetter ? getSetting(`setIcon`) : getSetting(`getIcon`);
        nodeType.title_color = isSetter ? getSetting(`setBackgroundColor`) : getSetting(`getBackgroundColor`);
        const value = getWidgetValue(node);
        return value ? `${icon}${value}` : node.title;
      };
      nodeType.prototype.onSelected = function() {
        showLines = true;
      };
      nodeType.prototype.onMouseEnter = function() {
        manualSelectedNode = this;
        showLinesHover = true;
      };
      nodeType.prototype.onMouseLeave = function() {
        manualSelectedNode = void 0;
        showLinesHover = false;
      };
      nodeType.prototype.onDeselected = () => {
        showLines = false;
      };
      nodeType.prototype.onRemoved = () => {
        showLines = false;
      };
      nodeType.prototype.onDblClick = function(e2) {
        const node = this;
        if (e2.shiftKey) {
          setTimeout(() => {
            renameNode(node);
          }, 100);
        } else {
          node.flags.collapsed = !node.flags.collapsed;
        }
      };
    },
    async nodeCreated(node) {
      const nodeRef = node;
      nodeRef.IS_MAPE_VARIABLE = isMapeVariableNode(
        node
      );
      if (!nodeRef.IS_MAPE_VARIABLE) {
        return;
      }
      node.onGraphConfigured = () => {
      };
      const _configure = node.configure;
      node.configure = function(...args) {
        _configure.apply(this, args);
        const defaults2 = {
          FLOAT: {
            min: Number.MIN_SAFE_INTEGER,
            max: Number.MAX_SAFE_INTEGER,
            step: 0.1,
            round: 0.01
          },
          INT: {
            min: Number.MIN_SAFE_INTEGER,
            max: Number.MAX_SAFE_INTEGER
          },
          STRING: {
            default: ``
          }
        };
        node.inputs = jsonClone(args[0].inputs).map((input) => {
          setWidgetConfig(input, [input.type, defaults2[input.type]]);
          return input;
        });
        updateLabels(node);
      };
    },
    async setup() {
      var _a;
      _graphToPrompt = app2.graphToPrompt;
      if (settings2) {
        restorePrimitives(settings2);
      }
      const _conf = app2.graph.onConfigure;
      app2.graph.onConfigure = function(...args) {
        restorePrimitives(args[0]);
        _conf.apply(this, args);
      };
      if (getSetting(`replaceSearch`)) {
        String.prototype.__indexOf = String.prototype.indexOf;
        String.prototype.indexOf = function(substring, startIndex) {
          var _a2;
          const searchValue = this;
          if ((_a2 = new Error().stack) == null ? void 0 : _a2.match(/refreshHelper/)) {
            return fuzzySearch(substring, searchValue) ? 1 : -1;
          } else {
            return this.__indexOf(substring, startIndex);
          }
        };
      }
      document.addEventListener(`keydown`, (e2) => {
        if (e2.key === `z` && e2.ctrlKey) {
          e2.preventDefault();
        }
      });
      let interceptGraphToPrompt = true;
      app2.graphToPrompt = async function() {
        if (interceptGraphToPrompt && getMapeNodes().length > 0) {
          return (await prepareGraphForServerPrompt()).prompt;
        }
        return _graphToPrompt.apply(app2);
      };
      for (const eventName of [
        `status`,
        `reconnecting`,
        `reconnected`,
        `executing`,
        `executed`,
        `execution_start`,
        `execution_error`,
        `b_preview`,
        `progress`
      ]) {
        api.addEventListener(eventName, debouceUpdate);
      }
      const timeLookup = /* @__PURE__ */ new Map();
      let lastId = 0;
      for (const eventName of [`executing`]) {
        api.addEventListener(eventName, (data) => {
          var _a2;
          const id = ((_a2 = data == null ? void 0 : data.detail) == null ? void 0 : _a2.node) ?? (data == null ? void 0 : data.detail);
          const node = getNodeById(id);
          if (node) {
            node.executionDuration = ``;
          }
          const timeTaken = timeLookup.get(lastId);
          timeLookup.delete(lastId);
          if (lastId && timeTaken) {
            const delta = Date.now() - timeTaken;
            const lastNode = getNodeById(lastId);
            if (lastNode) {
              lastNode.executionDuration = `${(delta / 1e3).toFixed(2)}s`;
            }
          }
          lastId = id;
          timeLookup.set(id, Date.now());
        });
      }
      let completeTimeout;
      api.addEventListener(`progress`, (event) => {
        clearTimeout(completeTimeout);
        const { value, max, node: nodeId } = event.detail;
        const node = getNodeById(nodeId);
        if (value && max && nodeId) {
          document.title = `${node && node.title ? `${node.title}: ` : ``}${value}/${max} (${(value / max * 100).toFixed(0)}%)`;
          if (value === max) {
            document.title = `Completed!`;
            completeTimeout = setTimeout(() => {
              document.title = `ComfyUI`;
            }, 2e3);
          }
        }
        debouceUpdate();
      });
      const _show = app2.ui.dialog.show;
      window.mapeErrors = [];
      app2.ui.dialog.show = function(...args) {
        setTimeout(() => {
          if (!app2.lastNodeErrors) {
            return;
          }
          for (const [id, meta] of Object.entries(
            app2.lastNodeErrors
          )) {
            const node = getNodeById(parseFloat(id));
            for (const error of meta.errors) {
              window.mapeErrors.push({
                text: error.message,
                type: error.details,
                node
              });
            }
          }
          debouceUpdate();
          window.showWarnings(true);
        });
        _show.apply(this, args);
      };
      const saveEl = document.getElementById(`comfy-save-button`);
      if (saveEl) {
        const _saveCallback = saveEl.onclick;
        saveEl.onclick = function(e2) {
          interceptGraphToPrompt = false;
          _saveCallback(e2);
          interceptGraphToPrompt = true;
        };
      }
      const saveDevEl = document.getElementById(
        `comfy-dev-save-api-button`
      );
      if (saveDevEl) {
        const _saveDevCallback = saveDevEl.onclick;
        saveDevEl.onclick = function(e2) {
          interceptGraphToPrompt = false;
          _saveDevCallback(e2);
          interceptGraphToPrompt = true;
        };
      }
      const _drawFrontCanvas = LGraphCanvas.prototype.drawFrontCanvas;
      LGraphCanvas.prototype.drawFrontCanvas = function(...args) {
        var _a2, _b;
        _drawFrontCanvas.apply(this, args);
        if (!showLines && !showLinesHover) {
          return;
        }
        let selectedNode = getSelectedNode();
        if (!selectedNode && manualSelectedNode && getSetting(`showAllConnectionsOnNodeHover`)) {
          selectedNode = manualSelectedNode;
        }
        if (!selectedNode && manualSelectedNode && getSetting(`showConnectionOnNodeHover`)) {
          if (isNodeGetter(manualSelectedNode)) {
            selectedNode = getToSetNode(manualSelectedNode);
          } else {
            selectedNode = manualSelectedNode;
          }
        }
        if (!selectedNode || !app2.canvas) {
          return;
        }
        const onlyShowSelectedConnection = !showLines && showLinesHover && !getSetting(`showAllConnectionsOnNodeHover`) && getSetting(`showConnectionOnNodeHover`);
        const ctx = this.ctx;
        const { nodeSet, internalLinks } = resolveLinks();
        for (const baseNode of getNodes$1().filter(
          (node) => isMapeVariableNode(node)
        )) {
          const setNode = baseNode;
          if (onlyShowSelectedConnection && baseNode.id !== selectedNode.id) {
            continue;
          }
          if (baseNode.id !== setNode.id)
            ;
          if (isNodeGetter(baseNode)) {
            continue;
          }
          const links = internalLinks[setNode.id];
          if (!links) {
            continue;
          }
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          for (const targetId of links) {
            const getNode2 = getNodeById(targetId);
            if (!getNode2) {
              console.error(`failed`, setNode.id, targetId);
              continue;
            }
            const selectedType = getWidgetValue(selectedNode);
            const nodeType = getWidgetValue(getNode2);
            let onlyConnectedToDisabledNodes = true;
            const links2 = (_b = (_a2 = getNode2.outputs) == null ? void 0 : _a2[0]) == null ? void 0 : _b.links;
            if (links2) {
              for (const linkId of links2) {
                const link = getLinkById(linkId);
                if (link) {
                  const targetNode = getNodeById(
                    link.target_id
                  );
                  if (targetNode && targetNode.mode !== 4) {
                    onlyConnectedToDisabledNodes = false;
                  }
                }
              }
            }
            if (onlyConnectedToDisabledNodes) {
              continue;
            }
            if (!getSetting(`showAllConnectionsOnFocus`) && selectedType !== nodeType) {
              continue;
            }
            let tmpSetNode = setNode;
            let tmpSlot = 0;
            if (nodeSet[nodeType] && nodeSet[nodeType].originId !== setNode.id) {
              const replacementNode = getNodeById(
                nodeSet[nodeType].originId
              );
              if (replacementNode) {
                tmpSetNode = replacementNode;
                tmpSlot = nodeSet[nodeType].originIndex;
              }
            }
            const pos1IsInput = false;
            const pos2IsInput = true;
            const pos1 = tmpSetNode.getConnectionPos(
              pos1IsInput,
              tmpSlot
            );
            const pos2 = getNode2.getConnectionPos(pos2IsInput, 0);
            const scale = app2.canvas.ds.scale;
            const offset = app2.canvas.ds.offset;
            pos1[0] = pos1[0] * scale + offset[0] * scale;
            pos1[1] = pos1[1] * scale + offset[1] * scale;
            pos2[0] = pos2[0] * scale + offset[0] * scale;
            pos2[1] = pos2[1] * scale + offset[1] * scale;
            const delta_x = pos2[0] - pos1[0];
            const delta_y = pos2[1] - pos1[1];
            const endDirection = LiteGraph.LEFT;
            const staDirection = Math.abs(delta_y) > Math.abs(delta_x) ? delta_y > 0 ? LiteGraph.DOWN : LiteGraph.UP : delta_x < 0 ? LiteGraph.LEFT : LiteGraph.RIGHT;
            const pos1InViewport = pos1[0] > 0 && pos1[1] > 0 && pos1[0] < viewportWidth && pos1[1] < viewportHeight;
            const pos2InViewport = pos2[0] > 0 && pos2[1] > 0 && pos2[0] < viewportWidth && pos2[1] < viewportHeight;
            const shouldCull = !pos1InViewport && !pos2InViewport;
            if (shouldCull) {
              continue;
            }
            ctx.save();
            ctx.shadowColor = `#000`;
            ctx.shadowBlur = 15;
            ctx.lineCap = `round`;
            const isSelectedNode = selectedType === nodeType;
            const animate = getSetting(`animateAllNodes`) || isSelectedNode && getSetting(`animateSelectedNode`) || false;
            app2.canvas.renderLink(
              ctx,
              pos1,
              pos2,
              void 0,
              true,
              animate,
              isSelectedNode ? `rgba(255,244,53,${getSetting(
                `selectedNodeConnectionOpacity`
              ) / 100})` : `rgba(255,255,255,${getSetting(`nodeConnectionOpacity`) / 100})`,
              staDirection,
              endDirection
            );
            ctx.restore();
          }
        }
      };
      LGraphCanvas.prototype.showLinkMenu = convertLinkIntoNodes;
      const originalShowConnectionMenu = LGraphCanvas.prototype.showConnectionMenu;
      LGraphCanvas.prototype.showConnectionMenu = function(...args) {
        if (shiftDown) {
          return;
        }
        this.use_original_menu = true;
        originalShowConnectionMenu.apply(this, args);
        this.use_original_menu = false;
      };
      let shiftDown = false;
      let ctrlDown = false;
      document.addEventListener(`keydown`, (e2) => {
        ctrlDown = e2.ctrlKey;
        shiftDown = e2.shiftKey;
      });
      app2.canvas._mousemove_callback = () => {
        if (!getSetting(`organizeSideNodes`)) {
          return;
        }
        const selectedNodes = getSelectedNodes$1();
        organizeNode(selectedNodes);
      };
      document.addEventListener(`keyup`, (e2) => {
        var _a2;
        const focusedElement = document.activeElement;
        if (focusedElement.tagName === `INPUT` && (focusedElement.type === `text` || focusedElement.type === `number`) || focusedElement.tagName === `TEXTAREA`) {
          return;
        }
        if (e2.key === `A` && e2.shiftKey) {
          document.querySelector(
            `.comfy-queue-btn`
          ).click();
          return;
        }
        if (e2.key === `ArrowLeft` && e2.shiftKey) {
          const selectedNodes = getSelectedNodes$1();
          const minLeft = Math.min(
            ...selectedNodes.map((n2) => n2.pos[0])
          );
          const maxSize = Math.max(
            ...selectedNodes.map((n2) => n2.size[0])
          );
          for (const node of selectedNodes) {
            node.pos = [minLeft, node.pos[1]];
            if (getSetting(`resizeNodeWidthOnAlignment`)) {
              node.size = [maxSize, node.size[1]];
            }
          }
          return;
        }
        if (e2.key === `ArrowDown` && e2.shiftKey) {
          const selectedNodes = getSelectedNodes$1().filter(
            (n2) => !isMapeVariableNode(n2)
          );
          const minY = Math.min(
            ...selectedNodes.map((node) => {
              return node.pos[1];
            })
          );
          const perNodeY = getSetting(`nodeAlignOffsetY`);
          let totalOffset = 0;
          for (const node of selectedNodes.sort((a2, b) => {
            return a2.pos[1] - b.pos[1];
          })) {
            node.pos = [node.pos[0], minY + totalOffset];
            const sizeY = node.size[1] + perNodeY;
            totalOffset += sizeY;
          }
          return;
        }
        if (e2.key === `ArrowUp` && e2.shiftKey) {
          const selectedNodes = getSelectedNodes$1();
          const minTop = Math.min(
            ...selectedNodes.map((n2) => n2.pos[1])
          );
          for (const node of selectedNodes) {
            node.pos = [node.pos[0], minTop];
          }
          return;
        }
        if (e2.key === `O` && e2.shiftKey) {
          const selectedNodes = getSelectedNodes$1();
          organizeNode(selectedNodes, true);
          return;
        }
        const selectedNode = getSelectedNodes$1()[0];
        if (selectedNode && e2.key === `S` && e2.shiftKey) {
          splitAllConnections();
          return;
        }
        if (selectedNode && e2.key === `J` && e2.shiftKey) {
          joinAllConnections();
          return;
        }
        if (!selectedNode || !selectedNode.type || selectedNode.type !== TYPE) {
          return;
        }
        if (e2.key === `w`) {
          renameNode(selectedNode);
          return;
        }
        if (e2.key === `s`) {
          const jumpTo = getWidgetValue(selectedNode);
          for (const node of graph._nodes) {
            if (getWidgetValue(node) === jumpTo) {
              if ((_a2 = node.inputs) == null ? void 0 : _a2[0].link) {
                jumpToNode(node);
              }
            }
          }
          return;
        }
        if (e2.key === `ArrowLeft` || e2.key === `ArrowRight`) {
          const direction = e2.key === `ArrowLeft` ? -1 : 1;
          const selected = selectedNode;
          const jumpTo = getWidgetValue(selected);
          let siblings = graph._nodes.filter((node) => {
            return getWidgetValue(node) === jumpTo;
          });
          const source = siblings.find(isNodeSetter);
          if (!source) {
            return;
          }
          siblings = siblings.sort((a2, b) => {
            const distanceA = calculateDistance(
              source.pos[0],
              source.pos[1],
              a2.pos[0],
              a2.pos[1]
            );
            const distanceB = calculateDistance(
              source.pos[0],
              source.pos[1],
              b.pos[0],
              b.pos[1]
            );
            return distanceA - distanceB;
          });
          const currentIndex = siblings.findIndex(
            (n2) => n2.id === selected.id
          );
          const next = currentIndex + direction;
          const count = siblings.length;
          if (next > count - 1) {
            return;
          }
          if (next < 0) {
            return;
          }
          jumpToNode(siblings[next]);
          return;
        }
        if (e2.key.match(/^\d+$/)) {
          const index = parseFloat(e2.key) - 1;
          const selected = selectedNode;
          const jumpTo = getWidgetValue(selected);
          const siblings = graph._nodes.filter((node2) => {
            return getWidgetValue(node2) === jumpTo;
          });
          const node = siblings[index];
          if (node) {
            jumpToNode(node);
          }
          return;
        }
      });
      document.body.addEventListener(`keyup`, () => {
        ctrlDown = false;
        shiftDown = false;
      });
      let original_allow_searchbox = (_a = app2.canvas) == null ? void 0 : _a.allow_searchbox;
      Object.defineProperty(app2.canvas, `allow_searchbox`, {
        get: function() {
          var _a2, _b;
          const group = this.graph.getGroupOnPos(
            ...this.canvas_mouse
          );
          const undraggingConnection = this.connecting_node && isMapeVariableNode(this.connecting_node);
          if (!shiftDown || undraggingConnection) {
            return original_allow_searchbox;
          }
          if (this.connecting_input) {
            const propName = formatVariables(
              (_a2 = this.connecting_input.name) == null ? void 0 : _a2.toLowerCase()
            );
            const type = (_b = this.connecting_input) == null ? void 0 : _b.type;
            const newGetNode = LiteGraph.createNode(
              `mape Variable`
            );
            newGetNode.pos = [
              this.canvas_mouse[0] + 10,
              this.canvas_mouse[1]
            ];
            graphAdd(newGetNode);
            const fromIndex = this.connecting_input.slot_index;
            setWidgetValue(newGetNode, propName);
            newGetNode.connect(0, this.connecting_node, fromIndex);
            newGetNode.flags.collapsed = true;
            newGetNode.setSize(newGetNode.computeSize());
            setTimeout(() => {
              var _a3, _b2;
              window.setPrompt(
                `Variable name`,
                ((_b2 = (_a3 = graph.list_of_graphcanvas) == null ? void 0 : _a3[0]) == null ? void 0 : _b2.last_mouse_position) ?? [
                  document.body.clientWidth / 2,
                  document.body.clientHeight / 2
                ],
                (value) => {
                  setWidgetValue(newGetNode, value);
                },
                propName,
                type
              );
            });
            return false;
          } else if (this.connecting_output) {
            const valueType = formatVariables(
              this.connecting_output.name ?? this.connecting_output.type
            );
            const newSetNode = LiteGraph.createNode(
              `mape Variable`
            );
            newSetNode.pos = [
              this.canvas_mouse[0] + 10,
              this.canvas_mouse[1]
            ];
            graphAdd(newSetNode);
            const fromIndex = this.connecting_output.slot_index;
            setWidgetValue(newSetNode, valueType);
            this.connecting_node.connect(fromIndex, newSetNode, 0);
            newSetNode.flags.collapsed = true;
            newSetNode.setSize(newSetNode.computeSize());
            if (!ctrlDown) {
              setTimeout(() => {
                var _a3, _b2;
                window.setPrompt(
                  `Variable name`,
                  ((_b2 = (_a3 = graph.list_of_graphcanvas) == null ? void 0 : _a3[0]) == null ? void 0 : _b2.last_mouse_position) ?? [
                    document.body.clientWidth / 2,
                    document.body.clientHeight / 2
                  ],
                  (value) => {
                    setWidgetValue(newSetNode, value);
                  },
                  valueType
                );
              });
              return false;
            }
            const newGetNode = LiteGraph.createNode(
              `mape Variable`
            );
            newGetNode.pos = [
              this.canvas_mouse[0] + 10,
              this.canvas_mouse[1] + 50
            ];
            graphAdd(newGetNode);
            setWidgetValue(newGetNode, valueType);
            newGetNode.flags.collapsed = true;
            newGetNode.setSize(newGetNode.computeSize());
            setTimeout(() => {
              var _a3, _b2;
              window.setPrompt(
                `Variable name`,
                ((_b2 = (_a3 = graph.list_of_graphcanvas) == null ? void 0 : _a3[0]) == null ? void 0 : _b2.last_mouse_position) ?? [
                  document.body.clientWidth / 2,
                  document.body.clientHeight / 2
                ],
                (value) => {
                  setWidgetValue(newSetNode, value);
                  setWidgetValue(newGetNode, value);
                },
                valueType
              );
            });
            return false;
          }
          if (group && shiftDown && getSetting(`dblClickToRenameGroup`)) {
            shiftDown = false;
            setTimeout(() => {
              const name = prompt(
                `Change group name`,
                group.title
              );
              if (name) {
                group.title = name;
                app2.graph.setDirtyCanvas(true, true);
                notifyUpdate(`rename`);
              }
            }, 100);
            return false;
          }
          return true;
        },
        set: function(ref) {
          original_allow_searchbox = ref;
        }
      });
    }
  };
  app2.registerExtension(plugin2);
};
const plugin = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  registerPlugin
}, Symbol.toStringTag, { value: "Module" }));
const isff = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase().indexOf("firefox") > 0 : false;
function addEvent(object, event, method, useCapture) {
  if (object.addEventListener) {
    object.addEventListener(event, method, useCapture);
  } else if (object.attachEvent) {
    object.attachEvent("on".concat(event), method);
  }
}
function removeEvent(object, event, method, useCapture) {
  if (object.removeEventListener) {
    object.removeEventListener(event, method, useCapture);
  } else if (object.deachEvent) {
    object.deachEvent("on".concat(event), method);
  }
}
function getMods(modifier, key) {
  const mods = key.slice(0, key.length - 1);
  for (let i2 = 0; i2 < mods.length; i2++)
    mods[i2] = modifier[mods[i2].toLowerCase()];
  return mods;
}
function getKeys(key) {
  if (typeof key !== "string")
    key = "";
  key = key.replace(/\s/g, "");
  const keys = key.split(",");
  let index = keys.lastIndexOf("");
  for (; index >= 0; ) {
    keys[index - 1] += ",";
    keys.splice(index, 1);
    index = keys.lastIndexOf("");
  }
  return keys;
}
function compareArray(a1, a2) {
  const arr1 = a1.length >= a2.length ? a1 : a2;
  const arr2 = a1.length >= a2.length ? a2 : a1;
  let isIndex = true;
  for (let i2 = 0; i2 < arr1.length; i2++) {
    if (arr2.indexOf(arr1[i2]) === -1)
      isIndex = false;
  }
  return isIndex;
}
const _keyMap = {
  backspace: 8,
  "⌫": 8,
  tab: 9,
  clear: 12,
  enter: 13,
  "↩": 13,
  return: 13,
  esc: 27,
  escape: 27,
  space: 32,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  del: 46,
  delete: 46,
  ins: 45,
  insert: 45,
  home: 36,
  end: 35,
  pageup: 33,
  pagedown: 34,
  capslock: 20,
  num_0: 96,
  num_1: 97,
  num_2: 98,
  num_3: 99,
  num_4: 100,
  num_5: 101,
  num_6: 102,
  num_7: 103,
  num_8: 104,
  num_9: 105,
  num_multiply: 106,
  num_add: 107,
  num_enter: 108,
  num_subtract: 109,
  num_decimal: 110,
  num_divide: 111,
  "⇪": 20,
  ",": 188,
  ".": 190,
  "/": 191,
  "`": 192,
  "-": isff ? 173 : 189,
  "=": isff ? 61 : 187,
  ";": isff ? 59 : 186,
  "'": 222,
  "[": 219,
  "]": 221,
  "\\": 220
};
const _modifier = {
  // shiftKey
  "⇧": 16,
  shift: 16,
  // altKey
  "⌥": 18,
  alt: 18,
  option: 18,
  // ctrlKey
  "⌃": 17,
  ctrl: 17,
  control: 17,
  // metaKey
  "⌘": 91,
  cmd: 91,
  command: 91
};
const modifierMap = {
  16: "shiftKey",
  18: "altKey",
  17: "ctrlKey",
  91: "metaKey",
  shiftKey: 16,
  ctrlKey: 17,
  altKey: 18,
  metaKey: 91
};
const _mods = {
  16: false,
  18: false,
  17: false,
  91: false
};
const _handlers = {};
for (let k2 = 1; k2 < 20; k2++) {
  _keyMap["f".concat(k2)] = 111 + k2;
}
let _downKeys = [];
let winListendFocus = null;
let _scope = "all";
const elementEventMap = /* @__PURE__ */ new Map();
const code = (x2) => _keyMap[x2.toLowerCase()] || _modifier[x2.toLowerCase()] || x2.toUpperCase().charCodeAt(0);
const getKey = (x2) => Object.keys(_keyMap).find((k2) => _keyMap[k2] === x2);
const getModifier = (x2) => Object.keys(_modifier).find((k2) => _modifier[k2] === x2);
function setScope(scope) {
  _scope = scope || "all";
}
function getScope() {
  return _scope || "all";
}
function getPressedKeyCodes() {
  return _downKeys.slice(0);
}
function getPressedKeyString() {
  return _downKeys.map((c2) => getKey(c2) || getModifier(c2) || String.fromCharCode(c2));
}
function getAllKeyCodes() {
  const result = [];
  Object.keys(_handlers).forEach((k2) => {
    _handlers[k2].forEach((_ref) => {
      let {
        key,
        scope,
        mods,
        shortcut
      } = _ref;
      result.push({
        scope,
        shortcut,
        mods,
        keys: key.split("+").map((v2) => code(v2))
      });
    });
  });
  return result;
}
function filter(event) {
  const target = event.target || event.srcElement;
  const {
    tagName
  } = target;
  let flag = true;
  if (target.isContentEditable || (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") && !target.readOnly) {
    flag = false;
  }
  return flag;
}
function isPressed(keyCode) {
  if (typeof keyCode === "string") {
    keyCode = code(keyCode);
  }
  return _downKeys.indexOf(keyCode) !== -1;
}
function deleteScope(scope, newScope) {
  let handlers;
  let i2;
  if (!scope)
    scope = getScope();
  for (const key in _handlers) {
    if (Object.prototype.hasOwnProperty.call(_handlers, key)) {
      handlers = _handlers[key];
      for (i2 = 0; i2 < handlers.length; ) {
        if (handlers[i2].scope === scope) {
          const deleteItems = handlers.splice(i2, 1);
          deleteItems.forEach((_ref2) => {
            let {
              element
            } = _ref2;
            return removeKeyEvent(element);
          });
        } else {
          i2++;
        }
      }
    }
  }
  if (getScope() === scope)
    setScope(newScope || "all");
}
function clearModifier(event) {
  let key = event.keyCode || event.which || event.charCode;
  const i2 = _downKeys.indexOf(key);
  if (i2 >= 0) {
    _downKeys.splice(i2, 1);
  }
  if (event.key && event.key.toLowerCase() === "meta") {
    _downKeys.splice(0, _downKeys.length);
  }
  if (key === 93 || key === 224)
    key = 91;
  if (key in _mods) {
    _mods[key] = false;
    for (const k2 in _modifier)
      if (_modifier[k2] === key)
        hotkeys[k2] = false;
  }
}
function unbind(keysInfo) {
  if (typeof keysInfo === "undefined") {
    Object.keys(_handlers).forEach((key) => {
      Array.isArray(_handlers[key]) && _handlers[key].forEach((info) => eachUnbind(info));
      delete _handlers[key];
    });
    removeKeyEvent(null);
  } else if (Array.isArray(keysInfo)) {
    keysInfo.forEach((info) => {
      if (info.key)
        eachUnbind(info);
    });
  } else if (typeof keysInfo === "object") {
    if (keysInfo.key)
      eachUnbind(keysInfo);
  } else if (typeof keysInfo === "string") {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    let [scope, method] = args;
    if (typeof scope === "function") {
      method = scope;
      scope = "";
    }
    eachUnbind({
      key: keysInfo,
      scope,
      method,
      splitKey: "+"
    });
  }
}
const eachUnbind = (_ref3) => {
  let {
    key,
    scope,
    method,
    splitKey = "+"
  } = _ref3;
  const multipleKeys = getKeys(key);
  multipleKeys.forEach((originKey) => {
    const unbindKeys = originKey.split(splitKey);
    const len = unbindKeys.length;
    const lastKey = unbindKeys[len - 1];
    const keyCode = lastKey === "*" ? "*" : code(lastKey);
    if (!_handlers[keyCode])
      return;
    if (!scope)
      scope = getScope();
    const mods = len > 1 ? getMods(_modifier, unbindKeys) : [];
    const unbindElements = [];
    _handlers[keyCode] = _handlers[keyCode].filter((record) => {
      const isMatchingMethod = method ? record.method === method : true;
      const isUnbind = isMatchingMethod && record.scope === scope && compareArray(record.mods, mods);
      if (isUnbind)
        unbindElements.push(record.element);
      return !isUnbind;
    });
    unbindElements.forEach((element) => removeKeyEvent(element));
  });
};
function eventHandler(event, handler, scope, element) {
  if (handler.element !== element) {
    return;
  }
  let modifiersMatch;
  if (handler.scope === scope || handler.scope === "all") {
    modifiersMatch = handler.mods.length > 0;
    for (const y2 in _mods) {
      if (Object.prototype.hasOwnProperty.call(_mods, y2)) {
        if (!_mods[y2] && handler.mods.indexOf(+y2) > -1 || _mods[y2] && handler.mods.indexOf(+y2) === -1) {
          modifiersMatch = false;
        }
      }
    }
    if (handler.mods.length === 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91] || modifiersMatch || handler.shortcut === "*") {
      handler.keys = [];
      handler.keys = handler.keys.concat(_downKeys);
      if (handler.method(event, handler) === false) {
        if (event.preventDefault)
          event.preventDefault();
        else
          event.returnValue = false;
        if (event.stopPropagation)
          event.stopPropagation();
        if (event.cancelBubble)
          event.cancelBubble = true;
      }
    }
  }
}
function dispatch(event, element) {
  const asterisk = _handlers["*"];
  let key = event.keyCode || event.which || event.charCode;
  if (!hotkeys.filter.call(this, event))
    return;
  if (key === 93 || key === 224)
    key = 91;
  if (_downKeys.indexOf(key) === -1 && key !== 229)
    _downKeys.push(key);
  ["ctrlKey", "altKey", "shiftKey", "metaKey"].forEach((keyName) => {
    const keyNum = modifierMap[keyName];
    if (event[keyName] && _downKeys.indexOf(keyNum) === -1) {
      _downKeys.push(keyNum);
    } else if (!event[keyName] && _downKeys.indexOf(keyNum) > -1) {
      _downKeys.splice(_downKeys.indexOf(keyNum), 1);
    } else if (keyName === "metaKey" && event[keyName] && _downKeys.length === 3) {
      if (!(event.ctrlKey || event.shiftKey || event.altKey)) {
        _downKeys = _downKeys.slice(_downKeys.indexOf(keyNum));
      }
    }
  });
  if (key in _mods) {
    _mods[key] = true;
    for (const k2 in _modifier) {
      if (_modifier[k2] === key)
        hotkeys[k2] = true;
    }
    if (!asterisk)
      return;
  }
  for (const e2 in _mods) {
    if (Object.prototype.hasOwnProperty.call(_mods, e2)) {
      _mods[e2] = event[modifierMap[e2]];
    }
  }
  if (event.getModifierState && !(event.altKey && !event.ctrlKey) && event.getModifierState("AltGraph")) {
    if (_downKeys.indexOf(17) === -1) {
      _downKeys.push(17);
    }
    if (_downKeys.indexOf(18) === -1) {
      _downKeys.push(18);
    }
    _mods[17] = true;
    _mods[18] = true;
  }
  const scope = getScope();
  if (asterisk) {
    for (let i2 = 0; i2 < asterisk.length; i2++) {
      if (asterisk[i2].scope === scope && (event.type === "keydown" && asterisk[i2].keydown || event.type === "keyup" && asterisk[i2].keyup)) {
        eventHandler(event, asterisk[i2], scope, element);
      }
    }
  }
  if (!(key in _handlers))
    return;
  const handlerKey = _handlers[key];
  const keyLen = handlerKey.length;
  for (let i2 = 0; i2 < keyLen; i2++) {
    if (event.type === "keydown" && handlerKey[i2].keydown || event.type === "keyup" && handlerKey[i2].keyup) {
      if (handlerKey[i2].key) {
        const record = handlerKey[i2];
        const {
          splitKey
        } = record;
        const keyShortcut = record.key.split(splitKey);
        const _downKeysCurrent = [];
        for (let a2 = 0; a2 < keyShortcut.length; a2++) {
          _downKeysCurrent.push(code(keyShortcut[a2]));
        }
        if (_downKeysCurrent.sort().join("") === _downKeys.sort().join("")) {
          eventHandler(event, record, scope, element);
        }
      }
    }
  }
}
function hotkeys(key, option, method) {
  _downKeys = [];
  const keys = getKeys(key);
  let mods = [];
  let scope = "all";
  let element = document;
  let i2 = 0;
  let keyup = false;
  let keydown = true;
  let splitKey = "+";
  let capture = false;
  let single = false;
  if (method === void 0 && typeof option === "function") {
    method = option;
  }
  if (Object.prototype.toString.call(option) === "[object Object]") {
    if (option.scope)
      scope = option.scope;
    if (option.element)
      element = option.element;
    if (option.keyup)
      keyup = option.keyup;
    if (option.keydown !== void 0)
      keydown = option.keydown;
    if (option.capture !== void 0)
      capture = option.capture;
    if (typeof option.splitKey === "string")
      splitKey = option.splitKey;
    if (option.single === true)
      single = true;
  }
  if (typeof option === "string")
    scope = option;
  if (single)
    unbind(key, scope);
  for (; i2 < keys.length; i2++) {
    key = keys[i2].split(splitKey);
    mods = [];
    if (key.length > 1)
      mods = getMods(_modifier, key);
    key = key[key.length - 1];
    key = key === "*" ? "*" : code(key);
    if (!(key in _handlers))
      _handlers[key] = [];
    _handlers[key].push({
      keyup,
      keydown,
      scope,
      mods,
      shortcut: keys[i2],
      method,
      key: keys[i2],
      splitKey,
      element
    });
  }
  if (typeof element !== "undefined" && window) {
    if (!elementEventMap.has(element)) {
      const keydownListener = function() {
        let event = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : window.event;
        return dispatch(event, element);
      };
      const keyupListenr = function() {
        let event = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : window.event;
        dispatch(event, element);
        clearModifier(event);
      };
      elementEventMap.set(element, {
        keydownListener,
        keyupListenr,
        capture
      });
      addEvent(element, "keydown", keydownListener, capture);
      addEvent(element, "keyup", keyupListenr, capture);
    }
    if (!winListendFocus) {
      const listener = () => {
        _downKeys = [];
      };
      winListendFocus = {
        listener,
        capture
      };
      addEvent(window, "focus", listener, capture);
    }
  }
}
function trigger(shortcut) {
  let scope = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "all";
  Object.keys(_handlers).forEach((key) => {
    const dataList = _handlers[key].filter((item) => item.scope === scope && item.shortcut === shortcut);
    dataList.forEach((data) => {
      if (data && data.method) {
        data.method();
      }
    });
  });
}
function removeKeyEvent(element) {
  const values = Object.values(_handlers).flat();
  const findindex = values.findIndex((_ref4) => {
    let {
      element: el
    } = _ref4;
    return el === element;
  });
  if (findindex < 0) {
    const {
      keydownListener,
      keyupListenr,
      capture
    } = elementEventMap.get(element) || {};
    if (keydownListener && keyupListenr) {
      removeEvent(element, "keyup", keyupListenr, capture);
      removeEvent(element, "keydown", keydownListener, capture);
      elementEventMap.delete(element);
    }
  }
  if (values.length <= 0 || elementEventMap.size <= 0) {
    const eventKeys = Object.keys(elementEventMap);
    eventKeys.forEach((el) => {
      const {
        keydownListener,
        keyupListenr,
        capture
      } = elementEventMap.get(el) || {};
      if (keydownListener && keyupListenr) {
        removeEvent(el, "keyup", keyupListenr, capture);
        removeEvent(el, "keydown", keydownListener, capture);
        elementEventMap.delete(el);
      }
    });
    elementEventMap.clear();
    Object.keys(_handlers).forEach((key) => delete _handlers[key]);
    if (winListendFocus) {
      const {
        listener,
        capture
      } = winListendFocus;
      removeEvent(window, "focus", listener, capture);
      winListendFocus = null;
    }
  }
}
const _api = {
  getPressedKeyString,
  setScope,
  getScope,
  deleteScope,
  getPressedKeyCodes,
  getAllKeyCodes,
  isPressed,
  filter,
  trigger,
  unbind,
  keyMap: _keyMap,
  modifier: _modifier,
  modifierMap
};
for (const a2 in _api) {
  if (Object.prototype.hasOwnProperty.call(_api, a2)) {
    hotkeys[a2] = _api[a2];
  }
}
if (typeof window !== "undefined") {
  const _hotkeys = window.hotkeys;
  hotkeys.noConflict = (deep) => {
    if (deep && window.hotkeys === hotkeys) {
      window.hotkeys = _hotkeys;
    }
    return hotkeys;
  };
  window.hotkeys = hotkeys;
}
const t$3 = window, e$8 = t$3.ShadowRoot && (void 0 === t$3.ShadyCSS || t$3.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$5 = Symbol(), n$7 = /* @__PURE__ */ new WeakMap();
let o$8 = class o {
  constructor(t2, e2, n2) {
    if (this._$cssResult$ = true, n2 !== s$5)
      throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t2, this.t = e2;
  }
  get styleSheet() {
    let t2 = this.o;
    const s3 = this.t;
    if (e$8 && void 0 === t2) {
      const e2 = void 0 !== s3 && 1 === s3.length;
      e2 && (t2 = n$7.get(s3)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), e2 && n$7.set(s3, t2));
    }
    return t2;
  }
  toString() {
    return this.cssText;
  }
};
const r$4 = (t2) => new o$8("string" == typeof t2 ? t2 : t2 + "", void 0, s$5), i$3 = (t2, ...e2) => {
  const n2 = 1 === t2.length ? t2[0] : e2.reduce((e3, s3, n3) => e3 + ((t3) => {
    if (true === t3._$cssResult$)
      return t3.cssText;
    if ("number" == typeof t3)
      return t3;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t3 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s3) + t2[n3 + 1], t2[0]);
  return new o$8(n2, t2, s$5);
}, S$1 = (s3, n2) => {
  e$8 ? s3.adoptedStyleSheets = n2.map((t2) => t2 instanceof CSSStyleSheet ? t2 : t2.styleSheet) : n2.forEach((e2) => {
    const n3 = document.createElement("style"), o4 = t$3.litNonce;
    void 0 !== o4 && n3.setAttribute("nonce", o4), n3.textContent = e2.cssText, s3.appendChild(n3);
  });
}, c$4 = e$8 ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
  let e2 = "";
  for (const s3 of t3.cssRules)
    e2 += s3.cssText;
  return r$4(e2);
})(t2) : t2;
var s$4;
const e$7 = window, r$3 = e$7.trustedTypes, h$3 = r$3 ? r$3.emptyScript : "", o$7 = e$7.reactiveElementPolyfillSupport, n$6 = { toAttribute(t2, i2) {
  switch (i2) {
    case Boolean:
      t2 = t2 ? h$3 : null;
      break;
    case Object:
    case Array:
      t2 = null == t2 ? t2 : JSON.stringify(t2);
  }
  return t2;
}, fromAttribute(t2, i2) {
  let s3 = t2;
  switch (i2) {
    case Boolean:
      s3 = null !== t2;
      break;
    case Number:
      s3 = null === t2 ? null : Number(t2);
      break;
    case Object:
    case Array:
      try {
        s3 = JSON.parse(t2);
      } catch (t3) {
        s3 = null;
      }
  }
  return s3;
} }, a$2 = (t2, i2) => i2 !== t2 && (i2 == i2 || t2 == t2), l$5 = { attribute: true, type: String, converter: n$6, reflect: false, hasChanged: a$2 }, d$1 = "finalized";
let u$2 = class u extends HTMLElement {
  constructor() {
    super(), this._$Ei = /* @__PURE__ */ new Map(), this.isUpdatePending = false, this.hasUpdated = false, this._$El = null, this._$Eu();
  }
  static addInitializer(t2) {
    var i2;
    this.finalize(), (null !== (i2 = this.h) && void 0 !== i2 ? i2 : this.h = []).push(t2);
  }
  static get observedAttributes() {
    this.finalize();
    const t2 = [];
    return this.elementProperties.forEach((i2, s3) => {
      const e2 = this._$Ep(s3, i2);
      void 0 !== e2 && (this._$Ev.set(e2, s3), t2.push(e2));
    }), t2;
  }
  static createProperty(t2, i2 = l$5) {
    if (i2.state && (i2.attribute = false), this.finalize(), this.elementProperties.set(t2, i2), !i2.noAccessor && !this.prototype.hasOwnProperty(t2)) {
      const s3 = "symbol" == typeof t2 ? Symbol() : "__" + t2, e2 = this.getPropertyDescriptor(t2, s3, i2);
      void 0 !== e2 && Object.defineProperty(this.prototype, t2, e2);
    }
  }
  static getPropertyDescriptor(t2, i2, s3) {
    return { get() {
      return this[i2];
    }, set(e2) {
      const r2 = this[t2];
      this[i2] = e2, this.requestUpdate(t2, r2, s3);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t2) {
    return this.elementProperties.get(t2) || l$5;
  }
  static finalize() {
    if (this.hasOwnProperty(d$1))
      return false;
    this[d$1] = true;
    const t2 = Object.getPrototypeOf(this);
    if (t2.finalize(), void 0 !== t2.h && (this.h = [...t2.h]), this.elementProperties = new Map(t2.elementProperties), this._$Ev = /* @__PURE__ */ new Map(), this.hasOwnProperty("properties")) {
      const t3 = this.properties, i2 = [...Object.getOwnPropertyNames(t3), ...Object.getOwnPropertySymbols(t3)];
      for (const s3 of i2)
        this.createProperty(s3, t3[s3]);
    }
    return this.elementStyles = this.finalizeStyles(this.styles), true;
  }
  static finalizeStyles(i2) {
    const s3 = [];
    if (Array.isArray(i2)) {
      const e2 = new Set(i2.flat(1 / 0).reverse());
      for (const i3 of e2)
        s3.unshift(c$4(i3));
    } else
      void 0 !== i2 && s3.push(c$4(i2));
    return s3;
  }
  static _$Ep(t2, i2) {
    const s3 = i2.attribute;
    return false === s3 ? void 0 : "string" == typeof s3 ? s3 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
  }
  _$Eu() {
    var t2;
    this._$E_ = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$Eg(), this.requestUpdate(), null === (t2 = this.constructor.h) || void 0 === t2 || t2.forEach((t3) => t3(this));
  }
  addController(t2) {
    var i2, s3;
    (null !== (i2 = this._$ES) && void 0 !== i2 ? i2 : this._$ES = []).push(t2), void 0 !== this.renderRoot && this.isConnected && (null === (s3 = t2.hostConnected) || void 0 === s3 || s3.call(t2));
  }
  removeController(t2) {
    var i2;
    null === (i2 = this._$ES) || void 0 === i2 || i2.splice(this._$ES.indexOf(t2) >>> 0, 1);
  }
  _$Eg() {
    this.constructor.elementProperties.forEach((t2, i2) => {
      this.hasOwnProperty(i2) && (this._$Ei.set(i2, this[i2]), delete this[i2]);
    });
  }
  createRenderRoot() {
    var t2;
    const s3 = null !== (t2 = this.shadowRoot) && void 0 !== t2 ? t2 : this.attachShadow(this.constructor.shadowRootOptions);
    return S$1(s3, this.constructor.elementStyles), s3;
  }
  connectedCallback() {
    var t2;
    void 0 === this.renderRoot && (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), null === (t2 = this._$ES) || void 0 === t2 || t2.forEach((t3) => {
      var i2;
      return null === (i2 = t3.hostConnected) || void 0 === i2 ? void 0 : i2.call(t3);
    });
  }
  enableUpdating(t2) {
  }
  disconnectedCallback() {
    var t2;
    null === (t2 = this._$ES) || void 0 === t2 || t2.forEach((t3) => {
      var i2;
      return null === (i2 = t3.hostDisconnected) || void 0 === i2 ? void 0 : i2.call(t3);
    });
  }
  attributeChangedCallback(t2, i2, s3) {
    this._$AK(t2, s3);
  }
  _$EO(t2, i2, s3 = l$5) {
    var e2;
    const r2 = this.constructor._$Ep(t2, s3);
    if (void 0 !== r2 && true === s3.reflect) {
      const h2 = (void 0 !== (null === (e2 = s3.converter) || void 0 === e2 ? void 0 : e2.toAttribute) ? s3.converter : n$6).toAttribute(i2, s3.type);
      this._$El = t2, null == h2 ? this.removeAttribute(r2) : this.setAttribute(r2, h2), this._$El = null;
    }
  }
  _$AK(t2, i2) {
    var s3;
    const e2 = this.constructor, r2 = e2._$Ev.get(t2);
    if (void 0 !== r2 && this._$El !== r2) {
      const t3 = e2.getPropertyOptions(r2), h2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== (null === (s3 = t3.converter) || void 0 === s3 ? void 0 : s3.fromAttribute) ? t3.converter : n$6;
      this._$El = r2, this[r2] = h2.fromAttribute(i2, t3.type), this._$El = null;
    }
  }
  requestUpdate(t2, i2, s3) {
    let e2 = true;
    void 0 !== t2 && (((s3 = s3 || this.constructor.getPropertyOptions(t2)).hasChanged || a$2)(this[t2], i2) ? (this._$AL.has(t2) || this._$AL.set(t2, i2), true === s3.reflect && this._$El !== t2 && (void 0 === this._$EC && (this._$EC = /* @__PURE__ */ new Map()), this._$EC.set(t2, s3))) : e2 = false), !this.isUpdatePending && e2 && (this._$E_ = this._$Ej());
  }
  async _$Ej() {
    this.isUpdatePending = true;
    try {
      await this._$E_;
    } catch (t3) {
      Promise.reject(t3);
    }
    const t2 = this.scheduleUpdate();
    return null != t2 && await t2, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var t2;
    if (!this.isUpdatePending)
      return;
    this.hasUpdated, this._$Ei && (this._$Ei.forEach((t3, i3) => this[i3] = t3), this._$Ei = void 0);
    let i2 = false;
    const s3 = this._$AL;
    try {
      i2 = this.shouldUpdate(s3), i2 ? (this.willUpdate(s3), null === (t2 = this._$ES) || void 0 === t2 || t2.forEach((t3) => {
        var i3;
        return null === (i3 = t3.hostUpdate) || void 0 === i3 ? void 0 : i3.call(t3);
      }), this.update(s3)) : this._$Ek();
    } catch (t3) {
      throw i2 = false, this._$Ek(), t3;
    }
    i2 && this._$AE(s3);
  }
  willUpdate(t2) {
  }
  _$AE(t2) {
    var i2;
    null === (i2 = this._$ES) || void 0 === i2 || i2.forEach((t3) => {
      var i3;
      return null === (i3 = t3.hostUpdated) || void 0 === i3 ? void 0 : i3.call(t3);
    }), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
  }
  _$Ek() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$E_;
  }
  shouldUpdate(t2) {
    return true;
  }
  update(t2) {
    void 0 !== this._$EC && (this._$EC.forEach((t3, i2) => this._$EO(i2, this[i2], t3)), this._$EC = void 0), this._$Ek();
  }
  updated(t2) {
  }
  firstUpdated(t2) {
  }
};
u$2[d$1] = true, u$2.elementProperties = /* @__PURE__ */ new Map(), u$2.elementStyles = [], u$2.shadowRootOptions = { mode: "open" }, null == o$7 || o$7({ ReactiveElement: u$2 }), (null !== (s$4 = e$7.reactiveElementVersions) && void 0 !== s$4 ? s$4 : e$7.reactiveElementVersions = []).push("1.6.3");
var t$2;
const i$2 = window, s$3 = i$2.trustedTypes, e$6 = s$3 ? s$3.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, o$6 = "$lit$", n$5 = `lit$${(Math.random() + "").slice(9)}$`, l$4 = "?" + n$5, h$2 = `<${l$4}>`, r$2 = document, u$1 = () => r$2.createComment(""), d = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, c$3 = Array.isArray, v = (t2) => c$3(t2) || "function" == typeof (null == t2 ? void 0 : t2[Symbol.iterator]), a$1 = "[ 	\n\f\r]", f$1 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _ = /-->/g, m$1 = />/g, p$1 = RegExp(`>|${a$1}(?:([^\\s"'>=/]+)(${a$1}*=${a$1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), g = /'/g, $ = /"/g, y = /^(?:script|style|textarea|title)$/i, w = (t2) => (i2, ...s3) => ({ _$litType$: t2, strings: i2, values: s3 }), x = w(1), T = Symbol.for("lit-noChange"), A = Symbol.for("lit-nothing"), E = /* @__PURE__ */ new WeakMap(), C = r$2.createTreeWalker(r$2, 129, null, false);
function P(t2, i2) {
  if (!Array.isArray(t2) || !t2.hasOwnProperty("raw"))
    throw Error("invalid template strings array");
  return void 0 !== e$6 ? e$6.createHTML(i2) : i2;
}
const V = (t2, i2) => {
  const s3 = t2.length - 1, e2 = [];
  let l2, r2 = 2 === i2 ? "<svg>" : "", u3 = f$1;
  for (let i3 = 0; i3 < s3; i3++) {
    const s4 = t2[i3];
    let d2, c2, v2 = -1, a2 = 0;
    for (; a2 < s4.length && (u3.lastIndex = a2, c2 = u3.exec(s4), null !== c2); )
      a2 = u3.lastIndex, u3 === f$1 ? "!--" === c2[1] ? u3 = _ : void 0 !== c2[1] ? u3 = m$1 : void 0 !== c2[2] ? (y.test(c2[2]) && (l2 = RegExp("</" + c2[2], "g")), u3 = p$1) : void 0 !== c2[3] && (u3 = p$1) : u3 === p$1 ? ">" === c2[0] ? (u3 = null != l2 ? l2 : f$1, v2 = -1) : void 0 === c2[1] ? v2 = -2 : (v2 = u3.lastIndex - c2[2].length, d2 = c2[1], u3 = void 0 === c2[3] ? p$1 : '"' === c2[3] ? $ : g) : u3 === $ || u3 === g ? u3 = p$1 : u3 === _ || u3 === m$1 ? u3 = f$1 : (u3 = p$1, l2 = void 0);
    const w2 = u3 === p$1 && t2[i3 + 1].startsWith("/>") ? " " : "";
    r2 += u3 === f$1 ? s4 + h$2 : v2 >= 0 ? (e2.push(d2), s4.slice(0, v2) + o$6 + s4.slice(v2) + n$5 + w2) : s4 + n$5 + (-2 === v2 ? (e2.push(void 0), i3) : w2);
  }
  return [P(t2, r2 + (t2[s3] || "<?>") + (2 === i2 ? "</svg>" : "")), e2];
};
class N {
  constructor({ strings: t2, _$litType$: i2 }, e2) {
    let h2;
    this.parts = [];
    let r2 = 0, d2 = 0;
    const c2 = t2.length - 1, v2 = this.parts, [a2, f2] = V(t2, i2);
    if (this.el = N.createElement(a2, e2), C.currentNode = this.el.content, 2 === i2) {
      const t3 = this.el.content, i3 = t3.firstChild;
      i3.remove(), t3.append(...i3.childNodes);
    }
    for (; null !== (h2 = C.nextNode()) && v2.length < c2; ) {
      if (1 === h2.nodeType) {
        if (h2.hasAttributes()) {
          const t3 = [];
          for (const i3 of h2.getAttributeNames())
            if (i3.endsWith(o$6) || i3.startsWith(n$5)) {
              const s3 = f2[d2++];
              if (t3.push(i3), void 0 !== s3) {
                const t4 = h2.getAttribute(s3.toLowerCase() + o$6).split(n$5), i4 = /([.?@])?(.*)/.exec(s3);
                v2.push({ type: 1, index: r2, name: i4[2], strings: t4, ctor: "." === i4[1] ? H : "?" === i4[1] ? L : "@" === i4[1] ? z : k });
              } else
                v2.push({ type: 6, index: r2 });
            }
          for (const i3 of t3)
            h2.removeAttribute(i3);
        }
        if (y.test(h2.tagName)) {
          const t3 = h2.textContent.split(n$5), i3 = t3.length - 1;
          if (i3 > 0) {
            h2.textContent = s$3 ? s$3.emptyScript : "";
            for (let s3 = 0; s3 < i3; s3++)
              h2.append(t3[s3], u$1()), C.nextNode(), v2.push({ type: 2, index: ++r2 });
            h2.append(t3[i3], u$1());
          }
        }
      } else if (8 === h2.nodeType)
        if (h2.data === l$4)
          v2.push({ type: 2, index: r2 });
        else {
          let t3 = -1;
          for (; -1 !== (t3 = h2.data.indexOf(n$5, t3 + 1)); )
            v2.push({ type: 7, index: r2 }), t3 += n$5.length - 1;
        }
      r2++;
    }
  }
  static createElement(t2, i2) {
    const s3 = r$2.createElement("template");
    return s3.innerHTML = t2, s3;
  }
}
function S(t2, i2, s3 = t2, e2) {
  var o4, n2, l2, h2;
  if (i2 === T)
    return i2;
  let r2 = void 0 !== e2 ? null === (o4 = s3._$Co) || void 0 === o4 ? void 0 : o4[e2] : s3._$Cl;
  const u3 = d(i2) ? void 0 : i2._$litDirective$;
  return (null == r2 ? void 0 : r2.constructor) !== u3 && (null === (n2 = null == r2 ? void 0 : r2._$AO) || void 0 === n2 || n2.call(r2, false), void 0 === u3 ? r2 = void 0 : (r2 = new u3(t2), r2._$AT(t2, s3, e2)), void 0 !== e2 ? (null !== (l2 = (h2 = s3)._$Co) && void 0 !== l2 ? l2 : h2._$Co = [])[e2] = r2 : s3._$Cl = r2), void 0 !== r2 && (i2 = S(t2, r2._$AS(t2, i2.values), r2, e2)), i2;
}
class M {
  constructor(t2, i2) {
    this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i2;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t2) {
    var i2;
    const { el: { content: s3 }, parts: e2 } = this._$AD, o4 = (null !== (i2 = null == t2 ? void 0 : t2.creationScope) && void 0 !== i2 ? i2 : r$2).importNode(s3, true);
    C.currentNode = o4;
    let n2 = C.nextNode(), l2 = 0, h2 = 0, u3 = e2[0];
    for (; void 0 !== u3; ) {
      if (l2 === u3.index) {
        let i3;
        2 === u3.type ? i3 = new R(n2, n2.nextSibling, this, t2) : 1 === u3.type ? i3 = new u3.ctor(n2, u3.name, u3.strings, this, t2) : 6 === u3.type && (i3 = new Z(n2, this, t2)), this._$AV.push(i3), u3 = e2[++h2];
      }
      l2 !== (null == u3 ? void 0 : u3.index) && (n2 = C.nextNode(), l2++);
    }
    return C.currentNode = r$2, o4;
  }
  v(t2) {
    let i2 = 0;
    for (const s3 of this._$AV)
      void 0 !== s3 && (void 0 !== s3.strings ? (s3._$AI(t2, s3, i2), i2 += s3.strings.length - 2) : s3._$AI(t2[i2])), i2++;
  }
}
class R {
  constructor(t2, i2, s3, e2) {
    var o4;
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t2, this._$AB = i2, this._$AM = s3, this.options = e2, this._$Cp = null === (o4 = null == e2 ? void 0 : e2.isConnected) || void 0 === o4 || o4;
  }
  get _$AU() {
    var t2, i2;
    return null !== (i2 = null === (t2 = this._$AM) || void 0 === t2 ? void 0 : t2._$AU) && void 0 !== i2 ? i2 : this._$Cp;
  }
  get parentNode() {
    let t2 = this._$AA.parentNode;
    const i2 = this._$AM;
    return void 0 !== i2 && 11 === (null == t2 ? void 0 : t2.nodeType) && (t2 = i2.parentNode), t2;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t2, i2 = this) {
    t2 = S(this, t2, i2), d(t2) ? t2 === A || null == t2 || "" === t2 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t2 !== this._$AH && t2 !== T && this._(t2) : void 0 !== t2._$litType$ ? this.g(t2) : void 0 !== t2.nodeType ? this.$(t2) : v(t2) ? this.T(t2) : this._(t2);
  }
  k(t2) {
    return this._$AA.parentNode.insertBefore(t2, this._$AB);
  }
  $(t2) {
    this._$AH !== t2 && (this._$AR(), this._$AH = this.k(t2));
  }
  _(t2) {
    this._$AH !== A && d(this._$AH) ? this._$AA.nextSibling.data = t2 : this.$(r$2.createTextNode(t2)), this._$AH = t2;
  }
  g(t2) {
    var i2;
    const { values: s3, _$litType$: e2 } = t2, o4 = "number" == typeof e2 ? this._$AC(t2) : (void 0 === e2.el && (e2.el = N.createElement(P(e2.h, e2.h[0]), this.options)), e2);
    if ((null === (i2 = this._$AH) || void 0 === i2 ? void 0 : i2._$AD) === o4)
      this._$AH.v(s3);
    else {
      const t3 = new M(o4, this), i3 = t3.u(this.options);
      t3.v(s3), this.$(i3), this._$AH = t3;
    }
  }
  _$AC(t2) {
    let i2 = E.get(t2.strings);
    return void 0 === i2 && E.set(t2.strings, i2 = new N(t2)), i2;
  }
  T(t2) {
    c$3(this._$AH) || (this._$AH = [], this._$AR());
    const i2 = this._$AH;
    let s3, e2 = 0;
    for (const o4 of t2)
      e2 === i2.length ? i2.push(s3 = new R(this.k(u$1()), this.k(u$1()), this, this.options)) : s3 = i2[e2], s3._$AI(o4), e2++;
    e2 < i2.length && (this._$AR(s3 && s3._$AB.nextSibling, e2), i2.length = e2);
  }
  _$AR(t2 = this._$AA.nextSibling, i2) {
    var s3;
    for (null === (s3 = this._$AP) || void 0 === s3 || s3.call(this, false, true, i2); t2 && t2 !== this._$AB; ) {
      const i3 = t2.nextSibling;
      t2.remove(), t2 = i3;
    }
  }
  setConnected(t2) {
    var i2;
    void 0 === this._$AM && (this._$Cp = t2, null === (i2 = this._$AP) || void 0 === i2 || i2.call(this, t2));
  }
}
class k {
  constructor(t2, i2, s3, e2, o4) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t2, this.name = i2, this._$AM = e2, this.options = o4, s3.length > 2 || "" !== s3[0] || "" !== s3[1] ? (this._$AH = Array(s3.length - 1).fill(new String()), this.strings = s3) : this._$AH = A;
  }
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2, i2 = this, s3, e2) {
    const o4 = this.strings;
    let n2 = false;
    if (void 0 === o4)
      t2 = S(this, t2, i2, 0), n2 = !d(t2) || t2 !== this._$AH && t2 !== T, n2 && (this._$AH = t2);
    else {
      const e3 = t2;
      let l2, h2;
      for (t2 = o4[0], l2 = 0; l2 < o4.length - 1; l2++)
        h2 = S(this, e3[s3 + l2], i2, l2), h2 === T && (h2 = this._$AH[l2]), n2 || (n2 = !d(h2) || h2 !== this._$AH[l2]), h2 === A ? t2 = A : t2 !== A && (t2 += (null != h2 ? h2 : "") + o4[l2 + 1]), this._$AH[l2] = h2;
    }
    n2 && !e2 && this.j(t2);
  }
  j(t2) {
    t2 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, null != t2 ? t2 : "");
  }
}
class H extends k {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t2) {
    this.element[this.name] = t2 === A ? void 0 : t2;
  }
}
const I = s$3 ? s$3.emptyScript : "";
class L extends k {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t2) {
    t2 && t2 !== A ? this.element.setAttribute(this.name, I) : this.element.removeAttribute(this.name);
  }
}
class z extends k {
  constructor(t2, i2, s3, e2, o4) {
    super(t2, i2, s3, e2, o4), this.type = 5;
  }
  _$AI(t2, i2 = this) {
    var s3;
    if ((t2 = null !== (s3 = S(this, t2, i2, 0)) && void 0 !== s3 ? s3 : A) === T)
      return;
    const e2 = this._$AH, o4 = t2 === A && e2 !== A || t2.capture !== e2.capture || t2.once !== e2.once || t2.passive !== e2.passive, n2 = t2 !== A && (e2 === A || o4);
    o4 && this.element.removeEventListener(this.name, this, e2), n2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
  }
  handleEvent(t2) {
    var i2, s3;
    "function" == typeof this._$AH ? this._$AH.call(null !== (s3 = null === (i2 = this.options) || void 0 === i2 ? void 0 : i2.host) && void 0 !== s3 ? s3 : this.element, t2) : this._$AH.handleEvent(t2);
  }
}
class Z {
  constructor(t2, i2, s3) {
    this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i2, this.options = s3;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2) {
    S(this, t2);
  }
}
const j = { O: o$6, P: n$5, A: l$4, C: 1, M: V, L: M, R: v, D: S, I: R, V: k, H: L, N: z, U: H, F: Z }, B = i$2.litHtmlPolyfillSupport;
null == B || B(N, R), (null !== (t$2 = i$2.litHtmlVersions) && void 0 !== t$2 ? t$2 : i$2.litHtmlVersions = []).push("2.8.0");
const D = (t2, i2, s3) => {
  var e2, o4;
  const n2 = null !== (e2 = null == s3 ? void 0 : s3.renderBefore) && void 0 !== e2 ? e2 : i2;
  let l2 = n2._$litPart$;
  if (void 0 === l2) {
    const t3 = null !== (o4 = null == s3 ? void 0 : s3.renderBefore) && void 0 !== o4 ? o4 : null;
    n2._$litPart$ = l2 = new R(i2.insertBefore(u$1(), t3), t3, void 0, null != s3 ? s3 : {});
  }
  return l2._$AI(t2), l2;
};
var l$3, o$5;
let s$2 = class s extends u$2 {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t2, e2;
    const i2 = super.createRenderRoot();
    return null !== (t2 = (e2 = this.renderOptions).renderBefore) && void 0 !== t2 || (e2.renderBefore = i2.firstChild), i2;
  }
  update(t2) {
    const i2 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = D(i2, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t2;
    super.connectedCallback(), null === (t2 = this._$Do) || void 0 === t2 || t2.setConnected(true);
  }
  disconnectedCallback() {
    var t2;
    super.disconnectedCallback(), null === (t2 = this._$Do) || void 0 === t2 || t2.setConnected(false);
  }
  render() {
    return T;
  }
};
s$2.finalized = true, s$2._$litElement$ = true, null === (l$3 = globalThis.litElementHydrateSupport) || void 0 === l$3 || l$3.call(globalThis, { LitElement: s$2 });
const n$4 = globalThis.litElementPolyfillSupport;
null == n$4 || n$4({ LitElement: s$2 });
(null !== (o$5 = globalThis.litElementVersions) && void 0 !== o$5 ? o$5 : globalThis.litElementVersions = []).push("3.3.3");
const e$5 = (e2) => (n2) => "function" == typeof n2 ? ((e3, n3) => (customElements.define(e3, n3), n3))(e2, n2) : ((e3, n3) => {
  const { kind: t2, elements: s3 } = n3;
  return { kind: t2, elements: s3, finisher(n4) {
    customElements.define(e3, n4);
  } };
})(e2, n2);
const i$1 = (i2, e2) => "method" === e2.kind && e2.descriptor && !("value" in e2.descriptor) ? { ...e2, finisher(n2) {
  n2.createProperty(e2.key, i2);
} } : { kind: "field", key: Symbol(), placement: "own", descriptor: {}, originalKey: e2.key, initializer() {
  "function" == typeof e2.initializer && (this[e2.key] = e2.initializer.call(this));
}, finisher(n2) {
  n2.createProperty(e2.key, i2);
} }, e$4 = (i2, e2, n2) => {
  e2.constructor.createProperty(n2, i2);
};
function n$3(n2) {
  return (t2, o4) => void 0 !== o4 ? e$4(n2, t2, o4) : i$1(n2, t2);
}
function t$1(t2) {
  return n$3({ ...t2, state: true });
}
var n$2;
null != (null === (n$2 = window.HTMLSlotElement) || void 0 === n$2 ? void 0 : n$2.prototype.assignedElements) ? (o4, n2) => o4.assignedElements(n2) : (o4, n2) => o4.assignedNodes(n2).filter((o5) => o5.nodeType === Node.ELEMENT_NODE);
const t = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 }, e$3 = (t2) => (...e2) => ({ _$litDirective$: t2, values: e2 });
class i {
  constructor(t2) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t2, e2, i2) {
    this._$Ct = t2, this._$AM = e2, this._$Ci = i2;
  }
  _$AS(t2, e2) {
    return this.update(t2, e2);
  }
  update(t2, e2) {
    return this.render(...e2);
  }
}
const { I: l$2 } = j, e$2 = (o4) => void 0 === o4.strings, r$1 = () => document.createComment(""), c$2 = (o4, i2, n2) => {
  var t2;
  const v2 = o4._$AA.parentNode, d2 = void 0 === i2 ? o4._$AB : i2._$AA;
  if (void 0 === n2) {
    const i3 = v2.insertBefore(r$1(), d2), t3 = v2.insertBefore(r$1(), d2);
    n2 = new l$2(i3, t3, o4, o4.options);
  } else {
    const l2 = n2._$AB.nextSibling, i3 = n2._$AM, u3 = i3 !== o4;
    if (u3) {
      let l3;
      null === (t2 = n2._$AQ) || void 0 === t2 || t2.call(n2, o4), n2._$AM = o4, void 0 !== n2._$AP && (l3 = o4._$AU) !== i3._$AU && n2._$AP(l3);
    }
    if (l2 !== d2 || u3) {
      let o5 = n2._$AA;
      for (; o5 !== l2; ) {
        const l3 = o5.nextSibling;
        v2.insertBefore(o5, d2), o5 = l3;
      }
    }
  }
  return n2;
}, f = (o4, l2, i2 = o4) => (o4._$AI(l2, i2), o4), s$1 = {}, a = (o4, l2 = s$1) => o4._$AH = l2, m = (o4) => o4._$AH, p = (o4) => {
  var l2;
  null === (l2 = o4._$AP) || void 0 === l2 || l2.call(o4, false, true);
  let i2 = o4._$AA;
  const n2 = o4._$AB.nextSibling;
  for (; i2 !== n2; ) {
    const o5 = i2.nextSibling;
    i2.remove(), i2 = o5;
  }
};
const u2 = (e2, s3, t2) => {
  const r2 = /* @__PURE__ */ new Map();
  for (let l2 = s3; l2 <= t2; l2++)
    r2.set(e2[l2], l2);
  return r2;
}, c$1 = e$3(class extends i {
  constructor(e2) {
    if (super(e2), e2.type !== t.CHILD)
      throw Error("repeat() can only be used in text expressions");
  }
  ct(e2, s3, t2) {
    let r2;
    void 0 === t2 ? t2 = s3 : void 0 !== s3 && (r2 = s3);
    const l2 = [], o4 = [];
    let i2 = 0;
    for (const s4 of e2)
      l2[i2] = r2 ? r2(s4, i2) : i2, o4[i2] = t2(s4, i2), i2++;
    return { values: o4, keys: l2 };
  }
  render(e2, s3, t2) {
    return this.ct(e2, s3, t2).values;
  }
  update(s3, [t2, r2, c2]) {
    var d2;
    const a$12 = m(s3), { values: p$12, keys: v2 } = this.ct(t2, r2, c2);
    if (!Array.isArray(a$12))
      return this.ut = v2, p$12;
    const h2 = null !== (d2 = this.ut) && void 0 !== d2 ? d2 : this.ut = [], m$12 = [];
    let y2, x2, j2 = 0, k2 = a$12.length - 1, w2 = 0, A2 = p$12.length - 1;
    for (; j2 <= k2 && w2 <= A2; )
      if (null === a$12[j2])
        j2++;
      else if (null === a$12[k2])
        k2--;
      else if (h2[j2] === v2[w2])
        m$12[w2] = f(a$12[j2], p$12[w2]), j2++, w2++;
      else if (h2[k2] === v2[A2])
        m$12[A2] = f(a$12[k2], p$12[A2]), k2--, A2--;
      else if (h2[j2] === v2[A2])
        m$12[A2] = f(a$12[j2], p$12[A2]), c$2(s3, m$12[A2 + 1], a$12[j2]), j2++, A2--;
      else if (h2[k2] === v2[w2])
        m$12[w2] = f(a$12[k2], p$12[w2]), c$2(s3, a$12[j2], a$12[k2]), k2--, w2++;
      else if (void 0 === y2 && (y2 = u2(v2, w2, A2), x2 = u2(h2, j2, k2)), y2.has(h2[j2]))
        if (y2.has(h2[k2])) {
          const e2 = x2.get(v2[w2]), t3 = void 0 !== e2 ? a$12[e2] : null;
          if (null === t3) {
            const e3 = c$2(s3, a$12[j2]);
            f(e3, p$12[w2]), m$12[w2] = e3;
          } else
            m$12[w2] = f(t3, p$12[w2]), c$2(s3, a$12[j2], t3), a$12[e2] = null;
          w2++;
        } else
          p(a$12[k2]), k2--;
      else
        p(a$12[j2]), j2++;
    for (; w2 <= A2; ) {
      const e2 = c$2(s3, m$12[A2 + 1]);
      f(e2, p$12[w2]), m$12[w2++] = e2;
    }
    for (; j2 <= k2; ) {
      const e2 = a$12[j2++];
      null !== e2 && p(e2);
    }
    return this.ut = v2, a(s3, m$12), T;
  }
});
const l$1 = e$3(class extends i {
  constructor(r2) {
    if (super(r2), r2.type !== t.PROPERTY && r2.type !== t.ATTRIBUTE && r2.type !== t.BOOLEAN_ATTRIBUTE)
      throw Error("The `live` directive is not allowed on child or event bindings");
    if (!e$2(r2))
      throw Error("`live` bindings can only contain a single expression");
  }
  render(r2) {
    return r2;
  }
  update(i2, [t$12]) {
    if (t$12 === T || t$12 === A)
      return t$12;
    const o4 = i2.element, l2 = i2.name;
    if (i2.type === t.PROPERTY) {
      if (t$12 === o4[l2])
        return T;
    } else if (i2.type === t.BOOLEAN_ATTRIBUTE) {
      if (!!t$12 === o4.hasAttribute(l2))
        return T;
    } else if (i2.type === t.ATTRIBUTE && o4.getAttribute(l2) === t$12 + "")
      return T;
    return a(i2), t$12;
  }
});
const s2 = (i2, t2) => {
  var e2, o4;
  const r2 = i2._$AN;
  if (void 0 === r2)
    return false;
  for (const i3 of r2)
    null === (o4 = (e2 = i3)._$AO) || void 0 === o4 || o4.call(e2, t2, false), s2(i3, t2);
  return true;
}, o$4 = (i2) => {
  let t2, e2;
  do {
    if (void 0 === (t2 = i2._$AM))
      break;
    e2 = t2._$AN, e2.delete(i2), i2 = t2;
  } while (0 === (null == e2 ? void 0 : e2.size));
}, r = (i2) => {
  for (let t2; t2 = i2._$AM; i2 = t2) {
    let e2 = t2._$AN;
    if (void 0 === e2)
      t2._$AN = e2 = /* @__PURE__ */ new Set();
    else if (e2.has(i2))
      break;
    e2.add(i2), l(t2);
  }
};
function n$1(i2) {
  void 0 !== this._$AN ? (o$4(this), this._$AM = i2, r(this)) : this._$AM = i2;
}
function h$1(i2, t2 = false, e2 = 0) {
  const r2 = this._$AH, n2 = this._$AN;
  if (void 0 !== n2 && 0 !== n2.size)
    if (t2)
      if (Array.isArray(r2))
        for (let i3 = e2; i3 < r2.length; i3++)
          s2(r2[i3], false), o$4(r2[i3]);
      else
        null != r2 && (s2(r2, false), o$4(r2));
    else
      s2(this, i2);
}
const l = (i2) => {
  var t$12, s3, o4, r2;
  i2.type == t.CHILD && (null !== (t$12 = (o4 = i2)._$AP) && void 0 !== t$12 || (o4._$AP = h$1), null !== (s3 = (r2 = i2)._$AQ) && void 0 !== s3 || (r2._$AQ = n$1));
};
class c extends i {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(i2, t2, e2) {
    super._$AT(i2, t2, e2), r(this), this.isConnected = i2._$AU;
  }
  _$AO(i2, t2 = true) {
    var e2, r2;
    i2 !== this.isConnected && (this.isConnected = i2, i2 ? null === (e2 = this.reconnected) || void 0 === e2 || e2.call(this) : null === (r2 = this.disconnected) || void 0 === r2 || r2.call(this)), t2 && (s2(this, i2), o$4(this));
  }
  setValue(t2) {
    if (e$2(this._$Ct))
      this._$Ct._$AI(t2, this);
    else {
      const i2 = [...this._$Ct._$AH];
      i2[this._$Ci] = t2, this._$Ct._$AI(i2, this, 0);
    }
  }
  disconnected() {
  }
  reconnected() {
  }
}
const e$1 = () => new o$3();
let o$3 = class o2 {
};
const h = /* @__PURE__ */ new WeakMap(), n = e$3(class extends c {
  render(t2) {
    return A;
  }
  update(t2, [s3]) {
    var e2;
    const o4 = s3 !== this.G;
    return o4 && void 0 !== this.G && this.ot(void 0), (o4 || this.rt !== this.lt) && (this.G = s3, this.dt = null === (e2 = t2.options) || void 0 === e2 ? void 0 : e2.host, this.ot(this.lt = t2.element)), A;
  }
  ot(i2) {
    var t2;
    if ("function" == typeof this.G) {
      const s3 = null !== (t2 = this.dt) && void 0 !== t2 ? t2 : globalThis;
      let e2 = h.get(s3);
      void 0 === e2 && (e2 = /* @__PURE__ */ new WeakMap(), h.set(s3, e2)), void 0 !== e2.get(this.G) && this.G.call(this.dt, void 0), e2.set(this.G, i2), void 0 !== i2 && this.G.call(this.dt, i2);
    } else
      this.G.value = i2;
  }
  get rt() {
    var i2, t2, s3;
    return "function" == typeof this.G ? null === (t2 = h.get(null !== (i2 = this.dt) && void 0 !== i2 ? i2 : globalThis)) || void 0 === t2 ? void 0 : t2.get(this.G) : null === (s3 = this.G) || void 0 === s3 ? void 0 : s3.value;
  }
  disconnected() {
    this.rt === this.lt && this.ot(void 0);
  }
  reconnected() {
    this.ot(this.lt);
  }
});
const o$2 = e$3(class extends i {
  constructor(t$12) {
    var i2;
    if (super(t$12), t$12.type !== t.ATTRIBUTE || "class" !== t$12.name || (null === (i2 = t$12.strings) || void 0 === i2 ? void 0 : i2.length) > 2)
      throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
  }
  render(t2) {
    return " " + Object.keys(t2).filter((i2) => t2[i2]).join(" ") + " ";
  }
  update(i2, [s3]) {
    var r2, o4;
    if (void 0 === this.it) {
      this.it = /* @__PURE__ */ new Set(), void 0 !== i2.strings && (this.nt = new Set(i2.strings.join(" ").split(/\s/).filter((t2) => "" !== t2)));
      for (const t2 in s3)
        s3[t2] && !(null === (r2 = this.nt) || void 0 === r2 ? void 0 : r2.has(t2)) && this.it.add(t2);
      return this.render(s3);
    }
    const e2 = i2.element.classList;
    this.it.forEach((t2) => {
      t2 in s3 || (e2.remove(t2), this.it.delete(t2));
    });
    for (const t2 in s3) {
      const i3 = !!s3[t2];
      i3 === this.it.has(t2) || (null === (o4 = this.nt) || void 0 === o4 ? void 0 : o4.has(t2)) || (i3 ? (e2.add(t2), this.it.add(t2)) : (e2.remove(t2), this.it.delete(t2)));
    }
    return T;
  }
});
var __decorate$3 = function(decorators, target, key, desc) {
  var c2 = arguments.length, r2 = c2 < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d2;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r2 = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i2 = decorators.length - 1; i2 >= 0; i2--)
      if (d2 = decorators[i2])
        r2 = (c2 < 3 ? d2(r2) : c2 > 3 ? d2(target, key, r2) : d2(target, key)) || r2;
  return c2 > 3 && r2 && Object.defineProperty(target, key, r2), r2;
};
let NinjaHeader = class NinjaHeader2 extends s$2 {
  constructor() {
    super(...arguments);
    this.placeholder = "";
    this.hideBreadcrumbs = false;
    this.breadcrumbHome = "Home";
    this.breadcrumbs = [];
    this._inputRef = e$1();
  }
  render() {
    let breadcrumbs = "";
    if (!this.hideBreadcrumbs) {
      const itemTemplates = [];
      for (const breadcrumb of this.breadcrumbs) {
        itemTemplates.push(x`<button tabindex="-1" @click="${() => this.selectParent(breadcrumb)}" class="breadcrumb">${breadcrumb}</button>`);
      }
      breadcrumbs = x`<div class="breadcrumb-list"><button tabindex="-1" @click="${() => this.selectParent()}" class="breadcrumb">${this.breadcrumbHome}</button> ${itemTemplates}</div>`;
    }
    return x`${breadcrumbs}<div part="ninja-input-wrapper" class="search-wrapper"><input part="ninja-input" type="text" id="search" spellcheck="false" autocomplete="off" @input="${this._handleInput}" ${n(this._inputRef)} placeholder="${this.placeholder}" class="search"></div>`;
  }
  setSearch(value) {
    if (this._inputRef.value) {
      this._inputRef.value.value = value;
    }
  }
  focusSearch() {
    requestAnimationFrame(() => this._inputRef.value.focus());
  }
  _handleInput(event) {
    const input = event.target;
    this.dispatchEvent(new CustomEvent("change", {
      detail: { search: input.value },
      bubbles: false,
      composed: false
    }));
  }
  selectParent(breadcrumb) {
    this.dispatchEvent(new CustomEvent("setParent", {
      detail: { parent: breadcrumb },
      bubbles: true,
      composed: true
    }));
  }
  firstUpdated() {
    this.focusSearch();
  }
  _close() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }
};
NinjaHeader.styles = i$3`:host{flex:1;position:relative}.search{padding:1.25em;flex-grow:1;flex-shrink:0;margin:0;border:none;appearance:none;font-size:1.125em;background:0 0;caret-color:var(--ninja-accent-color);color:var(--ninja-text-color);outline:0;font-family:var(--ninja-font-family)}.search::placeholder{color:var(--ninja-placeholder-color)}.breadcrumb-list{padding:1em 4em 0 1em;display:flex;flex-direction:row;align-items:stretch;justify-content:flex-start;flex:initial}.breadcrumb{background:var(--ninja-secondary-background-color);text-align:center;line-height:1.2em;border-radius:var(--ninja-key-border-radius);border:0;cursor:pointer;padding:.1em .5em;color:var(--ninja-secondary-text-color);margin-right:.5em;outline:0;font-family:var(--ninja-font-family)}.search-wrapper{display:flex;border-bottom:var(--ninja-separate-border)}`;
__decorate$3([
  n$3()
], NinjaHeader.prototype, "placeholder", void 0);
__decorate$3([
  n$3({ type: Boolean })
], NinjaHeader.prototype, "hideBreadcrumbs", void 0);
__decorate$3([
  n$3()
], NinjaHeader.prototype, "breadcrumbHome", void 0);
__decorate$3([
  n$3({ type: Array })
], NinjaHeader.prototype, "breadcrumbs", void 0);
NinjaHeader = __decorate$3([
  e$5("ninja-header")
], NinjaHeader);
class e extends i {
  constructor(i2) {
    if (super(i2), this.et = A, i2.type !== t.CHILD)
      throw Error(this.constructor.directiveName + "() can only be used in child bindings");
  }
  render(r2) {
    if (r2 === A || null == r2)
      return this.ft = void 0, this.et = r2;
    if (r2 === T)
      return r2;
    if ("string" != typeof r2)
      throw Error(this.constructor.directiveName + "() called with a non-string value");
    if (r2 === this.et)
      return this.ft;
    this.et = r2;
    const s3 = [r2];
    return s3.raw = s3, this.ft = { _$litType$: this.constructor.resultType, strings: s3, values: [] };
  }
}
e.directiveName = "unsafeHTML", e.resultType = 1;
const o$1 = e$3(e);
function* o3(o4, t2) {
  const f2 = "function" == typeof t2;
  if (void 0 !== o4) {
    let i2 = -1;
    for (const n2 of o4)
      i2 > -1 && (yield f2 ? t2(i2) : t2), i2++, yield n2;
  }
}
function __decorate$2(decorators, target, key, desc) {
  var c2 = arguments.length, r2 = c2 < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d2;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r2 = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i2 = decorators.length - 1; i2 >= 0; i2--)
      if (d2 = decorators[i2])
        r2 = (c2 < 3 ? d2(r2) : c2 > 3 ? d2(target, key, r2) : d2(target, key)) || r2;
  return c2 > 3 && r2 && Object.defineProperty(target, key, r2), r2;
}
typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e2 = new Error(message);
  return e2.name = "SuppressedError", e2.error = error, e2.suppressed = suppressed, e2;
};
const styles = i$3`:host{font-family:var(--mdc-icon-font, "Material Icons");font-weight:400;font-style:normal;font-size:var(--mdc-icon-size,24px);line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale;font-feature-settings:"liga"}`;
let Icon = class Icon2 extends s$2 {
  /** @soyTemplate */
  render() {
    return x`<span><slot></slot></span>`;
  }
};
Icon.styles = [styles];
Icon = __decorate$2([
  e$5("mwc-icon")
], Icon);
var __decorate$1 = function(decorators, target, key, desc) {
  var c2 = arguments.length, r2 = c2 < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d2;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r2 = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i2 = decorators.length - 1; i2 >= 0; i2--)
      if (d2 = decorators[i2])
        r2 = (c2 < 3 ? d2(r2) : c2 > 3 ? d2(target, key, r2) : d2(target, key)) || r2;
  return c2 > 3 && r2 && Object.defineProperty(target, key, r2), r2;
};
let NinjaAction = class NinjaAction2 extends s$2 {
  constructor() {
    super();
    this.selected = false;
    this.hotKeysJoinedView = true;
    this.addEventListener("click", this.click);
  }
  /**
   * Scroll to show element
   */
  ensureInView() {
    requestAnimationFrame(() => this.scrollIntoView({ block: "nearest" }));
  }
  click() {
    this.dispatchEvent(new CustomEvent("actionsSelected", {
      detail: this.action,
      bubbles: true,
      composed: true
    }));
  }
  updated(changedProperties) {
    if (changedProperties.has("selected")) {
      if (this.selected) {
        this.ensureInView();
      }
    }
  }
  render() {
    let icon;
    if (this.action.mdIcon) {
      icon = x`<mwc-icon part="ninja-icon" class="ninja-icon">${this.action.mdIcon}</mwc-icon>`;
    } else if (this.action.icon) {
      icon = o$1(this.action.icon || "");
    }
    let hotkey;
    if (this.action.hotkey) {
      if (this.hotKeysJoinedView) {
        hotkey = this.action.hotkey.split(",").map((hotkeys2) => {
          const keys = hotkeys2.split("+");
          const joinedKeys = x`${o3(keys.map((key) => x`<kbd>${key}</kbd>`), "+")}`;
          return x`<div class="ninja-hotkey ninja-hotkeys">${joinedKeys}</div>`;
        });
      } else {
        hotkey = this.action.hotkey.split(",").map((hotkeys2) => {
          const keys = hotkeys2.split("+");
          const keyElements = keys.map((key) => x`<kbd class="ninja-hotkey">${key}</kbd>`);
          return x`<kbd class="ninja-hotkeys">${keyElements}</kbd>`;
        });
      }
    }
    const classes = {
      selected: this.selected,
      "ninja-action": true
    };
    return x`<div class="ninja-action" part="ninja-action ${this.selected ? "ninja-selected" : ""}" class="${o$2(classes)}">${icon}<div class="ninja-title">${this.action.title}</div>${hotkey}</div>`;
  }
};
NinjaAction.styles = i$3`:host{display:flex;width:100%}.ninja-action{padding:.75em 1em;display:flex;border-left:2px solid transparent;align-items:center;justify-content:start;outline:0;transition:color 0s ease 0s;width:100%}.ninja-action.selected{cursor:pointer;color:var(--ninja-selected-text-color);background-color:var(--ninja-selected-background);border-left:2px solid var(--ninja-accent-color);outline:0}.ninja-action.selected .ninja-icon{color:var(--ninja-selected-text-color)}.ninja-icon{font-size:var(--ninja-icon-size);max-width:var(--ninja-icon-size);max-height:var(--ninja-icon-size);margin-right:1em;color:var(--ninja-icon-color);margin-right:1em;position:relative}.ninja-title{flex-shrink:.01;margin-right:.5em;flex-grow:1;font-size:.8125em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ninja-hotkeys{flex-shrink:0;width:min-content;display:flex}.ninja-hotkeys kbd{font-family:inherit}.ninja-hotkey{background:var(--ninja-secondary-background-color);padding:.06em .25em;border-radius:var(--ninja-key-border-radius);text-transform:capitalize;color:var(--ninja-secondary-text-color);font-size:.75em;font-family:inherit}.ninja-hotkey+.ninja-hotkey{margin-left:.5em}.ninja-hotkeys+.ninja-hotkeys{margin-left:1em}`;
__decorate$1([
  n$3({ type: Object })
], NinjaAction.prototype, "action", void 0);
__decorate$1([
  n$3({ type: Boolean })
], NinjaAction.prototype, "selected", void 0);
__decorate$1([
  n$3({ type: Boolean })
], NinjaAction.prototype, "hotKeysJoinedView", void 0);
NinjaAction = __decorate$1([
  e$5("ninja-action")
], NinjaAction);
const footerHtml = x`<div class="modal-footer" slot="footer"><span class="help"><svg version="1.0" class="ninja-examplekey" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1280"><path d="M1013 376c0 73.4-.4 113.3-1.1 120.2a159.9 159.9 0 0 1-90.2 127.3c-20 9.6-36.7 14-59.2 15.5-7.1.5-121.9.9-255 1h-242l95.5-95.5 95.5-95.5-38.3-38.2-38.2-38.3-160 160c-88 88-160 160.4-160 161 0 .6 72 73 160 161l160 160 38.2-38.3 38.3-38.2-95.5-95.5-95.5-95.5h251.1c252.9 0 259.8-.1 281.4-3.6 72.1-11.8 136.9-54.1 178.5-116.4 8.6-12.9 22.6-40.5 28-55.4 4.4-12 10.7-36.1 13.1-50.6 1.6-9.6 1.8-21 2.1-132.8l.4-122.2H1013v110z"/></svg> to select </span><span class="help"><svg xmlns="http://www.w3.org/2000/svg" class="ninja-examplekey" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg> <svg xmlns="http://www.w3.org/2000/svg" class="ninja-examplekey" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg> to navigate </span><span class="help"><span class="ninja-examplekey esc">esc</span> to close </span><span class="help"><svg xmlns="http://www.w3.org/2000/svg" class="ninja-examplekey backspace" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6.707 4.879A3 3 0 018.828 4H15a3 3 0 013 3v6a3 3 0 01-3 3H8.828a3 3 0 01-2.12-.879l-4.415-4.414a1 1 0 010-1.414l4.414-4.414zm4 2.414a1 1 0 00-1.414 1.414L10.586 10l-1.293 1.293a1 1 0 101.414 1.414L12 11.414l1.293 1.293a1 1 0 001.414-1.414L13.414 10l1.293-1.293a1 1 0 00-1.414-1.414L12 8.586l-1.293-1.293z" clip-rule="evenodd"/></svg> move to parent</span></div>`;
const baseStyles = i$3`:host{--ninja-width:640px;--ninja-backdrop-filter:none;--ninja-overflow-background:rgba(255, 255, 255, 0.5);--ninja-text-color:rgb(60, 65, 73);--ninja-font-size:16px;--ninja-top:20%;--ninja-key-border-radius:0.25em;--ninja-accent-color:rgb(110, 94, 210);--ninja-secondary-background-color:rgb(239, 241, 244);--ninja-secondary-text-color:rgb(107, 111, 118);--ninja-selected-background:rgb(248, 249, 251);--ninja-icon-color:var(--ninja-secondary-text-color);--ninja-icon-size:1.2em;--ninja-separate-border:1px solid var(--ninja-secondary-background-color);--ninja-modal-background:#fff;--ninja-modal-shadow:rgb(0 0 0 / 50%) 0px 16px 70px;--ninja-actions-height:300px;--ninja-group-text-color:rgb(144, 149, 157);--ninja-footer-background:rgba(242, 242, 242, 0.4);--ninja-placeholder-color:#8e8e8e;font-size:var(--ninja-font-size);--ninja-z-index:1}:host(.dark){--ninja-backdrop-filter:none;--ninja-overflow-background:rgba(0, 0, 0, 0.7);--ninja-text-color:#7d7d7d;--ninja-modal-background:rgba(17, 17, 17, 0.85);--ninja-accent-color:rgb(110, 94, 210);--ninja-secondary-background-color:rgba(51, 51, 51, 0.44);--ninja-secondary-text-color:#888;--ninja-selected-text-color:#eaeaea;--ninja-selected-background:rgba(51, 51, 51, 0.44);--ninja-icon-color:var(--ninja-secondary-text-color);--ninja-separate-border:1px solid var(--ninja-secondary-background-color);--ninja-modal-shadow:0 16px 70px rgba(0, 0, 0, 0.2);--ninja-group-text-color:rgb(144, 149, 157);--ninja-footer-background:rgba(30, 30, 30, 85%)}.modal{display:none;position:fixed;z-index:var(--ninja-z-index);left:0;top:0;width:100%;height:100%;overflow:auto;background:var(--ninja-overflow-background);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-backdrop-filter:var(--ninja-backdrop-filter);backdrop-filter:var(--ninja-backdrop-filter);text-align:left;color:var(--ninja-text-color);font-family:var(--ninja-font-family)}.modal.visible{display:block}.modal-content{position:relative;top:var(--ninja-top);margin:auto;padding:0;display:flex;flex-direction:column;flex-shrink:1;-webkit-box-flex:1;flex-grow:1;min-width:0;will-change:transform;background:var(--ninja-modal-background);border-radius:.5em;box-shadow:var(--ninja-modal-shadow);max-width:var(--ninja-width);overflow:hidden}.bump{animation:zoom-in-zoom-out .2s ease}@keyframes zoom-in-zoom-out{0%{transform:scale(.99)}50%{transform:scale(1.01,1.01)}100%{transform:scale(1,1)}}.ninja-github{color:var(--ninja-keys-text-color);font-weight:400;text-decoration:none}.actions-list{max-height:var(--ninja-actions-height);overflow:auto;scroll-behavior:smooth;position:relative;margin:0;padding:.5em 0;list-style:none;scroll-behavior:smooth}.group-header{height:1.375em;line-height:1.375em;padding-left:1.25em;padding-top:.5em;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;font-size:.75em;line-height:1em;color:var(--ninja-group-text-color);margin:1px 0}.modal-footer{background:var(--ninja-footer-background);padding:.5em 1em;display:flex;border-top:var(--ninja-separate-border);color:var(--ninja-secondary-text-color)}.modal-footer .help{display:flex;margin-right:1em;align-items:center;font-size:.75em}.ninja-examplekey{background:var(--ninja-secondary-background-color);padding:.06em .25em;border-radius:var(--ninja-key-border-radius);color:var(--ninja-secondary-text-color);width:1em;height:1em;margin-right:.5em;font-size:1.25em;fill:currentColor}.ninja-examplekey.esc{width:auto;height:auto;font-size:1.1em}.ninja-examplekey.backspace{opacity:.7}`;
var __decorate = function(decorators, target, key, desc) {
  var c2 = arguments.length, r2 = c2 < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d2;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r2 = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i2 = decorators.length - 1; i2 >= 0; i2--)
      if (d2 = decorators[i2])
        r2 = (c2 < 3 ? d2(r2) : c2 > 3 ? d2(target, key, r2) : d2(target, key)) || r2;
  return c2 > 3 && r2 && Object.defineProperty(target, key, r2), r2;
};
let NinjaKeys$2 = class NinjaKeys extends s$2 {
  constructor() {
    super(...arguments);
    this.placeholder = "Type a command or search...";
    this.disableHotkeys = false;
    this.hideBreadcrumbs = false;
    this.openHotkey = "cmd+k,ctrl+k";
    this.navigationUpHotkey = "up,shift+tab";
    this.navigationDownHotkey = "down,tab";
    this.closeHotkey = "esc";
    this.goBackHotkey = "backspace";
    this.selectHotkey = "enter";
    this.hotKeysJoinedView = false;
    this.noAutoLoadMdIcons = false;
    this.data = [];
    this.visible = false;
    this._bump = true;
    this._actionMatches = [];
    this._search = "";
    this._flatData = [];
    this._headerRef = e$1();
  }
  /**
   * Public methods
   */
  /**
   * Show a modal
   */
  open(options = {}) {
    this._bump = true;
    this.visible = true;
    this._headerRef.value.focusSearch();
    if (this._actionMatches.length > 0) {
      this._selected = this._actionMatches[0];
    }
    this.setParent(options.parent);
  }
  /**
   * Close modal
   */
  close() {
    this._bump = false;
    this.visible = false;
  }
  /**
   * Navigate to group of actions
   * @param parent id of parent group/action
   */
  setParent(parent) {
    if (!parent) {
      this._currentRoot = void 0;
    } else {
      this._currentRoot = parent;
    }
    this._selected = void 0;
    this._search = "";
    this._headerRef.value.setSearch("");
  }
  get breadcrumbs() {
    var _a;
    const path = [];
    let parentAction = (_a = this._selected) === null || _a === void 0 ? void 0 : _a.parent;
    if (parentAction) {
      path.push(parentAction);
      while (parentAction) {
        const action = this._flatData.find((a2) => a2.id === parentAction);
        if (action === null || action === void 0 ? void 0 : action.parent) {
          path.push(action.parent);
        }
        parentAction = action ? action.parent : void 0;
      }
    }
    return path.reverse();
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.noAutoLoadMdIcons) {
      document.fonts.load("24px Material Icons", "apps").then(() => {
      });
    }
    this._registerInternalHotkeys();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unregisterInternalHotkeys();
  }
  _flattern(members, parent) {
    let children2 = [];
    if (!members) {
      members = [];
    }
    return members.map((mem) => {
      const alreadyFlatternByUser = mem.children && mem.children.some((value) => {
        return typeof value == "string";
      });
      const m2 = { ...mem, parent: mem.parent || parent };
      if (alreadyFlatternByUser) {
        return m2;
      } else {
        if (m2.children && m2.children.length) {
          parent = mem.id;
          children2 = [...children2, ...m2.children];
        }
        m2.children = m2.children ? m2.children.map((c2) => c2.id) : [];
        return m2;
      }
    }).concat(children2.length ? this._flattern(children2, parent) : children2);
  }
  update(changedProperties) {
    if (changedProperties.has("data") && !this.disableHotkeys) {
      this._flatData = this._flattern(this.data);
      this._flatData.filter((action) => !!action.hotkey).forEach((action) => {
        hotkeys(action.hotkey, (event) => {
          event.preventDefault();
          if (action.handler) {
            action.handler(action);
          }
        });
      });
    }
    super.update(changedProperties);
  }
  _registerInternalHotkeys() {
    if (this.openHotkey) {
      hotkeys(this.openHotkey, (event) => {
        event.preventDefault();
        this.visible ? this.close() : this.open();
      });
    }
    if (this.selectHotkey) {
      hotkeys(this.selectHotkey, (event) => {
        if (!this.visible) {
          return;
        }
        event.preventDefault();
        this._actionSelected(this._actionMatches[this._selectedIndex]);
      });
    }
    if (this.goBackHotkey) {
      hotkeys(this.goBackHotkey, (event) => {
        if (!this.visible) {
          return;
        }
        if (!this._search) {
          event.preventDefault();
          this._goBack();
        }
      });
    }
    if (this.navigationDownHotkey) {
      hotkeys(this.navigationDownHotkey, (event) => {
        if (!this.visible) {
          return;
        }
        event.preventDefault();
        if (this._selectedIndex >= this._actionMatches.length - 1) {
          this._selected = this._actionMatches[0];
        } else {
          this._selected = this._actionMatches[this._selectedIndex + 1];
        }
      });
    }
    if (this.navigationUpHotkey) {
      hotkeys(this.navigationUpHotkey, (event) => {
        if (!this.visible) {
          return;
        }
        event.preventDefault();
        if (this._selectedIndex === 0) {
          this._selected = this._actionMatches[this._actionMatches.length - 1];
        } else {
          this._selected = this._actionMatches[this._selectedIndex - 1];
        }
      });
    }
    if (this.closeHotkey) {
      hotkeys(this.closeHotkey, () => {
        if (!this.visible) {
          return;
        }
        this.close();
      });
    }
  }
  _unregisterInternalHotkeys() {
    if (this.openHotkey) {
      hotkeys.unbind(this.openHotkey);
    }
    if (this.selectHotkey) {
      hotkeys.unbind(this.selectHotkey);
    }
    if (this.goBackHotkey) {
      hotkeys.unbind(this.goBackHotkey);
    }
    if (this.navigationDownHotkey) {
      hotkeys.unbind(this.navigationDownHotkey);
    }
    if (this.navigationUpHotkey) {
      hotkeys.unbind(this.navigationUpHotkey);
    }
    if (this.closeHotkey) {
      hotkeys.unbind(this.closeHotkey);
    }
  }
  _actionFocused(index, $event) {
    this._selected = index;
    $event.target.ensureInView();
  }
  _onTransitionEnd() {
    this._bump = false;
  }
  _goBack() {
    const parent = this.breadcrumbs.length > 1 ? this.breadcrumbs[this.breadcrumbs.length - 2] : void 0;
    this.setParent(parent);
  }
  render() {
    const classes = {
      bump: this._bump,
      "modal-content": true
    };
    const menuClasses = {
      visible: this.visible,
      modal: true
    };
    const actionMatches = this._flatData.filter((action) => {
      var _a;
      const regex = new RegExp(this._search, "gi");
      const matcher = action.title.match(regex) || ((_a = action.keywords) === null || _a === void 0 ? void 0 : _a.match(regex));
      if (!this._currentRoot && this._search) {
        return matcher;
      }
      return action.parent === this._currentRoot && matcher;
    });
    const sections = actionMatches.reduce((entryMap, e2) => entryMap.set(e2.section, [...entryMap.get(e2.section) || [], e2]), /* @__PURE__ */ new Map());
    this._actionMatches = [...sections.values()].flat();
    if (this._actionMatches.length > 0 && this._selectedIndex === -1) {
      this._selected = this._actionMatches[0];
    }
    if (this._actionMatches.length === 0) {
      this._selected = void 0;
    }
    const actionsList = (actions) => x`${c$1(actions, (action) => action.id, (action) => {
      var _a;
      return x`<ninja-action exportparts="ninja-action,ninja-selected,ninja-icon" .selected="${l$1(action.id === ((_a = this._selected) === null || _a === void 0 ? void 0 : _a.id))}" .hotKeysJoinedView="${this.hotKeysJoinedView}" @mouseover="${(event) => this._actionFocused(action, event)}" @actionsSelected="${(event) => this._actionSelected(event.detail)}" .action="${action}"></ninja-action>`;
    })}`;
    const itemTemplates = [];
    sections.forEach((actions, section) => {
      const header = section ? x`<div class="group-header">${section}</div>` : void 0;
      itemTemplates.push(x`${header}${actionsList(actions)}`);
    });
    return x`<div @click="${this._overlayClick}" class="${o$2(menuClasses)}"><div class="${o$2(classes)}" @animationend="${this._onTransitionEnd}"><ninja-header exportparts="ninja-input,ninja-input-wrapper" ${n(this._headerRef)} .placeholder="${this.placeholder}" .hideBreadcrumbs="${this.hideBreadcrumbs}" .breadcrumbs="${this.breadcrumbs}" @change="${this._handleInput}" @setParent="${(event) => this.setParent(event.detail.parent)}" @close="${this.close}"></ninja-header><div class="modal-body"><div class="actions-list" part="actions-list">${itemTemplates}</div></div><slot name="footer">${footerHtml}</slot></div></div>`;
  }
  get _selectedIndex() {
    if (!this._selected) {
      return -1;
    }
    return this._actionMatches.indexOf(this._selected);
  }
  _actionSelected(action) {
    var _a;
    this.dispatchEvent(new CustomEvent("selected", {
      detail: { search: this._search, action },
      bubbles: true,
      composed: true
    }));
    if (!action) {
      return;
    }
    if (action.children && ((_a = action.children) === null || _a === void 0 ? void 0 : _a.length) > 0) {
      this._currentRoot = action.id;
      this._search = "";
    }
    this._headerRef.value.setSearch("");
    this._headerRef.value.focusSearch();
    if (action.handler) {
      const result = action.handler(action);
      if (!(result === null || result === void 0 ? void 0 : result.keepOpen)) {
        this.close();
      }
    }
    this._bump = true;
  }
  async _handleInput(event) {
    this._search = event.detail.search;
    await this.updateComplete;
    this.dispatchEvent(new CustomEvent("change", {
      detail: { search: this._search, actions: this._actionMatches },
      bubbles: true,
      composed: true
    }));
  }
  _overlayClick(event) {
    var _a;
    if ((_a = event.target) === null || _a === void 0 ? void 0 : _a.classList.contains("modal")) {
      this.close();
    }
  }
};
NinjaKeys$2.styles = [baseStyles];
__decorate([
  n$3({ type: String })
], NinjaKeys$2.prototype, "placeholder", void 0);
__decorate([
  n$3({ type: Boolean })
], NinjaKeys$2.prototype, "disableHotkeys", void 0);
__decorate([
  n$3({ type: Boolean })
], NinjaKeys$2.prototype, "hideBreadcrumbs", void 0);
__decorate([
  n$3()
], NinjaKeys$2.prototype, "openHotkey", void 0);
__decorate([
  n$3()
], NinjaKeys$2.prototype, "navigationUpHotkey", void 0);
__decorate([
  n$3()
], NinjaKeys$2.prototype, "navigationDownHotkey", void 0);
__decorate([
  n$3()
], NinjaKeys$2.prototype, "closeHotkey", void 0);
__decorate([
  n$3()
], NinjaKeys$2.prototype, "goBackHotkey", void 0);
__decorate([
  n$3()
], NinjaKeys$2.prototype, "selectHotkey", void 0);
__decorate([
  n$3({ type: Boolean })
], NinjaKeys$2.prototype, "hotKeysJoinedView", void 0);
__decorate([
  n$3({ type: Boolean })
], NinjaKeys$2.prototype, "noAutoLoadMdIcons", void 0);
__decorate([
  n$3({
    type: Array,
    hasChanged() {
      return true;
    }
  })
], NinjaKeys$2.prototype, "data", void 0);
__decorate([
  t$1()
], NinjaKeys$2.prototype, "visible", void 0);
__decorate([
  t$1()
], NinjaKeys$2.prototype, "_bump", void 0);
__decorate([
  t$1()
], NinjaKeys$2.prototype, "_actionMatches", void 0);
__decorate([
  t$1()
], NinjaKeys$2.prototype, "_search", void 0);
__decorate([
  t$1()
], NinjaKeys$2.prototype, "_currentRoot", void 0);
__decorate([
  t$1()
], NinjaKeys$2.prototype, "_flatData", void 0);
__decorate([
  t$1()
], NinjaKeys$2.prototype, "breadcrumbs", null);
__decorate([
  t$1()
], NinjaKeys$2.prototype, "_selected", void 0);
NinjaKeys$2 = __decorate([
  e$5("ninja-keys")
], NinjaKeys$2);
var _tmpl$$4 = /* @__PURE__ */ template(`<ninja-keys>`, true, false);
const NinjaKeys2 = (props) => {
  return (() => {
    var _el$ = _tmpl$$4();
    _el$._$owner = getOwner();
    createRenderEffect((_p$) => {
      var _v$ = props.hotkeys, _v$2 = props.placeholder, _v$3 = props.disableHotkeys, _v$4 = props.hideBreadcrumbs, _v$5 = props.openHotkey, _v$6 = props.navigationUpHotkey, _v$7 = props.navigationDownHotkey, _v$8 = props.closeHotkey, _v$9 = props.goBackHotkey, _v$10 = props.selectHotkey, _v$11 = props.hotKeysJoinedView, _v$12 = props.noAutoLoadMdIcons, _v$13 = props.isDark ? "dark" : "light";
      _v$ !== _p$.e && (_el$.data = _p$.e = _v$);
      _v$2 !== _p$.t && (_el$.placeholder = _p$.t = _v$2);
      _v$3 !== _p$.a && (_el$.disablehotkeys = _p$.a = _v$3);
      _v$4 !== _p$.o && (_el$.hidebreadcrumbs = _p$.o = _v$4);
      _v$5 !== _p$.i && (_el$.openhotkey = _p$.i = _v$5);
      _v$6 !== _p$.n && (_el$.navigationuphotkey = _p$.n = _v$6);
      _v$7 !== _p$.s && (_el$.navigationdownhotkey = _p$.s = _v$7);
      _v$8 !== _p$.h && (_el$.closehotkey = _p$.h = _v$8);
      _v$9 !== _p$.r && (_el$.gobackhotkey = _p$.r = _v$9);
      _v$10 !== _p$.d && (_el$.selecthotkey = _p$.d = _v$10);
      _v$11 !== _p$.l && (_el$.hotkeysjoinedview = _p$.l = _v$11);
      _v$12 !== _p$.u && (_el$.noautoloadmdicons = _p$.u = _v$12);
      _v$13 !== _p$.c && className(_el$, _p$.c = _v$13);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0,
      r: void 0,
      d: void 0,
      l: void 0,
      u: void 0,
      c: void 0
    });
    return _el$;
  })();
};
const NinjaKeys$1 = NinjaKeys2;
function createNinjaKeys() {
  let el;
  onMount(() => {
    el = document.querySelector("ninja-keys");
  });
  const open = (parent) => {
    el == null ? void 0 : el.open(parent ? {
      parent
    } : void 0);
  };
  const close = () => {
    el == null ? void 0 : el.close();
  };
  const setParent = (parent) => {
    el == null ? void 0 : el.setParent(parent);
  };
  return {
    open,
    close,
    setParent
  };
}
var _tmpl$$3 = /* @__PURE__ */ template(`<p>Click <code>Shift</code> + <code>Left Mouse Button</code> to split a link into <code>💾Set</code> / <code>Get</code>.`), _tmpl$2$3 = /* @__PURE__ */ template(`<p>Or <code>Shift + Drag</code> to create a <code>💾Set</code> / <code>Get</code> node.`), _tmpl$3$1 = /* @__PURE__ */ template(`<p>Split hotkey: <code>Shift</code> + <code>S</code> (only works when nodes are selected).`), _tmpl$4$1 = /* @__PURE__ */ template(`<p>Join hotkey: <code>Shift</code> + <code>J</code> (only works when nodes are selected).`), _tmpl$5$1 = /* @__PURE__ */ template(`<p>Click <code>Convert links to set/get</code> button to split all links to<code>💾Set</code> / <code>Get</code> nodes.`), _tmpl$6$1 = /* @__PURE__ */ template(`<p>Select specific nodes and click <code>Convert links to set/get</code> button to split related links into<code>💾Set</code> / <code>Get</code> nodes.`), _tmpl$7$1 = /* @__PURE__ */ template(`<p>Click <code>Convert set/get to links</code> button to join all<code>💾Set</code> / <code>Get</code> nodes into links.`), _tmpl$8$1 = /* @__PURE__ */ template(`<p>Select specific nodes and click <code>Convert set/get to links</code> button to join related <code>💾Set</code> / <code>Get</code> nodes into links.`), _tmpl$9$1 = /* @__PURE__ */ template(`<p>Select a <code>💾Set</code> node and enable tweak.`), _tmpl$10$1 = /* @__PURE__ */ template(`<p>Make sure the <code>Get</code> node is assigned to a <code>Preview Image</code> or <code>Save Image</code> node.`), _tmpl$11$1 = /* @__PURE__ */ template(`<p>Select a node and press <code>W</code> to rename all instances.`), _tmpl$12$1 = /* @__PURE__ */ template(`<p>Or you can hold <code>Shift</code> and double click <code>Left Mouse Button</code> to rename all instances.`), _tmpl$13$1 = /* @__PURE__ */ template(`<p>Convert the text input into a separate node.<br>Assign that node to a <code>💾Set</code> node and enable tweak.`), _tmpl$14$1 = /* @__PURE__ */ template(`<p>You can use your scroll wheel to increase/decrease the weight for a token or all tokens.`), _tmpl$15$1 = /* @__PURE__ */ template(`<p>Click the pin icon to cause the prompt tweak window to float.`), _tmpl$16$1 = /* @__PURE__ */ template(`<p>The position in the graph will dictate it's position in the bar.`), _tmpl$17$1 = /* @__PURE__ */ template(`<p>You can use the scroll wheel to change numerical values.`), _tmpl$18$1 = /* @__PURE__ */ template(`<p>Click the 🚦 icon in the top bar to show available groups.`), _tmpl$19$1 = /* @__PURE__ */ template(`<p>Click a group to toggle all nodes inside it.`), _tmpl$20$1 = /* @__PURE__ */ template(`<p>Press <code>Shift</code> + <code>P</code> to access command palette`), _tmpl$21$1 = /* @__PURE__ */ template(`<p>Select a <code>Get</code> node and press <code>S</code> to jump to it's setter position.`), _tmpl$22$1 = /* @__PURE__ */ template(`<p>Select a <code>💾Set</code> or <code>Get</code> node and press <code>Arrow Left</code>/<code>Arrow Right</code> to jump to it's siblings.`), _tmpl$23 = /* @__PURE__ */ template(`<p>Enable the checkbox next to the token you want to temporarily disable.`), _tmpl$24 = /* @__PURE__ */ template(`<p><code>Double Click</code> the node title to rename it.`), _tmpl$25 = /* @__PURE__ */ template(`<p>Note that this doesn't work on some special nodes.`), _tmpl$26 = /* @__PURE__ */ template(`<p>This extension overrides the default ComfyUi search allowing you to be more flexible with your search.`), _tmpl$27 = /* @__PURE__ */ template(`<p>For example <code>lo mo onl</code> will match the <code>LoraLoaderModelOnly</code> node.`), _tmpl$28 = /* @__PURE__ */ template(`<p><code>Shift</code> + <code>Double Click</code> the group title to rename it.`), _tmpl$29 = /* @__PURE__ */ template(`<p>When an error is detected, you can open the Warning panel and navigate directly to the affected node.`), _tmpl$30 = /* @__PURE__ */ template(`<p>After a node completes execution, you can view its execution time.`), _tmpl$31 = /* @__PURE__ */ template(`<p><code>Shift</code> + <code>Arrow Up</code> aligns nodes to the top.`), _tmpl$32 = /* @__PURE__ */ template(`<p><code>Shift</code> + <code>Arrow Left</code> aligns nodes to the left.`), _tmpl$33 = /* @__PURE__ */ template(`<p><code>Shift</code> + <code>Arrow Down</code> stacks the nodes with an even spacing downwards.`), _tmpl$34 = /* @__PURE__ */ template(`<p>If you select a <code>💾Set</code> or <code>Get</code> node it will show all connections.`), _tmpl$35 = /* @__PURE__ */ template(`<p>Optionally you can change settings so that it shows connections as you hover a node. <br>Either the specific link, or all.`), _tmpl$36 = /* @__PURE__ */ template(`<p>Click the top right section of the top bar to toggle it on/off.`), _tmpl$37 = /* @__PURE__ */ template(`<div class=helpPopup><div class=close>❌</div><div class=header>Get Started</div><div class=modalContent><div class=help><div class=info><div class=title></div><div class=text></div></div></div><ul class=menu>`), _tmpl$38 = /* @__PURE__ */ template(`<video class=video>`), _tmpl$39 = /* @__PURE__ */ template(`<li class=help>`);
const Help = (p2) => {
  const [helpIndex, setHelpIndex] = createSignal(0);
  const helps = [...[{
    name: `Assign Variables`,
    text: [_tmpl$$3(), _tmpl$2$3()],
    video: `https://comfyui.ma.pe/help/assign.mp4`
  }, {
    name: `Split/Join Connections`,
    text: [_tmpl$3$1(), _tmpl$4$1(), _tmpl$5$1(), _tmpl$6$1(), _tmpl$7$1(), _tmpl$8$1()],
    video: `https://comfyui.ma.pe/help/splitJoin.mp4`
  }, {
    name: `Add image to image preview window`,
    text: [_tmpl$9$1(), _tmpl$10$1()],
    video: `https://comfyui.ma.pe/help/imagePreview.mp4`
  }, {
    name: `Rename Variables`,
    text: [_tmpl$11$1(), _tmpl$12$1()],
    video: `https://comfyui.ma.pe/help/rename.mp4`
  }, {
    name: `Make prompt tweakable`,
    text: [_tmpl$13$1(), _tmpl$14$1()],
    video: `https://comfyui.ma.pe/help/prompt.mp4`
  }, {
    name: `Floating prompt tweak window`,
    text: _tmpl$15$1(),
    video: `https://comfyui.ma.pe/help/pinPromptTweak.mp4`
  }, {
    name: `Add variables to top bar`,
    text: [_tmpl$9$1(), _tmpl$16$1(), _tmpl$17$1()],
    video: `https://comfyui.ma.pe/help/tweak.mp4`
  }, {
    name: `Toggle entire groups`,
    text: [_tmpl$18$1(), _tmpl$19$1()],
    video: `https://comfyui.ma.pe/help/groupToggle.mp4`
  }, {
    name: `Access command palette`,
    text: _tmpl$20$1(),
    video: `https://comfyui.ma.pe/help/command.mp4`
  }, {
    name: `Jump to Set node`,
    text: _tmpl$21$1(),
    video: `https://comfyui.ma.pe/help/jump.mp4`
  }, {
    name: `Jump to sibling nodes`,
    text: _tmpl$22$1(),
    video: `https://comfyui.ma.pe/help/jumpSiblings.mp4`
  }, {
    name: `Temporarily disable tokens`,
    text: _tmpl$23(),
    video: `https://comfyui.ma.pe/help/tmpPrompt.mp4`
  }, {
    name: `Rename Node`,
    text: [_tmpl$24(), _tmpl$25()],
    video: `https://comfyui.ma.pe/help/renameNode.mp4`
  }, {
    name: `Fuzzy Search`,
    text: [_tmpl$26(), _tmpl$27()],
    video: `https://comfyui.ma.pe/help/fuzzySearch.mp4`
  }, {
    name: `Rename Group`,
    text: _tmpl$28(),
    video: `https://comfyui.ma.pe/help/renameGroup.mp4`
  }, {
    name: `Warnings`,
    text: _tmpl$29(),
    video: `https://comfyui.ma.pe/help/warnings.mp4`
  }, {
    name: `Node runtime`,
    text: _tmpl$30(),
    video: `https://comfyui.ma.pe/help/duration.mp4`
  }, {
    name: `Organize nodes`,
    text: [_tmpl$31(), _tmpl$32(), _tmpl$33()],
    video: `https://comfyui.ma.pe/help/organize.mp4`
  }, {
    name: `Show connections`,
    text: [_tmpl$34(), _tmpl$35()],
    video: `https://comfyui.ma.pe/help/connections.mp4`
  }, {
    name: `Toggle bar on/off`,
    text: _tmpl$36(),
    video: `https://comfyui.ma.pe/help/toggle.mp4`
  }]];
  const currentHelp = () => helps[helpIndex()];
  return (() => {
    var _el$38 = _tmpl$37(), _el$39 = _el$38.firstChild, _el$40 = _el$39.nextSibling, _el$41 = _el$40.nextSibling, _el$42 = _el$41.firstChild, _el$43 = _el$42.firstChild, _el$44 = _el$43.firstChild, _el$45 = _el$44.nextSibling, _el$46 = _el$42.nextSibling;
    addEventListener(_el$39, "click", p2.close, true);
    insert(_el$42, (() => {
      var _c$ = createMemo(() => !!currentHelp().video);
      return () => _c$() ? (() => {
        var _el$47 = _tmpl$38();
        _el$47.muted = true;
        _el$47.loop = true;
        _el$47.autoplay = true;
        _el$47.controls = true;
        createRenderEffect(() => setAttribute(_el$47, "src", currentHelp().video));
        return _el$47;
      })() : null;
    })(), _el$43);
    insert(_el$44, () => currentHelp().name);
    insert(_el$45, () => currentHelp().text);
    insert(_el$46, () => helps.map((help, i2) => (() => {
      var _el$48 = _tmpl$39();
      _el$48.$$click = () => {
        setHelpIndex(i2);
      };
      insert(_el$48, () => help.name);
      createRenderEffect(() => _el$48.classList.toggle("active", !!(i2 === helpIndex())));
      return _el$48;
    })()));
    return _el$38;
  })();
};
delegateEvents(["click"]);
const getWidgetType = (node, slot = 0) => {
  var _a;
  if (!node) {
    return void 0;
  }
  return (_a = node.inputs) == null ? void 0 : _a[slot].type;
};
function isElementChildOrSame(parentElement, childElement) {
  let currentElement = childElement;
  while (currentElement !== null) {
    if (currentElement === parentElement) {
      return true;
    }
    currentElement = currentElement.parentElement;
  }
  return false;
}
var _tmpl$$2 = /* @__PURE__ */ template(`<div class=mapeConfirmPrompt><div class=title></div><input type=text><div class=suggestions>`), _tmpl$2$2 = /* @__PURE__ */ template(`<div class=suggestion><small>`);
const InlinePrompt = ({
  title,
  position,
  callback,
  exit,
  fallback,
  type
}) => {
  const [suggestionIndex, setSuggestionIndex] = createSignal(-1);
  let containerEl;
  let inputEl;
  onMount(() => {
    inputEl.focus();
    inputEl.select();
  });
  const [inputValue, setInputValue] = createSignal(``);
  const [suggestions] = createSignal((() => {
    const added = /* @__PURE__ */ new Map();
    const mapped = getMapeNodes().map((n2) => {
      const value = getWidgetValue(n2, 0);
      const nodeType = getWidgetType(n2, 0);
      if (added.has(value) || nodeType === `*` || typeof value === `undefined` || typeof nodeType === `undefined`) {
        return void 0;
      }
      added.set(value, true);
      return {
        value,
        type: nodeType
      };
    }).filter(isDefined).sort((a2, b) => {
      if (a2.type === type && b.type !== type) {
        return -1;
      } else if (a2.type !== type && b.type === type) {
        return 1;
      }
      const typeComparison = a2.type.localeCompare(b.type);
      if (typeComparison !== 0) {
        return typeComparison;
      }
      return a2.value.localeCompare(b.value);
    });
    return mapped;
  })());
  const handleClick = (e2) => {
    if (isElementChildOrSame(containerEl, e2.target)) {
      return;
    }
    exit();
  };
  const handleKeypress = (e2) => {
    if (e2.key === `ArrowUp` || e2.key === `ArrowDown`) {
      e2.preventDefault();
      if (e2.key === `ArrowUp`) {
        setSuggestionIndex(suggestionIndex() - 1);
      }
      if (e2.key === `ArrowDown`) {
        setSuggestionIndex(suggestionIndex() + 1);
      }
      if (suggestionIndex() < 0) {
        setSuggestionIndex(0);
      }
      if (suggestionIndex() > suggestions().length - 1) {
        setSuggestionIndex(suggestions().length - 1);
      }
      inputEl.select();
      return;
    }
    if (e2.key === `Enter`) {
      if (suggestionIndex() !== -1) {
        setInputValue(suggestions().filter(suggestionFilter)[suggestionIndex()].value);
      }
      callback((inputValue() || fallback) ?? ``);
      return;
    }
    if (e2.key === `Escape`) {
      exit();
      return;
    }
    setSuggestionIndex(-1);
  };
  onMount(() => {
    document.body.addEventListener(`click`, handleClick);
    document.body.addEventListener(`keyup`, handleKeypress);
  });
  onCleanup(() => {
    document.body.removeEventListener(`click`, handleClick);
    document.body.removeEventListener(`keyup`, handleKeypress);
  });
  const suggestionFilter = (suggestion) => {
    if (inputValue().trim() === ``) {
      return true;
    }
    return suggestion == null ? void 0 : suggestion.value.match(new RegExp(inputValue(), `i`));
  };
  return (() => {
    var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling;
    var _ref$ = containerEl;
    typeof _ref$ === "function" ? use(_ref$, _el$) : containerEl = _el$;
    insert(_el$2, title);
    _el$3.$$keyup = (e2) => {
      if (e2.key === `Shift`) {
        return;
      }
      setInputValue(e2.currentTarget.value);
    };
    var _ref$2 = inputEl;
    typeof _ref$2 === "function" ? use(_ref$2, _el$3) : inputEl = _el$3;
    setAttribute(_el$3, "placeholder", fallback);
    insert(_el$4, () => suggestions().filter(suggestionFilter).map((suggestion, i2) => {
      if (!!type && type !== (suggestion == null ? void 0 : suggestion.type) && getSetting(`filterOutIncompatibleTypes`)) {
        return null;
      }
      return (() => {
        var _el$5 = _tmpl$2$2(), _el$6 = _el$5.firstChild;
        _el$5.$$click = () => {
          callback(suggestion == null ? void 0 : suggestion.value);
        };
        insert(_el$6, () => suggestion == null ? void 0 : suggestion.type);
        insert(_el$5, () => suggestion == null ? void 0 : suggestion.value, null);
        createRenderEffect((_p$) => {
          var _v$3 = !!(suggestionIndex() === i2), _v$4 = !!(!!type && type !== (suggestion == null ? void 0 : suggestion.type));
          _v$3 !== _p$.e && _el$5.classList.toggle("selected", _p$.e = _v$3);
          _v$4 !== _p$.t && _el$5.classList.toggle("missingType", _p$.t = _v$4);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$5;
      })();
    }));
    createRenderEffect((_p$) => {
      var _v$ = `${position.x}px`, _v$2 = `${position.y}px`;
      _v$ !== _p$.e && ((_p$.e = _v$) != null ? _el$.style.setProperty("left", _v$) : _el$.style.removeProperty("left"));
      _v$2 !== _p$.t && ((_p$.t = _v$2) != null ? _el$.style.setProperty("top", _v$2) : _el$.style.removeProperty("top"));
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    createRenderEffect(() => _el$3.value = inputValue());
    return _el$;
  })();
};
delegateEvents(["keyup", "click"]);
const focusingInput = () => {
  const focusedElement = document.activeElement;
  if (focusedElement.tagName === `INPUT` && (focusedElement.type === `text` || focusedElement.type === `number`) || focusedElement.tagName === `TEXTAREA`) {
    return true;
  }
  return false;
};
const getNodeInputLinkNode = (node) => {
  var _a, _b;
  const linkIndex = (_b = (_a = node.inputs) == null ? void 0 : _a[0]) == null ? void 0 : _b.link;
  if (!node.graph) {
    return;
  }
  if (!linkIndex) {
    return;
  }
  const link = getLinkById(linkIndex);
  if (!link) {
    return;
  }
  const refId = link.origin_id;
  const refNode = getNodeById(refId);
  return refNode;
};
const getTweakValue = (type) => {
  var _a, _b, _c, _d, _e;
  let value;
  let id;
  let pinNodeId;
  for (const node of graph._nodes) {
    if (node.type !== TYPE || getWidgetValue(node) !== type) {
      continue;
    }
    if (!node.graph) {
      continue;
    }
    const index = (_b = (_a = node.inputs) == null ? void 0 : _a[0]) == null ? void 0 : _b.link;
    if (!index) {
      continue;
    }
    const link = getLinkById(index);
    if (typeof link === `undefined`) {
      continue;
    }
    const refId = link.origin_id;
    if (typeof refId === `undefined`) {
      continue;
    }
    const refSlotIndex = link.origin_slot;
    if (typeof refSlotIndex === `undefined`) {
      continue;
    }
    const refNode = node.graph.getNodeById(refId);
    if (!refNode) {
      continue;
    }
    if (refNode.outputs[refSlotIndex] && refNode.outputs[refSlotIndex].type === `IMAGE`) {
      let images;
      for (const subNode of getNodes$1()) {
        if (!isMapeVariableNode(subNode) || getWidgetValue(subNode) !== type || isNodeSetter(subNode)) {
          continue;
        }
        const index2 = (_d = (_c = subNode.outputs) == null ? void 0 : _c[0].links) == null ? void 0 : _d[0];
        if (typeof index2 === `undefined`) {
          continue;
        }
        const linkMeta = getLinkById(index2);
        if (!linkMeta) {
          continue;
        }
        const targetId = linkMeta.target_id;
        const refNode2 = node.graph.getNodeById(targetId);
        if (!refNode2) {
          continue;
        }
        if (!((_e = refNode2.type) == null ? void 0 : _e.match(/(PreviewImage|SaveImage)/))) {
          continue;
        }
        const nodeOutput = app.nodeOutputs[refNode2.id];
        if (nodeOutput && nodeOutput.images) {
          images = jsonClone(nodeOutput.images);
        } else {
          images = refNode2.images;
        }
      }
      id = refNode.id;
      value = images;
      pinNodeId = node.id;
      return [images, id, pinNodeId];
    }
    if (typeof refNode === `undefined`) {
      continue;
    }
    if (!refNode.widgets) {
      continue;
    }
    const refWidget = refNode.widgets[refSlotIndex];
    if (typeof refWidget === `undefined`) {
      continue;
    }
    id = refNode.id;
    pinNodeId = node.id;
    value = refWidget.value;
  }
  return [value, id, pinNodeId];
};
const jumpToGroupTitle = (title) => {
  const group = getGroups().find((g2) => g2.title === title);
  if (!group) {
    return;
  }
  jumpToPosition([group.pos[0] + group.size[0] / 2, group.pos[1] + group.size[1] / 2], graph.list_of_graphcanvas[0]);
};
const jumpToGroup = (group) => {
  jumpToPosition([group.pos[0] + group.size[0] / 2, group.pos[1] + group.size[1] / 2], graph.list_of_graphcanvas[0]);
};
const jumpToNodeByType = (type) => {
  for (const node of getNodes$1()) {
    if (node.type !== TYPE || !isNodeSetter(node) || getWidgetValue(node) !== type) {
      continue;
    }
    jumpToNode(node);
  }
};
const jumpToNodeId = (id) => {
  const node = getNodeById(id);
  if (!node) {
    return;
  }
  jumpToNode(node);
};
const getLinkLookup = () => {
  const links = jsonClone(Object.values(getLinks()).filter(Boolean));
  const nodeGet = {};
  const nodeSet = {};
  for (const node of getNodes$1().filter(isMapeVariableNode)) {
    const varName = getWidgetValue(node);
    const input = node.inputs[0];
    if (input.link) {
      const link = links.find((link2) => {
        const {
          target_id: toId
        } = link2;
        return toId === node.id;
      });
      if (!link) {
        continue;
      }
      const {
        id,
        origin_id: originId,
        origin_slot: originSlot
      } = link;
      nodeSet[varName] = {
        id,
        originId,
        originSlot
      };
      continue;
    } else {
      if (!nodeGet[varName]) {
        nodeGet[varName] = [];
      }
      const link = links.find((link2) => {
        const {
          origin_id: fromId
        } = link2;
        return fromId === node.id;
      });
      if (!link) {
        continue;
      }
      const {
        id,
        target_id: targetId,
        target_slot: targetSlot
      } = link;
      nodeGet[varName].push({
        id,
        targetId,
        targetSlot
      });
    }
    continue;
  }
  return {
    nodeSet,
    nodeGet
  };
};
const calculateExecutionFlow = () => {
  var _a;
  let orderedList = [];
  const starterNodes = [];
  const pendingNodes = {};
  const visitedLinks = {};
  const remainingLinks = {};
  const linkLookup = getLinkLookup();
  const links = getLinks();
  for (const node of getNodes$1().filter((node2) => !isMapeVariableNode(node2))) {
    pendingNodes[node.id] = node;
    let inputConnectionCount = 0;
    if (node.inputs) {
      for (let j2 = 0, l2 = node.inputs.length; j2 < l2; j2++) {
        if (node.inputs[j2] && node.inputs[j2].link != null) {
          inputConnectionCount += 1;
        }
      }
    }
    if (inputConnectionCount == 0) {
      starterNodes.push(node);
    } else {
      remainingLinks[node.id] = inputConnectionCount;
    }
  }
  let finished = false;
  while (!finished) {
    if (starterNodes.length == 0) {
      finished = true;
      break;
    }
    const node = starterNodes.shift();
    orderedList.push(node);
    delete pendingNodes[node.id];
    if (!node.outputs) {
      continue;
    }
    for (let i2 = 0; i2 < node.outputs.length; i2++) {
      const output = node.outputs[i2];
      const outputLinks = (_a = output.links) == null ? void 0 : _a.flatMap((linkId) => {
        const link = links[linkId];
        const targetNode = getNodeById(link.target_id);
        if (!targetNode) {
          return linkId;
        }
        if (isMapeVariableNode(targetNode)) {
          const type = getWidgetValue(targetNode);
          const getters = linkLookup.nodeGet[type];
          if (!getters) {
            return linkId;
          }
          return linkLookup.nodeGet[type].map((l2) => l2.id);
        }
        return linkId;
      });
      if (!output || !outputLinks) {
        continue;
      }
      const notConnected = output == null || outputLinks == null || outputLinks.length == 0;
      if (notConnected) {
        continue;
      }
      for (let j2 = 0; j2 < outputLinks.length; j2++) {
        const link_id = outputLinks[j2];
        const link = links[link_id];
        if (!link) {
          continue;
        }
        const ignoreVisitedLink = visitedLinks[link.id];
        if (ignoreVisitedLink) {
          continue;
        }
        const targetNode = getNodeById(link.target_id);
        if (targetNode == null) {
          visitedLinks[link.id] = true;
          continue;
        }
        visitedLinks[link.id] = true;
        remainingLinks[targetNode.id] -= 1;
        const noMoreLinks = remainingLinks[targetNode.id] === 0;
        if (noMoreLinks) {
          starterNodes.push(targetNode);
        }
      }
    }
  }
  for (const i2 in pendingNodes) {
    orderedList.push(pendingNodes[i2]);
  }
  const length = orderedList.length;
  for (let i2 = 0; i2 < length; ++i2) {
    orderedList[i2].order = i2;
  }
  orderedList = orderedList.sort((A2, B2) => {
    const aPriority = A2.constructor.priority || A2.priority || 0;
    const bPriority = B2.constructor.priority || B2.priority || 0;
    if (aPriority === bPriority) {
      return A2.order - B2.order;
    }
    return aPriority - bPriority;
  });
  for (let i2 = 0; i2 < length; ++i2) {
    orderedList[i2].order = i2;
  }
  return orderedList;
};
const organizeWorkflow = () => {
  const selectedNodes = calculateExecutionFlow();
  let offset = 50;
  for (const node of selectedNodes) {
    node.pos = [700, offset];
    offset += 10;
  }
  const minY = Math.min(...selectedNodes.map((node) => {
    return node.pos[1];
  }));
  const perNodeY = getSetting(`nodeAlignOffsetY`);
  let totalOffset = 0;
  for (const node of selectedNodes.sort((a2, b) => {
    return a2.pos[1] - b.pos[1];
  })) {
    node.pos = [node.pos[0], minY + totalOffset];
    const sizeY = node.size[1] + perNodeY;
    totalOffset += sizeY;
  }
  organizeNode(selectedNodes, false);
  app.graph.setDirtyCanvas(true, true);
};
const parseSemver = (version) => {
  const [major, minor, patch] = version.split(`.`).map(parseFloat);
  return { major, minor, patch };
};
const needsUpdate = (localVersion, remoteVersion) => {
  const local = parseSemver(localVersion);
  const remote = parseSemver(remoteVersion);
  if (remote.major > local.major) {
    return true;
  }
  if (remote.major === local.major) {
    if (remote.minor > local.minor) {
      return true;
    }
    if (remote.minor === local.minor) {
      if (remote.patch > local.patch) {
        return true;
      }
    }
  }
  return false;
};
const style = (a2) => {
  const stylres = document.createElement(`style`);
  stylres.appendChild(document.createTextNode(a2));
  return stylres;
};
const tweakValue = (type, value) => {
  var _a, _b, _c;
  for (const node of graph._nodes) {
    if (node.type !== TYPE || getWidgetValue(node) !== type) {
      continue;
    }
    if (!node.inputs[0]) {
      continue;
    }
    const index = (_b = (_a = node.inputs) == null ? void 0 : _a[0]) == null ? void 0 : _b.link;
    if (index === null) {
      continue;
    }
    const link = getLinkById(index);
    if (typeof link === `undefined`) {
      continue;
    }
    const refId = link.origin_id;
    if (typeof refId === `undefined`) {
      continue;
    }
    const refSlotIndex = link.origin_slot;
    if (typeof refSlotIndex === `undefined`) {
      continue;
    }
    if (!node.graph) {
      continue;
    }
    const refNode = node.graph.getNodeById(refId);
    if (typeof refNode === `undefined`) {
      continue;
    }
    const refWidget = (_c = refNode.widgets) == null ? void 0 : _c[refSlotIndex];
    if (typeof refWidget === `undefined`) {
      continue;
    }
    if (refWidget.options && refWidget.options.setValue) {
      if (typeof value === `function`) {
        refWidget.options.setValue(value(refWidget.value));
      } else {
        refWidget.options.setValue(value);
      }
    } else {
      if (typeof value === `function`) {
        refWidget.value = value(refWidget.value);
      } else {
        refWidget.value = value;
      }
    }
    app.graph.setDirtyCanvas(true, true);
    notifyUpdate();
  }
};
var _tmpl$$1 = /* @__PURE__ */ template(`<div class=warningsPopup><div class=close>❌</div><div class=header>Warnings</div><div class=modalContent><div class=mapeSettings>`), _tmpl$2$1 = /* @__PURE__ */ template(`<div class=mapeSetting><label class=name><small></small></label><button>Jump to node`);
const Warnings = (p2) => {
  return (() => {
    var _el$ = _tmpl$$1(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling, _el$5 = _el$4.firstChild;
    addEventListener(_el$2, "click", p2.close, true);
    insert(_el$5, () => p2.warnings.map((warning) => {
      return (() => {
        var _el$6 = _tmpl$2$1(), _el$7 = _el$6.firstChild, _el$8 = _el$7.firstChild, _el$9 = _el$7.nextSibling;
        insert(_el$7, (() => {
          var _c$ = createMemo(() => !!isMapeVariableNode(warning.node));
          return () => {
            var _a, _b;
            return _c$() ? getWidgetValue(warning.node) : `${((_a = warning.node) == null ? void 0 : _a.title) ?? ((_b = warning.node) == null ? void 0 : _b.type)}: ${warning.type}`;
          };
        })(), _el$8);
        insert(_el$8, () => warning.text);
        _el$9.$$click = () => {
          jumpToNode(warning.node);
        };
        return _el$6;
      })();
    }));
    return _el$;
  })();
};
delegateEvents(["click"]);
var _tmpl$ = /* @__PURE__ */ template(`<div class="tweak numberWrapper"><label></label><div class=value><input type=number step=1>`), _tmpl$2 = /* @__PURE__ */ template(`<div class="tweak numberWrapper"><label></label><div class=value><input type=number step=0.1>`), _tmpl$3 = /* @__PURE__ */ template(`<div class="tweak stringContainer"><label class=interactable></label><div class=value>`), _tmpl$4 = /* @__PURE__ */ template(`<div class=moveBar><div class=moveArea><div class=name></div></div><div class=toggleFloating>📌`), _tmpl$5 = /* @__PURE__ */ template(`<textarea>`), _tmpl$6 = /* @__PURE__ */ template(`<input type=text>`), _tmpl$7 = /* @__PURE__ */ template(`<div class="tweak imageContainer"><label>`), _tmpl$8 = /* @__PURE__ */ template(`<div class=thumbnails>`), _tmpl$9 = /* @__PURE__ */ template(`<img class=fullImage>`), _tmpl$10 = /* @__PURE__ */ template(`<div class=thumb><img class=smallImage>`), _tmpl$11 = /* @__PURE__ */ template(`<div class=missing>`), _tmpl$12 = /* @__PURE__ */ template(`<div class=value>`), _tmpl$13 = /* @__PURE__ */ template(`<div class=missingImage>?`), _tmpl$14 = /* @__PURE__ */ template(`<div class=image>`), _tmpl$15 = /* @__PURE__ */ template(`<div class="tweak defaultContainer"><label>`), _tmpl$16 = /* @__PURE__ */ template(`<div class=mapeRoot><div class=mapeBar><div class=logo title=https://twitter.com/mape></div><div class=tweaks></div><div class=options><div class=groupToggle title="Toggle groups"><span>🚦</span></div><div class="warnings interact"title="Organize workflow (Hold Shift-key to skip prompt)">✨</div><div class="warnings interact">💥</div><div class="warnings interact">🩹</div><div class="imagePreview interact"title="Open separate window for image previews">🖥️<small>🎨</small></div><div class="clear interact"title="Clear favourites">❌</div><div class="settings interact"title=Settings>⚙️</div><div class="help interact"title=Help>❔</div></div></div><div class=mapeBarToggle title="Toggle bar"></div><div>`), _tmpl$17 = /* @__PURE__ */ template(`<div class=tweakHighlight>`), _tmpl$18 = /* @__PURE__ */ template(`<div class="warnings blink interact"title="Show potentially broken nodes">⚠️`), _tmpl$19 = /* @__PURE__ */ template(`<div class="warnings blink interact">🆕`), _tmpl$20 = /* @__PURE__ */ template(`<div class=groups>`), _tmpl$21 = /* @__PURE__ */ template(`<div class=group><span class=groupName>No groups in workflow`), _tmpl$22 = /* @__PURE__ */ template(`<div class=group><span class=groupName></span><input type=checkbox>`);
const MapeTweak = () => {
  const [hidden, setHidden] = createSignal(!!localStorage.mape_toggleBar);
  createEffect(() => {
    if (hidden()) {
      localStorage.mape_toggleBar = true;
    } else {
      delete localStorage.mape_toggleBar;
    }
  });
  const [imagePreviewWindows, setImagePreviewWindows] = createSignal([]);
  const [tweaks, setTweaks] = createStore({});
  const [forcedOpen, setForcedOpen] = createStore({});
  const [floatingMeta, setFloatingMeta] = createStore({});
  const updatePositionFromLocalStorage = () => {
    const maxY = window.innerHeight - 200;
    const maxX = window.innerWidth - 200;
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.match(new RegExp(TWEAK_FLOATING))) {
          const value = localStorage[key];
          const id = key.replace(TWEAK_FLOATING, ``);
          const floatMeta = JSON.parse(value);
          floatMeta.position.x = Math.min(maxX, floatMeta.position.x);
          floatMeta.position.y = Math.min(maxY, floatMeta.position.y);
          setFloatingMeta(id, floatMeta);
        }
      }
    } catch {
    }
  };
  updatePositionFromLocalStorage();
  createEffect(() => {
    for (const [key, pos] of Object.entries(floatingMeta)) {
      localStorage[`${TWEAK_FLOATING}${key}`] = JSON.stringify(pos);
    }
  });
  const [warningNodes, setWarningNodes] = createSignal([]);
  const [showHelp, setShowHelp] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);
  const [showWarnings, setShowWarnings] = createSignal(false);
  const [showUpdate, setShowUpdate] = createSignal(``);
  const [showGroups, setShowGroups] = createSignal(!!localStorage[PREFIX_GROUP]);
  createEffect(() => {
    if (showGroups()) {
      updateGroups();
      localStorage[PREFIX_GROUP] = `1`;
    } else {
      delete localStorage[PREFIX_GROUP];
    }
  });
  const [groups, setGroups] = createStore([]);
  const checkGetters = () => {
    const broken = [];
    const setters = {};
    const nodes = getNodes$1().filter(isMapeVariableNode);
    for (const node of nodes.filter(isNodeSetter)) {
      const widgetValue = getWidgetValue(node);
      if (!setters[widgetValue]) {
        setters[widgetValue] = 0;
      }
      setters[widgetValue] += 1;
      const linkedNode = getNodeInputLinkNode(node);
      if (linkedNode && isMapeVariableNode(linkedNode)) {
        const linkedWidgetValue = getWidgetValue(linkedNode);
        if (widgetValue === linkedWidgetValue) {
          broken.push({
            node,
            text: `Can't point a set to a get of itself`
          });
        }
      }
    }
    for (const node of nodes.filter(isNodeGetter)) {
      const value = getWidgetValue(node);
      if (value && typeof setters[value] === `undefined`) {
        broken.push({
          node,
          text: `Missing set node`
        });
      }
    }
    for (const node of nodes.filter(isNodeSetter)) {
      const value = getWidgetValue(node);
      if (setters[value] && setters[value] > 1) {
        broken.push({
          text: `Can't have multiple set nodes of the same name`,
          node
        });
      }
    }
    setWarningNodes([...window.mapeErrors ?? [], ...broken]);
  };
  createEffect(() => {
    if (warningNodes().length === 0) {
      setShowWarnings(false);
    }
  });
  const getCheckerInterval = setInterval(checkGetters, 1e3);
  onCleanup(() => {
    clearInterval(getCheckerInterval);
  });
  const update = () => {
    setTweaks(reconcile(Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith(PREFIX)).map(([key, type]) => {
      const name = key.replace(PREFIX, ``);
      const [value, _id, pinId] = getTweakValue(name);
      const node = getNodeById(pinId);
      if (!node) {
        return null;
      }
      const pos = (node == null ? void 0 : node.pos) ? [node == null ? void 0 : node.pos[0], node == null ? void 0 : node.pos[1]] : [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
      return [name, {
        name,
        type,
        value,
        pos
      }];
    }).filter(Boolean))));
    localStorage[localStoragePreviewImagesKey] = JSON.stringify(Object.fromEntries(Object.entries(tweaks).filter(([, tweak]) => tweak.type === `IMAGE`)));
    updateGroups();
  };
  const updateGroups = () => {
    const rawGroups = getGroups();
    setGroups(getGroups().sort(distanceSortGeneric(rawGroups, `id`, `pos`)).map((group) => {
      group.recomputeInsideNodes();
      return group;
    }).map((group) => ({
      title: group.title,
      enabled: !!group._nodes.filter((n2) => !isMapeVariableNode(n2)).find((n2) => n2.mode !== 4),
      group
    })));
  };
  onMount(update);
  onMount(async () => {
    const res = await fetch(`https://comfyui.ma.pe/VERSION?c=${Date.now()}`);
    const remoteVersion = (await res.text()).trim();
    if (needsUpdate("0.5.0", remoteVersion)) {
      setShowUpdate(`New version ${remoteVersion} is available.`);
    }
  });
  window.addEventListener(`mapeTweak`, (e2) => {
    var _a;
    update();
    if (((_a = e2.detail) == null ? void 0 : _a.message) === `rename`) {
      updatePositionFromLocalStorage();
    }
  });
  const valueWidth = (value) => {
    const px = (value ?? 0).toString().length * 6 + 35;
    return `${Math.max(55, px)}px`;
  };
  const renderType = {
    INT: (tweak) => {
      return (() => {
        var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.firstChild;
        _el$.addEventListener("wheel", (e2) => {
          const diff = e2.deltaY > 0 ? -1 : 1;
          tweakValue(tweak.name, (value) => value + diff);
        });
        _el$.$$click = (e2) => {
          if (e2.shiftKey) {
            return jumpToNodeByType(tweak.name);
          }
        };
        insert(_el$2, () => tweak.name);
        _el$4.$$input = (e2) => {
          const value = parseInt(e2.currentTarget.value, 10);
          setTweaks(tweak.name, `value`, value);
          tweakValue(tweak.name, value);
        };
        createRenderEffect(() => valueWidth(tweak.value) != null ? _el$3.style.setProperty("width", valueWidth(tweak.value)) : _el$3.style.removeProperty("width"));
        createRenderEffect(() => _el$4.value = tweak.value);
        return _el$;
      })();
    },
    FLOAT: (tweak) => {
      const fixFloat = (num) => typeof num !== `undefined` ? parseFloat(parseFloat(num.toString()).toFixed(3)) : 0;
      return (() => {
        var _el$5 = _tmpl$2(), _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling, _el$8 = _el$7.firstChild;
        _el$5.addEventListener("wheel", (e2) => {
          const diff = e2.deltaY > 0 ? -0.1 : 0.1;
          tweakValue(tweak.name, tweak.value + diff);
        });
        _el$5.$$click = (e2) => {
          if (e2.shiftKey) {
            return jumpToNodeByType(tweak.name);
          }
        };
        insert(_el$6, () => tweak.name);
        _el$8.$$input = (e2) => {
          const value = parseFloat(e2.currentTarget.value);
          setTweaks(tweak.name, `value`, value);
          tweakValue(tweak.name, value);
        };
        createRenderEffect(() => valueWidth(fixFloat(tweak.value)) != null ? _el$7.style.setProperty("width", valueWidth(fixFloat(tweak.value))) : _el$7.style.removeProperty("width"));
        createRenderEffect(() => _el$8.value = fixFloat(tweak.value));
        return _el$5;
      })();
    },
    STRING: (tweak) => {
      const [focused, setFocused] = createSignal(forcedOpen[tweak.name] ?? false);
      const onInput = (e2) => {
        const value = e2.currentTarget.value;
        setTweaks(tweak.name, `value`, value);
        tweakValue(tweak.name, value);
      };
      let textareaEl;
      onMount(() => {
        if (!textareaEl) {
          return;
        }
      });
      let resizeTimeout;
      createEffect(() => {
        if (!floatingMeta[tweak.name]) {
          return;
        }
        if (!textareaEl) {
          return;
        }
        const outputsize = () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            if (!floatingMeta[tweak.name]) {
              return;
            }
            setFloatingMeta(tweak.name, `height`, textareaEl.offsetHeight);
          }, 100);
        };
        new MutationObserver(outputsize).observe(textareaEl, {
          attributes: true,
          attributeFilter: [`style`]
        });
      });
      return (() => {
        var _el$9 = _tmpl$3(), _el$10 = _el$9.firstChild, _el$11 = _el$10.nextSibling;
        _el$10.$$click = (e2) => {
          if (e2.shiftKey) {
            return jumpToNodeByType(tweak.name);
          }
          setFocused(!focused());
        };
        insert(_el$10, () => tweak.name);
        insert(_el$11, (() => {
          var _c$ = createMemo(() => !!(focused() || !!floatingMeta[tweak.name]));
          return () => _c$() ? [(() => {
            var _el$12 = _tmpl$4(), _el$13 = _el$12.firstChild, _el$14 = _el$13.firstChild, _el$15 = _el$13.nextSibling;
            _el$13.$$mousedown = (e2) => {
              const startMouse = {
                x: e2.clientX,
                y: e2.clientY
              };
              const startPos = jsonClone(floatingMeta[tweak.name].position);
              const handleMouseMove = (e22) => {
                const current = {
                  x: e22.clientX,
                  y: e22.clientY
                };
                const delta = {
                  x: current.x - startMouse.x,
                  y: current.y - startMouse.y
                };
                setFloatingMeta(tweak.name, `position`, {
                  x: startPos.x + delta.x,
                  y: startPos.y + delta.y
                });
              };
              const handleMouseUp = () => {
                document.removeEventListener(`mousemove`, handleMouseMove);
                document.removeEventListener(`mouseup`, handleMouseUp);
              };
              document.addEventListener(`mousemove`, handleMouseMove);
              document.addEventListener(`mouseup`, handleMouseUp);
            };
            insert(_el$14, () => tweak.name);
            _el$15.$$click = () => {
              if (floatingMeta[tweak.name]) {
                setFloatingMeta(tweak.name, void 0);
                delete localStorage[`${TWEAK_FLOATING}${tweak.name}`];
                setFocused(false);
              } else {
                setFloatingMeta(tweak.name, {
                  position: {
                    x: 10,
                    y: 40
                  },
                  height: 60
                });
              }
            };
            createRenderEffect(() => setAttribute(_el$15, "title", floatingMeta[tweak.name] ? `Pin the window to top bar` : `Unpin the window`));
            return _el$12;
          })(), (() => {
            var _el$16 = _tmpl$5();
            _el$16.$$input = onInput;
            var _ref$ = textareaEl;
            typeof _ref$ === "function" ? use(_ref$, _el$16) : textareaEl = _el$16;
            createRenderEffect((_$p) => style$1(_el$16, floatingMeta[tweak.name] ? {
              height: `${floatingMeta[tweak.name].height}px`
            } : {}, _$p));
            createRenderEffect(() => _el$16.value = tweak.value);
            return _el$16;
          })(), createComponent(PromptTweaker, {
            get prompt() {
              return tweak.value;
            },
            update: (prompt2) => {
              tweakValue(tweak.name, prompt2);
            }
          })] : (() => {
            var _el$17 = _tmpl$6();
            _el$17.$$input = onInput;
            _el$17.addEventListener("focus", () => {
              setFocused(true);
            });
            createRenderEffect(() => _el$17.value = tweak.value);
            return _el$17;
          })();
        })());
        createRenderEffect((_p$) => {
          var _v$ = !!(focused() || !!floatingMeta[tweak.name]), _v$2 = !!floatingMeta[tweak.name], _v$3 = floatingMeta[tweak.name] ? {
            position: `fixed`,
            top: `${floatingMeta[tweak.name].position.y}px`,
            left: `${floatingMeta[tweak.name].position.x}px`
          } : {};
          _v$ !== _p$.e && _el$9.classList.toggle("focused", _p$.e = _v$);
          _v$2 !== _p$.t && _el$9.classList.toggle("floating", _p$.t = _v$2);
          _p$.a = style$1(_el$9, _v$3, _p$.a);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$9;
      })();
    },
    IMAGE: (tweak) => {
      const [focused, setFocused] = createSignal(false);
      const [selectedIndex, setSelectedIndex] = createSignal(0);
      createEffect(() => {
        const menuEl = document.querySelector(`.comfy-menu`);
        if (!menuEl) {
          return;
        }
        if (focused()) {
          menuEl.style.display = `none`;
        } else {
          menuEl.style.display = `block`;
        }
      });
      const cacheKey = () => `mape_tweak_image_cache_${tweak.name}`;
      createEffect(() => {
        if (tweak.value) {
          sessionStorage[cacheKey()] = JSON.stringify(tweak.value);
        }
      });
      const helpText = () => `Connect "${tweak.name}" variable to a Preview Image node or Regenerate the image`;
      const value = () => tweak.value ?? (sessionStorage[cacheKey()] ? JSON.parse(sessionStorage[cacheKey()]) : void 0);
      return (() => {
        var _el$18 = _tmpl$7(), _el$19 = _el$18.firstChild;
        _el$18.$$click = (e2) => {
          if (e2.shiftKey) {
            return jumpToNodeByType(tweak.name);
          }
          if (e2.target.tagName === `IMG` || e2.target.className === `thumbnails` || e2.target.className === `thumb`) {
            return;
          }
          setFocused(!focused());
          if (!focused()) {
            setSelectedIndex(0);
          }
        };
        insert(_el$19, () => tweak.name);
        insert(_el$18, (() => {
          var _c$2 = createMemo(() => !!focused());
          return () => _c$2() ? (() => {
            var _c$3 = createMemo(() => !!value());
            return () => _c$3() ? [(() => {
              var _el$20 = _tmpl$8();
              insert(_el$20, () => (value() ?? []).map((image, i2) => {
                return (() => {
                  var _el$22 = _tmpl$10(), _el$23 = _el$22.firstChild;
                  _el$22.$$click = () => {
                    setSelectedIndex(i2);
                  };
                  createRenderEffect(() => setAttribute(_el$23, "src", comfyImageSrc(image)));
                  return _el$22;
                })();
              }));
              return _el$20;
            })(), (() => {
              var _el$21 = _tmpl$9();
              createRenderEffect(() => {
                var _a;
                return setAttribute(_el$21, "src", comfyImageSrc((_a = value()) == null ? void 0 : _a[selectedIndex()]));
              });
              return _el$21;
            })()] : (() => {
              var _el$24 = _tmpl$11();
              insert(_el$24, helpText);
              return _el$24;
            })();
          })() : (() => {
            var _el$25 = _tmpl$12();
            insert(_el$25, (() => {
              var _c$4 = createMemo(() => !!value());
              return () => _c$4() ? `` : (() => {
                var _el$26 = _tmpl$13();
                createRenderEffect(() => setAttribute(_el$26, "title", helpText()));
                return _el$26;
              })();
            })(), null);
            insert(_el$25, () => (value() ?? []).map((image) => {
              const backgroundImage = `url("${comfyImageSrc(image)}")`;
              return (() => {
                var _el$27 = _tmpl$14();
                backgroundImage != null ? _el$27.style.setProperty("background-image", backgroundImage) : _el$27.style.removeProperty("background-image");
                return _el$27;
              })();
            }), null);
            return _el$25;
          })();
        })(), null);
        createRenderEffect((_p$) => {
          var _v$4 = !!focused(), _v$5 = !!((value() ?? []).length > 1);
          _v$4 !== _p$.e && _el$18.classList.toggle("focused", _p$.e = _v$4);
          _v$5 !== _p$.t && _el$18.classList.toggle("hasMultiple", _p$.t = _v$5);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$18;
      })();
    },
    DEFAULT: (tweak) => {
      return (() => {
        var _el$28 = _tmpl$15(), _el$29 = _el$28.firstChild;
        _el$28.$$click = (e2) => {
          if (e2.shiftKey) {
            return jumpToNodeByType(tweak.name);
          }
        };
        insert(_el$29, () => tweak.name);
        createRenderEffect(() => setAttribute(_el$28, "title", JSON.stringify(tweak, null, `  `)));
        return _el$28;
      })();
    }
  };
  const [dynamicHotkeys, setHotKeys] = createSignal([]);
  const {
    open
  } = createNinjaKeys();
  onMount(() => {
    const ninjaEl = document.querySelector(`ninja-keys`);
    if (!ninjaEl) {
      return;
    }
    ninjaEl.shadowRoot.appendChild(style(`
			* {
				will-change: unset !important;
				&::-webkit-scrollbar {
					width: 5px;
					height: 5px;
					background: linear-gradient(to right, #111, #222);
				}
				&::-webkit-scrollbar-thumb {
					background: linear-gradient(to bottom, #fff, #aaa);
					border: 1px solid #fff;
					border-radius: 10px;
				}
			}
			`));
  });
  const handleKeyPress = (e2) => {
    if (e2.key === `P` && e2.shiftKey) {
      if (focusingInput()) {
        return;
      }
      open();
      setHotKeys([...getNodes$1().filter((node) => {
        var _a, _b;
        return node.type !== `mape Variable` || node.type === `mape Variable` && ((_b = (_a = node.inputs) == null ? void 0 : _a[0]) == null ? void 0 : _b.type) !== `*`;
      }).map((node) => {
        return node.type === `mape Variable` ? {
          id: node.id,
          title: `Jump to variable: ${getWidgetValue(node) ?? node.title ?? node.type} (${node.id})`,
          mdIcon: `timeline`,
          handler: () => {
            jumpToNodeId(node.id);
          }
        } : {
          id: node.id,
          title: `Jump to node: ${node.title ?? node.type} (${node.id}) ${node.widgets_values && Array.isArray(node.widgets_values) ? ` - ${node.widgets_values.join(`, `)}` : ``}`.slice(0, 90),
          mdIcon: `circle`,
          handler: () => {
            jumpToNodeId(node.id);
          }
        };
      }), ...getGroups().map((group) => ({
        title: `Jump to group: ${group.title}`,
        mdIcon: `workspaces`,
        handler: () => {
          jumpToGroupTitle(group.title);
        }
      }))]);
    }
  };
  const bindCleanups = [];
  const [highlights, setHighlights] = createSignal({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false
  });
  const newHighlight = (i2) => Object.fromEntries(Object.keys(highlights()).map((k2, u3) => [k2, i2 === u3]));
  onMount(() => {
    document.body.addEventListener(`keydown`, handleKeyPress);
    for (const index of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      for (const direction of [`up`, `down`]) {
        const hotkeyString = `${index}+${direction}`;
        hotkeys(hotkeyString, () => {
          if (focusingInput()) {
            return;
          }
          const tweaker = allTweakers()[index - 1];
          if (!tweaker) {
            return;
          }
          const type = tweaker.type;
          if (type === `INT`) {
            const diff = direction === `up` ? 1 : -1;
            tweakValue(tweaker.name, tweaker.value + diff);
          }
          if (type === `FLOAT`) {
            const diff = direction === `up` ? 0.1 : -0.1;
            tweakValue(tweaker.name, tweaker.value + diff);
          }
        });
        bindCleanups.push(() => {
          hotkeys.unbind(hotkeyString);
        });
      }
    }
  });
  const handleKeypressHighlight = (e2) => {
    if (focusingInput()) {
      return;
    }
    const index = e2.key.match(/^\d+$/);
    if (index) {
      const tweaker = allTweakers()[parseInt(index[0], 10) - 1];
      if (!tweaker) {
        return;
      }
      if (tweaker.type === `STRING`) {
        setForcedOpen(tweaker.name, !forcedOpen[tweaker.name]);
      } else {
        setHighlights(newHighlight(parseFloat(e2.key) - 1));
      }
    }
  };
  const handleKeyupHighlight = (e2) => {
    if (e2.key.match(/^\d+$/)) {
      setHighlights(newHighlight(-1));
    }
  };
  document.body.addEventListener(`keypress`, handleKeypressHighlight);
  document.body.addEventListener(`keyup`, handleKeyupHighlight);
  onCleanup(() => {
    document.body.addEventListener(`keydown`, handleKeyPress);
    for (const cb of bindCleanups)
      cb();
    document.body.removeEventListener(`keypress`, handleKeypressHighlight);
    document.body.removeEventListener(`keyup`, handleKeyupHighlight);
  });
  const [prompts, setPrompts] = createSignal([]);
  window.setPrompt = (title, position, callback, fallback, type) => {
    const id = Math.random();
    const remove = () => {
      setPrompts(prompts().filter((p2) => p2.id !== id));
    };
    setPrompts([...prompts(), {
      callback: (value) => {
        callback(value);
        remove();
        setTimeout(() => {
          app.graph.setDirtyCanvas(true, true);
        });
        return true;
      },
      exit: () => {
        remove();
      },
      position: {
        x: position[0],
        y: position[1]
      },
      title,
      id,
      fallback,
      type
    }]);
  };
  const highlightActive = createMemo(() => {
    return Object.values(highlights()).filter(Boolean).length > 0;
  });
  const allTweakers = createMemo(() => Object.values(tweaks).sort(distanceSort(tweaks)));
  const openImageWindow = () => {
    const newWindow = window.open(``, `_blank`, `width=1280,height=720,location=no,toolbar=no,menubar=no`);
    newWindow.document.write(`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<title>mape's Helpers - Image Preview</title>
			</head>
			<body>
				<script>
					window.standaloneImagePreview = true;
					import('${`/extensions/ComfyUI-mape-Helpers/tweak/mape-helpers.js`}');
				<\/script>
			</body>
		</html>
		`);
    if (newWindow) {
      let first = true;
      newWindow.addEventListener(`unload`, () => {
        if (first) {
          first = false;
          return;
        }
        setImagePreviewWindows([...imagePreviewWindows().filter((w2) => w2 !== newWindow)]);
      });
      setImagePreviewWindows([...imagePreviewWindows(), newWindow]);
    } else {
      console.error(`Failed to open a new window.`);
    }
  };
  window.showWarnings = (enabled = true) => {
    setShowWarnings(enabled);
  };
  return (() => {
    var _el$30 = _tmpl$16(), _el$31 = _el$30.firstChild, _el$32 = _el$31.firstChild, _el$33 = _el$32.nextSibling, _el$34 = _el$33.nextSibling, _el$35 = _el$34.firstChild, _el$36 = _el$35.firstChild, _el$37 = _el$35.nextSibling, _el$38 = _el$37.nextSibling, _el$39 = _el$38.nextSibling, _el$40 = _el$39.nextSibling, _el$41 = _el$40.nextSibling, _el$42 = _el$41.nextSibling, _el$43 = _el$42.nextSibling, _el$44 = _el$31.nextSibling, _el$45 = _el$44.nextSibling;
    _el$32.$$click = update;
    insert(_el$33, createComponent(For, {
      get each() {
        return allTweakers();
      },
      children: (tweak, i2) => (() => {
        var _el$46 = _tmpl$17();
        insert(_el$46, (() => {
          var _c$11 = createMemo(() => !!(renderType[tweak.type] && typeof tweak.value !== `undefined`));
          return () => _c$11() ? renderType[tweak.type](tweak) : renderType.DEFAULT(tweak);
        })());
        createRenderEffect((_p$) => {
          var _v$10 = !!highlights()[i2() + 1], _v$11 = !!highlightActive();
          _v$10 !== _p$.e && _el$46.classList.toggle("active", _p$.e = _v$10);
          _v$11 !== _p$.t && _el$46.classList.toggle("siblingActive", _p$.t = _v$11);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$46;
      })()
    }));
    insert(_el$34, (() => {
      var _c$5 = createMemo(() => warningNodes().length > 0);
      return () => _c$5() ? (() => {
        var _el$47 = _tmpl$18();
        _el$47.$$click = () => {
          setShowWarnings(!showWarnings());
        };
        return _el$47;
      })() : null;
    })(), _el$35);
    insert(_el$34, (() => {
      var _c$6 = createMemo(() => !!showUpdate());
      return () => _c$6() ? (() => {
        var _el$48 = _tmpl$19();
        _el$48.$$click = () => {
          setShowUpdate(``);
        };
        createRenderEffect(() => setAttribute(_el$48, "title", showUpdate()));
        return _el$48;
      })() : null;
    })(), _el$35);
    _el$36.$$click = () => {
      setShowGroups(!showGroups());
    };
    insert(_el$35, (() => {
      var _c$7 = createMemo(() => !!showGroups());
      return () => _c$7() ? (() => {
        var _el$49 = _tmpl$20();
        insert(_el$49, (() => {
          var _c$12 = createMemo(() => groups.length === 0);
          return () => _c$12() ? _tmpl$21() : null;
        })(), null);
        insert(_el$49, () => groups.map((group, i2) => {
          return (() => {
            var _el$51 = _tmpl$22(), _el$52 = _el$51.firstChild, _el$53 = _el$52.nextSibling;
            _el$51.$$click = (e2) => {
              if (e2.shiftKey) {
                jumpToGroup(group.group);
                return;
              }
              setGroups(i2, `enabled`, !groups[i2].enabled);
              const gg = group.group;
              if (!gg) {
                return;
              }
              const nodes = gg._nodes.filter((n2) => !isMapeVariableNode(n2));
              if (groups[i2].enabled) {
                for (const node of nodes) {
                  node.mode = 0;
                }
              } else {
                for (const node of nodes) {
                  node.mode = 4;
                }
              }
              app.graph.setDirtyCanvas(true, true);
            };
            insert(_el$52, () => group.title);
            createRenderEffect(() => setAttribute(_el$52, "title", group.title.length > 50 ? group.title : ``));
            createRenderEffect(() => _el$53.checked = groups[i2].enabled);
            return _el$51;
          })();
        }), null);
        return _el$49;
      })() : null;
    })(), null);
    _el$37.$$click = (e2) => {
      if (e2.shiftKey || confirm(`Do you want to organize workflow?`)) {
        organizeWorkflow();
      }
    };
    _el$38.$$click = (e2) => {
      if (getSetting(`ignorePromptForExplodeHeal`) || e2.shiftKey || confirm(`Do you want to convert all links to set/get nodes?`)) {
        splitAllConnections();
      }
    };
    _el$39.$$click = (e2) => {
      if (getSetting(`ignorePromptForExplodeHeal`) || e2.shiftKey || confirm(`Do you want to convert all set/get nodes to connections?
This is finicky with PrimitiveNodes...`)) {
        joinAllConnections();
      }
    };
    _el$40.$$click = () => {
      openImageWindow();
    };
    _el$41.$$click = () => {
      if (!confirm(`Clear all favourites?`)) {
        return;
      }
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(PREFIX)) {
          const widgetType = key.replace(PREFIX, ``);
          for (const node of getNodesByType(widgetType, `set`)) {
            setWidgetValue(node, false, 1);
          }
          delete localStorage[key];
        }
      }
      update();
    };
    _el$42.$$click = () => {
      setShowSettings(!showSettings());
      if (showSettings()) {
        setShowHelp(false);
      }
    };
    _el$43.$$click = () => {
      setShowHelp(!showHelp());
      if (showHelp()) {
        setShowSettings(false);
      }
    };
    _el$44.$$click = () => {
      setHidden(!hidden());
    };
    _el$45.style.setProperty("--ninja-font-family", "Arial");
    _el$45.style.setProperty("position", "relative");
    _el$45.style.setProperty("z-index", "10000000");
    insert(_el$45, createComponent(NinjaKeys$1, {
      isDark: true,
      get hotkeys() {
        return dynamicHotkeys();
      }
    }));
    insert(_el$30, () => prompts().map((p2) => createComponent(InlinePrompt, p2)), null);
    insert(_el$30, (() => {
      var _c$8 = createMemo(() => !!showSettings());
      return () => _c$8() ? createComponent(Settings, {
        close: () => {
          setShowSettings(false);
        }
      }) : null;
    })(), null);
    insert(_el$30, (() => {
      var _c$9 = createMemo(() => !!showHelp());
      return () => _c$9() ? createComponent(Help, {
        close: () => {
          setShowHelp(false);
        }
      }) : null;
    })(), null);
    insert(_el$30, (() => {
      var _c$10 = createMemo(() => !!showWarnings());
      return () => _c$10() ? createComponent(Warnings, {
        get warnings() {
          return warningNodes();
        },
        close: () => {
          window.mapeErrors = [];
          setShowWarnings(false);
        }
      }) : null;
    })(), null);
    createRenderEffect((_p$) => {
      var _v$6 = !!hidden(), _v$7 = `Convert links to set/get ${!getSetting(`ignorePromptForExplodeHeal`) ? `(Hold Shift-key to skip prompt)` : ``}`, _v$8 = `Convert set/get to links ${!getSetting(`ignorePromptForExplodeHeal`) ? `(Hold Shift-key to skip prompt)` : ``}`, _v$9 = !!hidden();
      _v$6 !== _p$.e && _el$31.classList.toggle("hidden", _p$.e = _v$6);
      _v$7 !== _p$.t && setAttribute(_el$38, "title", _p$.t = _v$7);
      _v$8 !== _p$.a && setAttribute(_el$39, "title", _p$.a = _v$8);
      _v$9 !== _p$.o && _el$44.classList.toggle("hidden", _p$.o = _v$9);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    return _el$30;
  })();
};
delegateEvents(["click", "input", "mousedown"]);
const bar = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MapeTweak
}, Symbol.toStringTag, { value: "Module" }));
(function() {
  "use strict";
  try {
    if (typeof document != "undefined") {
      var elementStyle = document.createElement("style");
      elementStyle.appendChild(document.createTextNode("@import 'https://fonts.googleapis.com/css?family=Material+Icons&display=block';.imagePreviews {\n  background: repeating-radial-gradient(#181818 0 4px, #1f1f1f 5px 5px);\n  font-family: arial;\n  color: #fff;\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 1000;\n  margin: 0;\n  background-size: 10px 10px;\n  display: flex;\n  flex-direction: column;\n}\n.imagePreviews .content {\n  display: flex;\n  height: 100%;\n}\n.imagePreviews .value {\n  position: static;\n}\n.imagePreviews .image {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  width: 100%;\n  height: 100%;\n}\n.imagePreviews .imagePreviewTweaks {\n  display: flex;\n  background: #111;\n  padding: 10px;\n  justify-content: space-around;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px inset rgba(0, 0, 0, 0.5);\n  gap: 10px;\n}\n.imagePreviews .imagePreviewTweaks .button {\n  flex: auto;\n  vertical-align: top;\n  border: 0;\n  text-transform: uppercase;\n  text-shadow: 2px 2px 1px #000000;\n  user-select: none;\n  position: relative;\n  display: inline-block;\n  color: #fff;\n  border-top: 1px solid #0f0f12;\n  background: #0f0f0f;\n  margin: 2px;\n  border-radius: 4px;\n  cursor: pointer;\n  line-height: 1;\n  transition: color 1s;\n  padding: 5px;\n  outline: none;\n  text-align: center;\n  opacity: 0.5;\n  padding: 8px 10px;\n}\n.imagePreviews .imagePreviewTweaks .button.active {\n  background: #490000;\n}\n.imagePreviews .imagePreviewTweaks .button:before {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  border-radius: 4px;\n  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04));\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 0 1px rgba(255, 255, 255, 0.2);\n  content: '';\n  pointer-events: none;\n}\n.imagePreviews .imagePreviewTweaks .button:hover:before {\n  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));\n}\n.imagePreviews .imagePreviewTweaks .button:active:before {\n  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);\n  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0));\n}\n.imagePreviews .imagePreviewTweaks .button:active {\n  transform: translate(1px, 1px);\n}\n.imagePreviews .imagePreviewTweaks .button.active {\n  opacity: 1;\n}\n.imagePreviews .imagePreviewTweaks label {\n  text-transform: uppercase;\n  padding: 8px 10px;\n  color: rgba(255, 255, 255, 0.5);\n  line-height: 21px;\n}\n.imagePreviews .value {\n  width: 50px;\n}\n.imagePreviews .value {\n  position: static;\n}\n.imagePreviews .bigPreview {\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n  position: relative;\n  cursor: move;\n}\n.imagePreviews .fullImage {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  max-width: 98%;\n  max-height: calc(100vh - 80px);\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  box-shadow: 0 0 60px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 0, 0, 0.3);\n  transform-origin: top left;\n}\n.imagePreviews .thumbnails {\n  display: flex;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: #111;\n  padding: 10px;\n  justify-content: flex-start;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px inset rgba(0, 0, 0, 0.5);\n  flex-direction: column;\n  max-width: 100px;\n  gap: 10px;\n  width: 100px;\n}\n.imagePreviews .thumbnails .thumb {\n  width: 100%;\n  opacity: 0.2;\n  cursor: pointer;\n  position: relative;\n  height: 100%;\n}\n.imagePreviews .thumbnails .thumb:hover {\n  opacity: 0.7;\n}\n.imagePreviews .thumbnails .thumb.active {\n  opacity: 1;\n}\n.imagePreviews .thumbnails .thumb img {\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  border-radius: 10px;\n}\n.imagePreviews .thumbnails .smallImage {\n  border-radius: 5px;\n  max-width: 100%;\n  max-height: 100%;\n  margin: 0 auto;\n  display: block;\n}\n.imagePreviews .mosaicGrid {\n  width: 100%;\n  height: 100%;\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform-origin: top left;\n}\n.imagePreviews .mosaicGrid .inner {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  text-align: center;\n  display: flex;\n  flex-direction: row;\n  align-content: center;\n  flex-wrap: wrap;\n  justify-content: center;\n}\n.imagePreviews .mosaicGrid .mosaicImage {\n  display: inline-block;\n  transform: none;\n  box-shadow: 0 0 60px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 0, 0, 0.3);\n}\n.imagePreviews .mosaicGrid .mosaicImage img {\n  width: 100%;\n  height: 100%;\n}\n.imagePreviews .zoom {\n  font-size: 20px;\n  font-weight: bold;\n  position: absolute;\n  top: 16px;\n  right: 15px;\n  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);\n  cursor: pointer !important;\n  cursor: pointer;\n}\n.imagePreviews .zoom:hover {\n  transform: scale(1.1);\n  filter: saturate(1);\n}\n.imagePreviews .zoom:active {\n  transform: scale(0.9);\n}\n.imagePreviews .flipbookFps {\n  font-size: 20px;\n  font-weight: bold;\n  position: absolute;\n  top: 15px;\n  right: 100px;\n  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);\n  cursor: pointer !important;\n}\n.imagePreviews .flipbookFps label {\n  margin-right: 10px;\n}\n.imagePreviews .flipbookFps input {\n  background: transparent;\n  color: #fff;\n  border: 0;\n  background: rgba(0, 0, 0, 0.2);\n  padding: 5px 3px;\n  border-radius: 5px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) inset;\n  border-right: 0;\n  font-size: 11px;\n  color: rgba(255, 255, 255, 0.6);\n  line-height: 10px;\n  width: 40px;\n  position: relative;\n  font-size: 16px;\n  top: -1px;\n  margin-right: 20px;\n}\n.imagePreviews .flipbookFps input[type='checkbox'] {\n  vertical-align: top;\n  min-width: 15px;\n  max-width: 15px;\n  min-height: 15px;\n  max-height: 15px;\n  background-color: rgba(0, 0, 0, 0.2);\n  display: inline-block;\n  margin-right: 0.8vh;\n  border-radius: 100%;\n  margin-top: 0.45vh;\n  box-shadow: 0 0 0 0.1vh rgba(255, 255, 255, 0.2);\n  padding: 0.5vh;\n  -webkit-appearance: none;\n  outline: none;\n  position: relative;\n  top: 3px;\n}\n.imagePreviews .flipbookFps input[type='checkbox']:hover {\n  background-color: rgba(255, 255, 255, 0.1);\n}\n.imagePreviews .flipbookFps input[type='checkbox']:checked {\n  background: #fff;\n}\n.imagePreviews .flipbookFps input[type='checkbox']:disabled {\n  opacity: 0.2;\n}\n.imagePreviews .imagePreviewHelp {\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  padding: 10px;\n  text-align: center;\n  background: rgba(0, 0, 0, 0.2);\n  padding: 5px 3px;\n  border-radius: 5px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) inset;\n}\n.imagePreviews .imagePreviewHelp p {\n  padding: 0 20px;\n}\n.imagePreviews .imagePreviewHelp video {\n  max-width: 90vw;\n  max-height: calc(90vh - 50px);\n  float: left;\n}\n.mapeBar .tweaks .promptTweaker {\n  background: #333;\n  padding: 5px 0 10px;\n  border-radius: 0 0 5px 5px;\n  position: relative;\n  top: -5px;\n}\n.mapeBar .tweaks .promptTweaker * {\n  box-sizing: border-box;\n}\n.mapeBar .tweaks .promptTweaker .promptTweakerPrompts {\n  max-height: calc(100vh - 310px);\n  overflow: auto;\n}\n.mapeBar .tweaks .promptTweaker .buttons {\n  display: flex;\n  padding: 0 10px 10px;\n}\n.mapeBar .tweaks .promptTweaker button {\n  flex: auto;\n  vertical-align: top;\n  border: 0;\n  text-transform: uppercase;\n  text-shadow: 2px 2px 1px #000000;\n  user-select: none;\n  position: relative;\n  display: inline-block;\n  color: #fff;\n  border-top: 1px solid #0f0f12;\n  background: #0f0f0f;\n  margin: 2px;\n  border-radius: 4px;\n  cursor: pointer;\n  line-height: 1;\n  transition: color 1s;\n  padding: 5px;\n  outline: none;\n  white-space: nowrap;\n  font-size: 11px;\n  height: 23px;\n  padding: 5px 8px;\n}\n.mapeBar .tweaks .promptTweaker button.active {\n  background: #490000;\n}\n.mapeBar .tweaks .promptTweaker button:before {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  border-radius: 4px;\n  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04));\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 0 1px rgba(255, 255, 255, 0.2);\n  content: '';\n  pointer-events: none;\n}\n.mapeBar .tweaks .promptTweaker button:hover:before {\n  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));\n}\n.mapeBar .tweaks .promptTweaker button:active:before {\n  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);\n  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0));\n}\n.mapeBar .tweaks .promptTweaker button:active {\n  transform: translate(1px, 1px);\n}\n.mapeBar .tweaks .promptTweaker button.remove {\n  width: 25px;\n  padding: 5px 8px;\n}\n.mapeBar .tweaks .promptTweaker .prompt {\n  display: flex;\n  padding: 0 5px;\n}\n.mapeBar .tweaks .promptTweaker .prompt label {\n  max-width: 130px;\n  min-width: 130px;\n  height: auto;\n  line-height: 1.5;\n  padding: 2px;\n  border-radius: 5px;\n}\n.mapeBar .tweaks .promptTweaker .prompt .weight {\n  padding: 0 10px;\n  line-height: 26px;\n  min-width: 43px;\n  max-width: 43px;\n}\n.mapeBar .tweaks .promptTweaker .prompt input[type='range'] {\n  appearance: none;\n  -webkit-appearance: none;\n}\n.mapeBar .tweaks .promptTweaker .prompt input[type='range']::-webkit-slider-thumb {\n  -webkit-appearance: none;\n  height: 10px;\n  width: 10px;\n  border-radius: 50%;\n  background: #ffffff;\n  margin-top: -3px;\n  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);\n  cursor: pointer;\n}\n.mapeBar .tweaks .promptTweaker .prompt input[type='range']::-webkit-slider-runnable-track {\n  width: 60%;\n  height: 5px;\n  background: rgba(255, 255, 255, 0.2);\n  border-radius: 3rem;\n  transition: all 0.5s;\n  cursor: pointer;\n}\n.mapeBar .tweaks .promptTweaker .prompt input[type='range']:hover::-webkit-slider-runnable-track {\n  background: rgba(255, 255, 255, 0.3);\n}\n.mapeBar .tweaks .promptTweaker .prompt.tmp {\n  opacity: 0.5;\n}\n.mapeBar .tweaks .promptTweaker .prompt input[type='checkbox'] {\n  vertical-align: top;\n  min-width: 15px;\n  max-width: 15px;\n  min-height: 15px;\n  max-height: 15px;\n  background-color: rgba(0, 0, 0, 0.2);\n  display: inline-block;\n  margin-right: 0.8vh;\n  border-radius: 100%;\n  margin-top: 0.45vh;\n  box-shadow: 0 0 0 0.1vh rgba(255, 255, 255, 0.2);\n  padding: 0.5vh;\n  -webkit-appearance: none;\n  outline: none;\n}\n.mapeBar .tweaks .promptTweaker .prompt input[type='checkbox']:hover {\n  background-color: rgba(255, 255, 255, 0.1);\n}\n.mapeBar .tweaks .promptTweaker .prompt input[type='checkbox']:checked {\n  background: #fff;\n}\n.mapeBar .tweaks .promptTweaker .prompt input[type='checkbox']:disabled {\n  opacity: 0.2;\n}\n.mapeBar .tweaks .promptTweaker .prompt .arrows {\n  padding: 3px 5px 3px 0;\n  position: relative;\n  top: 0px;\n}\n.mapeBar .tweaks .promptTweaker .prompt .arrows .arrow {\n  color: rgba(255, 255, 255, 0.2);\n  font-size: 12px;\n  line-height: 10px;\n}\n.mapeBar .tweaks .promptTweaker .prompt .arrows .arrow.disabled {\n  pointer-events: none;\n  opacity: 0;\n}\n.mapeBar .tweaks .promptTweaker .prompt .arrows .arrow:hover {\n  cursor: pointer;\n  color: rgba(255, 255, 255, 0.9);\n}\n.settingsPopup {\n  position: fixed;\n  background: #333;\n  top: 30px;\n  right: 0;\n  color: #fff;\n  font-family: arial;\n  min-width: 500px;\n  z-index: 1111111111;\n  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);\n  border: 1px solid #444;\n}\n.settingsPopup .close {\n  cursor: pointer;\n  position: absolute;\n  top: 10px;\n  right: 10px;\n  filter: saturate(0);\n}\n.settingsPopup .close:hover {\n  transform: scale(1.1);\n  filter: saturate(1);\n}\n.settingsPopup .close:active {\n  transform: scale(0.9);\n}\n.settingsPopup .header {\n  background: rgba(0, 0, 0, 0.3);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  font-size: 20px;\n  padding: 10px 15px;\n  text-transform: uppercase;\n}\n.settingsPopup .modalContent {\n  max-height: calc(100vh - 100px);\n  overflow: auto;\n}\n.settingsPopup .mapeSetting {\n  display: flex;\n  position: relative;\n  padding: 1px 0;\n  margin: 0 3px;\n  z-index: 1;\n}\n.settingsPopup .mapeSetting .name {\n  background: rgba(0, 0, 0, 0.2);\n  padding: 8px 10px;\n  border-radius: 5px 0 0 5px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) inset;\n  border-right: 0;\n  font-size: 11px;\n  color: rgba(255, 255, 255, 0.6);\n  line-height: 10px;\n  min-width: 400px;\n  line-height: 1.5;\n}\n.settingsPopup .mapeSetting input {\n  padding: 5px;\n  height: 22px;\n  color: #fff;\n  font-size: 11px;\n  width: 100%;\n  border: 0;\n  background: transparent;\n  resize: none;\n  font-family: monospace;\n}\n.settingsPopup .mapeSetting input:focus,\n.settingsPopup .mapeSetting input:active {\n  outline: 1px solid transparent;\n}\n.settingsPopup .mapeSetting input[type='checkbox'] {\n  vertical-align: top;\n  min-width: 15px;\n  max-width: 15px;\n  min-height: 15px;\n  max-height: 15px;\n  background-color: rgba(0, 0, 0, 0.2);\n  display: inline-block;\n  margin-right: 0.8vh;\n  border-radius: 100%;\n  margin-top: 0.45vh;\n  box-shadow: 0 0 0 0.1vh rgba(255, 255, 255, 0.2);\n  padding: 0.5vh;\n  -webkit-appearance: none;\n  outline: none;\n  margin: 0 auto;\n  display: block;\n}\n.settingsPopup .mapeSetting input[type='checkbox']:hover {\n  background-color: rgba(255, 255, 255, 0.1);\n}\n.settingsPopup .mapeSetting input[type='checkbox']:checked {\n  background: #fff;\n}\n.settingsPopup .mapeSetting input[type='checkbox']:disabled {\n  opacity: 0.2;\n}\n.settingsPopup .mapeSetting input:focus {\n  color: #ffa;\n}\n.settingsPopup .mapeSetting input[type='color'] {\n  margin: -15px 0 -10px;\n  height: 36px;\n  position: relative;\n  top: 4px;\n}\n.settingsPopup .mapeSetting .reset {\n  padding: 5px;\n  filter: saturate(0);\n}\n.settingsPopup .mapeSetting .reset:hover {\n  filter: saturate(1);\n}\n.settingsPopup .mapeSetting .value {\n  width: 100%;\n  position: relative;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) inset;\n  background: #222;\n  border-radius: 0 5px 5px 0;\n  padding: 8px 10px;\n}\n.helpPopup {\n  position: fixed;\n  background: #333;\n  top: 30px;\n  right: 0;\n  color: #fff;\n  font-family: arial;\n  min-width: 500px;\n  z-index: 1111111111;\n  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);\n  border: 1px solid #444;\n}\n.helpPopup .close {\n  cursor: pointer;\n  position: absolute;\n  top: 10px;\n  right: 10px;\n  filter: saturate(0);\n}\n.helpPopup .close:hover {\n  transform: scale(1.1);\n  filter: saturate(1);\n}\n.helpPopup .close:active {\n  transform: scale(0.9);\n}\n.helpPopup .header {\n  background: rgba(0, 0, 0, 0.3);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  font-size: 20px;\n  padding: 10px 15px;\n  text-transform: uppercase;\n}\n.helpPopup .modalContent {\n  max-height: calc(100vh - 100px);\n  overflow: auto;\n}\n.helpPopup .modalContent {\n  display: flex;\n}\n.helpPopup .modalContent .help {\n  padding: 15px;\n}\n.helpPopup .modalContent .help .video,\n.helpPopup .modalContent .help .image {\n  width: 720px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);\n  background: rgba(0, 0, 0, 0.8);\n}\n.helpPopup .modalContent .help .info {\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  background: rgba(0, 0, 0, 0.1);\n  margin: 10px 0;\n  border-radius: 10px;\n  overflow: hidden;\n}\n.helpPopup .modalContent .help .title {\n  font-size: 25px;\n  padding: 15px 20px;\n  font-weight: bold;\n  text-transform: uppercase;\n  background: rgba(0, 0, 0, 0.2);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n}\n.helpPopup .modalContent .help .text {\n  max-width: 720px;\n  font-size: 15px;\n  padding: 20px 0;\n  font-size: 17px;\n  color: rgba(255, 255, 255, 0.8);\n  white-space: pre-wrap;\n}\n.helpPopup .modalContent .help .text p {\n  margin: 0;\n  padding: 0 20px 1em;\n  line-height: 1.5;\n}\n.helpPopup .modalContent .help .text p:last-child {\n  padding-bottom: 0;\n}\n.helpPopup .modalContent .help .text code {\n  outline: 1px solid rgba(0, 0, 0, 0.3);\n  background: rgba(0, 0, 0, 0.1);\n  border-radius: 5px;\n  padding: 5px;\n  margin: 0 0.2em;\n}\n.helpPopup .modalContent .menu {\n  background-color: #222;\n  margin: 0;\n  padding: 0;\n}\n.helpPopup .modalContent .menu li {\n  background: linear-gradient(to right, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0));\n  border-left: 1px solid #555;\n  padding: 10px 15px;\n  list-style: none;\n  color: rgba(255, 255, 255, 0.5);\n  border-bottom: 1px solid rgba(0, 0, 0, 0.2);\n}\n.helpPopup .modalContent .menu li:nth-child(odd) {\n  background: linear-gradient(to right, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1) 20%, rgba(0, 0, 0, 0.1));\n  border-bottom: 1px solid rgba(0, 0, 0, 0.1);\n}\n.helpPopup .modalContent .menu li:hover {\n  color: #ffffff;\n  cursor: pointer;\n}\n.helpPopup .modalContent .menu li.active {\n  background: #333;\n  color: #fff;\n  box-shadow: 6px 2px 6px #0003;\n  border-left: 1px solid transparent;\n  border-top: 1px solid rgba(255, 255, 255, 0.1);\n  border-bottom: 1px solid rgba(0, 0, 0, 0.1);\n  background: linear-gradient(to right, #333, #424242 20%, #333);\n}\n.helpPopup .modalContent .menu li.active:first-child {\n  border-top: 0;\n}\n.mapeConfirmPrompt {\n  font-family: arial;\n  position: fixed;\n  padding: 10px;\n  background: #333;\n  border-bottom: 1px solid #444;\n  font-size: 13px;\n  z-index: 111;\n  border-radius: 10px;\n  border: 2px solid #555;\n  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);\n  transform: translate(-50%, -50%);\n}\n.mapeConfirmPrompt * {\n  box-sizing: border-box;\n}\n.mapeConfirmPrompt .title {\n  white-space: nowrap;\n  text-transform: uppercase;\n  padding: 0 0 5px;\n  text-align: center;\n}\n.mapeConfirmPrompt input {\n  position: relative;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px #0000004d inset;\n  background: #222;\n  color: #fff;\n  border-radius: 5px;\n  padding: 8px 10px;\n  width: 100%;\n}\n.mapeConfirmPrompt input:focus,\n.mapeConfirmPrompt input:active {\n  outline: 1px solid transparent;\n}\n.mapeConfirmPrompt .suggestions {\n  background: #333;\n  border-bottom: 1px solid #444;\n  font-size: 13px;\n  z-index: 111;\n  border-radius: 10px;\n  border: 2px solid #555;\n  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);\n  position: absolute;\n  top: 100%;\n  left: 0;\n  right: 0;\n  border-radius: 5px;\n}\n.mapeConfirmPrompt .suggestions .suggestion {\n  padding: 5px;\n}\n.mapeConfirmPrompt .suggestions .suggestion:nth-child(odd) {\n  background: rgba(0, 0, 0, 0.1);\n}\n.mapeConfirmPrompt .suggestions .suggestion:hover,\n.mapeConfirmPrompt .suggestions .suggestion.selected {\n  color: #ffa;\n  background: rgba(0, 0, 0, 0.3);\n  cursor: pointer;\n}\n.mapeConfirmPrompt .suggestions .suggestion small {\n  opacity: 0.5;\n  float: right;\n}\n.mapeConfirmPrompt .suggestions .suggestion.missingType {\n  opacity: 0.3;\n}\n.warningsPopup {\n  position: fixed;\n  background: #333;\n  top: 30px;\n  right: 0;\n  color: #fff;\n  font-family: arial;\n  min-width: 500px;\n  z-index: 1111111111;\n  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);\n  border: 1px solid #444;\n}\n.warningsPopup .close {\n  cursor: pointer;\n  position: absolute;\n  top: 10px;\n  right: 10px;\n  filter: saturate(0);\n}\n.warningsPopup .close:hover {\n  transform: scale(1.1);\n  filter: saturate(1);\n}\n.warningsPopup .close:active {\n  transform: scale(0.9);\n}\n.warningsPopup .header {\n  background: rgba(0, 0, 0, 0.3);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  font-size: 20px;\n  padding: 10px 15px;\n  text-transform: uppercase;\n}\n.warningsPopup .modalContent {\n  max-height: calc(100vh - 100px);\n  overflow: auto;\n}\n.warningsPopup .mapeSetting {\n  display: flex;\n  position: relative;\n  padding: 4px 0;\n  margin: 0 3px;\n  z-index: 1;\n}\n.warningsPopup .mapeSetting .name {\n  background: rgba(0, 0, 0, 0.2);\n  padding: 8px 10px;\n  border-radius: 5px 0 0 5px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) inset;\n  border-right: 0;\n  font-size: 11px;\n  color: #fff;\n  line-height: 10px;\n  line-height: 1.5;\n  width: 100%;\n  font-size: 16px;\n}\n.warningsPopup .mapeSetting .name small {\n  padding: 0 10px;\n  color: rgba(255, 255, 255, 0.6);\n}\n.warningsPopup .mapeSetting button {\n  flex: auto;\n  vertical-align: top;\n  border: 0;\n  text-transform: uppercase;\n  text-shadow: 2px 2px 1px #000000;\n  user-select: none;\n  position: relative;\n  display: inline-block;\n  color: #fff;\n  border-top: 1px solid #0f0f12;\n  background: #0f0f0f;\n  margin: 2px;\n  border-radius: 4px;\n  cursor: pointer;\n  line-height: 1;\n  transition: color 1s;\n  padding: 5px;\n  outline: none;\n  padding: 0 10px;\n  white-space: nowrap;\n}\n.warningsPopup .mapeSetting button.active {\n  background: #490000;\n}\n.warningsPopup .mapeSetting button:before {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  border-radius: 4px;\n  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04));\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 0 1px rgba(255, 255, 255, 0.2);\n  content: '';\n  pointer-events: none;\n}\n.warningsPopup .mapeSetting button:hover:before {\n  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));\n}\n.warningsPopup .mapeSetting button:active:before {\n  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);\n  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0));\n}\n.warningsPopup .mapeSetting button:active {\n  transform: translate(1px, 1px);\n}\n\n@media only screen and (max-height: 850px) {\n  html body .comfy-menu {\n    top: 30px !important;\n  }\n}\n.mapeRoot * {\n  box-sizing: border-box;\n  font-family: arial;\n  user-select: none;\n}\n.mapeRoot *::-webkit-scrollbar {\n  width: 5px;\n  height: 5px;\n  background: linear-gradient(to right, #111, #222);\n}\n.mapeRoot *::-webkit-scrollbar-thumb {\n  background: linear-gradient(to bottom, #fff, #aaa);\n  border: 1px solid #fff;\n  border-radius: 10px;\n}\n.mapeBar {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 30px;\n  background: #333;\n  border-bottom: 1px solid #444;\n  display: flex;\n  font-size: 13px;\n  z-index: 1111111;\n  border-top: 1px solid rgba(255, 255, 255, 0.1);\n  background: linear-gradient(to bottom, #353535, #313131 30%, #333);\n}\n.mapeBar.hidden {\n  opacity: 0;\n  pointer-events: none;\n}\n.mapeBar:after {\n  content: '';\n  display: block;\n  position: absolute;\n  top: 100%;\n  left: 0;\n  right: 0;\n  height: 20px;\n  background: linear-gradient(to bottom, #0000002f, #00000000);\n  border-top: 2px solid rgba(0, 0, 0, 0.3);\n  pointer-events: none;\n}\n.mapeBar .logo {\n  background: url(https://comfyui.ma.pe/logo.svg);\n  background-size: contain;\n  background-repeat: no-repeat;\n  min-width: 26px;\n  max-width: 26px;\n  margin: 8px;\n  cursor: pointer;\n}\n.mapeBar .logo:hover {\n  transform: scale(1.1);\n  filter: saturate(1);\n}\n.mapeBar .logo:active {\n  transform: scale(0.9);\n}\n.mapeBar .tweakHighlight {\n  position: relative;\n}\n.mapeBar .tweakHighlight.siblingActive {\n  opacity: 0.1;\n}\n.mapeBar .tweakHighlight.active {\n  opacity: 1;\n}\n.mapeBar .tweaks {\n  display: flex;\n}\n.mapeBar .tweaks .tweak {\n  display: flex;\n  position: relative;\n  padding: 4px 0;\n  margin: 0 3px;\n  z-index: 1;\n}\n.mapeBar .tweaks .tweak label {\n  background: rgba(0, 0, 0, 0.2);\n  padding: 5px 8px;\n  height: 22px;\n  border-radius: 5px 0 0 5px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) inset;\n  border-right: 0;\n  font-size: 11px;\n  color: rgba(255, 255, 255, 0.6);\n  line-height: 10px;\n}\n.mapeBar .tweaks .tweak label.interactable {\n  cursor: pointer;\n}\n.mapeBar .tweaks .tweak label.interactable:hover {\n  color: #fff;\n}\n.mapeBar .tweaks .tweak.defaultContainer label {\n  border-radius: 5px;\n}\n.mapeBar .tweaks .tweak input,\n.mapeBar .tweaks .tweak textarea {\n  padding: 5px;\n  height: 22px;\n  color: #fff;\n  font-size: 11px;\n  width: 100%;\n  border: 0;\n  background: transparent;\n  resize: none;\n  font-family: monospace;\n}\n.mapeBar .tweaks .tweak input:focus,\n.mapeBar .tweaks .tweak textarea:focus,\n.mapeBar .tweaks .tweak input:active,\n.mapeBar .tweaks .tweak textarea:active {\n  outline: 1px solid transparent;\n}\n.mapeBar .tweaks .tweak input:focus {\n  color: #ffa;\n}\n.mapeBar .tweaks .tweak .image {\n  position: absolute;\n  top: 0;\n  left: 0px;\n  width: 50px;\n  height: 50px;\n  border-radius: 5px;\n  background: #000;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center center;\n}\n.mapeBar .tweaks .tweak .value {\n  width: 70px;\n  position: relative;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) inset;\n  background: #222;\n  height: 22px;\n  border-radius: 0 5px 5px 0;\n}\n.mapeBar .tweaks .tweak.stringContainer.focused .value {\n  width: 450px;\n}\n.mapeBar .tweaks .tweak.stringContainer.focused textarea {\n  height: 150px;\n  padding: 10px;\n  line-height: 1.5;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) inset;\n  background: #222;\n}\n.mapeBar .tweaks .tweak.imageContainer {\n  cursor: pointer;\n}\n.mapeBar .tweaks .tweak.imageContainer .value {\n  width: 50px;\n}\n.mapeBar .tweaks .tweak.imageContainer .missingImage {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  color: rgba(255, 255, 255, 0.5);\n  width: 50px;\n  text-align: center;\n}\n.mapeBar .tweaks .tweak.imageContainer .missing {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  font-size: 20px;\n}\n.mapeBar .tweaks .tweak.imageContainer.focused {\n  display: block;\n  background: repeating-radial-gradient(#181818 0 4px, #1f1f1f 5px 5px);\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 1000;\n  margin: 0;\n  background-size: 10px 10px;\n}\n.mapeBar .tweaks .tweak.imageContainer.focused label {\n  display: none;\n}\n.mapeBar .tweaks .tweak.imageContainer.focused .value {\n  position: static;\n}\n.mapeBar .tweaks .tweak.imageContainer.focused .image {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  width: 100%;\n  height: 100%;\n}\n.mapeBar .tweaks .tweak.imageContainer.focused.hasMultiple {\n  top: 150px;\n}\n.mapeBar .tweaks .tweak.imageContainer .fullImage {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  max-width: 98%;\n  max-height: 98%;\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  box-shadow: 0 0 60px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 0, 0, 0.3);\n}\n.mapeBar .tweaks .tweak.imageContainer .thumbnails {\n  display: flex;\n  position: absolute;\n  height: 150px;\n  left: 0;\n  right: 0;\n  bottom: 100%;\n  background: #111;\n  padding: 10px;\n  justify-content: space-around;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 10px inset rgba(0, 0, 0, 0.5);\n}\n.mapeBar .tweaks .tweak.imageContainer .thumbnails .thumb {\n  width: 100%;\n}\n.mapeBar .tweaks .tweak.imageContainer .thumbnails .smallImage {\n  border-radius: 5px;\n  max-width: 100%;\n  max-height: 100%;\n  margin: 0 auto;\n  display: block;\n}\n.mapeBar button {\n  width: 100px;\n}\n.mapeBar .options {\n  position: absolute;\n  top: 0px;\n  font-weight: 900;\n  color: #fff;\n  line-height: 28px;\n  font-size: 18px;\n  background: linear-gradient(to bottom, #353535, #313131 30%, #333);\n  display: flex;\n  right: 5px;\n  height: 29px;\n  gap: 5px;\n  padding: 0 5px;\n  z-index: 9;\n}\n.mapeBar .options .interact {\n  filter: saturate(0.8);\n  cursor: pointer;\n}\n.mapeBar .options .interact:hover {\n  transform: scale(1.1);\n  filter: saturate(1);\n}\n.mapeBar .options .interact:active {\n  transform: scale(0.9);\n}\n.mapeBar .options .interact small {\n  position: absolute;\n  top: 6px;\n  left: 12px;\n  font-size: 62%;\n}\n@keyframes fadeInOut {\n  0% {\n    opacity: 0.5;\n  }\n  50% {\n    opacity: 1;\n  }\n  100% {\n    opacity: 0.5;\n  }\n}\n.mapeBar .options .blink {\n  animation: fadeInOut 1s ease-in-out infinite;\n}\n.mapeBar .tweak.floating {\n  display: block;\n  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);\n  padding: 0;\n}\n.mapeBar .tweak.floating .promptTweaker {\n  margin: 0 0 -5px;\n  border-radius: 0;\n}\n.mapeBar .tweak.floating > label {\n  display: none;\n}\n.mapeBar .tweak.floating .moveArea {\n  cursor: move;\n}\n.mapeBar .tweak.floating .moveArea .name {\n  display: block;\n}\n.mapeBar .tweak.floating textarea {\n  resize: vertical;\n  /* This allows resizing only vertically */\n}\n.mapeBar .tweak.floating .value {\n  height: auto;\n  border-radius: 0;\n}\n.mapeBar .moveBar {\n  position: relative;\n  height: 20px;\n  background: repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.3) 0px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.2) 2px, rgba(0, 0, 0, 0.2) 9px);\n}\n.mapeBar .moveBar .moveArea {\n  position: absolute;\n  top: 0;\n  left: 0;\n  bottom: 0;\n  right: 30px;\n}\n.mapeBar .moveBar .moveArea .name {\n  font-size: 11px;\n  padding: 4px 6px;\n  display: none;\n}\n.mapeBar .moveBar .toggleFloating {\n  position: absolute;\n  top: -1px;\n  right: 5px;\n  filter: saturate(0);\n  cursor: pointer;\n  font-size: 15px;\n}\n.mapeBar .moveBar .toggleFloating:hover {\n  filter: saturate(1);\n}\n.mapeBar .groupToggle {\n  position: relative;\n}\n.mapeBar .groupToggle > span {\n  cursor: pointer;\n  display: block;\n}\n.mapeBar .groupToggle > span:hover {\n  transform: scale(1.1);\n  filter: saturate(1);\n}\n.mapeBar .groupToggle > span:active {\n  transform: scale(0.9);\n}\n.mapeBar .groupToggle .groups {\n  position: absolute;\n  top: 100%;\n  left: 0;\n  background: #333;\n  padding: 0 5px;\n  border-radius: 0 0 5px 5px;\n  transform: translate(-50%, 0);\n}\n.mapeBar .groupToggle .groups .group {\n  display: flex;\n  white-space: nowrap;\n  border-right: 0;\n  font-size: 11px;\n  color: #fff9;\n  font-weight: normal;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 5px;\n  padding: 0 10px;\n  margin: 5px 0;\n}\n.mapeBar .groupToggle .groups .group:nth-child(odd) {\n  background: rgba(0, 0, 0, 0.1);\n}\n.mapeBar .groupToggle .groups .group .groupName {\n  width: 100%;\n  padding-right: 10px;\n  line-height: 22px;\n  max-width: 300px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.mapeBar .groupToggle .groups input[type='checkbox'] {\n  vertical-align: top;\n  min-width: 15px;\n  max-width: 15px;\n  min-height: 15px;\n  max-height: 15px;\n  background-color: rgba(0, 0, 0, 0.2);\n  display: inline-block;\n  margin-right: 0.8vh;\n  border-radius: 100%;\n  margin-top: 0.45vh;\n  box-shadow: 0 0 0 0.1vh rgba(255, 255, 255, 0.2);\n  padding: 0.5vh;\n  -webkit-appearance: none;\n  outline: none;\n  position: relative;\n  top: 6px;\n  margin: 0;\n  min-width: 10px;\n  min-height: 10px;\n  height: 10px;\n  width: 10px;\n}\n.mapeBar .groupToggle .groups input[type='checkbox']:hover {\n  background-color: rgba(255, 255, 255, 0.1);\n}\n.mapeBar .groupToggle .groups input[type='checkbox']:checked {\n  background: #fff;\n}\n.mapeBar .groupToggle .groups input[type='checkbox']:disabled {\n  opacity: 0.2;\n}\n.mapeBarToggle {\n  position: fixed;\n  top: 0;\n  right: 0;\n  width: 7px;\n  height: 30px;\n  background: #4b4b4b;\n  z-index: 100000000;\n  cursor: zoom-out;\n  border-radius: 5px 0 0 5px;\n}\n.mapeBarToggle.hidden {\n  cursor: zoom-in;\n}"));
      document.head.appendChild(elementStyle);
    }
  } catch (e) {
    console.error("vite-plugin-css-injected-by-js", e);
  }
})();
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = []
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
