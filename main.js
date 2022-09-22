var Massim = (function (exports) {
    'use strict';

    function createElement(tagName, options) {
        return document.createElement(tagName, options);
    }
    function createElementNS(namespaceURI, qualifiedName, options) {
        return document.createElementNS(namespaceURI, qualifiedName, options);
    }
    function createDocumentFragment() {
        return parseFragment(document.createDocumentFragment());
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        if (isDocumentFragment$1(parentNode)) {
            let node = parentNode;
            while (node && isDocumentFragment$1(node)) {
                const fragment = parseFragment(node);
                node = fragment.parent;
            }
            parentNode = node !== null && node !== void 0 ? node : parentNode;
        }
        if (isDocumentFragment$1(newNode)) {
            newNode = parseFragment(newNode, parentNode);
        }
        if (referenceNode && isDocumentFragment$1(referenceNode)) {
            referenceNode = parseFragment(referenceNode).firstChildNode;
        }
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        if (isDocumentFragment$1(child)) {
            child = parseFragment(child, node);
        }
        node.appendChild(child);
    }
    function parentNode(node) {
        if (isDocumentFragment$1(node)) {
            while (node && isDocumentFragment$1(node)) {
                const fragment = parseFragment(node);
                node = fragment.parent;
            }
            return node !== null && node !== void 0 ? node : null;
        }
        return node.parentNode;
    }
    function nextSibling(node) {
        var _a;
        if (isDocumentFragment$1(node)) {
            const fragment = parseFragment(node);
            const parent = parentNode(fragment);
            if (parent && fragment.lastChildNode) {
                const children = Array.from(parent.childNodes);
                const index = children.indexOf(fragment.lastChildNode);
                return (_a = children[index + 1]) !== null && _a !== void 0 ? _a : null;
            }
            return null;
        }
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement$1(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    function isDocumentFragment$1(node) {
        return node.nodeType === 11;
    }
    function parseFragment(fragmentNode, parentNode) {
        var _a, _b, _c;
        const fragment = fragmentNode;
        (_a = fragment.parent) !== null && _a !== void 0 ? _a : (fragment.parent = parentNode !== null && parentNode !== void 0 ? parentNode : null);
        (_b = fragment.firstChildNode) !== null && _b !== void 0 ? _b : (fragment.firstChildNode = fragmentNode.firstChild);
        (_c = fragment.lastChildNode) !== null && _c !== void 0 ? _c : (fragment.lastChildNode = fragmentNode.lastChild);
        return fragment;
    }
    const htmlDomApi = {
        createElement,
        createElementNS,
        createTextNode,
        createDocumentFragment,
        createComment,
        insertBefore,
        removeChild,
        appendChild,
        parentNode,
        nextSibling,
        tagName,
        setTextContent,
        getTextContent,
        isElement: isElement$1,
        isText,
        isComment,
        isDocumentFragment: isDocumentFragment$1,
    };

    function vnode(sel, data, children, text, elm) {
        const key = data === undefined ? undefined : data.key;
        return { sel, data, children, text, elm, key };
    }

    const array = Array.isArray;
    function primitive(s) {
        return (typeof s === "string" ||
            typeof s === "number" ||
            s instanceof String ||
            s instanceof Number);
    }

    function isUndef(s) {
        return s === undefined;
    }
    function isDef(s) {
        return s !== undefined;
    }
    const emptyNode = vnode("", {}, [], undefined, undefined);
    function sameVnode(vnode1, vnode2) {
        var _a, _b;
        const isSameKey = vnode1.key === vnode2.key;
        const isSameIs = ((_a = vnode1.data) === null || _a === void 0 ? void 0 : _a.is) === ((_b = vnode2.data) === null || _b === void 0 ? void 0 : _b.is);
        const isSameSel = vnode1.sel === vnode2.sel;
        const isSameTextOrFragment = !vnode1.sel && vnode1.sel === vnode2.sel
            ? typeof vnode1.text === typeof vnode2.text
            : true;
        return isSameSel && isSameKey && isSameIs && isSameTextOrFragment;
    }
    /**
     * @todo Remove this function when the document fragment is considered stable.
     */
    function documentFragmentIsNotSupported() {
        throw new Error("The document fragment is not supported on this platform.");
    }
    function isElement(api, vnode) {
        return api.isElement(vnode);
    }
    function isDocumentFragment(api, vnode) {
        return api.isDocumentFragment(vnode);
    }
    function createKeyToOldIdx(children, beginIdx, endIdx) {
        var _a;
        const map = {};
        for (let i = beginIdx; i <= endIdx; ++i) {
            const key = (_a = children[i]) === null || _a === void 0 ? void 0 : _a.key;
            if (key !== undefined) {
                map[key] = i;
            }
        }
        return map;
    }
    const hooks = [
        "create",
        "update",
        "remove",
        "destroy",
        "pre",
        "post",
    ];
    function init(modules, domApi, options) {
        const cbs = {
            create: [],
            update: [],
            remove: [],
            destroy: [],
            pre: [],
            post: [],
        };
        const api = domApi !== undefined ? domApi : htmlDomApi;
        for (const hook of hooks) {
            for (const module of modules) {
                const currentHook = module[hook];
                if (currentHook !== undefined) {
                    cbs[hook].push(currentHook);
                }
            }
        }
        function emptyNodeAt(elm) {
            const id = elm.id ? "#" + elm.id : "";
            // elm.className doesn't return a string when elm is an SVG element inside a shadowRoot.
            // https://stackoverflow.com/questions/29454340/detecting-classname-of-svganimatedstring
            const classes = elm.getAttribute("class");
            const c = classes ? "." + classes.split(" ").join(".") : "";
            return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
        }
        function emptyDocumentFragmentAt(frag) {
            return vnode(undefined, {}, [], undefined, frag);
        }
        function createRmCb(childElm, listeners) {
            return function rmCb() {
                if (--listeners === 0) {
                    const parent = api.parentNode(childElm);
                    api.removeChild(parent, childElm);
                }
            };
        }
        function createElm(vnode, insertedVnodeQueue) {
            var _a, _b, _c, _d;
            let i;
            let data = vnode.data;
            if (data !== undefined) {
                const init = (_a = data.hook) === null || _a === void 0 ? void 0 : _a.init;
                if (isDef(init)) {
                    init(vnode);
                    data = vnode.data;
                }
            }
            const children = vnode.children;
            const sel = vnode.sel;
            if (sel === "!") {
                if (isUndef(vnode.text)) {
                    vnode.text = "";
                }
                vnode.elm = api.createComment(vnode.text);
            }
            else if (sel !== undefined) {
                // Parse selector
                const hashIdx = sel.indexOf("#");
                const dotIdx = sel.indexOf(".", hashIdx);
                const hash = hashIdx > 0 ? hashIdx : sel.length;
                const dot = dotIdx > 0 ? dotIdx : sel.length;
                const tag = hashIdx !== -1 || dotIdx !== -1
                    ? sel.slice(0, Math.min(hash, dot))
                    : sel;
                const elm = (vnode.elm =
                    isDef(data) && isDef((i = data.ns))
                        ? api.createElementNS(i, tag, data)
                        : api.createElement(tag, data));
                if (hash < dot)
                    elm.setAttribute("id", sel.slice(hash + 1, dot));
                if (dotIdx > 0)
                    elm.setAttribute("class", sel.slice(dot + 1).replace(/\./g, " "));
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                if (array(children)) {
                    for (i = 0; i < children.length; ++i) {
                        const ch = children[i];
                        if (ch != null) {
                            api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                        }
                    }
                }
                else if (primitive(vnode.text)) {
                    api.appendChild(elm, api.createTextNode(vnode.text));
                }
                const hook = vnode.data.hook;
                if (isDef(hook)) {
                    (_b = hook.create) === null || _b === void 0 ? void 0 : _b.call(hook, emptyNode, vnode);
                    if (hook.insert) {
                        insertedVnodeQueue.push(vnode);
                    }
                }
            }
            else if (((_c = options === null || options === void 0 ? void 0 : options.experimental) === null || _c === void 0 ? void 0 : _c.fragments) && vnode.children) {
                vnode.elm = ((_d = api.createDocumentFragment) !== null && _d !== void 0 ? _d : documentFragmentIsNotSupported)();
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                for (i = 0; i < vnode.children.length; ++i) {
                    const ch = vnode.children[i];
                    if (ch != null) {
                        api.appendChild(vnode.elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            else {
                vnode.elm = api.createTextNode(vnode.text);
            }
            return vnode.elm;
        }
        function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
            for (; startIdx <= endIdx; ++startIdx) {
                const ch = vnodes[startIdx];
                if (ch != null) {
                    api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
                }
            }
        }
        function invokeDestroyHook(vnode) {
            var _a, _b;
            const data = vnode.data;
            if (data !== undefined) {
                (_b = (_a = data === null || data === void 0 ? void 0 : data.hook) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 ? void 0 : _b.call(_a, vnode);
                for (let i = 0; i < cbs.destroy.length; ++i)
                    cbs.destroy[i](vnode);
                if (vnode.children !== undefined) {
                    for (let j = 0; j < vnode.children.length; ++j) {
                        const child = vnode.children[j];
                        if (child != null && typeof child !== "string") {
                            invokeDestroyHook(child);
                        }
                    }
                }
            }
        }
        function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
            var _a, _b;
            for (; startIdx <= endIdx; ++startIdx) {
                let listeners;
                let rm;
                const ch = vnodes[startIdx];
                if (ch != null) {
                    if (isDef(ch.sel)) {
                        invokeDestroyHook(ch);
                        listeners = cbs.remove.length + 1;
                        rm = createRmCb(ch.elm, listeners);
                        for (let i = 0; i < cbs.remove.length; ++i)
                            cbs.remove[i](ch, rm);
                        const removeHook = (_b = (_a = ch === null || ch === void 0 ? void 0 : ch.data) === null || _a === void 0 ? void 0 : _a.hook) === null || _b === void 0 ? void 0 : _b.remove;
                        if (isDef(removeHook)) {
                            removeHook(ch, rm);
                        }
                        else {
                            rm();
                        }
                    }
                    else if (ch.children) {
                        // Fragment node
                        invokeDestroyHook(ch);
                        removeVnodes(parentElm, ch.children, 0, ch.children.length - 1);
                    }
                    else {
                        // Text node
                        api.removeChild(parentElm, ch.elm);
                    }
                }
            }
        }
        function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
            let oldStartIdx = 0;
            let newStartIdx = 0;
            let oldEndIdx = oldCh.length - 1;
            let oldStartVnode = oldCh[0];
            let oldEndVnode = oldCh[oldEndIdx];
            let newEndIdx = newCh.length - 1;
            let newStartVnode = newCh[0];
            let newEndVnode = newCh[newEndIdx];
            let oldKeyToIdx;
            let idxInOld;
            let elmToMove;
            let before;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
                }
                else if (oldEndVnode == null) {
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (newStartVnode == null) {
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (newEndVnode == null) {
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    // Vnode moved right
                    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    // Vnode moved left
                    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    if (oldKeyToIdx === undefined) {
                        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    }
                    idxInOld = oldKeyToIdx[newStartVnode.key];
                    if (isUndef(idxInOld)) {
                        // New element
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        elmToMove = oldCh[idxInOld];
                        if (elmToMove.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        }
                        else {
                            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                            oldCh[idxInOld] = undefined;
                            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                        }
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
            if (newStartIdx <= newEndIdx) {
                before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
            }
            if (oldStartIdx <= oldEndIdx) {
                removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
            }
        }
        function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
            (_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 ? void 0 : _b.call(hook, oldVnode, vnode);
            const elm = (vnode.elm = oldVnode.elm);
            if (oldVnode === vnode)
                return;
            if (vnode.data !== undefined ||
                (isDef(vnode.text) && vnode.text !== oldVnode.text)) {
                (_c = vnode.data) !== null && _c !== void 0 ? _c : (vnode.data = {});
                (_d = oldVnode.data) !== null && _d !== void 0 ? _d : (oldVnode.data = {});
                for (let i = 0; i < cbs.update.length; ++i)
                    cbs.update[i](oldVnode, vnode);
                (_g = (_f = (_e = vnode.data) === null || _e === void 0 ? void 0 : _e.hook) === null || _f === void 0 ? void 0 : _f.update) === null || _g === void 0 ? void 0 : _g.call(_f, oldVnode, vnode);
            }
            const oldCh = oldVnode.children;
            const ch = vnode.children;
            if (isUndef(vnode.text)) {
                if (isDef(oldCh) && isDef(ch)) {
                    if (oldCh !== ch)
                        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
                }
                else if (isDef(ch)) {
                    if (isDef(oldVnode.text))
                        api.setTextContent(elm, "");
                    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                }
                else if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    api.setTextContent(elm, "");
                }
            }
            else if (oldVnode.text !== vnode.text) {
                if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                api.setTextContent(elm, vnode.text);
            }
            (_h = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _h === void 0 ? void 0 : _h.call(hook, oldVnode, vnode);
        }
        return function patch(oldVnode, vnode) {
            let i, elm, parent;
            const insertedVnodeQueue = [];
            for (i = 0; i < cbs.pre.length; ++i)
                cbs.pre[i]();
            if (isElement(api, oldVnode)) {
                oldVnode = emptyNodeAt(oldVnode);
            }
            else if (isDocumentFragment(api, oldVnode)) {
                oldVnode = emptyDocumentFragmentAt(oldVnode);
            }
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue);
            }
            else {
                elm = oldVnode.elm;
                parent = api.parentNode(elm);
                createElm(vnode, insertedVnodeQueue);
                if (parent !== null) {
                    api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                    removeVnodes(parent, [oldVnode], 0, 0);
                }
            }
            for (i = 0; i < insertedVnodeQueue.length; ++i) {
                insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
            }
            for (i = 0; i < cbs.post.length; ++i)
                cbs.post[i]();
            return vnode;
        };
    }

    function addNS(data, children, sel) {
        data.ns = "http://www.w3.org/2000/svg";
        if (sel !== "foreignObject" && children !== undefined) {
            for (let i = 0; i < children.length; ++i) {
                const child = children[i];
                if (typeof child === "string")
                    continue;
                const childData = child.data;
                if (childData !== undefined) {
                    addNS(childData, child.children, child.sel);
                }
            }
        }
    }
    function h(sel, b, c) {
        let data = {};
        let children;
        let text;
        let i;
        if (c !== undefined) {
            if (b !== null) {
                data = b;
            }
            if (array(c)) {
                children = c;
            }
            else if (primitive(c)) {
                text = c.toString();
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined && b !== null) {
            if (array(b)) {
                children = b;
            }
            else if (primitive(b)) {
                text = b.toString();
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (children !== undefined) {
            for (i = 0; i < children.length; ++i) {
                if (primitive(children[i]))
                    children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
        if (sel[0] === "s" &&
            sel[1] === "v" &&
            sel[2] === "g" &&
            (sel.length === 3 || sel[3] === "." || sel[3] === "#")) {
            addNS(data, children, sel);
        }
        return vnode(sel, data, children, text, undefined);
    }

    const xlinkNS = "http://www.w3.org/1999/xlink";
    const xmlNS = "http://www.w3.org/XML/1998/namespace";
    const colonChar = 58;
    const xChar = 120;
    function updateAttrs(oldVnode, vnode) {
        let key;
        const elm = vnode.elm;
        let oldAttrs = oldVnode.data.attrs;
        let attrs = vnode.data.attrs;
        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};
        // update modified attributes, add new attributes
        for (key in attrs) {
            const cur = attrs[key];
            const old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                }
                else if (cur === false) {
                    elm.removeAttribute(key);
                }
                else {
                    if (key.charCodeAt(0) !== xChar) {
                        elm.setAttribute(key, cur);
                    }
                    else if (key.charCodeAt(3) === colonChar) {
                        // Assume xml namespace
                        elm.setAttributeNS(xmlNS, key, cur);
                    }
                    else if (key.charCodeAt(5) === colonChar) {
                        // Assume xlink namespace
                        elm.setAttributeNS(xlinkNS, key, cur);
                    }
                    else {
                        elm.setAttribute(key, cur);
                    }
                }
            }
        }
        // remove removed attributes
        // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
        // the other option is to remove all attributes with value == undefined
        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }
    const attributesModule = {
        create: updateAttrs,
        update: updateAttrs,
    };

    function updateClass(oldVnode, vnode) {
        let cur;
        let name;
        const elm = vnode.elm;
        let oldClass = oldVnode.data.class;
        let klass = vnode.data.class;
        if (!oldClass && !klass)
            return;
        if (oldClass === klass)
            return;
        oldClass = oldClass || {};
        klass = klass || {};
        for (name in oldClass) {
            if (oldClass[name] && !Object.prototype.hasOwnProperty.call(klass, name)) {
                // was `true` and now not provided
                elm.classList.remove(name);
            }
        }
        for (name in klass) {
            cur = klass[name];
            if (cur !== oldClass[name]) {
                elm.classList[cur ? "add" : "remove"](name);
            }
        }
    }
    const classModule = { create: updateClass, update: updateClass };

    function invokeHandler(handler, vnode, event) {
        if (typeof handler === "function") {
            // call function handler
            handler.call(vnode, event, vnode);
        }
        else if (typeof handler === "object") {
            // call multiple handlers
            for (let i = 0; i < handler.length; i++) {
                invokeHandler(handler[i], vnode, event);
            }
        }
    }
    function handleEvent(event, vnode) {
        const name = event.type;
        const on = vnode.data.on;
        // call event handler(s) if exists
        if (on && on[name]) {
            invokeHandler(on[name], vnode, event);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        const oldOn = oldVnode.data.on;
        const oldListener = oldVnode.listener;
        const oldElm = oldVnode.elm;
        const on = vnode && vnode.data.on;
        const elm = (vnode && vnode.elm);
        let name;
        // optimization for reused immutable handlers
        if (oldOn === on) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldOn && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!on) {
                for (name in oldOn) {
                    // remove listener if element was changed or existing listeners removed
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldOn) {
                    // remove listener if existing listener removed
                    if (!on[name]) {
                        oldElm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (on) {
            // reuse existing listener or create new
            const listener = (vnode.listener =
                oldVnode.listener || createListener());
            // update vnode for listener
            listener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldOn) {
                for (name in on) {
                    // add listener if element was changed or new listeners added
                    elm.addEventListener(name, listener, false);
                }
            }
            else {
                for (name in on) {
                    // add listener if new listener added
                    if (!oldOn[name]) {
                        elm.addEventListener(name, listener, false);
                    }
                }
            }
        }
    }
    const eventListenersModule = {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners,
    };

    // Bindig `requestAnimationFrame` like this fixes a bug in IE/Edge. See #360 and #409.
    const raf = (typeof window !== "undefined" &&
        window.requestAnimationFrame.bind(window)) ||
        setTimeout;
    const nextFrame = function (fn) {
        raf(function () {
            raf(fn);
        });
    };
    let reflowForced = false;
    function setNextFrame(obj, prop, val) {
        nextFrame(function () {
            obj[prop] = val;
        });
    }
    function updateStyle(oldVnode, vnode) {
        let cur;
        let name;
        const elm = vnode.elm;
        let oldStyle = oldVnode.data.style;
        let style = vnode.data.style;
        if (!oldStyle && !style)
            return;
        if (oldStyle === style)
            return;
        oldStyle = oldStyle || {};
        style = style || {};
        const oldHasDel = "delayed" in oldStyle;
        for (name in oldStyle) {
            if (!style[name]) {
                if (name[0] === "-" && name[1] === "-") {
                    elm.style.removeProperty(name);
                }
                else {
                    elm.style[name] = "";
                }
            }
        }
        for (name in style) {
            cur = style[name];
            if (name === "delayed" && style.delayed) {
                for (const name2 in style.delayed) {
                    cur = style.delayed[name2];
                    if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
                        setNextFrame(elm.style, name2, cur);
                    }
                }
            }
            else if (name !== "remove" && cur !== oldStyle[name]) {
                if (name[0] === "-" && name[1] === "-") {
                    elm.style.setProperty(name, cur);
                }
                else {
                    elm.style[name] = cur;
                }
            }
        }
    }
    function applyDestroyStyle(vnode) {
        let style;
        let name;
        const elm = vnode.elm;
        const s = vnode.data.style;
        if (!s || !(style = s.destroy))
            return;
        for (name in style) {
            elm.style[name] = style[name];
        }
    }
    function applyRemoveStyle(vnode, rm) {
        const s = vnode.data.style;
        if (!s || !s.remove) {
            rm();
            return;
        }
        if (!reflowForced) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            vnode.elm.offsetLeft;
            reflowForced = true;
        }
        let name;
        const elm = vnode.elm;
        let i = 0;
        const style = s.remove;
        let amount = 0;
        const applied = [];
        for (name in style) {
            applied.push(name);
            elm.style[name] = style[name];
        }
        const compStyle = getComputedStyle(elm);
        const props = compStyle["transition-property"].split(", ");
        for (; i < props.length; ++i) {
            if (applied.indexOf(props[i]) !== -1)
                amount++;
        }
        elm.addEventListener("transitionend", function (ev) {
            if (ev.target === elm)
                --amount;
            if (amount === 0)
                rm();
        });
    }
    function forceReflow() {
        reflowForced = false;
    }
    const styleModule = {
        pre: forceReflow,
        create: updateStyle,
        update: updateStyle,
        destroy: applyDestroyStyle,
        remove: applyRemoveStyle,
    };

    function compareEntity(a, b) {
        if (a.team < b.team)
            return -1;
        else if (a.team > b.team)
            return 1;
        const suffixA = parseInt(a.name.replace(/^[^\d]*/, ''), 10);
        const suffixB = parseInt(b.name.replace(/^[^\d]*/, ''), 10);
        if (suffixA < suffixB)
            return -1;
        else if (suffixA > suffixB)
            return 1;
        if (a.name < b.name)
            return -1;
        else if (a.name > b.name)
            return 1;
        else
            return 0;
    }
    function compareNumbered(a, b) {
        const firstNumberRegex = /^[A-Za-z_-]*(\d+)/;
        const matchA = a.match(firstNumberRegex);
        const matchB = b.match(firstNumberRegex);
        const idxA = matchA ? parseInt(matchA[1], 10) : -1;
        const idxB = matchB ? parseInt(matchB[1], 10) : -1;
        if (idxA < idxB)
            return -1;
        else if (idxA > idxB)
            return 1;
        if (a < b)
            return -1;
        else if (a > b)
            return 1;
        else
            return 0;
    }
    function samePos(a, b) {
        return a[0] == b[0] && a[1] == b[1];
    }
    function taxicab(a, b) {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    }

    const teams$1 = [
        { background: '#0000ff', color: 'white' },
        { background: '#00ff00', color: 'black' },
        { background: '#ff1493', color: 'white' },
        { background: '#8b0000', color: 'white' },
        { background: '#ed553b', color: 'white' },
        { background: '#a63d40', color: 'white' },
        { background: '#e9b872', color: 'black' },
        { background: '#90a959', color: 'white' },
        { background: '#6494aa', color: 'white' },
        { background: '#192457', color: 'white' },
        { background: '#2b5397', color: 'white' },
        { background: '#a2dcdc', color: 'black' },
        { background: '#27ec5f', color: 'black' },
        { background: '#3ab1ad', color: 'white' },
    ];
    function team(index) {
        return teams$1[index % teams$1.length];
    }
    const goalZone = 'rgba(255, 0, 0, 0.4)';
    const goalZoneOnLight = '#f58f8f'; // without transparency
    const roleZone = 'rgba(0, 0, 255, 0.4)';
    const roleZoneOnLight = '#8f8ff5'; // without transparency
    const obstacle = '#333';
    const blocks = ['#41470b', '#78730d', '#bab217', '#e3d682', '#b3a06f', '#9c7640', '#5a4c35'];
    const hover$1 = 'rgba(180, 180, 255, 0.4)';

    const minScale = 10;
    const maxScale = 100;
    class MapCtrl {
        constructor(root) {
            this.root = root;
            this.vm = {
                transform: {
                    x: 0,
                    y: 0,
                    scale: 20,
                },
            };
        }
        selectedEntity() {
            if (!this.root.vm.dynamic)
                return;
            return this.root.vm.dynamic.entities.find(a => a.id === this.vm.selected);
        }
        nextSelection(pos) {
            if (!pos || !this.root.vm.dynamic)
                return;
            const selected = this.selectedEntity();
            const agents = this.root.vm.dynamic.entities.filter(a => samePos(a.pos, pos));
            agents.reverse(); // opposite of rendering order
            return agents.find(a => !selected || compareEntity(selected, a));
        }
        select(pos) {
            var _a;
            this.vm.selected = (_a = this.nextSelection(pos)) === null || _a === void 0 ? void 0 : _a.id;
            this.root.redraw();
        }
        invPos(pos, bounds) {
            // relative to bounds
            const x = pos[0] - bounds.x;
            const y = pos[1] - bounds.y;
            if (x < 0 || x > bounds.width || y < 0 || y > bounds.height)
                return;
            // relative to transform
            const p = [
                Math.floor((x - this.vm.transform.x) / this.vm.transform.scale),
                Math.floor((y - this.vm.transform.y) / this.vm.transform.scale),
            ];
            // relative to grid
            if (this.root.vm.static) {
                return [mod(p[0], this.root.vm.static.grid.width), mod(p[1], this.root.vm.static.grid.height)];
            }
            else
                return p;
        }
        zoom(center, factor) {
            if (this.vm.transform.scale * factor < minScale)
                factor = minScale / this.vm.transform.scale;
            if (this.vm.transform.scale * factor > maxScale)
                factor = maxScale / this.vm.transform.scale;
            this.vm.transform = {
                x: center[0] + (this.vm.transform.x - center[0]) * factor,
                y: center[1] + (this.vm.transform.y - center[1]) * factor,
                scale: this.vm.transform.scale * factor,
            };
        }
    }
    function mapView(ctrl, opts) {
        return h('canvas', {
            attrs: (opts === null || opts === void 0 ? void 0 : opts.size)
                ? {
                    width: opts.size,
                    height: opts.size,
                }
                : undefined,
            hook: {
                insert(vnode) {
                    const elm = vnode.elm;
                    if (opts === null || opts === void 0 ? void 0 : opts.size)
                        render(elm, ctrl, opts);
                    else
                        new window.ResizeObserver((entries) => {
                            for (const entry of entries) {
                                elm.width = entry.contentRect.width;
                                elm.height = entry.contentRect.height;
                                requestAnimationFrame(() => render(elm, ctrl, opts));
                            }
                        }).observe(elm);
                    const mouseup = (ev) => {
                        if (ctrl.vm.dragging || ctrl.vm.zooming)
                            ev.preventDefault();
                        if (ctrl.vm.dragging && !ctrl.vm.dragging.started) {
                            const pos = eventPosition(ev) || ctrl.vm.dragging.first;
                            ctrl.select(ctrl.invPos(pos, elm.getBoundingClientRect()));
                        }
                        ctrl.vm.dragging = undefined;
                        ctrl.vm.zooming = undefined;
                    };
                    const mousemove = (ev) => {
                        const zoom = eventZoom(ev);
                        if (ctrl.vm.zooming && zoom) {
                            ctrl.vm.transform = Object.assign({}, ctrl.vm.zooming.initialTransform);
                            ctrl.zoom([
                                (ctrl.vm.zooming.zoom.center[0] + zoom.center[0]) / 2,
                                (ctrl.vm.zooming.zoom.center[1] + zoom.center[1]) / 2,
                            ], zoom.distance / ctrl.vm.zooming.zoom.distance);
                            ev.preventDefault();
                            return;
                        }
                        const pos = eventPosition(ev);
                        if (pos) {
                            const inv = ctrl.invPos(pos, elm.getBoundingClientRect());
                            if (inv)
                                ctrl.root.setHover(inv);
                        }
                        if (ctrl.vm.dragging && pos) {
                            if (ctrl.vm.dragging.started || distanceSq(ctrl.vm.dragging.first, pos) > 20 * 20) {
                                ctrl.vm.dragging.started = true;
                                ctrl.vm.transform.x += pos[0] - ctrl.vm.dragging.latest[0];
                                ctrl.vm.transform.y += pos[1] - ctrl.vm.dragging.latest[1];
                                ctrl.vm.dragging.latest = pos;
                            }
                            ev.preventDefault();
                        }
                    };
                    const mousedown = (ev) => {
                        if (ev.button !== undefined && ev.button !== 0)
                            return; // only left click
                        const pos = eventPosition(ev);
                        const zoom = eventZoom(ev);
                        if (zoom) {
                            ctrl.vm.zooming = {
                                initialTransform: Object.assign({}, ctrl.vm.transform),
                                zoom,
                            };
                        }
                        else if (pos) {
                            ctrl.vm.dragging = {
                                first: pos,
                                latest: pos,
                                started: false,
                            };
                        }
                        if (zoom || pos) {
                            ev.preventDefault();
                            requestAnimationFrame(() => render(ev.target, ctrl, opts, true));
                        }
                    };
                    const wheel = (ev) => {
                        ev.preventDefault();
                        ctrl.zoom([ev.offsetX, ev.offsetY], Math.pow(3 / 2, -ev.deltaY / (ev.deltaMode ? 6.25 : 100)));
                        requestAnimationFrame(() => render(ev.target, ctrl, opts));
                    };
                    elm.massim = {
                        unbinds: (opts === null || opts === void 0 ? void 0 : opts.viewOnly)
                            ? [unbindable(document, 'mousemove', mousemove, { passive: false })]
                            : [
                                unbindable(elm, 'mousedown', mousedown, { passive: false }),
                                unbindable(elm, 'touchstart', mousedown, { passive: false }),
                                unbindable(elm, 'wheel', wheel, { passive: false }),
                                unbindable(document, 'mouseup', mouseup),
                                unbindable(document, 'touchend', mouseup),
                                unbindable(document, 'mousemove', mousemove, { passive: false }),
                                unbindable(document, 'touchmove', mousemove, { passive: false }),
                            ],
                    };
                },
                update(_, vnode) {
                    render(vnode.elm, ctrl, opts);
                },
                destroy(vnode) {
                    var _a;
                    const unbinds = (_a = vnode.elm.massim) === null || _a === void 0 ? void 0 : _a.unbinds;
                    if (unbinds)
                        for (const unbind of unbinds)
                            unbind();
                },
            },
        });
    }
    function unbindable(el, eventName, callback, options) {
        el.addEventListener(eventName, callback, options);
        return () => el.removeEventListener(eventName, callback, options);
    }
    function eventZoom(e) {
        var _a;
        if (((_a = e.targetTouches) === null || _a === void 0 ? void 0 : _a.length) !== 2)
            return;
        return {
            center: [
                (e.targetTouches[0].clientX + e.targetTouches[1].clientX) / 2,
                (e.targetTouches[0].clientY + e.targetTouches[1].clientY) / 2,
            ],
            distance: Math.max(20, Math.hypot(e.targetTouches[0].clientX - e.targetTouches[1].clientX, e.targetTouches[0].clientY - e.targetTouches[1].clientY)),
        };
    }
    function eventPosition(e) {
        var _a;
        if (e.clientX || e.clientX === 0)
            return [e.clientX, e.clientY];
        if ((_a = e.targetTouches) === null || _a === void 0 ? void 0 : _a[0])
            return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
        return;
    }
    function distanceSq(a, b) {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        return dx * dx + dy * dy;
    }
    function mod(a, b) {
        return ((a % b) + b) % b;
    }
    function render(canvas, ctrl, opts, raf = false) {
        const vm = ctrl.vm;
        const width = canvas.width, height = canvas.height;
        const ctx = canvas.getContext('2d');
        ctx.save();
        // font
        ctx.textAlign = 'center';
        ctx.font = '0.4px Helvetica';
        // fill background
        ctx.fillStyle = '#eee';
        ctx.fillRect(0, 0, width, height);
        // draw grid
        const transform = ctrl.vm.transform;
        const selectedEntity = ctrl.selectedEntity();
        if ((opts === null || opts === void 0 ? void 0 : opts.viewOnly) && selectedEntity) {
            // auto center to selection
            transform.scale = Math.min(canvas.width, canvas.height) / (selectedEntity.vision * 2 + 3);
            transform.x = canvas.width / 2 - (selectedEntity.pos[0] + 0.5) * transform.scale;
            transform.y = canvas.height / 2 - (selectedEntity.pos[1] + 0.5) * transform.scale;
        }
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);
        const ymin = Math.floor(-transform.y / transform.scale);
        const xmin = Math.floor(-transform.x / transform.scale);
        const ymax = ymin + Math.ceil(canvas.height / transform.scale);
        const xmax = xmin + Math.ceil(canvas.width / transform.scale);
        ctx.fillStyle = '#ddd';
        for (let y = ymin; y <= ymax; y++) {
            for (let x = xmin + ((((xmin + y) % 2) + 2) % 2); x <= xmax; x += 2) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
        if (ctrl.root.vm.static && ctrl.root.vm.dynamic) {
            const grid = ctrl.root.vm.static.grid, maxEnergy = ctrl.root.vm.static.maxEnergy;
            const criminals = new Set(ctrl.root.vm.dynamic.violations.map(v => v.who));
            for (let dy = Math.floor(ymin / grid.height) * grid.height; dy <= ymax + grid.height; dy += grid.height) {
                for (let dx = Math.floor(xmin / grid.width) * grid.width; dx <= xmax + grid.width; dx += grid.width) {
                    // goal zones
                    ctx.fillStyle = goalZone;
                    for (const zone of ctrl.root.vm.dynamic.goalZones) {
                        selectArea(ctx, dx + zone.pos[0], dy + zone.pos[1], zone.r);
                        ctx.fill();
                    }
                    // role zones
                    ctx.fillStyle = roleZone;
                    for (const zone of ctrl.root.vm.dynamic.roleZones) {
                        selectArea(ctx, dx + zone.pos[0], dy + zone.pos[1], zone.r);
                        ctx.fill();
                    }
                    // obstacles
                    ctx.fillStyle = obstacle;
                    for (const obstacle of ctrl.root.vm.dynamic.obstacles) {
                        if (visible(xmin, xmax, ymin, ymax, obstacle.pos, dx, dy)) {
                            ctx.fillRect(dx + obstacle.pos[0] - 0.04, dy + obstacle.pos[1] - 0.04, 1.08, 1.08);
                        }
                    }
                    // draw axis
                    ctx.globalCompositeOperation = 'difference';
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 0.3;
                    ctx.beginPath();
                    ctx.moveTo(dx - 1.5, dy);
                    ctx.lineTo(dx + 1.5, dy);
                    ctx.moveTo(dx, dy - 1.5);
                    ctx.lineTo(dx, dy + 1.5);
                    ctx.stroke();
                    ctx.globalCompositeOperation = 'source-over';
                    // dispensers
                    for (const dispenser of ctrl.root.vm.dynamic.dispensers) {
                        if (visible(xmin, xmax, ymin, ymax, dispenser.pos, dx, dy)) {
                            ctx.lineWidth = 2 * 0.025;
                            const color = blocks[ctrl.root.vm.static.blockTypes.indexOf(dispenser.type) % blocks.length];
                            const r1 = rect(1, dx + dispenser.pos[0], dy + dispenser.pos[1], 0.025);
                            drawBlock(ctx, r1, color, 'white', 'black');
                            const r2 = rect(1, dx + dispenser.pos[0], dy + dispenser.pos[1], 5 * 0.025);
                            drawBlock(ctx, r2, color, 'white', 'black');
                            const r3 = rect(1, dx + dispenser.pos[0], dy + dispenser.pos[1], 9 * 0.025);
                            drawBlock(ctx, r3, color, 'white', 'black');
                            ctx.fillStyle = 'white';
                            ctx.fillText(dispenser.type, dx + dispenser.pos[0] + 0.5, dy + dispenser.pos[1] + 0.5 + helveticaBaseline(0.4));
                        }
                    }
                    // blocks
                    drawBlocks(ctx, dx, dy, ctrl.root.vm.static, ctrl.root.vm.dynamic.blocks.filter(b => visible(xmin, xmax, ymin, ymax, b.pos, dx, dy)));
                    // agents
                    for (const agent of ctrl.root.vm.dynamic.entities) {
                        if (visible(xmin, xmax, ymin, ymax, agent.pos, dx, dy)) {
                            const teamIndex = ctrl.root.vm.teamNames.indexOf(agent.team);
                            drawEntity(ctx, dx, dy, agent, teamIndex);
                            if (criminals.has(agent.name) &&
                                agent.id != ctrl.vm.selected &&
                                (!ctrl.root.vm.hover || !samePos(agent.pos, ctrl.root.vm.hover))) {
                                drawEnergyBar(ctx, dx, dy, agent.pos, 0.9, agent.energy / maxEnergy);
                            }
                        }
                        // agent action
                        if (agent.action == 'clear' && agent.actionResult.indexOf('failed_') != 0) {
                            const x = dx + agent.pos[0] + parseInt(agent.actionParams[0], 10);
                            const y = dy + agent.pos[1] + parseInt(agent.actionParams[1], 10);
                            ctx.lineWidth = 0.05;
                            ctx.strokeStyle = 'red';
                            selectArea(ctx, x, y, 1);
                            ctx.stroke();
                        }
                    }
                    // attachables of selected agent
                    if (selectedEntity === null || selectedEntity === void 0 ? void 0 : selectedEntity.attached) {
                        ctx.fillStyle = hover$1;
                        for (const attached of selectedEntity.attached) {
                            if (!samePos(attached, selectedEntity.pos)) {
                                ctx.fillRect(dx + attached[0], dy + attached[1], 1, 1);
                            }
                        }
                    }
                    // clear events
                    for (const clear of ctrl.root.vm.dynamic.clear) {
                        ctx.lineWidth = 0.1;
                        ctx.strokeStyle = 'red';
                        selectArea(ctx, dx + clear.pos[0], dy + clear.pos[1], clear.r);
                        ctx.stroke();
                    }
                    // hover
                    if (ctrl.root.vm.hover) {
                        drawHover(ctx, ctrl, ctrl.root.vm.static, ctrl.root.vm.dynamic, ctrl.root.vm.teamNames, dx, dy, ctrl.root.vm.hover);
                    }
                }
            }
            // fog of war
            for (let dy = Math.floor(ymin / grid.height) * grid.height; dy <= ymax + grid.height; dy += grid.height) {
                for (let dx = Math.floor(xmin / grid.width) * grid.width; dx <= xmax + grid.width; dx += grid.width) {
                    for (const agent of ctrl.root.vm.dynamic.entities) {
                        if (agent.id === ctrl.vm.selected) {
                            drawFogOfWar(ctx, ctrl.root.vm.static, dx, dy, agent);
                            drawEnergyBar(ctx, dx, dy, agent.pos, 2, agent.energy / ctrl.root.vm.static.maxEnergy);
                        }
                    }
                }
            }
        }
        ctx.restore();
        if (raf && (vm.dragging || vm.zooming)) {
            requestAnimationFrame(() => render(canvas, ctrl, opts, true));
        }
    }
    function visible(xmin, xmax, ymin, ymax, pos, dx, dy) {
        return xmin <= pos[0] + dx && pos[0] + dx <= xmax && ymin <= pos[1] + dy && pos[1] + dy <= ymax;
    }
    function drawFogOfWar(ctx, st, dx, dy, agent) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        const top = dy - st.grid.height + agent.pos[1] + agent.vision + 1;
        ctx.fillRect(dx, top, st.grid.width, st.grid.height - 2 * agent.vision - 1); // above
        ctx.fillRect(dx - st.grid.width + agent.pos[0] + agent.vision + 1, dy + agent.pos[1] - agent.vision, st.grid.width - 2 * agent.vision - 1, 2 * agent.vision + 1);
        for (let x = -agent.vision; x <= agent.vision; x++) {
            for (let y = -agent.vision; y <= agent.vision; y++) {
                if (Math.abs(x) + Math.abs(y) > agent.vision) {
                    ctx.fillRect(dx + agent.pos[0] + x, dy + agent.pos[1] + y, 1, 1);
                }
            }
        }
    }
    function drawHover(ctx, ctrl, st, world, teamNames, dx, dy, hover) {
        if (hover[0] < 0 || hover[0] >= st.grid.width || hover[1] < 0 || hover[1] >= st.grid.height)
            return;
        ctx.beginPath();
        ctx.fillStyle = hover$1;
        ctx.fillRect(dx + hover[0], dy + hover[1], 1, 1);
        for (const attachable of world.entities.concat(world.blocks)) {
            if (samePos(attachable.pos, hover) && attachable.attached) {
                for (const pos of attachable.attached) {
                    ctx.fillRect(dx + pos[0], dy + pos[1], 1, 1);
                }
            }
        }
        const nextSelection = ctrl.nextSelection(hover);
        ctx.lineWidth = 0.1;
        for (const agent of world.entities) {
            if (taxicab(agent.pos, hover) <= agent.vision) {
                ctx.strokeStyle = team(teamNames.indexOf(agent.team)).background;
                selectArea(ctx, dx + agent.pos[0], dy + agent.pos[1], 5);
                ctx.stroke();
                if (nextSelection && agent.id == nextSelection.id) {
                    drawEnergyBar(ctx, dx, dy, agent.pos, 1.2, agent.energy / st.maxEnergy);
                }
            }
        }
    }
    function rect(blockSize, x, y, margin) {
        return {
            x1: x * blockSize + margin,
            y1: y * blockSize + margin,
            x2: x * blockSize + blockSize - margin,
            y2: y * blockSize + blockSize - margin,
            width: blockSize - 2 * margin,
            height: blockSize - 2 * margin,
        };
    }
    function drawEnergyBar(ctx, dx, dy, pos, size, ratio) {
        ctx.fillStyle = 'red';
        ctx.fillRect(dx + pos[0] + 0.5 - size / 2, dy + pos[1] - size * 0.2, size, size * 0.1);
        ctx.fillStyle = 'green';
        ctx.fillRect(dx + pos[0] + 0.5 - size / 2, dy + pos[1] - size * 0.2, size * ratio, size * 0.1);
    }
    function drawEntity(ctx, dx, dy, agent, teamIndex) {
        ctx.lineWidth = 0.125;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(dx + agent.pos[0] + 0.5, dy + agent.pos[1]);
        ctx.lineTo(dx + agent.pos[0] + 0.5, dy + agent.pos[1] + 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(dx + agent.pos[0], dy + agent.pos[1] + 0.5);
        ctx.lineTo(dx + agent.pos[0] + 1, dy + agent.pos[1] + 0.5);
        ctx.stroke();
        const style = team(teamIndex);
        if (teamIndex % 2 === 0) {
            ctx.lineWidth = 0.05;
            const margin = (1 - 15 / 16 / Math.sqrt(2)) / 2;
            const r = rect(1, dx + agent.pos[0], dy + agent.pos[1], margin);
            drawBlock(ctx, r, style.background, 'white', 'black');
        }
        else {
            ctx.lineWidth = 0.04;
            const r = rect(1, dx + agent.pos[0], dy + agent.pos[1], 0.0625);
            drawRotatedBlock(ctx, r, style.background, 'white', 'black');
        }
        if (agent.name) {
            ctx.fillStyle = style.color;
            ctx.fillText(shortEntityName(agent.name), dx + agent.pos[0] + 0.5, dy + agent.pos[1] + 0.5 + helveticaBaseline(0.4));
        }
    }
    function drawBlocks(ctx, dx, dy, st, blocks$1) {
        for (const block of blocks$1) {
            ctx.lineWidth = 0.05;
            const r = rect(1, dx + block.pos[0], dy + block.pos[1], 0.025);
            drawBlock(ctx, r, blocks[st.blockTypes.indexOf(block.type) % blocks.length], 'white', 'black');
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.font = '0.5px Helvetica';
            ctx.fillText(block.type, dx + block.pos[0] + 0.5, dy + block.pos[1] + 0.5 + helveticaBaseline(0.5));
        }
    }
    function drawBlock(ctx, r, color, light, dark) {
        ctx.fillStyle = color;
        ctx.fillRect(r.x1, r.y1, r.width, r.height);
        ctx.beginPath();
        ctx.moveTo(r.x1, r.y2);
        ctx.lineTo(r.x1, r.y1);
        ctx.lineTo(r.x2, r.y1);
        ctx.strokeStyle = light;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r.x2, r.y1);
        ctx.lineTo(r.x2, r.y2);
        ctx.lineTo(r.x1, r.y2);
        ctx.strokeStyle = dark;
        ctx.stroke();
    }
    function selectArea(ctx, x, y, radius) {
        ctx.beginPath();
        ctx.moveTo(x - radius, y + 0.5);
        ctx.lineTo(x + 0.5, y - radius);
        ctx.lineTo(x + 1 + radius, y + 0.5);
        ctx.lineTo(x + 0.5, y + radius + 1);
        ctx.lineTo(x - radius, y + 0.5);
        ctx.closePath();
    }
    function drawRotatedBlock(ctx, r, color, light, dark) {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(r.x1, (r.y1 + r.y2) / 2);
        ctx.lineTo((r.x1 + r.x2) / 2, r.y1);
        ctx.lineTo(r.x2, (r.y1 + r.y2) / 2);
        ctx.lineTo((r.x1 + r.x2) / 2, r.y2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r.x1, (r.y1 + r.y2) / 2);
        ctx.lineTo((r.x1 + r.x2) / 2, r.y1);
        ctx.lineTo(r.x2, (r.y1 + r.y2) / 2);
        ctx.strokeStyle = light;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r.x2, (r.y1 + r.y2) / 2);
        ctx.lineTo((r.x1 + r.x2) / 2, r.y2);
        ctx.lineTo(r.x1, (r.y1 + r.y2) / 2);
        ctx.strokeStyle = dark;
        ctx.stroke();
    }
    function shortEntityName(name) {
        if (name.startsWith('agent'))
            name = name.slice('agent'.length);
        const match = name.match(/^-?[A-Za-z][A-Za-z-_]*([0-9]+)$/);
        return match ? match[1] : name;
    }
    function helveticaBaseline(size) {
        return size * 0.33;
    }

    class Ctrl {
        constructor(redraw, replayPath) {
            this.redraw = redraw;
            this.vm = {
                state: 'connecting',
                teamNames: [],
            };
            if (replayPath)
                this.replay = new ReplayCtrl(this, replayPath);
            else
                this.connect();
            this.map = new MapCtrl(this);
            this.maps = [];
        }
        connect() {
            const protocol = document.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const path = document.location.pathname.substring(0, document.location.pathname.lastIndexOf('/'));
            const ws = new WebSocket(protocol + '//' + document.location.host + path + '/live/monitor');
            ws.onmessage = msg => {
                const data = JSON.parse(msg.data);
                if (data.grid)
                    this.setStatic(data);
                else
                    this.setDynamic(data);
                this.redraw();
            };
            ws.onopen = () => {
                console.log('Connected');
                this.vm.state = 'online';
                this.redraw();
            };
            ws.onclose = () => {
                console.log('Disconnected');
                setTimeout(() => this.connect(), 5000);
                this.vm.state = 'offline';
                this.redraw();
            };
        }
        setStatic(st) {
            console.log(st);
            if (st) {
                st.blockTypes.sort(compareNumbered);
                this.vm.teamNames = Object.keys(st.teams);
                this.vm.teamNames.sort(compareNumbered);
            }
            this.vm.static = st;
            this.resetTransform();
        }
        resetTransform() {
            var _a;
            const margin = 2;
            const grid = (_a = this.vm.static) === null || _a === void 0 ? void 0 : _a.grid;
            if (!grid)
                return;
            const scale = Math.max(minScale, Math.min(maxScale, Math.min(window.innerWidth, window.innerHeight) / (2 * margin + Math.max(grid.width, grid.height))));
            this.map.vm.transform = {
                x: (window.innerWidth - scale * (grid.width + 2 * margin)) / 2 + scale * margin,
                y: (window.innerHeight - scale * (grid.height + 2 * margin)) / 2 + scale * margin,
                scale,
            };
        }
        setDynamic(dynamic) {
            console.log(dynamic);
            if (dynamic)
                dynamic.entities.sort(compareEntity);
            this.vm.dynamic = dynamic;
        }
        toggleMaps() {
            if (this.vm.dynamic && !this.maps.length) {
                this.maps = this.vm.dynamic.entities.map(agent => {
                    const ctrl = new MapCtrl(this);
                    ctrl.vm.selected = agent.id;
                    return ctrl;
                });
            }
            else {
                this.maps = [];
            }
            this.redraw();
        }
        setHover(pos) {
            const changed = (!pos && this.vm.hover) || (pos && !this.vm.hover) || (pos && this.vm.hover && !samePos(pos, this.vm.hover));
            this.vm.hover = pos;
            if (changed)
                this.redraw();
        }
    }
    class ReplayCtrl {
        constructor(root, path) {
            this.root = root;
            this.path = path;
            this.step = -1;
            this.cache = new Map();
            if (path.endsWith('/'))
                this.path = path.substring(0, path.length - 1);
            this.suffix = location.pathname == '/' ? `?sri=${Math.random().toString(36).slice(-8)}` : '';
            this.loadStatic();
        }
        stop() {
            if (this.timer)
                clearInterval(this.timer);
            this.timer = undefined;
            this.root.redraw();
        }
        start() {
            if (!this.timer)
                this.timer = setInterval(() => {
                    if (this.root.vm.state !== 'connecting')
                        this.setStep(this.step + 1);
                }, 1000);
            this.root.redraw();
        }
        loadStatic() {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `${this.path}/static.json${this.suffix}`);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    this.root.setStatic(JSON.parse(xhr.responseText));
                    this.setStep(this.step);
                }
                else {
                    this.root.vm.state = 'error';
                }
                this.root.redraw();
            };
            xhr.onerror = () => {
                this.root.vm.state = 'error';
                this.root.redraw();
            };
            xhr.send();
        }
        loadDynamic(step) {
            // got from cache
            const entry = this.cache.get(step);
            if (entry) {
                this.root.setDynamic(entry);
                this.root.vm.state = this.root.vm.dynamic && this.root.vm.dynamic.step == step ? 'online' : 'connecting';
                this.root.redraw();
                return;
            }
            const onerror = () => {
                this.root.vm.state = 'error';
                this.stop();
                this.root.redraw();
            };
            const group = step > 0 ? Math.floor(step / 5) * 5 : 0;
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `${this.path}/${group}.json${this.suffix}`);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    // write to cache
                    if (this.cache.size > 100)
                        this.cache.clear();
                    for (const s in response)
                        this.cache.set(parseInt(s, 10), response[s]);
                    if (response[step]) {
                        this.root.setDynamic(response[step]);
                        this.root.vm.state = this.root.vm.dynamic && this.root.vm.dynamic.step == step ? 'online' : 'connecting';
                        this.root.redraw();
                        return;
                    }
                }
                // status !== 200 or !response[step]
                onerror();
            };
            xhr.onerror = onerror;
            xhr.send();
        }
        setStep(s) {
            // keep step in bounds
            this.step = Math.max(-1, s);
            if (this.root.vm.static && this.step >= this.root.vm.static.steps) {
                this.stop();
                this.step = this.root.vm.static.steps - 1;
            }
            // show connecting after a while
            this.root.vm.state = 'connecting';
            setTimeout(() => this.root.redraw(), 500);
            // update url
            if (history.replaceState)
                history.replaceState({}, document.title, '#' + this.step);
            this.loadDynamic(this.step);
        }
        name() {
            const parts = this.path.split('/');
            return parts[parts.length - 1];
        }
        toggle() {
            if (this.timer)
                this.stop();
            else
                this.start();
        }
        playing() {
            return !!this.timer;
        }
    }

    function replay(ctrl) {
        return h('div.box.replay', [
            h('div', [h('strong', 'Replay:'), ' ', ctrl.name()]),
            h('div', [
                h('button', { on: { click: () => ctrl.setStep(-1) } }, '|<<'),
                h('button', { on: { click: () => ctrl.setStep(ctrl.step - 10) } }, '<<'),
                h('button', {
                    on: { click: () => ctrl.toggle() },
                }, ctrl.playing() ? '||' : '>'),
                h('button', { on: { click: () => ctrl.setStep(ctrl.step + 10) } }, '>>'),
                h('button', { on: { click: () => ctrl.setStep(99999999) } }, '>>|'),
            ]),
        ]);
    }
    function simplePlural(n, singular) {
        if (n === 1)
            return '1 ' + singular;
        else
            return n + ' ' + singular + 's';
    }
    function teams(teamNames, world) {
        return world.scores.map(([name, score]) => h('div.team', { style: team(teamNames.indexOf(name)) }, `${name}: $${score}`));
    }
    function tasks(ctrl, st, world) {
        return world.tasks.map(task => taskDetails(ctrl, st, world, task));
    }
    function norms(ctrl, world) {
        return h('ul', world.norms.map(norm => {
            const who = norm.level === 'individual' ? 'each agent' : 'a team';
            const what = norm.requirements.map(requirement => {
                if (requirement.type === 'BLOCK')
                    return h('li', `carry at most ${requirement.quantity} of ${requirement.name}`);
                else if (requirement.type === 'ROLE')
                    return h('li', `have at most ${requirement.quantity} ${requirement.name} agents`);
                else
                    return h('li', `undefined`);
            });
            return h('li', [
                h('strong', norm.name),
                ` from ${norm.start} to ${norm.until}: ${who} must`,
                h('ul', what),
                `or lose ${norm.punishment} energy`,
            ]);
        }));
    }
    function hover(ctrl, st, world, pos) {
        // pos
        const r = [h('li', `x = ${pos[0]}, y = ${pos[1]}`)];
        // obstacles
        for (const obstacle$1 of world.obstacles) {
            if (samePos(obstacle$1.pos, pos)) {
                r.push(h('li', h('span', { style: { background: obstacle, color: 'white' } }, 'obstacle')));
            }
        }
        // goal zones
        for (const zone of world.goalZones) {
            if (taxicab(zone.pos, pos) <= zone.r) {
                r.push(h('li', h('span', { style: { background: goalZoneOnLight, color: 'white' } }, 'goal zone')));
            }
        }
        // role zones
        for (const zone of world.roleZones) {
            if (taxicab(zone.pos, pos) <= zone.r) {
                r.push(h('li', h('span', { style: { background: roleZoneOnLight, color: 'white' } }, 'role zone')));
            }
        }
        // dispensers
        for (const dispenser of world.dispensers) {
            if (samePos(dispenser.pos, pos)) {
                r.push(h('li', ['dispenser: type = ', blockSpan(st, dispenser.type)]));
            }
        }
        // blocks
        for (const block of world.blocks) {
            if (samePos(block.pos, pos)) {
                r.push(h('li', ['block: type = ', blockSpan(st, block.type)]));
            }
        }
        // entities
        for (const entity of world.entities) {
            if (samePos(entity.pos, pos)) {
                r.push(h('li', ['entity: ', ...entityDescription(ctrl, entity)]));
            }
        }
        return h('ul', r);
    }
    function blockSpan(st, type) {
        return h('span', {
            style: {
                background: blocks[st.blockTypes.indexOf(type)],
                color: 'white',
            },
        }, type);
    }
    function entityDescription(ctrl, entity) {
        var _a;
        const r = [
            'name = ',
            h('span', {
                style: team(ctrl.vm.teamNames.indexOf(entity.team)),
            }, entity.name),
            `, role = ${entity.role}, energy = ${entity.energy}`,
        ];
        if (entity.action && entity.actionResult)
            r.push(', ', h('span', {
                class: {
                    [entity.action]: true,
                    [entity.actionResult]: true,
                },
            }, `${entity.action}(…) = ${entity.actionResult}`));
        if ((_a = entity.attached) === null || _a === void 0 ? void 0 : _a.length)
            r.push(`, ${entity.attached.length}\xa0attached`);
        if (entity.deactivated)
            r.push(', deactivated');
        return r;
    }
    function taskDetails(ctrl, st, dynamic, task) {
        const xs = task.requirements.map(b => Math.abs(b.pos[0]));
        const ys = task.requirements.map(b => Math.abs(b.pos[1]));
        const yMin = Math.min(0, ...ys);
        const width = 2 * Math.max(0, ...xs) + 1;
        const height = Math.max(0, ...ys) + 1 - yMin;
        const elementWidth = 218;
        const gridSize = Math.min(Math.floor(elementWidth / width), 35);
        const elementHeight = gridSize * height;
        const render = function (vnode) {
            const canvas = vnode.elm;
            const ctx = canvas.getContext('2d');
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate((elementWidth - gridSize) / 2, 0);
            ctx.scale(gridSize, gridSize);
            ctx.translate(0, -yMin);
            drawEntity(ctx, 0, 0, { pos: [0, 0] }, 0);
            drawBlocks(ctx, 0, 0, st, task.requirements);
            ctx.restore();
        };
        return h('div.box', [
            h('p', `$${task.reward} for ${task.name} until step ${task.deadline} (${simplePlural(task.requirements.length, 'block')})`),
            h('canvas', {
                attrs: {
                    width: elementWidth,
                    height: elementHeight,
                },
                hook: {
                    insert: render,
                    update: (_, vnode) => render(vnode),
                },
            }),
        ]);
    }
    function disconnected() {
        return h('div.box', [
            h('p', 'Live server not connected.'),
            h('a', {
                attrs: { href: document.location.pathname + document.location.search },
            }, 'Retry now.'),
        ]);
    }
    function box(child) {
        return child ? h('div.box', child) : undefined;
    }
    function overlay(ctrl) {
        const selectedEntity = ctrl.map.selectedEntity();
        return h('div#overlay', [
            ctrl.vm.static && (ctrl.replay ? replay(ctrl.replay) : h('div.box', ctrl.vm.static.sim)),
            ctrl.vm.state === 'error' || ctrl.vm.state === 'offline'
                ? ctrl.replay
                    ? h('div.box', ctrl.vm.static ? 'Could not load step' : 'Could not load replay')
                    : disconnected()
                : undefined,
            ctrl.vm.static && ctrl.vm.dynamic
                ? h('div.box', [`Step: ${ctrl.vm.dynamic.step} / ${ctrl.vm.static.steps - 1}`])
                : undefined,
            ctrl.vm.state === 'connecting' ? h('div.box', ['Connecting ...', h('div.loader')]) : undefined,
            ctrl.vm.state === 'online' && (!ctrl.vm.static || !ctrl.vm.dynamic)
                ? h('div.box', ['Waiting ...', h('div.loader')])
                : undefined,
            ...(ctrl.vm.state === 'online' && ctrl.vm.static && ctrl.vm.dynamic
                ? [
                    h('div.box', teams(ctrl.vm.teamNames, ctrl.vm.dynamic)),
                    h('div.box', [
                        h('button', {
                            on: {
                                click: () => ctrl.toggleMaps(),
                            },
                        }, ctrl.maps.length ? 'Global view' : 'Entity view'),
                        ctrl.maps.length
                            ? undefined
                            : h('button', {
                                on: {
                                    click() {
                                        ctrl.resetTransform();
                                        ctrl.redraw();
                                    },
                                },
                            }, 'Reset zoom'),
                    ]),
                    selectedEntity ? box(h('div', ['Selected entity: ', ...entityDescription(ctrl, selectedEntity)])) : undefined,
                    ...tasks(ctrl, ctrl.vm.static, ctrl.vm.dynamic),
                    h('div.box', norms(ctrl, ctrl.vm.dynamic)),
                    ctrl.vm.hover ? box(hover(ctrl, ctrl.vm.static, ctrl.vm.dynamic, ctrl.vm.hover)) : undefined,
                ]
                : []),
        ]);
    }

    function view$1(ctrl) {
        return h('div#monitor', [ctrl.maps.length ? agentView(ctrl) : mapView(ctrl.map), overlay(ctrl)]);
    }
    function agentView(ctrl) {
        if (!ctrl.vm.static)
            return;
        return h('div.maps', ctrl.maps.map(m => {
            var _a;
            const entity = m.selectedEntity();
            if (!entity)
                return;
            const violations = ((_a = ctrl.vm.dynamic) === null || _a === void 0 ? void 0 : _a.violations.filter(v => v.who == entity.name).map(v => v.norm)) || [];
            return h('div', {
                class: entity.action && entity.actionResult
                    ? {
                        map: true,
                        [entity.action]: true,
                        [entity.actionResult]: true,
                    }
                    : {
                        map: true,
                    },
            }, [
                h('a.team', {
                    style: m.vm.selected === ctrl.map.vm.selected
                        ? {
                            background: 'white',
                            color: 'black',
                        }
                        : team(ctrl.vm.teamNames.indexOf(entity.team)),
                    on: {
                        click() {
                            ctrl.map.vm.selected = entity.id;
                            ctrl.toggleMaps();
                        },
                    },
                }, `${entity.name} (${entity.pos[0]}|${entity.pos[1]})`),
                mapView(m, {
                    size: 250,
                    viewOnly: true,
                }),
                h('div.meta', [
                    h('div', `role = ${entity.role}, energy = ${entity.energy}` + (entity.deactivated ? ' 🪫' : '')),
                    entity.action ? h('div', `${entity.action}(…) = ${entity.actionResult}`) : undefined,
                    violations.length ? h('div', 'violates ' + violations.join(', ') + ' ⚠️') : undefined,
                ]),
            ]);
        }));
    }

    function makeStatusCtrl(redraw) {
        const vm = {
            state: 'connecting',
        };
        function connect() {
            const protocol = document.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const path = document.location.pathname.substring(0, document.location.pathname.lastIndexOf('/'));
            const ws = new WebSocket(protocol + '//' + document.location.host + path + '/live/status');
            ws.onmessage = msg => {
                const data = JSON.parse(msg.data);
                console.log(data);
                vm.data = data;
                redraw();
            };
            ws.onopen = () => {
                console.log('Connected');
                vm.state = 'online';
                redraw();
            };
            ws.onclose = () => {
                console.log('Disconnected');
                setTimeout(() => connect(), 5000);
                vm.data = undefined;
                vm.state = 'offline';
                redraw();
            };
        }
        connect();
        return {
            vm,
            redraw,
        };
    }

    function view(data) {
        data.entities.sort(compareEntity);
        const teams = [];
        for (const entity of data.entities) {
            if (teams.indexOf(entity.team) == -1)
                teams.push(entity.team);
        }
        return [
            h('h2', `Step ${data.step}/${data.steps - 1}`),
            h('table', [
                h('thead', [h('tr', [h('th', 'Team'), h('th', 'Agent'), h('th', 'Last action'), h('th', 'Last action result')])]),
                h('tbody', data.entities.map(entity => {
                    const teamStyle = { style: team(teams.indexOf(entity.team)) };
                    return h('tr', [
                        h('td', teamStyle, entity.team),
                        h('td', teamStyle, entity.name),
                        h('td', { attrs: { class: entity.action } }, entity.action),
                        h('td', { attrs: { class: entity.actionResult } }, entity.actionResult),
                    ]);
                })),
            ]),
        ];
    }
    function statusView(ctrl) {
        return h('div#status', [
            h('h1', ['Status: ', ctrl.vm.data ? ctrl.vm.data.sim : ctrl.vm.state]),
            ...(ctrl.vm.data ? view(ctrl.vm.data) : []),
        ]);
    }

    const patch = init([classModule, attributesModule, styleModule, eventListenersModule]);
    function Monitor(element) {
        let vnode = element;
        let ctrl;
        let redrawRequested = false;
        const redraw = function () {
            if (redrawRequested)
                return;
            redrawRequested = true;
            requestAnimationFrame(() => {
                redrawRequested = false;
                vnode = patch(vnode, view$1(ctrl));
            });
        };
        const hashChange = function () {
            if (ctrl.replay) {
                const step = parseInt(document.location.hash.substring(1), 10);
                if (step > 0)
                    ctrl.replay.setStep(step);
                else if (!document.location.hash)
                    ctrl.replay.start();
            }
        };
        const replayPath = window.location.search.length > 1 ? window.location.search.substring(1) : undefined;
        ctrl = new Ctrl(redraw, replayPath);
        hashChange();
        window.onhashchange = hashChange;
        redraw();
        /* canvas.addEventListener('mousemove', e => {
          if (!ctrl.vm.static) return;
          ctrl.setHover(invClientPos(canvas, ctrl.vm.static, e.clientX, e.clientY));
        });
        canvas.addEventListener('mouseleave', e => {
          ctrl.setHover(undefined);
        }); */
    }
    function Status(target) {
        let vnode = target;
        let ctrl;
        let redrawRequested = false;
        const redraw = function () {
            if (redrawRequested)
                return;
            redrawRequested = true;
            requestAnimationFrame(() => {
                redrawRequested = false;
                vnode = patch(vnode, statusView(ctrl));
            });
        };
        ctrl = makeStatusCtrl(redraw);
        redraw();
    }

    exports.Monitor = Monitor;
    exports.Status = Status;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
