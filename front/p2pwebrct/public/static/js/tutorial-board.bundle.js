(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/увеличение карточек во время игры.js
  function addCardClickListener(card) {
    card.addEventListener("click", () => {
      currentCardIndex = Array.from(card.parentNode.querySelectorAll(".card")).indexOf(card);
      showCard(card.parentNode.querySelectorAll(".card"));
    });
  }
  function UpdateZones() {
    const zones = document.querySelectorAll(".cards-zone");
    zones.forEach((zone) => {
      const cards = zone.querySelectorAll(".card");
      cards.forEach((card) => {
        if (!card.hasAttribute("data-click-listener")) {
          addCardClickListener(card);
          card.setAttribute("data-click-listener", "true");
        }
      });
    });
  }
  function closeCardZoomModal() {
    document.querySelectorAll(".card-zoom-modal").forEach((el) => {
      if (el._escapeHandler) {
        document.removeEventListener("keydown", el._escapeHandler);
        delete el._escapeHandler;
      }
      el.remove();
    });
  }
  function showCard(cards) {
    closeCardZoomModal();
    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");
    const modalImage = document.createElement("img");
    const firstItem = cards[currentCardIndex]?.querySelector(".card-item");
    modalImage.src = firstItem ? firstItem.src : "";
    modalImage.alt = "";
    modalImage.style.width = "auto";
    modalImage.style.height = "auto";
    modalImage.style.maxHeight = "90vh";
    modalImage.style.maxWidth = "90vw";
    modalImage.style.display = "block";
    modalImage.style.margin = "auto";
    modalImage.draggable = true;
    modalImage.style.cursor = "grab";
    modalContent.appendChild(modalImage);
    const prevButton = document.createElement("prev-button");
    prevButton.id = "prev-button";
    prevButton.innerHTML = '<img src="../img/svg/\u0441\u0442\u0440\u0435\u043B\u0430 2.svg" alt="">';
    const nextButton = document.createElement("next-button");
    nextButton.id = "next-button";
    nextButton.innerHTML = '<img src="../img/svg/\u0441\u0442\u0440\u0435\u043B\u0430 1.svg" alt="">';
    prevButton.addEventListener("click", (ev) => {
      ev.stopPropagation();
      currentCardIndex--;
      if (currentCardIndex < 0) {
        currentCardIndex = cards.length - 1;
      }
      const item = cards[currentCardIndex]?.querySelector(".card-item");
      if (item) {
        modalImage.src = item.src;
      }
    });
    nextButton.addEventListener("click", (ev) => {
      ev.stopPropagation();
      currentCardIndex++;
      if (currentCardIndex >= cards.length) {
        currentCardIndex = 0;
      }
      const item = cards[currentCardIndex]?.querySelector(".card-item");
      if (item) {
        modalImage.src = item.src;
      }
    });
    const modal = document.createElement("div");
    modal.classList.add("modal", "card-zoom-modal");
    modal.appendChild(modalContent);
    modal.appendChild(prevButton);
    modal.appendChild(nextButton);
    document.body.appendChild(modal);
    modal.style.display = "flex";
    modalImage.addEventListener("dragstart", (e) => {
      const card = cards[currentCardIndex];
      if (!card?.classList?.contains?.("card")) {
        e.preventDefault();
        return;
      }
      modalImage.style.cursor = "grabbing";
      beginDragFromZoomImage(card, e);
    });
    modalImage.addEventListener("dragend", () => {
      modalImage.style.cursor = "grab";
    });
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeCardZoomModal();
      }
    });
    const onEscapeZoom = (e) => {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", onEscapeZoom);
        closeCardZoomModal();
      }
    };
    modal._escapeHandler = onEscapeZoom;
    document.addEventListener("keydown", onEscapeZoom);
  }
  var currentCardIndex;
  var init__ = __esm({
    "src/\u0443\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u0438\u0435 \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u0432\u043E \u0432\u0440\u0435\u043C\u044F \u0438\u0433\u0440\u044B.js"() {
      init_card_block();
      currentCardIndex = 0;
      UpdateZones();
    }
  });

  // ../node_modules/engine.io-parser/build/esm/commons.js
  var PACKET_TYPES, PACKET_TYPES_REVERSE, ERROR_PACKET;
  var init_commons = __esm({
    "../node_modules/engine.io-parser/build/esm/commons.js"() {
      PACKET_TYPES = /* @__PURE__ */ Object.create(null);
      PACKET_TYPES["open"] = "0";
      PACKET_TYPES["close"] = "1";
      PACKET_TYPES["ping"] = "2";
      PACKET_TYPES["pong"] = "3";
      PACKET_TYPES["message"] = "4";
      PACKET_TYPES["upgrade"] = "5";
      PACKET_TYPES["noop"] = "6";
      PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
      Object.keys(PACKET_TYPES).forEach((key) => {
        PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
      });
      ERROR_PACKET = { type: "error", data: "parser error" };
    }
  });

  // ../node_modules/engine.io-parser/build/esm/encodePacket.browser.js
  function toArray(data) {
    if (data instanceof Uint8Array) {
      return data;
    } else if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    } else {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
  }
  function encodePacketToBinary(packet, callback) {
    if (withNativeBlob && packet.data instanceof Blob) {
      return packet.data.arrayBuffer().then(toArray).then(callback);
    } else if (withNativeArrayBuffer && (packet.data instanceof ArrayBuffer || isView(packet.data))) {
      return callback(toArray(packet.data));
    }
    encodePacket(packet, false, (encoded) => {
      if (!TEXT_ENCODER) {
        TEXT_ENCODER = new TextEncoder();
      }
      callback(TEXT_ENCODER.encode(encoded));
    });
  }
  var withNativeBlob, withNativeArrayBuffer, isView, encodePacket, encodeBlobAsBase64, TEXT_ENCODER;
  var init_encodePacket_browser = __esm({
    "../node_modules/engine.io-parser/build/esm/encodePacket.browser.js"() {
      init_commons();
      withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
      withNativeArrayBuffer = typeof ArrayBuffer === "function";
      isView = (obj) => {
        return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
      };
      encodePacket = ({ type, data }, supportsBinary, callback) => {
        if (withNativeBlob && data instanceof Blob) {
          if (supportsBinary) {
            return callback(data);
          } else {
            return encodeBlobAsBase64(data, callback);
          }
        } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
          if (supportsBinary) {
            return callback(data);
          } else {
            return encodeBlobAsBase64(new Blob([data]), callback);
          }
        }
        return callback(PACKET_TYPES[type] + (data || ""));
      };
      encodeBlobAsBase64 = (data, callback) => {
        const fileReader = new FileReader();
        fileReader.onload = function() {
          const content = fileReader.result.split(",")[1];
          callback("b" + (content || ""));
        };
        return fileReader.readAsDataURL(data);
      };
    }
  });

  // ../node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
  var chars, lookup, decode;
  var init_base64_arraybuffer = __esm({
    "../node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js"() {
      chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
      for (let i3 = 0; i3 < chars.length; i3++) {
        lookup[chars.charCodeAt(i3)] = i3;
      }
      decode = (base64) => {
        let bufferLength = base64.length * 0.75, len = base64.length, i3, p = 0, encoded1, encoded2, encoded3, encoded4;
        if (base64[base64.length - 1] === "=") {
          bufferLength--;
          if (base64[base64.length - 2] === "=") {
            bufferLength--;
          }
        }
        const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
        for (i3 = 0; i3 < len; i3 += 4) {
          encoded1 = lookup[base64.charCodeAt(i3)];
          encoded2 = lookup[base64.charCodeAt(i3 + 1)];
          encoded3 = lookup[base64.charCodeAt(i3 + 2)];
          encoded4 = lookup[base64.charCodeAt(i3 + 3)];
          bytes[p++] = encoded1 << 2 | encoded2 >> 4;
          bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
          bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
        }
        return arraybuffer;
      };
    }
  });

  // ../node_modules/engine.io-parser/build/esm/decodePacket.browser.js
  var withNativeArrayBuffer2, decodePacket, decodeBase64Packet, mapBinary;
  var init_decodePacket_browser = __esm({
    "../node_modules/engine.io-parser/build/esm/decodePacket.browser.js"() {
      init_commons();
      init_base64_arraybuffer();
      withNativeArrayBuffer2 = typeof ArrayBuffer === "function";
      decodePacket = (encodedPacket, binaryType) => {
        if (typeof encodedPacket !== "string") {
          return {
            type: "message",
            data: mapBinary(encodedPacket, binaryType)
          };
        }
        const type = encodedPacket.charAt(0);
        if (type === "b") {
          return {
            type: "message",
            data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
          };
        }
        const packetType = PACKET_TYPES_REVERSE[type];
        if (!packetType) {
          return ERROR_PACKET;
        }
        return encodedPacket.length > 1 ? {
          type: PACKET_TYPES_REVERSE[type],
          data: encodedPacket.substring(1)
        } : {
          type: PACKET_TYPES_REVERSE[type]
        };
      };
      decodeBase64Packet = (data, binaryType) => {
        if (withNativeArrayBuffer2) {
          const decoded = decode(data);
          return mapBinary(decoded, binaryType);
        } else {
          return { base64: true, data };
        }
      };
      mapBinary = (data, binaryType) => {
        switch (binaryType) {
          case "blob":
            if (data instanceof Blob) {
              return data;
            } else {
              return new Blob([data]);
            }
          case "arraybuffer":
          default:
            if (data instanceof ArrayBuffer) {
              return data;
            } else {
              return data.buffer;
            }
        }
      };
    }
  });

  // ../node_modules/engine.io-parser/build/esm/index.js
  function createPacketEncoderStream() {
    return new TransformStream({
      transform(packet, controller) {
        encodePacketToBinary(packet, (encodedPacket) => {
          const payloadLength = encodedPacket.length;
          let header;
          if (payloadLength < 126) {
            header = new Uint8Array(1);
            new DataView(header.buffer).setUint8(0, payloadLength);
          } else if (payloadLength < 65536) {
            header = new Uint8Array(3);
            const view = new DataView(header.buffer);
            view.setUint8(0, 126);
            view.setUint16(1, payloadLength);
          } else {
            header = new Uint8Array(9);
            const view = new DataView(header.buffer);
            view.setUint8(0, 127);
            view.setBigUint64(1, BigInt(payloadLength));
          }
          if (packet.data && typeof packet.data !== "string") {
            header[0] |= 128;
          }
          controller.enqueue(header);
          controller.enqueue(encodedPacket);
        });
      }
    });
  }
  function totalLength(chunks) {
    return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  }
  function concatChunks(chunks, size) {
    if (chunks[0].length === size) {
      return chunks.shift();
    }
    const buffer = new Uint8Array(size);
    let j = 0;
    for (let i3 = 0; i3 < size; i3++) {
      buffer[i3] = chunks[0][j++];
      if (j === chunks[0].length) {
        chunks.shift();
        j = 0;
      }
    }
    if (chunks.length && j < chunks[0].length) {
      chunks[0] = chunks[0].slice(j);
    }
    return buffer;
  }
  function createPacketDecoderStream(maxPayload, binaryType) {
    if (!TEXT_DECODER) {
      TEXT_DECODER = new TextDecoder();
    }
    const chunks = [];
    let state = 0;
    let expectedLength = -1;
    let isBinary2 = false;
    return new TransformStream({
      transform(chunk, controller) {
        chunks.push(chunk);
        while (true) {
          if (state === 0) {
            if (totalLength(chunks) < 1) {
              break;
            }
            const header = concatChunks(chunks, 1);
            isBinary2 = (header[0] & 128) === 128;
            expectedLength = header[0] & 127;
            if (expectedLength < 126) {
              state = 3;
            } else if (expectedLength === 126) {
              state = 1;
            } else {
              state = 2;
            }
          } else if (state === 1) {
            if (totalLength(chunks) < 2) {
              break;
            }
            const headerArray = concatChunks(chunks, 2);
            expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
            state = 3;
          } else if (state === 2) {
            if (totalLength(chunks) < 8) {
              break;
            }
            const headerArray = concatChunks(chunks, 8);
            const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
            const n = view.getUint32(0);
            if (n > Math.pow(2, 53 - 32) - 1) {
              controller.enqueue(ERROR_PACKET);
              break;
            }
            expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
            state = 3;
          } else {
            if (totalLength(chunks) < expectedLength) {
              break;
            }
            const data = concatChunks(chunks, expectedLength);
            controller.enqueue(decodePacket(isBinary2 ? data : TEXT_DECODER.decode(data), binaryType));
            state = 0;
          }
          if (expectedLength === 0 || expectedLength > maxPayload) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
        }
      }
    });
  }
  var SEPARATOR, encodePayload, decodePayload, TEXT_DECODER, protocol;
  var init_esm = __esm({
    "../node_modules/engine.io-parser/build/esm/index.js"() {
      init_encodePacket_browser();
      init_decodePacket_browser();
      init_commons();
      SEPARATOR = String.fromCharCode(30);
      encodePayload = (packets, callback) => {
        const length2 = packets.length;
        const encodedPackets = new Array(length2);
        let count = 0;
        packets.forEach((packet, i3) => {
          encodePacket(packet, false, (encodedPacket) => {
            encodedPackets[i3] = encodedPacket;
            if (++count === length2) {
              callback(encodedPackets.join(SEPARATOR));
            }
          });
        });
      };
      decodePayload = (encodedPayload, binaryType) => {
        const encodedPackets = encodedPayload.split(SEPARATOR);
        const packets = [];
        for (let i3 = 0; i3 < encodedPackets.length; i3++) {
          const decodedPacket = decodePacket(encodedPackets[i3], binaryType);
          packets.push(decodedPacket);
          if (decodedPacket.type === "error") {
            break;
          }
        }
        return packets;
      };
      protocol = 4;
    }
  });

  // ../node_modules/@socket.io/component-emitter/lib/esm/index.js
  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }
  var init_esm2 = __esm({
    "../node_modules/@socket.io/component-emitter/lib/esm/index.js"() {
      Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
        this._callbacks = this._callbacks || {};
        (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
        return this;
      };
      Emitter.prototype.once = function(event, fn) {
        function on2() {
          this.off(event, on2);
          fn.apply(this, arguments);
        }
        on2.fn = fn;
        this.on(event, on2);
        return this;
      };
      Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
        this._callbacks = this._callbacks || {};
        if (0 == arguments.length) {
          this._callbacks = {};
          return this;
        }
        var callbacks = this._callbacks["$" + event];
        if (!callbacks) return this;
        if (1 == arguments.length) {
          delete this._callbacks["$" + event];
          return this;
        }
        var cb;
        for (var i3 = 0; i3 < callbacks.length; i3++) {
          cb = callbacks[i3];
          if (cb === fn || cb.fn === fn) {
            callbacks.splice(i3, 1);
            break;
          }
        }
        if (callbacks.length === 0) {
          delete this._callbacks["$" + event];
        }
        return this;
      };
      Emitter.prototype.emit = function(event) {
        this._callbacks = this._callbacks || {};
        var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
        for (var i3 = 1; i3 < arguments.length; i3++) {
          args[i3 - 1] = arguments[i3];
        }
        if (callbacks) {
          callbacks = callbacks.slice(0);
          for (var i3 = 0, len = callbacks.length; i3 < len; ++i3) {
            callbacks[i3].apply(this, args);
          }
        }
        return this;
      };
      Emitter.prototype.emitReserved = Emitter.prototype.emit;
      Emitter.prototype.listeners = function(event) {
        this._callbacks = this._callbacks || {};
        return this._callbacks["$" + event] || [];
      };
      Emitter.prototype.hasListeners = function(event) {
        return !!this.listeners(event).length;
      };
    }
  });

  // ../node_modules/engine.io-client/build/esm/globalThis.browser.js
  var globalThisShim;
  var init_globalThis_browser = __esm({
    "../node_modules/engine.io-client/build/esm/globalThis.browser.js"() {
      globalThisShim = (() => {
        if (typeof self !== "undefined") {
          return self;
        } else if (typeof window !== "undefined") {
          return window;
        } else {
          return Function("return this")();
        }
      })();
    }
  });

  // ../node_modules/engine.io-client/build/esm/util.js
  function pick(obj, ...attr) {
    return attr.reduce((acc, k) => {
      if (obj.hasOwnProperty(k)) {
        acc[k] = obj[k];
      }
      return acc;
    }, {});
  }
  function installTimerFunctions(obj, opts) {
    if (opts.useNativeTimers) {
      obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
      obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
    } else {
      obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
      obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
    }
  }
  function byteLength(obj) {
    if (typeof obj === "string") {
      return utf8Length(obj);
    }
    return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
  }
  function utf8Length(str) {
    let c = 0, length2 = 0;
    for (let i3 = 0, l = str.length; i3 < l; i3++) {
      c = str.charCodeAt(i3);
      if (c < 128) {
        length2 += 1;
      } else if (c < 2048) {
        length2 += 2;
      } else if (c < 55296 || c >= 57344) {
        length2 += 3;
      } else {
        i3++;
        length2 += 4;
      }
    }
    return length2;
  }
  var NATIVE_SET_TIMEOUT, NATIVE_CLEAR_TIMEOUT, BASE64_OVERHEAD;
  var init_util = __esm({
    "../node_modules/engine.io-client/build/esm/util.js"() {
      init_globalThis_browser();
      NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
      NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
      BASE64_OVERHEAD = 1.33;
    }
  });

  // ../node_modules/engine.io-client/build/esm/contrib/parseqs.js
  function encode(obj) {
    let str = "";
    for (let i3 in obj) {
      if (obj.hasOwnProperty(i3)) {
        if (str.length)
          str += "&";
        str += encodeURIComponent(i3) + "=" + encodeURIComponent(obj[i3]);
      }
    }
    return str;
  }
  function decode2(qs) {
    let qry = {};
    let pairs = qs.split("&");
    for (let i3 = 0, l = pairs.length; i3 < l; i3++) {
      let pair = pairs[i3].split("=");
      qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return qry;
  }
  var init_parseqs = __esm({
    "../node_modules/engine.io-client/build/esm/contrib/parseqs.js"() {
    }
  });

  // ../node_modules/engine.io-client/build/esm/transport.js
  var TransportError, Transport;
  var init_transport = __esm({
    "../node_modules/engine.io-client/build/esm/transport.js"() {
      init_esm();
      init_esm2();
      init_util();
      init_parseqs();
      TransportError = class extends Error {
        constructor(reason, description, context) {
          super(reason);
          this.description = description;
          this.context = context;
          this.type = "TransportError";
        }
      };
      Transport = class extends Emitter {
        /**
         * Transport abstract constructor.
         *
         * @param {Object} opts - options
         * @protected
         */
        constructor(opts) {
          super();
          this.writable = false;
          installTimerFunctions(this, opts);
          this.opts = opts;
          this.query = opts.query;
          this.socket = opts.socket;
        }
        /**
         * Emits an error.
         *
         * @param {String} reason
         * @param description
         * @param context - the error context
         * @return {Transport} for chaining
         * @protected
         */
        onError(reason, description, context) {
          super.emitReserved("error", new TransportError(reason, description, context));
          return this;
        }
        /**
         * Opens the transport.
         */
        open() {
          this.readyState = "opening";
          this.doOpen();
          return this;
        }
        /**
         * Closes the transport.
         */
        close() {
          if (this.readyState === "opening" || this.readyState === "open") {
            this.doClose();
            this.onClose();
          }
          return this;
        }
        /**
         * Sends multiple packets.
         *
         * @param {Array} packets
         */
        send(packets) {
          if (this.readyState === "open") {
            this.write(packets);
          } else {
          }
        }
        /**
         * Called upon open
         *
         * @protected
         */
        onOpen() {
          this.readyState = "open";
          this.writable = true;
          super.emitReserved("open");
        }
        /**
         * Called with data.
         *
         * @param {String} data
         * @protected
         */
        onData(data) {
          const packet = decodePacket(data, this.socket.binaryType);
          this.onPacket(packet);
        }
        /**
         * Called with a decoded packet.
         *
         * @protected
         */
        onPacket(packet) {
          super.emitReserved("packet", packet);
        }
        /**
         * Called upon close.
         *
         * @protected
         */
        onClose(details) {
          this.readyState = "closed";
          super.emitReserved("close", details);
        }
        /**
         * Pauses the transport, in order not to lose packets during an upgrade.
         *
         * @param onPause
         */
        pause(onPause) {
        }
        createUri(schema, query = {}) {
          return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
        }
        _hostname() {
          const hostname = this.opts.hostname;
          return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
        }
        _port() {
          if (this.opts.port && (this.opts.secure && Number(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80)) {
            return ":" + this.opts.port;
          } else {
            return "";
          }
        }
        _query(query) {
          const encodedQuery = encode(query);
          return encodedQuery.length ? "?" + encodedQuery : "";
        }
      };
    }
  });

  // ../node_modules/engine.io-client/build/esm/contrib/yeast.js
  function encode2(num2) {
    let encoded = "";
    do {
      encoded = alphabet[num2 % length] + encoded;
      num2 = Math.floor(num2 / length);
    } while (num2 > 0);
    return encoded;
  }
  function yeast() {
    const now = encode2(+/* @__PURE__ */ new Date());
    if (now !== prev)
      return seed = 0, prev = now;
    return now + "." + encode2(seed++);
  }
  var alphabet, length, map, seed, i2, prev;
  var init_yeast = __esm({
    "../node_modules/engine.io-client/build/esm/contrib/yeast.js"() {
      "use strict";
      alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split("");
      length = 64;
      map = {};
      seed = 0;
      i2 = 0;
      for (; i2 < length; i2++)
        map[alphabet[i2]] = i2;
    }
  });

  // ../node_modules/engine.io-client/build/esm/contrib/has-cors.js
  var value, hasCORS;
  var init_has_cors = __esm({
    "../node_modules/engine.io-client/build/esm/contrib/has-cors.js"() {
      value = false;
      try {
        value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
      } catch (err) {
      }
      hasCORS = value;
    }
  });

  // ../node_modules/engine.io-client/build/esm/transports/xmlhttprequest.browser.js
  function XHR(opts) {
    const xdomain = opts.xdomain;
    try {
      if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
        return new XMLHttpRequest();
      }
    } catch (e) {
    }
    if (!xdomain) {
      try {
        return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
      } catch (e) {
      }
    }
  }
  function createCookieJar() {
  }
  var init_xmlhttprequest_browser = __esm({
    "../node_modules/engine.io-client/build/esm/transports/xmlhttprequest.browser.js"() {
      init_has_cors();
      init_globalThis_browser();
    }
  });

  // ../node_modules/engine.io-client/build/esm/transports/polling.js
  function empty() {
  }
  function unloadHandler() {
    for (let i3 in Request.requests) {
      if (Request.requests.hasOwnProperty(i3)) {
        Request.requests[i3].abort();
      }
    }
  }
  var hasXHR2, Polling, Request;
  var init_polling = __esm({
    "../node_modules/engine.io-client/build/esm/transports/polling.js"() {
      init_transport();
      init_yeast();
      init_esm();
      init_xmlhttprequest_browser();
      init_esm2();
      init_util();
      init_globalThis_browser();
      hasXHR2 = (function() {
        const xhr = new XHR({
          xdomain: false
        });
        return null != xhr.responseType;
      })();
      Polling = class extends Transport {
        /**
         * XHR Polling constructor.
         *
         * @param {Object} opts
         * @package
         */
        constructor(opts) {
          super(opts);
          this.polling = false;
          if (typeof location !== "undefined") {
            const isSSL = "https:" === location.protocol;
            let port = location.port;
            if (!port) {
              port = isSSL ? "443" : "80";
            }
            this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
          }
          const forceBase64 = opts && opts.forceBase64;
          this.supportsBinary = hasXHR2 && !forceBase64;
          if (this.opts.withCredentials) {
            this.cookieJar = createCookieJar();
          }
        }
        get name() {
          return "polling";
        }
        /**
         * Opens the socket (triggers polling). We write a PING message to determine
         * when the transport is open.
         *
         * @protected
         */
        doOpen() {
          this.poll();
        }
        /**
         * Pauses polling.
         *
         * @param {Function} onPause - callback upon buffers are flushed and transport is paused
         * @package
         */
        pause(onPause) {
          this.readyState = "pausing";
          const pause = () => {
            this.readyState = "paused";
            onPause();
          };
          if (this.polling || !this.writable) {
            let total = 0;
            if (this.polling) {
              total++;
              this.once("pollComplete", function() {
                --total || pause();
              });
            }
            if (!this.writable) {
              total++;
              this.once("drain", function() {
                --total || pause();
              });
            }
          } else {
            pause();
          }
        }
        /**
         * Starts polling cycle.
         *
         * @private
         */
        poll() {
          this.polling = true;
          this.doPoll();
          this.emitReserved("poll");
        }
        /**
         * Overloads onData to detect payloads.
         *
         * @protected
         */
        onData(data) {
          const callback = (packet) => {
            if ("opening" === this.readyState && packet.type === "open") {
              this.onOpen();
            }
            if ("close" === packet.type) {
              this.onClose({ description: "transport closed by the server" });
              return false;
            }
            this.onPacket(packet);
          };
          decodePayload(data, this.socket.binaryType).forEach(callback);
          if ("closed" !== this.readyState) {
            this.polling = false;
            this.emitReserved("pollComplete");
            if ("open" === this.readyState) {
              this.poll();
            } else {
            }
          }
        }
        /**
         * For polling, send a close packet.
         *
         * @protected
         */
        doClose() {
          const close = () => {
            this.write([{ type: "close" }]);
          };
          if ("open" === this.readyState) {
            close();
          } else {
            this.once("open", close);
          }
        }
        /**
         * Writes a packets payload.
         *
         * @param {Array} packets - data packets
         * @protected
         */
        write(packets) {
          this.writable = false;
          encodePayload(packets, (data) => {
            this.doWrite(data, () => {
              this.writable = true;
              this.emitReserved("drain");
            });
          });
        }
        /**
         * Generates uri for connection.
         *
         * @private
         */
        uri() {
          const schema = this.opts.secure ? "https" : "http";
          const query = this.query || {};
          if (false !== this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast();
          }
          if (!this.supportsBinary && !query.sid) {
            query.b64 = 1;
          }
          return this.createUri(schema, query);
        }
        /**
         * Creates a request.
         *
         * @param {String} method
         * @private
         */
        request(opts = {}) {
          Object.assign(opts, { xd: this.xd, cookieJar: this.cookieJar }, this.opts);
          return new Request(this.uri(), opts);
        }
        /**
         * Sends data.
         *
         * @param {String} data to send.
         * @param {Function} called upon flush.
         * @private
         */
        doWrite(data, fn) {
          const req = this.request({
            method: "POST",
            data
          });
          req.on("success", fn);
          req.on("error", (xhrStatus, context) => {
            this.onError("xhr post error", xhrStatus, context);
          });
        }
        /**
         * Starts a poll cycle.
         *
         * @private
         */
        doPoll() {
          const req = this.request();
          req.on("data", this.onData.bind(this));
          req.on("error", (xhrStatus, context) => {
            this.onError("xhr poll error", xhrStatus, context);
          });
          this.pollXhr = req;
        }
      };
      Request = class _Request extends Emitter {
        /**
         * Request constructor
         *
         * @param {Object} options
         * @package
         */
        constructor(uri, opts) {
          super();
          installTimerFunctions(this, opts);
          this.opts = opts;
          this.method = opts.method || "GET";
          this.uri = uri;
          this.data = void 0 !== opts.data ? opts.data : null;
          this.create();
        }
        /**
         * Creates the XHR object and sends the request.
         *
         * @private
         */
        create() {
          var _a;
          const opts = pick(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
          opts.xdomain = !!this.opts.xd;
          const xhr = this.xhr = new XHR(opts);
          try {
            xhr.open(this.method, this.uri, true);
            try {
              if (this.opts.extraHeaders) {
                xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
                for (let i3 in this.opts.extraHeaders) {
                  if (this.opts.extraHeaders.hasOwnProperty(i3)) {
                    xhr.setRequestHeader(i3, this.opts.extraHeaders[i3]);
                  }
                }
              }
            } catch (e) {
            }
            if ("POST" === this.method) {
              try {
                xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
              } catch (e) {
              }
            }
            try {
              xhr.setRequestHeader("Accept", "*/*");
            } catch (e) {
            }
            (_a = this.opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
            if ("withCredentials" in xhr) {
              xhr.withCredentials = this.opts.withCredentials;
            }
            if (this.opts.requestTimeout) {
              xhr.timeout = this.opts.requestTimeout;
            }
            xhr.onreadystatechange = () => {
              var _a2;
              if (xhr.readyState === 3) {
                (_a2 = this.opts.cookieJar) === null || _a2 === void 0 ? void 0 : _a2.parseCookies(xhr);
              }
              if (4 !== xhr.readyState)
                return;
              if (200 === xhr.status || 1223 === xhr.status) {
                this.onLoad();
              } else {
                this.setTimeoutFn(() => {
                  this.onError(typeof xhr.status === "number" ? xhr.status : 0);
                }, 0);
              }
            };
            xhr.send(this.data);
          } catch (e) {
            this.setTimeoutFn(() => {
              this.onError(e);
            }, 0);
            return;
          }
          if (typeof document !== "undefined") {
            this.index = _Request.requestsCount++;
            _Request.requests[this.index] = this;
          }
        }
        /**
         * Called upon error.
         *
         * @private
         */
        onError(err) {
          this.emitReserved("error", err, this.xhr);
          this.cleanup(true);
        }
        /**
         * Cleans up house.
         *
         * @private
         */
        cleanup(fromError) {
          if ("undefined" === typeof this.xhr || null === this.xhr) {
            return;
          }
          this.xhr.onreadystatechange = empty;
          if (fromError) {
            try {
              this.xhr.abort();
            } catch (e) {
            }
          }
          if (typeof document !== "undefined") {
            delete _Request.requests[this.index];
          }
          this.xhr = null;
        }
        /**
         * Called upon load.
         *
         * @private
         */
        onLoad() {
          const data = this.xhr.responseText;
          if (data !== null) {
            this.emitReserved("data", data);
            this.emitReserved("success");
            this.cleanup();
          }
        }
        /**
         * Aborts the request.
         *
         * @package
         */
        abort() {
          this.cleanup();
        }
      };
      Request.requestsCount = 0;
      Request.requests = {};
      if (typeof document !== "undefined") {
        if (typeof attachEvent === "function") {
          attachEvent("onunload", unloadHandler);
        } else if (typeof addEventListener === "function") {
          const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
          addEventListener(terminationEvent, unloadHandler, false);
        }
      }
    }
  });

  // ../node_modules/engine.io-client/build/esm/transports/websocket-constructor.browser.js
  var nextTick, WebSocket, usingBrowserWebSocket, defaultBinaryType;
  var init_websocket_constructor_browser = __esm({
    "../node_modules/engine.io-client/build/esm/transports/websocket-constructor.browser.js"() {
      init_globalThis_browser();
      nextTick = (() => {
        const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
        if (isPromiseAvailable) {
          return (cb) => Promise.resolve().then(cb);
        } else {
          return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
        }
      })();
      WebSocket = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
      usingBrowserWebSocket = true;
      defaultBinaryType = "arraybuffer";
    }
  });

  // ../node_modules/engine.io-client/build/esm/transports/websocket.js
  var isReactNative, WS;
  var init_websocket = __esm({
    "../node_modules/engine.io-client/build/esm/transports/websocket.js"() {
      init_transport();
      init_yeast();
      init_util();
      init_websocket_constructor_browser();
      init_esm();
      isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
      WS = class extends Transport {
        /**
         * WebSocket transport constructor.
         *
         * @param {Object} opts - connection options
         * @protected
         */
        constructor(opts) {
          super(opts);
          this.supportsBinary = !opts.forceBase64;
        }
        get name() {
          return "websocket";
        }
        doOpen() {
          if (!this.check()) {
            return;
          }
          const uri = this.uri();
          const protocols = this.opts.protocols;
          const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
          if (this.opts.extraHeaders) {
            opts.headers = this.opts.extraHeaders;
          }
          try {
            this.ws = usingBrowserWebSocket && !isReactNative ? protocols ? new WebSocket(uri, protocols) : new WebSocket(uri) : new WebSocket(uri, protocols, opts);
          } catch (err) {
            return this.emitReserved("error", err);
          }
          this.ws.binaryType = this.socket.binaryType;
          this.addEventListeners();
        }
        /**
         * Adds event listeners to the socket
         *
         * @private
         */
        addEventListeners() {
          this.ws.onopen = () => {
            if (this.opts.autoUnref) {
              this.ws._socket.unref();
            }
            this.onOpen();
          };
          this.ws.onclose = (closeEvent) => this.onClose({
            description: "websocket connection closed",
            context: closeEvent
          });
          this.ws.onmessage = (ev) => this.onData(ev.data);
          this.ws.onerror = (e) => this.onError("websocket error", e);
        }
        write(packets) {
          this.writable = false;
          for (let i3 = 0; i3 < packets.length; i3++) {
            const packet = packets[i3];
            const lastPacket = i3 === packets.length - 1;
            encodePacket(packet, this.supportsBinary, (data) => {
              const opts = {};
              if (!usingBrowserWebSocket) {
                if (packet.options) {
                  opts.compress = packet.options.compress;
                }
                if (this.opts.perMessageDeflate) {
                  const len = (
                    // @ts-ignore
                    "string" === typeof data ? Buffer.byteLength(data) : data.length
                  );
                  if (len < this.opts.perMessageDeflate.threshold) {
                    opts.compress = false;
                  }
                }
              }
              try {
                if (usingBrowserWebSocket) {
                  this.ws.send(data);
                } else {
                  this.ws.send(data, opts);
                }
              } catch (e) {
              }
              if (lastPacket) {
                nextTick(() => {
                  this.writable = true;
                  this.emitReserved("drain");
                }, this.setTimeoutFn);
              }
            });
          }
        }
        doClose() {
          if (typeof this.ws !== "undefined") {
            this.ws.close();
            this.ws = null;
          }
        }
        /**
         * Generates uri for connection.
         *
         * @private
         */
        uri() {
          const schema = this.opts.secure ? "wss" : "ws";
          const query = this.query || {};
          if (this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast();
          }
          if (!this.supportsBinary) {
            query.b64 = 1;
          }
          return this.createUri(schema, query);
        }
        /**
         * Feature detection for WebSocket.
         *
         * @return {Boolean} whether this transport is available.
         * @private
         */
        check() {
          return !!WebSocket;
        }
      };
    }
  });

  // ../node_modules/engine.io-client/build/esm/transports/webtransport.js
  var WT;
  var init_webtransport = __esm({
    "../node_modules/engine.io-client/build/esm/transports/webtransport.js"() {
      init_transport();
      init_websocket_constructor_browser();
      init_esm();
      WT = class extends Transport {
        get name() {
          return "webtransport";
        }
        doOpen() {
          if (typeof WebTransport !== "function") {
            return;
          }
          this.transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
          this.transport.closed.then(() => {
            this.onClose();
          }).catch((err) => {
            this.onError("webtransport error", err);
          });
          this.transport.ready.then(() => {
            this.transport.createBidirectionalStream().then((stream) => {
              const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
              const reader = stream.readable.pipeThrough(decoderStream).getReader();
              const encoderStream = createPacketEncoderStream();
              encoderStream.readable.pipeTo(stream.writable);
              this.writer = encoderStream.writable.getWriter();
              const read = () => {
                reader.read().then(({ done, value: value2 }) => {
                  if (done) {
                    return;
                  }
                  this.onPacket(value2);
                  read();
                }).catch((err) => {
                });
              };
              read();
              const packet = { type: "open" };
              if (this.query.sid) {
                packet.data = `{"sid":"${this.query.sid}"}`;
              }
              this.writer.write(packet).then(() => this.onOpen());
            });
          });
        }
        write(packets) {
          this.writable = false;
          for (let i3 = 0; i3 < packets.length; i3++) {
            const packet = packets[i3];
            const lastPacket = i3 === packets.length - 1;
            this.writer.write(packet).then(() => {
              if (lastPacket) {
                nextTick(() => {
                  this.writable = true;
                  this.emitReserved("drain");
                }, this.setTimeoutFn);
              }
            });
          }
        }
        doClose() {
          var _a;
          (_a = this.transport) === null || _a === void 0 ? void 0 : _a.close();
        }
      };
    }
  });

  // ../node_modules/engine.io-client/build/esm/transports/index.js
  var transports;
  var init_transports = __esm({
    "../node_modules/engine.io-client/build/esm/transports/index.js"() {
      init_polling();
      init_websocket();
      init_webtransport();
      transports = {
        websocket: WS,
        webtransport: WT,
        polling: Polling
      };
    }
  });

  // ../node_modules/engine.io-client/build/esm/contrib/parseuri.js
  function parse(str) {
    if (str.length > 2e3) {
      throw "URI too long";
    }
    const src = str, b = str.indexOf("["), e = str.indexOf("]");
    if (b != -1 && e != -1) {
      str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
    }
    let m = re.exec(str || ""), uri = {}, i3 = 14;
    while (i3--) {
      uri[parts[i3]] = m[i3] || "";
    }
    if (b != -1 && e != -1) {
      uri.source = src;
      uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
      uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
      uri.ipv6uri = true;
    }
    uri.pathNames = pathNames(uri, uri["path"]);
    uri.queryKey = queryKey(uri, uri["query"]);
    return uri;
  }
  function pathNames(obj, path) {
    const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
    if (path.slice(0, 1) == "/" || path.length === 0) {
      names.splice(0, 1);
    }
    if (path.slice(-1) == "/") {
      names.splice(names.length - 1, 1);
    }
    return names;
  }
  function queryKey(uri, query) {
    const data = {};
    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
      if ($1) {
        data[$1] = $2;
      }
    });
    return data;
  }
  var re, parts;
  var init_parseuri = __esm({
    "../node_modules/engine.io-client/build/esm/contrib/parseuri.js"() {
      re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
      parts = [
        "source",
        "protocol",
        "authority",
        "userInfo",
        "user",
        "password",
        "host",
        "port",
        "relative",
        "path",
        "directory",
        "file",
        "query",
        "anchor"
      ];
    }
  });

  // ../node_modules/engine.io-client/build/esm/socket.js
  var Socket;
  var init_socket = __esm({
    "../node_modules/engine.io-client/build/esm/socket.js"() {
      init_transports();
      init_util();
      init_parseqs();
      init_parseuri();
      init_esm2();
      init_esm();
      init_websocket_constructor_browser();
      Socket = class _Socket extends Emitter {
        /**
         * Socket constructor.
         *
         * @param {String|Object} uri - uri or options
         * @param {Object} opts - options
         */
        constructor(uri, opts = {}) {
          super();
          this.binaryType = defaultBinaryType;
          this.writeBuffer = [];
          if (uri && "object" === typeof uri) {
            opts = uri;
            uri = null;
          }
          if (uri) {
            uri = parse(uri);
            opts.hostname = uri.host;
            opts.secure = uri.protocol === "https" || uri.protocol === "wss";
            opts.port = uri.port;
            if (uri.query)
              opts.query = uri.query;
          } else if (opts.host) {
            opts.hostname = parse(opts.host).host;
          }
          installTimerFunctions(this, opts);
          this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
          if (opts.hostname && !opts.port) {
            opts.port = this.secure ? "443" : "80";
          }
          this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
          this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
          this.transports = opts.transports || [
            "polling",
            "websocket",
            "webtransport"
          ];
          this.writeBuffer = [];
          this.prevBufferLen = 0;
          this.opts = Object.assign({
            path: "/engine.io",
            agent: false,
            withCredentials: false,
            upgrade: true,
            timestampParam: "t",
            rememberUpgrade: false,
            addTrailingSlash: true,
            rejectUnauthorized: true,
            perMessageDeflate: {
              threshold: 1024
            },
            transportOptions: {},
            closeOnBeforeunload: false
          }, opts);
          this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
          if (typeof this.opts.query === "string") {
            this.opts.query = decode2(this.opts.query);
          }
          this.id = null;
          this.upgrades = null;
          this.pingInterval = null;
          this.pingTimeout = null;
          this.pingTimeoutTimer = null;
          if (typeof addEventListener === "function") {
            if (this.opts.closeOnBeforeunload) {
              this.beforeunloadEventListener = () => {
                if (this.transport) {
                  this.transport.removeAllListeners();
                  this.transport.close();
                }
              };
              addEventListener("beforeunload", this.beforeunloadEventListener, false);
            }
            if (this.hostname !== "localhost") {
              this.offlineEventListener = () => {
                this.onClose("transport close", {
                  description: "network connection lost"
                });
              };
              addEventListener("offline", this.offlineEventListener, false);
            }
          }
          this.open();
        }
        /**
         * Creates transport of the given type.
         *
         * @param {String} name - transport name
         * @return {Transport}
         * @private
         */
        createTransport(name) {
          const query = Object.assign({}, this.opts.query);
          query.EIO = protocol;
          query.transport = name;
          if (this.id)
            query.sid = this.id;
          const opts = Object.assign({}, this.opts, {
            query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port
          }, this.opts.transportOptions[name]);
          return new transports[name](opts);
        }
        /**
         * Initializes transport to use and starts probe.
         *
         * @private
         */
        open() {
          let transport;
          if (this.opts.rememberUpgrade && _Socket.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1) {
            transport = "websocket";
          } else if (0 === this.transports.length) {
            this.setTimeoutFn(() => {
              this.emitReserved("error", "No transports available");
            }, 0);
            return;
          } else {
            transport = this.transports[0];
          }
          this.readyState = "opening";
          try {
            transport = this.createTransport(transport);
          } catch (e) {
            this.transports.shift();
            this.open();
            return;
          }
          transport.open();
          this.setTransport(transport);
        }
        /**
         * Sets the current transport. Disables the existing one (if any).
         *
         * @private
         */
        setTransport(transport) {
          if (this.transport) {
            this.transport.removeAllListeners();
          }
          this.transport = transport;
          transport.on("drain", this.onDrain.bind(this)).on("packet", this.onPacket.bind(this)).on("error", this.onError.bind(this)).on("close", (reason) => this.onClose("transport close", reason));
        }
        /**
         * Probes a transport.
         *
         * @param {String} name - transport name
         * @private
         */
        probe(name) {
          let transport = this.createTransport(name);
          let failed = false;
          _Socket.priorWebsocketSuccess = false;
          const onTransportOpen = () => {
            if (failed)
              return;
            transport.send([{ type: "ping", data: "probe" }]);
            transport.once("packet", (msg) => {
              if (failed)
                return;
              if ("pong" === msg.type && "probe" === msg.data) {
                this.upgrading = true;
                this.emitReserved("upgrading", transport);
                if (!transport)
                  return;
                _Socket.priorWebsocketSuccess = "websocket" === transport.name;
                this.transport.pause(() => {
                  if (failed)
                    return;
                  if ("closed" === this.readyState)
                    return;
                  cleanup();
                  this.setTransport(transport);
                  transport.send([{ type: "upgrade" }]);
                  this.emitReserved("upgrade", transport);
                  transport = null;
                  this.upgrading = false;
                  this.flush();
                });
              } else {
                const err = new Error("probe error");
                err.transport = transport.name;
                this.emitReserved("upgradeError", err);
              }
            });
          };
          function freezeTransport() {
            if (failed)
              return;
            failed = true;
            cleanup();
            transport.close();
            transport = null;
          }
          const onerror = (err) => {
            const error = new Error("probe error: " + err);
            error.transport = transport.name;
            freezeTransport();
            this.emitReserved("upgradeError", error);
          };
          function onTransportClose() {
            onerror("transport closed");
          }
          function onclose() {
            onerror("socket closed");
          }
          function onupgrade(to) {
            if (transport && to.name !== transport.name) {
              freezeTransport();
            }
          }
          const cleanup = () => {
            transport.removeListener("open", onTransportOpen);
            transport.removeListener("error", onerror);
            transport.removeListener("close", onTransportClose);
            this.off("close", onclose);
            this.off("upgrading", onupgrade);
          };
          transport.once("open", onTransportOpen);
          transport.once("error", onerror);
          transport.once("close", onTransportClose);
          this.once("close", onclose);
          this.once("upgrading", onupgrade);
          if (this.upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
            this.setTimeoutFn(() => {
              if (!failed) {
                transport.open();
              }
            }, 200);
          } else {
            transport.open();
          }
        }
        /**
         * Called when connection is deemed open.
         *
         * @private
         */
        onOpen() {
          this.readyState = "open";
          _Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
          this.emitReserved("open");
          this.flush();
          if ("open" === this.readyState && this.opts.upgrade) {
            let i3 = 0;
            const l = this.upgrades.length;
            for (; i3 < l; i3++) {
              this.probe(this.upgrades[i3]);
            }
          }
        }
        /**
         * Handles a packet.
         *
         * @private
         */
        onPacket(packet) {
          if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
            this.emitReserved("packet", packet);
            this.emitReserved("heartbeat");
            this.resetPingTimeout();
            switch (packet.type) {
              case "open":
                this.onHandshake(JSON.parse(packet.data));
                break;
              case "ping":
                this.sendPacket("pong");
                this.emitReserved("ping");
                this.emitReserved("pong");
                break;
              case "error":
                const err = new Error("server error");
                err.code = packet.data;
                this.onError(err);
                break;
              case "message":
                this.emitReserved("data", packet.data);
                this.emitReserved("message", packet.data);
                break;
            }
          } else {
          }
        }
        /**
         * Called upon handshake completion.
         *
         * @param {Object} data - handshake obj
         * @private
         */
        onHandshake(data) {
          this.emitReserved("handshake", data);
          this.id = data.sid;
          this.transport.query.sid = data.sid;
          this.upgrades = this.filterUpgrades(data.upgrades);
          this.pingInterval = data.pingInterval;
          this.pingTimeout = data.pingTimeout;
          this.maxPayload = data.maxPayload;
          this.onOpen();
          if ("closed" === this.readyState)
            return;
          this.resetPingTimeout();
        }
        /**
         * Sets and resets ping timeout timer based on server pings.
         *
         * @private
         */
        resetPingTimeout() {
          this.clearTimeoutFn(this.pingTimeoutTimer);
          this.pingTimeoutTimer = this.setTimeoutFn(() => {
            this.onClose("ping timeout");
          }, this.pingInterval + this.pingTimeout);
          if (this.opts.autoUnref) {
            this.pingTimeoutTimer.unref();
          }
        }
        /**
         * Called on `drain` event
         *
         * @private
         */
        onDrain() {
          this.writeBuffer.splice(0, this.prevBufferLen);
          this.prevBufferLen = 0;
          if (0 === this.writeBuffer.length) {
            this.emitReserved("drain");
          } else {
            this.flush();
          }
        }
        /**
         * Flush write buffers.
         *
         * @private
         */
        flush() {
          if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
            const packets = this.getWritablePackets();
            this.transport.send(packets);
            this.prevBufferLen = packets.length;
            this.emitReserved("flush");
          }
        }
        /**
         * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
         * long-polling)
         *
         * @private
         */
        getWritablePackets() {
          const shouldCheckPayloadSize = this.maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
          if (!shouldCheckPayloadSize) {
            return this.writeBuffer;
          }
          let payloadSize = 1;
          for (let i3 = 0; i3 < this.writeBuffer.length; i3++) {
            const data = this.writeBuffer[i3].data;
            if (data) {
              payloadSize += byteLength(data);
            }
            if (i3 > 0 && payloadSize > this.maxPayload) {
              return this.writeBuffer.slice(0, i3);
            }
            payloadSize += 2;
          }
          return this.writeBuffer;
        }
        /**
         * Sends a message.
         *
         * @param {String} msg - message.
         * @param {Object} options.
         * @param {Function} callback function.
         * @return {Socket} for chaining.
         */
        write(msg, options2, fn) {
          this.sendPacket("message", msg, options2, fn);
          return this;
        }
        send(msg, options2, fn) {
          this.sendPacket("message", msg, options2, fn);
          return this;
        }
        /**
         * Sends a packet.
         *
         * @param {String} type: packet type.
         * @param {String} data.
         * @param {Object} options.
         * @param {Function} fn - callback function.
         * @private
         */
        sendPacket(type, data, options2, fn) {
          if ("function" === typeof data) {
            fn = data;
            data = void 0;
          }
          if ("function" === typeof options2) {
            fn = options2;
            options2 = null;
          }
          if ("closing" === this.readyState || "closed" === this.readyState) {
            return;
          }
          options2 = options2 || {};
          options2.compress = false !== options2.compress;
          const packet = {
            type,
            data,
            options: options2
          };
          this.emitReserved("packetCreate", packet);
          this.writeBuffer.push(packet);
          if (fn)
            this.once("flush", fn);
          this.flush();
        }
        /**
         * Closes the connection.
         */
        close() {
          const close = () => {
            this.onClose("forced close");
            this.transport.close();
          };
          const cleanupAndClose = () => {
            this.off("upgrade", cleanupAndClose);
            this.off("upgradeError", cleanupAndClose);
            close();
          };
          const waitForUpgrade = () => {
            this.once("upgrade", cleanupAndClose);
            this.once("upgradeError", cleanupAndClose);
          };
          if ("opening" === this.readyState || "open" === this.readyState) {
            this.readyState = "closing";
            if (this.writeBuffer.length) {
              this.once("drain", () => {
                if (this.upgrading) {
                  waitForUpgrade();
                } else {
                  close();
                }
              });
            } else if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          }
          return this;
        }
        /**
         * Called upon transport error
         *
         * @private
         */
        onError(err) {
          _Socket.priorWebsocketSuccess = false;
          this.emitReserved("error", err);
          this.onClose("transport error", err);
        }
        /**
         * Called upon transport close.
         *
         * @private
         */
        onClose(reason, description) {
          if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
            this.clearTimeoutFn(this.pingTimeoutTimer);
            this.transport.removeAllListeners("close");
            this.transport.close();
            this.transport.removeAllListeners();
            if (typeof removeEventListener === "function") {
              removeEventListener("beforeunload", this.beforeunloadEventListener, false);
              removeEventListener("offline", this.offlineEventListener, false);
            }
            this.readyState = "closed";
            this.id = null;
            this.emitReserved("close", reason, description);
            this.writeBuffer = [];
            this.prevBufferLen = 0;
          }
        }
        /**
         * Filters upgrades, returning only those matching client transports.
         *
         * @param {Array} upgrades - server upgrades
         * @private
         */
        filterUpgrades(upgrades) {
          const filteredUpgrades = [];
          let i3 = 0;
          const j = upgrades.length;
          for (; i3 < j; i3++) {
            if (~this.transports.indexOf(upgrades[i3]))
              filteredUpgrades.push(upgrades[i3]);
          }
          return filteredUpgrades;
        }
      };
      Socket.protocol = protocol;
    }
  });

  // ../node_modules/engine.io-client/build/esm/index.js
  var protocol2;
  var init_esm3 = __esm({
    "../node_modules/engine.io-client/build/esm/index.js"() {
      init_socket();
      init_transport();
      init_transports();
      init_util();
      init_parseuri();
      init_websocket_constructor_browser();
      protocol2 = Socket.protocol;
    }
  });

  // ../node_modules/socket.io-client/build/esm/url.js
  function url(uri, path = "", loc) {
    let obj = uri;
    loc = loc || typeof location !== "undefined" && location;
    if (null == uri)
      uri = loc.protocol + "//" + loc.host;
    if (typeof uri === "string") {
      if ("/" === uri.charAt(0)) {
        if ("/" === uri.charAt(1)) {
          uri = loc.protocol + uri;
        } else {
          uri = loc.host + uri;
        }
      }
      if (!/^(https?|wss?):\/\//.test(uri)) {
        if ("undefined" !== typeof loc) {
          uri = loc.protocol + "//" + uri;
        } else {
          uri = "https://" + uri;
        }
      }
      obj = parse(uri);
    }
    if (!obj.port) {
      if (/^(http|ws)$/.test(obj.protocol)) {
        obj.port = "80";
      } else if (/^(http|ws)s$/.test(obj.protocol)) {
        obj.port = "443";
      }
    }
    obj.path = obj.path || "/";
    const ipv6 = obj.host.indexOf(":") !== -1;
    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
    obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
    obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
  }
  var init_url = __esm({
    "../node_modules/socket.io-client/build/esm/url.js"() {
      init_esm3();
    }
  });

  // ../node_modules/socket.io-parser/build/esm/is-binary.js
  function isBinary(obj) {
    return withNativeArrayBuffer3 && (obj instanceof ArrayBuffer || isView2(obj)) || withNativeBlob2 && obj instanceof Blob || withNativeFile && obj instanceof File;
  }
  function hasBinary(obj, toJSON) {
    if (!obj || typeof obj !== "object") {
      return false;
    }
    if (Array.isArray(obj)) {
      for (let i3 = 0, l = obj.length; i3 < l; i3++) {
        if (hasBinary(obj[i3])) {
          return true;
        }
      }
      return false;
    }
    if (isBinary(obj)) {
      return true;
    }
    if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
      return hasBinary(obj.toJSON(), true);
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
        return true;
      }
    }
    return false;
  }
  var withNativeArrayBuffer3, isView2, toString, withNativeBlob2, withNativeFile;
  var init_is_binary = __esm({
    "../node_modules/socket.io-parser/build/esm/is-binary.js"() {
      withNativeArrayBuffer3 = typeof ArrayBuffer === "function";
      isView2 = (obj) => {
        return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
      };
      toString = Object.prototype.toString;
      withNativeBlob2 = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
      withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
    }
  });

  // ../node_modules/socket.io-parser/build/esm/binary.js
  function deconstructPacket(packet) {
    const buffers = [];
    const packetData = packet.data;
    const pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length;
    return { packet: pack, buffers };
  }
  function _deconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (isBinary(data)) {
      const placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (Array.isArray(data)) {
      const newData = new Array(data.length);
      for (let i3 = 0; i3 < data.length; i3++) {
        newData[i3] = _deconstructPacket(data[i3], buffers);
      }
      return newData;
    } else if (typeof data === "object" && !(data instanceof Date)) {
      const newData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          newData[key] = _deconstructPacket(data[key], buffers);
        }
      }
      return newData;
    }
    return data;
  }
  function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    delete packet.attachments;
    return packet;
  }
  function _reconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (data && data._placeholder === true) {
      const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
      if (isIndexValid) {
        return buffers[data.num];
      } else {
        throw new Error("illegal attachments");
      }
    } else if (Array.isArray(data)) {
      for (let i3 = 0; i3 < data.length; i3++) {
        data[i3] = _reconstructPacket(data[i3], buffers);
      }
    } else if (typeof data === "object") {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          data[key] = _reconstructPacket(data[key], buffers);
        }
      }
    }
    return data;
  }
  var init_binary = __esm({
    "../node_modules/socket.io-parser/build/esm/binary.js"() {
      init_is_binary();
    }
  });

  // ../node_modules/socket.io-parser/build/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    Decoder: () => Decoder,
    Encoder: () => Encoder,
    PacketType: () => PacketType,
    protocol: () => protocol3
  });
  function isObject(value2) {
    return Object.prototype.toString.call(value2) === "[object Object]";
  }
  var RESERVED_EVENTS, protocol3, PacketType, Encoder, Decoder, BinaryReconstructor;
  var init_esm4 = __esm({
    "../node_modules/socket.io-parser/build/esm/index.js"() {
      init_esm2();
      init_binary();
      init_is_binary();
      RESERVED_EVENTS = [
        "connect",
        "connect_error",
        "disconnect",
        "disconnecting",
        "newListener",
        "removeListener"
        // used by the Node.js EventEmitter
      ];
      protocol3 = 5;
      (function(PacketType2) {
        PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
        PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
        PacketType2[PacketType2["ACK"] = 3] = "ACK";
        PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
      })(PacketType || (PacketType = {}));
      Encoder = class {
        /**
         * Encoder constructor
         *
         * @param {function} replacer - custom replacer to pass down to JSON.parse
         */
        constructor(replacer) {
          this.replacer = replacer;
        }
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
          if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
            if (hasBinary(obj)) {
              return this.encodeAsBinary({
                type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
                nsp: obj.nsp,
                data: obj.data,
                id: obj.id
              });
            }
          }
          return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
          let str = "" + obj.type;
          if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
            str += obj.attachments + "-";
          }
          if (obj.nsp && "/" !== obj.nsp) {
            str += obj.nsp + ",";
          }
          if (null != obj.id) {
            str += obj.id;
          }
          if (null != obj.data) {
            str += JSON.stringify(obj.data, this.replacer);
          }
          return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
          const deconstruction = deconstructPacket(obj);
          const pack = this.encodeAsString(deconstruction.packet);
          const buffers = deconstruction.buffers;
          buffers.unshift(pack);
          return buffers;
        }
      };
      Decoder = class _Decoder extends Emitter {
        /**
         * Decoder constructor
         *
         * @param {function} reviver - custom reviver to pass down to JSON.stringify
         */
        constructor(reviver) {
          super();
          this.reviver = reviver;
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
          let packet;
          if (typeof obj === "string") {
            if (this.reconstructor) {
              throw new Error("got plaintext data when reconstructing a packet");
            }
            packet = this.decodeString(obj);
            const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
            if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
              packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
              this.reconstructor = new BinaryReconstructor(packet);
              if (packet.attachments === 0) {
                super.emitReserved("decoded", packet);
              }
            } else {
              super.emitReserved("decoded", packet);
            }
          } else if (isBinary(obj) || obj.base64) {
            if (!this.reconstructor) {
              throw new Error("got binary data when not reconstructing a packet");
            } else {
              packet = this.reconstructor.takeBinaryData(obj);
              if (packet) {
                this.reconstructor = null;
                super.emitReserved("decoded", packet);
              }
            }
          } else {
            throw new Error("Unknown type: " + obj);
          }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
          let i3 = 0;
          const p = {
            type: Number(str.charAt(0))
          };
          if (PacketType[p.type] === void 0) {
            throw new Error("unknown packet type " + p.type);
          }
          if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
            const start = i3 + 1;
            while (str.charAt(++i3) !== "-" && i3 != str.length) {
            }
            const buf = str.substring(start, i3);
            if (buf != Number(buf) || str.charAt(i3) !== "-") {
              throw new Error("Illegal attachments");
            }
            p.attachments = Number(buf);
          }
          if ("/" === str.charAt(i3 + 1)) {
            const start = i3 + 1;
            while (++i3) {
              const c = str.charAt(i3);
              if ("," === c)
                break;
              if (i3 === str.length)
                break;
            }
            p.nsp = str.substring(start, i3);
          } else {
            p.nsp = "/";
          }
          const next = str.charAt(i3 + 1);
          if ("" !== next && Number(next) == next) {
            const start = i3 + 1;
            while (++i3) {
              const c = str.charAt(i3);
              if (null == c || Number(c) != c) {
                --i3;
                break;
              }
              if (i3 === str.length)
                break;
            }
            p.id = Number(str.substring(start, i3 + 1));
          }
          if (str.charAt(++i3)) {
            const payload = this.tryParse(str.substr(i3));
            if (_Decoder.isPayloadValid(p.type, payload)) {
              p.data = payload;
            } else {
              throw new Error("invalid payload");
            }
          }
          return p;
        }
        tryParse(str) {
          try {
            return JSON.parse(str, this.reviver);
          } catch (e) {
            return false;
          }
        }
        static isPayloadValid(type, payload) {
          switch (type) {
            case PacketType.CONNECT:
              return isObject(payload);
            case PacketType.DISCONNECT:
              return payload === void 0;
            case PacketType.CONNECT_ERROR:
              return typeof payload === "string" || isObject(payload);
            case PacketType.EVENT:
            case PacketType.BINARY_EVENT:
              return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
            case PacketType.ACK:
            case PacketType.BINARY_ACK:
              return Array.isArray(payload);
          }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
          if (this.reconstructor) {
            this.reconstructor.finishedReconstruction();
            this.reconstructor = null;
          }
        }
      };
      BinaryReconstructor = class {
        constructor(packet) {
          this.packet = packet;
          this.buffers = [];
          this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
          this.buffers.push(binData);
          if (this.buffers.length === this.reconPack.attachments) {
            const packet = reconstructPacket(this.reconPack, this.buffers);
            this.finishedReconstruction();
            return packet;
          }
          return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
          this.reconPack = null;
          this.buffers = [];
        }
      };
    }
  });

  // ../node_modules/socket.io-client/build/esm/on.js
  function on(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
      obj.off(ev, fn);
    };
  }
  var init_on = __esm({
    "../node_modules/socket.io-client/build/esm/on.js"() {
    }
  });

  // ../node_modules/socket.io-client/build/esm/socket.js
  var RESERVED_EVENTS2, Socket2;
  var init_socket2 = __esm({
    "../node_modules/socket.io-client/build/esm/socket.js"() {
      init_esm4();
      init_on();
      init_esm2();
      RESERVED_EVENTS2 = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1
      });
      Socket2 = class extends Emitter {
        /**
         * `Socket` constructor.
         */
        constructor(io, nsp, opts) {
          super();
          this.connected = false;
          this.recovered = false;
          this.receiveBuffer = [];
          this.sendBuffer = [];
          this._queue = [];
          this._queueSeq = 0;
          this.ids = 0;
          this.acks = {};
          this.flags = {};
          this.io = io;
          this.nsp = nsp;
          if (opts && opts.auth) {
            this.auth = opts.auth;
          }
          this._opts = Object.assign({}, opts);
          if (this.io._autoConnect)
            this.open();
        }
        /**
         * Whether the socket is currently disconnected
         *
         * @example
         * const socket = io();
         *
         * socket.on("connect", () => {
         *   console.log(socket.disconnected); // false
         * });
         *
         * socket.on("disconnect", () => {
         *   console.log(socket.disconnected); // true
         * });
         */
        get disconnected() {
          return !this.connected;
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
          if (this.subs)
            return;
          const io = this.io;
          this.subs = [
            on(io, "open", this.onopen.bind(this)),
            on(io, "packet", this.onpacket.bind(this)),
            on(io, "error", this.onerror.bind(this)),
            on(io, "close", this.onclose.bind(this))
          ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects.
         *
         * @example
         * const socket = io();
         *
         * console.log(socket.active); // true
         *
         * socket.on("disconnect", (reason) => {
         *   if (reason === "io server disconnect") {
         *     // the disconnection was initiated by the server, you need to manually reconnect
         *     console.log(socket.active); // false
         *   }
         *   // else the socket will automatically try to reconnect
         *   console.log(socket.active); // true
         * });
         */
        get active() {
          return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @example
         * const socket = io({
         *   autoConnect: false
         * });
         *
         * socket.connect();
         */
        connect() {
          if (this.connected)
            return this;
          this.subEvents();
          if (!this.io["_reconnecting"])
            this.io.open();
          if ("open" === this.io._readyState)
            this.onopen();
          return this;
        }
        /**
         * Alias for {@link connect()}.
         */
        open() {
          return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * This method mimics the WebSocket.send() method.
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
         *
         * @example
         * socket.send("hello");
         *
         * // this is equivalent to
         * socket.emit("message", "hello");
         *
         * @return self
         */
        send(...args) {
          args.unshift("message");
          this.emit.apply(this, args);
          return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @example
         * socket.emit("hello", "world");
         *
         * // all serializable datastructures are supported (no need to call JSON.stringify)
         * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
         *
         * // with an acknowledgement from the server
         * socket.emit("hello", "world", (val) => {
         *   // ...
         * });
         *
         * @return self
         */
        emit(ev, ...args) {
          if (RESERVED_EVENTS2.hasOwnProperty(ev)) {
            throw new Error('"' + ev.toString() + '" is a reserved event name');
          }
          args.unshift(ev);
          if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
            this._addToQueue(args);
            return this;
          }
          const packet = {
            type: PacketType.EVENT,
            data: args
          };
          packet.options = {};
          packet.options.compress = this.flags.compress !== false;
          if ("function" === typeof args[args.length - 1]) {
            const id = this.ids++;
            const ack = args.pop();
            this._registerAckCallback(id, ack);
            packet.id = id;
          }
          const isTransportWritable = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
          const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
          if (discardPacket) {
          } else if (this.connected) {
            this.notifyOutgoingListeners(packet);
            this.packet(packet);
          } else {
            this.sendBuffer.push(packet);
          }
          this.flags = {};
          return this;
        }
        /**
         * @private
         */
        _registerAckCallback(id, ack) {
          var _a;
          const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
          if (timeout === void 0) {
            this.acks[id] = ack;
            return;
          }
          const timer2 = this.io.setTimeoutFn(() => {
            delete this.acks[id];
            for (let i3 = 0; i3 < this.sendBuffer.length; i3++) {
              if (this.sendBuffer[i3].id === id) {
                this.sendBuffer.splice(i3, 1);
              }
            }
            ack.call(this, new Error("operation has timed out"));
          }, timeout);
          const fn = (...args) => {
            this.io.clearTimeoutFn(timer2);
            ack.apply(this, args);
          };
          fn.withError = true;
          this.acks[id] = fn;
        }
        /**
         * Emits an event and waits for an acknowledgement
         *
         * @example
         * // without timeout
         * const response = await socket.emitWithAck("hello", "world");
         *
         * // with a specific timeout
         * try {
         *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
         * } catch (err) {
         *   // the server did not acknowledge the event in the given delay
         * }
         *
         * @return a Promise that will be fulfilled when the server acknowledges the event
         */
        emitWithAck(ev, ...args) {
          return new Promise((resolve, reject) => {
            const fn = (arg1, arg2) => {
              return arg1 ? reject(arg1) : resolve(arg2);
            };
            fn.withError = true;
            args.push(fn);
            this.emit(ev, ...args);
          });
        }
        /**
         * Add the packet to the queue.
         * @param args
         * @private
         */
        _addToQueue(args) {
          let ack;
          if (typeof args[args.length - 1] === "function") {
            ack = args.pop();
          }
          const packet = {
            id: this._queueSeq++,
            tryCount: 0,
            pending: false,
            args,
            flags: Object.assign({ fromQueue: true }, this.flags)
          };
          args.push((err, ...responseArgs) => {
            if (packet !== this._queue[0]) {
              return;
            }
            const hasError = err !== null;
            if (hasError) {
              if (packet.tryCount > this._opts.retries) {
                this._queue.shift();
                if (ack) {
                  ack(err);
                }
              }
            } else {
              this._queue.shift();
              if (ack) {
                ack(null, ...responseArgs);
              }
            }
            packet.pending = false;
            return this._drainQueue();
          });
          this._queue.push(packet);
          this._drainQueue();
        }
        /**
         * Send the first packet of the queue, and wait for an acknowledgement from the server.
         * @param force - whether to resend a packet that has not been acknowledged yet
         *
         * @private
         */
        _drainQueue(force = false) {
          if (!this.connected || this._queue.length === 0) {
            return;
          }
          const packet = this._queue[0];
          if (packet.pending && !force) {
            return;
          }
          packet.pending = true;
          packet.tryCount++;
          this.flags = packet.flags;
          this.emit.apply(this, packet.args);
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
          packet.nsp = this.nsp;
          this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
          if (typeof this.auth == "function") {
            this.auth((data) => {
              this._sendConnectPacket(data);
            });
          } else {
            this._sendConnectPacket(this.auth);
          }
        }
        /**
         * Sends a CONNECT packet to initiate the Socket.IO session.
         *
         * @param data
         * @private
         */
        _sendConnectPacket(data) {
          this.packet({
            type: PacketType.CONNECT,
            data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data) : data
          });
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
          if (!this.connected) {
            this.emitReserved("connect_error", err);
          }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @param description
         * @private
         */
        onclose(reason, description) {
          this.connected = false;
          delete this.id;
          this.emitReserved("disconnect", reason, description);
          this._clearAcks();
        }
        /**
         * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
         * the server.
         *
         * @private
         */
        _clearAcks() {
          Object.keys(this.acks).forEach((id) => {
            const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
            if (!isBuffered) {
              const ack = this.acks[id];
              delete this.acks[id];
              if (ack.withError) {
                ack.call(this, new Error("socket has been disconnected"));
              }
            }
          });
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
          const sameNamespace = packet.nsp === this.nsp;
          if (!sameNamespace)
            return;
          switch (packet.type) {
            case PacketType.CONNECT:
              if (packet.data && packet.data.sid) {
                this.onconnect(packet.data.sid, packet.data.pid);
              } else {
                this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
              }
              break;
            case PacketType.EVENT:
            case PacketType.BINARY_EVENT:
              this.onevent(packet);
              break;
            case PacketType.ACK:
            case PacketType.BINARY_ACK:
              this.onack(packet);
              break;
            case PacketType.DISCONNECT:
              this.ondisconnect();
              break;
            case PacketType.CONNECT_ERROR:
              this.destroy();
              const err = new Error(packet.data.message);
              err.data = packet.data.data;
              this.emitReserved("connect_error", err);
              break;
          }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
          const args = packet.data || [];
          if (null != packet.id) {
            args.push(this.ack(packet.id));
          }
          if (this.connected) {
            this.emitEvent(args);
          } else {
            this.receiveBuffer.push(Object.freeze(args));
          }
        }
        emitEvent(args) {
          if (this._anyListeners && this._anyListeners.length) {
            const listeners = this._anyListeners.slice();
            for (const listener of listeners) {
              listener.apply(this, args);
            }
          }
          super.emit.apply(this, args);
          if (this._pid && args.length && typeof args[args.length - 1] === "string") {
            this._lastOffset = args[args.length - 1];
          }
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
          const self2 = this;
          let sent = false;
          return function(...args) {
            if (sent)
              return;
            sent = true;
            self2.packet({
              type: PacketType.ACK,
              id,
              data: args
            });
          };
        }
        /**
         * Called upon a server acknowledgement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
          const ack = this.acks[packet.id];
          if (typeof ack !== "function") {
            return;
          }
          delete this.acks[packet.id];
          if (ack.withError) {
            packet.data.unshift(null);
          }
          ack.apply(this, packet.data);
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id, pid) {
          this.id = id;
          this.recovered = pid && this._pid === pid;
          this._pid = pid;
          this.connected = true;
          this.emitBuffered();
          this.emitReserved("connect");
          this._drainQueue(true);
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
          this.receiveBuffer.forEach((args) => this.emitEvent(args));
          this.receiveBuffer = [];
          this.sendBuffer.forEach((packet) => {
            this.notifyOutgoingListeners(packet);
            this.packet(packet);
          });
          this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
          this.destroy();
          this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
          if (this.subs) {
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs = void 0;
          }
          this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually. In that case, the socket will not try to reconnect.
         *
         * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
         *
         * @example
         * const socket = io();
         *
         * socket.on("disconnect", (reason) => {
         *   // console.log(reason); prints "io client disconnect"
         * });
         *
         * socket.disconnect();
         *
         * @return self
         */
        disconnect() {
          if (this.connected) {
            this.packet({ type: PacketType.DISCONNECT });
          }
          this.destroy();
          if (this.connected) {
            this.onclose("io client disconnect");
          }
          return this;
        }
        /**
         * Alias for {@link disconnect()}.
         *
         * @return self
         */
        close() {
          return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @example
         * socket.compress(false).emit("hello");
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         */
        compress(compress) {
          this.flags.compress = compress;
          return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @example
         * socket.volatile.emit("hello"); // the server may or may not receive it
         *
         * @returns self
         */
        get volatile() {
          this.flags.volatile = true;
          return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
         * given number of milliseconds have elapsed without an acknowledgement from the server:
         *
         * @example
         * socket.timeout(5000).emit("my-event", (err) => {
         *   if (err) {
         *     // the server did not acknowledge the event in the given delay
         *   }
         * });
         *
         * @returns self
         */
        timeout(timeout) {
          this.flags.timeout = timeout;
          return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @example
         * socket.onAny((event, ...args) => {
         *   console.log(`got ${event}`);
         * });
         *
         * @param listener
         */
        onAny(listener) {
          this._anyListeners = this._anyListeners || [];
          this._anyListeners.push(listener);
          return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @example
         * socket.prependAny((event, ...args) => {
         *   console.log(`got event ${event}`);
         * });
         *
         * @param listener
         */
        prependAny(listener) {
          this._anyListeners = this._anyListeners || [];
          this._anyListeners.unshift(listener);
          return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @example
         * const catchAllListener = (event, ...args) => {
         *   console.log(`got event ${event}`);
         * }
         *
         * socket.onAny(catchAllListener);
         *
         * // remove a specific listener
         * socket.offAny(catchAllListener);
         *
         * // or remove all listeners
         * socket.offAny();
         *
         * @param listener
         */
        offAny(listener) {
          if (!this._anyListeners) {
            return this;
          }
          if (listener) {
            const listeners = this._anyListeners;
            for (let i3 = 0; i3 < listeners.length; i3++) {
              if (listener === listeners[i3]) {
                listeners.splice(i3, 1);
                return this;
              }
            }
          } else {
            this._anyListeners = [];
          }
          return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         */
        listenersAny() {
          return this._anyListeners || [];
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * Note: acknowledgements sent to the server are not included.
         *
         * @example
         * socket.onAnyOutgoing((event, ...args) => {
         *   console.log(`sent event ${event}`);
         * });
         *
         * @param listener
         */
        onAnyOutgoing(listener) {
          this._anyOutgoingListeners = this._anyOutgoingListeners || [];
          this._anyOutgoingListeners.push(listener);
          return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * Note: acknowledgements sent to the server are not included.
         *
         * @example
         * socket.prependAnyOutgoing((event, ...args) => {
         *   console.log(`sent event ${event}`);
         * });
         *
         * @param listener
         */
        prependAnyOutgoing(listener) {
          this._anyOutgoingListeners = this._anyOutgoingListeners || [];
          this._anyOutgoingListeners.unshift(listener);
          return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @example
         * const catchAllListener = (event, ...args) => {
         *   console.log(`sent event ${event}`);
         * }
         *
         * socket.onAnyOutgoing(catchAllListener);
         *
         * // remove a specific listener
         * socket.offAnyOutgoing(catchAllListener);
         *
         * // or remove all listeners
         * socket.offAnyOutgoing();
         *
         * @param [listener] - the catch-all listener (optional)
         */
        offAnyOutgoing(listener) {
          if (!this._anyOutgoingListeners) {
            return this;
          }
          if (listener) {
            const listeners = this._anyOutgoingListeners;
            for (let i3 = 0; i3 < listeners.length; i3++) {
              if (listener === listeners[i3]) {
                listeners.splice(i3, 1);
                return this;
              }
            }
          } else {
            this._anyOutgoingListeners = [];
          }
          return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         */
        listenersAnyOutgoing() {
          return this._anyOutgoingListeners || [];
        }
        /**
         * Notify the listeners for each packet sent
         *
         * @param packet
         *
         * @private
         */
        notifyOutgoingListeners(packet) {
          if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
            const listeners = this._anyOutgoingListeners.slice();
            for (const listener of listeners) {
              listener.apply(this, packet.data);
            }
          }
        }
      };
    }
  });

  // ../node_modules/socket.io-client/build/esm/contrib/backo2.js
  function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 1e4;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
  }
  var init_backo2 = __esm({
    "../node_modules/socket.io-client/build/esm/contrib/backo2.js"() {
      Backoff.prototype.duration = function() {
        var ms = this.ms * Math.pow(this.factor, this.attempts++);
        if (this.jitter) {
          var rand = Math.random();
          var deviation = Math.floor(rand * this.jitter * ms);
          ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
        }
        return Math.min(ms, this.max) | 0;
      };
      Backoff.prototype.reset = function() {
        this.attempts = 0;
      };
      Backoff.prototype.setMin = function(min) {
        this.ms = min;
      };
      Backoff.prototype.setMax = function(max) {
        this.max = max;
      };
      Backoff.prototype.setJitter = function(jitter) {
        this.jitter = jitter;
      };
    }
  });

  // ../node_modules/socket.io-client/build/esm/manager.js
  var Manager;
  var init_manager = __esm({
    "../node_modules/socket.io-client/build/esm/manager.js"() {
      init_esm3();
      init_socket2();
      init_esm4();
      init_on();
      init_backo2();
      init_esm2();
      Manager = class extends Emitter {
        constructor(uri, opts) {
          var _a;
          super();
          this.nsps = {};
          this.subs = [];
          if (uri && "object" === typeof uri) {
            opts = uri;
            uri = void 0;
          }
          opts = opts || {};
          opts.path = opts.path || "/socket.io";
          this.opts = opts;
          installTimerFunctions(this, opts);
          this.reconnection(opts.reconnection !== false);
          this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
          this.reconnectionDelay(opts.reconnectionDelay || 1e3);
          this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
          this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
          this.backoff = new Backoff({
            min: this.reconnectionDelay(),
            max: this.reconnectionDelayMax(),
            jitter: this.randomizationFactor()
          });
          this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
          this._readyState = "closed";
          this.uri = uri;
          const _parser = opts.parser || esm_exports;
          this.encoder = new _parser.Encoder();
          this.decoder = new _parser.Decoder();
          this._autoConnect = opts.autoConnect !== false;
          if (this._autoConnect)
            this.open();
        }
        reconnection(v) {
          if (!arguments.length)
            return this._reconnection;
          this._reconnection = !!v;
          return this;
        }
        reconnectionAttempts(v) {
          if (v === void 0)
            return this._reconnectionAttempts;
          this._reconnectionAttempts = v;
          return this;
        }
        reconnectionDelay(v) {
          var _a;
          if (v === void 0)
            return this._reconnectionDelay;
          this._reconnectionDelay = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
          return this;
        }
        randomizationFactor(v) {
          var _a;
          if (v === void 0)
            return this._randomizationFactor;
          this._randomizationFactor = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
          return this;
        }
        reconnectionDelayMax(v) {
          var _a;
          if (v === void 0)
            return this._reconnectionDelayMax;
          this._reconnectionDelayMax = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
          return this;
        }
        timeout(v) {
          if (!arguments.length)
            return this._timeout;
          this._timeout = v;
          return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
          if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
            this.reconnect();
          }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
          if (~this._readyState.indexOf("open"))
            return this;
          this.engine = new Socket(this.uri, this.opts);
          const socket2 = this.engine;
          const self2 = this;
          this._readyState = "opening";
          this.skipReconnect = false;
          const openSubDestroy = on(socket2, "open", function() {
            self2.onopen();
            fn && fn();
          });
          const onError = (err) => {
            this.cleanup();
            this._readyState = "closed";
            this.emitReserved("error", err);
            if (fn) {
              fn(err);
            } else {
              this.maybeReconnectOnOpen();
            }
          };
          const errorSub = on(socket2, "error", onError);
          if (false !== this._timeout) {
            const timeout = this._timeout;
            const timer2 = this.setTimeoutFn(() => {
              openSubDestroy();
              onError(new Error("timeout"));
              socket2.close();
            }, timeout);
            if (this.opts.autoUnref) {
              timer2.unref();
            }
            this.subs.push(() => {
              this.clearTimeoutFn(timer2);
            });
          }
          this.subs.push(openSubDestroy);
          this.subs.push(errorSub);
          return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
          return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
          this.cleanup();
          this._readyState = "open";
          this.emitReserved("open");
          const socket2 = this.engine;
          this.subs.push(on(socket2, "ping", this.onping.bind(this)), on(socket2, "data", this.ondata.bind(this)), on(socket2, "error", this.onerror.bind(this)), on(socket2, "close", this.onclose.bind(this)), on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
          this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
          try {
            this.decoder.add(data);
          } catch (e) {
            this.onclose("parse error", e);
          }
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
          nextTick(() => {
            this.emitReserved("packet", packet);
          }, this.setTimeoutFn);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
          this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
          let socket2 = this.nsps[nsp];
          if (!socket2) {
            socket2 = new Socket2(this, nsp, opts);
            this.nsps[nsp] = socket2;
          } else if (this._autoConnect && !socket2.active) {
            socket2.connect();
          }
          return socket2;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket2) {
          const nsps = Object.keys(this.nsps);
          for (const nsp of nsps) {
            const socket3 = this.nsps[nsp];
            if (socket3.active) {
              return;
            }
          }
          this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
          const encodedPackets = this.encoder.encode(packet);
          for (let i3 = 0; i3 < encodedPackets.length; i3++) {
            this.engine.write(encodedPackets[i3], packet.options);
          }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
          this.subs.forEach((subDestroy) => subDestroy());
          this.subs.length = 0;
          this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
          this.skipReconnect = true;
          this._reconnecting = false;
          this.onclose("forced close");
          if (this.engine)
            this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
          return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */
        onclose(reason, description) {
          this.cleanup();
          this.backoff.reset();
          this._readyState = "closed";
          this.emitReserved("close", reason, description);
          if (this._reconnection && !this.skipReconnect) {
            this.reconnect();
          }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
          if (this._reconnecting || this.skipReconnect)
            return this;
          const self2 = this;
          if (this.backoff.attempts >= this._reconnectionAttempts) {
            this.backoff.reset();
            this.emitReserved("reconnect_failed");
            this._reconnecting = false;
          } else {
            const delay = this.backoff.duration();
            this._reconnecting = true;
            const timer2 = this.setTimeoutFn(() => {
              if (self2.skipReconnect)
                return;
              this.emitReserved("reconnect_attempt", self2.backoff.attempts);
              if (self2.skipReconnect)
                return;
              self2.open((err) => {
                if (err) {
                  self2._reconnecting = false;
                  self2.reconnect();
                  this.emitReserved("reconnect_error", err);
                } else {
                  self2.onreconnect();
                }
              });
            }, delay);
            if (this.opts.autoUnref) {
              timer2.unref();
            }
            this.subs.push(() => {
              this.clearTimeoutFn(timer2);
            });
          }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
          const attempt = this.backoff.attempts;
          this._reconnecting = false;
          this.backoff.reset();
          this.emitReserved("reconnect", attempt);
        }
      };
    }
  });

  // ../node_modules/socket.io-client/build/esm/index.js
  function lookup2(uri, opts) {
    if (typeof uri === "object") {
      opts = uri;
      uri = void 0;
    }
    opts = opts || {};
    const parsed = url(uri, opts.path || "/socket.io");
    const source = parsed.source;
    const id = parsed.id;
    const path = parsed.path;
    const sameNamespace = cache[id] && path in cache[id]["nsps"];
    const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
    let io;
    if (newConnection) {
      io = new Manager(source, opts);
    } else {
      if (!cache[id]) {
        cache[id] = new Manager(source, opts);
      }
      io = cache[id];
    }
    if (parsed.query && !opts.query) {
      opts.query = parsed.queryKey;
    }
    return io.socket(parsed.path, opts);
  }
  var cache;
  var init_esm5 = __esm({
    "../node_modules/socket.io-client/build/esm/index.js"() {
      init_url();
      init_manager();
      init_socket2();
      init_esm4();
      cache = {};
      Object.assign(lookup2, {
        Manager,
        Socket: Socket2,
        io: lookup2,
        connect: lookup2
      });
    }
  });

  // src/socket/index.js
  function emitTutorialMessageToHandlers(messageHandlers, data) {
    messageHandlers.forEach((fn) => {
      try {
        fn(data);
      } catch {
      }
    });
  }
  function forEachTutorialPhantomSeat(callback) {
    const seatCount = Number(window.num) || 2;
    for (let seat = 0; seat < seatCount; seat += 1) {
      if (seat === TUTORIAL_HUMAN_SEAT) {
        continue;
      }
      callback(seat);
    }
  }
  function autoResolveTutorialPhantomSeats(messageHandlers, buildMessageForSeat) {
    forEachTutorialPhantomSeat((seat) => {
      const msg = buildMessageForSeat(seat);
      if (!msg) {
        return;
      }
      queueMicrotask(() => {
        emitTutorialMessageToHandlers(messageHandlers, msg);
      });
    });
  }
  function createTutorialSocketStub() {
    const messageHandlers = [];
    return {
      emit(event, data) {
        if (event === "message" && data) {
          if (typeof window !== "undefined" && window.__TUTORIAL_BOARD) {
            if (data.method === "BadStaffLevel") {
              window.dispatchEvent(new CustomEvent("munchkin:tutorialBadStaff", { detail: data }));
              return;
            }
            if (data.method === "Treasure65LevelSwap") {
              window.dispatchEvent(new CustomEvent("munchkin:tutorialTreasure65", { detail: data }));
              return;
            }
            if (data.method === "TreasureLevel") {
              window.dispatchEvent(new CustomEvent("munchkin:tutorialTreasureLevel", { detail: data }));
              return;
            }
            if (data.method === "LevelAdjust") {
              window.dispatchEvent(new CustomEvent("munchkin:tutorialLevelAdjust", { detail: data }));
              return;
            }
            if (data.method === "FoldCount") {
              emitTutorialMessageToHandlers(messageHandlers, data);
              window.FoldCount = Number(window.num) || 2;
              return;
            }
            if (data.method === "EscapeGluePrompt") {
              emitTutorialMessageToHandlers(messageHandlers, data);
              const wallFlee = new Set(
                (Array.isArray(data.wallFleeSeats) ? data.wallFleeSeats : []).map((s) => Number(s)).filter((s) => Number.isFinite(s))
              );
              autoResolveTutorialPhantomSeats(messageHandlers, (seat) => {
                if (wallFlee.has(seat)) {
                  return null;
                }
                return {
                  method: "EscapeGlueDecision",
                  key: String(data.key || ""),
                  used: false,
                  actingSeat: seat,
                  targetSeat: data.escapedSeat,
                  monsterCardId: data.monsterCardId,
                  viaInstantWall: data.viaInstantWall,
                  wallFleeSeats: data.wallFleeSeats
                };
              });
              return;
            }
            if (data.method === "InstantWallHelperPrompt") {
              emitTutorialMessageToHandlers(messageHandlers, data);
              const helperSeat = Number(data.helperSeat);
              if (Number.isFinite(helperSeat) && helperSeat !== TUTORIAL_HUMAN_SEAT) {
                queueMicrotask(() => {
                  emitTutorialMessageToHandlers(messageHandlers, {
                    method: "InstantWallHelperDecision",
                    helperSeat,
                    loserSeat: data.loserSeat,
                    used: false,
                    cardId: null
                  });
                });
              }
              return;
            }
            if (data.method === "PlayerMeta") {
              emitTutorialMessageToHandlers(messageHandlers, data);
              queueMicrotask(() => {
                window.__applyTutorialSeatDisplayNames?.();
              });
              return;
            }
          }
          emitTutorialMessageToHandlers(messageHandlers, data);
          if (window.__TUTORIAL_BOARD && data.method === "EscapeSequenceFinished") {
            queueMicrotask(() => {
              window.dispatchEvent(new Event("munchkin:tutorialEscapeFinished"));
            });
          }
          if (window.__TUTORIAL_BOARD && data.method === "1") {
            queueMicrotask(() => {
              window.dispatchEvent(new Event("munchkin:tutorialCatalogReady"));
            });
          }
        }
      },
      on(event, fn) {
        if (event === "message" && typeof fn === "function") {
          messageHandlers.push(fn);
        }
      },
      off() {
      },
      connect() {
        return this;
      },
      disconnect() {
      }
    };
  }
  var TUTORIAL_HUMAN_SEAT, options, explicitUrl, url2, useTutorialSocket, socket, socket_default;
  var init_socket3 = __esm({
    "src/socket/index.js"() {
      init_esm5();
      TUTORIAL_HUMAN_SEAT = 0;
      options = {
        "force new connection": true,
        reconnectionAttempts: "Infinity",
        // avoid having user reconnect manually in order to prevent dead clients after a server restart
        timeout: 1e4,
        // before connect_error and connect_timeout are emitted.
        transports: ["websocket", "polling"]
      };
      explicitUrl = "";
      url2 = explicitUrl ? explicitUrl : true ? "http://localhost:3001" : "/";
      useTutorialSocket = typeof window !== "undefined" && window.__TUTORIAL_BOARD;
      socket = useTutorialSocket ? createTutorialSocketStub() : lookup2(url2, options);
      socket_default = socket;
    }
  });

  // src/card-block.js
  function isMonsterDoorCard(cardEl) {
    const id = cardEl?.id;
    if (!id) {
      return false;
    }
    const door96 = window.doors?.find((d) => d.name === id);
    return Boolean(door96 && String(door96.race || "") === "monster");
  }
  function isWanderingMonsterCard(cardEl) {
    const id = cardEl?.id;
    if (!id) {
      return false;
    }
    const door96 = window.doors?.find((d) => d.name === id);
    return Boolean(door96 && String(door96.special || "") === "Wandering Monster");
  }
  function canPlaceCardIntoMonsterBattleZone(cardEl, zoneEl) {
    if (!cardEl || !zoneEl) {
      return true;
    }
    const isMonsterZone = zoneEl.id === "zone_monster" || zoneEl.classList?.contains("zone_monster");
    if (!isMonsterZone) {
      return true;
    }
    const fromHand = Boolean(dragFromSnapshot?.parent?.classList?.contains("myhand"));
    if (fromHand && isMonsterDoorCard(cardEl) && !isWanderingMonsterCard(cardEl)) {
      const hasAnyMonsterAlready = Array.from(zoneEl.querySelectorAll?.(".card") || []).some((el) => {
        if (el && el.id === cardEl.id) {
          return false;
        }
        const door96 = window.doors?.find((d) => d.name === el.id);
        return Boolean(door96 && String(door96.race || "") === "monster");
      });
      if (hasAnyMonsterAlready) {
        return false;
      }
    }
    return true;
  }
  function isMagicLampTreasureCard(cardEl) {
    const id = cardEl?.id;
    if (!id) {
      return false;
    }
    const tr = window.treasures?.find((t) => t.name === id);
    return Boolean(tr && String(tr.special || "") === "Magic lamp");
  }
  function canPlaceMagicLampIntoBattleZone(cardEl, zoneEl) {
    if (!cardEl || !zoneEl) {
      return true;
    }
    const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
    if (!isBattleBonusZone) {
      return true;
    }
    if (!isMagicLampTreasureCard(cardEl)) {
      return true;
    }
    return canLocalPlayMagicLampToBattleZone(zoneEl);
  }
  function dragend_handler(e) {
    if (currentDrag) {
      currentDrag.style.filter = "";
    } else {
      const c = e.target && e.target.closest && e.target.closest(".card");
      if (c) {
        c.style.filter = "";
      }
    }
    if (currentDrag && !dropHandled && lastHoverZone && dragFromSnapshot?.parent && currentDrag.isConnected) {
      const zone = lastHoverZone;
      const target = lastHoverTargetCard;
      const invalidTreasureEquip = currentDrag && zone && !canPlaceTreasureInPlayerEquipment(currentDrag, zone);
      const invalidDoorEquip = currentDrag && zone && !canPlaceDoorInPlayerEquipment(currentDrag, zone);
      const invalidMonsterToBattle = currentDrag && zone && !canPlaceCardIntoMonsterBattleZone(currentDrag, zone);
      const invalidMagicLampToBattle = currentDrag && zone && !canPlaceMagicLampIntoBattleZone(currentDrag, zone);
      const invalidDopplegangerBonus = currentDrag && zone && !canPlaceDopplegangerTreasureInBonusZone(currentDrag, zone);
      const invalidYuppieWaterBonus = currentDrag && zone && !canPlaceYuppieWaterTreasureInBonusZone(currentDrag, zone);
      if (invalidTreasureEquip || invalidDoorEquip || invalidMonsterToBattle || invalidMagicLampToBattle || invalidDopplegangerBonus || invalidYuppieWaterBonus) {
        dragFromSnapshot.parent.insertBefore(currentDrag, dragFromSnapshot.next);
        currentDrag.style.filter = "";
      } else {
        if (target && zone.contains(target)) {
          const next = target.nextSibling;
          if (next && zone.contains(next)) {
            zone.insertBefore(currentDrag, next);
          } else {
            zone.appendChild(currentDrag);
          }
        } else {
          zone.appendChild(currentDrag);
        }
      }
      if (invalidTreasureEquip && zone) {
        notifyIfTreasureLevelBlockedOnSeat(currentDrag, zone);
        notifyIfKillHirelingBlockedOnSeat(currentDrag, zone);
        notifyIfWhineAtGMBlockedOnSeat(currentDrag, zone);
      }
      adjustCardWidth(".myhand");
      adjustCardWidth(".zone2");
      adjustCardWidth(".zone5");
      adjustCardHeight(".zone3");
      adjustCardHeight(".zone_monster");
      adjustCardWidth(".opponenthand");
      adjustCardWidth(".zone_opponent");
      adjustCardWidth(".zone_opponent_side");
      adjustCardWidth(".opponent2hand");
      adjustCardWidth(".zone_opponent2");
      adjustCardWidth(".zone_opponent2_side");
      adjustCardWidth(".opponent3hand");
      adjustCardWidth(".zone_opponent3");
      adjustCardWidth(".zone_opponent3_side");
      adjustCardWidth(".opponent_br_hand");
      adjustCardWidth(".zone_opponent_br");
      adjustCardWidth(".zone_opponent_br_side");
      UpdatebackImgTreasure();
      UpdatebackImgDoor();
      recalculateAllPowerDisplays();
      const moveData = {
        method: "moveCard",
        cardId: currentDrag.id,
        targetId: currentDrag.previousElementSibling ? currentDrag.previousElementSibling.id : null,
        zoneId: currentDrag.parentElement ? currentDrag.parentElement.id : null,
        fromZoneId: dragFromSnapshot?.parent?.id || null
      };
      const seatForPlayed = getLocalSeatForSocket();
      if (seatForPlayed != null && seatForPlayed !== void 0 && !Number.isNaN(Number(seatForPlayed))) {
        moveData.playedBySeat = Number(seatForPlayed);
      }
      socket_default.emit("message", moveData);
      const parentZone = currentDrag.parentElement;
      if (parentZone) {
        scheduleBadStaffIfNeeded(currentDrag.id, parentZone);
        scheduleTreasureLevelIfNeeded(currentDrag.id, parentZone);
        scheduleTreasure65IfNeeded(currentDrag.id, parentZone);
        scheduleMonsterBonusAttachIfNeeded(currentDrag.id, parentZone);
        scheduleWanderingMonsterIfNeeded(currentDrag.id, parentZone, dragFromSnapshot?.parent?.id || null);
        scheduleCheatIfNeeded(currentDrag.id, parentZone);
        scheduleMagicLampIfNeeded(currentDrag.id, parentZone);
        schedulePollymorthPotionIfNeeded(currentDrag.id, parentZone);
        scheduleIllusionIfNeeded(currentDrag.id, parentZone);
        scheduleMateIfNeeded(currentDrag.id, parentZone);
      }
    }
    dropHandled = false;
    lastHoverZone = null;
    lastHoverTargetCard = null;
    dragFromSnapshot = null;
    currentDrag = null;
  }
  function recalculateMyPower(shouldSync = true) {
    const newValue = recalculateAllPowerDisplays();
    if (shouldSync) {
      const messageUpdateData = {
        method: "UpdatePower",
        power: newValue
      };
      socket_default.emit("message", messageUpdateData);
    }
    return newValue;
  }
  function setupDragStateFromCard(cardEl) {
    if (!cardEl || !cardEl.classList.contains("card")) {
      return;
    }
    currentDrag = cardEl;
    const zone = cardEl.closest(".cards-zone");
    if (currentDrag && currentDrag.parentElement) {
      dragFromSnapshot = {
        parent: currentDrag.parentElement,
        next: currentDrag.nextSibling
      };
    } else {
      dragFromSnapshot = null;
    }
    dragStartedFromZone2 = Boolean(zone?.classList.contains("zone2"));
    lastHoverZone = null;
    lastHoverTargetCard = null;
    dropHandled = false;
    if (zone?.classList.contains("zone3") && currentDrag) {
      const CardID = currentDrag.id;
      const foundCard = window.treasures.find((card) => card.name === CardID);
      if (foundCard) {
        let power = foundCard.power;
        if (power > 0) {
          const MyBonus = document.getElementById("MyBonus");
          let currentValue = parseFloat(MyBonus.textContent);
          let newValue = currentValue - power;
          MyBonus.textContent = newValue;
          const messageUpdateData = {
            method: "UpdateBonus",
            power: newValue
          };
          socket_default.emit("message", messageUpdateData);
        }
      }
    }
    if (zone?.classList.contains("zone_monster") && currentDrag) {
      const CardID = currentDrag.id;
      let foundCard = window.doors.find((card) => card.name === CardID);
      if (foundCard == null) {
        foundCard = window.treasures.find((card) => card.name === CardID);
      }
      ;
      if (foundCard) {
        let power = foundCard.power;
        if (power > 0) {
          const MonsterBonus = document.getElementById("MonsterBonus");
          let currentValue = parseFloat(MonsterBonus.textContent);
          let newValue = currentValue - power;
          MonsterBonus.textContent = newValue;
          const messageUpdateData = {
            method: "UpdateMonster",
            power: newValue
          };
          socket_default.emit("message", messageUpdateData);
        }
      }
    }
  }
  function beginDragFromZoomImage(cardEl, dragEvent) {
    if (!cardEl?.classList?.contains?.("card")) {
      return;
    }
    if (dragEvent?.dataTransfer) {
      dragEvent.dataTransfer.effectAllowed = "move";
      try {
        if (cardEl.id) {
          dragEvent.dataTransfer.setData("text/plain", cardEl.id);
        }
      } catch {
      }
      const item = cardEl.querySelector(".card-item");
      if (item) {
        try {
          const r = item.getBoundingClientRect();
          dragEvent.dataTransfer.setDragImage(item, Math.max(1, r.width / 2), Math.max(1, r.height / 2));
        } catch {
        }
      }
    }
    setupDragStateFromCard(cardEl);
    setTimeout(() => closeCardZoomModal(), 0);
  }
  function dragstart_handler(e) {
    closeCardZoomModal();
    const card = e.target.closest(".card");
    if (!card) {
      return;
    }
    setupDragStateFromCard(card);
  }
  function dragover_handler(e) {
    e.preventDefault();
    if (!currentDrag) {
      return;
    }
    const target = e.target.closest(".card");
    const zone = e.target.closest(".cards-zone");
    if (target && target !== currentDrag && target.parentElement === currentDrag.parentElement) {
      currentDrag.parentElement.insertBefore(currentDrag, target.nextSibling);
    } else if (zone) {
      const crossZone = currentDrag.parentElement !== zone;
      currentDrag.remove();
      if (crossZone) {
        zone.appendChild(currentDrag);
      } else if (target && target !== currentDrag && zone.contains(target)) {
        if (target.nextSibling && zone.contains(target.nextSibling)) {
          zone.insertBefore(currentDrag, target.nextSibling);
        } else {
          zone.appendChild(currentDrag);
        }
      } else {
        zone.appendChild(currentDrag);
      }
      lastHoverZone = zone;
      lastHoverTargetCard = crossZone ? null : target && target !== currentDrag ? target : null;
    }
    e.dataTransfer.dropEffect = "move";
    const invalidTreasureEquip = currentDrag && zone && !canPlaceTreasureInPlayerEquipment(currentDrag, zone);
    const invalidDoorEquip = currentDrag && zone && !canPlaceDoorInPlayerEquipment(currentDrag, zone);
    const invalidMonsterToBattle = currentDrag && zone && !canPlaceCardIntoMonsterBattleZone(currentDrag, zone);
    const invalidMagicLampToBattle = currentDrag && zone && !canPlaceMagicLampIntoBattleZone(currentDrag, zone);
    const invalidDopplegangerBonus = currentDrag && zone && !canPlaceDopplegangerTreasureInBonusZone(currentDrag, zone);
    const invalidYuppieWaterBonus = currentDrag && zone && !canPlaceYuppieWaterTreasureInBonusZone(currentDrag, zone);
    if (invalidTreasureEquip || invalidDoorEquip || invalidMonsterToBattle || invalidMagicLampToBattle || invalidDopplegangerBonus || invalidYuppieWaterBonus) {
      if (currentDrag) {
        currentDrag.style.filter = invalidMonsterToBattle ? INVALID_MONSTER_TO_BATTLE_FILTER : INVALID_TREASURE_EQUIPMENT_FILTER;
      }
    } else if (currentDrag) {
      currentDrag.style.filter = "";
    }
    UpdateZones();
  }
  function drop_handler(e) {
    e.preventDefault();
    dropHandled = true;
    const target = e.target.closest(".card");
    const zone = e.target.closest(".cards-zone");
    if (!zone || !currentDrag || !currentDrag.isConnected) {
      if (currentDrag) {
        try {
          currentDrag.style.filter = "";
        } catch {
        }
      }
      currentDrag = null;
      lastHoverZone = null;
      lastHoverTargetCard = null;
      return;
    }
    const invalidTreasureEquip = currentDrag && zone && !canPlaceTreasureInPlayerEquipment(currentDrag, zone);
    const invalidDoorEquip = currentDrag && zone && !canPlaceDoorInPlayerEquipment(currentDrag, zone);
    const invalidMonsterToBattle = currentDrag && zone && !canPlaceCardIntoMonsterBattleZone(currentDrag, zone);
    const invalidMagicLampToBattle = currentDrag && zone && !canPlaceMagicLampIntoBattleZone(currentDrag, zone);
    const invalidDopplegangerBonus = currentDrag && zone && !canPlaceDopplegangerTreasureInBonusZone(currentDrag, zone);
    const invalidYuppieWaterBonus = currentDrag && zone && !canPlaceYuppieWaterTreasureInBonusZone(currentDrag, zone);
    if (currentDrag && zone && (invalidTreasureEquip || invalidDoorEquip || invalidMonsterToBattle || invalidMagicLampToBattle || invalidDopplegangerBonus || invalidYuppieWaterBonus) && dragFromSnapshot?.parent) {
      dragFromSnapshot.parent.insertBefore(currentDrag, dragFromSnapshot.next);
      if (currentDrag) {
        currentDrag.style.filter = "";
      }
      if (invalidTreasureEquip) {
        notifyIfTreasureLevelBlockedOnSeat(currentDrag, zone);
        notifyIfKillHirelingBlockedOnSeat(currentDrag, zone);
        notifyIfWhineAtGMBlockedOnSeat(currentDrag, zone);
      }
      adjustCardWidth(".myhand");
      adjustCardWidth(".zone2");
      adjustCardWidth(".zone5");
      adjustCardHeight(".zone3");
      adjustCardHeight(".zone_monster");
      adjustCardWidth(".opponenthand");
      adjustCardWidth(".zone_opponent");
      adjustCardWidth(".zone_opponent_side");
      adjustCardWidth(".opponent2hand");
      adjustCardWidth(".zone_opponent2");
      adjustCardWidth(".zone_opponent2_side");
      adjustCardWidth(".opponent3hand");
      adjustCardWidth(".zone_opponent3");
      adjustCardWidth(".zone_opponent3_side");
      UpdatebackImgTreasure();
      UpdatebackImgDoor();
      recalculateAllPowerDisplays();
      const moveData2 = {
        method: "moveCard",
        cardId: currentDrag.id,
        targetId: currentDrag.previousElementSibling ? currentDrag.previousElementSibling.id : null,
        zoneId: currentDrag.parentElement ? currentDrag.parentElement.id : null,
        fromZoneId: dragFromSnapshot?.parent?.id || null
      };
      const seatPlayedInvalid = getLocalSeatForSocket();
      if (seatPlayedInvalid != null && seatPlayedInvalid !== void 0 && !Number.isNaN(Number(seatPlayedInvalid))) {
        moveData2.playedBySeat = Number(seatPlayedInvalid);
      }
      socket_default.emit("message", moveData2);
      if (currentDrag) {
        const parentZone = currentDrag.parentElement;
        if (parentZone) {
          scheduleBadStaffIfNeeded(currentDrag.id, parentZone);
          scheduleTreasureLevelIfNeeded(currentDrag.id, parentZone);
          scheduleTreasure65IfNeeded(currentDrag.id, parentZone);
          scheduleMonsterBonusAttachIfNeeded(currentDrag.id, parentZone);
          scheduleWanderingMonsterIfNeeded(currentDrag.id, parentZone, dragFromSnapshot?.parent?.id || null);
          scheduleCheatIfNeeded(currentDrag.id, parentZone);
          scheduleMagicLampIfNeeded(currentDrag.id, parentZone);
          schedulePollymorthPotionIfNeeded(currentDrag.id, parentZone);
          scheduleIllusionIfNeeded(currentDrag.id, parentZone);
          scheduleMateIfNeeded(currentDrag.id, parentZone);
        }
      }
      return;
    }
    if (currentDrag && zone) {
      if (target && zone.contains(target)) {
        const next = target.nextSibling;
        if (next && zone.contains(next)) {
          zone.insertBefore(currentDrag, next);
        } else {
          zone.appendChild(currentDrag);
        }
      } else {
        zone.appendChild(currentDrag);
      }
    }
    const droppedToZone2 = zone.classList.contains("zone2");
    if (currentDrag && (dragStartedFromZone2 || droppedToZone2)) {
      recalculateMyPower();
    }
    if (zone.classList.contains("zone3") && currentDrag) {
      const CardID = currentDrag.id;
      const foundCard = window.treasures.find((card) => card.name === CardID);
      if (foundCard) {
        let power = foundCard.power;
        if (power > 0) {
          const MyBonus = document.getElementById("MyBonus");
          let currentValue = parseInt(MyBonus.textContent);
          let newValue = currentValue + power;
          MyBonus.textContent = newValue;
          const messageUpdateData = {
            method: "UpdateBonus",
            power: newValue
          };
          socket_default.emit("message", messageUpdateData);
        }
      }
    }
    if (zone.classList.contains("zone_monster") && currentDrag) {
      const CardID = currentDrag.id;
      let foundCard = window.doors.find((card) => card.name === CardID);
      if (foundCard == null) {
        foundCard = window.treasures.find((card) => card.name === CardID);
      }
      ;
      if (foundCard) {
        let power = foundCard.power;
        if (power > 0) {
          const MonsterBonus = document.getElementById("MonsterBonus");
          let currentValue = parseInt(MonsterBonus.textContent);
          let newValue = currentValue + power;
          MonsterBonus.textContent = newValue;
          const messageUpdateData = {
            method: "UpdateMonster",
            power: newValue
          };
          socket_default.emit("message", messageUpdateData);
        }
      }
    }
    adjustCardWidth(".myhand");
    adjustCardWidth(".zone2");
    adjustCardHeight(".zone3");
    adjustCardHeight(".zone_monster");
    adjustCardWidth(".zone5");
    adjustCardWidth(".opponenthand");
    adjustCardWidth(".zone_opponent");
    adjustCardWidth(".zone_opponent_side");
    adjustCardWidth(".opponent2hand");
    adjustCardWidth(".zone_opponent2");
    adjustCardWidth(".zone_opponent2_side");
    adjustCardWidth(".opponent3hand");
    adjustCardWidth(".zone_opponent3");
    adjustCardWidth(".zone_opponent3_side");
    adjustCardWidth(".opponent_br_hand");
    adjustCardWidth(".zone_opponent_br");
    adjustCardWidth(".zone_opponent_br_side");
    UpdatebackImgTreasure();
    UpdatebackImgDoor();
    recalculateAllPowerDisplays();
    const moveData = {
      method: "moveCard",
      cardId: currentDrag.id,
      targetId: target ? target.id : null,
      zoneId: zone.id,
      fromZoneId: dragFromSnapshot?.parent?.id || null
    };
    const seatPlayed = getLocalSeatForSocket();
    if (seatPlayed != null && seatPlayed !== void 0 && !Number.isNaN(Number(seatPlayed))) {
      moveData.playedBySeat = Number(seatPlayed);
    }
    socket_default.emit("message", moveData);
    if (currentDrag && currentDrag.isConnected && (zone.id === "zone3" || zone.id === "zone_monster") && getMonsterBattleContext().hasMonster) {
      timer();
      socket_default.emit("message", { method: "UpdateTimer" });
    }
    if (currentDrag && zone) {
      scheduleBadStaffIfNeeded(currentDrag.id, zone);
      scheduleTreasureLevelIfNeeded(currentDrag.id, zone);
      scheduleTreasure65IfNeeded(currentDrag.id, zone);
      scheduleMonsterBonusAttachIfNeeded(currentDrag.id, zone);
      scheduleWanderingMonsterIfNeeded(currentDrag.id, zone, dragFromSnapshot?.parent?.id || null);
      scheduleCheatIfNeeded(currentDrag.id, zone);
      scheduleMagicLampIfNeeded(currentDrag.id, zone);
      schedulePollymorthPotionIfNeeded(currentDrag.id, zone);
      scheduleIllusionIfNeeded(currentDrag.id, zone);
      scheduleMateIfNeeded(currentDrag.id, zone);
    }
  }
  function checkAllCards() {
    if (window.allCards != null) {
      window.allCards.forEach((item) => {
        item.addEventListener("dragstart", dragstart_handler);
        item.addEventListener("dragend", dragend_handler);
      });
    } else {
      setTimeout(checkAllCards, 100);
    }
  }
  function bindZonesNow() {
    try {
      const zones = Array.from(document.querySelectorAll(".cards-zone")).filter(Boolean);
      zones.forEach((zone) => {
        zone.style.pointerEvents = "";
        zone.style.opacity = "";
        zone.removeEventListener("dragover", dragover_handler);
        zone.removeEventListener("drop", drop_handler);
        zone.addEventListener("dragover", dragover_handler);
        zone.addEventListener("drop", drop_handler);
      });
      window.allCards = document.querySelectorAll(".card");
      checkAllCards();
      document.querySelectorAll(".card").forEach((c) => {
        c.style.filter = "";
        c.style.opacity = "";
      });
    } catch {
    }
  }
  function adjustCardHeight(zoneSelector) {
    let cards = document.querySelectorAll(zoneSelector + " > .card");
    let totalHeight = 0;
    cards.forEach(function(card) {
      totalHeight += card.offsetHeight;
    });
    if (!prevcardsCount2[zoneSelector]) {
      prevcardsCount2[zoneSelector] = 0;
    }
    let cardsCount = cards.length;
    if (!prevHeight[zoneSelector]) {
      prevHeight[zoneSelector] = 0;
    }
    let newHeight = 80 / cardsCount;
    if (cardsCount < 4) {
      cards.forEach(function(card) {
        card.style.height = "20px";
      });
    } else if (cardsCount < prevcardsCount2[zoneSelector]) {
      cards.forEach(function(card) {
        card.style.height = prevHeight[zoneSelector] + "px";
      });
    } else if (totalHeight > 80 && cardsCount >= 4) {
      cards.forEach(function(card) {
        card.style.height = newHeight + "px";
      });
    }
    prevcardsCount2[zoneSelector] = cardsCount;
    prevHeight[zoneSelector] = newHeight;
  }
  function adjustCardWidth(zoneSelector) {
    let cards = document.querySelectorAll(zoneSelector + " > .card");
    let totalWidth = 0;
    cards.forEach(function(card) {
      totalWidth += card.offsetWidth;
    });
    if (!prevcardsCount[zoneSelector]) {
      prevcardsCount[zoneSelector] = 0;
    }
    let cardsCount = cards.length;
    if (!prevWidth[zoneSelector]) {
      prevWidth[zoneSelector] = 0;
    }
    let newWidth = 210 / cardsCount;
    if (cardsCount <= 3) {
      cards.forEach(function(card) {
        card.style.width = "70px";
      });
    } else if (cardsCount < prevcardsCount[zoneSelector]) {
      cards.forEach(function(card) {
        card.style.width = prevWidth[zoneSelector] + "px";
      });
    } else if (totalWidth > 210 && cardsCount > 3) {
      cards.forEach(function(card) {
        card.style.width = newWidth + "px";
      });
    }
    prevcardsCount[zoneSelector] = cardsCount;
    prevWidth[zoneSelector] = newWidth;
  }
  var currentDrag, dragStartedFromZone2, dragFromSnapshot, lastHoverZone, lastHoverTargetCard, dropHandled, INVALID_TREASURE_EQUIPMENT_FILTER, INVALID_MONSTER_TO_BATTLE_FILTER, prevWidth, prevcardsCount, prevHeight, prevcardsCount2;
  var init_card_block = __esm({
    "src/card-block.js"() {
      init__();
      init_game();
      init_socket3();
      window.allCards = null;
      dragStartedFromZone2 = false;
      dragFromSnapshot = null;
      lastHoverZone = null;
      lastHoverTargetCard = null;
      dropHandled = false;
      INVALID_TREASURE_EQUIPMENT_FILTER = "sepia(1) saturate(10) hue-rotate(300deg) contrast(1.2) brightness(0.85)";
      INVALID_MONSTER_TO_BATTLE_FILTER = INVALID_TREASURE_EQUIPMENT_FILTER;
      if (window.allCards == null) {
        setTimeout(checkAllCards, 100);
      }
      document.addEventListener("DOMContentLoaded", function() {
        function initialize() {
          const myhand = document.querySelector(".myhand");
          const zone2 = document.querySelector(".zone2");
          const opponenthand = document.querySelector(".opponenthand");
          const zone_opponent = document.querySelector(".zone_opponent");
          const zone_opponent_side = document.querySelector(".zone_opponent_side");
          const opponent2hand = document.querySelector(".opponent2hand");
          const zone_opponent2 = document.querySelector(".zone_opponent2");
          const zone_opponent2_side = document.querySelector(".zone_opponent2_side");
          const opponent3hand = document.querySelector(".opponent3hand");
          const zone_opponent3 = document.querySelector(".zone_opponent3");
          const zone_opponent3_side = document.querySelector(".zone_opponent3_side");
          const zone3 = document.querySelector(".zone3");
          const zone_monster = document.querySelector(".zone_monster");
          const zone5 = document.querySelector(".zone5");
          const zone_doors_drop = document.querySelector(".zone_doors_drop");
          const zone_treasure_drop = document.querySelector(".zone_treasure_drop");
          const zone_treasure = document.querySelector(".zone_treasure");
          const zone_doors = document.querySelector(".zone_doors");
          if (myhand) {
            recalculateMyPower(false);
            const zones = [
              myhand,
              zone2,
              opponenthand,
              zone_opponent,
              zone_opponent_side,
              opponent2hand,
              zone_opponent2,
              zone_opponent2_side,
              opponent3hand,
              zone_opponent3,
              zone_opponent3_side,
              zone3,
              zone_monster,
              zone5,
              zone_doors_drop,
              zone_treasure_drop,
              zone_treasure,
              zone_doors
            ].filter(Boolean);
            zones.forEach((zone) => {
              zone.addEventListener("dragover", dragover_handler);
              zone.addEventListener("drop", drop_handler);
            });
          } else {
            setTimeout(initialize, 1e3);
          }
        }
        initialize();
      });
      window.addEventListener("munchkin:zonesChanged", bindZonesNow);
      prevWidth = {};
      prevcardsCount = {};
      prevHeight = {};
      prevcardsCount2 = {};
    }
  });

  // src/profileSession.js
  function playerTokenStorageKey(scopeId) {
    return `munchkin_player_token:${scopeId || "global"}`;
  }
  function getOrCreateTabPlayerToken(scopeId) {
    const key = playerTokenStorageKey(scopeId);
    try {
      const existing = sessionStorage.getItem(key);
      if (existing) {
        return existing;
      }
      const created = window.crypto && typeof window.crypto.randomUUID === "function" ? window.crypto.randomUUID() : `${String(Date.now())}-${String(Math.random()).slice(2)}`;
      sessionStorage.setItem(key, created);
      return created;
    } catch {
      return window.crypto && typeof window.crypto.randomUUID === "function" ? window.crypto.randomUUID() : `${String(Date.now())}-${String(Math.random()).slice(2)}`;
    }
  }
  function getProfileStorageScopeIdFromLocation() {
    try {
      const m = String(window.location?.pathname || "").match(/\/room\/([^/]+)/);
      return m && m[1] ? m[1] : "global";
    } catch {
      return "global";
    }
  }
  function profileNameKey(scopeId) {
    const id = scopeId || "global";
    const t = getOrCreateTabPlayerToken(id);
    return `munchkin.profile.name.v1:${id}:${t}`;
  }
  function profileGenderKey(scopeId) {
    const id = scopeId || "global";
    const t = getOrCreateTabPlayerToken(id);
    return `munchkin.profile.gender.v1:${id}:${t}`;
  }
  function normalizeGenderStored(raw) {
    const g = String(raw || "").trim();
    const gl = g.toLowerCase();
    if (gl === "male") {
      return "Male";
    }
    if (gl === "female") {
      return "Female";
    }
    return "";
  }
  function readTabProfile(scopeId) {
    const id = scopeId || "global";
    let name = "";
    let gender = "";
    try {
      name = (sessionStorage.getItem(profileNameKey(id)) || "").trim();
      gender = normalizeGenderStored(sessionStorage.getItem(profileGenderKey(id)));
    } catch {
    }
    if ((!name || !gender) && id === "global") {
      try {
        const ln = (localStorage.getItem("munchkin.playerName") || "").trim();
        const lg = normalizeGenderStored(localStorage.getItem("munchkin.playerGender"));
        if (!name && ln) {
          name = ln;
        }
        if (!gender && lg) {
          gender = lg;
        }
      } catch {
      }
    }
    return { name, gender };
  }
  function writeTabProfile(scopeId, name, gender) {
    const id = scopeId || "global";
    const n = String(name || "").trim();
    const g = gender === "Male" || gender === "Female" ? gender : "";
    try {
      sessionStorage.setItem(profileNameKey(id), n);
      sessionStorage.setItem(profileGenderKey(id), g);
    } catch {
    }
    if (id === "global") {
      try {
        if (n) {
          localStorage.setItem("munchkin.playerName", n);
        }
        if (g) {
          localStorage.setItem("munchkin.playerGender", g);
        }
      } catch {
      }
    }
  }
  var init_profileSession = __esm({
    "src/profileSession.js"() {
    }
  });

  // src/playerProfileModal.js
  function hidePlayerProfileModal() {
    const existing = document.getElementById("player-profile-modal");
    if (existing) {
      existing.remove();
    }
  }
  function openPlayerProfileModal(options2 = {}) {
    const onApply = typeof options2.onApply === "function" ? options2.onApply : null;
    hidePlayerProfileModal();
    const modal = document.createElement("div");
    modal.id = "player-profile-modal";
    modal.className = "wizard-taming-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-title";
    title.textContent = "\u0412\u044B\u0431\u0435\u0440\u0438 \u0438\u043C\u044F \u0438 \u043F\u043E\u043B";
    const desc = document.createElement("div");
    desc.className = "wizard-taming-desc";
    desc.textContent = "\u0418\u043C\u044F \u0431\u0443\u0434\u0435\u0442 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u0442\u044C\u0441\u044F \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F\u0445 \u0438\u0433\u0440\u044B.";
    const storageScopeId = typeof options2.storageScopeId === "string" && options2.storageScopeId.trim() ? options2.storageScopeId.trim() : getProfileStorageScopeIdFromLocation();
    const { name: tabName, gender: tabGender } = readTabProfile(storageScopeId);
    const storedName = tabName || "";
    const storedGenderNorm = tabGender === "Male" || tabGender === "Female" ? tabGender : "";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "\u0418\u043C\u044F \u0438\u0433\u0440\u043E\u043A\u0430";
    nameInput.value = storedName;
    nameInput.maxLength = 18;
    nameInput.style.alignSelf = "center";
    nameInput.style.width = "min(520px, 88%)";
    nameInput.style.padding = "10px 12px";
    nameInput.style.fontSize = "22px";
    nameInput.style.borderRadius = "10px";
    nameInput.style.border = "2px solid rgba(255,255,255,0.22)";
    nameInput.style.background = "rgba(40, 44, 58, 0.95)";
    nameInput.style.color = "#fff";
    const genderWrap = document.createElement("div");
    genderWrap.style.display = "flex";
    genderWrap.style.justifyContent = "center";
    genderWrap.style.gap = "16px";
    genderWrap.style.flexWrap = "wrap";
    genderWrap.style.marginTop = "6px";
    const makeGenderBtn = (value2, label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.dataset.gender = value2;
      btn.style.padding = "8px 14px";
      btn.style.fontSize = "20px";
      btn.style.borderRadius = "10px";
      btn.style.border = "2px solid rgba(255, 255, 255, 0.24)";
      btn.style.background = "rgba(40, 44, 58, 0.95)";
      btn.style.color = "#fff";
      btn.style.cursor = "pointer";
      if (storedGenderNorm === value2) {
        btn.classList.add("is-selected");
        btn.style.borderColor = "#8fd2ff";
        btn.style.boxShadow = "0 0 0 3px rgba(143, 210, 255, 0.32)";
      }
      return btn;
    };
    const maleBtn = makeGenderBtn("Male", "\u041C\u0443\u0436\u0441\u043A\u043E\u0439");
    const femaleBtn = makeGenderBtn("Female", "\u0416\u0435\u043D\u0441\u043A\u0438\u0439");
    let selectedGender = storedGenderNorm === "Male" || storedGenderNorm === "Female" ? storedGenderNorm : "";
    const selectGender = (g) => {
      selectedGender = g;
      [maleBtn, femaleBtn].forEach((b) => {
        const isSel = b.dataset.gender === g;
        b.style.borderColor = isSel ? "#8fd2ff" : "rgba(255, 255, 255, 0.24)";
        b.style.boxShadow = isSel ? "0 0 0 3px rgba(143, 210, 255, 0.32)" : "";
      });
      applyBtn.disabled = !canApply();
    };
    maleBtn.addEventListener("click", () => selectGender("Male"));
    femaleBtn.addEventListener("click", () => selectGender("Female"));
    genderWrap.appendChild(maleBtn);
    genderWrap.appendChild(femaleBtn);
    const canApply = () => {
      const n = String(nameInput.value || "").trim();
      return n.length > 0 && (selectedGender === "Male" || selectedGender === "Female");
    };
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-apply-btn";
    applyBtn.textContent = "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C";
    applyBtn.disabled = !canApply();
    nameInput.addEventListener("input", () => {
      applyBtn.disabled = !canApply();
    });
    applyBtn.addEventListener("click", () => {
      const name = String(nameInput.value || "").trim();
      if (!name || !(selectedGender === "Male" || selectedGender === "Female")) {
        return;
      }
      writeTabProfile(storageScopeId, name, selectedGender);
      if (onApply) {
        onApply({ name, gender: selectedGender });
      }
      try {
        window.dispatchEvent(new CustomEvent("munchkin:playerProfileStorageUpdated"));
      } catch {
      }
      hidePlayerProfileModal();
    });
    panel.appendChild(title);
    panel.appendChild(desc);
    panel.appendChild(nameInput);
    panel.appendChild(genderWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
  }
  var init_playerProfileModal = __esm({
    "src/playerProfileModal.js"() {
      init_profileSession();
    }
  });

  // src/game.js
  function getLocalSeatForSocket() {
    return localSeat;
  }
  function applyLevelDeltaWithWinRule(cur, delta, allowWinningLevel) {
    const c = Math.max(1, Math.floor(Number(cur) || 1));
    const d = Number(delta) || 0;
    let next = Math.max(1, c + d);
    if (d > 0 && !allowWinningLevel && next >= WINNING_LEVEL) {
      next = WINNING_LEVEL - 1;
    }
    return next;
  }
  function getCharacterRaces(character) {
    if (!character) {
      return [];
    }
    const r1 = String(character.race || "").trim();
    const r2 = String(character.race2 || "").trim();
    return [r1, r2].filter(Boolean);
  }
  function seatHasRace(seat, race) {
    const ch = characterBySeat?.[seat];
    const target = String(race || "").trim();
    if (!ch || !target) {
      return false;
    }
    return getCharacterRaces(ch).includes(target);
  }
  function getCharacterKinds(character) {
    if (!character) {
      return [];
    }
    const k1 = String(character.kind || "").trim();
    const k2 = String(character.kind2 || "").trim();
    return [k1, k2].filter(Boolean);
  }
  function seatHasKind(seat, kind) {
    const ch = characterBySeat?.[seat];
    const target = String(kind || "").trim();
    if (!ch || !target) {
      return false;
    }
    return getCharacterKinds(ch).includes(target);
  }
  function getTreasureEffectivePower(treasure74, character) {
    const base = Number(treasure74?.power) || 0;
    const map2 = treasure74?.powerByRace;
    if (map2 && typeof map2 === "object") {
      const races = [
        String(character?.race || "").trim(),
        String(character?.race2 || "").trim()
      ].filter(Boolean);
      let best = base;
      races.forEach((race) => {
        if (race && Object.prototype.hasOwnProperty.call(map2, race)) {
          const v = Number(map2[race]);
          if (Number.isFinite(v)) {
            best = Math.max(best, v);
          }
        }
      });
      return best;
    }
    return base;
  }
  function getMonsterFightSeat() {
    if (!battleActive && !getMonsterBattleContext().hasMonster) {
      return currentTurnSeat;
    }
    if (monsterFightSeat != null && monsterFightSeat !== void 0 && !Number.isNaN(Number(monsterFightSeat))) {
      const m = Number(monsterFightSeat);
      const maxSeat = Math.max(1, Number(num) || characterBySeat.length || 3) - 1;
      if (m >= 0 && m <= maxSeat) {
        return m;
      }
    }
    return currentTurnSeat;
  }
  function setDisplay(selector, displayValue) {
    const element = document.querySelector(selector);
    if (element) {
      element.style.display = displayValue;
    }
  }
  function getEnabledSeatZoneIdsForPlayerCount(numPlayers) {
    const n = Math.max(0, Math.min(6, Math.floor(Number(numPlayers) || 0)));
    if (n <= 0) {
      return /* @__PURE__ */ new Set();
    }
    const enabled = new Set(TABLE_ALWAYS_ACTIVE_ZONE_IDS);
    if (n === 2) {
      TABLE_OPPONENT_ZONE_GROUPS.center.forEach((id) => enabled.add(id));
    } else if (n === 3) {
      TABLE_OPPONENT_ZONE_GROUPS.right.forEach((id) => enabled.add(id));
      TABLE_OPPONENT_ZONE_GROUPS.left.forEach((id) => enabled.add(id));
    } else if (n >= 4) {
      TABLE_OPPONENT_ZONE_GROUPS.center.forEach((id) => enabled.add(id));
      TABLE_OPPONENT_ZONE_GROUPS.right.forEach((id) => enabled.add(id));
      TABLE_OPPONENT_ZONE_GROUPS.left.forEach((id) => enabled.add(id));
    }
    if (n >= 5) {
      TABLE_OPPONENT_ZONE_GROUPS.bl.forEach((id) => enabled.add(id));
    }
    if (n >= 6) {
      TABLE_OPPONENT_ZONE_GROUPS.br.forEach((id) => enabled.add(id));
    }
    return enabled;
  }
  function syncTableSeatZonesVisibilityForPlayerCount(playerCountOverride) {
    const n = playerCountOverride != null ? Math.max(0, Math.min(6, Math.floor(Number(playerCountOverride) || 0))) : effectiveSeatLayoutPlayerCount();
    const enabled = getEnabledSeatZoneIdsForPlayerCount(n > 0 ? n : 0);
    TABLE_ALL_OPPONENT_ZONE_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) {
        return;
      }
      if (n > 0 && enabled.has(id)) {
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
      } else {
        el.style.display = "none";
      }
    });
  }
  function setZoneInteractivityByPlayers(numPlayers) {
    const allZoneIds = [
      ...TABLE_ALWAYS_ACTIVE_ZONE_IDS,
      ...TABLE_ALL_OPPONENT_ZONE_IDS
    ];
    if (numPlayers <= 0) {
      allZoneIds.forEach((id) => {
        const zone = document.getElementById(id);
        if (!zone) {
          return;
        }
        zone.style.pointerEvents = "none";
        zone.style.opacity = "0.5";
      });
      syncTableSeatZonesVisibilityForPlayerCount(numPlayers);
      return;
    }
    const enabledZoneIds = getEnabledSeatZoneIdsForPlayerCount(numPlayers);
    allZoneIds.forEach((id) => {
      const zone = document.getElementById(id);
      if (!zone) {
        return;
      }
      const enabled = enabledZoneIds.has(id);
      zone.style.pointerEvents = enabled ? "auto" : "none";
      zone.style.opacity = enabled ? "" : "0.5";
    });
    syncTableSeatZonesVisibilityForPlayerCount(numPlayers);
  }
  function hideAllSeatIconSlots() {
    setDisplay("#bl-corner-seat-ui", "none");
    setDisplay(".bl-corner-seat-ui.top-left", "none");
    setDisplay(".bl-corner-seat-ui.top-right", "none");
    setDisplay(".bl-corner-seat-ui.top-center", "none");
    setDisplay(".top-center-image", "none");
    setDisplay(".level-top-center", "none");
    setDisplay(".top-center", "none");
    setDisplay(".image-top-left", "none");
    setDisplay(".level-top-left", "none");
    setDisplay(".top-left", "none");
    setDisplay(".image-top-right", "none");
    setDisplay(".level-top-right", "none");
    setDisplay(".top-right", "none");
    setDisplay(".image-bl-corner", "none");
    setDisplay(".level-bl-corner", "none");
    setDisplay(".image-bottom-left", "none");
    setDisplay(".level-bottom-left", "none");
    setDisplay(".bottom-left", "none");
    setDisplay(".image-bottom-right", "none");
    setDisplay(".level-bottom-right", "none");
    setDisplay(".bottom-right", "none");
    setDisplay(".bottom-right.legacy-seat-power", "none");
    setDisplay("#br-corner-seat-ui", "none");
    setDisplay(".image-br-corner", "none");
    setDisplay(".level-br-corner", "none");
  }
  function showTopCenterSeat() {
    setDisplay(".bl-corner-seat-ui.top-center", "flex");
    setDisplay(".top-center-image", "block");
    setDisplay(".level-top-center", "block");
    setDisplay(".top-center", "flex");
  }
  function showTopLeftSeat() {
    setDisplay(".bl-corner-seat-ui.top-left", "flex");
    setDisplay(".image-top-left", "block");
    setDisplay(".level-top-left", "block");
    setDisplay(".top-left", "flex");
  }
  function showTopRightSeat() {
    setDisplay(".bl-corner-seat-ui.top-right", "flex");
    setDisplay(".image-top-right", "block");
    setDisplay(".level-top-right", "block");
    setDisplay(".top-right", "flex");
  }
  function showBottomLeftBlSeat() {
    setDisplay("#bl-corner-seat-ui", "flex");
    setDisplay(".image-bl-corner", "block");
    setDisplay(".level-bl-corner", "block");
  }
  function showBottomRightBrSeat() {
    setDisplay("#br-corner-seat-ui", "flex");
    setDisplay(".image-br-corner", "block");
    setDisplay(".level-br-corner", "block");
  }
  function applySeatIconsForPlayerCount(numPlayers) {
    const n = Math.max(1, Math.min(6, Math.floor(Number(numPlayers) || 1)));
    hideAllSeatIconSlots();
    setDisplay(".image-bottom-center", "block");
    setDisplay(".level-bottom-center", "block");
    setDisplay(".bottom-center", "flex");
    if (n >= 2) {
      showTopCenterSeat();
    }
    if (n >= 3) {
      setDisplay(".bl-corner-seat-ui.top-center", "none");
      setDisplay(".top-center-image", "none");
      setDisplay(".level-top-center", "none");
      setDisplay(".top-center", "none");
      showTopLeftSeat();
      showTopRightSeat();
    }
    if (n >= 4) {
      showTopCenterSeat();
    }
    if (n >= 5) {
      showBottomLeftBlSeat();
    }
    if (n >= 6) {
      showBottomRightBrSeat();
    }
    ensurePreviewAcceptHelpButtonsVisible();
    syncBrTableZonesForPlayerCount();
    return n;
  }
  function ensurePreviewAcceptHelpButtonsVisible() {
    const blBtn = getBlCornerAcceptHelpPresetButton();
    const brBtn = getBrCornerAcceptHelpPresetButton();
    if (blBtn) {
      blBtn.style.display = "none";
      blBtn.classList.remove("is-accept-help-bl-active");
    }
    if (brBtn) {
      brBtn.style.display = "none";
      brBtn.classList.remove("is-accept-help-br-active");
    }
  }
  function syncBrTableZonesForPlayerCount() {
    syncTableSeatZonesVisibilityForPlayerCount();
  }
  function shouldShowCardBackForCardEl(card) {
    if (!card) {
      return false;
    }
    if (card.closest(".zone_doors, .zone_treasure")) {
      return true;
    }
    if (card.closest(".myhand")) {
      return false;
    }
    return Boolean(card.closest(".opponenthand, .opponent2hand, .opponent3hand, .opponent_bl_hand, .opponent_br_hand"));
  }
  function updateLobbySeatIcons(numPlayers) {
    const n = applySeatIconsForPlayerCount(numPlayers);
    lobbyConnectedPlayers = n;
    if (!gameStarted) {
      setZoneInteractivityByPlayers(0);
    }
  }
  function updatePlayersUiVisibility(numPlayers) {
    const n = applySeatIconsForPlayerCount(numPlayers);
    lobbyConnectedPlayers = n;
    setZoneInteractivityByPlayers(n);
    syncBrTableZonesForPlayerCount();
  }
  function effectiveSeatLayoutPlayerCount() {
    if (num === 1 || num === 2 || num === 3 || num === 4 || num === 5 || num === 6) {
      return num;
    }
    const n = Number(num) || Number(window.num);
    if (!Number.isFinite(n)) {
      return 1;
    }
    return Math.min(6, Math.max(1, Math.floor(n)));
  }
  function getSeatToIconMap() {
    const n = effectiveSeatLayoutPlayerCount();
    if (n === 2) {
      return localSeat === 1 ? { 1: ".image-bottom-center", 0: ".top-center-image" } : { 0: ".image-bottom-center", 1: ".top-center-image" };
    }
    if (n === 4) {
      const icons = [".image-bottom-center", ".image-top-left", ".top-center-image", ".image-top-right"];
      const map2 = {};
      for (let s = 0; s < 4; s += 1) {
        map2[s] = icons[(s - localSeat + 4) % 4];
      }
      return map2;
    }
    if (n === 5) {
      const icons = [".image-bottom-center", ".image-bl-corner", ".image-top-left", ".top-center-image", ".image-top-right"];
      const map2 = {};
      for (let s = 0; s < 5; s += 1) {
        map2[s] = icons[(s - localSeat + 5) % 5];
      }
      return map2;
    }
    if (n === 6) {
      const icons = [".image-bottom-center", ".image-bl-corner", ".image-top-left", ".top-center-image", ".image-top-right", ".image-br-corner"];
      const map2 = {};
      for (let s = 0; s < 6; s += 1) {
        map2[s] = icons[(s - localSeat + 6) % 6];
      }
      return map2;
    }
    if (n === 3) {
      if (localSeat === 1) {
        return { 1: ".image-bottom-center", 2: ".image-top-right", 0: ".image-top-left" };
      }
      if (localSeat === 2) {
        return { 2: ".image-bottom-center", 0: ".image-top-right", 1: ".image-top-left" };
      }
      return { 0: ".image-bottom-center", 1: ".image-top-right", 2: ".image-top-left" };
    }
    return { 0: ".image-bottom-center" };
  }
  function getSeatToPowerMap() {
    const n = effectiveSeatLayoutPlayerCount();
    if (n === 2) {
      return localSeat === 1 ? { 1: ".MyPower", 0: ".PowerPlayer2" } : { 0: ".MyPower", 1: ".PowerPlayer2" };
    }
    if (n === 4) {
      const powers = [".MyPower", ".PowerPlayer4", ".PowerPlayer2", ".PowerPlayer3"];
      const map2 = {};
      for (let s = 0; s < 4; s += 1) {
        map2[s] = powers[(s - localSeat + 4) % 4];
      }
      return map2;
    }
    if (n === 5) {
      const powers = [".MyPower", ".PowerBlCorner", ".PowerPlayer4", ".PowerPlayer2", ".PowerPlayer3"];
      const map2 = {};
      for (let s = 0; s < 5; s += 1) {
        map2[s] = powers[(s - localSeat + 5) % 5];
      }
      return map2;
    }
    if (n === 6) {
      const powers = [".MyPower", ".PowerBlCorner", ".PowerPlayer4", ".PowerPlayer2", ".PowerPlayer3", ".PowerPlayer7"];
      const map2 = {};
      for (let s = 0; s < 6; s += 1) {
        map2[s] = powers[(s - localSeat + 6) % 6];
      }
      return map2;
    }
    if (n === 3) {
      if (localSeat === 1) {
        return { 1: ".MyPower", 2: ".PowerPlayer3", 0: ".PowerPlayer4" };
      }
      if (localSeat === 2) {
        return { 2: ".MyPower", 0: ".PowerPlayer3", 1: ".PowerPlayer4" };
      }
      return { 0: ".MyPower", 1: ".PowerPlayer3", 2: ".PowerPlayer4" };
    }
    return { 0: ".MyPower" };
  }
  function getSeatToBattleZoneMap() {
    const n = effectiveSeatLayoutPlayerCount();
    if (n === 4) {
      return {
        0: "#zone2",
        1: "#zone_opponent2",
        2: "#zone_opponent3",
        3: "#zone_opponent",
        "0": "#zone2",
        "1": "#zone_opponent2",
        "2": "#zone_opponent3",
        "3": "#zone_opponent"
      };
    }
    if (n === 5) {
      return {
        0: "#zone2",
        1: "#zone_opponent_bl",
        2: "#zone_opponent2",
        3: "#zone_opponent3",
        4: "#zone_opponent",
        "0": "#zone2",
        "1": "#zone_opponent_bl",
        "2": "#zone_opponent2",
        "3": "#zone_opponent3",
        "4": "#zone_opponent"
      };
    }
    if (n === 6) {
      return {
        0: "#zone2",
        1: "#zone_opponent_bl",
        2: "#zone_opponent2",
        3: "#zone_opponent3",
        4: "#zone_opponent",
        5: "#zone_opponent_br",
        "0": "#zone2",
        "1": "#zone_opponent_bl",
        "2": "#zone_opponent2",
        "3": "#zone_opponent3",
        "4": "#zone_opponent",
        "5": "#zone_opponent_br"
      };
    }
    const powerToZone = {
      ".MyPower": ".zone2",
      ".PowerBlCorner": ".zone_opponent_bl",
      ".PowerPlayer2": ".zone_opponent",
      ".PowerPlayer3": ".zone_opponent2",
      ".PowerPlayer4": ".zone_opponent3",
      ".PowerPlayer5": ".zone_opponent_side",
      ".PowerPlayer6": ".zone_opponent2_side",
      ".PowerPlayer7": ".zone_opponent_br"
    };
    const seatToPowerMap = getSeatToPowerMap();
    const seatToZoneMap = {};
    Object.entries(seatToPowerMap).forEach(([seatKey, powerSelector]) => {
      const zoneSelector = powerToZone[powerSelector];
      if (zoneSelector) {
        seatToZoneMap[seatKey] = zoneSelector;
      }
    });
    return seatToZoneMap;
  }
  function getSeatToLevelMap() {
    const n = effectiveSeatLayoutPlayerCount();
    if (n === 2) {
      return localSeat === 1 ? { 1: ".level-bottom-center", 0: ".level-top-center" } : { 0: ".level-bottom-center", 1: ".level-top-center" };
    }
    if (n === 4) {
      const levels = [".level-bottom-center", ".level-top-left", ".level-top-center", ".level-top-right"];
      const map2 = {};
      for (let s = 0; s < 4; s += 1) {
        map2[s] = levels[(s - localSeat + 4) % 4];
      }
      return map2;
    }
    if (n === 5) {
      const levels = [".level-bottom-center", ".level-bl-corner", ".level-top-left", ".level-top-center", ".level-top-right"];
      const map2 = {};
      for (let s = 0; s < 5; s += 1) {
        map2[s] = levels[(s - localSeat + 5) % 5];
      }
      return map2;
    }
    if (n === 6) {
      const levels = [".level-bottom-center", ".level-bl-corner", ".level-top-left", ".level-top-center", ".level-top-right", ".level-br-corner"];
      const map2 = {};
      for (let s = 0; s < 6; s += 1) {
        map2[s] = levels[(s - localSeat + 6) % 6];
      }
      return map2;
    }
    if (n === 3) {
      if (localSeat === 1) {
        return { 1: ".level-bottom-center", 2: ".level-top-right", 0: ".level-top-left" };
      }
      if (localSeat === 2) {
        return { 2: ".level-bottom-center", 0: ".level-top-right", 1: ".level-top-left" };
      }
      return { 0: ".level-bottom-center", 1: ".level-top-right", 2: ".level-top-left" };
    }
    return { 0: ".level-bottom-center" };
  }
  function showBattleResult(text) {
    const battleResultElement = document.getElementById("battle-result");
    if (battleResultElement) {
      battleResultElement.textContent = text;
      battleResultElement.style.display = "block";
    }
  }
  function showLootStatus(text) {
    showBattleResult(text);
  }
  function hideBattleResult() {
    const battleResultElement = document.getElementById("battle-result");
    if (battleResultElement) {
      battleResultElement.textContent = "";
      battleResultElement.style.display = "none";
    }
  }
  function formatGenderRu(gender) {
    const g = String(gender || "").trim();
    if (g === "Male") return "\u041C";
    if (g === "Female") return "\u0416";
    return "";
  }
  function getChickenOnHeadDicePenaltyForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return 0;
    }
    return isCardInSeatMainOrSide("door24", s) ? -1 : 0;
  }
  function applyDicePenaltyForSeat(seat, roll) {
    const r = Number(roll);
    if (!Number.isFinite(r)) {
      return roll;
    }
    const next = r + getChickenOnHeadDicePenaltyForSeat(seat);
    return Math.max(1, Math.min(6, Math.floor(next)));
  }
  function hideSeatIconTooltip() {
    const existing = document.getElementById("seat-icon-tooltip");
    if (existing) {
      existing.remove();
    }
  }
  function clearSeatIconTooltipBindings() {
    for (const sel of ALL_ICON_SELECTORS) {
      try {
        document.querySelectorAll(sel).forEach((el) => {
          if (el?.dataset) {
            delete el.dataset.seatTooltipBound;
          }
        });
      } catch {
      }
    }
  }
  function pickSeatIconAnchorElement(selector) {
    if (!selector) {
      return null;
    }
    let nodes;
    try {
      nodes = Array.from(document.querySelectorAll(selector));
    } catch {
      return null;
    }
    if (!nodes.length) {
      return null;
    }
    const visible = nodes.filter((el) => {
      if (!(el instanceof HTMLElement)) {
        return false;
      }
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return r.width > 2 && r.height > 2 && cs.visibility !== "hidden" && cs.display !== "none" && el.offsetParent !== null;
    });
    const pool = visible.length ? visible : nodes;
    let best = null;
    let bestArea = 0;
    pool.forEach((el) => {
      const r = el.getBoundingClientRect();
      const a = r.width * r.height;
      if (a >= bestArea) {
        bestArea = a;
        best = el;
      }
    });
    return best;
  }
  function applyPlayerMetaBySeatFromServer(raw) {
    if (!raw || typeof raw !== "object") {
      return;
    }
    Object.entries(raw).forEach(([sk, meta]) => {
      const seat = parseInt(sk, 10);
      if (Number.isNaN(seat) || seat < 0 || seat >= characterBySeat.length) {
        return;
      }
      const name = String(meta?.name || "").trim();
      const g = String(meta?.gender || "").trim();
      const gender = g === "Male" || g === "Female" ? g : "";
      if (!name) {
        return;
      }
      const ch = characterBySeat[seat];
      if (!ch) {
        return;
      }
      ch.name = name;
      if (gender) {
        ch.gender = gender;
      }
      if (localSeat !== null && localSeat !== void 0 && Number(seat) === Number(localSeat)) {
        try {
          writeTabProfile(getProfileStorageScopeIdFromLocation(), name, gender);
        } catch {
        }
      }
    });
  }
  function flushPendingPlayerMetaSnapshotIfNeeded() {
    if (!pendingPlayerMetaSnapshot || typeof pendingPlayerMetaSnapshot !== "object") {
      return;
    }
    if (localSeat === null || localSeat === void 0) {
      return;
    }
    applyPlayerMetaBySeatFromServer(pendingPlayerMetaSnapshot);
    pendingPlayerMetaSnapshot = null;
  }
  function showSeatIconTooltipForSeat(seat, anchorEl) {
    if (!anchorEl) {
      return;
    }
    hideSeatIconTooltip();
    const s = Number(seat);
    const name = String(characterBySeat?.[s]?.name || "").trim() || `\u0418\u0433\u0440\u043E\u043A ${s + 1}`;
    const gender = formatGenderRu(characterBySeat?.[s]?.gender || "");
    const tip = document.createElement("div");
    tip.id = "seat-icon-tooltip";
    tip.style.position = "fixed";
    tip.style.zIndex = "100000";
    tip.style.padding = "6px 10px";
    tip.style.borderRadius = "10px";
    tip.style.background = "rgba(0,0,0,0.72)";
    tip.style.color = "#fff";
    tip.style.fontSize = "18px";
    tip.style.lineHeight = "1.25";
    tip.style.pointerEvents = "none";
    tip.style.maxWidth = "min(280px, 90vw)";
    tip.style.whiteSpace = "normal";
    tip.style.overflowWrap = "anywhere";
    tip.style.wordBreak = "break-word";
    tip.style.textAlign = "center";
    tip.style.boxSizing = "border-box";
    tip.textContent = gender ? `${name} (${gender})` : name;
    const rect = anchorEl.getBoundingClientRect();
    const tipWidth = Math.min(280, Math.max(120, window.innerWidth * 0.85));
    tip.style.width = `${tipWidth}px`;
    tip.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
    tip.style.top = `${Math.round(rect.bottom + 10)}px`;
    tip.style.transform = "translateX(-50%)";
    document.body.appendChild(tip);
    const tipRect = tip.getBoundingClientRect();
    if (tipRect.bottom > window.innerHeight - 8) {
      tip.style.top = `${Math.round(rect.top - tipRect.height - 10)}px`;
    }
    if (tipRect.left < 8) {
      tip.style.left = "8px";
      tip.style.transform = "none";
    } else if (tipRect.right > window.innerWidth - 8) {
      tip.style.left = `${window.innerWidth - 8}px`;
      tip.style.transform = "translateX(-100%)";
    }
  }
  function bindSeatIconHoverTooltips() {
    clearSeatIconTooltipBindings();
    const seatToIconMap = getSeatToIconMap();
    Object.entries(seatToIconMap).forEach(([seatKey, selector]) => {
      const seat = parseInt(seatKey, 10);
      if (Number.isNaN(seat) || !selector) {
        return;
      }
      const el = pickSeatIconAnchorElement(selector);
      if (!el) {
        return;
      }
      if (String(el.dataset?.seatTooltipBound || "") === "1") {
        return;
      }
      el.dataset.seatTooltipBound = "1";
      el.addEventListener("mouseenter", () => showSeatIconTooltipForSeat(seat, el));
      el.addEventListener("mouseleave", () => hideSeatIconTooltip());
    });
    if (!seatTooltipGlobalListenersBound) {
      seatTooltipGlobalListenersBound = true;
      window.addEventListener("scroll", hideSeatIconTooltip, { passive: true });
      window.addEventListener("resize", hideSeatIconTooltip);
    }
  }
  function setLevelBySeat(seat, level) {
    const v = Math.max(1, Math.floor(Number(level)) || 1);
    if (seat >= 0 && seat < characterBySeat.length) {
      levelBySeat[seat] = v;
      characterBySeat[seat]?.setLevel(v);
    }
    const seatToLevelMap = getSeatToLevelMap();
    const levelSelector = seatToLevelMap[seat];
    const levelElement = levelSelector ? document.querySelector(levelSelector) : null;
    if (levelElement) {
      levelElement.textContent = String(v);
    }
  }
  function isPlayerPlayZoneElement(zoneEl) {
    if (!zoneEl?.id) {
      return false;
    }
    const playZoneIds = /* @__PURE__ */ new Set([
      "zone2",
      "zone5",
      "zone_opponent",
      "zone_opponent_side",
      "zone_opponent2",
      "zone_opponent2_side",
      "zone_opponent3",
      "zone_opponent3_side",
      "zone_opponent_bl",
      "zone_opponent_bl_side",
      "zone_opponent_br",
      "zone_opponent_br_side"
    ]);
    return playZoneIds.has(zoneEl.id);
  }
  function getGlobalSeatForPlayZone(zoneEl) {
    if (!zoneEl) {
      return null;
    }
    const nPlayers = Number(num) || Number(window.num);
    if (!Number.isFinite(nPlayers) || nPlayers < 1) {
      return null;
    }
    const maxSeat = Math.min(Math.floor(nPlayers), characterBySeat.length);
    for (let seat = 0; seat < maxSeat; seat += 1) {
      const { main, side } = getMainAndSideZoneElementsForSeat(seat);
      if (zoneEl === main || zoneEl === side) {
        return seat;
      }
    }
    return null;
  }
  function isMainEquipmentZoneElement(zoneEl) {
    if (!zoneEl) {
      return false;
    }
    const nPlayers = Number(num) || Number(window.num);
    if (!Number.isFinite(nPlayers) || nPlayers < 1) {
      return false;
    }
    const maxSeat = Math.min(Math.floor(nPlayers), characterBySeat.length);
    for (let seat = 0; seat < maxSeat; seat += 1) {
      const { main } = getMainAndSideZoneElementsForSeat(seat);
      if (main && zoneEl === main) {
        return true;
      }
    }
    return false;
  }
  function isSideEquipmentZoneElement(zoneEl) {
    if (!zoneEl) {
      return false;
    }
    const nPlayers = Number(num) || Number(window.num);
    if (!Number.isFinite(nPlayers) || nPlayers < 1) {
      return false;
    }
    const maxSeat = Math.min(Math.floor(nPlayers), characterBySeat.length);
    for (let seat = 0; seat < maxSeat; seat += 1) {
      const { side } = getMainAndSideZoneElementsForSeat(seat);
      if (side && zoneEl === side) {
        return true;
      }
    }
    return false;
  }
  function getMainAndSideZoneElementsForSeat(seat) {
    const seatToBattle = getSeatToBattleZoneMap();
    const mainSel = seatToBattle[seat] ?? seatToBattle[String(seat)];
    if (!mainSel) {
      return { main: null, side: null };
    }
    const main = document.querySelector(mainSel);
    const sideSel = BATTLE_MAIN_SELECTOR_TO_SIDE_SELECTOR[mainSel];
    const side = sideSel ? document.querySelector(sideSel) : null;
    return { main, side };
  }
  function canonicalHandElementIdForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return null;
    }
    const n = effectiveSeatLayoutPlayerCount();
    if (n === 2) {
      return s % 2 === 0 ? "myhand" : "opponenthand";
    }
    if (n === 3) {
      return ["myhand", "opponent2hand", "opponent3hand"][s % 3];
    }
    if (n === 4) {
      return ["myhand", "opponent2hand", "opponent3hand", "opponenthand"][s % 4];
    }
    if (n === 5) {
      return ["myhand", "opponent_bl_hand", "opponent2hand", "opponent3hand", "opponenthand"][s % 5];
    }
    if (n === 6) {
      return ["myhand", "opponent_bl_hand", "opponent2hand", "opponent3hand", "opponenthand", "opponent_br_hand"][s % 6];
    }
    return "myhand";
  }
  function getHandElementForPlayerSeat(targetSeat) {
    const id = canonicalHandElementIdForSeat(targetSeat);
    return id ? document.getElementById(id) : null;
  }
  function getTreasureOwnerSeatFromZoneElement(zoneEl) {
    if (!zoneEl) {
      return null;
    }
    const equipSeat = getGlobalSeatForPlayZone(zoneEl);
    if (equipSeat != null) {
      return equipSeat;
    }
    const n = effectiveSeatLayoutPlayerCount();
    for (let s = 0; s < n; s += 1) {
      const h = getHandElementForPlayerSeat(s);
      if (h && zoneEl === h) {
        return s;
      }
    }
    const zid = String(zoneEl.id || "");
    const onMonsterZone = zid === "zone_monster" || zoneEl.classList?.contains?.("zone_monster");
    if (zid === "zone3" || onMonsterZone) {
      const fs = getMonsterFightSeat();
      if (Number.isFinite(Number(fs)) && Number(fs) >= 0) {
        return Number(fs);
      }
    }
    return null;
  }
  function isTreasureSmallShmot(treasure74) {
    if (!treasure74) {
      return false;
    }
    return (Number(treasure74.big) || 0) === 0;
  }
  function collectSmallStealableTreasuresFromSeat(victimSeat) {
    const out = [];
    const { main, side } = getMainAndSideZoneElementsForSeat(victimSeat);
    [main, side].forEach((zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const t = window.treasures?.find((tr) => tr.name === cardEl.id);
        if (!t || !isTreasureSmallShmot(t)) {
          return;
        }
        if (isTreasureSpecial(cardEl.id, "Hireling")) {
          return;
        }
        const imgEl = cardEl.querySelector(".card-item");
        if (!imgEl?.src) {
          return;
        }
        out.push({ cardId: cardEl.id, img: imgEl.src });
      });
    });
    return out;
  }
  function isSeatDwarfRaceActive(seat) {
    const { main } = getMainAndSideZoneElementsForSeat(seat);
    if (!main) {
      return false;
    }
    const mainCards = Array.from(main.querySelectorAll(".card"));
    return mainCards.some((cardEl) => {
      const doorCard = window.doors?.find((d) => d.name === cardEl.id);
      return doorCard?.race === "Dwarf";
    });
  }
  function isEquipmentSumsValid(body, hand, footwear, hat, big) {
    return body <= 1 && hand <= 2 && footwear <= 1 && hat <= 1 && big <= 1;
  }
  function doesTreasureRestrictionsAllowSeat(treasure74, seat) {
    const rules = treasure74?.restrictions;
    if (!Array.isArray(rules) || rules.length === 0) {
      return true;
    }
    const ch = characterBySeat?.[seat];
    const isHalfBreedSingleRace = Boolean(ch?.hasHalfBreed) && String(ch?.race2 || "") === "Human";
    const isSuperMunchkinSingleClass = Boolean(ch?.hasSuperMunchkin) && !String(ch?.kind2 || "").trim();
    const races = [
      String(ch?.race || "").trim(),
      String(ch?.race2 || "").trim()
    ].filter(Boolean);
    const kinds = [
      String(ch?.kind || "").trim(),
      String(ch?.kind2 || "").trim()
    ].filter(Boolean);
    const kind = String(ch?.kind || "");
    const gender = String(ch?.gender || "");
    const matchesAny = (value2, allowedList) => Array.isArray(allowedList) && allowedList.some((x) => String(x) === String(value2));
    const matchesAnyRace = (allowedList) => Array.isArray(allowedList) && races.some((r) => matchesAny(r, allowedList));
    const matchesAnyKind = (allowedList) => Array.isArray(allowedList) && kinds.some((k) => matchesAny(k, allowedList));
    return rules.every((rule) => {
      const mode = String(rule?.mode || "");
      const raceList = rule?.race;
      const kindList = rule?.kind;
      const genderList = rule?.gender;
      const hasAnyField = Array.isArray(raceList) || Array.isArray(kindList) || Array.isArray(genderList);
      if (!hasAnyField) {
        return true;
      }
      if ((isHalfBreedSingleRace || isSuperMunchkinSingleClass) && mode === "not") {
        return true;
      }
      if (mode === "only" && Array.isArray(raceList) && raceList.some((x) => String(x) === "Human")) {
        const isPureHuman = races.length === 1 && races[0] === "Human";
        return isPureHuman;
      }
      const okRace = !Array.isArray(raceList) || (mode === "not" ? !matchesAnyRace(raceList) : matchesAnyRace(raceList));
      const okKind = !Array.isArray(kindList) || (mode === "not" ? !matchesAnyKind(kindList) : matchesAnyKind(kindList));
      const okGender = !Array.isArray(genderList) || (mode === "not" ? !matchesAny(gender, genderList) : matchesAny(gender, genderList));
      return okRace && okKind && okGender;
    });
  }
  function canPlaceTreasureInPlayerEquipment(draggingCardEl, targetZoneEl) {
    if (!draggingCardEl || !isPlayerPlayZoneElement(targetZoneEl)) {
      return true;
    }
    const seat = getGlobalSeatForPlayZone(targetZoneEl);
    if (seat == null) {
      return true;
    }
    const doorCard = window.doors?.find((d) => d.name === draggingCardEl.id);
    if (doorCard && String(doorCard.race || "") === "monster") {
      return false;
    }
    const treasure74 = window.treasures?.find((t) => t.name === draggingCardEl.id);
    if (!treasure74) {
      return true;
    }
    const treasureLevelGain = Number(treasure74.level);
    if (Number.isFinite(treasureLevelGain) && treasureLevelGain > 0) {
      let curLv = levelBySeat[seat];
      if (curLv == null || Number.isNaN(curLv)) {
        curLv = 1;
      }
      curLv = Math.max(1, Math.floor(Number(curLv)));
      if (curLv >= WINNING_LEVEL - 1) {
        return false;
      }
    }
    if (isTreasureSpecial(draggingCardEl.id, KILL_THE_HIRELING_SPECIAL) && !someSeatHasHirelingEquipped()) {
      return false;
    }
    if (isTreasureSpecial(draggingCardEl.id, WHINE_AT_GM_SPECIAL) && !seatCanReceiveWhineAtGM(seat)) {
      return false;
    }
    const { main, side } = getMainAndSideZoneElementsForSeat(seat);
    if (!main) {
      return true;
    }
    const isTargetSideZone = !!side && targetZoneEl === side;
    const hasCheat = Boolean(draggingCardEl?.dataset?.cheatCardId);
    const hasHireling = Boolean(draggingCardEl?.dataset?.hirelingCardId);
    const allowHirelingAssist = !isTargetSideZone && isMainEquipmentZoneElement(targetZoneEl) && !hasCheat && !hasHireling && !Boolean(treasure74?.oneTime) && !isTreasureSpecial(draggingCardEl.id, "Hireling") && (() => {
      const h = getHirelingCardInMainForSeat(seat);
      return Boolean(h && !String(h.dataset?.hirelingAttachedTreasureId || ""));
    })();
    if (!isTargetSideZone && !hasCheat && !hasHireling && !doesTreasureRestrictionsAllowSeat(treasure74, seat)) {
      return allowHirelingAssist;
    }
    const draggedBig = Number(treasure74.big) || 0;
    const allPlayerCards = [];
    const pushUnique = (cardEl) => {
      if (cardEl && allPlayerCards.indexOf(cardEl) === -1) {
        allPlayerCards.push(cardEl);
      }
    };
    main.querySelectorAll(".card").forEach(pushUnique);
    side?.querySelectorAll?.(".card")?.forEach(pushUnique);
    let existingBigTotal = 0;
    allPlayerCards.forEach((el) => {
      if (el === draggingCardEl) {
        return;
      }
      if (el?.dataset?.cheatCardId || el?.dataset?.hirelingCardId) {
        return;
      }
      const t = window.treasures.find((tr) => tr.name === el.id);
      if (t) {
        existingBigTotal += Number(t.big) || 0;
      }
    });
    const nextBigTotal = existingBigTotal + (hasCheat || hasHireling ? 0 : draggedBig);
    const dwarfUnlimitedBig = isSeatDwarfRaceActive(seat);
    if (!dwarfUnlimitedBig && nextBigTotal > 1) {
      return allowHirelingAssist;
    }
    if (isTargetSideZone) {
      return true;
    }
    const seen = [];
    const fromZone = (z) => {
      z?.querySelectorAll?.(".card")?.forEach((c) => {
        if (seen.indexOf(c) === -1) {
          seen.push(c);
        }
      });
    };
    fromZone(main);
    let body = 0;
    let hand = 0;
    let footwear = 0;
    let hat = 0;
    let big = 0;
    seen.forEach((el) => {
      if (el === draggingCardEl) {
        return;
      }
      if (el?.dataset?.cheatCardId || el?.dataset?.hirelingCardId) {
        return;
      }
      const t = window.treasures.find((tr) => tr.name === el.id);
      if (t) {
        body += Number(t.body) || 0;
        hand += Number(t.hand) || 0;
        footwear += Number(t.footwear) || 0;
        hat += Number(t.hat) || 0;
        big += Number(t.big) || 0;
      }
    });
    if (!hasCheat && !hasHireling) {
      body += Number(treasure74.body) || 0;
      hand += Number(treasure74.hand) || 0;
      footwear += Number(treasure74.footwear) || 0;
      hat += Number(treasure74.hat) || 0;
      big += Number(treasure74.big) || 0;
    }
    const ok = isEquipmentSumsValid(body, hand, footwear, hat, big);
    return ok || allowHirelingAssist;
  }
  function isHalfBreedDoorCard(doorCard) {
    return Boolean(doorCard && (String(doorCard.special || "") === "Half-breed" || String(doorCard.card_name || "") === "Half-breed"));
  }
  function isSuperMunchkinDoorCard(doorCard) {
    return Boolean(doorCard && (String(doorCard.special || "") === "Super Munchkin" || String(doorCard.card_name || "") === "Super Munchkin"));
  }
  function canPlaceDoorInPlayerEquipment(draggingCardEl, targetZoneEl) {
    if (!draggingCardEl || !isPlayerPlayZoneElement(targetZoneEl)) {
      return true;
    }
    const door96 = window.doors?.find((d) => d.name === draggingCardEl.id);
    if (!door96) {
      return true;
    }
    if (String(door96.race || "") === "monster") {
      return false;
    }
    if (isSideEquipmentZoneElement(targetZoneEl)) {
      return false;
    }
    if (!isMainEquipmentZoneElement(targetZoneEl)) {
      return true;
    }
    const seat = getGlobalSeatForPlayZone(targetZoneEl);
    if (seat == null) {
      return true;
    }
    if (String(door96.special || "").trim().toLowerCase() === "curse" || normalizeBadStaff(door96.bad_staff)) {
      return true;
    }
    const { main } = getMainAndSideZoneElementsForSeat(seat);
    if (!main) {
      return true;
    }
    let hasHalfBreed = false;
    let halfBreedCount = 0;
    const raceCounts = /* @__PURE__ */ new Map();
    let hasSuperMunchkin = false;
    let superMunchkinCount = 0;
    const kindCounts = /* @__PURE__ */ new Map();
    main.querySelectorAll(".card").forEach((el) => {
      const d = window.doors?.find((x) => x.name === el.id);
      if (!d) {
        return;
      }
      if (isHalfBreedDoorCard(d)) {
        hasHalfBreed = true;
        halfBreedCount += 1;
      }
      if (isSuperMunchkinDoorCard(d)) {
        hasSuperMunchkin = true;
        superMunchkinCount += 1;
      }
      if (d.race && String(d.race) !== "monster") {
        const r = String(d.race);
        raceCounts.set(r, (raceCounts.get(r) || 0) + 1);
      }
      if (d.kind) {
        const k = String(d.kind);
        kindCounts.set(k, (kindCounts.get(k) || 0) + 1);
      }
    });
    if (!main.contains(draggingCardEl)) {
      const d = door96;
      if (isHalfBreedDoorCard(d)) {
        hasHalfBreed = true;
        halfBreedCount += 1;
      }
      if (isSuperMunchkinDoorCard(d)) {
        hasSuperMunchkin = true;
        superMunchkinCount += 1;
      }
      if (d.race && String(d.race) !== "monster") {
        const r = String(d.race);
        raceCounts.set(r, (raceCounts.get(r) || 0) + 1);
      }
      if (d.kind) {
        const k = String(d.kind);
        kindCounts.set(k, (kindCounts.get(k) || 0) + 1);
      }
    }
    if (isHalfBreedDoorCard(door96) && halfBreedCount > 1) {
      return false;
    }
    if (isSuperMunchkinDoorCard(door96) && superMunchkinCount > 1) {
      return false;
    }
    if (isHalfBreedDoorCard(door96)) {
      const raceCardCount = Array.from(raceCounts.values()).reduce((a, b) => a + b, 0);
      return raceCardCount >= 1;
    }
    if (isSuperMunchkinDoorCard(door96)) {
      const kindCardCount = Array.from(kindCounts.values()).reduce((a, b) => a + b, 0);
      return kindCardCount >= 1;
    }
    if (door96.race) {
      const totalRaceCards = Array.from(raceCounts.values()).reduce((a, b) => a + b, 0);
      const uniqueRaceCards = raceCounts.size;
      if (hasHalfBreed) {
        if ((raceCounts.get(String(door96.race)) || 0) > 1) {
          return false;
        }
        return uniqueRaceCards <= 2 && totalRaceCards <= 2;
      }
      return totalRaceCards <= 1;
    }
    if (door96.kind) {
      const totalKindCards = Array.from(kindCounts.values()).reduce((a, b) => a + b, 0);
      const uniqueKindCards = kindCounts.size;
      if (hasSuperMunchkin) {
        if ((kindCounts.get(String(door96.kind)) || 0) > 1) {
          return false;
        }
        return uniqueKindCards <= 2 && totalKindCards <= 2;
      }
      return totalKindCards <= 1;
    }
    return true;
  }
  function normalizeBadStaff(badStaff) {
    if (!badStaff || typeof badStaff !== "object") {
      return null;
    }
    const type = String(badStaff.type || "");
    if (!type) {
      return null;
    }
    if (type === "lose_levels") {
      const levels = Number(badStaff.levels) || 0;
      return levels > 0 ? { type: "lose_levels", levels } : null;
    }
    if (type === "death") {
      return { type: "death" };
    }
    if (type === "discard_footwear_or_lose_level") {
      return { type: "discard_footwear_or_lose_level" };
    }
    if (type === "lose_hand_or_lose_levels") {
      const levels = Number(badStaff.levels) || 2;
      return levels > 0 ? { type: "lose_hand_or_lose_levels", levels } : null;
    }
    if (type === "lose_all_equipped_classes_or_levels") {
      const levels = Number(badStaff.levels) || 3;
      const lv = Math.max(1, Math.floor(levels));
      return { type: "lose_all_equipped_classes_or_levels", levels: lv };
    }
    if (type === "level_to_table_minimum") {
      return { type: "level_to_table_minimum" };
    }
    if (type === "escape_dice_death_or_levels") {
      const raw = Number(badStaff.deathAtOrBelow);
      const deathAtOrBelow = Number.isFinite(raw) && raw >= 1 && raw <= 6 ? Math.floor(raw) : 2;
      return { type: "escape_dice_death_or_levels", deathAtOrBelow };
    }
    return { type };
  }
  function curseHasSpecialMechanicsInCode(badStaff) {
    const normalized = normalizeBadStaff(badStaff);
    if (!normalized) {
      return false;
    }
    const type = normalized.type;
    return type === "lose_levels" || type === "change class" || type === "change race" || type === "lose your class" || type === "lose your race" || type === "malign mirrror" || type === "change sex" || type === "chicken on your head" || type === "income tax" || type === "lose_all_equipped_classes_or_levels";
  }
  function shouldAutoDiscardCurseAfterApply(badStaff) {
    const normalized = normalizeBadStaff(badStaff);
    if (!normalized) {
      return false;
    }
    const type = normalized.type;
    return type === "lose_levels" || type === "change class" || type === "change race" || type === "lose your class" || type === "lose your race" || type === "lose_all_equipped_classes_or_levels";
  }
  function showCurseAppliedBannerForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return;
    }
    const now = Date.now();
    if (window.__curseAppliedBannerLastSeat === s && now - (window.__curseAppliedBannerLastAt || 0) < 900) {
      return;
    }
    window.__curseAppliedBannerLastSeat = s;
    window.__curseAppliedBannerLastAt = now;
    const text = `\u041D\u0430 ${getSeatLabel(s)} \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u043E \u043F\u0440\u043E\u043A\u043B\u044F\u0442\u0438\u0435`;
    let el = document.getElementById("curse-applied-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "curse-applied-banner";
      el.className = "curse-applied-banner";
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("is-visible");
    if (window.__curseAppliedBannerHideTimer) {
      clearTimeout(window.__curseAppliedBannerHideTimer);
    }
    window.__curseAppliedBannerHideTimer = setTimeout(() => {
      el.classList.remove("is-visible");
      el.textContent = "";
      window.__curseAppliedBannerHideTimer = 0;
    }, 3500);
  }
  function curseSkipsAppliedBanner(badStaff) {
    const normalized = normalizeBadStaff(badStaff);
    if (!normalized) {
      return false;
    }
    const type = normalized.type;
    return type === "change sex" || type === "income tax";
  }
  function notifyCurseAppliedBanner(seat, curseCardId, badStaff) {
    if (curseSkipsAppliedBanner(badStaff)) {
      return;
    }
    const s = Number(seat);
    const cid = String(curseCardId || "").trim();
    if (!Number.isFinite(s) || s < 0 || !cid) {
      return;
    }
    showCurseAppliedBannerForSeat(s);
    socket_default.emit("message", {
      method: "CurseAppliedNotify",
      seat: s,
      curseCardId: cid
    });
  }
  function escapeRollPenaltySeatFromPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return NaN;
    }
    const raw = payload.escapePenaltySeat != null && payload.escapePenaltySeat !== "" ? payload.escapePenaltySeat : payload.seat;
    if (raw === null || raw === void 0 || raw === "") {
      return NaN;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      return NaN;
    }
    return Math.floor(n);
  }
  function getBadStaffLevelLoss(badStaff) {
    const normalized = normalizeBadStaff(badStaff);
    if (!normalized || normalized.type !== "lose_levels") {
      return 0;
    }
    return Number(normalized.levels) || 0;
  }
  function applyBadStaffToSeat(seat, badStaff) {
    const normalized = normalizeBadStaff(badStaff);
    if (!normalized) {
      return;
    }
    if (normalized.type !== "lose_levels") {
      return;
    }
    const levelLoss = getBadStaffLevelLoss(normalized);
    if (!Number.isFinite(levelLoss) || levelLoss <= 0) {
      return;
    }
    let current = levelBySeat[seat];
    if (current == null || Number.isNaN(current)) {
      current = 1;
    }
    current = Math.max(1, current);
    const next = Math.max(1, current - levelLoss);
    setLevelBySeat(seat, next);
    recalculateAllPowerDisplays();
  }
  function getMinimumTablePlayerLevelAmongPlayers() {
    const n = Number(num);
    const maxSeats = Number.isFinite(n) && n > 0 ? n : 3;
    let m = Infinity;
    for (let s = 0; s < maxSeats; s += 1) {
      if (!characterBySeat[s]) {
        continue;
      }
      const lv = Math.max(1, Number(levelBySeat[s]) || 1);
      m = Math.min(m, lv);
    }
    return Number.isFinite(m) ? m : 1;
  }
  function applyEscapeBadStaffPenaltyFromOwner(seat, badStaffPenalty) {
    const s = Number(seat);
    const bad = normalizeBadStaff(badStaffPenalty);
    if (!Number.isFinite(s) || s < 0 || !bad) {
      return;
    }
    if (Number(localSeat) !== Number(escapeOwnerSeat)) {
      return;
    }
    if (bad.type === "level_to_table_minimum") {
      const target = getMinimumTablePlayerLevelAmongPlayers();
      const cur = Math.max(1, Number(levelBySeat[s]) || 1);
      const delta = target - cur;
      if (delta < 0) {
        emitLevelAdjust(s, delta);
      }
      return;
    }
    if (bad.type === "lose_levels") {
      let levels = Number(bad.levels) || 0;
      const monId = String(escapeCurrentMonsterCardId || "").trim();
      const ab = getMonsterAbilitiesByCardId(monId);
      const elfLevels = Number(ab?.escapeLoseLevelsElfLevels);
      if (Number.isFinite(elfLevels) && elfLevels > 0 && seatHasRace(s, "Elf")) {
        levels = elfLevels;
      }
      if (levels > 0) {
        socket_default.emit("message", { method: "LevelAdjust", seat: s, delta: -levels });
      }
      return;
    }
    if (bad.type === "discard_footwear_or_lose_level") {
      const footwearId = findEquippedFootwearTreasureIdForSeat(s);
      if (footwearId) {
        syncTreasureCardMoveToDiscard(footwearId);
      } else {
        socket_default.emit("message", { method: "LevelAdjust", seat: s, delta: -1 });
      }
      return;
    }
    if (bad.type === "lose_hand_or_lose_levels") {
      return;
    }
    if (bad.type === "lose_all_equipped_classes_or_levels") {
      const levels = Number(bad.levels) || 3;
      const classIds = collectEquippedClassDoorIdsForSeat(s);
      if (classIds.length > 0) {
        classIds.forEach((id) => syncDoorCardMoveToDiscard(id));
      } else if (levels > 0) {
        socket_default.emit("message", { method: "LevelAdjust", seat: s, delta: -levels });
      }
      return;
    }
  }
  function collectHandCardIdsForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return [];
    }
    const hand = getHandElementForPlayerSeat(s);
    if (!hand) {
      return [];
    }
    return Array.from(hand.querySelectorAll(".card")).map((el) => String(el?.id || "").trim()).filter((id) => id && id !== "card");
  }
  function hideEscapeLoseHandOrLevelsModal() {
    const el = document.getElementById("escape-lose-hand-or-levels-modal");
    if (el) {
      el.remove();
    }
  }
  function openEscapeLoseHandOrLevelsModal({ seat, levelLoss }) {
    hideEscapeLoseHandOrLevelsModal();
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return;
    }
    const loss = Math.max(1, Math.floor(Number(levelLoss) || 2));
    const modal = document.createElement("div");
    modal.id = "escape-lose-hand-or-levels-modal";
    modal.className = "wishing-ring-curse-choice";
    const panel = document.createElement("div");
    panel.className = "wishing-ring-curse-choice-panel";
    const title = document.createElement("div");
    title.className = "wishing-ring-curse-choice-title";
    title.textContent = `\u0421\u043C\u044B\u0432\u043A\u0430 \u043F\u0440\u043E\u0432\u0430\u043B\u0438\u043B\u0430\u0441\u044C: \u0441\u0431\u0440\u043E\u0441\u044C \u0432\u0441\u044E \u0440\u0443\u043A\u0443 \u0438\u043B\u0438 \u043F\u043E\u0442\u0435\u0440\u044F\u0439 ${loss} \u0443\u0440\u043E\u0432\u043D\u044F.`;
    panel.appendChild(title);
    const row = document.createElement("div");
    row.className = "wishing-ring-curse-choice-actions";
    const btnHand = document.createElement("button");
    btnHand.type = "button";
    btnHand.className = "wishing-ring-curse-choice-btn";
    btnHand.textContent = "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u043A\u0430\u0440\u0442\u044B \u0441 \u0440\u0443\u043A\u0438";
    const btnLevels = document.createElement("button");
    btnLevels.type = "button";
    btnLevels.className = "wishing-ring-curse-choice-btn";
    btnLevels.textContent = `\u041F\u043E\u0442\u0435\u0440\u044F\u0442\u044C ${loss} \u0443\u0440\u043E\u0432\u043D\u044F`;
    const finish = (choice) => {
      const cardIds = choice === "discard_hand" ? collectHandCardIdsForSeat(s) : [];
      socket_default.emit("message", {
        method: "EscapeLoseHandOrLevelsResolve",
        seat: s,
        escapePenaltySeat: s,
        choice,
        levelLoss: loss,
        cardIds
      });
      hideEscapeLoseHandOrLevelsModal();
    };
    btnHand.addEventListener("click", () => finish("discard_hand"));
    btnLevels.addEventListener("click", () => finish("lose_levels"));
    row.appendChild(btnHand);
    row.appendChild(btnLevels);
    panel.appendChild(row);
    modal.appendChild(panel);
    document.body.appendChild(modal);
  }
  function applyEscapeLoseHandOrLevelsResolveFromNetwork(res) {
    const seat = escapeRollPenaltySeatFromPayload(res);
    const choice = String(res.choice || "").trim();
    if (!Number.isFinite(seat) || seat < 0) {
      return;
    }
    if (choice !== "lose_levels" && choice !== "discard_hand") {
      return;
    }
    recalculateAllPowerDisplays();
    if (Number(localSeat) === Number(escapeOwnerSeat)) {
      setTimeout(() => {
        runNextEscapeAttemptAndBroadcast();
      }, 400);
    }
  }
  function isDoorEquippedClassKindCard(door96) {
    if (!door96 || String(door96.race || "") === "monster") {
      return false;
    }
    return Boolean(String(door96.kind || "").trim());
  }
  function findTopDoorDiscardClassCardId() {
    const z = document.getElementById("zone_doors_drop");
    if (!z) {
      return null;
    }
    const els = Array.from(z.querySelectorAll(".card"));
    for (let i3 = els.length - 1; i3 >= 0; i3--) {
      const id = els[i3]?.id;
      if (!id || !String(id).includes("door")) {
        continue;
      }
      const door96 = window.doors?.find((d) => d.name === id);
      if (isDoorEquippedClassKindCard(door96)) {
        return id;
      }
    }
    return null;
  }
  function collectEquippedClassDoorIdsForSeat(seat) {
    const out = [];
    const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
    [main, side].forEach((zone) => {
      if (!zone) {
        return;
      }
      zone.querySelectorAll(".card").forEach((el) => {
        const id = el?.id;
        if (!id || !String(id).includes("door")) {
          return;
        }
        const door96 = window.doors?.find((d) => d.name === id);
        if (isDoorEquippedClassKindCard(door96) && !out.includes(id)) {
          out.push(id);
        }
      });
    });
    return out;
  }
  function findWizardClassDoorIdEquippedForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return "";
    }
    for (const id of collectEquippedClassDoorIdsForSeat(s)) {
      const door96 = window.doors?.find((d) => d.name === id);
      if (door96 && String(door96.kind || "") === "Wizard") {
        return id;
      }
    }
    return "";
  }
  function collectEquippedSuperMunchkinDoorIdsForSeat(seat) {
    const out = [];
    const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
    [main, side].forEach((zone) => {
      if (!zone) {
        return;
      }
      zone.querySelectorAll(".card").forEach((el) => {
        const id = el?.id;
        if (!id) {
          return;
        }
        const door96 = window.doors?.find((d) => d.name === id);
        if (isSuperMunchkinDoorCard(door96) && !out.includes(id)) {
          out.push(id);
        }
      });
    });
    return out;
  }
  function syncDoorCardMoveToZone(cardId, zoneId, targetId = null) {
    const id = String(cardId || "").trim();
    const zid = String(zoneId || "").trim();
    if (!id || !zid || !document.getElementById(id)) {
      return;
    }
    applyMoveCardLocally({
      method: "moveCard",
      cardId: id,
      zoneId: zid,
      targetId: targetId || null
    });
    socket_default.emit("message", {
      method: "moveCard",
      cardId: id,
      zoneId: zid,
      targetId: targetId || null
    });
  }
  function syncDoorCardMoveToDiscard(cardId) {
    const z = document.getElementById("zone_doors_drop");
    let targetId = null;
    if (z) {
      const els = Array.from(z.querySelectorAll(".card"));
      for (let i3 = els.length - 1; i3 >= 0; i3--) {
        const id = els[i3]?.id;
        if (!id || id === "card") {
          continue;
        }
        if (id === cardId) {
          continue;
        }
        targetId = id;
        break;
      }
    }
    syncDoorCardMoveToZone(cardId, "zone_doors_drop", targetId);
    const el = document.getElementById(String(cardId || "").trim());
    if (el && String(el.dataset?.changeSexUsedNotDiscarded || "") === "1") {
      el.dataset.changeSexUsedNotDiscarded = "";
    }
  }
  function syncTreasureCardMoveToZone(cardId, zoneId, targetId = null) {
    const id = String(cardId || "").trim();
    const zid = String(zoneId || "").trim();
    if (!id || !zid || !document.getElementById(id)) {
      return;
    }
    applyMoveCardLocally({
      method: "moveCard",
      cardId: id,
      zoneId: zid,
      targetId: targetId || null
    });
    socket_default.emit("message", {
      method: "moveCard",
      cardId: id,
      zoneId: zid,
      targetId: targetId || null
    });
  }
  function syncTreasureCardMoveToDiscard(cardId) {
    const z = document.getElementById("zone_treasure_drop");
    let targetId = null;
    if (z) {
      const els = Array.from(z.querySelectorAll(".card"));
      for (let i3 = els.length - 1; i3 >= 0; i3--) {
        const id = els[i3]?.id;
        if (!id || id === "card") {
          continue;
        }
        if (id === cardId) {
          continue;
        }
        targetId = id;
        break;
      }
    }
    syncTreasureCardMoveToZone(cardId, "zone_treasure_drop", targetId);
  }
  function findEquippedFootwearTreasureIdForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return null;
    }
    const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
    for (const zoneEl of [main, side]) {
      if (!zoneEl) {
        continue;
      }
      const els = Array.from(zoneEl.querySelectorAll(".card"));
      for (let i3 = els.length - 1; i3 >= 0; i3--) {
        const id = els[i3]?.id;
        if (!id || !String(id).includes("treasure")) {
          continue;
        }
        const tr = window.treasures?.find((t) => t && t.name === id);
        if (tr && (Number(tr.footwear) || 0) > 0) {
          return id;
        }
      }
    }
    return null;
  }
  function hideLoseYourClassModal() {
    const existing = document.getElementById("lose-your-class-modal");
    if (existing) {
      existing.remove();
    }
  }
  function openLoseYourClassModal({ seat, curseCardId, classCardIds }) {
    hideLoseYourClassModal();
    const modal = document.createElement("div");
    modal.id = "lose-your-class-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "\u041F\u043E\u0442\u0435\u0440\u044F\u0439 \u043E\u0434\u0438\u043D \u043A\u043B\u0430\u0441\u0441: \u0432\u044B\u0431\u0435\u0440\u0438, \u043A\u0430\u043A\u043E\u0439 \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C";
    panel.appendChild(title);
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-pick-cards";
    cardsWrap.style.maxHeight = "min(55vh, 600px)";
    cardsWrap.style.overflowY = "auto";
    let selectedId = "";
    classCardIds.forEach((id) => {
      const door96 = window.doors?.find((d) => d.name === id);
      const img = door96?.img || "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.cardId = id;
      const imgEl = document.createElement("img");
      imgEl.className = "wizard-taming-pick-card-img";
      imgEl.src = img;
      imgEl.alt = id;
      btn.appendChild(imgEl);
      btn.addEventListener("click", () => {
        selectedId = id;
        cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("selected"));
        btn.classList.add("selected");
        applyBtn.disabled = false;
      });
      cardsWrap.appendChild(btn);
    });
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043A\u043B\u0430\u0441\u0441";
    applyBtn.disabled = true;
    applyBtn.addEventListener("click", () => {
      if (!selectedId) {
        return;
      }
      resolveLoseYourClassCurse({
        seat,
        curseCardId,
        chosenClassCardId: selectedId
      });
      socket_default.emit("message", {
        method: "LoseYourClassResolve",
        seat,
        curseCardId,
        chosenClassCardId: selectedId
      });
      modal.remove();
    });
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        e.stopPropagation();
      }
    });
  }
  function applyChangeClassCurseToSeat(seat, curseCardId) {
    const s = Number(seat);
    if (Number.isNaN(s) || s < 0) {
      return;
    }
    if (Number(localSeat) !== Number(s)) {
      return;
    }
    const curseId = String(curseCardId || "").trim();
    const equippedClassIds = collectEquippedClassDoorIdsForSeat(s);
    if (equippedClassIds.length === 0) {
      if (curseId) syncDoorCardMoveToDiscard(curseId);
      recalculateAllPowerDisplays();
      return;
    }
    const replacementId = findTopDoorDiscardClassCardId();
    const superIds = collectEquippedSuperMunchkinDoorIdsForSeat(s);
    const stripIds = [...equippedClassIds, ...superIds.filter((id) => !equippedClassIds.includes(id))];
    stripIds.forEach((id) => {
      syncDoorCardMoveToDiscard(id);
    });
    if (replacementId && document.getElementById(replacementId)) {
      const { main } = getMainAndSideZoneElementsForSeat(s) || {};
      if (main && main.id) {
        syncDoorCardMoveToZone(replacementId, main.id, null);
      }
    }
    if (curseId) syncDoorCardMoveToDiscard(curseId);
    recalculateAllPowerDisplays();
  }
  function isDoorEquippedRaceCard(door96) {
    if (!door96 || String(door96.race || "") === "monster") {
      return false;
    }
    if (!String(door96.race || "").trim()) {
      return false;
    }
    if (String(door96.kind || "").trim()) {
      return false;
    }
    return true;
  }
  function findTopDoorDiscardRaceCardId() {
    const z = document.getElementById("zone_doors_drop");
    if (!z) {
      return null;
    }
    const els = Array.from(z.querySelectorAll(".card"));
    for (let i3 = els.length - 1; i3 >= 0; i3--) {
      const id = els[i3]?.id;
      if (!id || !String(id).includes("door")) {
        continue;
      }
      const door96 = window.doors?.find((d) => d.name === id);
      if (isDoorEquippedRaceCard(door96)) {
        return id;
      }
    }
    return null;
  }
  function collectEquippedRaceDoorIdsForSeat(seat) {
    const out = [];
    const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
    [main, side].forEach((zone) => {
      if (!zone) {
        return;
      }
      zone.querySelectorAll(".card").forEach((el) => {
        const id = el?.id;
        if (!id || !String(id).includes("door")) {
          return;
        }
        const door96 = window.doors?.find((d) => d.name === id);
        if (isDoorEquippedRaceCard(door96) && !out.includes(id)) {
          out.push(id);
        }
      });
    });
    return out;
  }
  function collectEquippedHalfBreedDoorIdsForSeat(seat) {
    const out = [];
    const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
    [main, side].forEach((zone) => {
      if (!zone) {
        return;
      }
      zone.querySelectorAll(".card").forEach((el) => {
        const id = el?.id;
        if (!id) {
          return;
        }
        const door96 = window.doors?.find((d) => d.name === id);
        if (isHalfBreedDoorCard(door96) && !out.includes(id)) {
          out.push(id);
        }
      });
    });
    return out;
  }
  function applyChangeRaceCurseToSeat(seat, curseCardId) {
    const s = Number(seat);
    if (Number.isNaN(s) || s < 0) {
      return;
    }
    if (Number(localSeat) !== Number(s)) {
      return;
    }
    const curseId = String(curseCardId || "").trim();
    const equippedRaceIds = collectEquippedRaceDoorIdsForSeat(s);
    if (equippedRaceIds.length === 0) {
      if (curseId) syncDoorCardMoveToDiscard(curseId);
      recalculateAllPowerDisplays();
      return;
    }
    const replacementId = findTopDoorDiscardRaceCardId();
    const halfBreedIds = collectEquippedHalfBreedDoorIdsForSeat(s);
    const stripIds = [...equippedRaceIds, ...halfBreedIds.filter((id) => !equippedRaceIds.includes(id))];
    stripIds.forEach((id) => {
      syncDoorCardMoveToDiscard(id);
    });
    if (replacementId && document.getElementById(replacementId)) {
      const { main } = getMainAndSideZoneElementsForSeat(s) || {};
      if (main && main.id) {
        syncDoorCardMoveToZone(replacementId, main.id, null);
      }
    }
    if (curseId) syncDoorCardMoveToDiscard(curseId);
    recalculateAllPowerDisplays();
  }
  function emitLevelAdjust(seat, delta, allowWinningLevel = false) {
    const s = Number(seat);
    const d = Number(delta) || 0;
    if (!Number.isFinite(s) || s < 0 || !Number.isFinite(d) || d === 0) {
      return;
    }
    socket_default.emit("message", { method: "LevelAdjust", seat: s, delta: d, allowWinningLevel: Boolean(allowWinningLevel) });
  }
  function resolveLoseYourClassCurse({ seat, curseCardId, chosenClassCardId }) {
    const s = Number(seat);
    const curseId = String(curseCardId || "").trim();
    const chosenId = String(chosenClassCardId || "").trim();
    if (!Number.isFinite(s) || s < 0 || !curseId) {
      return;
    }
    const pending = loseYourClassPendingBySeat.get(s);
    const allowed = pending?.classCardIds || [];
    if (!chosenId || allowed.length > 0 && !allowed.includes(chosenId)) {
      return;
    }
    syncDoorCardMoveToDiscard(chosenId);
    syncDoorCardMoveToDiscard(curseId);
    loseYourClassPendingBySeat.delete(s);
    recalculateAllPowerDisplays();
  }
  function applyLoseYourClassCurseToSeat(seat, curseCardId) {
    const s = Number(seat);
    if (Number.isNaN(s) || s < 0) {
      return;
    }
    if (Number(localSeat) !== Number(s)) {
      return;
    }
    const curseId = String(curseCardId || "").trim();
    const classIds = collectEquippedClassDoorIdsForSeat(s);
    if (classIds.length === 0) {
      emitLevelAdjust(s, -1);
      if (curseId) syncDoorCardMoveToDiscard(curseId);
      return;
    }
    if (classIds.length === 1) {
      syncDoorCardMoveToDiscard(classIds[0]);
      if (curseId) syncDoorCardMoveToDiscard(curseId);
      recalculateAllPowerDisplays();
      return;
    }
    const superIds = collectEquippedSuperMunchkinDoorIdsForSeat(s);
    const hasSuper = superIds.length > 0;
    if (!hasSuper) {
      const id = classIds[classIds.length - 1];
      syncDoorCardMoveToDiscard(id);
      if (curseId) syncDoorCardMoveToDiscard(curseId);
      recalculateAllPowerDisplays();
      return;
    }
    loseYourClassPendingBySeat.set(s, { curseCardId: curseId, classCardIds: classIds.slice(0, 2) });
    if (Number(localSeat) === Number(s)) {
      openLoseYourClassModal({ seat: s, curseCardId: curseId, classCardIds: classIds.slice(0, 2) });
    }
  }
  function applyLoseYourRaceCurseToSeat(seat, curseCardId) {
    const s = Number(seat);
    if (Number.isNaN(s) || s < 0) {
      return;
    }
    if (Number(localSeat) !== Number(s)) {
      return;
    }
    const curseId = String(curseCardId || "").trim();
    const raceIds = collectEquippedRaceDoorIdsForSeat(s);
    if (raceIds.length === 0) {
      if (curseId) syncDoorCardMoveToDiscard(curseId);
      return;
    }
    const halfBreedIds = collectEquippedHalfBreedDoorIdsForSeat(s);
    const stripIds = [...raceIds, ...halfBreedIds.filter((id) => !raceIds.includes(id))];
    stripIds.forEach((id) => syncDoorCardMoveToDiscard(id));
    if (curseId) syncDoorCardMoveToDiscard(curseId);
    recalculateAllPowerDisplays();
  }
  function applyMalignMirrorCurseToSeat(seat, curseCardId) {
    const s = Number(seat);
    if (Number.isNaN(s) || s < 0) {
      return;
    }
    const curseId = String(curseCardId || "").trim();
    if (!curseId) {
      return;
    }
    if (Number(localSeat) === Number(s)) {
      socket_default.emit("message", { method: "MalignMirrorApply", seat: s, curseCardId: curseId });
    }
    recalculateAllPowerDisplays();
  }
  function tryActivateMalignMirrorForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return;
    }
    if (!getMonsterBattleContext().hasMonster) {
      return;
    }
    if (!malignMirrorPendingBySeat.has(s) || malignMirrorActiveBySeat.has(s)) {
      return;
    }
    if (isSeatParticipantInCurrentMonsterBattle(s)) {
      malignMirrorActiveBySeat.set(s, malignMirrorPendingBySeat.get(s));
      malignMirrorPendingBySeat.delete(s);
    }
  }
  function tryActivateChangeSexPenaltyForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return;
    }
    if (!getMonsterBattleContext().hasMonster) {
      return;
    }
    if (!changeSexPendingBySeat.has(s) || changeSexActiveBySeat.has(s)) {
      return;
    }
    if (isSeatParticipantInCurrentMonsterBattle(s)) {
      changeSexActiveBySeat.set(s, changeSexPendingBySeat.get(s));
      changeSexPendingBySeat.delete(s);
    }
  }
  function applyChangeSexCurseToSeat(seat, curseCardId) {
    const s = Number(seat);
    if (Number.isNaN(s) || s < 0) {
      return;
    }
    const curseId = String(curseCardId || "").trim();
    if (!curseId) {
      return;
    }
    if (Number(localSeat) !== Number(s)) {
      return;
    }
    const curseEl = document.getElementById(curseId);
    if (curseEl) {
      const usedNotDiscarded = String(curseEl.dataset?.changeSexUsedNotDiscarded || "") === "1";
      const inDiscard = String(curseEl.parentElement?.id || "") === "zone_doors_drop";
      if (usedNotDiscarded && !inDiscard) {
        return;
      }
    }
    const currentGender = String(characterBySeat?.[s]?.gender || "").trim();
    const nextGender = currentGender === "Female" ? "Male" : "Female";
    socket_default.emit("message", { method: "ChangeSexApply", seat: s, curseCardId: curseId, gender: nextGender });
  }
  function isCardInSeatMainOrSide(cardId, seat) {
    const id = String(cardId || "").trim();
    if (!id) {
      return false;
    }
    const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
    if (!main && !side) {
      return false;
    }
    const el = document.getElementById(id);
    if (!el) {
      return false;
    }
    return main && main.contains(el) || side && side.contains(el);
  }
  function moveBadStaffCardToDiscard(cardId) {
    const card = document.getElementById(cardId);
    const dropZone = document.getElementById("zone_doors_drop");
    if (!card || !dropZone) {
      return;
    }
    if (!cardId.includes("door")) {
      return;
    }
    const door96 = window.doors?.find((d) => d.name === cardId);
    if (door96 && String(door96.special || "") === "Cheat") {
      const trId = String(card.dataset?.cheatAttachedTreasureId || "");
      if (trId) {
        const trEl = document.getElementById(trId);
        if (trEl) {
          trEl.dataset.cheatCardId = "";
        }
      }
      clearCheatVisualPlacement(cardId, trId);
      card.dataset.cheatAttachedTreasureId = "";
      card.dataset.cheatUsed = "";
    }
    if (door96 && String(door96.special || "") === "Mate") {
      const srcId = String(card.dataset?.mateSourceMonsterId || "");
      const pairId = String(card.dataset?.matePairId || "");
      const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
      if (zone && pairId) {
        zone.querySelectorAll(".card").forEach((el) => {
          if (String(el?.dataset?.matePairId || "") === pairId) {
            el.dataset.matePairId = "";
          }
        });
      }
      if (zone && srcId) {
        zone.querySelectorAll(".card").forEach((el) => {
          const bId = el?.id;
          if (!bId) {
            return;
          }
          const bDoor = window.doors?.find((d) => d.name === bId);
          if (!bDoor || String(bDoor.special || "") !== "bonus_power_monster") {
            return;
          }
          if (String(el.dataset?.attachedMonsterId || "") === String(cardId)) {
            el.dataset.attachedMonsterId = srcId;
          }
        });
        pushMonsterBonusAttachmentsToServer();
      }
      card.dataset.mateUsed = "";
      card.dataset.mateSourceMonsterId = "";
      card.dataset.matePairId = "";
    }
    dropZone.appendChild(card);
    UpdatebackImgDoor();
    adjustCardWidth(".zone_doors_drop");
  }
  function enforceCheatAttachmentsInvariant() {
    document.querySelectorAll(".card[data-cheat-card-id]").forEach((trEl) => {
      const treasureId = trEl?.id;
      if (!treasureId || !String(treasureId).includes("treasure")) {
        return;
      }
      const cheatId = String(trEl.dataset?.cheatCardId || "");
      if (!cheatId) {
        return;
      }
      const inMain = isMainEquipmentZoneElement(trEl.parentElement);
      if (inMain) {
        applyCheatVisualPlacement(cheatId, treasureId);
        return;
      }
      trEl.dataset.cheatCardId = "";
      clearCheatVisualPlacement(cheatId, treasureId);
      const cheatEl = document.getElementById(cheatId);
      if (cheatEl && cheatEl.parentElement?.id !== "zone_doors_drop") {
        socket_default.emit("message", {
          method: "moveCard",
          cardId: cheatId,
          targetId: null,
          zoneId: "zone_doors_drop"
        });
      }
    });
  }
  function enforceHirelingFollowInvariant() {
    document.querySelectorAll(".card").forEach((maybeHireling) => {
      if (!maybeHireling?.id || !String(maybeHireling.id).includes("treasure")) {
        return;
      }
      if (!isTreasureSpecial(maybeHireling.id, "Hireling")) {
        return;
      }
      const attachedId = String(maybeHireling.dataset?.hirelingAttachedTreasureId || "");
      if (!attachedId) {
        return;
      }
      const attachedEl = document.getElementById(attachedId);
      if (!attachedEl) {
        maybeHireling.dataset.hirelingAttachedTreasureId = "";
        return;
      }
      if (String(attachedEl.dataset?.hirelingCardId || "") !== String(maybeHireling.id)) {
        attachedEl.dataset.hirelingCardId = String(maybeHireling.id);
      }
    });
  }
  function applyDivineInterventionResolve(cardId, clericSeatsFromNetwork) {
    const card = document.getElementById(cardId);
    if (card) {
      card.dataset.divineScheduled = "";
    }
    if (card) {
      moveBadStaffCardToDiscard(cardId);
    }
    const seats = Array.isArray(clericSeatsFromNetwork) ? clericSeatsFromNetwork.map((x) => Number(x)).filter((s) => Number.isFinite(s) && s >= 0 && s < effectiveSeatLayoutPlayerCount()) : null;
    if (seats && seats.length) {
      seats.forEach((s) => {
        const cur = Number(levelBySeat[s] ?? 1) || 1;
        setLevelBySeat(s, applyLevelDeltaWithWinRule(cur, 1, true));
      });
    } else {
      const nSeats = effectiveSeatLayoutPlayerCount();
      for (let s = 0; s < nSeats; s++) {
        if (isSeatClericClassActive(s)) {
          const cur = Number(levelBySeat[s] ?? 1) || 1;
          setLevelBySeat(s, applyLevelDeltaWithWinRule(cur, 1, true));
        }
      }
    }
    recalculateAllPowerDisplays();
  }
  function scheduleDivineInterventionIfNeeded(cardId, zoneEl) {
    if (!cardId || !zoneEl) {
      return;
    }
    if (!isDoorSpecial(cardId, "Divine intervention")) {
      return;
    }
    if (zoneEl.id === "zone_doors" || zoneEl.id === "zone_doors_drop") {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    if (el.dataset?.divineScheduled) {
      return;
    }
    el.dataset.divineScheduled = "1";
    if (Number(localSeat) !== 0) {
      return;
    }
    setTimeout(() => {
      const curEl = document.getElementById(cardId);
      if (!curEl) {
        return;
      }
      if (curEl.parentElement?.id === "zone_doors" || curEl.parentElement?.id === "zone_doors_drop") {
        curEl.dataset.divineScheduled = "";
        return;
      }
      const clericSeats = [];
      const nSeats = effectiveSeatLayoutPlayerCount();
      for (let s = 0; s < nSeats; s++) {
        if (isSeatClericClassActive(s)) {
          clericSeats.push(s);
        }
      }
      socket_default.emit("message", { method: "DivineInterventionResolve", cardId, clericSeats });
    }, 1e3);
  }
  function applyOutToLunchResolve(cardId) {
    const el = document.getElementById(cardId);
    if (el) {
      el.dataset.outToLunchScheduled = "";
    }
    if (!getMonsterBattleContext().hasMonster) {
      return;
    }
    MoveMonstersToDrop();
    battleActive = false;
    battleTurnSeat = null;
    pendingHelpSeats.clear();
    acceptedHelperSeat = null;
    monsterFightSeat = null;
    resetEscapeStateNow();
    deathLootActive = false;
    deathLootState = null;
    resumeEscapeAfterLoot = false;
    deathLootAwaitingEscapeFinish = false;
    turnAwaitingManualEnd = true;
    clearInterval(countdownInterval);
    const timerElement = document.getElementById("timer");
    if (timerElement) {
      timerElement.textContent = "";
    }
    updateTurnActionButtons(false);
    applyTurnHighlight();
    updateHelpUi();
    recalculateAllPowerDisplays();
    showBattleResult(`${seatAddressComma(currentTurnSeat)} \u0432\u043E\u0437\u044C\u043C\u0438 2 \u0441\u043E\u043A\u0440\u043E\u0432\u0438\u0449\u0430`);
    setTimeout(() => {
      hideBattleResult();
    }, 2e3);
  }
  function hideWandOfDowsingModal() {
    const existing = document.getElementById("wand-of-dowsing-modal");
    if (existing) {
      existing.remove();
    }
  }
  function collectDiscardCardsForWandOfDowsing() {
    const out = [];
    ["zone_doors_drop", "zone_treasure_drop"].forEach((zoneId) => {
      const z = document.getElementById(zoneId);
      if (!z) {
        return;
      }
      z.querySelectorAll(".card").forEach((el) => {
        const id = el?.id;
        if (!id || id === "card") {
          return;
        }
        const door96 = window.doors?.find((d) => d.name === id);
        const tr = window.treasures?.find((t) => t.name === id);
        const img = door96?.img || tr?.img || "";
        if (!img) {
          return;
        }
        out.push({ cardId: id, img, zoneId });
      });
    });
    return out;
  }
  function openWandOfDowsingModal({ wandCardId, actorSeat }) {
    hideWandOfDowsingModal();
    const modal = document.createElement("div");
    modal.id = "wand-of-dowsing-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "\u0428\u0442\u044B\u0440\u044C \u043B\u043E\u0437\u043E\u0445\u043E\u0434\u0446\u0430: \u0432\u044B\u0431\u0435\u0440\u0438 \u043A\u0430\u0440\u0442\u0443 \u0438\u0437 \u0441\u0431\u0440\u043E\u0441\u0430";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-pick-cards";
    cardsWrap.style.maxHeight = "min(62vh, 640px)";
    cardsWrap.style.overflowY = "auto";
    const candidates = collectDiscardCardsForWandOfDowsing();
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0432\u044B\u0431\u043E\u0440";
    applyBtn.disabled = true;
    let selectedId = "";
    if (candidates.length === 0) {
      const empty2 = document.createElement("div");
      empty2.style.color = "#e8e8f0";
      empty2.style.textAlign = "center";
      empty2.style.margin = "12px 0";
      empty2.textContent = "\u0412 \u0441\u0431\u0440\u043E\u0441\u0430\u0445 \u043D\u0435\u0442 \u043A\u0430\u0440\u0442. \u0428\u0442\u044B\u0440\u044C \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u0443\u0439\u0434\u0451\u0442 \u0432 \u0441\u0431\u0440\u043E\u0441.";
      panel.appendChild(title);
      panel.appendChild(empty2);
      applyBtn.textContent = "\u041E\u041A";
      applyBtn.disabled = false;
      applyBtn.addEventListener("click", () => {
        socket_default.emit("message", {
          method: "WandOfDowsingResolve",
          wandCardId,
          pickedCardId: "",
          actorSeat
        });
        modal.remove();
      });
      panel.appendChild(applyBtn);
      modal.appendChild(panel);
      document.body.appendChild(modal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          const w = document.getElementById(wandCardId);
          if (w) {
            w.dataset.wandDowsingScheduled = "";
          }
          modal.remove();
        }
      });
      return;
    }
    candidates.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.cardId = c.cardId;
      const img = document.createElement("img");
      img.className = "wizard-taming-pick-card-img";
      img.src = c.img || "";
      img.alt = c.cardId;
      btn.appendChild(img);
      btn.addEventListener("click", () => {
        cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selectedId = c.cardId;
        applyBtn.disabled = !selectedId;
      });
      cardsWrap.appendChild(btn);
    });
    applyBtn.addEventListener("click", () => {
      if (!selectedId) {
        return;
      }
      socket_default.emit("message", {
        method: "WandOfDowsingResolve",
        wandCardId,
        pickedCardId: selectedId,
        actorSeat
      });
      modal.remove();
    });
    panel.appendChild(title);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        const w = document.getElementById(wandCardId);
        if (w) {
          w.dataset.wandDowsingScheduled = "";
        }
        modal.remove();
      }
    });
  }
  function scheduleWandOfDowsingIfNeeded(cardId, zoneEl, playedBySeatRaw) {
    if (!cardId || !zoneEl) {
      return;
    }
    if (!isTreasureSpecial(cardId, "Wand of dowsing")) {
      return;
    }
    const onMain = isMainEquipmentZoneElement(zoneEl);
    const onMonster = zoneEl.id === "zone_monster";
    const onZone3 = zoneEl.id === "zone3";
    if (!onMain && !onMonster && !onZone3) {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    if (el.dataset?.wandDowsingScheduled) {
      return;
    }
    el.dataset.wandDowsingScheduled = "1";
    let actorSeat = Number(playedBySeatRaw);
    if (!Number.isFinite(actorSeat) || actorSeat < 0) {
      if (onMain) {
        actorSeat = getGlobalSeatForPlayZone(zoneEl);
      } else {
        actorSeat = Number(currentTurnSeat);
      }
    }
    if (!Number.isFinite(actorSeat) || actorSeat < 0) {
      el.dataset.wandDowsingScheduled = "";
      return;
    }
    setTimeout(() => {
      const cur = document.getElementById(cardId);
      if (!cur) {
        return;
      }
      const parent = cur.parentElement;
      const pId = parent?.id || "";
      const stillOnMain = isMainEquipmentZoneElement(parent);
      const stillOnMonster = pId === "zone_monster";
      const stillOnZone3 = pId === "zone3";
      const stillOk = onMain && stillOnMain || onMonster && stillOnMonster || onZone3 && stillOnZone3;
      if (!stillOk) {
        cur.dataset.wandDowsingScheduled = "";
        return;
      }
      if (Number(localSeat) === Number(actorSeat)) {
        openWandOfDowsingModal({ wandCardId: cardId, actorSeat });
      }
    }, 140);
  }
  function applyWandOfDowsingResolve({ wandCardId, pickedCardId, actorSeat }) {
    const hand = getHandElementForPlayerSeat(actorSeat);
    const drop = document.getElementById("zone_treasure_drop");
    if (pickedCardId) {
      const pickEl = document.getElementById(pickedCardId);
      if (pickEl && hand) {
        hand.appendChild(pickEl);
      }
    }
    const wandEl = document.getElementById(wandCardId);
    if (wandEl) {
      wandEl.dataset.wandDowsingScheduled = "";
      if (drop) {
        drop.appendChild(wandEl);
      }
    }
    hideWandOfDowsingModal();
    adjustCardWidth(".myhand");
    adjustCardWidth(".zone2");
    adjustCardWidth(".zone5");
    adjustCardHeight(".zone3");
    adjustCardHeight(".zone_monster");
    adjustCardWidth(".opponenthand");
    adjustCardWidth(".zone_opponent");
    adjustCardWidth(".zone_opponent_side");
    adjustCardWidth(".opponent2hand");
    adjustCardWidth(".zone_opponent2");
    adjustCardWidth(".zone_opponent2_side");
    adjustCardWidth(".opponent3hand");
    adjustCardWidth(".zone_opponent3");
    adjustCardWidth(".zone_opponent3_side");
    adjustCardWidth(".opponent_bl_hand");
    adjustCardWidth(".zone_opponent_bl");
    adjustCardWidth(".zone_opponent_bl_side");
    adjustCardWidth(".opponent_br_hand");
    adjustCardWidth(".zone_opponent_br");
    adjustCardWidth(".zone_opponent_br_side");
    UpdatebackImgTreasure();
    UpdatebackImgDoor();
    recalculateAllPowerDisplays();
  }
  function hideTransferralPotionModal() {
    const existing = document.getElementById("transferral-potion-modal");
    if (existing) {
      existing.remove();
    }
  }
  function openTransferralPotionModal({ potionCardId, actorSeat }) {
    hideTransferralPotionModal();
    if (!battleActive || !getMonsterBattleContext().hasMonster) {
      const el = document.getElementById(potionCardId);
      if (el) {
        el.dataset.transferralPotionScheduled = "";
      }
      return;
    }
    const fightSeat = getMonsterFightSeat();
    const maxSeat = Math.max(0, (Number(num) || characterBySeat.length || 3) - 1);
    const candidates = [];
    for (let s = 0; s <= maxSeat; s++) {
      if (Number(s) !== Number(fightSeat)) {
        candidates.push(s);
      }
    }
    if (candidates.length === 0) {
      const el = document.getElementById(potionCardId);
      if (el) {
        el.dataset.transferralPotionScheduled = "";
      }
      return;
    }
    const modal = document.createElement("div");
    modal.id = "transferral-potion-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "Transferral potion: \u043A\u0442\u043E \u0442\u0435\u043F\u0435\u0440\u044C \u0441\u0440\u0430\u0436\u0430\u0435\u0442\u0441\u044F \u0441 \u043C\u043E\u043D\u0441\u0442\u0440\u0430\u043C\u0438?";
    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.flexDirection = "column";
    buttons.style.gap = "10px";
    buttons.style.alignItems = "stretch";
    candidates.forEach((seat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-apply-btn";
      btn.textContent = getSeatLabel(seat);
      btn.addEventListener("click", () => {
        socket_default.emit("message", {
          method: "TransferralPotionResolve",
          potionCardId,
          newFighterSeat: seat,
          actorSeat
        });
        hideTransferralPotionModal();
      });
      buttons.appendChild(btn);
    });
    panel.appendChild(title);
    panel.appendChild(buttons);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        const el = document.getElementById(potionCardId);
        if (el) {
          el.dataset.transferralPotionScheduled = "";
        }
        hideTransferralPotionModal();
      }
    });
  }
  function scheduleTransferralPotionIfNeeded(cardId, zoneEl, playedBySeatRaw) {
    if (!cardId || !zoneEl) {
      return;
    }
    if (!isTreasureSpecial(cardId, "Transferral potion")) {
      return;
    }
    if (!battleActive || !getMonsterBattleContext().hasMonster) {
      return;
    }
    const onMain = isMainEquipmentZoneElement(zoneEl);
    const onMonster = zoneEl.id === "zone_monster";
    const onZone3 = zoneEl.id === "zone3";
    if (!onMain && !onMonster && !onZone3) {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    if (el.dataset?.transferralPotionScheduled) {
      return;
    }
    el.dataset.transferralPotionScheduled = "1";
    let actorSeat = Number(playedBySeatRaw);
    if (!Number.isFinite(actorSeat) || actorSeat < 0) {
      if (onMain) {
        actorSeat = getGlobalSeatForPlayZone(zoneEl);
      } else {
        actorSeat = Number(currentTurnSeat);
      }
    }
    if (!Number.isFinite(actorSeat) || actorSeat < 0) {
      el.dataset.transferralPotionScheduled = "";
      return;
    }
    setTimeout(() => {
      const cur = document.getElementById(cardId);
      if (!cur) {
        return;
      }
      const parent = cur.parentElement;
      const pId = parent?.id || "";
      const stillOnMain = isMainEquipmentZoneElement(parent);
      const stillOnMonster = pId === "zone_monster";
      const stillOnZone3 = pId === "zone3";
      const stillOk = onMain && stillOnMain || onMonster && stillOnMonster || onZone3 && stillOnZone3;
      if (!stillOk || !battleActive || !getMonsterBattleContext().hasMonster) {
        cur.dataset.transferralPotionScheduled = "";
        return;
      }
      if (Number(localSeat) === Number(actorSeat)) {
        openTransferralPotionModal({ potionCardId: cardId, actorSeat });
      }
    }, 140);
  }
  function applyTransferralPotionResolve({ potionCardId, newFighterSeat }) {
    hideTransferralPotionModal();
    const drop = document.getElementById("zone_treasure_drop");
    const potionEl = document.getElementById(potionCardId);
    if (potionEl) {
      potionEl.dataset.transferralPotionScheduled = "";
      if (drop) {
        drop.appendChild(potionEl);
      }
    }
    pendingHelpSeats.clear();
    acceptedHelperSeat = null;
    const nf = Number(newFighterSeat);
    if (Number.isFinite(nf) && nf >= 0) {
      monsterFightSeat = nf;
    }
    adjustCardWidth(".myhand");
    adjustCardWidth(".zone2");
    adjustCardWidth(".zone5");
    adjustCardHeight(".zone3");
    adjustCardHeight(".zone_monster");
    adjustCardWidth(".opponenthand");
    adjustCardWidth(".zone_opponent");
    adjustCardWidth(".zone_opponent_side");
    adjustCardWidth(".opponent2hand");
    adjustCardWidth(".zone_opponent2");
    adjustCardWidth(".zone_opponent2_side");
    adjustCardWidth(".opponent3hand");
    adjustCardWidth(".zone_opponent3");
    adjustCardWidth(".zone_opponent3_side");
    adjustCardWidth(".opponent_bl_hand");
    adjustCardWidth(".zone_opponent_bl");
    adjustCardWidth(".zone_opponent_bl_side");
    adjustCardWidth(".opponent_br_hand");
    adjustCardWidth(".zone_opponent_br");
    adjustCardWidth(".zone_opponent_br_side");
    UpdatebackImgTreasure();
    UpdatebackImgDoor();
    recalculateAllPowerDisplays();
    updateEffectiveMonsterBonusDisplay();
    applyTurnHighlight();
    updateHelpUi();
    flushTurnStateSyncToServer();
  }
  function applyFriendshipPotionResolve(cardId) {
    const el = document.getElementById(cardId);
    if (el) {
      el.dataset.friendshipPotionScheduled = "";
    }
    if (!getMonsterBattleContext().hasMonster) {
      return;
    }
    MoveMonstersToDrop();
    battleActive = false;
    battleTurnSeat = null;
    pendingHelpSeats.clear();
    acceptedHelperSeat = null;
    monsterFightSeat = null;
    resetEscapeStateNow();
    deathLootActive = false;
    deathLootState = null;
    resumeEscapeAfterLoot = false;
    deathLootAwaitingEscapeFinish = false;
    turnAwaitingManualEnd = true;
    clearInterval(countdownInterval);
    const timerElement = document.getElementById("timer");
    if (timerElement) {
      timerElement.textContent = "";
    }
    updateTurnActionButtons(false);
    applyTurnHighlight();
    updateHelpUi();
    recalculateAllPowerDisplays();
    showBattleResult(`${seatAddressComma(currentTurnSeat)} \u043C\u043E\u0436\u0435\u0448\u044C \u043F\u043E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043D\u044B\u0447\u043A\u0438`);
    setTimeout(() => {
      hideBattleResult();
    }, 2e3);
  }
  function applyHalitosisKillDoor68Resolve(potionCardId) {
    const potId = String(potionCardId || "").trim();
    const potEl = potId ? document.getElementById(potId) : null;
    const actorSeat = Number(potEl?.dataset?.halitosisActorSeat);
    if (potEl) {
      potEl.dataset.halitosisScheduled = "";
      potEl.dataset.halitosisActorSeat = "";
    }
    if (!battleActive) {
      return;
    }
    const ctx0 = getMonsterBattleContext();
    if (!ctx0.monsters.some((m) => m.cardId === HALITOSIS_TARGET_MONSTER_ID)) {
      return;
    }
    if (!document.getElementById(HALITOSIS_TARGET_MONSTER_ID)) {
      return;
    }
    const fightSeat = getMonsterFightSeat();
    if (fightSeat == null || fightSeat === void 0) {
      return;
    }
    const remainingAfterKill = ctx0.monsters.filter((m) => m.cardId !== HALITOSIS_TARGET_MONSTER_ID).length;
    const doorRow = window.doors?.find((d) => d.name === HALITOSIS_TARGET_MONSTER_ID);
    const baseLevelGain = Number(doorRow?.level) || 0;
    const seatToLevelMap = getSeatToLevelMap();
    const activeLevelSelector = seatToLevelMap[fightSeat];
    const activeLevel = activeLevelSelector ? getNumericText(activeLevelSelector) : 0;
    const activeIsWarrior = isSeatWarriorClassActive(fightSeat);
    const monsterPower = getEffectiveMonsterPower();
    let victoryBonusLevels = 0;
    const ab = getMonsterAbilitiesByCardId(HALITOSIS_TARGET_MONSTER_ID);
    if (ab) {
      const ids = Array.isArray(ab?.bonusLevelIfEquippedTreasureIds) ? ab.bonusLevelIfEquippedTreasureIds : [];
      const bonus = Number(ab?.bonusLevelIfEquippedTreasureBonus) || 0;
      if (bonus > 0 && ids.some((tid) => seatHasEquippedTreasureId(fightSeat, tid))) {
        victoryBonusLevels += bonus;
      }
      if (ab.bonusLevelIfOwnLevelEnough) {
        const ownLevelEnough = activeIsWarrior ? activeLevel >= monsterPower : activeLevel > monsterPower;
        if (ownLevelEnough) {
          victoryBonusLevels += Number(ab.bonusLevelIfOwnLevelEnoughBonus) || 1;
        }
      }
    }
    const levelDelta = baseLevelGain + victoryBonusLevels;
    moveCardToDiscardById(potId);
    moveCardToDiscardById(HALITOSIS_TARGET_MONSTER_ID);
    setMonsterBasePower(computeMonsterZoneBasePower());
    recalculateAllPowerDisplays();
    updateEffectiveMonsterBonusDisplay();
    const isActor = Number.isFinite(actorSeat) && actorSeat >= 0 && Number(localSeat) === Number(actorSeat);
    if (remainingAfterKill > 0) {
      if (levelDelta > 0 && isActor) {
        emitLevelAdjust(fightSeat, levelDelta, true);
      }
      return;
    }
    const helperSeatSnapshot = acceptedHelperSeat;
    const helperSeat = Number.isInteger(helperSeatSnapshot) ? helperSeatSnapshot : parseInt(helperSeatSnapshot, 10);
    let helperLevel = null;
    let helperLevelGain = 0;
    if (!Number.isNaN(helperSeat) && helperSeat >= 0) {
      if (seatHasRace(helperSeat, "Elf")) {
        helperLevelGain = 1;
        const helperLevelSelector = seatToLevelMap[helperSeat];
        const helperCurrentLevel = helperLevelSelector ? getNumericText(helperLevelSelector) : levelBySeat[helperSeat] || 1;
        helperLevel = helperCurrentLevel + helperLevelGain;
      }
    }
    const fighterNextLevel = activeLevel + levelDelta;
    showBattleResult("\u041C\u043E\u043D\u0441\u0442\u0440 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D");
    if (isActor) {
      socket_default.emit("message", {
        method: "CombatResolved",
        winner: "player",
        seat: fightSeat,
        level: fighterNextLevel,
        helperSeat: helperSeatSnapshot,
        helperLevel,
        helperLevelGain,
        text: "\u041C\u043E\u043D\u0441\u0442\u0440 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D"
      });
    }
  }
  function endBattleNoWinnerAndDropBattlefield(message, ms = 2e3) {
    MoveMonstersToDrop();
    battleActive = false;
    battleTurnSeat = null;
    pendingHelpSeats.clear();
    acceptedHelperSeat = null;
    monsterFightSeat = null;
    resetEscapeStateNow();
    deathLootActive = false;
    deathLootState = null;
    resumeEscapeAfterLoot = false;
    deathLootAwaitingEscapeFinish = false;
    turnAwaitingManualEnd = true;
    clearInterval(countdownInterval);
    const timerElement = document.getElementById("timer");
    if (timerElement) {
      timerElement.textContent = "";
    }
    updateTurnActionButtons(false);
    applyTurnHighlight();
    updateHelpUi();
    recalculateAllPowerDisplays();
    if (message) {
      showBattleResult(message);
      setTimeout(() => hideBattleResult(), ms);
    }
  }
  function hidePotionPickMonsterModal() {
    const existing = document.getElementById("potion-pick-monster-modal");
    if (existing) {
      existing.remove();
    }
  }
  function openPickMonsterToDiscardModal({ titleText, applyText, monsters, onApply }) {
    hidePotionPickMonsterModal();
    const modal = document.createElement("div");
    modal.id = "potion-pick-monster-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = titleText || "\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-pick-cards";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = applyText || "\u0412\u044B\u0431\u0440\u0430\u0442\u044C";
    applyBtn.disabled = true;
    let selectedMonster = null;
    (monsters || []).forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.cardId = m.cardId;
      const img = document.createElement("img");
      img.className = "wizard-taming-pick-card-img";
      img.src = m.img || "";
      img.alt = m.cardId;
      btn.appendChild(img);
      const bonusSum = getAttachedMonsterBonusPowerSum(m.cardId);
      const sumEl = document.createElement("div");
      sumEl.className = "wizard-taming-pick-sum";
      sumEl.textContent = bonusSum ? `\u0411\u043E\u043D\u0443\u0441: ${bonusSum > 0 ? `+${bonusSum}` : String(bonusSum)}` : "\u0411\u043E\u043D\u0443\u0441: 0";
      sumEl.style.marginTop = "4px";
      sumEl.style.fontSize = "16px";
      sumEl.style.color = "#ffd37a";
      sumEl.style.textAlign = "center";
      btn.appendChild(sumEl);
      const attachedBonuses = getAttachedMonsterBonusCards(m.cardId);
      if (attachedBonuses.length > 0) {
        const bonusesWrap = document.createElement("div");
        bonusesWrap.className = "wizard-taming-pick-bonuses";
        bonusesWrap.style.display = "flex";
        bonusesWrap.style.flexWrap = "wrap";
        bonusesWrap.style.justifyContent = "center";
        bonusesWrap.style.gap = "6px";
        bonusesWrap.style.marginTop = "6px";
        attachedBonuses.forEach((bc) => {
          const bi = document.createElement("img");
          bi.className = "wizard-taming-pick-bonus-img";
          bi.src = bc.img || "";
          bi.alt = bc.cardId;
          bi.style.width = "40px";
          bi.style.height = "auto";
          bi.style.borderRadius = "6px";
          bonusesWrap.appendChild(bi);
        });
        btn.appendChild(bonusesWrap);
      }
      btn.addEventListener("click", () => {
        cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selectedMonster = m.cardId;
        applyBtn.disabled = !selectedMonster;
      });
      cardsWrap.appendChild(btn);
    });
    applyBtn.addEventListener("click", () => {
      if (!selectedMonster) {
        return;
      }
      onApply?.(selectedMonster);
      modal.remove();
    });
    panel.appendChild(title);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function applyPotionDiscardMonster({ potionCardId, monsterCardId }) {
    const potionEl = potionCardId ? document.getElementById(potionCardId) : null;
    if (potionEl) {
      potionEl.dataset.potionUsed = "";
    }
    if (potionCardId) {
      moveCardToDiscardById(potionCardId);
    }
    if (monsterCardId) {
      moveCardToDiscardById(monsterCardId);
    }
    setMonsterBasePower(computeMonsterZoneBasePower());
    const ctx = getMonsterBattleContext();
    if (!ctx.hasMonster || ctx.monsters.length <= 0) {
      endBattleNoWinnerAndDropBattlefield(null, 0);
    }
    recalculateAllPowerDisplays();
  }
  function schedulePotionPickMonsterIfNeeded({ cardId, zoneEl, mode }) {
    if (!cardId || !zoneEl) {
      return;
    }
    const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
    if (!isBattleBonusZone) {
      return;
    }
    if (!battleActive || !getMonsterBattleContext().hasMonster) {
      return;
    }
    const tr = window.treasures?.find((t) => t.name === cardId);
    if (!tr) {
      return;
    }
    const expected = mode === "magic" ? "Magic lamp" : "Pollymorth Potion";
    if (String(tr.special || "") !== expected) {
      return;
    }
    if (mode === "magic" && Number(localSeat) !== Number(currentTurnSeat)) {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    if (el.dataset?.potionUsed) {
      return;
    }
    el.dataset.potionUsed = "1";
    setTimeout(() => {
      const curEl = document.getElementById(cardId);
      const parentId = curEl?.parentElement?.id || "";
      const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
      if (!curEl || !stillOnBattlefield) {
        if (curEl) {
          curEl.dataset.potionUsed = "";
        }
        return;
      }
      const ctx = getMonsterBattleContext();
      if (!ctx.hasMonster) {
        curEl.dataset.potionUsed = "";
        return;
      }
      const monsters = ctx.monsters;
      if (monsters.length <= 1) {
        socket_default.emit("message", { method: "PotionResolveSingleMonster", potionCardId: cardId });
        return;
      }
      openPickMonsterToDiscardModal({
        titleText: "\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0443\u0439\u0434\u0451\u0442 \u0432 \u0441\u0431\u0440\u043E\u0441",
        applyText: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043C\u043E\u043D\u0441\u0442\u0440\u0430",
        monsters,
        onApply: (monsterCardId) => {
          socket_default.emit("message", { method: "PotionResolve", potionCardId: cardId, monsterCardId });
        }
      });
    }, 30);
  }
  function hideIllusionModals() {
    hidePotionPickMonsterModal();
    hideWanderingMonsterPickModal();
  }
  function scheduleIllusionIfNeeded(cardId, zoneEl) {
    if (!cardId || !zoneEl) {
      return;
    }
    const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
    if (!isBattleBonusZone) {
      return;
    }
    if (!battleActive || !getMonsterBattleContext().hasMonster) {
      return;
    }
    if (!isDoorSpecial(cardId, "Illusion")) {
      return;
    }
    const monstersInHand = getLocalHandMonsterCardsForWanderingMonster();
    if (monstersInHand.length <= 0) {
      showBattleResult("Illusion: \u0432 \u0440\u0443\u043A\u0435 \u043D\u0435\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u043E\u0432 \u0434\u043B\u044F \u0437\u0430\u043C\u0435\u043D\u044B.");
      setTimeout(hideBattleResult, 1800);
      return;
    }
    const el = document.getElementById(cardId);
    if (!el || el.dataset?.illusionUsed) {
      return;
    }
    el.dataset.illusionUsed = "1";
    setTimeout(() => {
      const curEl = document.getElementById(cardId);
      const parentId = curEl?.parentElement?.id || "";
      const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
      if (!curEl || !stillOnBattlefield) {
        if (curEl) {
          curEl.dataset.illusionUsed = "";
        }
        return;
      }
      const ctx = getMonsterBattleContext();
      if (!ctx.hasMonster || ctx.monsters.length <= 0) {
        curEl.dataset.illusionUsed = "";
        return;
      }
      openPickMonsterToDiscardModal({
        titleText: "Illusion: \u0432\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0443\u0439\u0434\u0451\u0442 \u0432 \u0441\u0431\u0440\u043E\u0441",
        applyText: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043C\u043E\u043D\u0441\u0442\u0440\u0430",
        monsters: ctx.monsters,
        onApply: (discardMonsterId) => {
          hidePotionPickMonsterModal();
          const monstersNow = getLocalHandMonsterCardsForWanderingMonster();
          if (monstersNow.length <= 0) {
            showBattleResult("Illusion: \u0432 \u0440\u0443\u043A\u0435 \u043D\u0435\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u043E\u0432 \u0434\u043B\u044F \u0437\u0430\u043C\u0435\u043D\u044B.");
            setTimeout(hideBattleResult, 1800);
            curEl.dataset.illusionUsed = "";
            return;
          }
          hideWanderingMonsterPickModal();
          const modal = document.createElement("div");
          modal.id = "illusion-pick-hand-monster-modal";
          modal.className = "wizard-taming-pick-modal";
          const panel = document.createElement("div");
          panel.className = "wizard-taming-pick-panel";
          const title = document.createElement("div");
          title.className = "wizard-taming-pick-title";
          title.textContent = "Illusion: \u0432\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0438\u0437 \u0440\u0443\u043A\u0438 \u0434\u043B\u044F \u0437\u0430\u043C\u0435\u043D\u044B";
          const cardsWrap = document.createElement("div");
          cardsWrap.className = "wizard-taming-pick-cards";
          const applyBtn = document.createElement("button");
          applyBtn.type = "button";
          applyBtn.className = "wizard-taming-pick-apply-btn";
          applyBtn.textContent = "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0432 \u0431\u043E\u0439";
          applyBtn.disabled = true;
          let selected = null;
          monstersNow.forEach((m) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "wizard-taming-pick-card";
            btn.dataset.cardId = m.cardId;
            const img = document.createElement("img");
            img.className = "wizard-taming-pick-card-img";
            img.src = m.img || "";
            img.alt = m.cardId;
            btn.appendChild(img);
            btn.addEventListener("click", () => {
              cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
              btn.classList.add("is-selected");
              selected = m.cardId;
              applyBtn.disabled = !selected;
            });
            cardsWrap.appendChild(btn);
          });
          applyBtn.addEventListener("click", () => {
            if (!selected) {
              return;
            }
            socket_default.emit("message", {
              method: "IllusionResolve",
              seat: localSeat,
              illusionCardId: cardId,
              discardMonsterId,
              addMonsterId: selected
            });
            modal.remove();
          });
          panel.appendChild(title);
          panel.appendChild(cardsWrap);
          panel.appendChild(applyBtn);
          modal.appendChild(panel);
          document.body.appendChild(modal);
          modal.addEventListener("click", (e) => {
            if (e.target === modal) {
              modal.remove();
            }
          });
        }
      });
    }, 30);
  }
  function scheduleMagicLampIfNeeded(cardId, zoneEl) {
    return schedulePotionPickMonsterIfNeeded({ cardId, zoneEl, mode: "magic" });
  }
  function schedulePollymorthPotionIfNeeded(cardId, zoneEl) {
    return schedulePotionPickMonsterIfNeeded({ cardId, zoneEl, mode: "poly" });
  }
  function canLocalPlayMagicLampToBattleZone(zoneEl) {
    if (!zoneEl) {
      return true;
    }
    const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
    if (!isBattleBonusZone) {
      return true;
    }
    return true;
  }
  function scheduleOutToLunchIfNeeded(cardId, zoneEl) {
    if (!cardId || !zoneEl) {
      return;
    }
    if (!isDoorSpecial(cardId, "Out to lunch")) {
      return;
    }
    const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
    if (!isBattleBonusZone) {
      return;
    }
    if (!getMonsterBattleContext().hasMonster) {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    if (el.dataset?.outToLunchScheduled) {
      return;
    }
    el.dataset.outToLunchScheduled = "1";
    setTimeout(() => {
      const curEl = document.getElementById(cardId);
      if (!curEl) {
        return;
      }
      const parentId = curEl.parentElement?.id || "";
      const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
      if (!stillOnBattlefield) {
        curEl.dataset.outToLunchScheduled = "";
        return;
      }
      if (!getMonsterBattleContext().hasMonster) {
        curEl.dataset.outToLunchScheduled = "";
        return;
      }
      socket_default.emit("message", { method: "OutToLunchResolve", cardId });
    }, 1e3);
  }
  function scheduleFriendshipPotionIfNeeded(cardId, zoneEl) {
    if (!cardId || !zoneEl) {
      return;
    }
    if (!isTreasureSpecial(cardId, "Friendship potion")) {
      return;
    }
    const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
    if (!isBattleBonusZone) {
      return;
    }
    if (!getMonsterBattleContext().hasMonster) {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    if (el.dataset?.friendshipPotionScheduled) {
      return;
    }
    el.dataset.friendshipPotionScheduled = "1";
    setTimeout(() => {
      const curEl = document.getElementById(cardId);
      if (!curEl) {
        return;
      }
      const parentId = curEl.parentElement?.id || "";
      const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
      if (!stillOnBattlefield) {
        curEl.dataset.friendshipPotionScheduled = "";
        return;
      }
      if (!getMonsterBattleContext().hasMonster) {
        curEl.dataset.friendshipPotionScheduled = "";
        return;
      }
      socket_default.emit("message", { method: "FriendshipPotionResolve", cardId });
    }, 1e3);
  }
  function scheduleHalitosisPotionIfNeeded(cardId, zoneEl, playedBySeatRaw) {
    if (!cardId || !zoneEl) {
      return;
    }
    if (!isTreasureSpecial(cardId, HALITOSIS_SPECIAL)) {
      return;
    }
    const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
    if (!isBattleBonusZone) {
      return;
    }
    if (!battleActive || !getMonsterBattleContext().hasMonster) {
      return;
    }
    const ctx = getMonsterBattleContext();
    if (!ctx.monsters.some((m) => m.cardId === HALITOSIS_TARGET_MONSTER_ID)) {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    if (el.dataset?.halitosisScheduled) {
      return;
    }
    el.dataset.halitosisScheduled = "1";
    let actorSeat = Number(playedBySeatRaw);
    if (!Number.isFinite(actorSeat) || actorSeat < 0) {
      actorSeat = Number(currentTurnSeat);
    }
    el.dataset.halitosisActorSeat = String(actorSeat);
    setTimeout(() => {
      const curEl = document.getElementById(cardId);
      if (!curEl) {
        return;
      }
      const parentId = curEl.parentElement?.id || "";
      const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
      if (!stillOnBattlefield) {
        curEl.dataset.halitosisScheduled = "";
        curEl.dataset.halitosisActorSeat = "";
        return;
      }
      if (!battleActive || !getMonsterBattleContext().hasMonster) {
        curEl.dataset.halitosisScheduled = "";
        curEl.dataset.halitosisActorSeat = "";
        return;
      }
      const ctx2 = getMonsterBattleContext();
      if (!ctx2.monsters.some((m) => m.cardId === HALITOSIS_TARGET_MONSTER_ID)) {
        curEl.dataset.halitosisScheduled = "";
        curEl.dataset.halitosisActorSeat = "";
        return;
      }
      if (Number(localSeat) === Number(actorSeat)) {
        socket_default.emit("message", { method: "HalitosisKillDoor68Resolve", potionCardId: cardId });
      }
    }, 1e3);
  }
  function hideMatePickModal() {
    const existing = document.getElementById("mate-pick-monster-modal");
    if (existing) {
      existing.remove();
    }
  }
  function scheduleMateIfNeeded(cardId, zoneEl) {
    if (!cardId || !zoneEl) {
      return;
    }
    const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
    if (!isBattleBonusZone) {
      return;
    }
    if (!battleActive || !getMonsterBattleContext().hasMonster) {
      return;
    }
    if (!isDoorSpecial(cardId, "Mate")) {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el || el.dataset?.mateUsed) {
      return;
    }
    el.dataset.mateUsed = "1";
    setTimeout(() => {
      const curEl = document.getElementById(cardId);
      const parentId = curEl?.parentElement?.id || "";
      const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
      if (!curEl || !stillOnBattlefield) {
        if (curEl) {
          curEl.dataset.mateUsed = "";
        }
        return;
      }
      const ctx = getMonsterBattleContext();
      if (!ctx.hasMonster || ctx.monsters.length <= 0) {
        curEl.dataset.mateUsed = "";
        return;
      }
      if (ctx.monsters.length === 1) {
        const pairId = `mate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        socket_default.emit("message", { method: "MateApply", mateCardId: cardId, sourceMonsterId: ctx.monsters[0].cardId, pairId });
        return;
      }
      hideMatePickModal();
      const modal = document.createElement("div");
      modal.id = "mate-pick-monster-modal";
      modal.className = "wizard-taming-pick-modal";
      const panel = document.createElement("div");
      panel.className = "wizard-taming-pick-panel";
      const title = document.createElement("div");
      title.className = "wizard-taming-pick-title";
      title.textContent = "Mate: \u0432\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0434\u043B\u044F \u0434\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F";
      const cardsWrap = document.createElement("div");
      cardsWrap.className = "wizard-taming-pick-cards";
      const applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.className = "wizard-taming-pick-apply-btn";
      applyBtn.textContent = "\u0414\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043C\u043E\u043D\u0441\u0442\u0440\u0430";
      applyBtn.disabled = true;
      let selected = null;
      ctx.monsters.forEach((m) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wizard-taming-pick-card";
        btn.dataset.cardId = m.cardId;
        const img = document.createElement("img");
        img.className = "wizard-taming-pick-card-img";
        img.src = m.img || "";
        img.alt = m.cardId;
        btn.appendChild(img);
        const bonusSum = getAttachedMonsterBonusPowerSum(m.cardId);
        const sumEl = document.createElement("div");
        sumEl.className = "wizard-taming-pick-sum";
        sumEl.textContent = bonusSum ? `\u0411\u043E\u043D\u0443\u0441: ${bonusSum > 0 ? `+${bonusSum}` : String(bonusSum)}` : "\u0411\u043E\u043D\u0443\u0441: 0";
        sumEl.style.marginTop = "4px";
        sumEl.style.fontSize = "16px";
        sumEl.style.color = "#ffd37a";
        sumEl.style.textAlign = "center";
        btn.appendChild(sumEl);
        const attachedBonuses = getAttachedMonsterBonusCards(m.cardId);
        if (attachedBonuses.length > 0) {
          const bonusesWrap = document.createElement("div");
          bonusesWrap.className = "wizard-taming-pick-bonuses";
          bonusesWrap.style.display = "flex";
          bonusesWrap.style.flexWrap = "wrap";
          bonusesWrap.style.justifyContent = "center";
          bonusesWrap.style.gap = "6px";
          bonusesWrap.style.marginTop = "6px";
          attachedBonuses.forEach((bc) => {
            const bi = document.createElement("img");
            bi.className = "wizard-taming-pick-bonus-img";
            bi.src = bc.img || "";
            bi.alt = bc.cardId;
            bi.style.width = "40px";
            bi.style.height = "auto";
            bi.style.borderRadius = "6px";
            bonusesWrap.appendChild(bi);
          });
          btn.appendChild(bonusesWrap);
        }
        btn.addEventListener("click", () => {
          cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
          btn.classList.add("is-selected");
          selected = m.cardId;
          applyBtn.disabled = !selected;
        });
        cardsWrap.appendChild(btn);
      });
      applyBtn.addEventListener("click", () => {
        if (!selected) {
          return;
        }
        const pairId = `mate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        socket_default.emit("message", { method: "MateApply", mateCardId: cardId, sourceMonsterId: selected, pairId });
        modal.remove();
      });
      panel.appendChild(title);
      panel.appendChild(cardsWrap);
      panel.appendChild(applyBtn);
      modal.appendChild(panel);
      document.body.appendChild(modal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }, 30);
  }
  function findTreasureCardInSeatZones(cardId, seat) {
    const id = String(cardId || "").trim();
    if (!id || !id.includes("treasure")) {
      return null;
    }
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return null;
    }
    const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
    const zones = [getHandElementForPlayerSeat(s), main, side].filter(Boolean);
    for (const z of zones) {
      const found = Array.from(z.querySelectorAll(".card")).find((c) => c && c.id === id);
      if (found) {
        return found;
      }
    }
    if (localSeat != null && Number.isFinite(Number(localSeat)) && Number(s) !== Number(localSeat)) {
      const extra = [
        document.getElementById("opponenthand"),
        document.getElementById("opponent2hand"),
        document.getElementById("opponent3hand"),
        document.querySelector(".opponenthand")
      ].filter(Boolean);
      for (const z of extra) {
        if (zones.includes(z)) {
          continue;
        }
        const hit = Array.from(z.querySelectorAll(".card")).find((c) => c && c.id === id);
        if (hit) {
          return hit;
        }
      }
      const zoneSels = [".zone_opponent", ".zone_opponent2", ".zone_opponent3", ".zone_opponent_bl", ".zone_opponent_side", ".zone_opponent2_side", ".zone_opponent3_side", ".zone_opponent_bl_side"];
      for (const sel of zoneSels) {
        const z = document.querySelector(sel);
        if (!z || zones.includes(z)) {
          continue;
        }
        const hit = Array.from(z.querySelectorAll(".card")).find((c) => c && c.id === id);
        if (hit) {
          return hit;
        }
      }
    }
    return null;
  }
  function moveTreasureCardToDiscard(cardId, opts) {
    const id = String(cardId || "").trim();
    let card = null;
    const ownerSeat = opts && opts.ownerSeat != null ? Number(opts.ownerSeat) : NaN;
    if (Number.isFinite(ownerSeat)) {
      card = findTreasureCardInSeatZones(id, ownerSeat);
    }
    if (!card) {
      card = document.getElementById(id);
    }
    const dropZone = document.getElementById("zone_treasure_drop");
    if (!card || !dropZone) {
      return;
    }
    if (!id.includes("treasure")) {
      return;
    }
    if (isTreasureSpecial(id, "Hireling")) {
      const attachedId = String(card.dataset?.hirelingAttachedTreasureId || "");
      if (attachedId) {
        const attachedEl = document.getElementById(attachedId);
        if (attachedEl) {
          attachedEl.dataset.hirelingCardId = "";
          dropZone.appendChild(attachedEl);
        }
      }
      card.dataset.hirelingAttachedTreasureId = "";
    }
    const attachedCheatId = String(card.dataset?.cheatCardId || "");
    if (attachedCheatId) {
      card.dataset.cheatCardId = "";
      clearCheatVisualPlacement(attachedCheatId, id);
      const cheatEl = document.getElementById(attachedCheatId);
      if (cheatEl && cheatEl.parentElement?.id !== "zone_doors_drop") {
        moveBadStaffCardToDiscard(attachedCheatId);
      }
    }
    dropZone.appendChild(card);
    UpdatebackImgTreasure();
    adjustCardWidth(".zone_treasure_drop");
  }
  function treasureMetaIsWishingRing(tr) {
    if (!tr) {
      return false;
    }
    return String(tr.card_name || "").trim() === WISHING_RING_LABEL || String(tr.special || "").trim() === WISHING_RING_LABEL;
  }
  function isDoorCurseBySpecial(door96) {
    if (!door96) {
      return false;
    }
    return String(door96.special || "").trim().toLowerCase() === "curse";
  }
  function findWishingRingTreasureIdForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return null;
    }
    const hand = getHandElementForPlayerSeat(s);
    const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
    for (const zoneEl of [hand, main, side]) {
      if (!zoneEl) {
        continue;
      }
      for (const el of zoneEl.querySelectorAll(".card")) {
        const id = el?.id;
        if (!id || !String(id).includes("treasure")) {
          continue;
        }
        const tr = window.treasures?.find((t) => t.name === id);
        if (treasureMetaIsWishingRing(tr)) {
          return id;
        }
      }
    }
    return null;
  }
  function hideWishingRingChoiceBanner() {
    const el = document.getElementById("wishing-ring-curse-choice");
    if (el) {
      el.remove();
    }
  }
  function clearCurseWishingRingActive() {
    curseWishingRingActive = null;
    hideWishingRingChoiceBanner();
  }
  function collectWishingRingRespondersForTable() {
    const n = effectiveSeatLayoutPlayerCount();
    const out = [];
    for (let s = 0; s < n; s++) {
      const ringCardId = findWishingRingTreasureIdForSeat(s);
      if (ringCardId) {
        out.push({ seat: s, ringCardId });
      }
    }
    return out;
  }
  function maybeEmitCurseWishingRingAllSkippedApply() {
    const a = curseWishingRingActive;
    if (!a || a.cancelled) {
      return;
    }
    if (!a.ringSeats.length) {
      return;
    }
    if (!a.ringSeats.every((s) => a.skipped.includes(s))) {
      return;
    }
    const minSeat = Math.min(...a.ringSeats);
    if (localSeat === null || localSeat === void 0 || Number(localSeat) !== minSeat) {
      return;
    }
    socket_default.emit("message", {
      method: "CurseWishingRingAllSkippedApply",
      curseTargetSeat: a.curseTargetSeat,
      curseCardId: a.curseCardId,
      incomeTax: Boolean(a.incomeTax),
      bad_staff: a.bad_staff
    });
  }
  function refreshWishingRingBarUI() {
    hideWishingRingChoiceBanner();
    const a = curseWishingRingActive;
    if (!a || a.cancelled) {
      return;
    }
    if (localSeat === null || localSeat === void 0) {
      return;
    }
    const my = Number(localSeat);
    if (!Number.isFinite(my) || my < 0) {
      return;
    }
    const pendingRingSeats = a.ringSeats.filter((s) => !a.skipped.includes(s));
    if (pendingRingSeats.length === 0) {
      return;
    }
    const myStillPending = pendingRingSeats.includes(my);
    const buildWaitingTitleText = () => {
      const names = pendingRingSeats.map((s) => getSeatLabel(s));
      if (names.length === 1) {
        return `${names[0]} \u0440\u0435\u0448\u0430\u0435\u0442, \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0442\u044C \u043B\u0438 \u0445\u043E\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E.`;
      }
      if (names.length === 2) {
        return `${names[0]} \u0438 ${names[1]} \u0440\u0435\u0448\u0430\u044E\u0442, \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0442\u044C \u043B\u0438 \u0445\u043E\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E.`;
      }
      const head = names.slice(0, -1).join(", ");
      const last = names[names.length - 1];
      return `${head} \u0438 ${last} \u0440\u0435\u0448\u0430\u044E\u0442, \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0442\u044C \u043B\u0438 \u0445\u043E\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E.`;
    };
    if (!myStillPending) {
      const wrap2 = document.createElement("div");
      wrap2.id = "wishing-ring-curse-choice";
      wrap2.className = "wishing-ring-curse-choice is-waiting";
      const panel2 = document.createElement("div");
      panel2.className = "wishing-ring-curse-choice-panel";
      const title2 = document.createElement("div");
      title2.className = "wishing-ring-curse-choice-title";
      title2.textContent = buildWaitingTitleText();
      panel2.appendChild(title2);
      wrap2.appendChild(panel2);
      document.body.appendChild(wrap2);
      return;
    }
    const wrap = document.createElement("div");
    wrap.id = "wishing-ring-curse-choice";
    wrap.className = "wishing-ring-curse-choice";
    const panel = document.createElement("div");
    panel.className = "wishing-ring-curse-choice-panel";
    const title = document.createElement("div");
    title.className = "wishing-ring-curse-choice-title";
    const victimLabel = getSeatLabel(a.curseTargetSeat);
    if (my === Number(a.curseTargetSeat)) {
      title.textContent = "\u041D\u0430 \u0442\u0435\u0431\u044F \u0441\u044B\u0433\u0440\u0430\u043B\u0438 \u043F\u0440\u043E\u043A\u043B\u044F\u0442\u0438\u0435. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0445\u043E\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E \u0438 \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0435\u0433\u043E?";
    } else {
      title.textContent = `\u0421\u044B\u0433\u0440\u0430\u043B\u0438 \u043F\u0440\u043E\u043A\u043B\u044F\u0442\u0438\u0435 \u043D\u0430 ${victimLabel}. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0441\u0432\u043E\u0451 \u0445\u043E\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E \u0438 \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u043A\u043B\u044F\u0442\u0438\u0435?`;
    }
    panel.appendChild(title);
    const row = document.createElement("div");
    row.className = "wishing-ring-curse-choice-actions";
    const btnUse = document.createElement("button");
    btnUse.type = "button";
    btnUse.className = "wishing-ring-curse-choice-btn";
    btnUse.textContent = "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043A\u043E\u043B\u044C\u0446\u043E";
    const btnSkip = document.createElement("button");
    btnSkip.type = "button";
    btnSkip.className = "wishing-ring-curse-choice-btn";
    btnSkip.textContent = "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C";
    let done = false;
    const finish = (useRing) => {
      if (done) {
        return;
      }
      done = true;
      const st = curseWishingRingActive;
      if (!st || st.cancelled) {
        return;
      }
      if (localSeat === null || localSeat === void 0) {
        return;
      }
      const mySeat = Number(localSeat);
      if (!st.ringSeats.includes(mySeat)) {
        return;
      }
      const ringId = String(st.ringCardBySeat[String(mySeat)] || "").trim();
      socket_default.emit("message", {
        method: "CurseWishingRingResponse",
        curseCardId: st.curseCardId,
        responderSeat: mySeat,
        useRing,
        ringCardId: useRing ? ringId : ""
      });
      hideWishingRingChoiceBanner();
    };
    btnUse.addEventListener("click", () => finish(true));
    btnSkip.addEventListener("click", () => finish(false));
    row.appendChild(btnUse);
    row.appendChild(btnSkip);
    panel.appendChild(row);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);
  }
  function applyBadStaffLevelFromNetwork(res) {
    const seat = Number(res.seat);
    const badStaff = normalizeBadStaff(res.bad_staff);
    const cardId = res.cardId;
    if (!Number.isFinite(seat) || seat < 0 || !badStaff || !cardId) {
      return;
    }
    if (badStaff.type === "change class") {
      applyChangeClassCurseToSeat(seat, cardId);
    } else if (badStaff.type === "change race") {
      applyChangeRaceCurseToSeat(seat, cardId);
    } else if (badStaff.type === "lose your class") {
      applyLoseYourClassCurseToSeat(seat, cardId);
    } else if (badStaff.type === "lose your race") {
      applyLoseYourRaceCurseToSeat(seat, cardId);
    } else if (badStaff.type === "malign mirrror") {
      applyMalignMirrorCurseToSeat(seat, cardId);
    } else if (badStaff.type === "change sex") {
      applyChangeSexCurseToSeat(seat, cardId);
    } else if (badStaff.type === "chicken on your head") {
    } else if (badStaff.type === "income tax") {
    } else if (badStaff.type === "lose_all_equipped_classes_or_levels") {
      const levels = Number(badStaff.levels) || 3;
      if (Number(localSeat) === Number(seat)) {
        const classIds = collectEquippedClassDoorIdsForSeat(seat);
        if (classIds.length > 0) {
          classIds.forEach((id) => syncDoorCardMoveToDiscard(id));
        } else if (levels > 0) {
          emitLevelAdjust(seat, -levels);
        }
      }
      moveBadStaffCardToDiscard(cardId);
    } else {
      applyBadStaffToSeat(seat, badStaff);
      if (shouldAutoDiscardCurseAfterApply(badStaff)) {
        moveBadStaffCardToDiscard(cardId);
      }
    }
  }
  function handleCurseWishingRingOffer(res) {
    const curseTargetSeat = Number(res.curseTargetSeat);
    const curseCardId = String(res.curseCardId || "").trim();
    const incomeTax = Boolean(res.incomeTax);
    const rawResponders = Array.isArray(res.ringResponders) ? res.ringResponders : [];
    const bad_staff = res.bad_staff && typeof res.bad_staff === "object" ? res.bad_staff : null;
    if (!Number.isFinite(curseTargetSeat) || curseTargetSeat < 0 || !curseCardId) {
      return;
    }
    const ringResponders = rawResponders.map((x) => ({
      seat: Number(x?.seat),
      ringCardId: String(x?.ringCardId || "").trim()
    })).filter((x) => Number.isFinite(x.seat) && x.seat >= 0 && x.ringCardId);
    if (!ringResponders.length) {
      return;
    }
    const ringCardBySeat = {};
    const ringSeats = [];
    for (const { seat, ringCardId } of ringResponders) {
      ringSeats.push(seat);
      ringCardBySeat[String(seat)] = ringCardId;
    }
    curseWishingRingActive = {
      curseCardId,
      curseTargetSeat,
      incomeTax,
      bad_staff: bad_staff ? normalizeBadStaff(bad_staff) : null,
      ringSeats,
      ringCardBySeat,
      skipped: [],
      cancelled: false
    };
    refreshWishingRingBarUI();
  }
  function handleCurseWishingRingResponse(res) {
    const curseCardId = String(res.curseCardId || "").trim();
    const responderSeat = Number(res.responderSeat);
    const useRing = Boolean(res.useRing);
    const ringCardId = String(res.ringCardId || "").trim();
    const a = curseWishingRingActive;
    if (!curseCardId || !Number.isFinite(responderSeat) || responderSeat < 0) {
      return;
    }
    if (!a || a.cancelled || a.curseCardId !== curseCardId) {
      return;
    }
    if (!a.ringSeats.includes(responderSeat)) {
      return;
    }
    if (useRing) {
      a.cancelled = true;
      if (ringCardId) {
        moveTreasureCardToDiscard(ringCardId, { ownerSeat: responderSeat });
      }
      moveBadStaffCardToDiscard(curseCardId);
      clearCurseWishingRingActive();
      recalculateAllPowerDisplays();
      return;
    }
    if (a.skipped.includes(responderSeat)) {
      return;
    }
    a.skipped.push(responderSeat);
    refreshWishingRingBarUI();
    maybeEmitCurseWishingRingAllSkippedApply();
  }
  function handleCurseWishingRingAllSkippedApply(res) {
    hideWishingRingChoiceBanner();
    const curseCardId = String(res.curseCardId || "").trim();
    const curseTargetSeat = Number(res.curseTargetSeat);
    const incomeTax = Boolean(res.incomeTax);
    if (!curseCardId || !Number.isFinite(curseTargetSeat) || curseTargetSeat < 0) {
      return;
    }
    if (!curseWishingRingActive || curseWishingRingActive.curseCardId !== curseCardId) {
      return;
    }
    curseWishingRingActive = null;
    if (incomeTax) {
      handleIncomeTaxStart({ curseSeat: curseTargetSeat, curseCardId });
    } else {
      const bs = normalizeBadStaff(res.bad_staff);
      if (bs) {
        applyBadStaffLevelFromNetwork({
          seat: curseTargetSeat,
          bad_staff: res.bad_staff,
          cardId: curseCardId
        });
      }
      notifyCurseAppliedBanner(curseTargetSeat, curseCardId, bs);
    }
    recalculateAllPowerDisplays();
  }
  function scheduleBadStaffIfNeeded(cardId, zoneEl) {
    const door96 = window.doors?.find((d) => d.name === cardId);
    if (!door96) {
      return;
    }
    if (!isDoorCurseBySpecial(door96)) {
      return;
    }
    const badStaff = normalizeBadStaff(door96.bad_staff);
    if (door96.race === "monster") {
      return;
    }
    if (!isPlayerPlayZoneElement(zoneEl)) {
      return;
    }
    const seat = getGlobalSeatForPlayZone(zoneEl);
    if (seat === null || seat === void 0) {
      return;
    }
    const zoneId = zoneEl.id;
    const ringResponders = collectWishingRingRespondersForTable();
    const emitCurseWishingRingOfferIfNeeded = () => {
      if (!ringResponders.length) {
        return false;
      }
      socket_default.emit("message", {
        method: "CurseWishingRingOffer",
        curseTargetSeat: seat,
        curseCardId: cardId,
        incomeTax: badStaff?.type === "income tax",
        bad_staff: badStaff?.type === "income tax" ? null : badStaff,
        ringResponders
      });
      return true;
    };
    const runWhenCardStillInZone = (fn) => {
      queueMicrotask(() => {
        const card = document.getElementById(cardId);
        const zone = document.getElementById(zoneId);
        if (!card || !zone || !zone.contains(card)) {
          return;
        }
        fn(card, zone);
      });
    };
    if (badStaff?.type === "income tax") {
      if (emitCurseWishingRingOfferIfNeeded()) {
        return;
      }
      runWhenCardStillInZone((card) => {
        const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
        const stillEquipped = main && main.contains(card) || side && side.contains(card);
        if (!stillEquipped) {
          return;
        }
        socket_default.emit("message", {
          method: "IncomeTaxStart",
          curseSeat: seat,
          curseCardId: cardId
        });
      });
      return;
    }
    if (emitCurseWishingRingOfferIfNeeded()) {
      return;
    }
    runWhenCardStillInZone(() => {
      if (badStaff) {
        socket_default.emit("message", {
          method: "BadStaffLevel",
          seat,
          bad_staff: badStaff,
          cardId
        });
      }
      notifyCurseAppliedBanner(seat, cardId, badStaff);
    });
  }
  function ensureIncomeTaxBannerEl() {
    let el = document.getElementById("income-tax-curse-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "income-tax-curse-banner";
      el.className = "income-tax-curse-banner";
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    return el;
  }
  function showIncomeTaxBanner(text) {
    const el = ensureIncomeTaxBannerEl();
    el.textContent = String(text || "");
    el.classList.add("is-visible");
  }
  function hideIncomeTaxBanner() {
    const el = document.getElementById("income-tax-curse-banner");
    if (el) {
      el.textContent = "";
      el.classList.remove("is-visible");
    }
  }
  function collectIncomeTaxTreasuresForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return [];
    }
    const hand = getHandElementForPlayerSeat(s);
    const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const pushZone = (zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const id = cardEl.id;
        if (!id || !String(id).includes("treasure") || seen.has(id)) {
          return;
        }
        const t = window.treasures?.find((tr) => tr.name === id);
        if (!t) {
          return;
        }
        const price = Number(t.cost);
        if (!Number.isFinite(price) || price < 0) {
          return;
        }
        seen.add(id);
        const imgEl = cardEl.querySelector(".card-item");
        out.push({
          cardId: id,
          cost: price,
          img: imgEl?.src || t.img
        });
      });
    };
    pushZone(hand);
    pushZone(main);
    pushZone(side);
    return out;
  }
  function getIncomeTaxTotalGoldForSeat(seat) {
    return collectIncomeTaxTreasuresForSeat(seat).reduce((acc, x) => acc + (Number(x.cost) || 0), 0);
  }
  function getIncomeTaxReferenceCostForTreasureId(treasureId) {
    const tid = String(treasureId || "").trim();
    if (!tid) {
      return 0;
    }
    const t = window.treasures?.find((x) => x.name === tid);
    return Math.max(0, Number(t?.cost) || 0);
  }
  function closeIncomeTaxInitiatorModal() {
    const m = document.getElementById("income-tax-initiator-modal");
    if (m) {
      m.remove();
    }
  }
  function closeIncomeTaxResponderModal() {
    const m = document.getElementById("income-tax-responder-modal");
    if (m) {
      m.remove();
    }
  }
  function openIncomeTaxInitiatorModal(curseCardId) {
    closeIncomeTaxInitiatorModal();
    const curseSeat = incomeTaxSession ? incomeTaxSession.curseSeat : Number(localSeat);
    const cards = collectIncomeTaxTreasuresForSeat(curseSeat);
    const modal = document.createElement("div");
    modal.id = "income-tax-initiator-modal";
    modal.className = "sell-treasures-modal";
    const panel = document.createElement("div");
    panel.className = "sell-treasures-panel";
    const topBar = document.createElement("div");
    topBar.className = "sell-treasures-topbar";
    const titleText = document.createElement("div");
    titleText.className = "sell-treasures-total";
    titleText.style.flex = "1";
    titleText.style.fontSize = "22px";
    titleText.textContent = "\u041D\u0430\u043B\u043E\u0433: \u0432\u044B\u0431\u0435\u0440\u0438 \u043E\u0434\u043D\u0443 \u0448\u043C\u043E\u0442\u043A\u0443 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430";
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "sell-treasures-btn";
    confirmBtn.textContent = cards.length ? "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u0443\u044E" : "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C (\u043D\u0435\u0442 \u0448\u043C\u043E\u0442\u043E\u043A)";
    confirmBtn.disabled = cards.length > 0;
    topBar.appendChild(titleText);
    topBar.appendChild(confirmBtn);
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "sell-treasures-cards";
    panel.appendChild(topBar);
    panel.appendChild(cardsContainer);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    let selectedId = "";
    const updateBtn = () => {
      if (!cards.length) {
        confirmBtn.disabled = false;
        return;
      }
      confirmBtn.disabled = !selectedId;
    };
    if (!cards.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "sell-treasures-empty";
      emptyState.textContent = "\u041D\u0435\u0442 \u0448\u043C\u043E\u0442\u043E\u043A \u2014 \u043D\u0430\u043B\u043E\u0433 \u0434\u043B\u044F \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0445 \u0431\u0443\u0434\u0435\u0442 0 \u0437\u043E\u043B\u043E\u0442\u0430.";
      cardsContainer.appendChild(emptyState);
    } else {
      cards.forEach((cardData) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "sell-treasures-card";
        item.dataset.cardId = cardData.cardId;
        const img = document.createElement("img");
        img.className = "sell-treasures-card-img";
        img.src = cardData.img;
        img.alt = cardData.cardId;
        const costLabel = document.createElement("div");
        costLabel.className = "sell-treasures-card-cost";
        costLabel.textContent = `${cardData.cost}`;
        item.appendChild(img);
        item.appendChild(costLabel);
        item.addEventListener("click", () => {
          const cid = item.dataset.cardId;
          if (!cid) {
            return;
          }
          cardsContainer.querySelectorAll(".sell-treasures-card").forEach((el) => el.classList.remove("is-selected"));
          if (selectedId === cid) {
            selectedId = "";
          } else {
            selectedId = cid;
            item.classList.add("is-selected");
          }
          updateBtn();
        });
        cardsContainer.appendChild(item);
      });
    }
    confirmBtn.addEventListener("click", () => {
      const tid = selectedId || "";
      socket_default.emit("message", {
        method: "IncomeTaxInitiatorPick",
        curseSeat,
        curseCardId: String(curseCardId || "").trim(),
        treasureId: tid,
        referenceCost: getIncomeTaxReferenceCostForTreasureId(tid)
      });
      closeIncomeTaxInitiatorModal();
    });
  }
  function openIncomeTaxResponderModal(referenceCost, curseCardId) {
    closeIncomeTaxResponderModal();
    const ref = Math.max(0, Number(referenceCost) || 0);
    const cards = collectIncomeTaxTreasuresForSeat(localSeat);
    const modal = document.createElement("div");
    modal.id = "income-tax-responder-modal";
    modal.className = "sell-treasures-modal";
    const panel = document.createElement("div");
    panel.className = "sell-treasures-panel";
    const topBar = document.createElement("div");
    topBar.className = "sell-treasures-topbar";
    const titleText = document.createElement("div");
    titleText.className = "sell-treasures-total";
    titleText.style.flex = "1";
    titleText.style.fontSize = "22px";
    titleText.textContent = `\u041D\u0430\u043B\u043E\u0433: \u0441\u0431\u0440\u043E\u0441\u044C \u0448\u043C\u043E\u0442\u043A\u0438 \u043C\u0438\u043D\u0438\u043C\u0443\u043C \u043D\u0430 ${ref} \u0437\u043E\u043B\u043E\u0442\u0430 (\u0441\u0435\u0439\u0447\u0430\u0441: 0).`;
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "sell-treasures-btn";
    confirmBtn.textContent = "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0441\u0431\u0440\u043E\u0441";
    confirmBtn.disabled = ref > 0;
    topBar.appendChild(titleText);
    topBar.appendChild(confirmBtn);
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "sell-treasures-cards";
    panel.appendChild(topBar);
    panel.appendChild(cardsContainer);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    const selected = /* @__PURE__ */ new Set();
    const selectedOrder = [];
    const cardCostById = /* @__PURE__ */ new Map();
    cards.forEach(({ cardId, cost }) => {
      cardCostById.set(cardId, Number(cost) || 0);
    });
    const sumSelected = () => {
      let t = 0;
      selected.forEach((id) => {
        t += cardCostById.get(id) || 0;
      });
      return t;
    };
    const refreshTitle = () => {
      const s = sumSelected();
      titleText.textContent = `\u041D\u0430\u043B\u043E\u0433: \u0441\u0431\u0440\u043E\u0441\u044C \u0448\u043C\u043E\u0442\u043A\u0438 \u043C\u0438\u043D\u0438\u043C\u0443\u043C \u043D\u0430 ${ref} \u0437\u043E\u043B\u043E\u0442\u0430 (\u0441\u0435\u0439\u0447\u0430\u0441: ${s}).`;
      confirmBtn.disabled = ref > 0 && s < ref;
    };
    if (!cards.length && ref > 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "sell-treasures-empty";
      emptyState.textContent = "\u041D\u0435\u0442 \u0448\u043C\u043E\u0442\u043E\u043A \u0434\u043B\u044F \u0432\u044B\u0431\u043E\u0440\u0430.";
      cardsContainer.appendChild(emptyState);
      confirmBtn.disabled = true;
    } else {
      cards.forEach((cardData) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "sell-treasures-card";
        item.dataset.cardId = cardData.cardId;
        const img = document.createElement("img");
        img.className = "sell-treasures-card-img";
        img.src = cardData.img;
        img.alt = cardData.cardId;
        const costLabel = document.createElement("div");
        costLabel.className = "sell-treasures-card-cost";
        costLabel.textContent = `${cardData.cost}`;
        item.appendChild(img);
        item.appendChild(costLabel);
        item.addEventListener("click", () => {
          const cid = item.dataset.cardId;
          if (!cid) {
            return;
          }
          if (selected.has(cid)) {
            selected.delete(cid);
            const idx = selectedOrder.indexOf(cid);
            if (idx >= 0) {
              selectedOrder.splice(idx, 1);
            }
            item.classList.remove("is-selected");
          } else {
            selected.add(cid);
            selectedOrder.push(cid);
            item.classList.add("is-selected");
          }
          refreshTitle();
        });
        cardsContainer.appendChild(item);
      });
    }
    confirmBtn.addEventListener("click", () => {
      if (ref > 0 && sumSelected() < ref) {
        return;
      }
      socket_default.emit("message", {
        method: "IncomeTaxResponderSubmit",
        seat: localSeat,
        cardIds: Array.from(selected),
        curseCardId: String(curseCardId || "").trim()
      });
      closeIncomeTaxResponderModal();
    });
  }
  function finishIncomeTaxCurse(curseCardId) {
    hideIncomeTaxBanner();
    closeIncomeTaxInitiatorModal();
    closeIncomeTaxResponderModal();
    incomeTaxSession = null;
    const cid = String(curseCardId || "").trim();
    if (cid) {
      moveBadStaffCardToDiscard(cid);
    }
    recalculateAllPowerDisplays();
  }
  function tryEmitIncomeTaxCurseFinishedIfDone() {
    if (!incomeTaxSession || incomeTaxSession.finishEmitSent) {
      return;
    }
    const { curseCardId, phase2NeedModal, phase2Done, phase2AllCount } = incomeTaxSession;
    const need = Array.isArray(phase2NeedModal) ? phase2NeedModal : [];
    const total = Number.isFinite(Number(phase2AllCount)) && Number(phase2AllCount) > 0 ? Number(phase2AllCount) : need.length;
    if (phase2Done.size < total) {
      return;
    }
    incomeTaxSession.finishEmitSent = true;
    const cid = String(curseCardId || "").trim();
    if (cid) {
      socket_default.emit("message", { method: "IncomeTaxCurseFinished", curseCardId: cid });
    }
  }
  function handleIncomeTaxStart(res) {
    const curseSeat = Number(res.curseSeat);
    const curseCardId = String(res.curseCardId || "").trim();
    if (!Number.isFinite(curseSeat) || curseSeat < 0 || !curseCardId) {
      return;
    }
    closeIncomeTaxInitiatorModal();
    closeIncomeTaxResponderModal();
    incomeTaxSession = {
      curseSeat,
      curseCardId,
      referenceCost: null,
      phase2NeedModal: [],
      phase2AllCount: 0,
      phase2Done: /* @__PURE__ */ new Set(),
      finishEmitSent: false
    };
    showIncomeTaxBanner(`\u041D\u0430\u043B\u043E\u0433: ${getSeatLabel(curseSeat)} \u0432\u044B\u0431\u0438\u0440\u0430\u0435\u0442 \u0448\u043C\u043E\u0442\u043A\u0443 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430.`);
    if (localSeat !== null && localSeat !== void 0 && Number(localSeat) === curseSeat) {
      openIncomeTaxInitiatorModal(curseCardId);
    }
  }
  function handleIncomeTaxInitiatorPick(res) {
    const curseSeat = Number(res.curseSeat);
    const curseCardId = String(res.curseCardId || "").trim();
    const treasureId = String(res.treasureId || "").trim();
    if (!Number.isFinite(curseSeat) || curseSeat < 0 || !curseCardId) {
      return;
    }
    let referenceCost = Number(res.referenceCost);
    if (!Number.isFinite(referenceCost)) {
      referenceCost = 0;
      if (treasureId) {
        const t = window.treasures?.find((x) => x.name === treasureId);
        referenceCost = Math.max(0, Number(t?.cost) || 0);
      }
    }
    referenceCost = Math.max(0, referenceCost);
    if (treasureId) {
      moveTreasureCardToDiscard(treasureId, { ownerSeat: curseSeat });
    }
    const nPlayersForModal = effectiveSeatLayoutPlayerCount();
    const insufficientSeats = [];
    const discardIdsBySeat = {};
    for (let s = 0; s < nPlayersForModal; s++) {
      if (s === curseSeat) {
        continue;
      }
      if (getIncomeTaxTotalGoldForSeat(s) < referenceCost) {
        insufficientSeats.push(s);
        discardIdsBySeat[s] = collectIncomeTaxTreasuresForSeat(s).map((r) => r.cardId).filter(Boolean);
      }
    }
    const payingSeats = [];
    for (let s = 0; s < nPlayersForModal; s++) {
      if (s === curseSeat) {
        continue;
      }
      if (!insufficientSeats.includes(s)) {
        payingSeats.push(s);
      }
    }
    const needModal = payingSeats;
    for (const s of insufficientSeats) {
      const rawIds = discardIdsBySeat[s] ?? discardIdsBySeat[String(s)] ?? [];
      const ids = Array.isArray(rawIds) ? rawIds.filter(Boolean) : [];
      if (localSeat !== null && localSeat !== void 0 && Number(localSeat) === s) {
        for (const id of ids) {
          moveTreasureCardToDiscard(id, { ownerSeat: s });
        }
        let cur = levelBySeat[s];
        if (cur == null || Number.isNaN(cur)) {
          cur = 1;
        }
        setLevelBySeat(s, Math.max(1, cur - 1));
        socket_default.emit("message", {
          method: "IncomeTaxInsufficientDumpSync",
          seat: s,
          cardIds: ids
        });
      }
    }
    if (localSeat !== null && localSeat !== void 0 && Number(localSeat) === curseSeat) {
      socket_default.emit("message", {
        method: "IncomeTaxSyncDiscards",
        cardIds: treasureId ? [treasureId] : [],
        levelDownSeats: []
      });
    }
    const bannerParts = [];
    if (insufficientSeats.length) {
      const who = insufficientSeats.map((s) => localSeat !== null && localSeat !== void 0 && Number(localSeat) === s ? "\u0423 \u0442\u0435\u0431\u044F" : getSeatLabel(s)).join(", ");
      bannerParts.push(`${who} \u2014 \u043D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0441\u0443\u043C\u043C\u044B \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u0438 \u0448\u043C\u043E\u0442\u043E\u043A (\u043D\u0443\u0436\u043D\u043E ${referenceCost}).`);
    }
    if (bannerParts.length) {
      showIncomeTaxBanner(`\u041D\u0430\u043B\u043E\u0433: ${bannerParts.join(" ")}`);
    } else {
      hideIncomeTaxBanner();
    }
    const phase2AllCount = insufficientSeats.length + payingSeats.length;
    const phase2DoneInit = new Set(insufficientSeats);
    const mergePhase2Done = () => {
      const merged = new Set(phase2DoneInit);
      if (incomeTaxSession && incomeTaxSession.curseCardId === curseCardId && incomeTaxSession.phase2Done) {
        for (const s0 of incomeTaxSession.phase2Done) {
          const n = Number(s0);
          if (!Number.isFinite(n)) {
            continue;
          }
          if (insufficientSeats.includes(n) || payingSeats.includes(n)) {
            merged.add(n);
          }
        }
      }
      return merged;
    };
    const nextPhase2Done = mergePhase2Done();
    if (!incomeTaxSession || incomeTaxSession.curseCardId !== curseCardId) {
      incomeTaxSession = {
        curseSeat,
        curseCardId,
        referenceCost,
        phase2NeedModal: needModal,
        phase2AllCount,
        phase2Done: nextPhase2Done,
        finishEmitSent: false
      };
    } else {
      incomeTaxSession.referenceCost = referenceCost;
      incomeTaxSession.phase2NeedModal = needModal;
      incomeTaxSession.phase2AllCount = phase2AllCount;
      incomeTaxSession.phase2Done = nextPhase2Done;
    }
    if (needModal.length === 0) {
      tryEmitIncomeTaxCurseFinishedIfDone();
      return;
    }
    for (const s of needModal) {
      if (localSeat !== null && localSeat !== void 0 && Number(localSeat) === s) {
        openIncomeTaxResponderModal(referenceCost, curseCardId);
      }
    }
    tryEmitIncomeTaxCurseFinishedIfDone();
  }
  function handleIncomeTaxInsufficientDumpSync(res) {
    const seat = Number(res.seat);
    const cardIds = Array.isArray(res.cardIds) ? res.cardIds.filter(Boolean) : [];
    if (!Number.isFinite(seat) || seat < 0) {
      return;
    }
    if (localSeat !== null && localSeat !== void 0 && Number(localSeat) === seat) {
      return;
    }
    cardIds.forEach((id) => moveTreasureCardToDiscard(id, { ownerSeat: seat }));
    let cur = levelBySeat[seat];
    if (cur == null || Number.isNaN(cur)) {
      cur = 1;
    }
    setLevelBySeat(seat, Math.max(1, cur - 1));
    recalculateAllPowerDisplays();
  }
  function handleIncomeTaxResponderSubmit(res) {
    const seat = Number(res.seat);
    const curseCardId = String(res.curseCardId || "").trim();
    const cardIds = Array.isArray(res.cardIds) ? res.cardIds.filter(Boolean) : [];
    if (!Number.isFinite(seat) || seat < 0 || !curseCardId) {
      return;
    }
    cardIds.forEach((id) => moveTreasureCardToDiscard(id, { ownerSeat: seat }));
    if (incomeTaxSession && incomeTaxSession.curseCardId === curseCardId) {
      incomeTaxSession.phase2Done.add(seat);
      tryEmitIncomeTaxCurseFinishedIfDone();
    }
    recalculateAllPowerDisplays();
  }
  function applyTreasureLevelToSeat(seat, levelGain) {
    const gain = Number(levelGain);
    if (!Number.isFinite(gain) || gain <= 0) {
      return;
    }
    let current = levelBySeat[seat];
    if (current == null || Number.isNaN(current)) {
      current = 1;
    }
    current = Math.max(1, current);
    const next = applyLevelDeltaWithWinRule(current, gain, false);
    setLevelBySeat(seat, next);
    recalculateAllPowerDisplays();
  }
  function getLocalPlayerSellableTreasureCards() {
    const handEl = document.querySelector(".myhand");
    const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
    const cards = [];
    const pushZoneTreasures = (zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const treasure74 = window.treasures?.find((t) => t.name === cardEl.id);
        if (!treasure74) {
          return;
        }
        const price = Number(treasure74.cost);
        if (!Number.isFinite(price) || price < 0) {
          return;
        }
        if (price === 0) {
          return;
        }
        cards.push({
          cardId: cardEl.id,
          img: treasure74.img,
          cost: price
        });
      });
    };
    pushZoneTreasures(handEl);
    pushZoneTreasures(side);
    pushZoneTreasures(main);
    return cards;
  }
  function closeSellTreasuresModal() {
    const modal = document.getElementById("sell-treasures-modal");
    if (modal) {
      modal.remove();
    }
  }
  function openSellTreasuresModal() {
    if (localSeat === null || localSeat === void 0) {
      return;
    }
    if (Number(localSeat) !== Number(currentTurnSeat)) {
      showBattleResult("\u041F\u0440\u043E\u0434\u0430\u0432\u0430\u0442\u044C \u0448\u043C\u043E\u0442\u043A\u0438 \u043C\u043E\u0436\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u0441\u0432\u043E\u0439 \u0445\u043E\u0434.");
      setTimeout(() => {
        hideBattleResult();
      }, 1500);
      return;
    }
    closeSellTreasuresModal();
    const sellableCards = getLocalPlayerSellableTreasureCards();
    const localCharacter = characterBySeat[localSeat];
    const isLocalHalfling = seatHasRace(localSeat, "Halfling");
    const halflingBonusAvailable = isLocalHalfling && !halflingDoubleSellUsedBySeat[localSeat];
    const modal = document.createElement("div");
    modal.id = "sell-treasures-modal";
    modal.className = "sell-treasures-modal";
    const panel = document.createElement("div");
    panel.className = "sell-treasures-panel";
    const topBar = document.createElement("div");
    topBar.className = "sell-treasures-topbar";
    const totalText = document.createElement("div");
    totalText.className = "sell-treasures-total";
    totalText.textContent = "\u041E\u0431\u0449\u0430\u044F \u0441\u0443\u043C\u043C\u0430: 0";
    const sellButton = document.createElement("button");
    sellButton.className = "sell-treasures-btn";
    sellButton.textContent = "\u043F\u0440\u043E\u0434\u0430\u0442\u044C";
    sellButton.disabled = true;
    topBar.appendChild(totalText);
    topBar.appendChild(sellButton);
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "sell-treasures-cards";
    panel.appendChild(topBar);
    panel.appendChild(cardsContainer);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    const selected = /* @__PURE__ */ new Set();
    const selectedOrder = [];
    const cardCostById = /* @__PURE__ */ new Map();
    sellableCards.forEach(({ cardId, cost }) => {
      cardCostById.set(cardId, Number(cost) || 0);
    });
    const getSelectedTotalCost = () => {
      let total = 0;
      selected.forEach((cardId) => {
        total += cardCostById.get(cardId) || 0;
      });
      let bonusUsed = false;
      if (halflingBonusAvailable && selectedOrder.length > 0) {
        const firstSelectedId = selectedOrder[0];
        if (selected.has(firstSelectedId)) {
          total += cardCostById.get(firstSelectedId) || 0;
          bonusUsed = true;
        }
      }
      return { total, bonusUsed };
    };
    const updateTopBar = () => {
      totalText.textContent = `\u041E\u0431\u0449\u0430\u044F \u0441\u0443\u043C\u043C\u0430: ${getSelectedTotalCost().total}`;
      sellButton.disabled = selected.size === 0;
    };
    if (!sellableCards.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "sell-treasures-empty";
      emptyState.textContent = "\u041D\u0435\u0442 \u0448\u043C\u043E\u0442\u043E\u043A \u0434\u043B\u044F \u043F\u0440\u043E\u0434\u0430\u0436\u0438";
      cardsContainer.appendChild(emptyState);
    } else {
      sellableCards.forEach((cardData) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "sell-treasures-card";
        item.dataset.cardId = cardData.cardId;
        item.dataset.cost = String(cardData.cost);
        const img = document.createElement("img");
        img.className = "sell-treasures-card-img";
        img.src = cardData.img;
        img.alt = cardData.cardId;
        const costLabel = document.createElement("div");
        costLabel.className = "sell-treasures-card-cost";
        costLabel.textContent = `${cardData.cost}`;
        item.appendChild(img);
        item.appendChild(costLabel);
        item.addEventListener("click", () => {
          const cardId = item.dataset.cardId;
          if (!cardId) {
            return;
          }
          if (selected.has(cardId)) {
            selected.delete(cardId);
            const idx = selectedOrder.indexOf(cardId);
            if (idx >= 0) {
              selectedOrder.splice(idx, 1);
            }
            item.classList.remove("is-selected");
          } else {
            selected.add(cardId);
            selectedOrder.push(cardId);
            item.classList.add("is-selected");
          }
          updateTopBar();
        });
        cardsContainer.appendChild(item);
      });
    }
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeSellTreasuresModal();
      }
    });
    sellButton.addEventListener("click", () => {
      if (!selected.size) {
        return;
      }
      const { total: totalCost, bonusUsed } = getSelectedTotalCost();
      if (bonusUsed && isLocalHalfling) {
        halflingDoubleSellUsedBySeat[localSeat] = true;
      }
      socket_default.emit("message", {
        method: "SellTreasures",
        seat: localSeat,
        cardIds: Array.from(selected),
        totalCost
      });
      closeSellTreasuresModal();
    });
  }
  function applyTreasureSellResult(seat, cardIds, totalCost) {
    const parsedSeat = parseInt(seat, 10);
    if (Number.isNaN(parsedSeat)) {
      return;
    }
    const safeCardIds = Array.isArray(cardIds) ? cardIds.filter(Boolean) : [];
    let validCost = Number(totalCost);
    if (!Number.isFinite(validCost)) {
      validCost = 0;
    }
    if (!safeCardIds.length) {
      return;
    }
    safeCardIds.forEach((cardId) => moveTreasureCardToDiscard(cardId));
    const levelGain = Math.floor(Math.max(0, validCost) / 1e3);
    if (levelGain > 0) {
      let current = levelBySeat[parsedSeat];
      if (current == null || Number.isNaN(current)) {
        current = 1;
      }
      const next = applyLevelDeltaWithWinRule(Math.max(1, current), levelGain, false);
      setLevelBySeat(parsedSeat, next);
    }
    recalculateAllPowerDisplays();
  }
  function notifyIfTreasureLevelBlockedOnSeat(draggingCardEl, targetZoneEl) {
    if (!draggingCardEl || !isPlayerPlayZoneElement(targetZoneEl)) {
      return;
    }
    const treasure74 = window.treasures?.find((t) => t.name === draggingCardEl.id);
    if (!treasure74) {
      return;
    }
    const levelGain = Number(treasure74.level);
    if (!Number.isFinite(levelGain) || levelGain <= 0) {
      return;
    }
    const seat = getGlobalSeatForPlayZone(targetZoneEl);
    if (seat === null || seat === void 0) {
      return;
    }
    let curLv = levelBySeat[seat];
    if (curLv == null || Number.isNaN(curLv)) {
      curLv = 1;
    }
    curLv = Math.max(1, Math.floor(Number(curLv)));
    if (curLv < WINNING_LEVEL - 1) {
      return;
    }
    showBattleResult("\u041A\u0430\u0440\u0442\u0443 \xAB\u043F\u043E\u043B\u0443\u0447\u0438 \u0443\u0440\u043E\u0432\u0435\u043D\u044C\xBB \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043A \u0438\u0433\u0440\u043E\u043A\u0443 9 \u0443\u0440\u043E\u0432\u043D\u044F.");
    setTimeout(() => {
      hideBattleResult();
    }, 2e3);
  }
  function notifyIfKillHirelingBlockedOnSeat(draggingCardEl, targetZoneEl) {
    if (!draggingCardEl || !isPlayerPlayZoneElement(targetZoneEl)) {
      return;
    }
    if (!isTreasureSpecial(draggingCardEl.id, KILL_THE_HIRELING_SPECIAL)) {
      return;
    }
    if (someSeatHasHirelingEquipped()) {
      return;
    }
    showBattleResult(`\u041A\u0430\u0440\u0442\u0443 \xAB${KILL_THE_HIRELING_SPECIAL}\xBB \u043C\u043E\u0436\u043D\u043E \u0438\u0433\u0440\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u043A\u0430 \u0443 \u043A\u043E\u0433\u043E-\u0442\u043E \u0432 \u044D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u043A\u0435 \u0435\u0441\u0442\u044C \u043D\u0430\u0451\u043C\u043D\u0438\u0447\u0435\u043A.`);
    setTimeout(() => {
      hideBattleResult();
    }, 2e3);
  }
  function notifyIfWhineAtGMBlockedOnSeat(draggingCardEl, targetZoneEl) {
    if (!draggingCardEl || !isPlayerPlayZoneElement(targetZoneEl)) {
      return;
    }
    if (!isTreasureSpecial(draggingCardEl.id, WHINE_AT_GM_SPECIAL)) {
      return;
    }
    const seat = getGlobalSeatForPlayZone(targetZoneEl);
    if (seat === null || seat === void 0) {
      return;
    }
    if (seatCanReceiveWhineAtGM(seat)) {
      return;
    }
    showBattleResult(`\u041A\u0430\u0440\u0442\u0443 \xAB${WHINE_AT_GM_SPECIAL}\xBB \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043A \u0438\u0433\u0440\u043E\u043A\u0443 \u043D\u0430 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u043C \u0443\u0440\u043E\u0432\u043D\u0435 \u0437\u0430 \u0441\u0442\u043E\u043B\u043E\u043C.`);
    setTimeout(() => {
      hideBattleResult();
    }, 2e3);
  }
  function scheduleTreasureLevelIfNeeded(cardId, zoneEl) {
    const treasure74 = window.treasures?.find((t) => t.name === cardId);
    if (!treasure74) {
      return;
    }
    const levelGain = Number(treasure74.level);
    if (!Number.isFinite(levelGain) || levelGain <= 0) {
      return;
    }
    if (!isPlayerPlayZoneElement(zoneEl)) {
      return;
    }
    const seat = getGlobalSeatForPlayZone(zoneEl);
    if (seat === null || seat === void 0) {
      return;
    }
    const zoneId = zoneEl.id;
    setTimeout(() => {
      const card = document.getElementById(cardId);
      const zone = document.getElementById(zoneId);
      if (!card || !zone || !zone.contains(card)) {
        return;
      }
      let curLv = levelBySeat[seat];
      if (curLv == null || Number.isNaN(curLv)) {
        curLv = 1;
      }
      curLv = Math.max(1, Math.floor(Number(curLv)));
      if (curLv >= WINNING_LEVEL - 1) {
        showBattleResult("\u041A\u0430\u0440\u0442\u0443 \xAB\u043F\u043E\u043B\u0443\u0447\u0438 \u0443\u0440\u043E\u0432\u0435\u043D\u044C\xBB \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043A \u0438\u0433\u0440\u043E\u043A\u0443 9 \u0443\u0440\u043E\u0432\u043D\u044F.");
        setTimeout(() => {
          hideBattleResult();
        }, 2e3);
        if (localSeat != null && localSeat !== void 0 && !Number.isNaN(Number(localSeat))) {
          appendCardToSeatHand(cardId, Number(localSeat));
          socket_default.emit("message", {
            method: "moveCard",
            cardId,
            targetId: card.previousElementSibling ? card.previousElementSibling.id : null,
            zoneId: `hand${Number(localSeat)}`,
            fromZoneId: zoneId,
            playedBySeat: Number(localSeat)
          });
        }
        return;
      }
      const payload = {
        method: "TreasureLevel",
        seat,
        level: levelGain,
        cardId,
        actorSeat: localSeat != null && localSeat !== void 0 && !Number.isNaN(Number(localSeat)) ? Number(localSeat) : void 0
      };
      if (isTreasureSpecial(cardId, KILL_THE_HIRELING_SPECIAL)) {
        const hirelingToKill = pickHirelingCardIdToKillForLevelPlay(seat);
        if (!hirelingToKill) {
          showBattleResult(`\u041A\u0430\u0440\u0442\u0443 \xAB${KILL_THE_HIRELING_SPECIAL}\xBB \u043C\u043E\u0436\u043D\u043E \u0438\u0433\u0440\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u043A\u0430 \u0443 \u043A\u043E\u0433\u043E-\u0442\u043E \u0432 \u044D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u043A\u0435 \u0435\u0441\u0442\u044C \u043D\u0430\u0451\u043C\u043D\u0438\u0447\u0435\u043A.`);
          setTimeout(() => {
            hideBattleResult();
          }, 2e3);
          if (localSeat != null && localSeat !== void 0 && !Number.isNaN(Number(localSeat))) {
            appendCardToSeatHand(cardId, Number(localSeat));
            socket_default.emit("message", {
              method: "moveCard",
              cardId,
              targetId: card.previousElementSibling ? card.previousElementSibling.id : null,
              zoneId: `hand${Number(localSeat)}`,
              fromZoneId: zoneId,
              playedBySeat: Number(localSeat)
            });
          }
          return;
        }
        payload.killedHirelingCardId = hirelingToKill;
      }
      if (isTreasureSpecial(cardId, WHINE_AT_GM_SPECIAL) && !seatCanReceiveWhineAtGM(seat)) {
        showBattleResult(`\u041A\u0430\u0440\u0442\u0443 \xAB${WHINE_AT_GM_SPECIAL}\xBB \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043A \u0438\u0433\u0440\u043E\u043A\u0443 \u043D\u0430 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u043C \u0443\u0440\u043E\u0432\u043D\u0435 \u0437\u0430 \u0441\u0442\u043E\u043B\u043E\u043C.`);
        setTimeout(() => {
          hideBattleResult();
        }, 2e3);
        if (localSeat != null && localSeat !== void 0 && !Number.isNaN(Number(localSeat))) {
          appendCardToSeatHand(cardId, Number(localSeat));
          socket_default.emit("message", {
            method: "moveCard",
            cardId,
            targetId: card.previousElementSibling ? card.previousElementSibling.id : null,
            zoneId: `hand${Number(localSeat)}`,
            fromZoneId: zoneId,
            playedBySeat: Number(localSeat)
          });
        }
        return;
      }
      socket_default.emit("message", payload);
    }, 1e3);
  }
  function applyTreasure65LevelSwap(fromSeat, toSeat) {
    if (fromSeat === toSeat) {
      return;
    }
    let fromLevel = levelBySeat[fromSeat];
    if (fromLevel == null || Number.isNaN(fromLevel)) {
      fromLevel = 1;
    }
    let toLevel = levelBySeat[toSeat];
    if (toLevel == null || Number.isNaN(toLevel)) {
      toLevel = 1;
    }
    setLevelBySeat(fromSeat, Math.max(1, applyLevelDeltaWithWinRule(fromLevel, 1, false)));
    setLevelBySeat(toSeat, Math.max(1, toLevel - 1));
    recalculateAllPowerDisplays();
  }
  function scheduleTreasure65IfNeeded(cardId, zoneEl) {
    const treasure74 = window.treasures?.find((t) => t.name === cardId);
    if (!treasure74 || treasure74.card_name !== STEAL_LEVEL_CARD_NAME) {
      return;
    }
    if (!isPlayerPlayZoneElement(zoneEl)) {
      return;
    }
    const toSeat = getGlobalSeatForPlayZone(zoneEl);
    const fromSeat = localSeat;
    if (toSeat === null || toSeat === void 0 || fromSeat === null || fromSeat === void 0) {
      return;
    }
    if (toSeat === fromSeat) {
      return;
    }
    const zoneId = zoneEl.id;
    setTimeout(() => {
      const card = document.getElementById(cardId);
      const zone = document.getElementById(zoneId);
      if (!card || !zone || !zone.contains(card)) {
        return;
      }
      socket_default.emit("message", {
        method: "Treasure65LevelSwap",
        fromSeat,
        toSeat,
        cardId,
        card_name: treasure74.card_name
      });
    }, 1e3);
  }
  function getMonsterBattleContext() {
    const zoneCards = document.querySelectorAll(".zone_monster .card");
    let levelSum = 0;
    let hasMonster = false;
    let removerSum = 0;
    let badStaffSum = null;
    const monsters = [];
    zoneCards.forEach((el) => {
      const door96 = window.doors?.find((d) => d.name === el.id);
      if (door96 && (door96.race === "monster" || String(door96.special || "") === "Mate" && String(el.dataset?.mateSourceMonsterId || ""))) {
        const srcId = String(el.dataset?.mateSourceMonsterId || "");
        const srcDoor = srcId ? window.doors?.find((d) => d.name === srcId) : null;
        const effectiveDoor = door96.race === "monster" ? door96 : srcDoor || null;
        if (!effectiveDoor || String(effectiveDoor.race || "") !== "monster") {
          return;
        }
        hasMonster = true;
        levelSum += Number(effectiveDoor.level) || 0;
        removerSum += Number(effectiveDoor.remover) || 0;
        const monsterBadStaff = normalizeBadStaff(effectiveDoor.bad_staff);
        if (!badStaffSum && monsterBadStaff) {
          badStaffSum = monsterBadStaff;
        }
        monsters.push({
          // Важно: cardId — это именно DOM id карты в зоне (Mate должен быть отдельным монстром).
          cardId: el.id,
          remover: Number(effectiveDoor.remover) || 0,
          badStaff: monsterBadStaff,
          // Картинку Mate НЕ подменяем, чтобы на столе/в модалках он выглядел как отдельная карта.
          img: door96.img || ""
        });
      }
    });
    return { hasMonster, levelSum, removerSum, badStaffSum, monsters };
  }
  function getEffectiveMonsterRootDoorIdFromBattleZoneCardEl(el) {
    const id = String(el?.id || "").trim();
    if (!id) {
      return "";
    }
    const door96 = window.doors?.find((d) => d.name === id);
    if (!door96) {
      return "";
    }
    if (String(door96.race || "") === "monster") {
      return id;
    }
    if (String(door96.special || "").trim() === "Mate") {
      return String(el.dataset?.mateSourceMonsterId || "").trim();
    }
    return "";
  }
  function monsterBattlefieldDismissesBattleHelpers() {
    const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
    if (!zone) {
      return false;
    }
    const els = zone.querySelectorAll(".card");
    for (let i3 = 0; i3 < els.length; i3 += 1) {
      const rootId = getEffectiveMonsterRootDoorIdFromBattleZoneCardEl(els[i3]);
      if (!rootId) {
        continue;
      }
      const ab = getMonsterAbilitiesByCardId(rootId);
      if (ab && ab.dismissBattleHelpersWhileOnField) {
        return true;
      }
    }
    return false;
  }
  function monsterBattlefieldLevelOnlyCombatPower() {
    const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
    if (!zone) {
      return false;
    }
    const els = zone.querySelectorAll(".card");
    for (let i3 = 0; i3 < els.length; i3 += 1) {
      const rootId = getEffectiveMonsterRootDoorIdFromBattleZoneCardEl(els[i3]);
      if (!rootId) {
        continue;
      }
      const ab = getMonsterAbilitiesByCardId(rootId);
      if (ab && ab.combatPowerFromLevelOnly) {
        return true;
      }
    }
    return false;
  }
  function monsterBattlefieldExcludesLevelFromCombatPower() {
    const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
    if (!zone) {
      return false;
    }
    const els = zone.querySelectorAll(".card");
    for (let i3 = 0; i3 < els.length; i3 += 1) {
      const rootId = getEffectiveMonsterRootDoorIdFromBattleZoneCardEl(els[i3]);
      if (!rootId) {
        continue;
      }
      const ab = getMonsterAbilitiesByCardId(rootId);
      if (ab && ab.combatPowerExcludesLevel) {
        return true;
      }
    }
    return false;
  }
  function getMonsterBattlefieldElfCombatPenaltyPerElfSum() {
    const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
    if (!zone) {
      return 0;
    }
    let sum = 0;
    const els = zone.querySelectorAll(".card");
    for (let i3 = 0; i3 < els.length; i3 += 1) {
      const rootId = getEffectiveMonsterRootDoorIdFromBattleZoneCardEl(els[i3]);
      if (!rootId) {
        continue;
      }
      const ab = getMonsterAbilitiesByCardId(rootId);
      const p = Number(ab?.battleElfCombatPenaltyEach);
      if (Number.isFinite(p) && p > 0) {
        sum += p;
      }
    }
    return sum;
  }
  function applyDismissBattleHelpersIfMonsterOnField() {
    if (!battleActive || !getMonsterBattleContext().hasMonster) {
      return;
    }
    if (!monsterBattlefieldDismissesBattleHelpers()) {
      return;
    }
    let cleared = false;
    if (acceptedHelperSeat != null) {
      acceptedHelperSeat = null;
      cleared = true;
    }
    if (pendingHelpSeats && pendingHelpSeats.size > 0) {
      pendingHelpSeats.clear();
      cleared = true;
    }
    if (!cleared) {
      return;
    }
    hideAllAcceptHelpButtons();
    const fightSeat = getMonsterFightSeat();
    if (Number.isFinite(Number(fightSeat)) && Number(localSeat) === Number(fightSeat)) {
      socket_default.emit("message", { method: "DissolveBattleHelp", fightSeat });
    }
    scheduleTurnStateSync();
    applyTurnHighlight();
  }
  function isSeatParticipantInCurrentMonsterBattle(seat) {
    if (seat == null || seat < 0) {
      return false;
    }
    if (!getMonsterBattleContext().hasMonster) {
      return false;
    }
    if (Number(seat) === Number(getMonsterFightSeat())) {
      return true;
    }
    if (pendingHelpSeats?.has?.(Number(seat))) {
      return true;
    }
    if (acceptedHelperSeat != null && acceptedHelperSeat >= 0 && Number(seat) === Number(acceptedHelperSeat)) {
      return true;
    }
    return false;
  }
  function hasThiefTheftAvailableTarget() {
    if (localSeat == null) {
      return false;
    }
    for (let s = 0; s < (num || 0); s++) {
      if (s === localSeat) {
        continue;
      }
      if (isSeatParticipantInCurrentMonsterBattle(s)) {
        continue;
      }
      if (collectSmallStealableTreasuresFromSeat(s).length > 0) {
        return true;
      }
    }
    return false;
  }
  function getSeatEquipmentRemover(seat) {
    updateCharacterStatesFromBoard();
    return Number(characterBySeat[seat]?.remover) || 0;
  }
  function getSeatLabel(seat) {
    const s = parseInt(seat, 10);
    const metaName = Number.isNaN(s) ? "" : String(characterBySeat?.[s]?.name || "");
    if (metaName.trim()) {
      return metaName.trim();
    }
    return `\u0418\u0433\u0440\u043E\u043A ${Number(seat) + 1}`;
  }
  function seatAddressComma(seat) {
    return `${getSeatLabel(seat)},`;
  }
  function hidePlayerProfileModal2() {
    hidePlayerProfileModal();
  }
  function openPlayerProfileModal2() {
    if (localSeat == null || localSeat < 0) {
      return;
    }
    openPlayerProfileModal({
      onApply: ({ name, gender }) => {
        characterBySeat[localSeat].name = name;
        characterBySeat[localSeat].gender = gender;
        socket_default.emit("message", {
          method: "PlayerMeta",
          seat: localSeat,
          name,
          gender
        });
      }
    });
  }
  function normalizeStoredPlayerGender() {
    const { gender } = readTabProfile(getProfileStorageScopeIdFromLocation());
    return gender === "Male" || gender === "Female" ? gender : "";
  }
  function ensureLocalPlayerProfileChosen() {
    if (document.getElementById("player-profile-modal")) {
      return;
    }
    syncLocalProfileFromStorageToSeatCharacter();
    if (localSeat == null || localSeat < 0) {
      return;
    }
    const name = readTabProfile(getProfileStorageScopeIdFromLocation()).name;
    const gender = normalizeStoredPlayerGender();
    if (!name || !gender) {
      openPlayerProfileModal2();
    }
  }
  function syncLocalProfileFromStorageToSeatCharacter() {
    if (localSeat == null || localSeat < 0 || localSeat >= characterBySeat.length) {
      return;
    }
    const scopeId = getProfileStorageScopeIdFromLocation();
    const { name, gender } = readTabProfile(scopeId);
    if (!name || !gender) {
      return;
    }
    const ch = characterBySeat[localSeat];
    if (!ch) {
      return;
    }
    const same = String(ch.name || "").trim() === name && String(ch.gender || "") === gender;
    ch.name = name;
    ch.gender = gender;
    if (!same) {
      socket_default.emit("message", {
        method: "PlayerMeta",
        seat: localSeat,
        name,
        gender
      });
    }
  }
  function hideRoomLobbyBar() {
    const bar = document.getElementById("room-lobby-bar");
    if (bar) {
      bar.style.display = "none";
    }
  }
  function updateRoomLobbyBarFromServer(connectedPlayers, maxPlayers) {
    const bar = document.getElementById("room-lobby-bar");
    const cnt = document.getElementById("room-lobby-connected");
    const mx = document.getElementById("room-lobby-max");
    if (!bar || !cnt) {
      return;
    }
    if (gameStarted) {
      bar.style.display = "none";
      return;
    }
    bar.style.display = "flex";
    cnt.textContent = String(Math.max(0, Math.floor(Number(connectedPlayers) || 0)));
    if (mx) {
      mx.textContent = String(Math.max(2, Math.min(6, Math.floor(Number(maxPlayers) || 6))));
    }
  }
  function ensureDeathLootZoneElement() {
    let el = document.getElementById("death-loot-zone");
    if (el) {
      return el;
    }
    el = document.createElement("div");
    el.id = "death-loot-zone";
    el.style.display = "none";
    document.body.appendChild(el);
    return el;
  }
  function clearDeathLootUi() {
    const el = document.getElementById("death-loot-zone");
    if (el) {
      el.remove();
    }
    const modal = document.getElementById("death-loot-pick-modal");
    if (modal) {
      modal.remove();
    }
  }
  function isEquippedDoorRaceOrKindCard(cardEl, seat) {
    if (!cardEl?.id) {
      return false;
    }
    const { main } = getMainAndSideZoneElementsForSeat(seat);
    if (!main || !main.contains(cardEl)) {
      return false;
    }
    const door96 = window.doors?.find((d) => d.name === cardEl.id);
    if (!door96) {
      return false;
    }
    return !!door96.race || !!door96.kind;
  }
  function collectDeathLootCardIds(deadSeat) {
    const ids = [];
    const pushUnique = (id) => {
      if (!id || ids.indexOf(id) !== -1) {
        return;
      }
      ids.push(id);
    };
    const { main, side } = getMainAndSideZoneElementsForSeat(deadSeat);
    const handEl = getHandElementForPlayerSeat(deadSeat);
    handEl?.querySelectorAll?.(".card")?.forEach((cardEl) => {
      pushUnique(cardEl.id);
    });
    [main, side].forEach((zoneEl) => {
      zoneEl?.querySelectorAll?.(".card")?.forEach((cardEl) => {
        if (isEquippedDoorRaceOrKindCard(cardEl, deadSeat)) {
          return;
        }
        pushUnique(cardEl.id);
      });
    });
    return ids;
  }
  function computeLootersOrder(deadSeat) {
    const seats = [];
    for (let s = 0; s < (num || 0); s++) {
      if (Number(s) === Number(deadSeat)) {
        continue;
      }
      seats.push(s);
    }
    const groups = /* @__PURE__ */ new Map();
    seats.forEach((s) => {
      const lvl = Number(levelBySeat[s]) || 1;
      if (!groups.has(lvl)) {
        groups.set(lvl, []);
      }
      groups.get(lvl).push(s);
    });
    const levels = Array.from(groups.keys()).sort((a, b) => b - a);
    const out = [];
    levels.forEach((lvl) => {
      const arr = groups.get(lvl) || [];
      for (let i3 = arr.length - 1; i3 > 0; i3--) {
        const j = Math.floor(Math.random() * (i3 + 1));
        [arr[i3], arr[j]] = [arr[j], arr[i3]];
      }
      arr.forEach((s) => out.push(s));
    });
    return out;
  }
  function moveCardIdToDiscard(cardId) {
    if (!cardId) {
      return;
    }
    if (cardId.includes("door")) {
      moveBadStaffCardToDiscard(cardId);
      return;
    }
    if (cardId.includes("treasure")) {
      moveTreasureCardToDiscard(cardId);
    }
  }
  function appendCardToSeatHand(cardId, seat) {
    const card = document.getElementById(cardId);
    let hand = getHandElementForPlayerSeat(seat);
    if (!card) {
      return;
    }
    if (hand && Number(seat) !== Number(localSeat) && hand.classList.contains("myhand")) {
      if (num === 2) {
        hand = document.querySelector(".opponenthand") || hand;
      } else if (Number(num) === 3 || Number(num) === 4 || Number(num) === 5 || Number(num) === 6) {
        const bz = getSeatToBattleZoneMap();
        const mainSel = bz[String(seat)] ?? bz[seat];
        if (mainSel?.includes("zone_opponent2") && !mainSel.includes("zone_opponent3")) {
          hand = document.getElementById("opponent2hand") || hand;
        } else if (mainSel?.includes("zone_opponent3")) {
          hand = document.getElementById("opponent3hand") || hand;
        } else if (mainSel?.includes("zone_opponent_bl")) {
          hand = document.getElementById("opponent_bl_hand") || hand;
        } else if (mainSel?.includes("zone_opponent_br")) {
          hand = document.getElementById("opponent_br_hand") || hand;
        } else if (mainSel?.includes("zone_opponent")) {
          hand = document.getElementById("opponenthand") || hand;
        }
      }
    }
    if (!hand) {
      if (Number(seat) === Number(localSeat)) {
        hand = document.querySelector(".myhand");
      } else if (num === 2) {
        hand = document.querySelector(".opponenthand") || document.getElementById("opponenthand");
      } else if (Number(num) === 3 || Number(num) === 4 || Number(num) === 5 || Number(num) === 6) {
        const bz = getSeatToBattleZoneMap();
        const mainSel = bz[String(seat)] ?? bz[seat];
        if (mainSel?.includes("zone_opponent2") && !mainSel.includes("zone_opponent3")) {
          hand = document.getElementById("opponent2hand");
        } else if (mainSel?.includes("zone_opponent3")) {
          hand = document.getElementById("opponent3hand");
        } else if (mainSel?.includes("zone_opponent_bl")) {
          hand = document.getElementById("opponent_bl_hand");
        } else if (mainSel?.includes("zone_opponent_br")) {
          hand = document.getElementById("opponent_br_hand");
        } else if (mainSel?.includes("zone_opponent")) {
          hand = document.getElementById("opponenthand");
        }
      }
    }
    if (!hand) {
      return;
    }
    hand.appendChild(card);
    adjustCardWidth(".myhand");
    adjustCardWidth(".zone2");
    adjustCardWidth(".zone5");
    adjustCardHeight(".zone3");
    adjustCardHeight(".zone_monster");
    adjustCardWidth(".opponenthand");
    adjustCardWidth(".zone_opponent");
    adjustCardWidth(".zone_opponent_side");
    adjustCardWidth(".opponent2hand");
    adjustCardWidth(".zone_opponent2");
    adjustCardWidth(".zone_opponent2_side");
    adjustCardWidth(".opponent3hand");
    adjustCardWidth(".zone_opponent3");
    adjustCardWidth(".zone_opponent3_side");
    adjustCardWidth(".opponent_bl_hand");
    adjustCardWidth(".zone_opponent_bl");
    adjustCardWidth(".zone_opponent_bl_side");
    adjustCardWidth(".opponent_br_hand");
    adjustCardWidth(".zone_opponent_br");
    adjustCardWidth(".zone_opponent_br_side");
    UpdatebackImgTreasure();
    UpdatebackImgDoor();
  }
  function openDeathLootPickModal(deadSeat, looterSeat, remainingCardIds) {
    const existing = document.getElementById("death-loot-pick-modal");
    if (existing) {
      existing.remove();
    }
    const modal = document.createElement("div");
    modal.id = "death-loot-pick-modal";
    modal.className = "thief-theft-steal-modal";
    const panel = document.createElement("div");
    panel.className = "thief-theft-steal-panel";
    const title = document.createElement("div");
    title.className = "thief-theft-steal-title";
    title.textContent = `\u0413\u0440\u0430\u0431\u0451\u0436: \u0432\u044B\u0431\u0435\u0440\u0438 1 \u043A\u0430\u0440\u0442\u0443 \u0443 ${getSeatLabel(deadSeat)}`;
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "thief-theft-steal-cards";
    const pickBtn = document.createElement("button");
    pickBtn.type = "button";
    pickBtn.className = "thief-theft-steal-go";
    pickBtn.textContent = "\u0412\u0437\u044F\u0442\u044C \u043A\u0430\u0440\u0442\u0443";
    pickBtn.disabled = true;
    const selected = { cardId: null };
    cardsContainer.replaceChildren();
    if (!Array.isArray(remainingCardIds) || remainingCardIds.length === 0) {
      const empty2 = document.createElement("div");
      empty2.className = "thief-theft-steal-empty";
      empty2.textContent = "\u041D\u0435\u0442 \u043A\u0430\u0440\u0442 \u0434\u043B\u044F \u0432\u044B\u0431\u043E\u0440\u0430.";
      cardsContainer.appendChild(empty2);
    } else {
      const getFrontSrcForCardId = (cardId) => {
        const door96 = window.doors?.find((d) => d.name === cardId);
        if (door96?.img) {
          return door96.img;
        }
        const treasure74 = window.treasures?.find((t) => t.name === cardId);
        if (treasure74?.img) {
          return treasure74.img;
        }
        const cardEl = document.getElementById(cardId);
        const imgEl = cardEl?.querySelector?.(".card-item");
        return imgEl?.src || "";
      };
      remainingCardIds.forEach((cardId) => {
        const src = getFrontSrcForCardId(cardId);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "thief-theft-steal-card";
        b.dataset.cardId = cardId;
        const img = document.createElement("img");
        img.className = "thief-theft-steal-card-img";
        img.src = src;
        img.alt = cardId;
        b.appendChild(img);
        b.addEventListener("click", () => {
          cardsContainer.querySelectorAll(".thief-theft-steal-card").forEach((x) => x.classList.remove("is-selected"));
          b.classList.add("is-selected");
          selected.cardId = cardId;
          pickBtn.disabled = !selected.cardId;
        });
        cardsContainer.appendChild(b);
      });
    }
    pickBtn.addEventListener("click", () => {
      if (!selected.cardId) {
        return;
      }
      pickBtn.disabled = true;
      const myHand = document.querySelector(".myhand");
      socket_default.emit("message", {
        method: "DeathLootPick",
        deadSeat,
        looterSeat,
        cardId: selected.cardId,
        handZoneId: myHand?.id || null
      });
    });
    panel.appendChild(title);
    panel.appendChild(cardsContainer);
    panel.appendChild(pickBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
  }
  function resetEscapeStateNow() {
    escapeActive = false;
    escapeQueue = [];
    escapeQueueIndex = -1;
    escapeMonsterRemover = 0;
    escapeMonsterBadStaff = null;
    escapeMonsterQueue = [];
    escapeMonsterInitialCount = 0;
    escapeMonsterTemplateQueue = [];
    escapeCurrentMonsterCardId = null;
    escapeCurrentSeat = null;
    escapeWaitingForRoll = false;
    escapeOwnerSeat = null;
    escapeRollInProgress = false;
    escapeAttemptNumber = 0;
    escapeHalflingRetryUsedForCurrentAttempt = false;
    escapeHalflingRetryPending = null;
    escapeWizardFlightPending = null;
    clearEscapeMonsterPickSession();
    hideWizardFlightModal();
    hideEscapeMonsterPicker();
    hideEscapeHalflingRetryModal();
  }
  function removeSeatFromEscapeQueue(seat) {
    if (seat == null) {
      return;
    }
    const s = Number(seat);
    if (!Array.isArray(escapeQueue) || escapeQueue.length === 0) {
      escapeQueue = [];
      escapeQueueIndex = -1;
      return;
    }
    const removedIndex = escapeQueue.findIndex((x) => Number(x) === s);
    if (removedIndex < 0) {
      return;
    }
    escapeQueue.splice(removedIndex, 1);
    try {
      escapeInstantWallAutoSeats?.delete?.(s);
    } catch {
    }
    if (escapeQueueIndex > removedIndex) {
      escapeQueueIndex = Math.max(0, escapeQueueIndex - 1);
    }
    if (escapeQueue.length <= 0) {
      escapeQueueIndex = -1;
    }
  }
  function showEscapeTurnText(seat) {
    removeEscapeGlueWaitingBanner();
    escapeGlueWaitingKey = null;
    removeInstantWallWaitingBanners();
    removeInstantWallSoloAidWaitingBanner();
    const firstSeat = escapeQueue.length > 0 ? escapeQueue[0] : null;
    if (firstSeat !== null && Number(seat) !== Number(firstSeat)) {
      showBattleResult(`\u041F\u043E\u043C\u043E\u0449\u043D\u0438\u043A ${seatAddressComma(seat)} \u043A\u0438\u043D\u044C \u043A\u0443\u0431\u0438\u043A, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043C\u044B\u0442\u044C\u0441\u044F \u043E\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u0430.`);
      return;
    }
    showBattleResult(`\u041F\u043E\u0431\u0435\u0434\u0438\u043B \u043C\u043E\u043D\u0441\u0442\u0440, ${seatAddressComma(seat)} \u043A\u0438\u043D\u044C \u043A\u0443\u0431\u0438\u043A, \u0447\u0442\u043E\u0431\u044B \u0441\u043C\u044B\u0442\u044C\u0441\u044F \u043E\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u0430.`);
  }
  function hideEscapeHalflingRetryModal() {
    const existing = document.getElementById("escape-halfling-retry-modal");
    if (existing) {
      existing.remove();
    }
  }
  function getLocalPlayerAllCardsForHalflingDiscard() {
    const cards = [];
    const cardIds = /* @__PURE__ */ new Set();
    const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
    const protectedEquippedHalflingIds = /* @__PURE__ */ new Set();
    if (main) {
      main.querySelectorAll(".card").forEach((cardEl) => {
        const doorCard = window.doors?.find((d) => d.name === cardEl.id);
        if (doorCard?.race === "Halfling") {
          protectedEquippedHalflingIds.add(cardEl.id);
        }
      });
    }
    const pushFromZone = (zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        if (!cardEl?.id || cardIds.has(cardEl.id)) {
          return;
        }
        if (zoneEl === main && protectedEquippedHalflingIds.has(cardEl.id)) {
          return;
        }
        const imgEl = cardEl.querySelector(".card-item");
        if (!imgEl?.src) {
          return;
        }
        cardIds.add(cardEl.id);
        cards.push({
          cardId: cardEl.id,
          img: imgEl.src
        });
      });
    };
    const handEl = document.querySelector(".myhand");
    pushFromZone(handEl);
    pushFromZone(side);
    pushFromZone(main);
    return cards;
  }
  function hideWizardFlightModal() {
    const existing = document.getElementById("wizard-flight-modal");
    if (existing) {
      existing.remove();
    }
  }
  function getLocalPlayerAllCardsForWizardFlightDiscard() {
    const cards = [];
    const cardIds = /* @__PURE__ */ new Set();
    const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
    const protectedEquippedWizardIds = /* @__PURE__ */ new Set();
    if (main) {
      main.querySelectorAll(".card").forEach((cardEl) => {
        const doorCard = window.doors?.find((d) => d.name === cardEl.id);
        if (doorCard?.kind === "Wizard") {
          protectedEquippedWizardIds.add(cardEl.id);
        }
      });
    }
    const pushFromZone = (zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        if (!cardEl?.id || cardIds.has(cardEl.id)) {
          return;
        }
        if (zoneEl === main && protectedEquippedWizardIds.has(cardEl.id)) {
          return;
        }
        const imgEl = cardEl.querySelector(".card-item");
        if (!imgEl?.src) {
          return;
        }
        cardIds.add(cardEl.id);
        cards.push({
          cardId: cardEl.id,
          img: imgEl.src
        });
      });
    };
    const handEl = document.querySelector(".myhand");
    pushFromZone(handEl);
    pushFromZone(side);
    pushFromZone(main);
    return cards;
  }
  function moveCardToDiscardById(cardId) {
    if (!cardId) {
      return;
    }
    if (cardId.includes("door")) {
      const door96 = window.doors?.find((d) => d.name === cardId);
      const cardEl = document.getElementById(cardId);
      const isMonsterLike = Boolean(
        door96?.race === "monster" || door96 && String(door96.special || "") === "Mate" && String(cardEl?.dataset?.mateSourceMonsterId || "")
      );
      if (isMonsterLike) {
        const monsterZoneEl = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
        const pairId = String(cardEl?.dataset?.matePairId || "");
        let remainingId = "";
        if (pairId && monsterZoneEl) {
          monsterZoneEl.querySelectorAll(".card").forEach((zEl) => {
            if (zEl?.id && zEl.id !== cardId && String(zEl.dataset?.matePairId || "") === pairId) {
              remainingId = zEl.id;
            }
          });
        }
        (monsterZoneEl ? monsterZoneEl.querySelectorAll(".card") : []).forEach((el) => {
          const bonusId = el?.id;
          if (!bonusId) {
            return;
          }
          const bonusDoor = window.doors?.find((d) => d.name === bonusId);
          if (!bonusDoor || String(bonusDoor.special || "") !== "bonus_power_monster") {
            return;
          }
          if (String(el.dataset?.attachedMonsterId || "") === String(cardId)) {
            if (remainingId) {
              el.dataset.attachedMonsterId = remainingId;
            } else {
              el.dataset.attachedMonsterId = "";
              moveBadStaffCardToDiscard(bonusId);
            }
          }
        });
        pushMonsterBonusAttachmentsToServer();
      }
      moveBadStaffCardToDiscard(cardId);
      return;
    }
    if (cardId.includes("treasure")) {
      moveTreasureCardToDiscard(cardId);
    }
  }
  function applyWizardFlightDiscardAndResolve(seat, cardIds) {
    const parsedSeat = parseInt(seat, 10);
    if (Number.isNaN(parsedSeat) || parsedSeat < 0) {
      return;
    }
    const ids = Array.isArray(cardIds) ? cardIds.filter(Boolean).slice(0, WIZARD_FLIGHT_MAX_DISCARD) : [];
    ids.forEach((id) => {
      if (!document.getElementById(id)) {
        return;
      }
      moveCardToDiscardById(id);
    });
    recalculateAllPowerDisplays();
    if (Number(localSeat) !== Number(escapeOwnerSeat)) {
      return;
    }
    if (!escapeFailAidPending || Number(escapeFailAidPending.seat) !== Number(parsedSeat) || !escapeFailAidPending.payload) {
      return;
    }
    const pending = { ...escapeFailAidPending.payload };
    escapeFailAidPending = null;
    const bonus = Math.min(WIZARD_FLIGHT_MAX_DISCARD, ids.length);
    const totalRoll = (Number(pending.totalRoll) || 0) + bonus;
    const escaped = totalRoll >= ESCAPE_TARGET_ROLL;
    const payload = {
      ...pending,
      totalRoll,
      escaped,
      badStaffPenalty: escaped ? null : normalizeBadStaff(pending.badStaffPenalty)
    };
    updateWizardFlightUi();
    emitEscapeRollResultAndAdvance(payload);
  }
  function applyWizardTaming(seat, handCardIds, monsterCardId) {
    const s = parseInt(seat, 10);
    if (Number.isNaN(s) || s < 0) {
      return;
    }
    const handIds = Array.isArray(handCardIds) ? handCardIds.filter(Boolean) : [];
    if (handIds.length < 3) {
      return;
    }
    handIds.forEach((id) => {
      if (document.getElementById(id)) {
        moveCardToDiscardById(id);
      }
    });
    const { monsters } = getMonsterBattleContext();
    if (monsters.length <= 1) {
      MoveMonstersToDrop();
      battleActive = false;
      battleTurnSeat = null;
      pendingHelpSeats.clear();
      acceptedHelperSeat = null;
      monsterFightSeat = null;
      turnAwaitingManualEnd = true;
      clearInterval(countdownInterval);
      const timerElement = document.getElementById("timer");
      if (timerElement) {
        timerElement.textContent = "";
      }
      showBattleResult("\u041C\u043E\u043D\u0441\u0442\u0440 \u0443\u0441\u043C\u0438\u0440\u0435\u043D.");
      setTimeout(hideBattleResult, 1800);
    } else if (monsterCardId) {
      moveCardToDiscardById(monsterCardId);
      setMonsterBasePower(computeMonsterZoneBasePower());
      showBattleResult("\u041C\u043E\u043D\u0441\u0442\u0440 \u0443\u0441\u043C\u0438\u0440\u0435\u043D.");
      setTimeout(hideBattleResult, 3e3);
    }
    hideWizardTamingModal();
    hideWizardTamingPickModal();
    recalculateAllPowerDisplays();
    updateHelpUi();
    applyTurnHighlight();
    updateTurnActionButtons(false);
  }
  function getRoomSeatCountForGluePrompts() {
    const n = Number(num);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
    const len = Array.isArray(characterBySeat) ? characterBySeat.length : 0;
    if (len > 0) {
      return len;
    }
    const qLen = Array.isArray(escapeQueue) ? escapeQueue.length : 0;
    return qLen > 0 ? qLen : 1;
  }
  function startEscapeGluePromptFromOwner({ escapedSeat, monsterCardId, viaInstantWall, finishAfter, wallFleeSeats }) {
    if (Number(localSeat) !== Number(escapeOwnerSeat) || !escapeActive) {
      return false;
    }
    const es = Number(escapedSeat);
    if (!Number.isFinite(es)) {
      return false;
    }
    const viaWall = Boolean(viaInstantWall);
    let mon = String(monsterCardId || "").trim();
    if (!mon) {
      mon = String(escapeCurrentMonsterCardId || escapeMonsterTemplateQueue?.[0]?.cardId || "").trim();
    }
    if (!mon && viaWall) {
      mon = "__instant_wall__";
    }
    if (!mon) {
      return false;
    }
    const wallFleeArr = (Array.isArray(wallFleeSeats) ? wallFleeSeats : []).map((x) => Number(x)).filter((x) => Number.isFinite(x));
    const wallFleeUnique = Array.from(new Set(wallFleeArr.length ? wallFleeArr : [es]));
    const wallFleeSet = new Set(wallFleeUnique);
    const key = `${Date.now()}-${wallFleeUnique.join("-")}-${mon}`;
    const pending = /* @__PURE__ */ new Set();
    const maxSeat = getRoomSeatCountForGluePrompts();
    for (let s = 0; s < maxSeat; s += 1) {
      if (!wallFleeSet.has(Number(s))) {
        pending.add(Number(s));
      }
    }
    escapeGluePromptState = {
      key,
      escapedSeat: es,
      wallFleeSeats: wallFleeUnique,
      monsterCardId: mon,
      pending,
      resolved: false,
      viaInstantWall: viaWall,
      finishAfter: Boolean(finishAfter)
    };
    socket_default.emit("message", {
      method: "EscapeGluePrompt",
      key,
      escapedSeat: es,
      monsterCardId: mon,
      viaInstantWall: viaWall,
      wallFleeSeats: wallFleeUnique
    });
    return true;
  }
  function triggerDeathAfterFailedEscape(deadSeat, escapeQueueOwnerSeat = null) {
    const dead = Number(deadSeat);
    const ownerSeat = escapeQueueOwnerSeat != null && Number.isFinite(Number(escapeQueueOwnerSeat)) ? Number(escapeQueueOwnerSeat) : escapeOwnerSeat;
    if (!Number.isFinite(dead) || dead < 0 || ownerSeat == null || Number(localSeat) !== Number(ownerSeat)) {
      return;
    }
    removeSeatFromEscapeQueue(dead);
    let nextOwner = ownerSeat;
    if (Number(dead) === Number(ownerSeat) && Array.isArray(escapeQueue) && escapeQueue.length > 0) {
      nextOwner = escapeQueue[0];
      escapeOwnerSeat = nextOwner;
      socket_default.emit("message", {
        method: "EscapeOwnerTransfer",
        ownerSeat: nextOwner
      });
      escapeQueueIndex = 0;
    }
    const lootCardIds = collectDeathLootCardIds(dead);
    const lootersOrder = computeLootersOrder(dead);
    resumeEscapeAfterLoot = Array.isArray(escapeQueue) && escapeQueue.length > 0;
    deathLootAwaitingEscapeFinish = resumeEscapeAfterLoot;
    socket_default.emit("message", {
      method: "DeathStart",
      deadSeat: dead,
      ownerSeat: nextOwner,
      lootCardIds,
      lootersOrder,
      text: "\u0421\u043C\u0435\u0440\u0442\u044C!"
    });
    if (!resumeEscapeAfterLoot) {
      finishEscapeSequenceAndBroadcast();
    }
  }
  function emitEscapeRollResultAndAdvance(payload) {
    if (Number(localSeat) !== Number(escapeOwnerSeat)) {
      return;
    }
    socket_default.emit("message", payload);
    if (payload?.escaped) {
      const monId = String(payload.monsterCardId || "").trim();
      if (monId) {
        const ab = getMonsterAbilitiesByCardId(monId);
        const loss = Number(ab?.loseLevelOnEscape) || 0;
        if (loss > 0) {
          const adjSeat = escapeRollPenaltySeatFromPayload(payload);
          if (Number.isFinite(adjSeat)) {
            socket_default.emit("message", { method: "LevelAdjust", seat: adjSeat, delta: -loss });
          }
        }
        const minLvForSuccessPenalty = Number(ab?.loseLevelsOnEscapeSuccessMinPlayerLevel);
        const lossOnSuccess = Number(ab?.loseLevelsOnEscapeSuccessAmount) || 0;
        if (Number.isFinite(minLvForSuccessPenalty) && lossOnSuccess > 0) {
          const adjSeat2 = escapeRollPenaltySeatFromPayload(payload);
          if (Number.isFinite(adjSeat2)) {
            const curLv = Math.max(1, Number(levelBySeat[adjSeat2]) || 1);
            if (curLv >= minLvForSuccessPenalty) {
              socket_default.emit("message", { method: "LevelAdjust", seat: adjSeat2, delta: -lossOnSuccess });
            }
          }
        }
      }
    }
    const bad = normalizeBadStaff(payload?.badStaffPenalty);
    if (!payload?.escaped && bad && String(bad.type || "") === "death") {
      const deadSeat = escapeCurrentSeat != null && !Number.isNaN(Number(escapeCurrentSeat)) ? Number(escapeCurrentSeat) : escapeRollPenaltySeatFromPayload(payload);
      const monIdDeath = String(payload.monsterCardId || escapeCurrentMonsterCardId || "").trim();
      const abDeath = getMonsterAbilitiesByCardId(monIdDeath);
      if (abDeath?.deathBadStaffWizardDiscardsClassOnly && Number.isFinite(deadSeat) && deadSeat >= 0) {
        updateCharacterStatesFromBoard();
        if (isSeatWizardClassActive(deadSeat)) {
          const wizId = findWizardClassDoorIdEquippedForSeat(deadSeat);
          if (wizId) {
            syncDoorCardMoveToDiscard(wizId);
            setTimeout(() => {
              runNextEscapeAttemptAndBroadcast();
            }, 1200);
            return;
          }
        }
      }
      triggerDeathAfterFailedEscape(deadSeat);
      return;
    }
    const badPenalty = normalizeBadStaff(payload?.badStaffPenalty);
    if (!payload?.escaped && badPenalty?.type === "lose_hand_or_lose_levels") {
      return;
    }
    if (!payload?.escaped && badPenalty?.type === "escape_dice_death_or_levels") {
      return;
    }
    if (payload?.escaped) {
      const escapedSeat = escapeRollPenaltySeatFromPayload(payload);
      const viaInstantWall = Boolean(payload.viaInstantWall);
      const monInput = String(payload.monsterCardId || "").trim();
      if (!Number.isFinite(escapedSeat)) {
        setTimeout(() => {
          runNextEscapeAttemptAndBroadcast();
        }, 1200);
        return;
      }
      if (!startEscapeGluePromptFromOwner({
        escapedSeat,
        monsterCardId: monInput,
        viaInstantWall,
        finishAfter: false,
        wallFleeSeats: [escapedSeat]
      })) {
        setTimeout(() => {
          runNextEscapeAttemptAndBroadcast();
        }, 1200);
      }
      return;
    }
    setTimeout(() => {
      runNextEscapeAttemptAndBroadcast();
    }, 1200);
  }
  function hideWarriorFrenzyModal() {
    const existing = document.getElementById("warrior-frenzy-modal");
    if (existing) {
      existing.remove();
    }
  }
  function hideClericExorcismModal() {
    const existing = document.getElementById("cleric-exorcism-modal");
    if (existing) {
      existing.remove();
    }
  }
  function getLocalPlayerAllCardsForWarriorFrenzyDiscard() {
    const cards = [];
    const cardIds = /* @__PURE__ */ new Set();
    const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
    const protectedEquippedWarriorIds = /* @__PURE__ */ new Set();
    if (main) {
      main.querySelectorAll(".card").forEach((cardEl) => {
        const doorCard = window.doors?.find((d) => d.name === cardEl.id);
        if (doorCard?.kind === "Warrior") {
          protectedEquippedWarriorIds.add(cardEl.id);
        }
      });
    }
    const pushFromZone = (zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        if (!cardEl?.id || cardIds.has(cardEl.id)) {
          return;
        }
        if (zoneEl === main && protectedEquippedWarriorIds.has(cardEl.id)) {
          return;
        }
        const imgEl = cardEl.querySelector(".card-item");
        if (!imgEl?.src) {
          return;
        }
        cardIds.add(cardEl.id);
        cards.push({
          cardId: cardEl.id,
          img: imgEl.src
        });
      });
    };
    const handEl = document.querySelector(".myhand");
    pushFromZone(handEl);
    pushFromZone(side);
    pushFromZone(main);
    return cards;
  }
  function isSeatWarriorClassActive(seat) {
    if (seat == null || seat < 0) {
      return false;
    }
    updateCharacterStatesFromBoard();
    return seatHasKind(seat, "Warrior");
  }
  function isSeatClericClassActive(seat) {
    if (seat == null || seat < 0) {
      return false;
    }
    updateCharacterStatesFromBoard();
    return seatHasKind(seat, "Cleric");
  }
  function isSeatThiefClassActive(seat) {
    if (seat == null || seat < 0) {
      return false;
    }
    updateCharacterStatesFromBoard();
    return seatHasKind(seat, "Thief");
  }
  function isSeatWizardClassActive(seat) {
    if (seat == null || seat < 0) {
      return false;
    }
    updateCharacterStatesFromBoard();
    return seatHasKind(seat, "Wizard");
  }
  function getValidThiefTrimVictims() {
    if (localSeat == null || localSeat < 0 || !battleActive) {
      return [];
    }
    const iAmFighter = Number(localSeat) === Number(getMonsterFightSeat()) || acceptedHelperSeat != null && Number(localSeat) === Number(acceptedHelperSeat);
    if (iAmFighter) {
      return [];
    }
    const inFight = [];
    const fightSeat = getMonsterFightSeat();
    if (fightSeat != null && fightSeat >= 0) {
      inFight.push(fightSeat);
    }
    if (acceptedHelperSeat != null && acceptedHelperSeat >= 0 && inFight.indexOf(acceptedHelperSeat) === -1) {
      inFight.push(acceptedHelperSeat);
    }
    return inFight.filter((s) => !victimThiefTrimUsedBySeat[s]);
  }
  function hasUndeadMonsterInCurrentBattle() {
    const zoneCards = document.querySelectorAll(".zone_monster .card");
    return Array.from(zoneCards).some((el) => {
      const door96 = window.doors?.find((d) => d.name === el.id);
      return door96?.race === "monster" && door96?.special === "Undead";
    });
  }
  function canLocalUseWarriorFrenzyNow() {
    if (localSeat == null || localSeat < 0) {
      return false;
    }
    if (!battleActive || escapeActive) {
      return false;
    }
    if (!getMonsterBattleContext().hasMonster) {
      return false;
    }
    const isParticipant = Number(localSeat) === Number(getMonsterFightSeat()) || acceptedHelperSeat !== null && Number(localSeat) === Number(acceptedHelperSeat);
    if (!isParticipant) {
      return false;
    }
    if (!isSeatWarriorClassActive(localSeat)) {
      return false;
    }
    return 3 - (warriorFrenzyUsedBySeat[localSeat] || 0) > 0;
  }
  function canLocalUseClericExorcismNow() {
    if (localSeat == null || localSeat < 0) {
      return false;
    }
    if (!battleActive || escapeActive) {
      return false;
    }
    const isParticipant = Number(localSeat) === Number(getMonsterFightSeat()) || acceptedHelperSeat !== null && Number(localSeat) === Number(acceptedHelperSeat);
    if (!isParticipant) {
      return false;
    }
    if (!hasUndeadMonsterInCurrentBattle()) {
      return false;
    }
    if (!isSeatClericClassActive(localSeat)) {
      return false;
    }
    return 3 - (clericExorcismUsedBySeat[localSeat] || 0) > 0;
  }
  function canLocalUseThiefTrimNow() {
    if (localSeat == null || localSeat < 0) {
      return false;
    }
    if (!battleActive || escapeActive) {
      return false;
    }
    if (!getMonsterBattleContext().hasMonster) {
      return false;
    }
    if (!isSeatThiefClassActive(localSeat)) {
      return false;
    }
    const targets = getValidThiefTrimVictims();
    if (!targets.length) {
      return false;
    }
    return true;
  }
  function positionWarriorFrenzyButton(btn) {
    if (!btn) {
      return;
    }
    btn.style.position = "";
    btn.style.left = "";
    btn.style.top = "";
    btn.style.transform = "";
    btn.style.zIndex = "";
  }
  function updateWarriorFrenzyUi() {
    const btn = document.getElementById("warrior-frenzy-btn");
    if (!btn) {
      return;
    }
    if (localSeat == null || localSeat < 0 || !isSeatWarriorClassActive(localSeat)) {
      btn.style.display = "none";
      btn.style.opacity = "";
      btn.style.cursor = "";
      hideWarriorFrenzyModal();
      return;
    }
    btn.style.display = "flex";
    positionWarriorFrenzyButton(btn);
    const canUse = canLocalUseWarriorFrenzyNow();
    if (canUse) {
      btn.style.opacity = "1";
      btn.style.cursor = "";
    } else {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
      hideWarriorFrenzyModal();
    }
  }
  function updateClericExorcismUi() {
    const btn = document.getElementById("cleric-exorcism-btn");
    if (!btn) {
      return;
    }
    if (localSeat == null || localSeat < 0 || !isSeatClericClassActive(localSeat)) {
      btn.style.display = "none";
      btn.style.opacity = "";
      btn.style.cursor = "";
      hideClericExorcismModal();
      return;
    }
    btn.style.display = "flex";
    positionWarriorFrenzyButton(btn);
    const canUse = canLocalUseClericExorcismNow();
    if (canUse) {
      btn.style.opacity = "1";
      btn.style.cursor = "";
    } else {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
      hideClericExorcismModal();
    }
  }
  function updateThiefTrimUi() {
    const btn = document.getElementById("thief-trim-btn");
    if (!btn) {
      return;
    }
    if (localSeat == null || localSeat < 0 || !isSeatThiefClassActive(localSeat)) {
      btn.style.display = "none";
      btn.style.opacity = "";
      btn.style.cursor = "";
      hideThiefTrimModal();
      return;
    }
    btn.style.display = "flex";
    positionWarriorFrenzyButton(btn);
    const canUse = canLocalUseThiefTrimNow();
    if (canUse) {
      btn.style.opacity = "1";
      btn.style.cursor = "";
    } else {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
      hideThiefTrimModal();
    }
  }
  function canLocalUseWizardFlightNow() {
    if (localSeat == null || localSeat < 0) {
      return false;
    }
    if (!isSeatWizardClassActive(localSeat)) {
      return false;
    }
    if (!escapeActive || !escapeWizardFlightPending) {
      return false;
    }
    if (Number(escapeWizardFlightPending.seat) !== Number(localSeat)) {
      return false;
    }
    const cards = getLocalPlayerAllCardsForWizardFlightDiscard();
    return cards.length > 0;
  }
  function updateWizardFlightUi() {
    if (!canLocalUseWizardFlightNow()) {
      hideWizardFlightModal();
    }
  }
  function hideThiefTrimModal() {
    const existing = document.getElementById("thief-trim-modal");
    if (existing) {
      existing.remove();
    }
  }
  function hideThiefTheftStealModal() {
    const existing = document.getElementById("thief-theft-steal-modal");
    if (existing) {
      existing.remove();
    }
  }
  function hideThiefTheftModal() {
    const existing = document.getElementById("thief-theft-modal");
    if (existing) {
      existing.remove();
    }
  }
  function clearThiefTheftBoardDicePrompt() {
    thiefTheftBoardDicePending = false;
    thiefTheftBoardDiceInProgress = false;
  }
  function thiefTheftStartAwaitBoardDice() {
    hideThiefTheftModal();
    thiefTheftBoardDicePending = true;
    showBattleResult(`${seatAddressComma(localSeat)} \u0431\u0440\u043E\u0441\u044C \u043A\u0443\u0431\u0438\u043A`);
  }
  function canLocalUseThiefTheftNow() {
    if (localSeat == null || localSeat < 0) {
      return false;
    }
    if (!isSeatThiefClassActive(localSeat)) {
      return false;
    }
    if (escapeActive) {
      return false;
    }
    if (isSeatParticipantInCurrentMonsterBattle(localSeat)) {
      return false;
    }
    if (!hasThiefTheftAvailableTarget()) {
      return false;
    }
    if (thiefTheftBoardDicePending || thiefTheftBoardDiceInProgress) {
      return false;
    }
    if (!num || num < 2) {
      return false;
    }
    return true;
  }
  function updateThiefTheftUi() {
    const btn = document.getElementById("thief-theft-btn");
    if (!btn) {
      return;
    }
    if (localSeat == null || localSeat < 0 || !isSeatThiefClassActive(localSeat)) {
      btn.style.display = "none";
      btn.style.opacity = "";
      btn.style.cursor = "";
      hideThiefTheftModal();
      hideThiefTheftStealModal();
      clearThiefTheftBoardDicePrompt();
      return;
    }
    btn.style.display = "flex";
    positionWarriorFrenzyButton(btn);
    const canUse = canLocalUseThiefTheftNow();
    if (canUse) {
      btn.style.opacity = "1";
      btn.style.cursor = "";
    } else {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
      hideThiefTheftModal();
      hideThiefTheftStealModal();
      if (thiefTheftBoardDicePending && (escapeActive || isSeatParticipantInCurrentMonsterBattle(localSeat) || !isSeatThiefClassActive(localSeat))) {
        clearThiefTheftBoardDicePrompt();
      }
    }
  }
  function getLocalPlayerAllCardsForThiefTheftDiscard() {
    return getLocalPlayerAllCardsForThiefTrimDiscard();
  }
  function applyThiefTheftStartDiscard(seat, cardId) {
    const parsed = parseInt(seat, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return;
    }
    if (!cardId) {
      return;
    }
    if (!document.getElementById(cardId)) {
      return;
    }
    moveCardToDiscardById(cardId);
    recalculateAllPowerDisplays();
    if (Number(localSeat) === Number(parsed)) {
      thiefTheftStartAwaitBoardDice();
    } else {
      showBattleResult(`${getSeatLabel(parsed)} \u043F\u044B\u0442\u0430\u0435\u0442\u0441\u044F \u0441\u043E\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u043A\u0440\u0430\u0436\u0443`);
    }
  }
  function hasAnyStealableSmallFromOthers() {
    return hasThiefTheftAvailableTarget();
  }
  function applyThiefTheftRollResult(seat, value2) {
    const s = parseInt(seat, 10);
    if (Number.isNaN(s) || s < 0) {
      return;
    }
    const v = parseInt(value2, 10);
    if (Number.isNaN(v) || v < 1 || v > 6) {
      return;
    }
    const diceBox = document.querySelector(".dice-container");
    if (diceBox) {
      diceBox.innerHTML = "";
      diceBox.appendChild(createDice(v));
    }
    clearThiefTheftBoardDicePrompt();
    if (v < THIEF_THEFT_SUCCESS_ROLL) {
      const cur = levelBySeat[s] ?? 1;
      setLevelBySeat(s, Math.max(1, cur - 1));
    }
    recalculateAllPowerDisplays();
    if (v < THIEF_THEFT_SUCCESS_ROLL) {
      showBattleResult("\u041A\u0440\u0430\u0436\u0430 \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C!");
      setTimeout(hideBattleResult, 3e3);
    } else {
      showBattleResult("\u041A\u0440\u0430\u0436\u0430 \u0443\u0434\u0430\u043B\u0430\u0441\u044C!");
      setTimeout(hideBattleResult, 3e3);
    }
    if (v >= THIEF_THEFT_SUCCESS_ROLL && Number(localSeat) === s) {
      setTimeout(() => {
        if (hasAnyStealableSmallFromOthers()) {
          openThiefTheftStealModal();
        }
      }, 500);
    }
    updateThiefTheftUi();
  }
  function applyThiefTheftStolenCardMove(thiefSeat, fromSeat, cardId) {
    const t = parseInt(thiefSeat, 10);
    const f = parseInt(fromSeat, 10);
    if (Number.isNaN(t) || Number.isNaN(f) || !cardId) {
      return;
    }
    if (isTreasureSpecial(String(cardId), "Hireling")) {
      return;
    }
    const tr = window.treasures?.find((x) => x.name === cardId);
    if (tr && !isTreasureSmallShmot(tr)) {
      return;
    }
    const card = document.getElementById(cardId);
    if (!card) {
      return;
    }
    const thiefHand = getHandElementForPlayerSeat(t);
    if (thiefHand?.contains(card)) {
      return;
    }
    const { main, side } = getMainAndSideZoneElementsForSeat(f);
    const fromOk = main && main.contains(card) || side && side.contains(card);
    if (!fromOk) {
      const parent = card.parentElement;
      if (!parent || !isPlayerPlayZoneElement(parent)) {
        return;
      }
    }
    const hId = String(card.dataset?.hirelingCardId || "");
    if (hId) {
      clearHirelingAttachment(hId, cardId);
    }
    appendCardToSeatHand(cardId, t);
    adjustCardWidth(".myhand");
    adjustCardWidth(".zone2");
    adjustCardWidth(".zone5");
    adjustCardHeight(".zone3");
    adjustCardWidth(".opponenthand");
    adjustCardWidth(".zone_opponent");
    adjustCardWidth(".zone_opponent_side");
    adjustCardWidth(".opponent2hand");
    adjustCardWidth(".zone_opponent2");
    adjustCardWidth(".zone_opponent2_side");
    adjustCardWidth(".opponent3hand");
    adjustCardWidth(".zone_opponent3");
    adjustCardWidth(".zone_opponent3_side");
    adjustCardWidth(".opponent_bl_hand");
    adjustCardWidth(".zone_opponent_bl");
    adjustCardWidth(".zone_opponent_bl_side");
    adjustCardWidth(".opponent_br_hand");
    adjustCardWidth(".zone_opponent_br");
    adjustCardWidth(".zone_opponent_br_side");
    UpdatebackImgTreasure();
    UpdatebackImgDoor();
    recalculateAllPowerDisplays();
  }
  function openThiefTheftStealModal() {
    if (localSeat == null) {
      return;
    }
    if (!isSeatThiefClassActive(localSeat)) {
      return;
    }
    if (!hasAnyStealableSmallFromOthers()) {
      return;
    }
    const existing = document.getElementById("thief-theft-steal-modal");
    if (existing) {
      existing.remove();
    }
    const modal = document.createElement("div");
    modal.id = "thief-theft-steal-modal";
    modal.className = "thief-theft-steal-modal";
    const panel = document.createElement("div");
    panel.className = "thief-theft-steal-panel";
    const title = document.createElement("div");
    title.className = "thief-theft-steal-title";
    title.textContent = "\u041A\u043E\u0433\u043E \u0433\u0440\u0430\u0431\u0438\u043C?";
    let chosenVictim = null;
    const victimRow = document.createElement("div");
    victimRow.className = "thief-theft-steal-victims";
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "thief-theft-steal-cards";
    const goBtn = document.createElement("button");
    goBtn.type = "button";
    goBtn.className = "thief-theft-steal-go";
    goBtn.textContent = "\u0412\u0437\u044F\u0442\u044C \u0448\u043C\u043E\u0442\u043A\u0443";
    goBtn.disabled = true;
    const selected = { victim: null, cardId: null };
    const renderCardsFor = (vSeat) => {
      cardsContainer.replaceChildren();
      const items = collectSmallStealableTreasuresFromSeat(vSeat);
      if (!items.length) {
        const e = document.createElement("div");
        e.className = "thief-theft-steal-empty";
        e.textContent = "\u041D\u0435\u0442 \u043C\u0435\u043B\u043A\u0438\u0445 \u0448\u043C\u043E\u0442";
        cardsContainer.appendChild(e);
        return;
      }
      items.forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "thief-theft-steal-card";
        b.dataset.cardId = c.cardId;
        const img = document.createElement("img");
        img.className = "thief-theft-steal-card-img";
        img.src = c.img;
        img.alt = c.cardId;
        b.appendChild(img);
        b.addEventListener("click", () => {
          cardsContainer.querySelectorAll(".thief-theft-steal-card").forEach((x) => x.classList.remove("is-selected"));
          b.classList.add("is-selected");
          selected.victim = vSeat;
          selected.cardId = c.cardId;
          goBtn.disabled = !selected.cardId;
        });
        cardsContainer.appendChild(b);
      });
    };
    for (let s = 0; s < (num || 0); s++) {
      if (s === localSeat) {
        continue;
      }
      if (isSeatParticipantInCurrentMonsterBattle(s)) {
        continue;
      }
      if (collectSmallStealableTreasuresFromSeat(s).length === 0) {
        continue;
      }
      const vb = document.createElement("button");
      vb.type = "button";
      vb.className = "thief-theft-steal-victim-btn";
      vb.textContent = getSeatLabel(s);
      vb.addEventListener("click", () => {
        victimRow.querySelectorAll(".thief-theft-steal-victim-btn").forEach((x) => x.classList.remove("is-selected"));
        vb.classList.add("is-selected");
        chosenVictim = s;
        renderCardsFor(s);
      });
      victimRow.appendChild(vb);
    }
    if (victimRow.children.length === 1) {
      victimRow.querySelector("button")?.click();
    }
    goBtn.addEventListener("click", () => {
      if (selected.victim == null || !selected.cardId) {
        return;
      }
      socket_default.emit("message", {
        method: "ThiefTheftTake",
        thiefSeat: localSeat,
        fromSeat: selected.victim,
        cardId: selected.cardId
      });
      modal.remove();
    });
    panel.appendChild(title);
    panel.appendChild(victimRow);
    panel.appendChild(cardsContainer);
    panel.appendChild(goBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function openThiefTheftModal() {
    if (thiefTheftBoardDicePending) {
      showBattleResult("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043A\u043B\u0438\u043A\u043D\u0438 \u043F\u043E \u043A\u0443\u0431\u0438\u043A\u0443 \u043D\u0430 \u043F\u043E\u043B\u0435.");
      setTimeout(hideBattleResult, 3e3);
      return;
    }
    if (!canLocalUseThiefTheftNow()) {
      return;
    }
    hideThiefTheftModal();
    hideThiefTheftStealModal();
    const cards = getLocalPlayerAllCardsForThiefTheftDiscard();
    const modal = document.createElement("div");
    modal.id = "thief-theft-modal";
    modal.className = "thief-theft-modal";
    const panel = document.createElement("div");
    panel.id = "thief-theft-panel";
    panel.className = "thief-theft-panel";
    const t = document.createElement("div");
    t.className = "thief-theft-title";
    t.textContent = "\u041A\u0440\u0430\u0436\u0430";
    const desc = document.createElement("div");
    desc.className = "thief-theft-ability-text";
    desc.textContent = "\u0421\u0431\u0440\u043E\u0441\u044C 1 \u043A\u0430\u0440\u0442\u0443, \u0437\u0430\u0442\u0435\u043C \u043A\u043B\u0438\u043A\u043D\u0438 \u043F\u043E \u043A\u0443\u0431\u0438\u043A\u0443. 4+ \u2014 \u0443\u0434\u0430\u0447\u0430, 1\u20133 \u2014 \u0443\u0440\u043E\u0432\u0435\u043D\u044C. \u041D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E, \u0435\u0441\u043B\u0438 \u0442\u044B \u0432 \u0431\u043E\u044E \u0441 \u043C\u043E\u043D\u0441\u0442\u0440\u043E\u043C \u0438\u043B\u0438 \u043D\u0435\u0442 \u0441\u043E\u043F\u0435\u0440\u043D\u0438\u043A\u0430 \u0432\u043D\u0435 \u0431\u043E\u044F \u0441 \u043C\u0435\u043B\u043A\u043E\u0439 \u044D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0439 \u0448\u043C\u043E\u0442\u043A\u043E\u0439.";
    const dynamic = document.createElement("div");
    dynamic.id = "thief-theft-dynamic";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "thief-theft-cards";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "thief-theft-apply";
    applyBtn.textContent = "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043A\u0430\u0440\u0442\u0443";
    applyBtn.disabled = true;
    const selected = /* @__PURE__ */ new Set();
    if (!cards.length) {
      const e = document.createElement("div");
      e.className = "thief-theft-empty";
      e.textContent = "\u041D\u0435\u0442 \u043A\u0430\u0440\u0442 \u043D\u0430 \u0441\u0431\u0440\u043E\u0441";
      cardsWrap.appendChild(e);
    } else {
      cards.forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "thief-theft-card";
        b.dataset.cardId = c.cardId;
        const im = document.createElement("img");
        im.className = "thief-theft-card-img";
        im.src = c.img;
        im.alt = c.cardId;
        b.appendChild(im);
        b.addEventListener("click", () => {
          cardsWrap.querySelectorAll(".thief-theft-card").forEach((x) => x.classList.remove("is-selected"));
          selected.clear();
          selected.add(c.cardId);
          b.classList.add("is-selected");
          applyBtn.disabled = selected.size !== 1;
        });
        cardsWrap.appendChild(b);
      });
    }
    applyBtn.addEventListener("click", () => {
      if (selected.size !== 1) {
        return;
      }
      const [cardId] = Array.from(selected);
      applyBtn.disabled = true;
      socket_default.emit("message", {
        method: "ThiefTheftStart",
        seat: localSeat,
        cardId
      });
    });
    dynamic.appendChild(cardsWrap);
    dynamic.appendChild(applyBtn);
    panel.appendChild(t);
    panel.appendChild(desc);
    panel.appendChild(dynamic);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideThiefTheftModal();
      }
    });
  }
  function openWizardFlightModal() {
    if (!canLocalUseWizardFlightNow()) {
      return;
    }
    hideWizardFlightModal();
    const pending = escapeWizardFlightPending;
    if (!pending) {
      return;
    }
    const cards = getLocalPlayerAllCardsForWizardFlightDiscard();
    const maxPick = Math.min(WIZARD_FLIGHT_MAX_DISCARD, cards.length);
    const needNow = Math.max(0, ESCAPE_TARGET_ROLL - (Number(pending.totalRoll) || 0));
    const modal = document.createElement("div");
    modal.id = "wizard-flight-modal";
    modal.className = "wizard-flight-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-flight-panel";
    const title = document.createElement("div");
    title.className = "wizard-flight-title";
    title.textContent = "\u0417\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435 \u041F\u043E\u043B\u0451\u0442\u0430";
    const desc = document.createElement("div");
    desc.className = "wizard-flight-desc";
    desc.textContent = "\u0421\u0431\u0440\u043E\u0441\u044C \u0434\u043E 3 \u043A\u0430\u0440\u0442: \u043A\u0430\u0436\u0434\u0430\u044F \u0434\u0430\u0441\u0442 +1 \u043A \u0441\u043C\u044B\u0432\u043A\u0435. \u042D\u043A\u0438\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0443\u044E \u043A\u0430\u0440\u0442\u0443 \u0432\u043E\u043B\u0448\u0435\u0431\u043D\u0438\u043A\u0430 \u0441\u0431\u0440\u0430\u0441\u044B\u0432\u0430\u0442\u044C \u043D\u0435\u043B\u044C\u0437\u044F.";
    const counter = document.createElement("div");
    counter.className = "wizard-flight-counter";
    const updateCounterText = (selectedCount) => {
      const leftNeed = Math.max(0, needNow - selectedCount);
      const leftCanDiscard = Math.max(0, maxPick - selectedCount);
      counter.textContent = `\u0414\u043E \u0443\u0441\u043F\u0435\u0445\u0430 \u0441\u043C\u044B\u0432\u043A\u0438 \u043D\u0443\u0436\u043D\u043E: +${leftNeed}. \u0415\u0449\u0451 \u043C\u043E\u0436\u043D\u043E \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043A\u0430\u0440\u0442: ${leftCanDiscard}.`;
    };
    updateCounterText(0);
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-flight-cards";
    const selected = /* @__PURE__ */ new Set();
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-flight-apply-btn";
    applyBtn.textContent = "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C +0 \u043A \u0441\u043C\u044B\u0432\u043A\u0435";
    applyBtn.disabled = true;
    if (!cards.length) {
      const empty2 = document.createElement("div");
      empty2.className = "wizard-flight-empty";
      empty2.textContent = "\u041D\u0435\u0442 \u043A\u0430\u0440\u0442 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430";
      cardsWrap.appendChild(empty2);
    } else {
      cards.forEach((card) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wizard-flight-card";
        btn.dataset.cardId = card.cardId;
        const img = document.createElement("img");
        img.src = card.img;
        img.alt = card.cardId;
        img.className = "wizard-flight-card-img";
        btn.appendChild(img);
        btn.addEventListener("click", () => {
          const id = card.cardId;
          if (selected.has(id)) {
            selected.delete(id);
            btn.classList.remove("is-selected");
          } else {
            if (selected.size >= maxPick) {
              return;
            }
            selected.add(id);
            btn.classList.add("is-selected");
          }
          const n = selected.size;
          applyBtn.disabled = n <= 0;
          applyBtn.textContent = `\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C +${n} \u043A \u0441\u043C\u044B\u0432\u043A\u0435`;
          updateCounterText(n);
        });
        cardsWrap.appendChild(btn);
      });
    }
    const skipBtn = document.createElement("button");
    skipBtn.type = "button";
    skipBtn.className = "wizard-flight-skip-btn";
    skipBtn.textContent = "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0437\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435";
    skipBtn.addEventListener("click", () => {
      hideWizardFlightModal();
      escapeWizardFlightPending = null;
      updateWizardFlightUi();
      socket_default.emit("message", { method: "EscapeFailAidSkip", seat: localSeat });
    });
    applyBtn.addEventListener("click", () => {
      if (!escapeWizardFlightPending || selected.size <= 0) {
        return;
      }
      const cardIds = Array.from(selected).slice(0, WIZARD_FLIGHT_MAX_DISCARD);
      if (!cardIds.length) {
        return;
      }
      socket_default.emit("message", {
        method: "WizardFlightApply",
        seat: localSeat,
        cardIds
      });
      hideWizardFlightModal();
    });
    panel.appendChild(title);
    panel.appendChild(desc);
    panel.appendChild(counter);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    panel.appendChild(skipBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        skipBtn.click();
      }
    });
  }
  function hideWizardTamingModal() {
    const existing = document.getElementById("wizard-taming-modal");
    if (existing) {
      existing.remove();
    }
  }
  function hideWizardTamingPickModal() {
    const existing = document.getElementById("wizard-taming-pick-modal");
    if (existing) {
      existing.remove();
    }
  }
  function getLocalHandCardsForWizardTaming() {
    const cards = [];
    const handEl = document.querySelector(".myhand");
    if (!handEl) {
      return cards;
    }
    handEl.querySelectorAll(".card").forEach((cardEl) => {
      if (!cardEl?.id) {
        return;
      }
      const imgEl = cardEl.querySelector(".card-item");
      if (!imgEl?.src) {
        return;
      }
      cards.push({
        cardId: cardEl.id,
        img: imgEl.src
      });
    });
    return cards;
  }
  function canLocalUseWizardTamingNow() {
    if (localSeat == null || localSeat < 0) {
      return false;
    }
    if (!battleActive || escapeActive) {
      return false;
    }
    if (!getMonsterBattleContext().hasMonster) {
      return false;
    }
    if (!isSeatWizardClassActive(localSeat)) {
      return false;
    }
    const isParticipant = Number(localSeat) === Number(getMonsterFightSeat()) || acceptedHelperSeat != null && Number(localSeat) === Number(acceptedHelperSeat);
    if (!isParticipant) {
      return false;
    }
    return getLocalHandCardsForWizardTaming().length >= 3;
  }
  function updateWizardTamingUi() {
    const btn = document.getElementById("wizard-taming-btn");
    if (!btn) {
      return;
    }
    if (localSeat == null || localSeat < 0 || !isSeatWizardClassActive(localSeat)) {
      btn.style.display = "none";
      btn.style.opacity = "";
      btn.style.cursor = "";
      hideWizardTamingModal();
      hideWizardTamingPickModal();
      return;
    }
    btn.style.display = "flex";
    positionWarriorFrenzyButton(btn);
    const canUse = canLocalUseWizardTamingNow();
    if (canUse) {
      btn.style.opacity = "1";
      btn.style.cursor = "";
    } else {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
      hideWizardTamingModal();
      hideWizardTamingPickModal();
    }
  }
  function openWizardTamingPickMonsterModal(handCardIds, monsters) {
    hideWizardTamingPickModal();
    const modal = document.createElement("div");
    modal.id = "wizard-taming-pick-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0434\u043B\u044F \u0443\u0441\u043C\u0438\u0440\u0435\u043D\u0438\u044F";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-pick-cards";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = "\u0423\u0441\u043C\u0438\u0440\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043C\u043E\u043D\u0441\u0442\u0440\u0430";
    applyBtn.disabled = true;
    let selectedMonster = null;
    monsters.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.cardId = m.cardId;
      const img = document.createElement("img");
      img.className = "wizard-taming-pick-card-img";
      img.src = m.img || "";
      img.alt = m.cardId;
      btn.appendChild(img);
      const bonusSum = getAttachedMonsterBonusPowerSum(m.cardId);
      const sumEl = document.createElement("div");
      sumEl.className = "wizard-taming-pick-sum";
      sumEl.textContent = bonusSum ? `\u0411\u043E\u043D\u0443\u0441: ${bonusSum > 0 ? `+${bonusSum}` : String(bonusSum)}` : "\u0411\u043E\u043D\u0443\u0441: 0";
      sumEl.style.marginTop = "4px";
      sumEl.style.fontSize = "16px";
      sumEl.style.color = "#ffd37a";
      sumEl.style.textAlign = "center";
      btn.appendChild(sumEl);
      const attachedBonuses = getAttachedMonsterBonusCards(m.cardId);
      if (attachedBonuses.length > 0) {
        const bonusesWrap = document.createElement("div");
        bonusesWrap.className = "wizard-taming-pick-bonuses";
        bonusesWrap.style.display = "flex";
        bonusesWrap.style.flexWrap = "wrap";
        bonusesWrap.style.justifyContent = "center";
        bonusesWrap.style.gap = "6px";
        bonusesWrap.style.marginTop = "6px";
        attachedBonuses.forEach((bc) => {
          const bi = document.createElement("img");
          bi.className = "wizard-taming-pick-bonus-img";
          bi.src = bc.img || "";
          bi.alt = bc.cardId;
          bi.style.width = "40px";
          bi.style.height = "auto";
          bi.style.borderRadius = "6px";
          bonusesWrap.appendChild(bi);
        });
        btn.appendChild(bonusesWrap);
      }
      btn.addEventListener("click", () => {
        cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selectedMonster = m.cardId;
        applyBtn.disabled = !selectedMonster;
      });
      cardsWrap.appendChild(btn);
    });
    applyBtn.addEventListener("click", () => {
      if (!selectedMonster) {
        return;
      }
      socket_default.emit("message", {
        method: "WizardTamingApply",
        seat: localSeat,
        handCardIds,
        monsterCardId: selectedMonster
      });
      modal.remove();
    });
    panel.appendChild(title);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function openWizardTamingModal() {
    if (!canLocalUseWizardTamingNow()) {
      return;
    }
    hideWizardTamingModal();
    hideWizardTamingPickModal();
    const handCards = getLocalHandCardsForWizardTaming();
    const modal = document.createElement("div");
    modal.id = "wizard-taming-modal";
    modal.className = "wizard-taming-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-title";
    title.textContent = "\u0417\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435 \u0423\u0441\u043C\u0438\u0440\u0435\u043D\u0438\u044F";
    const desc = document.createElement("div");
    desc.className = "wizard-taming-desc";
    desc.textContent = "\u0421\u0431\u0440\u043E\u0441\u044C \u0432\u0441\u044E \u0440\u0443\u043A\u0443 (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 3 \u043A\u0430\u0440\u0442\u044B), \u0447\u0442\u043E\u0431\u044B \u0443\u0441\u043C\u0438\u0440\u0438\u0442\u044C \u043C\u043E\u043D\u0441\u0442\u0440\u0430: \u0431\u0435\u0437 \u0443\u0440\u043E\u0432\u043D\u044F, \u043D\u043E \u0431\u043E\u0439 \u0441 \u043D\u0438\u043C \u043F\u0440\u0435\u043A\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F.";
    const counter = document.createElement("div");
    counter.className = "wizard-taming-counter";
    counter.textContent = `\u041A\u0430\u0440\u0442 \u0432 \u0440\u0443\u043A\u0435: ${handCards.length}. \u041D\u0443\u0436\u043D\u043E \u043C\u0438\u043D\u0438\u043C\u0443\u043C 3.`;
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-hand-cards";
    handCards.forEach((c) => {
      const card = document.createElement("div");
      card.className = "wizard-taming-hand-card";
      const img = document.createElement("img");
      img.className = "wizard-taming-hand-card-img";
      img.src = c.img;
      img.alt = c.cardId;
      card.appendChild(img);
      cardsWrap.appendChild(card);
    });
    if (!handCards.length) {
      const empty2 = document.createElement("div");
      empty2.className = "wizard-taming-empty";
      empty2.textContent = "\u041D\u0435\u0442 \u043A\u0430\u0440\u0442 \u0432 \u0440\u0443\u043A\u0435";
      cardsWrap.appendChild(empty2);
    }
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-apply-btn";
    applyBtn.textContent = "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u0437\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435";
    applyBtn.disabled = handCards.length < 3;
    applyBtn.addEventListener("click", () => {
      const monsters = getMonsterBattleContext().monsters;
      const handCardIds = handCards.map((x) => x.cardId);
      if (!handCardIds.length || handCardIds.length < 3) {
        return;
      }
      if (monsters.length <= 1) {
        socket_default.emit("message", {
          method: "WizardTamingApply",
          seat: localSeat,
          handCardIds,
          monsterCardId: ""
        });
      } else {
        openWizardTamingPickMonsterModal(handCardIds, monsters);
      }
      hideWizardTamingModal();
    });
    panel.appendChild(title);
    panel.appendChild(desc);
    panel.appendChild(counter);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideWizardTamingModal();
      }
    });
  }
  function getLocalPlayerAllCardsForThiefTrimDiscard() {
    const cards = [];
    const cardIds = /* @__PURE__ */ new Set();
    const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
    const protectedEquippedThiefIds = /* @__PURE__ */ new Set();
    if (main) {
      main.querySelectorAll(".card").forEach((cardEl) => {
        const doorCard = window.doors?.find((d) => d.name === cardEl.id);
        if (doorCard?.kind === "Thief") {
          protectedEquippedThiefIds.add(cardEl.id);
        }
      });
    }
    const pushFromZone = (zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        if (!cardEl?.id || cardIds.has(cardEl.id)) {
          return;
        }
        if (zoneEl === main && protectedEquippedThiefIds.has(cardEl.id)) {
          return;
        }
        const imgEl = cardEl.querySelector(".card-item");
        if (!imgEl?.src) {
          return;
        }
        cardIds.add(cardEl.id);
        cards.push({
          cardId: cardEl.id,
          img: imgEl.src
        });
      });
    };
    const handEl = document.querySelector(".myhand");
    pushFromZone(handEl);
    pushFromZone(side);
    pushFromZone(main);
    return cards;
  }
  function isValidThiefTrimVictimSeat(seat) {
    if (seat == null || seat < 0) {
      return false;
    }
    if (seat === getMonsterFightSeat()) {
      return true;
    }
    if (acceptedHelperSeat != null && seat === acceptedHelperSeat) {
      return true;
    }
    return false;
  }
  function applyThiefTrimDiscardAndDebuff(thiefSeat, assignments) {
    const parsedThief = parseInt(thiefSeat, 10);
    const maxSeat = Math.max(0, effectiveSeatLayoutPlayerCount() - 1);
    if (Number.isNaN(parsedThief) || parsedThief < 0 || parsedThief > maxSeat) {
      return;
    }
    if (!Array.isArray(assignments) || !assignments.length) {
      return;
    }
    const list = [];
    assignments.forEach((row) => {
      const v = parseInt(row?.victimSeat, 10);
      const c = row?.cardId;
      if (Number.isNaN(v) || v < 0 || v > maxSeat || !c) {
        return;
      }
      if (v === parsedThief) {
        return;
      }
      if (!isValidThiefTrimVictimSeat(v)) {
        return;
      }
      if (victimThiefTrimUsedBySeat[v]) {
        return;
      }
      if (list.some((e) => e.victimSeat === v)) {
        return;
      }
      if (list.some((e) => e.cardId === c)) {
        return;
      }
      list.push({ victimSeat: v, cardId: c });
    });
    if (!list.length) {
      return;
    }
    list.forEach(({ victimSeat, cardId }) => {
      if (!document.getElementById(cardId)) {
        return;
      }
      moveCardToDiscardById(cardId);
      victimThiefTrimUsedBySeat[victimSeat] = 1;
      thiefBackstabDebuffBySeat[victimSeat] = (thiefBackstabDebuffBySeat[victimSeat] || 0) + 2;
    });
    recalculateAllPowerDisplays();
  }
  function openThiefTrimModal() {
    if (!canLocalUseThiefTrimNow()) {
      return;
    }
    hideThiefTrimModal();
    const victims = getValidThiefTrimVictims();
    if (!victims.length) {
      return;
    }
    const cards = getLocalPlayerAllCardsForThiefTrimDiscard();
    const maxTargets = Math.min(victims.length, 2);
    const modal = document.createElement("div");
    modal.id = "thief-trim-modal";
    modal.className = "thief-trim-modal";
    const panel = document.createElement("div");
    panel.className = "thief-trim-panel";
    const title = document.createElement("div");
    title.className = "thief-trim-title";
    title.textContent = "\u041F\u043E\u0434\u0440\u0435\u0437\u043A\u0430";
    const counter = document.createElement("div");
    counter.className = "thief-trim-counter";
    counter.textContent = "\u041E\u0434\u043D\u0430 \u043A\u0430\u0440\u0442\u0430 = \u22122 \u0441\u0438\u043B\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u0432 \u0431\u043E\u044E \u0441\u043E\u043F\u0435\u0440\u043D\u0438\u043A\u0430 (\u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043D\u0430 \u0436\u0435\u0440\u0442\u0432\u0443 \u0437\u0430 \u0431\u043E\u0439)";
    const hint = document.createElement("div");
    hint.className = "thief-trim-hint";
    hint.textContent = `\u041C\u043E\u0436\u043D\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0434\u043E ${maxTargets} \u043A\u0430\u0440\u0442(\u044B).`;
    const applyBtn = document.createElement("button");
    applyBtn.className = "thief-trim-apply-btn";
    applyBtn.disabled = true;
    applyBtn.textContent = "\u041F\u043E\u0434\u0440\u0435\u0437\u0430\u0442\u044C: 0 \u043A\u0430\u0440\u0442(\u044B) = \u22122 \u0437\u0430 \u043A\u0430\u0436\u0434\u0443\u044E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u0443\u044E \u043A\u0430\u0440\u0442\u0443";
    const selected = /* @__PURE__ */ new Set();
    const refreshApply = () => {
      const n = selected.size;
      applyBtn.disabled = n <= 0;
      applyBtn.textContent = `\u041F\u043E\u0434\u0440\u0435\u0437\u0430\u0442\u044C: ${n} \u043A\u0430\u0440\u0442(\u044B) = \u22122 \u0437\u0430 \u043A\u0430\u0436\u0434\u0443\u044E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u0443\u044E \u043A\u0430\u0440\u0442\u0443`;
    };
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "thief-trim-cards";
    if (!cards.length) {
      const empty2 = document.createElement("div");
      empty2.className = "thief-trim-empty";
      empty2.textContent = "\u041D\u0435\u0442 \u043A\u0430\u0440\u0442 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430";
      cardsWrap.appendChild(empty2);
    } else {
      cards.forEach((card) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "thief-trim-card";
        btn.dataset.cardId = card.cardId;
        const img = document.createElement("img");
        img.src = card.img;
        img.alt = card.cardId;
        img.className = "thief-trim-card-img";
        btn.appendChild(img);
        btn.addEventListener("click", () => {
          const cardId = card.cardId;
          if (!cardId) {
            return;
          }
          if (selected.has(cardId)) {
            selected.delete(cardId);
            btn.classList.remove("is-selected");
          } else {
            if (selected.size >= maxTargets) {
              return;
            }
            selected.add(cardId);
            btn.classList.add("is-selected");
          }
          refreshApply();
        });
        cardsWrap.appendChild(btn);
      });
    }
    applyBtn.addEventListener("click", () => {
      if (selected.size <= 0) {
        return;
      }
      const cardIds = Array.from(selected);
      const assignments = cardIds.map((cardId, i3) => ({
        victimSeat: victims[i3],
        cardId
      }));
      socket_default.emit("message", {
        method: "ThiefTrimApply",
        seat: localSeat,
        assignments
      });
      hideThiefTrimModal();
    });
    panel.appendChild(title);
    panel.appendChild(counter);
    panel.appendChild(hint);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideThiefTrimModal();
      }
    });
    refreshApply();
  }
  function applyWarriorFrenzyDiscardAndBonus(seat, cardIds) {
    const parsedSeat = parseInt(seat, 10);
    if (Number.isNaN(parsedSeat) || parsedSeat < 0 || parsedSeat >= warriorFrenzyUsedBySeat.length) {
      return;
    }
    if (!isSeatWarriorClassActive(parsedSeat)) {
      return;
    }
    const alreadyUsed = warriorFrenzyUsedBySeat[parsedSeat] || 0;
    const remaining = Math.max(0, 3 - alreadyUsed);
    if (remaining <= 0) {
      return;
    }
    const sourceIds = Array.isArray(cardIds) ? cardIds.filter(Boolean) : [];
    const uniqueIds = [];
    sourceIds.forEach((id) => {
      if (uniqueIds.indexOf(id) === -1) {
        uniqueIds.push(id);
      }
    });
    const acceptedIds = uniqueIds.slice(0, remaining).filter((id) => !!document.getElementById(id));
    if (!acceptedIds.length) {
      return;
    }
    acceptedIds.forEach((cardId) => moveCardToDiscardById(cardId));
    const gain = acceptedIds.length;
    warriorFrenzyUsedBySeat[parsedSeat] = alreadyUsed + gain;
    warriorFrenzyBonusBySeat[parsedSeat] = (warriorFrenzyBonusBySeat[parsedSeat] || 0) + gain;
    recalculateAllPowerDisplays();
  }
  function getLocalPlayerAllCardsForClericExorcismDiscard() {
    const cards = [];
    const cardIds = /* @__PURE__ */ new Set();
    const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
    const protectedEquippedClericIds = /* @__PURE__ */ new Set();
    if (main) {
      main.querySelectorAll(".card").forEach((cardEl) => {
        const doorCard = window.doors?.find((d) => d.name === cardEl.id);
        if (doorCard?.kind === "Cleric") {
          protectedEquippedClericIds.add(cardEl.id);
        }
      });
    }
    const pushFromZone = (zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        if (!cardEl?.id || cardIds.has(cardEl.id)) {
          return;
        }
        if (zoneEl === main && protectedEquippedClericIds.has(cardEl.id)) {
          return;
        }
        const imgEl = cardEl.querySelector(".card-item");
        if (!imgEl?.src) {
          return;
        }
        cardIds.add(cardEl.id);
        cards.push({
          cardId: cardEl.id,
          img: imgEl.src
        });
      });
    };
    const handEl = document.querySelector(".myhand");
    pushFromZone(handEl);
    pushFromZone(side);
    pushFromZone(main);
    return cards;
  }
  function applyClericExorcismDiscardAndBonus(seat, cardIds) {
    const parsedSeat = parseInt(seat, 10);
    if (Number.isNaN(parsedSeat) || parsedSeat < 0 || parsedSeat >= clericExorcismUsedBySeat.length) {
      return;
    }
    if (!isSeatClericClassActive(parsedSeat)) {
      return;
    }
    const alreadyUsed = clericExorcismUsedBySeat[parsedSeat] || 0;
    const remaining = Math.max(0, 3 - alreadyUsed);
    if (remaining <= 0) {
      return;
    }
    const sourceIds = Array.isArray(cardIds) ? cardIds.filter(Boolean) : [];
    const uniqueIds = [];
    sourceIds.forEach((id) => {
      if (uniqueIds.indexOf(id) === -1) {
        uniqueIds.push(id);
      }
    });
    const acceptedIds = uniqueIds.slice(0, remaining).filter((id) => !!document.getElementById(id));
    if (!acceptedIds.length) {
      return;
    }
    acceptedIds.forEach((cardId) => moveCardToDiscardById(cardId));
    const gain = acceptedIds.length;
    clericExorcismUsedBySeat[parsedSeat] = alreadyUsed + gain;
    clericExorcismBonusBySeat[parsedSeat] = (clericExorcismBonusBySeat[parsedSeat] || 0) + gain;
    recalculateAllPowerDisplays();
  }
  function openClericExorcismModal() {
    if (!canLocalUseClericExorcismNow()) {
      return;
    }
    hideClericExorcismModal();
    const remaining = Math.max(0, 3 - (clericExorcismUsedBySeat[localSeat] || 0));
    const cards = getLocalPlayerAllCardsForClericExorcismDiscard();
    const modal = document.createElement("div");
    modal.id = "cleric-exorcism-modal";
    modal.className = "cleric-exorcism-modal";
    const panel = document.createElement("div");
    panel.className = "cleric-exorcism-panel";
    const title = document.createElement("div");
    title.className = "cleric-exorcism-title";
    title.textContent = "\u0418\u0437\u0433\u043D\u0430\u043D\u0438\u0435: \u0441\u0431\u0440\u043E\u0441\u044C \u0434\u043E 3 \u043A\u0430\u0440\u0442 \u0432 \u0431\u043E\u044E \u043F\u0440\u043E\u0442\u0438\u0432 \u0410\u043D\u0434\u0435\u0434\u043E\u0432, \u043A\u0430\u0436\u0434\u0430\u044F \u0434\u0430\u0435\u0442 +3 \u0411\u043E\u043D\u0443\u0441";
    const counter = document.createElement("div");
    counter.className = "cleric-exorcism-counter";
    counter.textContent = `\u041C\u043E\u0436\u043D\u043E \u0441\u043A\u0438\u043D\u0443\u0442\u044C ${remaining} \u043A\u0430\u0440\u0442`;
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "cleric-exorcism-cards";
    const applyBtn = document.createElement("button");
    applyBtn.className = "cleric-exorcism-apply-btn";
    applyBtn.disabled = true;
    applyBtn.textContent = "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0431\u043E\u043D\u0443\u0441 +0";
    const selected = /* @__PURE__ */ new Set();
    const updateApplyButton = () => {
      const y = selected.size;
      applyBtn.disabled = y <= 0;
      applyBtn.textContent = `\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0431\u043E\u043D\u0443\u0441 +${y * 3}`;
    };
    if (!cards.length) {
      const empty2 = document.createElement("div");
      empty2.className = "cleric-exorcism-empty";
      empty2.textContent = "\u041D\u0435\u0442 \u043A\u0430\u0440\u0442 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430";
      cardsWrap.appendChild(empty2);
    } else {
      cards.forEach((card) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cleric-exorcism-card";
        btn.dataset.cardId = card.cardId;
        const img = document.createElement("img");
        img.src = card.img;
        img.alt = card.cardId;
        img.className = "cleric-exorcism-card-img";
        btn.appendChild(img);
        btn.addEventListener("click", () => {
          const cardId = btn.dataset.cardId;
          if (!cardId) {
            return;
          }
          if (selected.has(cardId)) {
            selected.delete(cardId);
            btn.classList.remove("is-selected");
          } else {
            if (selected.size >= remaining) {
              return;
            }
            selected.add(cardId);
            btn.classList.add("is-selected");
          }
          updateApplyButton();
        });
        cardsWrap.appendChild(btn);
      });
    }
    applyBtn.addEventListener("click", () => {
      if (selected.size <= 0) {
        return;
      }
      socket_default.emit("message", {
        method: "ClericExorcismApply",
        seat: localSeat,
        cardIds: Array.from(selected)
      });
      hideClericExorcismModal();
    });
    panel.appendChild(title);
    panel.appendChild(counter);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        hideClericExorcismModal();
      }
    });
  }
  function openWarriorFrenzyModal() {
    if (!canLocalUseWarriorFrenzyNow()) {
      return;
    }
    hideWarriorFrenzyModal();
    const remaining = Math.max(0, 3 - (warriorFrenzyUsedBySeat[localSeat] || 0));
    const cards = getLocalPlayerAllCardsForWarriorFrenzyDiscard();
    const modal = document.createElement("div");
    modal.id = "warrior-frenzy-modal";
    modal.className = "warrior-frenzy-modal";
    const panel = document.createElement("div");
    panel.className = "warrior-frenzy-panel";
    const title = document.createElement("div");
    title.className = "warrior-frenzy-title";
    title.textContent = "\u0411\u0443\u0439\u0441\u0442\u0432\u043E: \u0441\u0431\u0440\u043E\u0441\u044C \u0434\u043E 3 \u043A\u0430\u0440\u0442 \u0432 \u0431\u043E\u044E, \u043A\u0430\u0436\u0434\u0430\u044F \u0434\u0430\u0435\u0442 +1 \u0411\u043E\u043D\u0443\u0441";
    const counter = document.createElement("div");
    counter.className = "warrior-frenzy-counter";
    counter.textContent = `\u041C\u043E\u0436\u043D\u043E \u0441\u043A\u0438\u043D\u0443\u0442\u044C ${remaining} \u043A\u0430\u0440\u0442`;
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "warrior-frenzy-cards";
    const applyBtn = document.createElement("button");
    applyBtn.className = "warrior-frenzy-apply-btn";
    applyBtn.disabled = true;
    applyBtn.textContent = "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0431\u043E\u043D\u0443\u0441 +0";
    const selected = /* @__PURE__ */ new Set();
    const updateApplyButton = () => {
      const y = selected.size;
      applyBtn.disabled = y <= 0;
      applyBtn.textContent = `\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0431\u043E\u043D\u0443\u0441 +${y}`;
    };
    if (!cards.length) {
      const empty2 = document.createElement("div");
      empty2.className = "warrior-frenzy-empty";
      empty2.textContent = "\u041D\u0435\u0442 \u043A\u0430\u0440\u0442 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430";
      cardsWrap.appendChild(empty2);
    } else {
      cards.forEach((card) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "warrior-frenzy-card";
        btn.dataset.cardId = card.cardId;
        const img = document.createElement("img");
        img.src = card.img;
        img.alt = card.cardId;
        img.className = "warrior-frenzy-card-img";
        btn.appendChild(img);
        btn.addEventListener("click", () => {
          const cardId = btn.dataset.cardId;
          if (!cardId) {
            return;
          }
          if (selected.has(cardId)) {
            selected.delete(cardId);
            btn.classList.remove("is-selected");
          } else {
            if (selected.size >= remaining) {
              return;
            }
            selected.add(cardId);
            btn.classList.add("is-selected");
          }
          updateApplyButton();
        });
        cardsWrap.appendChild(btn);
      });
    }
    applyBtn.addEventListener("click", () => {
      if (selected.size <= 0) {
        return;
      }
      socket_default.emit("message", {
        method: "WarriorFrenzyApply",
        seat: localSeat,
        cardIds: Array.from(selected)
      });
      hideWarriorFrenzyModal();
    });
    panel.appendChild(title);
    panel.appendChild(counter);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        hideWarriorFrenzyModal();
      }
    });
  }
  function hideEscapeMonsterPicker() {
    const existing = document.getElementById("escape-monster-picker");
    if (existing) {
      existing.remove();
    }
  }
  function hideEscapeAidOptionsModal(skipResumeMonsterPick) {
    const had = Boolean(document.getElementById("escape-aid-options-modal"));
    const soloClose = had && instantWallSoloAidWaitingEmitted;
    instantWallSoloAidWaitingEmitted = false;
    removeInstantWallSoloAidWaitingBanner();
    const a = document.getElementById("escape-aid-options-modal");
    if (a) {
      a.remove();
    }
    if (soloClose && typeof socket_default !== "undefined" && socket_default && typeof socket_default.emit === "function") {
      socket_default.emit("message", { method: "InstantWallSoloAidClose" });
    }
    if (!skipResumeMonsterPick) {
      maybeResumeEscapeMonsterPickAfterAidClosed();
    }
  }
  function hideEscapeFailAidModal() {
    const a = document.getElementById("escape-fail-aid-modal");
    if (a) {
      a.remove();
    }
  }
  function hideEscapeRatMonsterPickModal() {
    const m = document.getElementById("escape-rat-monster-modal");
    if (m) {
      m.remove();
    }
  }
  function removeInstantWallSoloAidWaitingBanner() {
    const el = document.getElementById(INSTANT_WALL_SOLO_AID_WAITING_ID);
    if (el) {
      el.remove();
    }
  }
  function removeInstantWallHelperWaitingBanner() {
    const el = document.getElementById(INSTANT_WALL_HELPER_WAITING_ID);
    if (el) {
      el.remove();
    }
  }
  function removeInstantWallOfferWaitingBanner() {
    const el = document.getElementById(INSTANT_WALL_OFFER_WAITING_ID);
    if (el) {
      el.remove();
    }
  }
  function removeInstantWallWaitingBanners() {
    removeInstantWallHelperWaitingBanner();
    removeInstantWallOfferWaitingBanner();
  }
  function localSeatMatchesSeat(seat) {
    if (localSeat == null || localSeat === "") {
      return false;
    }
    return Number(localSeat) === Number(seat);
  }
  function isLocalInstantWallPickModalOpen() {
    const m = document.getElementById("instant-wall-modal");
    return Boolean(m && m.isConnected);
  }
  function isEscapeAidOptionsModalOpenForLocal() {
    const m = document.getElementById("escape-aid-options-modal");
    return Boolean(m && m.isConnected);
  }
  function maybeResumeEscapeMonsterPickAfterAidClosed() {
    if (!escapeActive || !escapeMonsterPickSession || typeof escapeMonsterPickSession !== "object") {
      return;
    }
    const pickSeat = Number(escapeMonsterPickSession.seat);
    if (!localSeatMatchesSeat(pickSeat)) {
      return;
    }
    if (document.getElementById("escape-aid-options-modal") || document.getElementById("escape-rat-monster-modal")) {
      return;
    }
    if (document.getElementById("instant-wall-modal") || document.getElementById("flask-glue-modal")) {
      return;
    }
    if (shouldSuppressEscapeMonsterPickBannerForSeat(pickSeat)) {
      return;
    }
    const queueIdSet = new Set((escapeMonsterQueue || []).map((m) => String(m?.cardId || "")));
    const raw = escapeMonsterPickSession.monsters || [];
    const monstersForPicker = raw.filter((m) => queueIdSet.has(String(m?.cardId || "")));
    if (monstersForPicker.length <= 0) {
      return;
    }
    showBattleResult("\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0431\u0443\u0434\u0435\u0448\u044C \u0441\u043C\u044B\u0432\u0430\u0442\u044C\u0441\u044F.");
    showEscapeMonsterPicker(monstersForPicker, (cardId) => {
      hideEscapeMonsterPicker();
      socket_default.emit("message", {
        method: "EscapeMonsterChosen",
        seat: localSeat,
        cardId
      });
    });
  }
  function shouldSuppressEscapeMonsterPickBannerForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s)) {
      return false;
    }
    if (localSeatMatchesSeat(s) && isLocalInstantWallPickModalOpen()) {
      return true;
    }
    if (localSeatMatchesSeat(s) && isEscapeAidOptionsModalOpenForLocal()) {
      return true;
    }
    if (escapeInstantWallGate && Number.isFinite(Number(escapeInstantWallGate.helperSeat)) && Number(escapeInstantWallGate.helperSeat) === s) {
      return true;
    }
    if (escapeInstantWallGate && Number.isFinite(Number(escapeInstantWallGate.loserSeat)) && Number(escapeInstantWallGate.loserSeat) === s) {
      return true;
    }
    return false;
  }
  function showInstantWallOfferWaitingBanner(fromSeat, toSeat) {
    removeInstantWallHelperWaitingBanner();
    hideBattleResult();
    const fs = Number(fromSeat);
    const ts = Number(toSeat);
    if (!Number.isFinite(fs) || !Number.isFinite(ts)) {
      return;
    }
    const bar = document.createElement("div");
    bar.id = INSTANT_WALL_OFFER_WAITING_ID;
    bar.className = "escape-glue-waiting-banner instant-wall-waiting-banner";
    bar.setAttribute("role", "status");
    bar.textContent = `${getSeatLabel(ts)} \u0440\u0435\u0448\u0430\u0435\u0442, \u0432\u043E\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u043B\u0438 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u043E\u0439 \u0441\u0442\u0435\u043D\u043A\u043E\u0439 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u0441\u043C\u044B\u0432\u043A\u0438.`;
    document.body.appendChild(bar);
  }
  function showInstantWallHelperWaitingBanner(helperSeat) {
    removeInstantWallOfferWaitingBanner();
    hideBattleResult();
    const hs = Number(helperSeat);
    if (!Number.isFinite(hs)) {
      return;
    }
    const bar = document.createElement("div");
    bar.id = INSTANT_WALL_HELPER_WAITING_ID;
    bar.className = "escape-glue-waiting-banner instant-wall-waiting-banner";
    bar.setAttribute("role", "status");
    bar.textContent = `${getSeatLabel(hs)} \u0440\u0435\u0448\u0430\u0435\u0442, \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0442\u044C \u043B\u0438 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u0443\u044E \u0441\u0442\u0435\u043D\u043A\u0443 \u043F\u0435\u0440\u0435\u0434 \u0441\u043C\u044B\u0432\u043A\u043E\u0439.`;
    document.body.appendChild(bar);
  }
  function showInstantWallSoloAidWaitingBanner(deciderSeat) {
    removeInstantWallSoloAidWaitingBanner();
    hideBattleResult();
    const ds = Number(deciderSeat);
    if (!Number.isFinite(ds)) {
      return;
    }
    const bar = document.createElement("div");
    bar.id = INSTANT_WALL_SOLO_AID_WAITING_ID;
    bar.className = "escape-glue-waiting-banner instant-wall-waiting-banner";
    bar.setAttribute("role", "status");
    bar.textContent = `${getSeatLabel(ds)} \u0440\u0435\u0448\u0430\u0435\u0442, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043B\u0438 \u043A\u0430\u0440\u0442\u0443 \xAB\u041C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u0430\u044F \u0441\u0442\u0435\u043D\u043A\u0430\xBB.`;
    document.body.appendChild(bar);
  }
  function hideInstantWallModal() {
    const m = document.getElementById("instant-wall-modal");
    if (m) {
      m.remove();
    }
  }
  function hideLoadedDieModals() {
    const a = document.getElementById("loaded-die-confirm-modal");
    if (a) a.remove();
    const b = document.getElementById("loaded-die-pick-modal");
    if (b) b.remove();
  }
  function getLoadedDieTreasureCardIdsForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return [];
    }
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const hand = getHandElementForPlayerSeat(s);
    const { main, side } = getMainAndSideZoneElementsForSeat(s);
    [hand, main, side].forEach((zoneEl) => {
      if (!zoneEl) return;
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const cid = String(cardEl?.id || "");
        if (!cid || !cid.includes("treasure") || seen.has(cid)) return;
        if (!isTreasureSpecial(cid, "Loaded die")) return;
        seen.add(cid);
        out.push(cid);
      });
    });
    return out;
  }
  function hideFlaskOfGlueModal() {
    const m = document.getElementById("flask-glue-modal");
    if (m) {
      m.remove();
    }
  }
  function removeEscapeGlueWaitingBanner() {
    const el = document.getElementById(ESCAPE_GLUE_WAITING_BANNER_ID);
    if (el) {
      el.remove();
    }
  }
  function showEscapeGlueWaitingBanner(key, actingSeat) {
    const k = String(key || "");
    const act = Number(actingSeat);
    if (!k || !Number.isFinite(act)) {
      return;
    }
    removeEscapeGlueWaitingBanner();
    hideBattleResult();
    escapeGlueWaitingKey = k;
    const bar = document.createElement("div");
    bar.id = ESCAPE_GLUE_WAITING_BANNER_ID;
    bar.className = "escape-glue-waiting-banner";
    bar.setAttribute("role", "status");
    bar.textContent = `${getSeatLabel(act)} \u0440\u0435\u0448\u0430\u0435\u0442, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043B\u0438 \u0442\u044E\u0431\u0438\u043A \u043A\u043B\u0435\u044F.`;
    document.body.appendChild(bar);
  }
  function getFlaskOfGlueTreasureCardIdsForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return [];
    }
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const hand = getHandElementForPlayerSeat(s);
    const { main, side } = getMainAndSideZoneElementsForSeat(s);
    [hand, main, side].forEach((zoneEl) => {
      if (!zoneEl) return;
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const cid = String(cardEl?.id || "");
        if (!cid || !cid.includes("treasure") || seen.has(cid)) return;
        if (!isTreasureSpecial(cid, "Flask of glue")) return;
        seen.add(cid);
        out.push(cid);
      });
    });
    return out;
  }
  function openFlaskOfGlueConfirmModal({ promptKey, escapedSeat, monsterCardId, viaInstantWall, wallFleeSeats }) {
    const escaped = Number(escapedSeat);
    const mon = String(monsterCardId || "");
    const viaWall = Boolean(viaInstantWall);
    if (!Number.isFinite(escaped) || !mon && !viaWall) {
      return;
    }
    const wallFleeUnique = Array.from(
      new Set(
        (Array.isArray(wallFleeSeats) ? wallFleeSeats : []).map((x) => Number(x)).filter((x) => Number.isFinite(x))
      )
    );
    const wallFleeSet = new Set(wallFleeUnique.length ? wallFleeUnique : [escaped]);
    if (wallFleeSet.has(Number(localSeat))) {
      return;
    }
    const ids = getFlaskOfGlueTreasureCardIdsForSeat(localSeat);
    if (!ids.length) {
      return;
    }
    hideBattleResult();
    hideFlaskOfGlueModal();
    const glueId = ids[0];
    const tr = window.treasures?.find((t) => t.name === glueId);
    const modal = document.createElement("div");
    modal.id = "flask-glue-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    const names = Array.from(wallFleeSet).sort((a, b) => a - b).map((s) => getSeatLabel(s)).join(" \u0438 ");
    const succ = wallFleeSet.size > 1 ? `${names} \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043C\u044B\u043B\u0438\u0441\u044C.` : `${getSeatLabel(escaped)} \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043C\u044B\u043B\u0441\u044F.`;
    title.textContent = `${succ} \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0442\u044E\u0431\u0438\u043A \u043A\u043B\u0435\u044F, \u0447\u0442\u043E\u0431\u044B \u0441\u043D\u043E\u0432\u0430 \u0441\u043C\u044B\u0432\u0430\u0442\u044C\u0441\u044F${viaWall ? ". \u041F\u043E\u0441\u043B\u0435 \u0441\u0442\u0435\u043D\u043A\u0438 \u2014 \u043E\u0442 \u0432\u0441\u0435\u0445 \u043C\u043E\u043D\u0441\u0442\u0440\u043E\u0432" : ""}?`;
    const cardImg = document.createElement("img");
    cardImg.className = "wizard-taming-pick-card-img";
    cardImg.src = tr?.img || "";
    cardImg.alt = glueId;
    cardImg.style.display = "block";
    cardImg.style.margin = "0 auto";
    cardImg.style.maxWidth = "160px";
    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "wizard-taming-pick-apply-btn";
    yesBtn.textContent = "\u0414\u0430, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C";
    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "wizard-taming-pick-apply-btn";
    noBtn.textContent = "\u041D\u0435\u0442";
    const sendDecision = (used) => {
      hideFlaskOfGlueModal();
      socket_default.emit("message", {
        method: "EscapeGlueDecision",
        key: String(promptKey || ""),
        used: Boolean(used),
        actingSeat: Number(localSeat),
        targetSeat: escaped,
        monsterCardId: mon,
        viaInstantWall: viaWall,
        cardId: used ? glueId : null,
        wallFleeSeats: Array.from(wallFleeSet)
      });
    };
    yesBtn.addEventListener("click", () => sendDecision(true));
    noBtn.addEventListener("click", () => sendDecision(false));
    panel.appendChild(title);
    panel.appendChild(cardImg);
    panel.appendChild(yesBtn);
    panel.appendChild(noBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        sendDecision(false);
      }
    });
    pushOpenModalsToServerDebounced();
  }
  function promptLoadedDieAfterRoll({ seat, rawRoll, onFinalize }) {
    const s = Number(seat);
    const r = Number(rawRoll);
    if (!Number.isFinite(s) || !Number.isFinite(r) || r < 1 || r > 6) {
      onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
      return;
    }
    const ids = getLoadedDieTreasureCardIdsForSeat(s);
    if (!ids.length) {
      onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
      return;
    }
    hideLoadedDieModals();
    const dieCardId = ids[0];
    const confirm = document.createElement("div");
    confirm.id = "loaded-die-confirm-modal";
    confirm.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = `\u0412\u044B\u043F\u0430\u043B\u043E: ${r}. \u0425\u043E\u0447\u0435\u0448\u044C \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0447\u0438\u0442\u0435\u0440\u0441\u043A\u0438\u0439 \u043A\u0443\u0431\u0438\u043A \u0438 \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0434\u0440\u0443\u0433\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435?`;
    const tr = window.treasures?.find((t) => t.name === dieCardId);
    const cardImg = document.createElement("img");
    cardImg.className = "wizard-taming-pick-card-img";
    cardImg.src = tr?.img || "";
    cardImg.alt = dieCardId;
    cardImg.style.display = "block";
    cardImg.style.margin = "0 auto";
    cardImg.style.maxWidth = "160px";
    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "wizard-taming-pick-apply-btn";
    yesBtn.textContent = "\u0414\u0430, \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C";
    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "wizard-taming-pick-apply-btn";
    noBtn.textContent = "\u041D\u0435\u0442";
    const openPick = () => {
      confirm.remove();
      const pick2 = document.createElement("div");
      pick2.id = "loaded-die-pick-modal";
      pick2.className = "wizard-taming-pick-modal";
      const pPanel = document.createElement("div");
      pPanel.className = "wizard-taming-pick-panel";
      const pTitle = document.createElement("div");
      pTitle.className = "wizard-taming-pick-title";
      pTitle.textContent = "Loaded die: \u0432\u044B\u0431\u0435\u0440\u0438 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435";
      const pCards = document.createElement("div");
      pCards.className = "wizard-taming-pick-cards";
      const applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.className = "wizard-taming-pick-apply-btn";
      applyBtn.textContent = "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C";
      applyBtn.disabled = true;
      let picked = null;
      for (let v = 1; v <= 6; v += 1) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wizard-taming-pick-card";
        btn.dataset.value = String(v);
        const dieEl = createDice(v);
        dieEl.style.margin = "10px auto";
        btn.appendChild(dieEl);
        btn.addEventListener("click", () => {
          pCards.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
          btn.classList.add("is-selected");
          picked = v;
          applyBtn.disabled = false;
        });
        pCards.appendChild(btn);
      }
      applyBtn.addEventListener("click", () => {
        if (!picked) return;
        hideLoadedDieModals();
        socket_default.emit("message", { method: "LoadedDieDiscard", seat: s, cardId: dieCardId });
        const finalPicked = applyDicePenaltyForSeat(seat, picked);
        onFinalize?.(finalPicked);
        if (!thiefTheftBoardDicePending && Number(finalPicked) !== Number(rawRoll)) {
          socket_default.emit("message", { method: "RandDice", digit: Number(finalPicked) });
        }
      });
      pPanel.appendChild(pTitle);
      pPanel.appendChild(pCards);
      pPanel.appendChild(applyBtn);
      pick2.appendChild(pPanel);
      document.body.appendChild(pick2);
      pick2.addEventListener("click", (e) => {
        if (e.target === pick2) {
          hideLoadedDieModals();
          onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
        }
      });
      pushOpenModalsToServerDebounced();
    };
    yesBtn.addEventListener("click", openPick);
    noBtn.addEventListener("click", () => {
      hideLoadedDieModals();
      onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
    });
    panel.appendChild(title);
    panel.appendChild(cardImg);
    panel.appendChild(yesBtn);
    panel.appendChild(noBtn);
    confirm.appendChild(panel);
    document.body.appendChild(confirm);
    confirm.addEventListener("click", (e) => {
      if (e.target === confirm) {
        hideLoadedDieModals();
        onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
      }
    });
    pushOpenModalsToServerDebounced();
  }
  function getInstantWallCardIdsForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return [];
    }
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const hand = getHandElementForPlayerSeat(s);
    const { main, side } = getMainAndSideZoneElementsForSeat(s);
    [hand, main, side].forEach((zoneEl) => {
      if (!zoneEl) return;
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const cid = String(cardEl?.id || "");
        if (!cid || !cid.includes("treasure") || seen.has(cid)) return;
        if (!isTreasureSpecial(cid, "Instant wall")) return;
        seen.add(cid);
        out.push(cid);
      });
    });
    return out;
  }
  function openInstantWallPickModal({ title, seat, onPick, onSkip }) {
    removeInstantWallWaitingBanners();
    hideBattleResult();
    hideInstantWallModal();
    const ids = getInstantWallCardIdsForSeat(seat);
    if (!ids.length) {
      if (typeof onSkip === "function") onSkip();
      return;
    }
    const modal = document.createElement("div");
    modal.id = "instant-wall-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const titleEl = document.createElement("div");
    titleEl.className = "wizard-taming-pick-title";
    titleEl.textContent = title || "Instant wall";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-pick-cards";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C";
    applyBtn.disabled = true;
    const skipBtn = document.createElement("button");
    skipBtn.type = "button";
    skipBtn.className = "wizard-taming-pick-apply-btn";
    skipBtn.textContent = "\u041D\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0442\u044C";
    let selected = null;
    ids.forEach((cid) => {
      const tr = window.treasures?.find((t) => t.name === cid);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.cardId = cid;
      const img = document.createElement("img");
      img.className = "wizard-taming-pick-card-img";
      img.src = tr?.img || "";
      img.alt = cid;
      btn.appendChild(img);
      btn.addEventListener("click", () => {
        cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selected = cid;
        applyBtn.disabled = !selected;
      });
      cardsWrap.appendChild(btn);
    });
    applyBtn.addEventListener("click", () => {
      if (!selected) return;
      hideInstantWallModal();
      if (typeof onPick === "function") onPick(selected);
    });
    skipBtn.addEventListener("click", () => {
      hideInstantWallModal();
      if (typeof onSkip === "function") onSkip();
    });
    panel.appendChild(titleEl);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    panel.appendChild(skipBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideInstantWallModal();
        if (typeof onSkip === "function") onSkip();
      }
    });
    pushOpenModalsToServerDebounced();
  }
  function openInstantWallOfferModal({ fromSeat, toSeat }) {
    removeInstantWallWaitingBanners();
    hideBattleResult();
    hideInstantWallModal();
    const modal = document.createElement("div");
    modal.id = "instant-wall-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const titleEl = document.createElement("div");
    titleEl.className = "wizard-taming-pick-title";
    titleEl.textContent = `Instant wall: \u0432\u043E\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u0441\u0442\u0435\u043D\u043A\u043E\u0439 \u043E\u0442 \u0438\u0433\u0440\u043E\u043A\u0430 ${getSeatLabel(fromSeat)}?`;
    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "wizard-taming-pick-apply-btn";
    yesBtn.textContent = "\u0414\u0430, \u0441\u043C\u044B\u0442\u044C\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438";
    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "wizard-taming-pick-apply-btn";
    noBtn.textContent = "\u041D\u0435\u0442, \u0441\u043C\u044B\u0432\u0430\u0442\u044C\u0441\u044F \u043A\u0430\u043A \u043E\u0431\u044B\u0447\u043D\u043E";
    yesBtn.addEventListener("click", () => {
      hideInstantWallModal();
      socket_default.emit("message", { method: "InstantWallOfferDecision", fromSeat, toSeat, accept: true });
    });
    noBtn.addEventListener("click", () => {
      hideInstantWallModal();
      socket_default.emit("message", { method: "InstantWallOfferDecision", fromSeat, toSeat, accept: false });
    });
    panel.appendChild(titleEl);
    panel.appendChild(yesBtn);
    panel.appendChild(noBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    socket_default.emit("message", {
      method: "InstantWallOfferWaiting",
      fromSeat,
      toSeat
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideInstantWallModal();
        socket_default.emit("message", { method: "InstantWallOfferDecision", fromSeat, toSeat, accept: false });
      }
    });
    pushOpenModalsToServerDebounced();
  }
  function openHalflingRetryModalNow(seat) {
    hideEscapeAidOptionsModal(true);
    hideEscapeRatMonsterPickModal();
    hideEscapeFailAidModal();
    const s = parseInt(seat, 10);
    if (Number.isNaN(s)) {
      return;
    }
    hideEscapeHalflingRetryModal();
    if (localSeat !== s) {
      showBattleResult(`${getSeatLabel(s)} \u0440\u0435\u0448\u0430\u0435\u0442, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043B\u0438 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u044C \u0445\u0430\u043B\u0444\u043B\u0438\u043D\u0433\u0430...`);
      return;
    }
    const cards = getLocalPlayerAllCardsForHalflingDiscard();
    const modal = document.createElement("div");
    modal.id = "escape-halfling-retry-modal";
    modal.className = "escape-halfling-retry-modal";
    const panel = document.createElement("div");
    panel.className = "escape-halfling-retry-panel";
    const title = document.createElement("div");
    title.className = "escape-halfling-retry-title";
    title.textContent = "\u0425\u0430\u043B\u0444\u043B\u0438\u043D\u0433 \u043C\u043E\u0436\u0435\u0442 \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043A\u0430\u0440\u0442\u0443, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u043F\u044B\u0442\u0430\u0442\u044C\u0441\u044F \u0441\u043C\u044B\u0442\u044C\u0441\u044F \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u043E. \u0412\u044B\u0431\u0435\u0440\u0438 \u043A\u0430\u0440\u0442\u0443 \u0438 \u043D\u0430\u0436\u043C\u0438 \xAB\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C\xBB, \u043B\u0438\u0431\u043E \u043E\u0442\u043A\u0430\u0436\u0438\u0441\u044C \u043E\u0442 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u0438.";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "escape-halfling-retry-cards";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "escape-halfling-retry-skip-btn";
    applyBtn.textContent = "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0441\u0431\u0440\u043E\u0441";
    applyBtn.disabled = true;
    const skipBtn = document.createElement("button");
    skipBtn.type = "button";
    skipBtn.className = "escape-halfling-retry-skip-btn";
    skipBtn.textContent = "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u044C";
    let selectedCardId = "";
    const markHalflingAttemptConsumed = () => {
      escapeHalflingRetryUsedForCurrentAttempt = true;
    };
    const sendDecision = (useAbility, cardId = "") => {
      markHalflingAttemptConsumed();
      socket_default.emit("message", {
        method: "EscapeHalflingRetryDecision",
        seat: localSeat,
        useAbility,
        cardId
      });
      hideEscapeHalflingRetryModal();
    };
    if (!cards.length) {
      const empty2 = document.createElement("div");
      empty2.className = "escape-halfling-retry-empty";
      empty2.textContent = "\u041D\u0435\u0442 \u043A\u0430\u0440\u0442 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430";
      cardsWrap.appendChild(empty2);
    } else {
      cards.forEach((card) => {
        const cardBtn = document.createElement("button");
        cardBtn.type = "button";
        cardBtn.className = "escape-halfling-retry-card";
        const img = document.createElement("img");
        img.src = card.img;
        img.alt = card.cardId;
        img.className = "escape-halfling-retry-card-img";
        cardBtn.appendChild(img);
        cardBtn.addEventListener("click", () => {
          cardsWrap.querySelectorAll(".escape-halfling-retry-card").forEach((x) => x.classList.remove("is-selected"));
          cardBtn.classList.add("is-selected");
          selectedCardId = String(card.cardId || "");
          applyBtn.disabled = !selectedCardId;
        });
        cardsWrap.appendChild(cardBtn);
      });
    }
    applyBtn.addEventListener("click", () => {
      if (!selectedCardId) {
        return;
      }
      sendDecision(true, selectedCardId);
    });
    skipBtn.addEventListener("click", () => sendDecision(false));
    panel.appendChild(title);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    panel.appendChild(skipBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        sendDecision(false);
      }
    });
    pushOpenModalsToServerDebounced();
  }
  function getInvisibilityPotionTreasureCardIdsForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return [];
    }
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const hand = getHandElementForPlayerSeat(s);
    const { main, side } = getMainAndSideZoneElementsForSeat(s);
    [hand, main, side].forEach((zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const cid = String(cardEl?.id || "");
        if (!cid || !cid.includes("treasure") || seen.has(cid)) {
          return;
        }
        if (!isTreasureSpecial(cid, "Invisibility potion")) {
          return;
        }
        seen.add(cid);
        out.push(cid);
      });
    });
    return out;
  }
  function getHirelingTreasureCardIdsForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return [];
    }
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const hand = getHandElementForPlayerSeat(s);
    const { main, side } = getMainAndSideZoneElementsForSeat(s);
    [hand, main, side].forEach((zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const cid = String(cardEl?.id || "");
        if (!cid || !cid.includes("treasure") || seen.has(cid)) {
          return;
        }
        if (!isTreasureSpecial(cid, "Hireling")) {
          return;
        }
        seen.add(cid);
        out.push(cid);
      });
    });
    return out;
  }
  function getMagicLampTreasureCardIdsForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return [];
    }
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const hand = getHandElementForPlayerSeat(s);
    const { main, side } = getMainAndSideZoneElementsForSeat(s);
    [hand, main, side].forEach((zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const cid = String(cardEl?.id || "");
        if (!cid || !cid.includes("treasure") || seen.has(cid)) {
          return;
        }
        if (!isTreasureSpecial(cid, "Magic lamp")) {
          return;
        }
        seen.add(cid);
        out.push(cid);
      });
    });
    return out;
  }
  function openEscapeFailAidModal({ seat, attemptNumber }) {
    hideEscapeFailAidModal();
    const s = Number(seat);
    if (!Number.isFinite(s) || Number(localSeat) !== Number(s)) {
      return;
    }
    const monId = String(escapeFailAidPending?.payload?.monsterCardId || "");
    const isWizard = String(characterBySeat?.[s]?.kind || "") === "Wizard";
    const wizardCards = getLocalPlayerAllCardsForWizardFlightDiscard();
    const canWizard = isWizard && wizardCards.length > 0;
    const canHalfling = Number(attemptNumber) === 1 && seatHasRace(s, "Halfling") && !escapeHalflingRetryUsedForCurrentAttempt && getLocalPlayerAllCardsForHalflingDiscard().length > 0;
    const invIds = getInvisibilityPotionTreasureCardIdsForSeat(s);
    const canInvis = invIds.length > 0 && Boolean(monId);
    const invTreasure = invIds.length ? window.treasures?.find((t) => t.name === invIds[0]) : null;
    const hireIds = getHirelingTreasureCardIdsForSeat(s);
    const canHire = hireIds.length > 0 && Boolean(monId);
    const hireTreasure = hireIds.length ? window.treasures?.find((t) => t.name === hireIds[0]) : null;
    const lampIds = getMagicLampTreasureCardIdsForSeat(s);
    const canLamp = lampIds.length > 0 && Boolean(monId) && Number(currentTurnSeat) === Number(s);
    const lampTreasure = lampIds.length ? window.treasures?.find((t) => t.name === lampIds[0]) : null;
    const entries = [];
    if (canInvis) {
      entries.push({
        key: "invis",
        cardId: invIds[0],
        img: invTreasure?.img || "",
        imageOnly: true,
        imgAlt: "Invisibility potion",
        desc: "\u0421\u0431\u0440\u043E\u0441\u044C \u0437\u0435\u043B\u044C\u0435 \u043D\u0435\u0432\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u0438: \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043C\u044B\u0432\u0430\u0435\u0448\u044C\u0441\u044F \u043E\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u0430, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u043E \u043D\u0435 \u0441\u043C\u043E\u0433 \u0441\u043C\u044B\u0442\u044C\u0441\u044F. \u041A\u0430\u0440\u0442\u0430 \u0443\u0445\u043E\u0434\u0438\u0442 \u0432 \u0441\u0431\u0440\u043E\u0441."
      });
    }
    if (canHire) {
      entries.push({
        key: "hire",
        cardId: hireIds[0],
        img: hireTreasure?.img || "",
        imageOnly: true,
        imgAlt: "Hireling",
        desc: "\u0421\u0431\u0440\u043E\u0441\u044C \u043D\u0430\u0451\u043C\u043D\u0438\u0447\u043A\u0430: \u043A\u0430\u043A \u0437\u0435\u043B\u044C\u0435 \u043D\u0435\u0432\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u0438 \u2014 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043C\u044B\u0432\u0430\u0435\u0448\u044C\u0441\u044F \u043E\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u0430, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u043E \u043D\u0435 \u0441\u043C\u043E\u0433 \u0441\u043C\u044B\u0442\u044C\u0441\u044F. \u041D\u0430\u0451\u043C\u043D\u0438\u0447\u0435\u043A \u0438 \u0448\u043C\u043E\u0442\u043A\u0430, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u043E\u043D \u043D\u0451\u0441, \u0443\u0445\u043E\u0434\u044F\u0442 \u0432 \u0441\u0431\u0440\u043E\u0441."
      });
    }
    if (canLamp) {
      entries.push({
        key: "lamp",
        cardId: lampIds[0],
        img: lampTreasure?.img || "",
        imageOnly: true,
        imgAlt: "Magic lamp",
        desc: "\u041F\u0440\u043E\u0433\u043E\u043D\u044F\u0435\u0442 \u043E\u0434\u043D\u043E\u0433\u043E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043C\u043E\u043D\u0441\u0442\u0440\u0430."
      });
    }
    if (canWizard) {
      entries.push({
        key: "wizard",
        title: "\u0412\u043E\u043B\u0448\u0435\u0431\u043D\u0438\u043A: \u0417\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435 \u043F\u043E\u043B\u0435\u0442\u0430",
        desc: `\u0417\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435 \u041F\u043E\u043B\u0451\u0442\u0430: \u0441\u0431\u0440\u043E\u0441\u044C \u0434\u043E 3 \u043A\u0430\u0440\u0442 - \u043A\u0430\u0436\u0434\u0430\u044F \u0434\u0430\u0451\u0442 +1 \u043A \u0441\u043C\u044B\u0432\u043A\u0435 (\u0441\u0435\u0439\u0447\u0430\u0441 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u043A\u0430\u0440\u0442: ${wizardCards.length})`
      });
    }
    if (canHalfling) {
      entries.push({
        key: "halfling",
        title: "\u0425\u0430\u043B\u0444\u043B\u0438\u043D\u0433",
        desc: "\u0421\u0431\u0440\u043E\u0441\u044C \u043E\u0434\u043D\u0443 \u043A\u0430\u0440\u0442\u0443, \u0447\u0442\u043E\u0431\u044B \u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043A\u0443\u0431\u0438\u043A \u043D\u0430 \u0441\u043C\u044B\u0432\u043A\u0443 \u0435\u0449\u0451 \u0440\u0430\u0437."
      });
    }
    const modal = document.createElement("div");
    modal.id = "escape-fail-aid-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "\u0421\u043C\u044B\u0432\u043A\u0430 \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C: \u043F\u043E\u043C\u043E\u0449\u044C";
    const desc = document.createElement("div");
    desc.id = "escape-fail-aid-desc";
    desc.className = "wizard-taming-desc";
    desc.textContent = entries.length ? "\u0412\u044B\u0431\u0435\u0440\u0438 \u043A\u0430\u0440\u0442\u0443 \u0438\u043B\u0438 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u044C \u043D\u0438\u0436\u0435, \u0437\u0430\u0442\u0435\u043C \u043D\u0430\u0436\u043C\u0438 \xAB\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C\xBB." : "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u043A\u0430\u0440\u0442 \u0438 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u0435\u0439 \u0434\u043B\u044F \u044D\u0442\u043E\u0439 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438.";
    const wrap = document.createElement("div");
    wrap.className = "wizard-taming-pick-cards";
    let selected = null;
    const applyPick = () => {
      if (!selected) {
        return;
      }
      hideEscapeFailAidModal();
      if (selected.key === "invis") {
        const cardId = selected.cardId;
        if (!cardId || !monId) {
          return;
        }
        socket_default.emit("message", {
          method: "EscapeInvisibilityPotionApply",
          cardId,
          actingSeat: s,
          monsterCardId: monId
        });
        return;
      }
      if (selected.key === "hire") {
        const cardId = selected.cardId;
        if (!cardId || !monId) {
          return;
        }
        socket_default.emit("message", {
          method: "EscapeHirelingApply",
          cardId,
          actingSeat: s,
          monsterCardId: monId
        });
        return;
      }
      if (selected.key === "lamp") {
        const cardId = selected.cardId;
        if (!cardId || !monId) {
          return;
        }
        socket_default.emit("message", {
          method: "EscapeMagicLampBanish",
          cardId,
          actingSeat: s,
          monsterCardId: monId
        });
        return;
      }
      if (selected.key === "wizard") {
        escapeWizardFlightPending = escapeFailAidPending?.payload ? { ...escapeFailAidPending.payload } : null;
        openWizardFlightModal();
        return;
      }
      if (selected.key === "halfling") {
        openHalflingRetryModalNow(s);
      }
    };
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C";
    applyBtn.disabled = true;
    const cont = document.createElement("button");
    cont.type = "button";
    cont.className = "wizard-taming-pick-apply-btn";
    cont.textContent = "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0431\u0435\u0437 \u043F\u043E\u043C\u043E\u0449\u0438";
    cont.addEventListener("click", () => {
      hideEscapeFailAidModal();
      socket_default.emit("message", { method: "EscapeFailAidSkip", seat: localSeat });
    });
    entries.forEach((ent) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.pickKey = ent.key;
      if (ent.imageOnly && ent.img) {
        const img = document.createElement("img");
        img.className = "wizard-taming-pick-card-img";
        img.src = ent.img;
        img.alt = String(ent.imgAlt || ent.cardId || ent.key || "");
        btn.appendChild(img);
      } else {
        const label = document.createElement("div");
        label.className = "wizard-taming-pick-sum";
        label.textContent = ent.title || ent.key;
        label.style.textAlign = "center";
        label.style.fontSize = "16px";
        label.style.color = "#e6e6e6";
        label.style.padding = "10px 8px";
        label.style.lineHeight = "1.25";
        btn.appendChild(label);
      }
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selected = ent;
        desc.textContent = ent.desc || "";
        applyBtn.disabled = false;
      });
      wrap.appendChild(btn);
    });
    applyBtn.addEventListener("click", () => {
      if (applyBtn.disabled || !selected) {
        return;
      }
      applyPick();
    });
    panel.appendChild(title);
    panel.appendChild(desc);
    panel.appendChild(wrap);
    panel.appendChild(applyBtn);
    panel.appendChild(cont);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        cont.click();
      }
    });
    pushOpenModalsToServerDebounced();
  }
  function getFleeingSeatForEscapeAid() {
    if (!escapeActive) {
      return null;
    }
    if (Array.isArray(escapeQueue) && escapeQueueIndex >= 0 && escapeQueueIndex < escapeQueue.length) {
      const s = escapeQueue[escapeQueueIndex];
      if (s != null && !Number.isNaN(Number(s))) {
        return Number(s);
      }
    }
    return null;
  }
  function getMonsterRatingForRatOnStick(cardId) {
    const id = String(cardId || "");
    if (!id) {
      return null;
    }
    const el = document.getElementById(id);
    const door96 = window.doors?.find((d) => d.name === id);
    if (!door96) {
      return null;
    }
    const ratingFromDoor = (d) => {
      if (!d) {
        return null;
      }
      const p = Number(d.power);
      const l = Number(d.level);
      const pow = Number.isFinite(p) ? p : 0;
      const lvl = Number.isFinite(l) ? l : 0;
      const r = Math.max(pow, lvl);
      return r > 0 ? r : null;
    };
    if (String(door96.special || "") === "Mate") {
      const srcId = String(el?.dataset?.mateSourceMonsterId || "");
      const srcDoor = srcId ? window.doors?.find((d) => d.name === srcId) : null;
      if (!srcDoor || String(srcDoor.race || "") !== "monster") {
        return null;
      }
      return ratingFromDoor(srcDoor);
    }
    if (String(door96.race || "") !== "monster") {
      return null;
    }
    return ratingFromDoor(door96);
  }
  function getPendingEscapeMonsterIdsForRat() {
    const ids = /* @__PURE__ */ new Set();
    if (escapeCurrentMonsterCardId) {
      ids.add(String(escapeCurrentMonsterCardId));
    }
    (escapeMonsterQueue || []).forEach((m) => {
      if (m?.cardId) {
        ids.add(String(m.cardId));
      }
    });
    return ids;
  }
  function getRatOnStickEligibleMonstersForEscape() {
    const out = [];
    const monsterZone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
    getPendingEscapeMonsterIdsForRat().forEach((id) => {
      const el = document.getElementById(id);
      if (!el || !monsterZone || el.parentElement?.id !== "zone_monster") {
        return;
      }
      const rating = getMonsterRatingForRatOnStick(id);
      if (rating == null || rating < 1 || rating > 8) {
        return;
      }
      const door96 = window.doors?.find((d) => d.name === id);
      out.push({
        cardId: id,
        level: rating,
        img: door96?.img || ""
      });
    });
    return out;
  }
  function removeMonsterIdFromEscapeQueues(monsterCardId) {
    const id = String(monsterCardId || "");
    if (!id) {
      return;
    }
    const strip = (arr) => {
      if (!Array.isArray(arr)) {
        return;
      }
      for (let i3 = arr.length - 1; i3 >= 0; i3--) {
        if (String(arr[i3]?.cardId || "") === id) {
          arr.splice(i3, 1);
        }
      }
    };
    strip(escapeMonsterQueue);
    strip(escapeMonsterTemplateQueue);
  }
  function collectEscapeAidCardEntriesForSeat(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return [];
    }
    const canUseRat = getRatOnStickEligibleMonstersForEscape().length > 0;
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const hand = getHandElementForPlayerSeat(s);
    const { main, side } = getMainAndSideZoneElementsForSeat(s);
    [hand, main, side].forEach((zoneEl) => {
      if (!zoneEl) {
        return;
      }
      zoneEl.querySelectorAll(".card").forEach((cardEl) => {
        const cid = cardEl?.id;
        if (!cid || !String(cid).includes("treasure") || seen.has(cid)) {
          return;
        }
        const tr = window.treasures?.find((t) => t.name === cid);
        if (canUseRat && isTreasureSpecial(cid, "Rat on a stick")) {
          seen.add(cid);
          out.push({
            cardId: cid,
            img: tr?.img || "",
            title: tr?.card_name || "Rat on a stick",
            aidKind: "rat_on_stick",
            desc: "\u0421\u0431\u0440\u043E\u0441\u044C \u043A\u0430\u0440\u0442\u0443: \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043C\u044B\u0432\u0430\u0435\u0448\u044C\u0441\u044F \u0431\u0435\u0437 \u0431\u0440\u043E\u0441\u043A\u0430 \u043A\u0443\u0431\u0438\u043A\u0430 \u043E\u0442 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043C\u043E\u043D\u0441\u0442\u0440\u0430 8 \u0443\u0440\u043E\u0432\u043D\u044F \u0438\u043B\u0438 \u043D\u0438\u0436\u0435. \u041F\u043E\u0441\u043B\u0435 \u0430\u043A\u0442\u0438\u0432\u0430\u0446\u0438\u0438 \u043A\u0430\u0440\u0442\u0430 \u0443\u0445\u043E\u0434\u0438\u0442 \u0432 \u0441\u0431\u0440\u043E\u0441."
          });
          return;
        }
        if (isTreasureSpecial(cid, "Instant wall")) {
          seen.add(cid);
          out.push({
            cardId: cid,
            img: tr?.img || "",
            title: tr?.card_name || "Instant wall",
            aidKind: "instant_wall",
            desc: "\u0421\u0431\u0440\u043E\u0441\u044C \u043A\u0430\u0440\u0442\u0443: \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043C\u044B\u0432\u0430\u0435\u0448\u044C\u0441\u044F \u043E\u0442 \u0412\u0421\u0415\u0425 \u043C\u043E\u043D\u0441\u0442\u0440\u043E\u0432 \u0432 \u044D\u0442\u043E\u043C \u0431\u043E\u044E. \u041C\u043E\u0436\u0435\u0442 \u0441\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0434\u043B\u044F \u043E\u0434\u043D\u043E\u0433\u043E \u0438\u043B\u0438 \u0434\u0432\u0443\u0445 \u0438\u0433\u0440\u043E\u043A\u043E\u0432 (\u0432\u0442\u043E\u0440\u043E\u043C\u0443 \u0438\u0433\u0440\u043E\u043A\u0443 \u043F\u0440\u0438\u0434\u0451\u0442 \u0437\u0430\u043F\u0440\u043E\u0441 \u043F\u0440\u0438\u043D\u044F\u0442\u044C \u0441\u0442\u0435\u043D\u043A\u0443)."
          });
        }
      });
    });
    return out;
  }
  function openEscapeRatMonsterPickModal({ ratCardId, onCancel }) {
    hideEscapeRatMonsterPickModal();
    const monsters = getRatOnStickEligibleMonstersForEscape();
    if (!ratCardId || monsters.length <= 0) {
      return;
    }
    const modal = document.createElement("div");
    modal.id = "escape-rat-monster-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "\u041A\u0440\u044B\u0441\u0430 \u043D\u0430 \u043F\u0430\u043B\u043E\u0447\u043A\u0435: \u0432\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430 (\u0443\u0440. 8 \u0438\u043B\u0438 \u043D\u0438\u0436\u0435)";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-pick-cards";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = "\u0421\u043C\u044B\u0442\u044C\u0441\u044F \u043E\u0442 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E";
    applyBtn.disabled = true;
    let selectedMonster = null;
    monsters.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.cardId = m.cardId;
      const img = document.createElement("img");
      img.className = "wizard-taming-pick-card-img";
      img.src = m.img || "";
      img.alt = m.cardId;
      btn.appendChild(img);
      const sumEl = document.createElement("div");
      sumEl.className = "wizard-taming-pick-sum";
      sumEl.textContent = `\u0423\u0440\u043E\u0432\u0435\u043D\u044C: ${m.level}`;
      sumEl.style.marginTop = "4px";
      sumEl.style.fontSize = "16px";
      sumEl.style.color = "#ffd37a";
      sumEl.style.textAlign = "center";
      btn.appendChild(sumEl);
      btn.addEventListener("click", () => {
        cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selectedMonster = m.cardId;
        applyBtn.disabled = !selectedMonster;
      });
      cardsWrap.appendChild(btn);
    });
    applyBtn.addEventListener("click", () => {
      if (!selectedMonster) {
        return;
      }
      socket_default.emit("message", {
        method: "EscapeRatOnStickApply",
        ratCardId: String(ratCardId),
        monsterCardId: String(selectedMonster),
        actingSeat: Number(getFleeingSeatForEscapeAid())
      });
      hideEscapeRatMonsterPickModal();
    });
    panel.appendChild(title);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideEscapeRatMonsterPickModal();
        if (typeof onCancel === "function") {
          onCancel();
        }
      }
    });
    pushOpenModalsToServerDebounced();
  }
  function openEscapeAidOptionsModal() {
    hideEscapeAidOptionsModal(true);
    hideBattleResult();
    const fleeSeat = getFleeingSeatForEscapeAid();
    if (fleeSeat == null || Number.isNaN(Number(fleeSeat)) || Number(localSeat) !== Number(fleeSeat)) {
      return;
    }
    if (!escapeActive) {
      return;
    }
    const inDicePhase = Boolean(escapeWaitingForRoll && escapeCurrentSeat != null && Number(escapeCurrentSeat) === fleeSeat);
    const inPickPhase = Boolean(!escapeWaitingForRoll && escapeMonsterPickSession && Number(escapeMonsterPickSession.seat) === fleeSeat);
    if (!inDicePhase && !inPickPhase) {
      return;
    }
    const entries = collectEscapeAidCardEntriesForSeat(fleeSeat);
    if (!entries.length) {
      return;
    }
    const modal = document.createElement("div");
    modal.id = "escape-aid-options-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "\u0421\u043C\u044B\u0432\u043A\u0430: \u043E\u0441\u043E\u0431\u044B\u0435 \u0441\u043F\u043E\u0441\u043E\u0431\u044B";
    const desc = document.createElement("div");
    desc.id = "escape-aid-options-desc";
    desc.className = "wizard-taming-desc";
    desc.textContent = "\u0412\u044B\u0434\u0435\u043B\u0438 \u043A\u0430\u0440\u0442\u0443 \u0438\u043B\u0438 \u0441\u043F\u043E\u0441\u043E\u0431, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435.";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-pick-cards";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0432\u044B\u0431\u043E\u0440";
    applyBtn.disabled = true;
    let selected = null;
    entries.forEach((ent) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.cardId = ent.cardId;
      const img = document.createElement("img");
      img.className = "wizard-taming-pick-card-img";
      img.src = ent.img || "";
      img.alt = ent.cardId;
      btn.appendChild(img);
      const cap = document.createElement("div");
      cap.className = "wizard-taming-pick-sum";
      cap.textContent = ent.title || ent.cardId;
      cap.style.marginTop = "4px";
      cap.style.fontSize = "15px";
      cap.style.color = "#e6e6e6";
      cap.style.textAlign = "center";
      btn.appendChild(cap);
      btn.addEventListener("click", () => {
        cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selected = ent;
        desc.textContent = ent.desc || "";
        applyBtn.disabled = !selected;
      });
      cardsWrap.appendChild(btn);
    });
    applyBtn.addEventListener("click", () => {
      if (!selected) {
        return;
      }
      if (selected.aidKind === "rat_on_stick") {
        const ratId = String(selected.cardId || "");
        if (!document.getElementById(ratId)) {
          return;
        }
        hideEscapeAidOptionsModal(true);
        openEscapeRatMonsterPickModal({
          ratCardId: ratId,
          onCancel: () => {
            maybeTryOpenEscapeAidOptionsModal();
          }
        });
        return;
      }
      if (selected.aidKind === "instant_wall") {
        const fleeSeat2 = getFleeingSeatForEscapeAid();
        if (fleeSeat2 == null) {
          return;
        }
        const cid = String(selected.cardId || "");
        if (!cid) {
          return;
        }
        hideEscapeAidOptionsModal(true);
        socket_default.emit("message", { method: "InstantWallUse", cardId: cid, actingSeat: Number(fleeSeat2) });
      }
    });
    panel.appendChild(title);
    panel.appendChild(desc);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    const hasWallAid = entries.some((e) => e && e.aidKind === "instant_wall");
    if (hasWallAid && Number.isFinite(Number(fleeSeat))) {
      instantWallSoloAidWaitingEmitted = true;
      socket_default.emit("message", { method: "InstantWallSoloAidWaiting", deciderSeat: Number(fleeSeat) });
    }
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideEscapeAidOptionsModal();
      }
    });
    pushOpenModalsToServerDebounced();
  }
  function maybeTryOpenEscapeAidOptionsModal() {
    if (!escapeActive) {
      return;
    }
    const fleeSeat = getFleeingSeatForEscapeAid();
    if (fleeSeat == null || Number(localSeat) !== fleeSeat) {
      return;
    }
    const inDicePhase = Boolean(escapeWaitingForRoll && escapeCurrentSeat != null && Number(escapeCurrentSeat) === fleeSeat);
    const inPickPhase = Boolean(!escapeWaitingForRoll && escapeMonsterPickSession && Number(escapeMonsterPickSession.seat) === fleeSeat);
    if (!inDicePhase && !inPickPhase) {
      return;
    }
    if (inDicePhase && escapeRollInProgress) {
      return;
    }
    if (document.getElementById("escape-aid-options-modal") || document.getElementById("escape-rat-monster-modal")) {
      return;
    }
    const entries = collectEscapeAidCardEntriesForSeat(fleeSeat);
    if (entries.length <= 0) {
      return;
    }
    setTimeout(() => {
      if (!escapeActive || Number(localSeat) !== fleeSeat) {
        return;
      }
      const inD = Boolean(escapeWaitingForRoll && escapeCurrentSeat != null && Number(escapeCurrentSeat) === fleeSeat);
      const inP = Boolean(!escapeWaitingForRoll && escapeMonsterPickSession && Number(escapeMonsterPickSession.seat) === fleeSeat);
      if (!inD && !inP) {
        return;
      }
      if (document.getElementById("escape-aid-options-modal") || document.getElementById("escape-rat-monster-modal")) {
        return;
      }
      openEscapeAidOptionsModal();
    }, 80);
  }
  function applyEscapeRatOnStickFromNetwork({ ratCardId, monsterCardId, actingSeat }) {
    const rat = String(ratCardId || "");
    const mon = String(monsterCardId || "");
    const act = Number(actingSeat);
    if (!rat || !mon || !Number.isFinite(act)) {
      return;
    }
    if (!escapeActive) {
      return;
    }
    const rating = getMonsterRatingForRatOnStick(mon);
    if (rating == null || rating < 1 || rating > 8) {
      return;
    }
    const pending = getPendingEscapeMonsterIdsForRat();
    if (!pending.has(mon)) {
      return;
    }
    moveTreasureCardToDiscard(rat, { ownerSeat: act });
    hideEscapeAidOptionsModal(true);
    hideEscapeRatMonsterPickModal();
    adjustCardWidth(".myhand");
    adjustCardWidth(".zone2");
    adjustCardWidth(".zone5");
    adjustCardWidth(".opponenthand");
    adjustCardWidth(".opponent2hand");
    adjustCardWidth(".opponent3hand");
    UpdatebackImgTreasure();
    const fleeSeat = getFleeingSeatForEscapeAid();
    if (fleeSeat == null || Number(act) !== Number(fleeSeat)) {
      recalculateAllPowerDisplays();
      pushOpenModalsToServerDebounced();
      return;
    }
    if (mon === String(escapeCurrentMonsterCardId)) {
      escapeWaitingForRoll = false;
      escapeRollInProgress = false;
      const payload = {
        method: "EscapeRollResult",
        seat: act,
        escapePenaltySeat: act,
        rawRoll: 6,
        equipRemover: getSeatEquipmentRemover(act),
        monsterRemover: escapeMonsterRemover,
        totalRoll: ESCAPE_TARGET_ROLL,
        escaped: true,
        badStaffPenalty: null,
        monsterCardId: escapeCurrentMonsterCardId,
        viaRatOnStick: true
      };
      if (localSeat === escapeOwnerSeat) {
        emitEscapeRollResultAndAdvance(payload);
      }
    } else {
      removeMonsterIdFromEscapeQueues(mon);
      showBattleResult("\u041A\u0440\u044B\u0441\u0430 \u043D\u0430 \u043F\u0430\u043B\u043E\u0447\u043A\u0435: \u0442\u044B \u0441\u0431\u0435\u0436\u0430\u043B \u043E\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0431\u0435\u0437 \u0431\u0440\u043E\u0441\u043A\u0430!");
      setTimeout(() => hideBattleResult(), 1600);
      flushTurnStateSyncToServer();
      const pickSeat = escapeMonsterPickSession != null ? Number(escapeMonsterPickSession.seat) : null;
      const stillInMonsterPick = !escapeWaitingForRoll && pickSeat != null && Number(act) === pickSeat;
      if (stillInMonsterPick) {
        const q = escapeMonsterQueue || [];
        hideEscapeMonsterPicker();
        if (q.length === 1 && localSeat === escapeOwnerSeat) {
          clearEscapeMonsterPickSession();
          socket_default.emit("message", {
            method: "EscapeMonsterChosen",
            seat: pickSeat,
            cardId: q[0].cardId
          });
        } else if (q.length > 1 && Number(localSeat) === pickSeat) {
          showBattleResult("\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0431\u0443\u0434\u0435\u0448\u044C \u0441\u043C\u044B\u0432\u0430\u0442\u044C\u0441\u044F.");
          showEscapeMonsterPicker(q, (cardId) => {
            hideEscapeMonsterPicker();
            socket_default.emit("message", {
              method: "EscapeMonsterChosen",
              seat: localSeat,
              cardId
            });
          });
          escapeMonsterPickSession = {
            seat: pickSeat,
            monsters: cloneTurnStateJson(q) || []
          };
          flushTurnStateSyncToServer();
        }
      }
    }
    recalculateAllPowerDisplays();
    pushOpenModalsToServerDebounced();
  }
  function clearEscapeMonsterPickSession() {
    escapeMonsterPickSession = null;
  }
  function showEscapeMonsterPicker(monsters, onPick) {
    hideEscapeMonsterPicker();
    const root = document.createElement("div");
    root.id = "escape-monster-picker";
    root.style.position = "fixed";
    root.style.left = "0";
    root.style.top = "0";
    root.style.width = "100vw";
    root.style.height = "100vh";
    root.style.background = "rgba(0,0,0,0.55)";
    root.style.zIndex = "1000";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.alignItems = "center";
    root.style.justifyContent = "center";
    root.style.gap = "16px";
    const title = document.createElement("div");
    title.textContent = "\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0431\u0443\u0434\u0435\u0448\u044C \u0441\u043C\u044B\u0432\u0430\u0442\u044C\u0441\u044F";
    title.style.color = "#fff";
    title.style.fontSize = "28px";
    title.style.textAlign = "center";
    root.appendChild(title);
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "14px";
    row.style.flexWrap = "wrap";
    row.style.justifyContent = "center";
    row.style.maxWidth = "90vw";
    monsters.forEach((m) => {
      const card = document.createElement("div");
      card.style.width = "270px";
      card.style.height = "383px";
      card.style.overflow = "hidden";
      card.style.cursor = "pointer";
      card.style.transition = "transform 0.18s ease";
      card.style.transformOrigin = "center";
      const img = document.createElement("img");
      img.src = m.img || "";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.objectPosition = "center";
      card.appendChild(img);
      card.addEventListener("mouseenter", () => {
        card.style.transform = "scale(1.08)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "scale(1)";
      });
      card.addEventListener("click", () => onPick(m.cardId));
      row.appendChild(card);
    });
    root.appendChild(row);
    document.body.appendChild(root);
  }
  function setCurrentEscapeMonsterById(cardId) {
    if (!cardId) {
      return;
    }
    const idx = escapeMonsterQueue.findIndex((m) => m.cardId === cardId);
    let selected = null;
    if (idx >= 0) {
      selected = escapeMonsterQueue[idx];
      escapeMonsterQueue.splice(idx, 1);
    } else {
      selected = { cardId, remover: 0, badStaff: null, img: "" };
    }
    escapeCurrentMonsterCardId = selected.cardId;
    escapeMonsterRemover = Number(selected.remover) || 0;
    escapeMonsterBadStaff = normalizeBadStaff(selected.badStaff);
  }
  function getMonsterAbilitiesByCardId(cardId) {
    const id = String(cardId || "").trim();
    if (!id) {
      return null;
    }
    const door96 = window.doors?.find((d) => d && d.name === id);
    const abilities = door96 && typeof door96 === "object" ? door96.monsterAbilities : null;
    if (abilities && typeof abilities === "object") {
      return abilities;
    }
    return null;
  }
  function seatHasEquippedTreasureId(seat, treasureId) {
    const s = Number(seat);
    const id = String(treasureId || "").trim();
    if (!Number.isFinite(s) || s < 0 || !id) {
      return false;
    }
    const el = document.getElementById(id);
    if (!el) {
      return false;
    }
    const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
    return Boolean(main && main.contains(el) || side && side.contains(el));
  }
  function isEscapeAutoSuccessForMonster(cardId, escapingSeat) {
    const id = String(cardId || "").trim();
    if (!id) {
      return false;
    }
    const ab = getMonsterAbilitiesByCardId(id);
    if (ab && ab.autoEscape) {
      return true;
    }
    const maxLv = Number(ab?.escapeAutoSuccessMaxPlayerLevel);
    if (!Number.isFinite(maxLv) || maxLv < 1) {
      return false;
    }
    if (escapingSeat === null || escapingSeat === void 0 || escapingSeat === "") {
      return false;
    }
    const s = Number(escapingSeat);
    if (!Number.isFinite(s) || s < 0) {
      return false;
    }
    const cur = Math.max(1, Number(levelBySeat[s]) || 1);
    if (cur > maxLv) {
      return false;
    }
    if (ab?.escapeAutoSuccessExcludeRaceElf && seatHasRace(s, "Elf")) {
      return false;
    }
    return true;
  }
  function isCurrentEscapeMonsterAutoFailEscape() {
    const id = String(escapeCurrentMonsterCardId || "").trim();
    if (!id) {
      return false;
    }
    const ab = getMonsterAbilitiesByCardId(id);
    return Boolean(ab && ab.autoFailEscape);
  }
  function selectMonsterAndStartEscapeTurn(cardId, seat) {
    setCurrentEscapeMonsterById(cardId);
    escapeAttemptNumber = 0;
    escapeHalflingRetryUsedForCurrentAttempt = false;
    escapeHalflingRetryPending = null;
    hideEscapeHalflingRetryModal();
    socket_default.emit("message", {
      method: "EscapeTurnStart",
      seat,
      index: escapeQueueIndex,
      isRetry: false
    });
    if (isEscapeAutoSuccessForMonster(cardId, seat)) {
      setTimeout(() => {
        const payload = {
          method: "EscapeRollResult",
          seat: Number(seat),
          escapePenaltySeat: Number(seat),
          rawRoll: 6,
          equipRemover: getSeatEquipmentRemover(Number(seat)),
          monsterRemover: escapeMonsterRemover,
          totalRoll: ESCAPE_TARGET_ROLL,
          escaped: true,
          badStaffPenalty: null,
          monsterCardId: escapeCurrentMonsterCardId,
          viaAutoEscapeMonster: true
        };
        if (Number(localSeat) === Number(escapeOwnerSeat)) {
          emitEscapeRollResultAndAdvance(payload);
        }
      }, 80);
    }
  }
  function finishEscapeSequenceAndBroadcast() {
    socket_default.emit("message", {
      method: "EscapeSequenceFinished"
    });
  }
  function runNextEscapeAttemptAndBroadcast() {
    if (!escapeActive) {
      return;
    }
    if (escapeQueue.length <= 1) {
      escapeQueueIndex = 0;
    } else if (escapeQueueIndex < 0) {
      escapeQueueIndex = 0;
      escapeMonsterQueue = escapeMonsterTemplateQueue.slice();
    }
    const seat = escapeQueue[escapeQueueIndex];
    if (seat === null || seat === void 0) {
      finishEscapeSequenceAndBroadcast();
      return;
    }
    if (escapeInstantWallAutoSeats && escapeInstantWallAutoSeats.has(Number(seat))) {
      const nextMonsterId = escapeMonsterQueue?.[0]?.cardId;
      if (!nextMonsterId) {
        escapeQueueIndex += 1;
        escapeMonsterQueue = escapeMonsterTemplateQueue.slice();
        runNextEscapeAttemptAndBroadcast();
        return;
      }
      selectMonsterAndStartEscapeTurn(nextMonsterId, Number(seat));
      setTimeout(() => {
        const payload = {
          method: "EscapeRollResult",
          seat: Number(seat),
          escapePenaltySeat: Number(seat),
          rawRoll: 6,
          equipRemover: getSeatEquipmentRemover(Number(seat)),
          monsterRemover: escapeMonsterRemover,
          totalRoll: ESCAPE_TARGET_ROLL,
          escaped: true,
          badStaffPenalty: null,
          monsterCardId: escapeCurrentMonsterCardId,
          viaInstantWall: true
        };
        if (Number(localSeat) === Number(escapeOwnerSeat)) {
          emitEscapeRollResultAndAdvance(payload);
        }
      }, 120);
      return;
    }
    if (escapeMonsterQueue.length <= 0) {
      escapeQueueIndex += 1;
      if (escapeQueueIndex >= escapeQueue.length) {
        finishEscapeSequenceAndBroadcast();
        return;
      }
      escapeMonsterQueue = escapeMonsterTemplateQueue.slice();
      runNextEscapeAttemptAndBroadcast();
      return;
    }
    const forcePickerEachTime = escapeMonsterInitialCount >= 2;
    if (!forcePickerEachTime && escapeMonsterQueue.length === 1) {
      selectMonsterAndStartEscapeTurn(escapeMonsterQueue[0].cardId, seat);
      return;
    }
    socket_default.emit("message", {
      method: "EscapeMonsterPickStart",
      seat,
      monsters: escapeMonsterQueue
    });
  }
  function startEscapeSequenceAndBroadcast(loserSeat, helperSeat, monsterRemover) {
    const parsedLoserSeat = parseInt(loserSeat, 10);
    const parsedHelperSeat = parseInt(helperSeat, 10);
    if (Number.isNaN(parsedLoserSeat)) {
      return;
    }
    escapeInstantWallGate = null;
    escapeInstantWallOfferPending = null;
    escapeInstantWallAutoSeats = /* @__PURE__ */ new Set();
    const queue = [parsedLoserSeat];
    if (!Number.isNaN(parsedHelperSeat) && parsedHelperSeat !== parsedLoserSeat) {
      queue.push(parsedHelperSeat);
    }
    escapeActive = true;
    escapeQueue = queue;
    escapeQueueIndex = -1;
    escapeMonsterInitialCount = escapeMonsterQueue.length;
    escapeMonsterTemplateQueue = escapeMonsterQueue.slice();
    escapeMonsterRemover = Number(monsterRemover) || 0;
    escapeOwnerSeat = parsedLoserSeat;
    escapeRollInProgress = false;
    escapeCurrentMonsterCardId = null;
    escapeWizardFlightPending = null;
    socket_default.emit("message", {
      method: "EscapeSequenceStart",
      queue,
      monsterRemover: escapeMonsterRemover,
      monsterBadStaff: escapeMonsterBadStaff,
      monsterQueue: escapeMonsterQueue,
      monsterTemplateQueue: escapeMonsterTemplateQueue,
      monsterInitialCount: escapeMonsterInitialCount,
      ownerSeat: escapeOwnerSeat
    });
    if (!Number.isNaN(parsedHelperSeat) && parsedHelperSeat !== parsedLoserSeat) {
      escapeInstantWallGate = { helperSeat: parsedHelperSeat, loserSeat: parsedLoserSeat };
      socket_default.emit("message", { method: "InstantWallHelperPrompt", helperSeat: parsedHelperSeat, loserSeat: parsedLoserSeat });
      socket_default.emit("message", { method: "InstantWallHelperWaiting", helperSeat: parsedHelperSeat, loserSeat: parsedLoserSeat });
      return;
    }
    runNextEscapeAttemptAndBroadcast();
  }
  function resolveEscapeRollAndBroadcast(seat, rawRoll) {
    if (!escapeActive || !escapeWaitingForRoll || seat !== escapeCurrentSeat) {
      return;
    }
    escapeAttemptNumber += 1;
    const equipRemover = getSeatEquipmentRemover(seat);
    const totalRoll = rawRoll + equipRemover + escapeMonsterRemover;
    const escaped = totalRoll >= ESCAPE_TARGET_ROLL;
    let badStaffPenalty = escaped ? null : normalizeBadStaff(escapeMonsterBadStaff);
    if (!escaped && !badStaffPenalty && escapeCurrentMonsterCardId) {
      const door96 = window.doors?.find((d) => d.name === escapeCurrentMonsterCardId);
      if (door96 && String(door96.special || "") === "Mate") {
        const mateEl = document.getElementById(escapeCurrentMonsterCardId);
        const srcId = String(mateEl?.dataset?.mateSourceMonsterId || "");
        const srcDoor = srcId ? window.doors?.find((d) => d.name === srcId) : null;
        if (srcDoor?.bad_staff) {
          badStaffPenalty = normalizeBadStaff(srcDoor.bad_staff);
        }
      } else if (door96?.bad_staff) {
        badStaffPenalty = normalizeBadStaff(door96.bad_staff);
      }
    }
    escapeWaitingForRoll = false;
    escapeRollInProgress = false;
    socket_default.emit("message", {
      method: "RandDice",
      digit: rawRoll
    });
    const penaltySeatNum = Math.floor(Number(seat));
    const resultPayload = {
      method: "EscapeRollResult",
      seat: penaltySeatNum,
      escapePenaltySeat: penaltySeatNum,
      rawRoll,
      equipRemover,
      monsterRemover: escapeMonsterRemover,
      totalRoll,
      escaped,
      badStaffPenalty,
      monsterCardId: escapeCurrentMonsterCardId
    };
    if (!escaped) {
      escapeFailAidPending = { seat: penaltySeatNum, payload: resultPayload, attemptNumber: escapeAttemptNumber };
      socket_default.emit("message", { method: "EscapeCloseAidModals" });
      setTimeout(() => {
        socket_default.emit("message", {
          method: "EscapeFailAidPrompt",
          seat: penaltySeatNum,
          attemptNumber: escapeAttemptNumber,
          payload: resultPayload
        });
      }, 300);
      return;
    }
    emitEscapeRollResultAndAdvance(resultPayload);
  }
  function canLocalPlayerRollEscapeNow() {
    if (!escapeActive || !escapeWaitingForRoll) {
      return false;
    }
    if (escapeCurrentSeat === null || escapeCurrentSeat === void 0) {
      return false;
    }
    if (localSeat === null || localSeat === void 0) {
      return false;
    }
    return Number(localSeat) === Number(escapeCurrentSeat);
  }
  function resolveCombatAndBroadcast() {
    const { hasMonster, levelSum, removerSum, badStaffSum, monsters } = getMonsterBattleContext();
    const helperSeatSnapshot = acceptedHelperSeat;
    const fightSeat = getMonsterFightSeat();
    if (!hasMonster) {
      socket_default.emit("message", {
        method: "CombatResolved",
        winner: "none",
        seat: fightSeat,
        helperSeat: helperSeatSnapshot,
        text: ""
      });
      return;
    }
    const playerPower = getNumericText(".MyBonus");
    const monsterPower = getEffectiveMonsterPower();
    const helperSeat = Number.isInteger(helperSeatSnapshot) ? helperSeatSnapshot : parseInt(helperSeatSnapshot, 10);
    const activeIsWarrior = isSeatWarriorClassActive(fightSeat);
    const helperIsWarrior = !Number.isNaN(helperSeat) && helperSeat >= 0 && isSeatWarriorClassActive(helperSeat);
    const warriorInBattle = activeIsWarrior || helperIsWarrior;
    if (warriorInBattle ? playerPower >= monsterPower : playerPower > monsterPower) {
      const seatToLevelMap = getSeatToLevelMap();
      const activeLevelSelector = seatToLevelMap[fightSeat];
      const activeLevel = activeLevelSelector ? getNumericText(activeLevelSelector) : 0;
      let victoryBonusLevels = 0;
      monsters.forEach((m) => {
        const ab = getMonsterAbilitiesByCardId(m?.cardId);
        const ids = Array.isArray(ab?.bonusLevelIfEquippedTreasureIds) ? ab.bonusLevelIfEquippedTreasureIds : [];
        const bonus = Number(ab?.bonusLevelIfEquippedTreasureBonus) || 0;
        if (bonus > 0 && ids.some((tid) => seatHasEquippedTreasureId(fightSeat, tid))) {
          victoryBonusLevels += bonus;
        }
        if (ab && ab.bonusLevelIfOwnLevelEnough) {
          const ownLevelEnough = activeIsWarrior ? activeLevel >= monsterPower : activeLevel > monsterPower;
          if (ownLevelEnough) {
            victoryBonusLevels += Number(ab.bonusLevelIfOwnLevelEnoughBonus) || 1;
          }
        }
      });
      const nextLevel = activeLevel + levelSum + victoryBonusLevels;
      let helperLevel = null;
      let helperLevelGain = 0;
      if (!Number.isNaN(helperSeat) && helperSeat >= 0) {
        if (seatHasRace(helperSeat, "Elf")) {
          helperLevelGain = monsters.length;
          if (helperLevelGain > 0) {
            const helperLevelSelector = seatToLevelMap[helperSeat];
            const helperCurrentLevel = helperLevelSelector ? getNumericText(helperLevelSelector) : levelBySeat[helperSeat] || 1;
            helperLevel = helperCurrentLevel + helperLevelGain;
          }
        }
      }
      setLevelBySeat(fightSeat, nextLevel);
      if (helperLevel !== null) {
        setLevelBySeat(helperSeat, helperLevel);
      }
      recalculateAllPowerDisplays();
      showBattleResult("\u041C\u043E\u043D\u0441\u0442\u0440 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D");
      socket_default.emit("message", {
        method: "CombatResolved",
        winner: "player",
        seat: fightSeat,
        level: nextLevel,
        helperSeat: helperSeatSnapshot,
        helperLevel,
        helperLevelGain,
        text: "\u041C\u043E\u043D\u0441\u0442\u0440 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D"
      });
      return;
    }
    showBattleResult("\u041F\u043E\u0431\u0435\u0434\u0438\u043B \u043C\u043E\u043D\u0441\u0442\u0440");
    socket_default.emit("message", {
      method: "CombatResolved",
      winner: "monster",
      seat: fightSeat,
      helperSeat: helperSeatSnapshot,
      monsterRemover: removerSum,
      monsterBadStaff: badStaffSum,
      monsterQueue: monsters,
      text: "\u041F\u043E\u0431\u0435\u0434\u0438\u043B \u043C\u043E\u043D\u0441\u0442\u0440"
    });
  }
  function recalculateMyBonusDisplay() {
    const seatToPowerMap = getSeatToPowerMap();
    const powerSeat = battleActive ? getMonsterFightSeat() : currentTurnSeat;
    const levelOnlyMonster = battleActive && monsterBattlefieldLevelOnlyCombatPower();
    const excludeCombatLevel = battleActive && monsterBattlefieldExcludesLevelFromCombatPower();
    const activePowerSelector = seatToPowerMap[powerSeat];
    const ch = powerSeat != null ? characterBySeat[powerSeat] : null;
    const equipPow = Number(ch?.equipmentPower) || 0;
    let activeCharacterPower = activePowerSelector ? getNumericText(activePowerSelector) : 0;
    if (excludeCombatLevel && powerSeat != null && isSeatParticipantInCurrentMonsterBattle(powerSeat)) {
      activeCharacterPower = equipPow;
    }
    const zone3BonusPower = levelOnlyMonster ? 0 : getTreasurePowerSum(".zone3");
    const doppelInZone3 = Boolean(document.querySelector(".zone3 #treasure47"));
    const doppelDoublingActive = battleActive && acceptedHelperSeat === null && doppelInZone3;
    let activeCombatPower = activeCharacterPower;
    let zone3CombatPower = zone3BonusPower;
    if (doppelDoublingActive) {
      if (levelOnlyMonster) {
        activeCombatPower = 2 * activeCharacterPower;
      } else {
        activeCombatPower = activeCharacterPower + equipPow;
      }
      zone3CombatPower = 2 * zone3BonusPower;
    }
    if (battleActive && powerSeat != null && changeSexActiveBySeat.has(powerSeat) && isSeatParticipantInCurrentMonsterBattle(powerSeat)) {
      activeCombatPower -= 5;
    }
    let helpersBonusPower = 0;
    let frenzyBonusPower = 0;
    let exorcismBonusPower = 0;
    let yuppieWaterBonusPower = 0;
    const activeIsWarrior = String(characterBySeat[powerSeat]?.kind || "") === "Warrior";
    const activeIsCleric = String(characterBySeat[powerSeat]?.kind || "") === "Cleric";
    if (battleActive && powerSeat != null && !levelOnlyMonster) {
      frenzyBonusPower += activeIsWarrior ? Number(warriorFrenzyBonusBySeat[powerSeat]) || 0 : 0;
      exorcismBonusPower += activeIsCleric ? (Number(clericExorcismBonusBySeat[powerSeat]) || 0) * 3 : 0;
    }
    if (battleActive && acceptedHelperSeat !== null) {
      helpersBonusPower += getSeatCombatPower(acceptedHelperSeat);
      if (!levelOnlyMonster) {
        const helperIsWarrior = String(characterBySeat[acceptedHelperSeat]?.kind || "") === "Warrior";
        const helperIsCleric = String(characterBySeat[acceptedHelperSeat]?.kind || "") === "Cleric";
        frenzyBonusPower += helperIsWarrior ? Number(warriorFrenzyBonusBySeat[acceptedHelperSeat]) || 0 : 0;
        exorcismBonusPower += helperIsCleric ? (Number(clericExorcismBonusBySeat[acceptedHelperSeat]) || 0) * 3 : 0;
      }
    }
    if (battleActive && !levelOnlyMonster && Boolean(document.querySelector(".zone3 #treasure51")) && powerSeat != null) {
      let elfCount = 0;
      if (seatHasRace(powerSeat, "Elf")) {
        elfCount += 1;
      }
      if (acceptedHelperSeat !== null && seatHasRace(acceptedHelperSeat, "Elf")) {
        elfCount += 1;
      }
      yuppieWaterBonusPower = 2 * elfCount;
    }
    let door79ElfBattleDebuff = 0;
    const elfPenaltyEach = battleActive ? getMonsterBattlefieldElfCombatPenaltyPerElfSum() : 0;
    if (elfPenaltyEach > 0 && powerSeat != null) {
      if (seatHasRace(powerSeat, "Elf") && isSeatParticipantInCurrentMonsterBattle(powerSeat)) {
        door79ElfBattleDebuff += elfPenaltyEach;
      }
      if (acceptedHelperSeat !== null && seatHasRace(acceptedHelperSeat, "Elf")) {
        door79ElfBattleDebuff += elfPenaltyEach;
      }
    }
    let trimDebuffActive = 0;
    let trimDebuffHelper = 0;
    if (battleActive && powerSeat != null) {
      trimDebuffActive = Number(thiefBackstabDebuffBySeat[powerSeat]) || 0;
    }
    if (battleActive && acceptedHelperSeat !== null) {
      trimDebuffHelper = Number(thiefBackstabDebuffBySeat[acceptedHelperSeat]) || 0;
    }
    const myBonusValue = activeCombatPower + zone3CombatPower - trimDebuffActive + (helpersBonusPower - trimDebuffHelper) + frenzyBonusPower + exorcismBonusPower + yuppieWaterBonusPower - door79ElfBattleDebuff;
    setPowerText(".MyBonus", myBonusValue);
    return myBonusValue;
  }
  function applyTurnHighlight() {
    ALL_ICON_SELECTORS.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.filter = "none";
      }
    });
    const seatToIconMap = getSeatToIconMap();
    const activeIconSelector = seatToIconMap[currentTurnSeat];
    const activeIcon = activeIconSelector ? document.querySelector(activeIconSelector) : null;
    if (activeIcon) {
      activeIcon.style.filter = ACTIVE_TURN_FILTER;
    }
    if (battleActive && acceptedHelperSeat !== null) {
      const helperIconSelector = seatToIconMap[acceptedHelperSeat];
      const helperIcon = helperIconSelector ? document.querySelector(helperIconSelector) : null;
      if (helperIcon) {
        helperIcon.style.filter = HELPER_FILTER;
      }
    }
    updateBattleEquipmentHighlight();
  }
  function clearBattleEquipmentCardOutlines() {
    try {
      document.querySelectorAll(`.${BATTLE_EQUIPMENT_OUTLINE_CLASS}`).forEach((el) => el.remove());
    } catch {
    }
  }
  function getEquipmentCardVisualBounds(cardEl) {
    if (!cardEl) {
      return null;
    }
    let minL = Infinity;
    let minT = Infinity;
    let maxR = -Infinity;
    let maxB = -Infinity;
    const add = (node) => {
      if (!node || node.nodeType !== 1) {
        return;
      }
      const r = node.getBoundingClientRect();
      if (!Number.isFinite(r.width) || !Number.isFinite(r.height) || r.width < 1 || r.height < 1) {
        return;
      }
      minL = Math.min(minL, r.left);
      minT = Math.min(minT, r.top);
      maxR = Math.max(maxR, r.right);
      maxB = Math.max(maxB, r.bottom);
    };
    add(cardEl);
    add(cardEl.querySelector(".card-item"));
    if (!Number.isFinite(minL) || minL === Infinity) {
      return null;
    }
    return {
      left: minL,
      top: minT,
      right: maxR,
      bottom: maxB,
      width: maxR - minL,
      height: maxB - minT
    };
  }
  function collectVisibleEquipmentCardsInMainZone(mainEl) {
    return Array.from(mainEl.querySelectorAll(":scope > .card")).filter((el) => {
      if (!el?.id || el.id === "card") {
        return false;
      }
      const b = getEquipmentCardVisualBounds(el);
      if (!b || b.width < 8 || b.height < 8) {
        return false;
      }
      try {
        const st = window.getComputedStyle(el);
        if (st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0) {
          return false;
        }
      } catch {
      }
      return true;
    });
  }
  function getTopLeftRelativeToAncestor(el, ancestor) {
    if (!el || !ancestor || !ancestor.contains(el)) {
      return null;
    }
    let x = 0;
    let y = 0;
    let n = el;
    while (n && n !== ancestor) {
      const p = n.offsetParent;
      if (!p || p !== ancestor && !ancestor.contains(p)) {
        return null;
      }
      x += n.offsetLeft;
      y += n.offsetTop;
      n = p;
    }
    if (n !== ancestor) {
      return null;
    }
    return { x, y };
  }
  function getEquipmentNodeBoxInMainLocal(mainEl, node) {
    const tl = getTopLeftRelativeToAncestor(node, mainEl);
    if (!tl) {
      return null;
    }
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
      return null;
    }
    return {
      left: tl.x,
      top: tl.y,
      right: tl.x + w,
      bottom: tl.y + h
    };
  }
  function unionEquipmentCardBoundsInMainLocal(mainEl) {
    const cards = collectVisibleEquipmentCardsInMainZone(mainEl);
    let minL = Infinity;
    let minT = Infinity;
    let maxR = -Infinity;
    let maxB = -Infinity;
    for (const card of cards) {
      const nodes = [card];
      const item = card.querySelector(".card-item");
      if (item) {
        nodes.push(item);
      }
      for (const node of nodes) {
        const b = getEquipmentNodeBoxInMainLocal(mainEl, node);
        if (!b) {
          continue;
        }
        minL = Math.min(minL, b.left);
        minT = Math.min(minT, b.top);
        maxR = Math.max(maxR, b.right);
        maxB = Math.max(maxB, b.bottom);
      }
    }
    if (!Number.isFinite(minL) || minL === Infinity) {
      return null;
    }
    return { minL, minT, maxR, maxB };
  }
  function appendBattleEquipmentCardsOutlineOverlay(mainEl) {
    const cards = collectVisibleEquipmentCardsInMainZone(mainEl);
    if (cards.length === 0) {
      return;
    }
    const u = unionEquipmentCardBoundsInMainLocal(mainEl);
    if (!u) {
      return;
    }
    const pad = 3;
    const w = u.maxR - u.minL + pad * 2;
    const h = u.maxB - u.minT + pad * 2;
    if (w < 4 || h < 4) {
      return;
    }
    const el = document.createElement("div");
    el.className = BATTLE_EQUIPMENT_OUTLINE_CLASS;
    el.setAttribute("aria-hidden", "true");
    el.style.position = "absolute";
    el.style.left = `${Math.round(u.minL - pad)}px`;
    el.style.top = `${Math.round(u.minT - pad)}px`;
    el.style.width = `${Math.round(w)}px`;
    el.style.height = `${Math.round(h)}px`;
    el.style.zIndex = "12";
    mainEl.appendChild(el);
  }
  function updateBattleEquipmentHighlight() {
    clearBattleEquipmentCardOutlines();
    if (!getMonsterBattleContext().hasMonster) {
      return;
    }
    const seats = /* @__PURE__ */ new Set();
    const fs = getMonsterFightSeat();
    if (fs != null && fs !== void 0 && !Number.isNaN(Number(fs)) && Number(fs) >= 0) {
      seats.add(Number(fs));
    }
    if (acceptedHelperSeat != null && acceptedHelperSeat >= 0 && !Number.isNaN(Number(acceptedHelperSeat))) {
      seats.add(Number(acceptedHelperSeat));
    }
    const mainZones = [];
    for (const seat of seats) {
      const zones = getMainAndSideZoneElementsForSeat(seat);
      const main = zones?.main;
      if (main) {
        mainZones.push(main);
      }
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!getMonsterBattleContext().hasMonster) {
          return;
        }
        clearBattleEquipmentCardOutlines();
        for (const main of mainZones) {
          appendBattleEquipmentCardsOutlineOverlay(main);
        }
      });
    });
  }
  function setCurrentTurn(seat, shouldBroadcast = false) {
    currentTurnSeat = seat;
    turnAwaitingManualEnd = false;
    clearThiefTheftBoardDicePrompt();
    escapeWizardFlightPending = null;
    hideWizardFlightModal();
    if (seat >= 0 && seat < halflingDoubleSellUsedBySeat.length) {
      halflingDoubleSellUsedBySeat[seat] = false;
    }
    for (let i3 = 0; i3 < warriorFrenzyUsedBySeat.length; i3++) {
      warriorFrenzyUsedBySeat[i3] = 0;
      warriorFrenzyBonusBySeat[i3] = 0;
      clericExorcismUsedBySeat[i3] = 0;
      clericExorcismBonusBySeat[i3] = 0;
      victimThiefTrimUsedBySeat[i3] = 0;
      thiefBackstabDebuffBySeat[i3] = 0;
    }
    battleActive = false;
    battleTurnSeat = null;
    pendingHelpSeats.clear();
    acceptedHelperSeat = null;
    monsterFightSeat = null;
    applyTurnHighlight();
    recalculateMyBonusDisplay();
    updateHelpUi();
    updateWarriorFrenzyUi();
    updateClericExorcismUi();
    updateWizardTamingUi();
    updateWizardFlightUi();
    updateThiefTrimUi();
    updateThiefTheftUi();
    updateTurnActionButtons(false);
    wireEndTurnButtonClick();
    if (shouldBroadcast) {
      const updateTurnData = {
        method: "SetTurn",
        seat: currentTurnSeat
      };
      socket_default.emit("message", updateTurnData);
    }
  }
  function setRandomFirstTurn() {
    if (!num || num < 1) {
      return;
    }
    const randomSeat = Math.floor(Math.random() * num);
    setCurrentTurn(randomSeat, true);
  }
  function advanceTurnClockwise() {
    if (!num || num < 1) {
      return;
    }
    const n = Number(num);
    if (n === 4 || n === 5 || n === 6) {
      setCurrentTurn((Number(currentTurnSeat) + 1) % n, true);
      return;
    }
    const nextSeat = (currentTurnSeat - 1 + num) % num;
    setCurrentTurn(nextSeat, true);
  }
  function getLocalHandCardCount() {
    const myHand = document.querySelector(".myhand");
    return myHand ? myHand.querySelectorAll(".card").length : 0;
  }
  function isMonsterBattleUi() {
    return Boolean(battleActive && getMonsterBattleContext().hasMonster);
  }
  function updateTurnActionButtons(isTimerRunning) {
    const foldButton = document.getElementById("fold");
    const endTurnButton = document.getElementById("end-turn");
    if (!foldButton || !endTurnButton) {
      return;
    }
    const isMyTurn = Number(localSeat) === Number(currentTurnSeat);
    const inBattle = isMonsterBattleUi();
    const showFold = isTimerRunning && !turnAwaitingManualEnd;
    const showEndTurn = isMyTurn && !inBattle && !isTimerRunning && !escapeActive;
    foldButton.style.display = showFold ? "flex" : "none";
    endTurnButton.style.display = showEndTurn ? "flex" : "none";
  }
  function wireEndTurnButtonClick() {
    const el = document.getElementById("end-turn");
    if (el) {
      el.onclick = tryCompleteManualTurnEnd;
    }
  }
  function tryCompleteManualTurnEnd() {
    if (Number(localSeat) !== Number(currentTurnSeat)) {
      return;
    }
    if (isMonsterBattleUi()) {
      return;
    }
    if (escapeActive) {
      return;
    }
    const handCount = getLocalHandCardCount();
    const handLimit = isSeatDwarfRaceActive(localSeat) ? 6 : 5;
    if (handCount > handLimit) {
      showBattleResult(`\u0421\u0431\u0440\u043E\u0441\u044C \u043B\u0438\u0448\u043D\u0438\u0435 \u043A\u0430\u0440\u0442\u044B \u0441 \u0440\u0443\u043A\u0438 (\u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C ${handLimit}).`);
      setTimeout(() => {
        hideBattleResult();
      }, 1500);
      return;
    }
    hideBattleResult();
    turnAwaitingManualEnd = false;
    updateTurnActionButtons(false);
    advanceTurnClockwise();
  }
  function getNumericText(selector) {
    const element = document.querySelector(selector);
    const value2 = parseInt(element?.textContent ?? "0", 10);
    return Number.isNaN(value2) ? 0 : value2;
  }
  function getTreasurePowerSum(zoneSelector) {
    const cards = document.querySelectorAll(`${zoneSelector} .card`);
    let power = 0;
    cards.forEach((card) => {
      const foundCard = window.treasures?.find((item) => item.name === card.id);
      const cardPower = Number(foundCard?.power) || 0;
      if (cardPower > 0) {
        power += cardPower;
      }
    });
    return power;
  }
  function setPowerText(selector, value2) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value2;
    }
  }
  function applyMoveCardLocally(move) {
    const card = document.getElementById(move?.cardId);
    const target = move?.targetId ? document.getElementById(move.targetId) : null;
    let zone = null;
    if (move?.zoneId) {
      const z = String(move.zoneId);
      const handMatch = z.match(/^hand(\d)$/);
      const mainMatch = z.match(/^main(\d)$/);
      const sideMatch = z.match(/^side(\d)$/);
      if (handMatch) {
        zone = getHandElementForPlayerSeat(parseInt(handMatch[1], 10));
      } else if (mainMatch) {
        zone = getMainAndSideZoneElementsForSeat(parseInt(mainMatch[1], 10))?.main || null;
      } else if (sideMatch) {
        zone = getMainAndSideZoneElementsForSeat(parseInt(sideMatch[1], 10))?.side || null;
      } else {
        zone = document.getElementById(z);
      }
    }
    if (!card || !zone) {
      return;
    }
    if (target && zone.contains(target)) {
      zone.insertBefore(card, target.nextSibling);
    } else {
      zone.appendChild(card);
    }
    adjustCardWidth(".myhand");
    adjustCardWidth(".zone2");
    adjustCardWidth(".zone5");
    adjustCardHeight(".zone3");
    adjustCardHeight(".zone_monster");
    adjustCardWidth(".opponenthand");
    adjustCardWidth(".zone_opponent");
    adjustCardWidth(".zone_opponent_side");
    adjustCardWidth(".opponent2hand");
    adjustCardWidth(".zone_opponent2");
    adjustCardWidth(".zone_opponent2_side");
    adjustCardWidth(".opponent3hand");
    adjustCardWidth(".zone_opponent3");
    adjustCardWidth(".zone_opponent3_side");
    adjustCardWidth(".opponent_bl_hand");
    adjustCardWidth(".zone_opponent_bl");
    adjustCardWidth(".zone_opponent_bl_side");
    adjustCardWidth(".opponent_br_hand");
    adjustCardWidth(".zone_opponent_br");
    adjustCardWidth(".zone_opponent_br_side");
    UpdatebackImgTreasure();
    UpdatebackImgDoor();
    recalculateAllPowerDisplays();
  }
  function clearAllNonPlaceholderCards() {
    document.querySelectorAll(".cards-zone .card").forEach((el) => {
      if (el?.id && el.id !== "card") {
        el.remove();
      }
    });
  }
  function ensureDecksFilledForSnapshot(state) {
    const anyDoor = document.querySelector('#zone_doors .card[id^="door"]');
    const anyTreasure = document.querySelector('#zone_treasure .card[id^="treasure"]');
    if (anyDoor || anyTreasure) {
      return;
    }
    window.doors = Array.isArray(state.deckDoors) ? state.deckDoors : window.doors || [];
    window.treasures = Array.isArray(state.deckTreasure) ? state.deckTreasure : window.treasures || [];
    window.zonedoor = document.querySelector(".zone_doors");
    window.zoneTreasure = document.querySelector(".zone_treasure");
    if (window.zonedoor && window.zoneTreasure) {
      Deck_filling(window.doors, window.zonedoor);
      UpdatebackImgDoor();
      Deck_filling(window.treasures, window.zoneTreasure);
      UpdatebackImgTreasure();
      UpdateZones();
      window.allCards = document.querySelectorAll(".card");
    }
  }
  function applyRoomStateFromServer(state) {
    const zoneDoors = document.getElementById("zone_doors");
    const zoneTreasure = document.getElementById("zone_treasure");
    if (!zoneDoors || !zoneTreasure) {
      setTimeout(() => applyRoomStateFromServer(state), 80);
      return;
    }
    clearAllNonPlaceholderCards();
    ensureDecksFilledForSnapshot(state);
    const cards = state.cards && typeof state.cards === "object" ? state.cards : {};
    const items = [];
    Object.entries(cards).forEach(([cardId, pos]) => {
      const el = document.getElementById(cardId);
      if (!el) return;
      const zoneId = String(pos?.zoneId || "");
      const targetId = pos?.targetId ? String(pos.targetId) : null;
      let zoneEl = null;
      const handMatch = zoneId.match(/^hand(\d)$/);
      const mainMatch = zoneId.match(/^main(\d)$/);
      const sideMatch = zoneId.match(/^side(\d)$/);
      if (handMatch) {
        zoneEl = getHandElementForPlayerSeat(parseInt(handMatch[1], 10));
      } else if (mainMatch) {
        zoneEl = getMainAndSideZoneElementsForSeat(parseInt(mainMatch[1], 10))?.main || null;
      } else if (sideMatch) {
        zoneEl = getMainAndSideZoneElementsForSeat(parseInt(sideMatch[1], 10))?.side || null;
      } else {
        zoneEl = zoneId ? document.getElementById(zoneId) : null;
      }
      if (!zoneEl) return;
      items.push({ id: cardId, el, zoneEl, targetId });
    });
    const byZone = /* @__PURE__ */ new Map();
    items.forEach((it) => {
      const key = it.zoneEl;
      const arr = byZone.get(key) || [];
      arr.push(it);
      byZone.set(key, arr);
    });
    const isDiscardZoneId = (zoneEl) => {
      const id = String(zoneEl?.id || "");
      return id === "zone_doors_drop" || id === "zone_treasure_drop";
    };
    byZone.forEach((zoneItems, zoneEl) => {
      if (isDiscardZoneId(zoneEl)) {
        zoneItems.forEach((it) => zoneEl.appendChild(it.el));
        return;
      }
      zoneItems.forEach((it) => {
        if (it.targetId) {
          const target = document.getElementById(it.targetId);
          if (target && target !== it.el && zoneEl.contains(target)) {
            zoneEl.insertBefore(it.el, target.nextSibling);
            return;
          }
        }
        zoneEl.appendChild(it.el);
      });
    });
    const cheat = state.cheatAttachments && typeof state.cheatAttachments === "object" ? state.cheatAttachments : {};
    Object.entries(cheat).forEach(([cheatId, trId]) => {
      if (cheatId && trId) {
        setCheatAttachment(String(cheatId), String(trId));
      }
    });
    const hire = state.hirelingAttachments && typeof state.hirelingAttachments === "object" ? state.hirelingAttachments : {};
    Object.entries(hire).forEach(([hId, trId]) => {
      if (hId && trId) {
        setHirelingAttachment(String(hId), String(trId));
      }
    });
    const mba = state.monsterBonusAttachments && typeof state.monsterBonusAttachments === "object" ? state.monsterBonusAttachments : {};
    lastMonsterBonusAttachmentsJson = JSON.stringify(mba);
    Object.entries(mba).forEach(([bonusId, monsterId]) => {
      if (bonusId && monsterId) {
        setBonusPowerMonsterAttachment(String(bonusId), String(monsterId));
      }
    });
    const nPlayers = Number(state?.num) || window.num || num || 0;
    updatePlayersUiVisibility(nPlayers);
    applyPlayerMetaBySeatFromServer(state.playerMetaBySeat);
    if (state.playerMetaBySeat && typeof state.playerMetaBySeat === "object") {
      pendingPlayerMetaSnapshot = null;
    }
    bindSeatIconHoverTooltips();
    UpdatebackImgDoor();
    UpdatebackImgTreasure();
    UpdateZones();
    adjustCardWidth(".myhand");
    adjustCardWidth(".zone2");
    adjustCardWidth(".zone5");
    adjustCardHeight(".zone3");
    adjustCardHeight(".zone_monster");
    adjustCardWidth(".opponenthand");
    recalculateAllPowerDisplays();
    applyTurnHighlight();
    try {
      window.dispatchEvent(new Event("munchkin:zonesChanged"));
    } catch {
    }
    gameStarted = true;
    hideRoomLobbyBar();
    const g = state.game && typeof state.game === "object" ? state.game : null;
    if (g) {
      if (Number.isFinite(Number(g.currentTurnSeat))) currentTurnSeat = Number(g.currentTurnSeat);
      if (Array.isArray(g.levelBySeat)) {
        g.levelBySeat.forEach((lvl, i3) => {
          setLevelBySeat(i3, lvl);
        });
      }
      if (Array.isArray(g.warriorFrenzyUsedBySeat)) {
        g.warriorFrenzyUsedBySeat.forEach((v, i3) => {
          warriorFrenzyUsedBySeat[i3] = Number(v) || 0;
        });
      }
      if (Array.isArray(g.warriorFrenzyBonusBySeat)) {
        g.warriorFrenzyBonusBySeat.forEach((v, i3) => {
          warriorFrenzyBonusBySeat[i3] = Number(v) || 0;
        });
      }
      if (Array.isArray(g.clericExorcismUsedBySeat)) {
        g.clericExorcismUsedBySeat.forEach((v, i3) => {
          clericExorcismUsedBySeat[i3] = Number(v) || 0;
        });
      }
      if (Array.isArray(g.clericExorcismBonusBySeat)) {
        g.clericExorcismBonusBySeat.forEach((v, i3) => {
          clericExorcismBonusBySeat[i3] = Number(v) || 0;
        });
      }
      if (Array.isArray(g.victimThiefTrimUsedBySeat)) {
        g.victimThiefTrimUsedBySeat.forEach((v, i3) => {
          victimThiefTrimUsedBySeat[i3] = Number(v) || 0;
        });
      }
      if (Array.isArray(g.thiefBackstabDebuffBySeat)) {
        g.thiefBackstabDebuffBySeat.forEach((v, i3) => {
          thiefBackstabDebuffBySeat[i3] = Number(v) || 0;
        });
      }
      if (Number.isFinite(Number(g.myBonus))) {
        const el = document.getElementById("MyBonus");
        if (el) el.textContent = String(Number(g.myBonus) || 0);
      }
      if (Number.isFinite(Number(g.monsterBasePower))) {
        setMonsterBasePower(Number(g.monsterBasePower) || 0);
      }
      if (g.turnPhase && typeof g.turnPhase === "object" && g.turnPhase.v === 1) {
        applyTurnPhaseFromServer(g.turnPhase);
      }
      applyTurnHighlight();
      if (g.timerRunning && Number(g.turnStartedAt) > 0 && Number(g.turnDurationMs) > 0) {
        if (!getMonsterBattleContext().hasMonster) {
          updateTurnActionButtons(false);
        } else {
          const remainingMs = Number(g.turnDurationMs) - (Date.now() - Number(g.turnStartedAt));
          const remainingSec = Math.max(1, Math.ceil(remainingMs / 1e3));
          updateTurnActionButtons(true);
          timer(remainingSec, true);
        }
      } else {
        updateTurnActionButtons(false);
      }
      lastTurnStateSyncJson = JSON.stringify(serializeTurnPhaseForServer());
    }
    wireEndTurnButtonClick();
    initializeSellTreasuresUi();
    const thiefTheftInitBtn = document.getElementById("thief-theft-btn");
    if (thiefTheftInitBtn) {
      thiefTheftInitBtn.onclick = () => openThiefTheftModal();
    }
    const thiefTrimInitBtn = document.getElementById("thief-trim-btn");
    if (thiefTrimInitBtn) {
      thiefTrimInitBtn.onclick = () => openThiefTrimModal();
    }
    const wizardTamingInitBtn = document.getElementById("wizard-taming-btn");
    if (wizardTamingInitBtn) {
      wizardTamingInitBtn.onclick = () => openWizardTamingModal();
    }
    updateWizardTamingUi();
    updateWizardFlightUi();
    updateThiefTheftUi();
    updateThiefTrimUi();
    setupMunchkinDiceAfterGameStart();
    try {
      document.querySelector(".button_start_game")?.remove?.();
      window.button = null;
    } catch {
    }
    ensureRoomOpenModalsMutationObserver();
    if (g) {
      restoreOpenModalsFromServerGameState(g);
    }
    reopenEphemeralUiAfterTurnPhaseRestore();
    syncLocalProfileFromStorageToSeatCharacter();
  }
  function getMonsterBasePower() {
    const el = document.querySelector(".MonsterBonus");
    if (!el) {
      return 0;
    }
    const fromDataset = Number(el.dataset?.basePower);
    if (Number.isFinite(fromDataset)) {
      return fromDataset;
    }
    const base = computeMonsterZoneBasePower();
    el.dataset.basePower = String(base);
    return base;
  }
  function setMonsterBasePower(value2) {
    const el = document.querySelector(".MonsterBonus");
    if (!el) {
      return;
    }
    let v = Number(value2) || 0;
    el.dataset.basePower = String(v);
    updateEffectiveMonsterBonusDisplay();
  }
  function computeMonsterZoneBasePower() {
    const zoneCards = document.querySelectorAll(".zone_monster .card");
    let sum = 0;
    zoneCards.forEach((cardEl) => {
      const door96 = window.doors?.find((d) => d.name === cardEl.id);
      if (door96) {
        if (door96.race === "monster") {
          sum += Number(door96.power) || 0;
          return;
        }
        if (String(door96.special || "") === "Mate") {
          const srcId = String(cardEl.dataset?.mateSourceMonsterId || "");
          if (!srcId) {
            return;
          }
          const srcDoor = window.doors?.find((d) => d.name === srcId);
          if (srcDoor && String(srcDoor.race || "") === "monster") {
            sum += Number(srcDoor.power) || 0;
          }
          return;
        }
        if (String(door96.special || "") === "bonus_power_monster") {
          const attachedTo = cardEl.dataset?.attachedMonsterId;
          if (attachedTo) {
            const targetEl = document.getElementById(attachedTo);
            const targetDoor = targetEl ? window.doors?.find((d) => d.name === targetEl.id) : null;
            const isTargetInMonsterZone = Boolean(targetEl?.closest?.(".zone_monster"));
            const isTargetMonsterLike = Boolean(
              targetDoor && targetDoor.race === "monster" || targetDoor && String(targetDoor.special || "") === "Mate" && String(targetEl.dataset?.mateSourceMonsterId || "")
            );
            if (isTargetInMonsterZone && isTargetMonsterLike) {
              const mult = getMateBonusMultiplierForTargetEl(targetEl);
              sum += (Number(door96.power) || 0) * mult;
            }
          }
          return;
        }
        return;
      }
      const treasure74 = window.treasures?.find((t) => t.name === cardEl.id);
      if (treasure74 && treasure74.oneTime) {
        const bonus = Number(treasure74.power) || 0;
        if (bonus !== 0) {
          sum += bonus;
        }
      }
    });
    return sum;
  }
  function isActiveMatePairId(pairId) {
    if (!pairId) {
      return false;
    }
    const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
    if (!zone) {
      return false;
    }
    let count = 0;
    zone.querySelectorAll(".card").forEach((el) => {
      if (String(el?.dataset?.matePairId || "") === String(pairId)) {
        count += 1;
      }
    });
    return count >= 2;
  }
  function getMateBonusMultiplierForTargetEl(targetEl) {
    const pairId = String(targetEl?.dataset?.matePairId || "");
    return isActiveMatePairId(pairId) ? 2 : 1;
  }
  function setBonusPowerMonsterAttachment(cardId, monsterCardId) {
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    el.dataset.attachedMonsterId = monsterCardId || "";
    recalculateAllPowerDisplays();
  }
  function collectMonsterBonusAttachmentsFromDom() {
    const out = {};
    const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
    if (!zone) {
      return out;
    }
    zone.querySelectorAll(".card").forEach((el) => {
      const id = el?.id;
      if (!id) {
        return;
      }
      const door96 = window.doors?.find((d) => d.name === id);
      if (!door96 || String(door96.special || "") !== "bonus_power_monster") {
        return;
      }
      const att = String(el.dataset?.attachedMonsterId || "").trim();
      if (att) {
        out[String(id)] = att;
      }
    });
    return out;
  }
  function pushMonsterBonusAttachmentsToServer() {
    if (typeof socket_default === "undefined" || !socket_default || typeof socket_default.emit !== "function") {
      return;
    }
    const attachments = collectMonsterBonusAttachmentsFromDom();
    const json = JSON.stringify(attachments);
    if (json === lastMonsterBonusAttachmentsJson) {
      return;
    }
    lastMonsterBonusAttachmentsJson = json;
    socket_default.emit("message", { method: "MonsterBonusState", attachments });
  }
  function collectVisibleModalIdsForRoomUiSync() {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    document.querySelectorAll("[id]").forEach((el) => {
      const id = el.id;
      if (!id || seen.has(id)) {
        return;
      }
      if (!id.includes("modal") && id !== "escape-monster-picker") {
        return;
      }
      if (id === "instant-wall-modal" || id === "flask-glue-modal") {
        return;
      }
      seen.add(id);
      if (!el.isConnected) {
        return;
      }
      const st = window.getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") {
        return;
      }
      out.push(id);
    });
    return out;
  }
  function pushOpenModalsToServerDebounced() {
    if (openModalsSyncTimer) {
      clearTimeout(openModalsSyncTimer);
    }
    openModalsSyncTimer = setTimeout(() => {
      openModalsSyncTimer = null;
      if (typeof socket_default === "undefined" || !socket_default || typeof socket_default.emit !== "function") {
        return;
      }
      if (localSeat == null || Number.isNaN(Number(localSeat))) {
        return;
      }
      const ids = collectVisibleModalIdsForRoomUiSync();
      const json = JSON.stringify(ids);
      if (json === lastOpenModalIdsJson) {
        return;
      }
      lastOpenModalIdsJson = json;
      socket_default.emit("message", { method: "RoomUiState", seat: localSeat, openModalIds: ids });
    }, 200);
  }
  function ensureRoomOpenModalsMutationObserver() {
    if (openModalsObserverStarted || typeof MutationObserver === "undefined") {
      return;
    }
    if (!document.body) {
      return;
    }
    openModalsObserverStarted = true;
    const obs = new MutationObserver(() => pushOpenModalsToServerDebounced());
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "id"] });
  }
  function reopenEphemeralUiAfterTurnPhaseRestore() {
    if (deathLootActive && deathLootState && typeof deathLootState === "object") {
      const ix = Number(deathLootState.index);
      const idx = Number.isFinite(ix) ? ix : 0;
      const order = Array.isArray(deathLootState.lootersOrder) ? deathLootState.lootersOrder : [];
      const looterSeat = order[idx];
      const deadSeat = Number(deathLootState.deadSeat);
      const remaining = Array.isArray(deathLootState.remaining) ? deathLootState.remaining.filter(Boolean) : [];
      if (localSeat != null && !Number.isNaN(Number(localSeat)) && Number(localSeat) === Number(looterSeat) && remaining.length > 0 && !Number.isNaN(deadSeat)) {
        openDeathLootPickModal(deadSeat, looterSeat, remaining.slice());
        showLootStatus(`\u0422\u0432\u043E\u044F \u043E\u0447\u0435\u0440\u0435\u0434\u044C \u0433\u0440\u0430\u0431\u0438\u0442\u044C ${getSeatLabel(deadSeat)}`);
      } else {
        const lootModal = document.getElementById("death-loot-pick-modal");
        if (lootModal) {
          lootModal.remove();
        }
      }
    } else {
      const lootModal = document.getElementById("death-loot-pick-modal");
      if (lootModal) {
        lootModal.remove();
      }
    }
    if (canLocalUseWizardFlightNow()) {
      openWizardFlightModal();
    }
    if (escapeActive && escapeWaitingForRoll && escapeCurrentSeat != null && !Number.isNaN(Number(escapeCurrentSeat))) {
      hideEscapeMonsterPicker();
      showEscapeTurnText(escapeCurrentSeat);
      if (localSeat != null && Number(localSeat) === Number(escapeCurrentSeat)) {
        escapeRollInProgress = false;
      }
    }
    if (escapeBadStaffDicePending && Number.isFinite(Number(escapeBadStaffDicePending.penaltySeat))) {
      const ps = Number(escapeBadStaffDicePending.penaltySeat);
      showBattleResult("\u0421\u043C\u044B\u0432\u043A\u0430 \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C. \u0411\u0440\u043E\u0441\u044C \u043A\u0443\u0431\u0438\u043A, \u0447\u0442\u043E\u0431\u044B \u0443\u0437\u043D\u0430\u0442\u044C \u044D\u0444\u0444\u0435\u043A\u0442 \u043D\u0435\u043F\u043E\u0442\u0440\u0435\u0431\u0441\u0442\u0432\u0430.");
      if (localSeat != null && Number(localSeat) === ps) {
        escapeRollInProgress = false;
      }
    }
    const queueIdSet = new Set((escapeMonsterQueue || []).map((m) => String(m?.cardId || "")));
    const rawPickMonsters = escapeMonsterPickSession && Array.isArray(escapeMonsterPickSession.monsters) ? escapeMonsterPickSession.monsters : [];
    const monstersForPicker = rawPickMonsters.filter((m) => queueIdSet.has(String(m?.cardId || "")));
    if (escapeActive && !escapeWaitingForRoll && escapeMonsterPickSession && typeof escapeMonsterPickSession === "object" && monstersForPicker.length > 0 && Number(localSeat) === Number(escapeMonsterPickSession.seat)) {
      const pickSeat = Number(escapeMonsterPickSession.seat);
      const aidEntries = collectEscapeAidCardEntriesForSeat(pickSeat);
      const hasAid = aidEntries.length > 0;
      if (hasAid) {
        openEscapeAidOptionsModal();
      } else {
        maybeTryOpenEscapeAidOptionsModal();
      }
      if (!hasAid && !shouldSuppressEscapeMonsterPickBannerForSeat(pickSeat)) {
        showBattleResult("\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0431\u0443\u0434\u0435\u0448\u044C \u0441\u043C\u044B\u0432\u0430\u0442\u044C\u0441\u044F.");
        showEscapeMonsterPicker(monstersForPicker, (cardId) => {
          hideEscapeMonsterPicker();
          socket_default.emit("message", {
            method: "EscapeMonsterChosen",
            seat: localSeat,
            cardId
          });
        });
      }
    } else if (escapeMonsterPickSession && Number(localSeat) !== Number(escapeMonsterPickSession.seat)) {
      hideEscapeMonsterPicker();
      const pickSeat = Number(escapeMonsterPickSession.seat);
      if (monstersForPicker.length > 0 && !shouldSuppressEscapeMonsterPickBannerForSeat(pickSeat)) {
        showBattleResult(`${getSeatLabel(escapeMonsterPickSession.seat)} \u0432\u044B\u0431\u0438\u0440\u0430\u0435\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0434\u043B\u044F \u0441\u043C\u044B\u0432\u043A\u0438...`);
      }
    } else {
      hideEscapeMonsterPicker();
      if (!escapeActive) {
        clearEscapeMonsterPickSession();
      } else if (escapeMonsterPickSession && monstersForPicker.length === 0) {
        clearEscapeMonsterPickSession();
      }
    }
    maybeTryOpenEscapeAidOptionsModal();
  }
  function restoreOpenModalsFromServerGameState(g) {
    if (!g || typeof g.openModalsBySeat !== "object") {
      return;
    }
    if (localSeat == null || Number.isNaN(Number(localSeat))) {
      return;
    }
    const ids = Array.isArray(g.openModalsBySeat[String(localSeat)]) ? g.openModalsBySeat[String(localSeat)] : [];
    lastOpenModalIdsJson = JSON.stringify(ids);
    ids.forEach((id) => {
      if (!id || document.getElementById(id)) {
        return;
      }
      try {
        switch (id) {
          case "sell-treasures-modal":
            openSellTreasuresModal();
            break;
          case "player-profile-modal":
            openPlayerProfileModal2();
            break;
          case "warrior-frenzy-modal":
            openWarriorFrenzyModal();
            break;
          case "cleric-exorcism-modal":
            openClericExorcismModal();
            break;
          case "thief-theft-modal":
            openThiefTheftModal();
            break;
          case "thief-theft-steal-modal":
            openThiefTheftStealModal();
            break;
          case "thief-trim-modal":
            openThiefTrimModal();
            break;
          case "wizard-flight-modal":
            openWizardFlightModal();
            break;
          case "wizard-taming-modal":
            openWizardTamingModal();
            break;
          case "escape-aid-options-modal":
            maybeTryOpenEscapeAidOptionsModal();
            break;
          case "escape-rat-monster-modal":
            maybeTryOpenEscapeAidOptionsModal();
            break;
          default:
            break;
        }
      } catch {
      }
    });
  }
  function cloneTurnStateJson(value2) {
    if (value2 == null) {
      return null;
    }
    try {
      return JSON.parse(JSON.stringify(value2));
    } catch {
      return null;
    }
  }
  function serializeTurnPhaseForServer() {
    return {
      v: 1,
      currentTurnSeat: Number.isFinite(Number(currentTurnSeat)) ? Number(currentTurnSeat) : 0,
      battleActive: Boolean(battleActive),
      battleTurnSeat: battleTurnSeat == null || Number.isNaN(Number(battleTurnSeat)) ? null : Number(battleTurnSeat),
      monsterFightSeat: monsterFightSeat == null || Number.isNaN(Number(monsterFightSeat)) ? null : Number(monsterFightSeat),
      turnAwaitingManualEnd: Boolean(turnAwaitingManualEnd),
      pendingHelpSeats: Array.from(pendingHelpSeats || []).map((x) => Number(x)).filter((x) => !Number.isNaN(x)),
      acceptedHelperSeat: acceptedHelperSeat == null || Number.isNaN(Number(acceptedHelperSeat)) ? null : Number(acceptedHelperSeat),
      escapeActive: Boolean(escapeActive),
      escapeQueue: Array.isArray(escapeQueue) ? escapeQueue.map((x) => Number(x)).filter((x) => !Number.isNaN(x)) : [],
      escapeQueueIndex: Number.isFinite(Number(escapeQueueIndex)) ? Number(escapeQueueIndex) : -1,
      escapeMonsterRemover: Number(escapeMonsterRemover) || 0,
      escapeMonsterBadStaff: cloneTurnStateJson(escapeMonsterBadStaff),
      escapeMonsterQueue: Array.isArray(escapeMonsterQueue) ? cloneTurnStateJson(escapeMonsterQueue) : [],
      escapeMonsterInitialCount: Number(escapeMonsterInitialCount) || 0,
      escapeMonsterTemplateQueue: Array.isArray(escapeMonsterTemplateQueue) ? cloneTurnStateJson(escapeMonsterTemplateQueue) : [],
      escapeCurrentMonsterCardId: escapeCurrentMonsterCardId == null ? null : String(escapeCurrentMonsterCardId),
      escapeCurrentSeat: escapeCurrentSeat == null || Number.isNaN(Number(escapeCurrentSeat)) ? null : Number(escapeCurrentSeat),
      escapeWaitingForRoll: Boolean(escapeWaitingForRoll),
      escapeOwnerSeat: escapeOwnerSeat == null || Number.isNaN(Number(escapeOwnerSeat)) ? null : Number(escapeOwnerSeat),
      escapeRollInProgress: Boolean(escapeRollInProgress),
      escapeAttemptNumber: Number(escapeAttemptNumber) || 0,
      escapeHalflingRetryUsedForCurrentAttempt: Boolean(escapeHalflingRetryUsedForCurrentAttempt),
      escapeHalflingRetryPending: cloneTurnStateJson(escapeHalflingRetryPending),
      escapeBadStaffDicePending: cloneTurnStateJson(escapeBadStaffDicePending),
      escapeWizardFlightPending: cloneTurnStateJson(escapeWizardFlightPending),
      escapeMonsterPickSession: escapeWaitingForRoll || escapeCurrentMonsterCardId != null ? null : cloneTurnStateJson(escapeMonsterPickSession),
      deathLootActive: Boolean(deathLootActive),
      deathLootState: cloneTurnStateJson(deathLootState),
      resumeEscapeAfterLoot: Boolean(resumeEscapeAfterLoot),
      deathLootAwaitingEscapeFinish: Boolean(deathLootAwaitingEscapeFinish),
      thiefTheftBoardDicePending: Boolean(thiefTheftBoardDicePending),
      thiefTheftBoardDiceInProgress: Boolean(thiefTheftBoardDiceInProgress),
      foldCount: Number(window.FoldCount) || 0,
      foldedOnTurnSeat: foldedOnTurnSeat == null || Number.isNaN(Number(foldedOnTurnSeat)) ? null : Number(foldedOnTurnSeat),
      halflingDoubleSellUsedBySeat: halflingDoubleSellUsedBySeat.map((x) => Boolean(x)),
      sellTreasuresDelegated: Boolean(sellTreasuresDelegated),
      warriorFrenzyUsedBySeat: warriorFrenzyUsedBySeat.map((x) => Number(x) || 0),
      warriorFrenzyBonusBySeat: warriorFrenzyBonusBySeat.map((x) => Number(x) || 0),
      clericExorcismUsedBySeat: clericExorcismUsedBySeat.map((x) => Number(x) || 0),
      clericExorcismBonusBySeat: clericExorcismBonusBySeat.map((x) => Number(x) || 0),
      victimThiefTrimUsedBySeat: victimThiefTrimUsedBySeat.map((x) => Number(x) || 0),
      thiefBackstabDebuffBySeat: thiefBackstabDebuffBySeat.map((x) => Number(x) || 0)
    };
  }
  function applyTurnPhaseFromServer(tp) {
    if (!tp || typeof tp !== "object" || Number(tp.v) !== 1) {
      return;
    }
    if (Number.isFinite(Number(tp.currentTurnSeat))) {
      currentTurnSeat = Number(tp.currentTurnSeat);
    }
    battleActive = Boolean(tp.battleActive);
    battleTurnSeat = tp.battleTurnSeat == null || tp.battleTurnSeat === "" || Number.isNaN(Number(tp.battleTurnSeat)) ? null : Number(tp.battleTurnSeat);
    monsterFightSeat = !battleActive ? null : tp.monsterFightSeat == null || tp.monsterFightSeat === "" || Number.isNaN(Number(tp.monsterFightSeat)) ? null : Number(tp.monsterFightSeat);
    turnAwaitingManualEnd = Boolean(tp.turnAwaitingManualEnd);
    pendingHelpSeats = new Set(Array.isArray(tp.pendingHelpSeats) ? tp.pendingHelpSeats.filter((x) => Number.isFinite(Number(x))).map(Number) : []);
    acceptedHelperSeat = tp.acceptedHelperSeat == null || tp.acceptedHelperSeat === "" || Number.isNaN(Number(tp.acceptedHelperSeat)) ? null : Number(tp.acceptedHelperSeat);
    escapeActive = Boolean(tp.escapeActive);
    escapeQueue = Array.isArray(tp.escapeQueue) ? tp.escapeQueue.map(Number).filter((x) => !Number.isNaN(x)) : [];
    escapeQueueIndex = Number.isFinite(Number(tp.escapeQueueIndex)) ? Number(tp.escapeQueueIndex) : -1;
    escapeMonsterRemover = Number(tp.escapeMonsterRemover) || 0;
    escapeMonsterBadStaff = tp.escapeMonsterBadStaff == null ? null : normalizeBadStaff(tp.escapeMonsterBadStaff);
    escapeMonsterQueue = Array.isArray(tp.escapeMonsterQueue) ? tp.escapeMonsterQueue.slice() : [];
    escapeMonsterInitialCount = Number(tp.escapeMonsterInitialCount) || 0;
    escapeMonsterTemplateQueue = Array.isArray(tp.escapeMonsterTemplateQueue) ? tp.escapeMonsterTemplateQueue.slice() : [];
    escapeCurrentMonsterCardId = tp.escapeCurrentMonsterCardId == null || tp.escapeCurrentMonsterCardId === "" ? null : String(tp.escapeCurrentMonsterCardId);
    escapeCurrentSeat = tp.escapeCurrentSeat == null || tp.escapeCurrentSeat === "" || Number.isNaN(Number(tp.escapeCurrentSeat)) ? null : Number(tp.escapeCurrentSeat);
    escapeWaitingForRoll = Boolean(tp.escapeWaitingForRoll);
    escapeOwnerSeat = tp.escapeOwnerSeat == null || tp.escapeOwnerSeat === "" || Number.isNaN(Number(tp.escapeOwnerSeat)) ? null : Number(tp.escapeOwnerSeat);
    escapeRollInProgress = Boolean(tp.escapeRollInProgress);
    escapeAttemptNumber = Number(tp.escapeAttemptNumber) || 0;
    escapeHalflingRetryUsedForCurrentAttempt = Boolean(tp.escapeHalflingRetryUsedForCurrentAttempt);
    escapeHalflingRetryPending = cloneTurnStateJson(tp.escapeHalflingRetryPending);
    escapeBadStaffDicePending = tp.escapeBadStaffDicePending && typeof tp.escapeBadStaffDicePending === "object" && Number.isFinite(Number(tp.escapeBadStaffDicePending.penaltySeat)) ? {
      penaltySeat: Number(tp.escapeBadStaffDicePending.penaltySeat),
      deathAtOrBelow: Number(tp.escapeBadStaffDicePending.deathAtOrBelow) || 2
    } : null;
    escapeWizardFlightPending = cloneTurnStateJson(tp.escapeWizardFlightPending);
    escapeMonsterPickSession = tp.escapeMonsterPickSession && typeof tp.escapeMonsterPickSession === "object" && tp.escapeMonsterPickSession.seat != null && tp.escapeMonsterPickSession.seat !== "" ? cloneTurnStateJson(tp.escapeMonsterPickSession) : null;
    if (escapeMonsterPickSession && (escapeWaitingForRoll || escapeCurrentMonsterCardId != null)) {
      clearEscapeMonsterPickSession();
    }
    deathLootActive = Boolean(tp.deathLootActive);
    deathLootState = cloneTurnStateJson(tp.deathLootState);
    resumeEscapeAfterLoot = Boolean(tp.resumeEscapeAfterLoot);
    deathLootAwaitingEscapeFinish = Boolean(tp.deathLootAwaitingEscapeFinish);
    thiefTheftBoardDicePending = Boolean(tp.thiefTheftBoardDicePending);
    thiefTheftBoardDiceInProgress = Boolean(tp.thiefTheftBoardDiceInProgress);
    window.FoldCount = Number(tp.foldCount) || 0;
    foldedOnTurnSeat = tp.foldedOnTurnSeat == null || tp.foldedOnTurnSeat === "" || Number.isNaN(Number(tp.foldedOnTurnSeat)) ? null : Number(tp.foldedOnTurnSeat);
    if (Array.isArray(tp.halflingDoubleSellUsedBySeat)) {
      tp.halflingDoubleSellUsedBySeat.forEach((v, i3) => {
        if (i3 < halflingDoubleSellUsedBySeat.length) {
          halflingDoubleSellUsedBySeat[i3] = Boolean(v);
        }
      });
    }
    if (typeof tp.sellTreasuresDelegated === "boolean") {
      sellTreasuresDelegated = tp.sellTreasuresDelegated;
    }
    if (Array.isArray(tp.warriorFrenzyUsedBySeat)) {
      tp.warriorFrenzyUsedBySeat.forEach((v, i3) => {
        if (i3 < warriorFrenzyUsedBySeat.length) {
          warriorFrenzyUsedBySeat[i3] = Number(v) || 0;
        }
      });
    }
    if (Array.isArray(tp.warriorFrenzyBonusBySeat)) {
      tp.warriorFrenzyBonusBySeat.forEach((v, i3) => {
        if (i3 < warriorFrenzyBonusBySeat.length) {
          warriorFrenzyBonusBySeat[i3] = Number(v) || 0;
        }
      });
    }
    if (Array.isArray(tp.clericExorcismUsedBySeat)) {
      tp.clericExorcismUsedBySeat.forEach((v, i3) => {
        if (i3 < clericExorcismUsedBySeat.length) {
          clericExorcismUsedBySeat[i3] = Number(v) || 0;
        }
      });
    }
    if (Array.isArray(tp.clericExorcismBonusBySeat)) {
      tp.clericExorcismBonusBySeat.forEach((v, i3) => {
        if (i3 < clericExorcismBonusBySeat.length) {
          clericExorcismBonusBySeat[i3] = Number(v) || 0;
        }
      });
    }
    if (Array.isArray(tp.victimThiefTrimUsedBySeat)) {
      tp.victimThiefTrimUsedBySeat.forEach((v, i3) => {
        if (i3 < victimThiefTrimUsedBySeat.length) {
          victimThiefTrimUsedBySeat[i3] = Number(v) || 0;
        }
      });
    }
    if (Array.isArray(tp.thiefBackstabDebuffBySeat)) {
      tp.thiefBackstabDebuffBySeat.forEach((v, i3) => {
        if (i3 < thiefBackstabDebuffBySeat.length) {
          thiefBackstabDebuffBySeat[i3] = Number(v) || 0;
        }
      });
    }
    applyTurnHighlight();
    updateHelpUi();
    updateThiefTheftUi();
    updateWizardFlightUi();
    updateThiefTrimUi();
    updateWarriorFrenzyUi();
    updateClericExorcismUi();
    updateWizardTamingUi();
  }
  function scheduleTurnStateSync() {
    if (!gameStarted) {
      return;
    }
    if (turnStateSyncTimer) {
      clearTimeout(turnStateSyncTimer);
    }
    turnStateSyncTimer = setTimeout(() => {
      turnStateSyncTimer = null;
      const turnPhase = serializeTurnPhaseForServer();
      const json = JSON.stringify(turnPhase);
      if (json === lastTurnStateSyncJson) {
        return;
      }
      lastTurnStateSyncJson = json;
      socket_default.emit("message", { method: "TurnStateSync", turnPhase });
    }, 380);
  }
  function flushTurnStateSyncToServer() {
    if (!gameStarted) {
      return;
    }
    if (turnStateSyncTimer) {
      clearTimeout(turnStateSyncTimer);
      turnStateSyncTimer = null;
    }
    const turnPhase = serializeTurnPhaseForServer();
    const json = JSON.stringify(turnPhase);
    lastTurnStateSyncJson = json;
    if (typeof socket_default !== "undefined" && socket_default && typeof socket_default.emit === "function") {
      socket_default.emit("message", { method: "TurnStateSync", turnPhase });
    }
  }
  function getMonsterCardsInBattleZone() {
    const monsters = [];
    document.querySelectorAll(".zone_monster .card").forEach((el) => {
      const door96 = window.doors?.find((d) => d.name === el.id);
      if (door96 && (door96.race === "monster" || String(door96.special || "") === "Mate" && String(el.dataset?.mateSourceMonsterId || ""))) {
        monsters.push({ cardId: el.id, img: door96.img || "" });
      }
    });
    return monsters;
  }
  function getAttachedMonsterBonusCards(monsterCardId) {
    if (!monsterCardId) {
      return [];
    }
    const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
    if (!zone) {
      return [];
    }
    const groupIds = /* @__PURE__ */ new Set([String(monsterCardId)]);
    const monsterEl = document.getElementById(monsterCardId);
    const pairId = String(monsterEl?.dataset?.matePairId || "");
    if (pairId && isActiveMatePairId(pairId)) {
      zone.querySelectorAll(".card").forEach((zEl) => {
        if (String(zEl?.dataset?.matePairId || "") === pairId && zEl?.id) {
          groupIds.add(String(zEl.id));
        }
      });
    }
    const out = [];
    zone.querySelectorAll(".card").forEach((el) => {
      const cardId = el?.id;
      if (!cardId) {
        return;
      }
      const door96 = window.doors?.find((d) => d.name === cardId);
      if (!door96 || String(door96.special || "") !== "bonus_power_monster") {
        return;
      }
      if (!groupIds.has(String(el.dataset?.attachedMonsterId || ""))) {
        return;
      }
      out.push({ cardId, img: door96.img || "" });
    });
    return out;
  }
  function getAttachedMonsterBonusPowerSum(monsterCardId) {
    return getAttachedMonsterBonusCards(monsterCardId).reduce((acc, c) => {
      const door96 = window.doors?.find((d) => d.name === c.cardId);
      return acc + (Number(door96?.power) || 0);
    }, 0);
  }
  function openMonsterBonusAttachModal(bonusCardId) {
    const monsters = getMonsterCardsInBattleZone();
    if (monsters.length <= 0) {
      return;
    }
    if (monsters.length === 1) {
      socket_default.emit("message", {
        method: "MonsterBonusAttach",
        bonusCardId,
        monsterCardId: monsters[0].cardId
      });
      return;
    }
    const existing = document.getElementById("monster-bonus-attach-modal");
    if (existing) {
      existing.remove();
    }
    const modal = document.createElement("div");
    modal.id = "monster-bonus-attach-modal";
    modal.className = "wizard-taming-pick-modal monster-bonus-attach-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel monster-bonus-attach-panel";
    const title = document.createElement("div");
    title.className = "monster-bonus-attach-title";
    title.textContent = "\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0434\u043B\u044F \u0431\u043E\u043D\u0443\u0441\u0430";
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "wizard-taming-pick-cards";
    monsters.forEach((m) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wizard-taming-pick-card";
      b.dataset.cardId = m.cardId;
      const img = document.createElement("img");
      img.className = "wizard-taming-pick-card-img";
      img.src = m.img;
      img.alt = m.cardId;
      b.appendChild(img);
      const bonusSum = getAttachedMonsterBonusPowerSum(m.cardId);
      const sumEl = document.createElement("div");
      sumEl.className = "monster-bonus-attach-sum";
      sumEl.textContent = bonusSum ? `\u0411\u043E\u043D\u0443\u0441: ${bonusSum > 0 ? `+${bonusSum}` : String(bonusSum)}` : "\u0411\u043E\u043D\u0443\u0441: 0";
      sumEl.style.marginTop = "4px";
      sumEl.style.fontSize = "16px";
      sumEl.style.color = "#ffd37a";
      sumEl.style.textAlign = "center";
      b.appendChild(sumEl);
      const attachedBonuses = getAttachedMonsterBonusCards(m.cardId);
      if (attachedBonuses.length > 0) {
        const bonusesWrap = document.createElement("div");
        bonusesWrap.className = "monster-bonus-attach-bonuses";
        bonusesWrap.style.display = "flex";
        bonusesWrap.style.flexWrap = "wrap";
        bonusesWrap.style.justifyContent = "center";
        bonusesWrap.style.gap = "6px";
        bonusesWrap.style.marginTop = "6px";
        attachedBonuses.forEach((bc) => {
          const bi = document.createElement("img");
          bi.className = "monster-bonus-attach-bonus-img";
          bi.src = bc.img || "";
          bi.alt = bc.cardId;
          bi.style.width = "40px";
          bi.style.height = "auto";
          bi.style.borderRadius = "6px";
          bonusesWrap.appendChild(bi);
        });
        b.appendChild(bonusesWrap);
      }
      b.addEventListener("click", () => {
        socket_default.emit("message", {
          method: "MonsterBonusAttach",
          bonusCardId,
          monsterCardId: m.cardId
        });
        modal.remove();
      });
      cardsContainer.appendChild(b);
    });
    panel.appendChild(title);
    panel.appendChild(cardsContainer);
    modal.appendChild(panel);
    document.body.appendChild(modal);
  }
  function scheduleMonsterBonusAttachIfNeeded(cardId, zoneEl) {
    if (!cardId || !zoneEl) {
      return;
    }
    const isMonsterBonusZone = zoneEl.id === "zone_monster" || zoneEl.classList?.contains("zone_monster");
    if (!isMonsterBonusZone) {
      return;
    }
    const door96 = window.doors?.find((d) => d.name === cardId);
    if (!door96 || String(door96.special || "") !== "bonus_power_monster") {
      return;
    }
    if (getMonsterCardsInBattleZone().length <= 0) {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    if (el.dataset?.attachedMonsterId) {
      return;
    }
    setTimeout(() => {
      const cardEl = document.getElementById(cardId);
      if (!cardEl) {
        return;
      }
      const inMonsterZoneNow = !!cardEl.closest?.(".zone_monster") || cardEl.parentElement?.id === "zone_monster";
      if (!inMonsterZoneNow) {
        return;
      }
      openMonsterBonusAttachModal(cardId);
    }, 30);
  }
  function hideWanderingMonsterPickModal() {
    const existing = document.getElementById("wandering-monster-pick-modal");
    if (existing) {
      existing.remove();
    }
  }
  function getLocalHandMonsterCardsForWanderingMonster() {
    const cards = [];
    const handEl = document.querySelector(".myhand");
    if (!handEl) {
      return cards;
    }
    handEl.querySelectorAll(".card").forEach((cardEl) => {
      const cardId = cardEl?.id;
      if (!cardId) {
        return;
      }
      const door96 = window.doors?.find((d) => d.name === cardId);
      if (!door96 || String(door96.race || "") !== "monster") {
        return;
      }
      cards.push({
        cardId,
        img: door96.img || ""
      });
    });
    return cards;
  }
  function openWanderingMonsterPickModal(wanderingCardId) {
    hideWanderingMonsterPickModal();
    const monstersInHand = getLocalHandMonsterCardsForWanderingMonster();
    if (monstersInHand.length <= 0) {
      showBattleResult("\u0412 \u0440\u0443\u043A\u0435 \u043D\u0435\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u043E\u0432 \u0434\u043B\u044F Wandering Monster.");
      setTimeout(hideBattleResult, 1800);
      return;
    }
    const modal = document.createElement("div");
    modal.id = "wandering-monster-pick-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "Wandering Monster: \u0432\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0438\u0437 \u0440\u0443\u043A\u0438";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-pick-cards";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0432 \u0431\u043E\u0439";
    applyBtn.disabled = true;
    let selectedMonster = null;
    monstersInHand.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.cardId = m.cardId;
      const img = document.createElement("img");
      img.className = "wizard-taming-pick-card-img";
      img.src = m.img || "";
      img.alt = m.cardId;
      btn.appendChild(img);
      btn.addEventListener("click", () => {
        cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selectedMonster = m.cardId;
        applyBtn.disabled = !selectedMonster;
      });
      cardsWrap.appendChild(btn);
    });
    applyBtn.addEventListener("click", () => {
      if (!selectedMonster) {
        return;
      }
      socket_default.emit("message", {
        method: "moveCard",
        cardId: selectedMonster,
        targetId: null,
        zoneId: "zone_monster"
      });
      modal.remove();
    });
    panel.appendChild(title);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function scheduleWanderingMonsterIfNeeded(cardId, zoneEl, fromZoneId) {
    if (!cardId || !zoneEl) {
      return;
    }
    if (String(fromZoneId || "").trim() === "zone_doors") {
      return;
    }
    const onMonster = zoneEl.id === "zone_monster" || zoneEl.classList?.contains?.("zone_monster");
    const onZone3 = String(zoneEl.id) === "zone3";
    if (!onMonster && !onZone3) {
      return;
    }
    const door96 = window.doors?.find((d) => d.name === cardId);
    if (!door96 || String(door96.special || "") !== "Wandering Monster") {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el) {
      return;
    }
    setTimeout(() => {
      const cardEl = document.getElementById(cardId);
      if (!cardEl) {
        return;
      }
      const p = cardEl.parentElement;
      const pid = String(p?.id || "");
      const inMonster = !!cardEl.closest?.(".zone_monster") || pid === "zone_monster";
      const inZone3 = pid === "zone3";
      if (!inMonster && !inZone3) {
        return;
      }
      openWanderingMonsterPickModal(cardId);
    }, 30);
  }
  function isDoorSpecial(cardId, specialValue) {
    const door96 = window.doors?.find((d) => d.name === cardId);
    return Boolean(door96 && String(door96.special || "") === String(specialValue || ""));
  }
  function isTreasureSpecial(cardId, specialValue) {
    const tr = window.treasures?.find((t) => t.name === cardId);
    return Boolean(tr && String(tr.special || "") === String(specialValue || ""));
  }
  function canPlaceDopplegangerTreasureInBonusZone(cardEl, zoneEl) {
    if (!cardEl || !zoneEl || String(zoneEl.id) !== "zone3") {
      return true;
    }
    if (!isTreasureSpecial(cardEl.id, "Doppleganger")) {
      return true;
    }
    if (localSeat == null || localSeat < 0) {
      return false;
    }
    if (!battleActive) {
      return false;
    }
    if (acceptedHelperSeat !== null) {
      return false;
    }
    if (Number(localSeat) !== Number(getMonsterFightSeat())) {
      return false;
    }
    return true;
  }
  function canPlaceYuppieWaterTreasureInBonusZone(cardEl, zoneEl) {
    if (!cardEl || !zoneEl || String(zoneEl.id) !== "zone3") {
      return true;
    }
    if (!isTreasureSpecial(cardEl.id, "Yuppie water")) {
      return true;
    }
    if (!battleActive) {
      return false;
    }
    const fightSeat = getMonsterFightSeat();
    const hasElfFighter = fightSeat != null && seatHasRace(fightSeat, "Elf");
    const hasElfHelper = acceptedHelperSeat != null && seatHasRace(acceptedHelperSeat, "Elf");
    return Boolean(hasElfFighter || hasElfHelper);
  }
  function getHirelingCardInMainForSeat(seat) {
    const { main } = getMainAndSideZoneElementsForSeat(seat);
    if (!main) {
      return null;
    }
    const candidates = Array.from(main.querySelectorAll(".card"));
    return candidates.find((el) => isTreasureSpecial(el.id, "Hireling")) || null;
  }
  function someSeatHasHirelingEquipped() {
    const n = effectiveSeatLayoutPlayerCount();
    if (!Number.isFinite(n) || n <= 0) {
      return false;
    }
    for (let s = 0; s < n; s++) {
      const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
      for (const z of [main, side]) {
        if (!z) {
          continue;
        }
        for (const el of z.querySelectorAll(".card")) {
          if (el?.id && isTreasureSpecial(el.id, "Hireling")) {
            return true;
          }
        }
      }
    }
    return false;
  }
  function pickHirelingCardIdToKillForLevelPlay(levelTargetSeat) {
    const s = Number(levelTargetSeat);
    if (Number.isFinite(s) && s >= 0) {
      const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
      for (const z of [main, side]) {
        if (!z) {
          continue;
        }
        for (const el of z.querySelectorAll(".card")) {
          if (el?.id && isTreasureSpecial(el.id, "Hireling")) {
            return String(el.id);
          }
        }
      }
    }
    const n = effectiveSeatLayoutPlayerCount();
    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }
    for (let si = 0; si < n; si++) {
      const { main, side } = getMainAndSideZoneElementsForSeat(si) || {};
      for (const z of [main, side]) {
        if (!z) {
          continue;
        }
        for (const el of z.querySelectorAll(".card")) {
          if (el?.id && isTreasureSpecial(el.id, "Hireling")) {
            return String(el.id);
          }
        }
      }
    }
    return null;
  }
  function seatCanReceiveWhineAtGM(seat) {
    const s = Number(seat);
    if (!Number.isFinite(s) || s < 0) {
      return false;
    }
    const n = effectiveSeatLayoutPlayerCount();
    if (!Number.isFinite(n) || n <= 0) {
      return true;
    }
    let maxL = 1;
    for (let i3 = 0; i3 < n; i3++) {
      let lv = levelBySeat[i3];
      if (lv == null || Number.isNaN(lv)) {
        lv = 1;
      }
      lv = Math.max(1, Math.floor(Number(lv)));
      if (lv > maxL) {
        maxL = lv;
      }
    }
    let targetLv = levelBySeat[s];
    if (targetLv == null || Number.isNaN(targetLv)) {
      targetLv = 1;
    }
    targetLv = Math.max(1, Math.floor(Number(targetLv)));
    return targetLv < maxL;
  }
  function setHirelingAttachment(hirelingCardId, treasureCardId) {
    const hirelingEl = document.getElementById(hirelingCardId);
    const trEl = document.getElementById(treasureCardId);
    if (!hirelingEl || !trEl) {
      return;
    }
    hirelingEl.dataset.hirelingAttachedTreasureId = treasureCardId || "";
    trEl.dataset.hirelingCardId = hirelingCardId || "";
    recalculateAllPowerDisplays();
  }
  function clearHirelingAttachment(hirelingCardId, treasureCardId) {
    const hirelingEl = hirelingCardId ? document.getElementById(hirelingCardId) : null;
    const trEl = treasureCardId ? document.getElementById(treasureCardId) : null;
    if (hirelingEl && String(hirelingEl.dataset?.hirelingAttachedTreasureId || "") === String(treasureCardId || "")) {
      hirelingEl.dataset.hirelingAttachedTreasureId = "";
    }
    if (trEl && String(trEl.dataset?.hirelingCardId || "") === String(hirelingCardId || "")) {
      trEl.dataset.hirelingCardId = "";
    }
    recalculateAllPowerDisplays();
  }
  function canEquipTreasureToMainStrict(seat, treasureEl) {
    const treasure74 = window.treasures?.find((t) => t.name === treasureEl?.id);
    if (!treasure74) {
      return true;
    }
    const { main, side } = getMainAndSideZoneElementsForSeat(seat);
    if (!main) {
      return true;
    }
    if (!doesTreasureRestrictionsAllowSeat(treasure74, seat)) {
      return false;
    }
    const allPlayerCards = [];
    const pushUnique = (cardEl) => {
      if (cardEl && allPlayerCards.indexOf(cardEl) === -1) {
        allPlayerCards.push(cardEl);
      }
    };
    main.querySelectorAll(".card").forEach(pushUnique);
    side?.querySelectorAll?.(".card")?.forEach(pushUnique);
    let existingBigTotal = 0;
    allPlayerCards.forEach((el) => {
      if (!el || el === treasureEl) {
        return;
      }
      if (el?.dataset?.cheatCardId || el?.dataset?.hirelingCardId) {
        return;
      }
      const t = window.treasures?.find((tr) => tr.name === el.id);
      if (t) {
        existingBigTotal += Number(t.big) || 0;
      }
    });
    const draggedBig = Number(treasure74.big) || 0;
    const nextBigTotal = existingBigTotal + draggedBig;
    const dwarfUnlimitedBig = isSeatDwarfRaceActive(seat);
    if (!dwarfUnlimitedBig && nextBigTotal > 1) {
      return false;
    }
    const mainCards = Array.from(main.querySelectorAll(".card"));
    let body = 0;
    let hand = 0;
    let footwear = 0;
    let hat = 0;
    let big = 0;
    mainCards.forEach((el) => {
      if (!el || el === treasureEl) {
        return;
      }
      if (el?.dataset?.cheatCardId || el?.dataset?.hirelingCardId) {
        return;
      }
      const t = window.treasures?.find((tr) => tr.name === el.id);
      if (t) {
        body += Number(t.body) || 0;
        hand += Number(t.hand) || 0;
        footwear += Number(t.footwear) || 0;
        hat += Number(t.hat) || 0;
        big += Number(t.big) || 0;
      }
    });
    body += Number(treasure74.body) || 0;
    hand += Number(treasure74.hand) || 0;
    footwear += Number(treasure74.footwear) || 0;
    hat += Number(treasure74.hat) || 0;
    big += Number(treasure74.big) || 0;
    return isEquipmentSumsValid(body, hand, footwear, hat, big);
  }
  function hideHirelingOfferModal() {
    const existing = document.getElementById("hireling-offer-modal");
    if (existing) {
      existing.remove();
    }
  }
  function openHirelingOfferModal({ seat, treasureCardId, fromZoneId }) {
    hideHirelingOfferModal();
    if (seat == null || !treasureCardId) {
      return;
    }
    const hirelingEl = getHirelingCardInMainForSeat(seat);
    if (!hirelingEl) {
      return;
    }
    const modal = document.createElement("div");
    modal.id = "hireling-offer-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "\u041D\u0430\u0451\u043C\u043D\u0438\u0447\u0435\u043A: \u043E\u0442\u0434\u0430\u0442\u044C \u0435\u043C\u0443 \u0448\u043C\u043E\u0442\u043A\u0443?";
    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.gap = "10px";
    buttons.style.justifyContent = "center";
    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "wizard-taming-pick-apply-btn";
    yesBtn.textContent = "\u0414\u0430";
    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "wizard-taming-pick-apply-btn";
    noBtn.textContent = "\u041D\u0435\u0442";
    yesBtn.addEventListener("click", () => {
      socket_default.emit("message", {
        method: "MercenaryAttach",
        seat,
        hirelingCardId: hirelingEl.id,
        treasureCardId
      });
      modal.remove();
    });
    noBtn.addEventListener("click", () => {
      const trEl = document.getElementById(treasureCardId);
      const okNormally = trEl ? canEquipTreasureToMainStrict(seat, trEl) : true;
      if (!okNormally) {
        const backZoneId = fromZoneId || getHandElementForPlayerSeat(seat)?.id || null;
        if (backZoneId) {
          socket_default.emit("message", {
            method: "moveCard",
            cardId: treasureCardId,
            targetId: null,
            zoneId: backZoneId
          });
        }
      }
      modal.remove();
    });
    buttons.appendChild(yesBtn);
    buttons.appendChild(noBtn);
    panel.appendChild(title);
    panel.appendChild(buttons);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function applyCheatVisualPlacement(cheatCardId, treasureCardId) {
    const cheatEl = document.getElementById(cheatCardId);
    const trEl = document.getElementById(treasureCardId);
    if (!cheatEl || !trEl) {
      return;
    }
    const cheatImgEl = cheatEl.querySelector?.(".card-item");
    const cheatImgSrc = cheatImgEl?.src || "";
    if (cheatImgSrc) {
      trEl.style.setProperty("--cheat-img", `url("${cheatImgSrc}")`);
    }
    trEl.classList.add("cheat-host-card");
    cheatEl.classList.add("cheat-attached-hidden");
    cheatEl.draggable = false;
  }
  function clearCheatVisualPlacement(cheatCardId, treasureCardId) {
    const cheatEl = cheatCardId ? document.getElementById(cheatCardId) : null;
    const trEl = treasureCardId ? document.getElementById(treasureCardId) : null;
    if (cheatEl) {
      cheatEl.classList.remove("cheat-attached-hidden");
      cheatEl.draggable = true;
    }
    if (trEl) {
      trEl.classList.remove("cheat-host-card");
      trEl.style.removeProperty("--cheat-img");
    }
  }
  function setCheatAttachment(cheatCardId, treasureCardId) {
    const cheatEl = document.getElementById(cheatCardId);
    const trEl = document.getElementById(treasureCardId);
    if (!cheatEl || !trEl) {
      return;
    }
    cheatEl.dataset.cheatAttachedTreasureId = treasureCardId || "";
    trEl.dataset.cheatCardId = cheatCardId || "";
    applyCheatVisualPlacement(cheatCardId, treasureCardId);
    recalculateAllPowerDisplays();
  }
  function hideCheatAttachModal() {
    const existing = document.getElementById("cheat-attach-modal");
    if (existing) {
      existing.remove();
    }
  }
  function openCheatAttachModal(cheatCardId, seat) {
    hideCheatAttachModal();
    if (!cheatCardId || seat == null) {
      return;
    }
    const { main, side } = getMainAndSideZoneElementsForSeat(seat);
    const handEl = Number(seat) === Number(localSeat) ? document.querySelector(".myhand") : null;
    if (!main) {
      return;
    }
    const options2 = [];
    const pushTreasureOption = (cardId, from, fromZoneId = null) => {
      const tr = window.treasures?.find((t) => t.name === cardId);
      if (!tr) {
        return;
      }
      if (tr.oneTime) {
        return;
      }
      options2.push({ cardId, img: tr.img || "", from, fromZoneId });
    };
    main.querySelectorAll(".card").forEach((el) => pushTreasureOption(el.id, "equip", main.id || null));
    side?.querySelectorAll?.(".card")?.forEach((el) => pushTreasureOption(el.id, "equip", side?.id || null));
    handEl?.querySelectorAll?.(".card")?.forEach((el) => pushTreasureOption(el.id, "hand", handEl?.id || null));
    if (options2.length <= 0) {
      showBattleResult("\u041D\u0435\u0442 \u0448\u043C\u043E\u0442\u043E\u043A, \u043A \u043A\u043E\u0442\u043E\u0440\u044B\u043C \u043C\u043E\u0436\u043D\u043E \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C Cheat.");
      setTimeout(hideBattleResult, 1800);
      return;
    }
    const modal = document.createElement("div");
    modal.id = "cheat-attach-modal";
    modal.className = "wizard-taming-pick-modal";
    const panel = document.createElement("div");
    panel.className = "wizard-taming-pick-panel";
    const title = document.createElement("div");
    title.className = "wizard-taming-pick-title";
    title.textContent = "Cheat: \u0432\u044B\u0431\u0435\u0440\u0438 \u0448\u043C\u043E\u0442\u043A\u0443";
    const cardsWrap = document.createElement("div");
    cardsWrap.className = "wizard-taming-pick-cards";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "wizard-taming-pick-apply-btn";
    applyBtn.textContent = "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C Cheat";
    applyBtn.disabled = true;
    let selected = null;
    options2.forEach((o) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wizard-taming-pick-card";
      btn.dataset.cardId = o.cardId;
      const img = document.createElement("img");
      img.className = "wizard-taming-pick-card-img";
      img.src = o.img || "";
      img.alt = o.cardId;
      btn.appendChild(img);
      btn.addEventListener("click", () => {
        cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selected = o;
        applyBtn.disabled = !selected;
      });
      cardsWrap.appendChild(btn);
    });
    applyBtn.addEventListener("click", () => {
      if (!selected?.cardId) {
        return;
      }
      const needsMoveToMain = selected.from === "hand" || selected.from === "equip" && selected.fromZoneId && side?.id && selected.fromZoneId === side.id;
      const cheatEl = document.getElementById(cheatCardId);
      if (needsMoveToMain) {
        const trEl = document.getElementById(selected.cardId);
        if (trEl) {
          trEl.dataset.cheatPendingIncoming = "1";
        }
        if (cheatEl) {
          cheatEl.dataset.cheatPendingTreasureId = selected.cardId;
        }
        socket_default.emit("message", {
          method: "moveCard",
          cardId: selected.cardId,
          targetId: null,
          zoneId: main.id
        });
      } else {
        socket_default.emit("message", {
          method: "CheatAttach",
          seat,
          cheatCardId,
          treasureCardId: selected.cardId
        });
      }
      modal.remove();
    });
    panel.appendChild(title);
    panel.appendChild(cardsWrap);
    panel.appendChild(applyBtn);
    modal.appendChild(panel);
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  function scheduleCheatIfNeeded(cardId, zoneEl) {
    if (!cardId || !zoneEl) {
      return;
    }
    if (!isMainEquipmentZoneElement(zoneEl)) {
      return;
    }
    if (!isDoorSpecial(cardId, "Cheat")) {
      return;
    }
    const seat = getGlobalSeatForPlayZone(zoneEl);
    if (seat == null || Number(seat) !== Number(localSeat)) {
      return;
    }
    const el = document.getElementById(cardId);
    if (!el || el.dataset?.cheatUsed) {
      return;
    }
    setTimeout(() => {
      const cheatEl = document.getElementById(cardId);
      if (!cheatEl) {
        return;
      }
      const stillInMainEquip = isMainEquipmentZoneElement(cheatEl.parentElement);
      if (!stillInMainEquip) {
        return;
      }
      if (cheatEl.dataset?.cheatUsed) {
        return;
      }
      cheatEl.dataset.cheatUsed = "1";
      openCheatAttachModal(cardId, seat);
    }, 30);
  }
  function normalizeAdvantageTargets(typeValue) {
    if (!typeValue) {
      return [];
    }
    if (Array.isArray(typeValue)) {
      return typeValue.map(String).map((s) => s.trim()).filter(Boolean);
    }
    const str = String(typeValue);
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  }
  function computeMonsterAdvantageBonus() {
    const { hasMonster } = getMonsterBattleContext();
    if (!battleActive || !hasMonster) {
      return 0;
    }
    updateCharacterStatesFromBoard();
    const participantRaces = /* @__PURE__ */ new Set();
    const participantKinds = /* @__PURE__ */ new Set();
    let ignoreAdvantage = false;
    const fightSeat = getMonsterFightSeat();
    const active = characterBySeat[fightSeat];
    if (active) {
      const races = getCharacterRaces(active);
      const kinds = getCharacterKinds(active);
      races.forEach((r) => participantRaces.add(r));
      kinds.forEach((k) => participantKinds.add(k));
      ignoreAdvantage = ignoreAdvantage || Boolean(active.hasHalfBreed) && String(active.race2 || "").trim() === "Human" || Boolean(active.hasSuperMunchkin) && getCharacterKinds(active).length === 1;
    }
    if (acceptedHelperSeat !== null && acceptedHelperSeat !== void 0 && acceptedHelperSeat >= 0) {
      const helper = characterBySeat[acceptedHelperSeat];
      if (helper) {
        const races = getCharacterRaces(helper);
        const kinds = getCharacterKinds(helper);
        races.forEach((r) => participantRaces.add(r));
        kinds.forEach((k) => participantKinds.add(k));
        ignoreAdvantage = ignoreAdvantage || Boolean(helper.hasHalfBreed) && String(helper.race2 || "").trim() === "Human" || Boolean(helper.hasSuperMunchkin) && getCharacterKinds(helper).length === 1;
      }
    }
    if (participantRaces.size === 0 && participantKinds.size === 0) {
      return 0;
    }
    if (ignoreAdvantage) {
      return 0;
    }
    let total = 0;
    const zoneCards = document.querySelectorAll(".zone_monster .card");
    zoneCards.forEach((el) => {
      const door96 = window.doors?.find((d) => d.name === el.id);
      let effectiveDoor = door96;
      if (door96 && String(door96.special || "") === "Mate") {
        const srcId = String(el.dataset?.mateSourceMonsterId || "");
        const srcDoor = srcId ? window.doors?.find((d) => d.name === srcId) : null;
        if (srcDoor) {
          effectiveDoor = srcDoor;
        }
      }
      if (!effectiveDoor || String(effectiveDoor.race || "") !== "monster" || !effectiveDoor.advantage) {
        return;
      }
      const targets = normalizeAdvantageTargets(effectiveDoor.advantage.type);
      const bonus = Number(effectiveDoor.advantage.power) || 0;
      if (targets.length === 0 || bonus === 0) {
        return;
      }
      const matched = targets.some((t) => participantRaces.has(t) || participantKinds.has(t));
      if (matched) {
        total += bonus;
      }
    });
    return total;
  }
  function getEffectiveMonsterPower() {
    return getMonsterBasePower() + computeMonsterAdvantageBonus();
  }
  function updateEffectiveMonsterBonusDisplay() {
    const el = document.querySelector(".MonsterBonus");
    if (!el) {
      return;
    }
    const base = computeMonsterZoneBasePower();
    el.dataset.basePower = String(base);
    const effective = getEffectiveMonsterPower();
    el.textContent = String(effective);
  }
  function getSeatCombatPower(seat) {
    const seatToPowerMap = getSeatToPowerMap();
    const powerSelector = seatToPowerMap[seat];
    const excludeCombatLevel = battleActive && monsterBattlefieldExcludesLevelFromCombatPower() && isSeatParticipantInCurrentMonsterBattle(seat);
    if (powerSelector) {
      let base = excludeCombatLevel ? Number(characterBySeat[seat]?.equipmentPower) || 0 : getNumericText(powerSelector);
      if (battleActive && changeSexActiveBySeat.has(seat) && isSeatParticipantInCurrentMonsterBattle(seat)) {
        base -= 5;
      }
      return base;
    }
    const seatToLevelMap = getSeatToLevelMap();
    const levelSelector = seatToLevelMap[seat];
    return levelSelector ? getNumericText(levelSelector) : 0;
  }
  function updateCharacterStatesFromBoard() {
    for (let seat = 0; seat < characterBySeat.length; seat++) {
      const character = characterBySeat[seat];
      if (!character) {
        continue;
      }
      character.setLevel(levelBySeat[seat] ?? 1);
      const { main: mainEl, side: sideEl } = getMainAndSideZoneElementsForSeat(seat);
      const mainCards = mainEl ? Array.from(mainEl.querySelectorAll(".card")) : [];
      const sideCards = sideEl ? Array.from(sideEl.querySelectorAll(".card")) : [];
      let nextRace = "Human";
      let nextRace2 = "";
      let hasHalfBreed = false;
      let nextKind = "";
      let nextKind2 = "";
      let hasSuperMunchkin = false;
      let doorRemoverBonus = 0;
      const raceCardsInMain = [];
      const raceCardElByRace = /* @__PURE__ */ new Map();
      const kindCardsInMain = [];
      const kindCardElByKind = /* @__PURE__ */ new Map();
      let halfBreedCardEl = null;
      let superMunchkinCardEl = null;
      mainCards.forEach((cardEl) => {
        const doorCard = window.doors?.find((d) => d.name === cardEl.id);
        if (!doorCard) {
          return;
        }
        if (String(doorCard.special || "") === "Half-breed" || String(doorCard.card_name || "") === "Half-breed") {
          hasHalfBreed = true;
          halfBreedCardEl = halfBreedCardEl || cardEl;
        }
        if (String(doorCard.special || "") === "Super Munchkin" || String(doorCard.card_name || "") === "Super Munchkin") {
          hasSuperMunchkin = true;
          superMunchkinCardEl = superMunchkinCardEl || cardEl;
        }
        if (doorCard.race) {
          const r = String(doorCard.race);
          if (hasHalfBreed) {
            if (raceCardElByRace.has(r)) {
              appendCardToSeatHand(cardEl.id, seat);
              return;
            }
            raceCardElByRace.set(r, cardEl);
          }
          raceCardsInMain.push(r);
        }
        if (doorCard.kind) {
          const k = String(doorCard.kind);
          if (hasSuperMunchkin) {
            if (kindCardElByKind.has(k)) {
              appendCardToSeatHand(cardEl.id, seat);
              return;
            }
            kindCardElByKind.set(k, cardEl);
          }
          kindCardsInMain.push(k);
        }
        doorRemoverBonus += Number(doorCard.remover) || 0;
      });
      const uniqueRaces = [];
      raceCardsInMain.forEach((r) => {
        if (!r) {
          return;
        }
        if (uniqueRaces.includes(r)) {
          return;
        }
        uniqueRaces.push(r);
      });
      if (!hasHalfBreed) {
        const raceEls = [];
        mainCards.forEach((cardEl) => {
          const doorCard = window.doors?.find((d) => d.name === cardEl.id);
          if (doorCard?.race) {
            raceEls.push(cardEl);
          }
        });
        if (raceEls.length > 1) {
          for (let i3 = 0; i3 < raceEls.length - 1; i3++) {
            appendCardToSeatHand(raceEls[i3].id, seat);
          }
        }
      }
      if (!hasSuperMunchkin) {
        const kindEls = [];
        mainCards.forEach((cardEl) => {
          const doorCard = window.doors?.find((d) => d.name === cardEl.id);
          if (doorCard?.kind) {
            kindEls.push(cardEl);
          }
        });
        if (kindEls.length > 1) {
          for (let i3 = 0; i3 < kindEls.length - 1; i3++) {
            appendCardToSeatHand(kindEls[i3].id, seat);
          }
        }
      }
      if (hasHalfBreed && uniqueRaces.length === 0 && halfBreedCardEl) {
        const dropZone = document.getElementById("zone_doors_drop");
        if (dropZone && halfBreedCardEl.parentElement && halfBreedCardEl.parentElement.id !== "zone_doors_drop") {
          dropZone.appendChild(halfBreedCardEl);
        }
        hasHalfBreed = false;
      }
      if (hasSuperMunchkin && kindCardsInMain.length === 0 && superMunchkinCardEl) {
        const dropZone = document.getElementById("zone_doors_drop");
        if (dropZone && superMunchkinCardEl.parentElement && superMunchkinCardEl.parentElement.id !== "zone_doors_drop") {
          dropZone.appendChild(superMunchkinCardEl);
        }
        hasSuperMunchkin = false;
      }
      if (!hasHalfBreed) {
        nextRace = uniqueRaces.length > 0 ? uniqueRaces[uniqueRaces.length - 1] : "Human";
        nextRace2 = "";
      } else {
        if (uniqueRaces.length === 1) {
          nextRace = uniqueRaces[0];
          nextRace2 = "Human";
        } else {
          const r1 = uniqueRaces[uniqueRaces.length - 2];
          const r2 = uniqueRaces[uniqueRaces.length - 1];
          nextRace = r1;
          nextRace2 = r2;
        }
      }
      if (!hasSuperMunchkin) {
        nextKind = kindCardsInMain.length > 0 ? kindCardsInMain[kindCardsInMain.length - 1] : "";
        nextKind2 = "";
      } else {
        const uniqueKinds = [];
        kindCardsInMain.forEach((k) => {
          if (!k) {
            return;
          }
          if (uniqueKinds.includes(k)) {
            return;
          }
          uniqueKinds.push(k);
        });
        if (uniqueKinds.length === 1) {
          nextKind = uniqueKinds[0];
          nextKind2 = "";
        } else {
          nextKind = uniqueKinds[uniqueKinds.length - 2];
          nextKind2 = uniqueKinds[uniqueKinds.length - 1];
        }
      }
      character.race = nextRace;
      character.race2 = nextRace2;
      character.hasHalfBreed = hasHalfBreed;
      character.kind = nextKind;
      character.kind2 = nextKind2;
      character.hasSuperMunchkin = hasSuperMunchkin;
      const malignMirrorRestrict = Boolean(malignMirrorActiveBySeat.has(seat)) && isSeatParticipantInCurrentMonsterBattle(seat);
      const levelOnlyCombatRestrict = monsterBattlefieldLevelOnlyCombatPower() && isSeatParticipantInCurrentMonsterBattle(seat);
      const equippedTreasures = mainCards.map((cardEl) => {
        const t = window.treasures?.find((tr) => tr.name === cardEl.id);
        if (!t) {
          return null;
        }
        if (levelOnlyCombatRestrict) {
          return { ...t, power: 0, powerByRace: null };
        }
        const isHireling = isTreasureSpecial(cardEl.id, "Hireling");
        const isArmor = Number(t.body) === 1;
        if (malignMirrorRestrict && !isArmor && !isHireling) {
          return { ...t, power: 0, powerByRace: null };
        }
        if (cardEl?.dataset?.hirelingCardId) {
          return { ...t, body: 0, hand: 0, footwear: 0, hat: 0, big: 0, restrictions: null };
        }
        if (t.oneTime) {
          return { ...t, power: 0, powerByRace: null };
        }
        return t;
      }).filter(Boolean);
      character.applyEquipmentCards(equippedTreasures);
      character.remover += levelOnlyCombatRestrict ? 0 : doorRemoverBonus;
    }
  }
  function getBlCornerAcceptHelpPresetButton() {
    return document.getElementById("accept-help-preview-bottom-left");
  }
  function getBrCornerAcceptHelpPresetButton() {
    return document.getElementById("accept-help-preview-bottom-right");
  }
  function getAcceptHelpButtonElForSeat(seat) {
    const seatToPowerMap = getSeatToPowerMap();
    if (seatToPowerMap[seat] === ".PowerBlCorner") {
      const preset = getBlCornerAcceptHelpPresetButton();
      if (preset) {
        return preset;
      }
    }
    if (seatToPowerMap[seat] === ".PowerPlayer7") {
      const preset = getBrCornerAcceptHelpPresetButton();
      if (preset) {
        return preset;
      }
    }
    return document.getElementById(`accept-help-seat-${seat}`);
  }
  function repositionVisibleAcceptHelpButtonsForViewport() {
    if (!battleActive || acceptedHelperSeat !== null) {
      return;
    }
    if (localSeat === null || localSeat === void 0) {
      return;
    }
    if (Number(localSeat) !== Number(getMonsterFightSeat())) {
      return;
    }
    if (monsterBattlefieldDismissesBattleHelpers()) {
      return;
    }
    pendingHelpSeats.forEach((seat) => {
      const btn = getAcceptHelpButtonElForSeat(seat);
      if (!btn) {
        return;
      }
      const cs = getComputedStyle(btn);
      if (cs.display === "none") {
        return;
      }
      positionAcceptHelpButtonForSeat(seat, btn);
    });
  }
  function scheduleRepositionAcceptHelpButtonsForViewport() {
    if (acceptHelpViewportResizeRaf) {
      cancelAnimationFrame(acceptHelpViewportResizeRaf);
    }
    acceptHelpViewportResizeRaf = requestAnimationFrame(() => {
      acceptHelpViewportResizeRaf = 0;
      repositionVisibleAcceptHelpButtonsForViewport();
    });
  }
  function hideAllAcceptHelpButtons() {
    const previewIds = /* @__PURE__ */ new Set(["accept-help-preview-bottom-left", "accept-help-preview-bottom-right"]);
    const maxS = Math.max(0, (Number(num) || effectiveSeatLayoutPlayerCount() || 4) - 1);
    for (let s = 0; s <= maxS; s++) {
      const btn = getAcceptHelpButtonElForSeat(s);
      if (!btn) {
        continue;
      }
      if (previewIds.has(btn.id)) {
        btn.classList.remove("is-accept-help-bl-active", "is-accept-help-br-active");
        continue;
      }
      btn.style.display = "none";
    }
    ensurePreviewAcceptHelpButtonsVisible();
  }
  function ensureAcceptHelpButtonForSeat(seat) {
    const seatToPowerMap = getSeatToPowerMap();
    const powerSelector = seatToPowerMap[seat];
    const powerElement = powerSelector ? document.querySelector(powerSelector) : null;
    if (!powerElement || !powerElement.parentElement) {
      return null;
    }
    const presetBl = powerSelector === ".PowerBlCorner" ? getBlCornerAcceptHelpPresetButton() : null;
    const presetBr = powerSelector === ".PowerPlayer7" ? getBrCornerAcceptHelpPresetButton() : null;
    if (presetBl) {
      const dup = document.getElementById(`accept-help-seat-${seat}`);
      if (dup) {
        dup.remove();
      }
      if (!presetBl.dataset.acceptHelpClickBound) {
        presetBl.addEventListener("click", () => {
          const helperSeat = parseInt(presetBl.dataset.acceptHelpHelperSeat, 10);
          if (!Number.isFinite(helperSeat)) {
            return;
          }
          if (!battleActive || localSeat !== getMonsterFightSeat() || acceptedHelperSeat !== null) {
            return;
          }
          socket_default.emit("message", {
            method: "AcceptHelp",
            helperSeat,
            turnSeat: getMonsterFightSeat()
          });
        });
        presetBl.dataset.acceptHelpClickBound = "1";
      }
      presetBl.dataset.acceptHelpHelperSeat = String(seat);
      presetBl.classList.add("accept-help-seat-btn");
      return presetBl;
    }
    if (presetBr) {
      const dup = document.getElementById(`accept-help-seat-${seat}`);
      if (dup) {
        dup.remove();
      }
      if (!presetBr.dataset.acceptHelpClickBound) {
        presetBr.addEventListener("click", () => {
          const helperSeat = parseInt(presetBr.dataset.acceptHelpHelperSeat, 10);
          if (!Number.isFinite(helperSeat)) {
            return;
          }
          if (!battleActive || localSeat !== getMonsterFightSeat() || acceptedHelperSeat !== null) {
            return;
          }
          socket_default.emit("message", {
            method: "AcceptHelp",
            helperSeat,
            turnSeat: getMonsterFightSeat()
          });
        });
        presetBr.dataset.acceptHelpClickBound = "1";
      }
      presetBr.dataset.acceptHelpHelperSeat = String(seat);
      presetBr.classList.add("accept-help-seat-btn");
      return presetBr;
    }
    let btn = document.getElementById(`accept-help-seat-${seat}`);
    const anchorParent = powerSelector === ".PowerPlayer2" || powerSelector === ".PowerBlCorner" ? document.querySelector(".container2") || document.body : powerElement.parentElement;
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = `accept-help-seat-${seat}`;
      btn.className = "accept-help-seat-btn";
      btn.innerHTML = "\u041F\u0440\u0438\u043D\u044F\u0442\u044C<br>\u043F\u043E\u043C\u043E\u0449\u044C";
      btn.style.display = "none";
      btn.addEventListener("click", () => {
        if (!battleActive || localSeat !== getMonsterFightSeat() || acceptedHelperSeat !== null) {
          return;
        }
        socket_default.emit("message", {
          method: "AcceptHelp",
          helperSeat: seat,
          turnSeat: getMonsterFightSeat()
        });
      });
      anchorParent.appendChild(btn);
    } else if (btn.parentElement !== anchorParent) {
      anchorParent.appendChild(btn);
    }
    btn.classList.add("accept-help-seat-btn");
    return btn;
  }
  function positionAcceptHelpButtonForSeat(seat, btn) {
    if (!btn) {
      return;
    }
    const seatToIconMap = getSeatToIconMap();
    const iconSelector = seatToIconMap[seat];
    btn.classList.remove(
      "accept-help-seat-btn--top-left",
      "accept-help-seat-btn--top-right",
      "accept-help-seat-btn--top-center",
      "accept-help-seat-btn--bottom-bl",
      "accept-help-seat-btn--preview-bottom-left",
      "accept-help-seat-btn--preview-bottom-right",
      "is-accept-help-bl-active",
      "is-accept-help-br-active"
    );
    if (!iconSelector) {
      btn.style.position = "";
      btn.style.left = "";
      btn.style.top = "";
      btn.style.right = "";
      btn.style.transform = "";
      btn.style.zIndex = "";
      return;
    }
    const iconElement = document.querySelector(iconSelector);
    if (!iconElement) {
      return;
    }
    const rect = iconElement.getBoundingClientRect();
    btn.style.position = "fixed";
    btn.style.zIndex = "30";
    if (iconSelector === ".image-top-right") {
      btn.classList.add("accept-help-seat-btn--top-right");
      btn.style.left = "";
      btn.style.right = "";
      btn.style.top = "";
      btn.style.transform = "";
      return;
    }
    if (iconSelector === ".image-top-left") {
      btn.classList.add("accept-help-seat-btn--top-left");
      btn.style.left = "";
      btn.style.right = "";
      btn.style.top = "";
      btn.style.transform = "";
      return;
    }
    if (iconSelector === ".image-bl-corner") {
      if (btn.id === "accept-help-preview-bottom-left") {
        btn.classList.remove("accept-help-seat-btn--bottom-bl");
        btn.classList.add("accept-help-seat-btn--preview-bottom-left");
        btn.classList.add("is-accept-help-bl-active");
        btn.style.left = "";
        btn.style.right = "";
        btn.style.top = "";
        btn.style.transform = "";
        return;
      }
      btn.classList.remove("accept-help-seat-btn--preview-bottom-left");
      btn.classList.add("accept-help-seat-btn--bottom-bl");
      btn.style.left = "";
      btn.style.right = "";
      btn.style.top = "";
      btn.style.transform = "";
      return;
    }
    if (iconSelector === ".image-br-corner") {
      if (btn.id === "accept-help-preview-bottom-right") {
        btn.classList.add("accept-help-seat-btn--preview-bottom-right");
        btn.classList.add("is-accept-help-br-active");
        btn.style.left = "";
        btn.style.right = "";
        btn.style.top = "";
        btn.style.transform = "";
        return;
      }
      btn.classList.remove("accept-help-seat-btn--preview-bottom-right");
      btn.style.left = "";
      btn.style.right = "";
      btn.style.top = "";
      btn.style.transform = "";
      return;
    }
    btn.style.left = "";
    btn.style.right = "";
    if (iconSelector === ".top-center-image") {
      btn.classList.add("accept-help-seat-btn--top-center");
      btn.style.left = `${rect.left + rect.width / 2}px`;
      btn.style.top = "";
      btn.style.transform = "";
      return;
    }
    const left = rect.left + rect.width / 2;
    btn.style.left = `${left}px`;
    btn.style.transform = "translateX(-50%)";
    btn.style.top = `${rect.bottom + 28}px`;
  }
  function updateHelpUi() {
    const offerHelpButton = document.getElementById("offer-help");
    if (!offerHelpButton) {
      return;
    }
    const fightSeat = getMonsterFightSeat();
    const alreadyOffered = localSeat !== null && localSeat !== void 0 && pendingHelpSeats.has(localSeat);
    const helpAlreadyAccepted = acceptedHelperSeat !== null;
    const helpDismissMonster = monsterBattlefieldDismissesBattleHelpers();
    const canOffer = battleActive && localSeat !== null && localSeat !== void 0 && Number(localSeat) !== Number(fightSeat) && !alreadyOffered && !helpAlreadyAccepted && !helpDismissMonster;
    offerHelpButton.style.display = canOffer ? "flex" : "none";
    if (battleActive && localSeat === fightSeat && acceptedHelperSeat === null && !helpDismissMonster) {
      const previewBtnIds = /* @__PURE__ */ new Set(["accept-help-preview-bottom-left", "accept-help-preview-bottom-right"]);
      pendingHelpSeats.forEach((seat) => {
        const btn = ensureAcceptHelpButtonForSeat(seat);
        if (btn) {
          if (!previewBtnIds.has(btn.id)) {
            btn.style.display = "inline-block";
          }
          positionAcceptHelpButtonForSeat(seat, btn);
        }
      });
    } else {
      hideAllAcceptHelpButtons();
    }
    updateWarriorFrenzyUi();
    updateClericExorcismUi();
    updateThiefTrimUi();
    updateThiefTheftUi();
  }
  function recalculateAllPowerDisplays() {
    for (const [seat, curseId] of malignMirrorPendingBySeat.entries()) {
      if (curseId && !isCardInSeatMainOrSide(curseId, seat)) {
        malignMirrorPendingBySeat.delete(seat);
      }
    }
    for (const [seat, curseId] of malignMirrorActiveBySeat.entries()) {
      if (curseId && !isCardInSeatMainOrSide(curseId, seat)) {
        malignMirrorActiveBySeat.delete(seat);
      }
    }
    for (const [seat, curseId] of changeSexPendingBySeat.entries()) {
      const el = curseId ? document.getElementById(curseId) : null;
      const inDiscard = el && String(el.parentElement?.id || "") === "zone_doors_drop";
      if (curseId && inDiscard) {
        changeSexPendingBySeat.delete(seat);
      }
    }
    for (const [seat, curseId] of changeSexActiveBySeat.entries()) {
      const el = curseId ? document.getElementById(curseId) : null;
      const inDiscard = el && String(el.parentElement?.id || "") === "zone_doors_drop";
      if (curseId && inDiscard) {
        changeSexActiveBySeat.delete(seat);
      }
    }
    applyDismissBattleHelpersIfMonsterOnField();
    if (battleActive) {
      for (let seat = 0; seat < characterBySeat.length; seat++) {
        if (malignMirrorActiveBySeat.has(seat)) {
          continue;
        }
        if (!malignMirrorPendingBySeat.has(seat)) {
          continue;
        }
        if (isSeatParticipantInCurrentMonsterBattle(seat)) {
          malignMirrorActiveBySeat.set(seat, malignMirrorPendingBySeat.get(seat));
          malignMirrorPendingBySeat.delete(seat);
        }
      }
    }
    if (getMonsterBattleContext().hasMonster) {
      for (let seat = 0; seat < characterBySeat.length; seat++) {
        if (changeSexActiveBySeat.has(seat)) continue;
        if (!changeSexPendingBySeat.has(seat)) continue;
        if (isSeatParticipantInCurrentMonsterBattle(seat)) {
          changeSexActiveBySeat.set(seat, changeSexPendingBySeat.get(seat));
          changeSexPendingBySeat.delete(seat);
        }
      }
    }
    updateCharacterStatesFromBoard();
    enforceCheatAttachmentsInvariant();
    enforceHirelingFollowInvariant();
    const seatToPowerMap = getSeatToPowerMap();
    Object.entries(seatToPowerMap).forEach(([seatKey, selector]) => {
      const seat = parseInt(seatKey, 10);
      if (Number.isNaN(seat) || !characterBySeat[seat]) {
        return;
      }
      setPowerText(selector, characterBySeat[seat].power);
    });
    const powerPlayer5 = getNumericText(".level-bottom-left");
    setPowerText(".PowerPlayer5", powerPlayer5);
    const powerPlayer6 = getNumericText(".level-bottom-right");
    setPowerText(".PowerPlayer6", powerPlayer6);
    recalculateMyBonusDisplay();
    updateEffectiveMonsterBonusDisplay();
    updateWarriorFrenzyUi();
    updateClericExorcismUi();
    updateWizardTamingUi();
    updateWizardFlightUi();
    updateThiefTrimUi();
    updateThiefTheftUi();
    updateBattleEquipmentHighlight();
    return characterBySeat[localSeat ?? 0]?.power ?? 0;
  }
  function setupMunchkinDiceAfterGameStart() {
    const diceContainer = document.querySelector(".dice-container");
    if (!diceContainer) {
      return;
    }
    const NUMBER_OF_DICE = 1;
    if (diceContainer.dataset.munchkinDiceBound === "1") {
      randomizeDice(diceContainer, NUMBER_OF_DICE);
      return;
    }
    diceContainer.dataset.munchkinDiceBound = "1";
    diceContainer.dataset.hasDice = "1";
    randomizeDice(diceContainer, NUMBER_OF_DICE);
    diceContainer.addEventListener("click", () => {
      if (thiefTheftBoardDicePending) {
        if (thiefTheftBoardDiceInProgress) {
          return;
        }
        if (localSeat == null || !isSeatThiefClassActive(localSeat)) {
          return;
        }
        thiefTheftBoardDiceInProgress = true;
        hideBattleResult();
        thiefTheftBoardDicePending = false;
        const interval2 = setInterval(() => {
          const preview = Math.floor(Math.random() * 6 + 1);
          diceContainer.innerHTML = "";
          diceContainer.appendChild(createDice(preview));
        }, 50);
        setTimeout(() => {
          clearInterval(interval2);
          const rawRoll = Math.floor(Math.random() * 6 + 1);
          diceContainer.innerHTML = "";
          diceContainer.appendChild(createDice(rawRoll));
          promptLoadedDieAfterRoll({
            seat: localSeat,
            rawRoll,
            onFinalize: (finalRoll) => {
              socket_default.emit("message", {
                method: "ThiefTheftRoll",
                seat: localSeat,
                value: Number(finalRoll)
              });
            }
          });
        }, 1e3);
        return;
      }
      if (escapeBadStaffDicePending) {
        if (escapeRollInProgress) {
          return;
        }
        const ps = Number(escapeBadStaffDicePending.penaltySeat);
        if (localSeat == null || !Number.isFinite(ps) || Number(localSeat) !== ps) {
          return;
        }
        const deathAtOrBelow = Number(escapeBadStaffDicePending.deathAtOrBelow) || 2;
        escapeRollInProgress = true;
        const interval2 = setInterval(() => {
          const preview = Math.floor(Math.random() * 6 + 1);
          diceContainer.innerHTML = "";
          diceContainer.appendChild(createDice(preview));
        }, 50);
        setTimeout(() => {
          clearInterval(interval2);
          const rawRoll = Math.floor(Math.random() * 6 + 1);
          diceContainer.innerHTML = "";
          diceContainer.appendChild(createDice(rawRoll));
          const ownerSnap = escapeOwnerSeat != null && Number.isFinite(Number(escapeOwnerSeat)) ? Number(escapeOwnerSeat) : null;
          promptLoadedDieAfterRoll({
            seat: ps,
            rawRoll,
            onFinalize: (finalRoll) => {
              const adj = applyDicePenaltyForSeat(ps, Number(finalRoll));
              socket_default.emit("message", { method: "RandDice", digit: adj });
              socket_default.emit("message", {
                method: "EscapeBadStaffDiceRoll",
                penaltySeat: ps,
                rawRoll: adj,
                deathAtOrBelow,
                escapeQueueOwnerSeat: ownerSnap
              });
              escapeRollInProgress = false;
            }
          });
        }, 1e3);
        return;
      }
      if (escapeActive) {
        if (!canLocalPlayerRollEscapeNow() || escapeRollInProgress) {
          return;
        }
        escapeRollInProgress = true;
        const interval2 = setInterval(() => {
          const preview = Math.floor(Math.random() * 6 + 1);
          diceContainer.innerHTML = "";
          diceContainer.appendChild(createDice(preview));
        }, 50);
        setTimeout(() => {
          clearInterval(interval2);
          const rawRoll = Math.floor(Math.random() * 6 + 1);
          diceContainer.innerHTML = "";
          diceContainer.appendChild(createDice(rawRoll));
          promptLoadedDieAfterRoll({
            seat: localSeat,
            rawRoll,
            onFinalize: (finalRoll) => {
              if (localSeat === escapeOwnerSeat) {
                resolveEscapeRollAndBroadcast(localSeat, Number(finalRoll));
              } else {
                socket_default.emit("message", {
                  method: "EscapeRollSubmit",
                  seat: localSeat,
                  rawRoll: Number(finalRoll)
                });
              }
            }
          });
        }, 1e3);
        return;
      }
      const interval = setInterval(() => {
        randomizeDice(diceContainer, NUMBER_OF_DICE);
      }, 50);
      setTimeout(() => {
        clearInterval(interval);
        const rawRoll = Math.floor(Math.random() * 6 + 1);
        diceContainer.innerHTML = "";
        diceContainer.appendChild(createDice(rawRoll));
        promptLoadedDieAfterRoll({
          seat: localSeat,
          rawRoll,
          onFinalize: (finalRoll) => {
            diceContainer.innerHTML = "";
            diceContainer.appendChild(createDice(Number(finalRoll)));
          }
        });
      }, 1e3);
      window.flag_dice = true;
    });
  }
  function resetFivePlayerLayoutToSeatZero() {
    const set = (id, c) => {
      const el = document.getElementById(id);
      if (el) {
        el.className = `${c} cards-zone`;
      }
    };
    set("myhand", "myhand");
    set("opponent_bl_hand", "opponent_bl_hand");
    set("opponent2hand", "opponent2hand");
    set("opponent3hand", "opponent3hand");
    set("opponenthand", "opponenthand");
    set("zone2", "zone2");
    set("zone5", "zone5");
    set("zone_opponent_bl", "zone_opponent_bl");
    set("zone_opponent_bl_side", "zone_opponent_bl_side");
    set("zone_opponent2", "zone_opponent2");
    set("zone_opponent2_side", "zone_opponent2_side");
    set("zone_opponent3", "zone_opponent3");
    set("zone_opponent3_side", "zone_opponent3_side");
    set("zone_opponent", "zone_opponent");
    set("zone_opponent_side", "zone_opponent_side");
  }
  function applyFivePlayerCanonicalClassShift(localSeatIndex) {
    const L = (Number(localSeatIndex) % 5 + 5) % 5;
    const apply = (ids, classes) => {
      for (let i3 = 0; i3 < 5; i3 += 1) {
        const el = document.getElementById(ids[(i3 + L) % 5]);
        if (el) {
          el.className = `${classes[i3]} cards-zone`;
        }
      }
    };
    apply(FIVE_PLAYER_HAND_IDS, FIVE_PLAYER_HAND_CLASSES);
    apply(FIVE_PLAYER_MAIN_IDS, FIVE_PLAYER_MAIN_CLASSES);
    apply(FIVE_PLAYER_SIDE_IDS, FIVE_PLAYER_SIDE_CLASSES);
  }
  function resetSixPlayerLayoutToSeatZero() {
    const set = (id, c) => {
      const el = document.getElementById(id);
      if (el) {
        el.className = `${c} cards-zone`;
      }
    };
    set("myhand", "myhand");
    set("opponent_bl_hand", "opponent_bl_hand");
    set("opponent2hand", "opponent2hand");
    set("opponent3hand", "opponent3hand");
    set("opponenthand", "opponenthand");
    set("opponent_br_hand", "opponent_br_hand");
    set("zone2", "zone2");
    set("zone5", "zone5");
    set("zone_opponent_bl", "zone_opponent_bl");
    set("zone_opponent_bl_side", "zone_opponent_bl_side");
    set("zone_opponent2", "zone_opponent2");
    set("zone_opponent2_side", "zone_opponent2_side");
    set("zone_opponent3", "zone_opponent3");
    set("zone_opponent3_side", "zone_opponent3_side");
    set("zone_opponent", "zone_opponent");
    set("zone_opponent_side", "zone_opponent_side");
    set("zone_opponent_br", "zone_opponent_br");
    set("zone_opponent_br_side", "zone_opponent_br_side");
  }
  function applySixPlayerCanonicalClassShift(localSeatIndex) {
    const L = (Number(localSeatIndex) % 6 + 6) % 6;
    const apply = (ids, classes) => {
      for (let i3 = 0; i3 < 6; i3 += 1) {
        const el = document.getElementById(ids[(i3 + L) % 6]);
        if (el) {
          el.className = `${classes[i3]} cards-zone`;
        }
      }
    };
    apply(SIX_PLAYER_HAND_IDS, SIX_PLAYER_HAND_CLASSES);
    apply(SIX_PLAYER_MAIN_IDS, SIX_PLAYER_MAIN_CLASSES);
    apply(SIX_PLAYER_SIDE_IDS, SIX_PLAYER_SIDE_CLASSES);
    syncBrTableZonesForPlayerCount();
  }
  function applyFourPlayerCanonicalClassShift(localSeatIndex) {
    const L = (Number(localSeatIndex) % 4 + 4) % 4;
    const apply = (ids, classes) => {
      for (let i3 = 0; i3 < 4; i3 += 1) {
        const el = document.getElementById(ids[(i3 + L) % 4]);
        if (el) {
          el.className = `${classes[i3]} cards-zone`;
        }
      }
    };
    apply(FOUR_PLAYER_HAND_IDS, FOUR_PLAYER_HAND_CLASSES);
    apply(FOUR_PLAYER_MAIN_IDS, FOUR_PLAYER_MAIN_CLASSES);
    apply(FOUR_PLAYER_SIDE_IDS, FOUR_PLAYER_SIDE_CLASSES);
  }
  function resetFourPlayerLayoutToSeatZero() {
    applyFourPlayerCanonicalClassShift(0);
  }
  function resetThreePlayerLayoutToSeatZero() {
    const set = (id, c) => {
      const el = document.getElementById(id);
      if (el) {
        el.className = `${c} cards-zone`;
      }
    };
    set("myhand", "myhand");
    set("opponent2hand", "opponent2hand");
    set("opponent3hand", "opponent3hand");
    set("zone2", "zone2");
    set("zone5", "zone5");
    set("zone_opponent2", "zone_opponent2");
    set("zone_opponent2_side", "zone_opponent2_side");
    set("zone_opponent3", "zone_opponent3");
    set("zone_opponent3_side", "zone_opponent3_side");
  }
  function applyThreePlayerLayoutSeat1AsInJoinMessage() {
    const opponent2hand = document.getElementById("opponent2hand");
    const opponent3hand = document.getElementById("opponent3hand");
    const myhand = document.getElementById("myhand");
    const zone_opponent2 = document.getElementById("zone_opponent2");
    const zone_opponent3 = document.getElementById("zone_opponent3");
    const zone2 = document.getElementById("zone2");
    const zone_opponent2_side = document.getElementById("zone_opponent2_side");
    const zone5 = document.getElementById("zone5");
    const zone_opponent3_side = document.getElementById("zone_opponent3_side");
    if (!opponent2hand || !opponent3hand || !myhand || !zone_opponent2 || !zone_opponent3 || !zone2 || !zone_opponent2_side || !zone5 || !zone_opponent3_side) {
      return;
    }
    opponent3hand.classList.remove("opponent3hand");
    opponent3hand.classList.add("myhand");
    myhand.classList.remove("myhand");
    myhand.classList.add("opponent3hand");
    zone_opponent3.classList.remove("zone_opponent3");
    zone_opponent3.classList.add("zone2");
    zone2.classList.remove("zone2");
    zone2.classList.add("zone_opponent3");
    zone_opponent3_side.classList.remove("zone_opponent3_side");
    zone_opponent3_side.classList.add("zone5");
    zone5.classList.remove("zone5");
    zone5.classList.add("zone_opponent3_side");
    opponent2hand.classList.remove("opponent2hand");
    opponent2hand.classList.add("myhand");
    opponent3hand.classList.remove("myhand");
    opponent3hand.classList.add("opponent2hand");
    zone_opponent2.classList.remove("zone_opponent2");
    zone_opponent2.classList.add("zone2");
    zone_opponent3.classList.remove("zone2");
    zone_opponent3.classList.add("zone_opponent2");
    zone_opponent2_side.classList.remove("zone_opponent2_side");
    zone_opponent2_side.classList.add("zone5");
    zone_opponent3_side.classList.remove("zone5");
    zone_opponent3_side.classList.add("zone_opponent2_side");
  }
  function applyThreePlayerLayoutSeat2AsInJoinMessage() {
    const opponent2hand = document.getElementById("opponent2hand");
    const opponent3hand = document.getElementById("opponent3hand");
    const myhand = document.getElementById("myhand");
    const zone_opponent2 = document.getElementById("zone_opponent2");
    const zone_opponent3 = document.getElementById("zone_opponent3");
    const zone2 = document.getElementById("zone2");
    const zone_opponent2_side = document.getElementById("zone_opponent2_side");
    const zone5 = document.getElementById("zone5");
    const zone_opponent3_side = document.getElementById("zone_opponent3_side");
    if (!opponent2hand || !opponent3hand || !myhand || !zone_opponent2 || !zone_opponent3 || !zone2 || !zone_opponent2_side || !zone5 || !zone_opponent3_side) {
      return;
    }
    opponent3hand.classList.remove("opponent3hand");
    opponent3hand.classList.add("opponent2hand");
    opponent2hand.classList.remove("opponent2hand");
    opponent2hand.classList.add("opponent3hand");
    zone_opponent3.classList.remove("zone_opponent3");
    zone_opponent3.classList.add("zone_opponent2");
    zone_opponent2.classList.remove("zone_opponent2");
    zone_opponent2.classList.add("zone_opponent3");
    zone_opponent3_side.classList.remove("zone_opponent3_side");
    zone_opponent3_side.classList.add("zone_opponent2_side");
    zone_opponent2_side.classList.remove("zone_opponent2_side");
    zone_opponent2_side.classList.add("zone_opponent3_side");
    myhand.classList.remove("myhand");
    myhand.classList.add("opponent2hand");
    opponent3hand.classList.remove("opponent2hand");
    opponent3hand.classList.add("myhand");
    zone2.classList.remove("zone2");
    zone2.classList.add("zone_opponent2");
    zone_opponent3.classList.remove("zone_opponent2");
    zone_opponent3.classList.add("zone2");
    zone5.classList.remove("zone5");
    zone5.classList.add("zone_opponent2_side");
    zone_opponent3_side.classList.remove("zone_opponent2_side");
    zone_opponent3_side.classList.add("zone5");
  }
  function closeGameVictoryModal() {
    if (gameVictoryModalEl) {
      gameVictoryModalEl.remove();
      gameVictoryModalEl = null;
    }
  }
  function openGameVictoryModal(winners) {
    closeGameVictoryModal();
    const maxSeat = Math.max(0, (Number(num) || effectiveSeatLayoutPlayerCount() || 4) - 1);
    const seats = Array.isArray(winners) ? winners.map((x) => Number(x)).filter((s) => Number.isFinite(s) && s >= 0 && s <= maxSeat) : [];
    const names = seats.map((s) => `\u0418\u0433\u0440\u043E\u043A ${s + 1}`);
    const wrap = document.createElement("div");
    wrap.id = "game-victory-modal";
    wrap.className = "sell-treasures-modal";
    const panel = document.createElement("div");
    panel.className = "sell-treasures-panel";
    panel.style.minWidth = "min(92vw, 560px)";
    panel.style.maxWidth = "min(92vw, 640px)";
    panel.style.width = "100%";
    panel.style.boxSizing = "border-box";
    const title = document.createElement("div");
    title.className = "sell-treasures-topbar";
    title.textContent = "\u0418\u0433\u0440\u0430 \u043E\u043A\u043E\u043D\u0447\u0435\u043D\u0430!";
    title.style.width = "100%";
    title.style.boxSizing = "border-box";
    title.style.display = "flex";
    title.style.alignItems = "center";
    title.style.justifyContent = "center";
    title.style.textAlign = "center";
    title.style.whiteSpace = "nowrap";
    title.style.fontSize = "clamp(1.55rem, 4.5vw, 2.15rem)";
    title.style.fontWeight = "800";
    title.style.letterSpacing = "0.02em";
    const body = document.createElement("div");
    body.style.padding = "18px 20px";
    body.style.fontSize = "clamp(1.15rem, 3.2vw, 1.55rem)";
    body.style.lineHeight = "1.45";
    body.style.fontWeight = "600";
    body.style.textAlign = "center";
    body.textContent = names.length ? names.length === 1 ? `\u041F\u043E\u0431\u0435\u0434\u0438\u0442\u0435\u043B\u044C: ${names[0]}.` : `\u041F\u043E\u0431\u0435\u0434\u0438\u0442\u0435\u043B\u0438: ${names.join(", ")}.` : "\u0418\u0433\u0440\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430.";
    const btnRow = document.createElement("div");
    btnRow.style.padding = "12px 16px 22px";
    btnRow.style.display = "flex";
    btnRow.style.flexDirection = "column";
    btnRow.style.gap = "12px";
    btnRow.style.alignItems = "stretch";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sell-treasures-btn";
    btn.textContent = "\u0418\u0433\u0440\u0430\u0442\u044C \u0437\u0430\u043D\u043E\u0432\u043E";
    btn.onclick = () => {
      socket_default.emit("message", { method: "RestartGame" });
    };
    const btnHome = document.createElement("button");
    btnHome.type = "button";
    btnHome.className = "sell-treasures-btn";
    btnHome.textContent = "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443";
    btnHome.style.fontWeight = "600";
    btnHome.onclick = () => {
      window.location.assign("/");
    };
    btnRow.appendChild(btn);
    btnRow.appendChild(btnHome);
    panel.appendChild(title);
    panel.appendChild(body);
    panel.appendChild(btnRow);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);
    gameVictoryModalEl = wrap;
  }
  function resetLocalTableForRestart() {
    closeGameVictoryModal();
    clearAllNonPlaceholderCards();
    hideBattleResult();
    try {
      clearInterval(countdownInterval);
    } catch {
    }
    battleTurnSeat = null;
    battleActive = false;
    pendingHelpSeats.clear();
    acceptedHelperSeat = null;
    monsterFightSeat = null;
    deathLootActive = false;
    deathLootState = null;
    resumeEscapeAfterLoot = false;
    deathLootAwaitingEscapeFinish = false;
    resetEscapeStateNow();
    escapeInstantWallGate = null;
    escapeInstantWallOfferPending = null;
    instantWallSoloAidWaitingEmitted = false;
    escapeInstantWallAutoSeats.clear();
    escapeFailAidPending = null;
    escapeBadStaffDicePending = null;
    escapeGluePromptState = null;
    escapeGlueWaitingKey = null;
    escapeMonsterPickSession = null;
    malignMirrorPendingBySeat.clear();
    malignMirrorActiveBySeat.clear();
    changeSexPendingBySeat.clear();
    changeSexActiveBySeat.clear();
    incomeTaxSession = null;
    turnAwaitingManualEnd = false;
    loseYourClassPendingBySeat.clear();
    for (let i3 = 0; i3 < characterBySeat.length; i3 += 1) {
      halflingDoubleSellUsedBySeat[i3] = false;
      warriorFrenzyUsedBySeat[i3] = 0;
      warriorFrenzyBonusBySeat[i3] = 0;
      clericExorcismUsedBySeat[i3] = 0;
      clericExorcismBonusBySeat[i3] = 0;
      victimThiefTrimUsedBySeat[i3] = 0;
      thiefBackstabDebuffBySeat[i3] = 0;
      setLevelBySeat(i3, 1);
    }
  }
  function createDice(number) {
    const dotPositionMatrix = {
      1: [
        [50, 50]
      ],
      2: [
        [20, 20],
        [80, 80]
      ],
      3: [
        [20, 20],
        [50, 50],
        [80, 80]
      ],
      4: [
        [20, 20],
        [20, 80],
        [80, 20],
        [80, 80]
      ],
      5: [
        [20, 20],
        [20, 80],
        [50, 50],
        [80, 20],
        [80, 80]
      ],
      6: [
        [20, 20],
        [20, 80],
        [50, 20],
        [50, 80],
        [80, 20],
        [80, 80]
      ]
    };
    const dice = document.createElement("div");
    dice.classList.add("dice");
    for (const dotPosition of dotPositionMatrix[number]) {
      const dot = document.createElement("div");
      dot.classList.add("dice-dot");
      dot.style.setProperty("--top", dotPosition[0] + "%");
      dot.style.setProperty("--left", dotPosition[1] + "%");
      dice.appendChild(dot);
    }
    return dice;
  }
  function randomizeDice(diceContainer, numberOfDice) {
    diceContainer.innerHTML = "";
    let random = Math.floor(Math.random() * 6 + 1);
    for (let i3 = 0; i3 < numberOfDice; i3++) {
      const dice = createDice(random);
      diceContainer.appendChild(dice);
    }
    if (window.flag_dice) {
      const messageUpdateData = {
        method: "RandDice",
        digit: random
      };
      socket_default.emit("message", messageUpdateData);
    }
  }
  function shuffle(array) {
    for (let i3 = array.length - 1; i3 > 0; i3--) {
      const j = Math.floor(Math.random() * (i3 + 1));
      [array[i3], array[j]] = [array[j], array[i3]];
    }
    ;
    return array;
  }
  function Deck_filling(deck, zone) {
    for (const i3 of deck) {
      const card = document.createElement("div");
      card.classList.add("card");
      card.setAttribute("id", i3.name);
      card.setAttribute("draggable", "true");
      const image = document.createElement("img");
      image.classList.add("card-item");
      image.setAttribute("src", i3.img);
      card.appendChild(image);
      zone.appendChild(card);
    }
  }
  function UpdatebackImgTreasure() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
      const id = card.id;
      const imgElement = card.querySelector(".card-item");
      if (!imgElement) {
        return;
      }
      const treasure74 = window.treasures.find((tc) => tc.name === id);
      if (!treasure74) {
        return;
      }
      imgElement.src = shouldShowCardBackForCardEl(card) ? treasure74.backimg : treasure74.img;
    });
  }
  function UpdatebackImgDoor() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
      const id = card.id;
      const imgElement = card.querySelector(".card-item");
      if (!imgElement) {
        return;
      }
      const door96 = window.doors.find((dc) => dc.name === id);
      if (!door96) {
        return;
      }
      imgElement.src = shouldShowCardBackForCardEl(card) ? door96.backimg : door96.img;
    });
  }
  function Start_game(num_players) {
    Deck_filling(window.doors, window.zonedoor);
    UpdatebackImgDoor();
    Deck_filling(window.treasures, window.zoneTreasure);
    UpdatebackImgTreasure();
    UpdateZones();
    window.allCards = document.querySelectorAll(".card");
    const zone_door = document.querySelectorAll(".zone_doors .card");
    const zone_treasure = document.querySelectorAll(".zone_treasure .card");
    const myhand = document.querySelector("#myhand");
    const opponenthand = document.querySelector("#opponenthand");
    const opponent2hand = document.querySelector("#opponent2hand");
    const opponent3hand = document.querySelector("#opponent3hand");
    const opponentBlHand = document.querySelector("#opponent_bl_hand");
    const cardsToMoveDoors = [];
    const cardsToMoveTreasure = [];
    for (let i3 = 0; i3 < 4 * num_players; i3++) {
      cardsToMoveDoors.push(zone_door[i3]);
      cardsToMoveTreasure.push(zone_treasure[i3]);
    }
    if (num_players === 2) {
      cardsToMoveDoors.forEach((card, index) => {
        if (index % 2 === 0) {
          myhand.appendChild(card);
        } else {
          opponenthand.appendChild(card);
        }
      });
      cardsToMoveTreasure.forEach((card, index) => {
        if (index % 2 === 0) {
          myhand.appendChild(card);
        } else {
          opponenthand.appendChild(card);
        }
      });
    } else if (num_players === 3) {
      cardsToMoveDoors.forEach((card, index) => {
        if (index % 3 === 0) {
          myhand.appendChild(card);
        } else if (index % 3 === 1) {
          opponent2hand.appendChild(card);
        } else {
          opponent3hand.appendChild(card);
        }
      });
      cardsToMoveTreasure.forEach((card, index) => {
        if (index % 3 === 0) {
          myhand.appendChild(card);
        } else if (index % 3 === 1) {
          opponent2hand.appendChild(card);
        } else {
          opponent3hand.appendChild(card);
        }
      });
    } else if (num_players === 4) {
      cardsToMoveDoors.forEach((card, index) => {
        const r = index % 4;
        if (r === 0) {
          myhand.appendChild(card);
        } else if (r === 1) {
          opponent2hand.appendChild(card);
        } else if (r === 2) {
          opponent3hand.appendChild(card);
        } else {
          opponenthand.appendChild(card);
        }
      });
      cardsToMoveTreasure.forEach((card, index) => {
        const r = index % 4;
        if (r === 0) {
          myhand.appendChild(card);
        } else if (r === 1) {
          opponent2hand.appendChild(card);
        } else if (r === 2) {
          opponent3hand.appendChild(card);
        } else {
          opponenthand.appendChild(card);
        }
      });
    } else if (num_players === 5 && opponentBlHand) {
      cardsToMoveDoors.forEach((card, index) => {
        const r = index % 5;
        if (r === 0) {
          myhand.appendChild(card);
        } else if (r === 1) {
          opponentBlHand.appendChild(card);
        } else if (r === 2) {
          opponent2hand.appendChild(card);
        } else if (r === 3) {
          opponent3hand.appendChild(card);
        } else {
          opponenthand.appendChild(card);
        }
      });
      cardsToMoveTreasure.forEach((card, index) => {
        const r = index % 5;
        if (r === 0) {
          myhand.appendChild(card);
        } else if (r === 1) {
          opponentBlHand.appendChild(card);
        } else if (r === 2) {
          opponent2hand.appendChild(card);
        } else if (r === 3) {
          opponent3hand.appendChild(card);
        } else {
          opponenthand.appendChild(card);
        }
      });
    } else if (num_players === 6) {
      const opponentBrHand = document.querySelector("#opponent_br_hand");
      if (!opponentBlHand || !opponentBrHand) {
        return;
      }
      cardsToMoveDoors.forEach((card, index) => {
        const r = index % 6;
        if (r === 0) {
          myhand.appendChild(card);
        } else if (r === 1) {
          opponentBlHand.appendChild(card);
        } else if (r === 2) {
          opponent2hand.appendChild(card);
        } else if (r === 3) {
          opponent3hand.appendChild(card);
        } else if (r === 4) {
          opponenthand.appendChild(card);
        } else {
          opponentBrHand.appendChild(card);
        }
      });
      cardsToMoveTreasure.forEach((card, index) => {
        const r = index % 6;
        if (r === 0) {
          myhand.appendChild(card);
        } else if (r === 1) {
          opponentBlHand.appendChild(card);
        } else if (r === 2) {
          opponent2hand.appendChild(card);
        } else if (r === 3) {
          opponent3hand.appendChild(card);
        } else if (r === 4) {
          opponenthand.appendChild(card);
        } else {
          opponentBrHand.appendChild(card);
        }
      });
    }
  }
  function timer(initialSeconds = TURN_TIMER_SECONDS, restoring = false) {
    if (!getMonsterBattleContext().hasMonster) {
      return;
    }
    const timerElement = document.getElementById("timer");
    const foldButton = document.getElementById("fold");
    const endTurnButton = document.getElementById("end-turn");
    const warriorFrenzyButton = document.getElementById("warrior-frenzy-btn");
    const clericExorcismButton = document.getElementById("cleric-exorcism-btn");
    const wizardTamingButton = document.getElementById("wizard-taming-btn");
    const thiefTheftButton = document.getElementById("thief-theft-btn");
    const thiefTrimButton = document.getElementById("thief-trim-btn");
    const offerHelpButton = document.getElementById("offer-help");
    let turnResolved = false;
    hideBattleResult();
    if (escapeActive && !restoring) {
      resetEscapeStateNow();
    }
    if (!foldButton || !endTurnButton || !warriorFrenzyButton || !clericExorcismButton || !wizardTamingButton || !thiefTheftButton || !thiefTrimButton) {
      console.error("Error: Could not find action buttons");
      return;
    }
    let secondsRemaining = Math.max(1, parseInt(initialSeconds, 10) || TURN_TIMER_SECONDS);
    timerSecondsRemaining = secondsRemaining;
    timerRunning = true;
    flag = true;
    if (!restoring) {
      turnAwaitingManualEnd = false;
    }
    const isSameBattleTurn = battleActive && battleTurnSeat === currentTurnSeat;
    if (!restoring) {
      battleActive = true;
      battleTurnSeat = currentTurnSeat;
    }
    if (!restoring && !isSameBattleTurn) {
      window.FoldCount = 0;
      foldedOnTurnSeat = null;
      pendingHelpSeats.clear();
      acceptedHelperSeat = null;
      monsterFightSeat = null;
      for (let i3 = 0; i3 < warriorFrenzyUsedBySeat.length; i3++) {
        warriorFrenzyUsedBySeat[i3] = 0;
        warriorFrenzyBonusBySeat[i3] = 0;
        clericExorcismUsedBySeat[i3] = 0;
        clericExorcismBonusBySeat[i3] = 0;
        victimThiefTrimUsedBySeat[i3] = 0;
        thiefBackstabDebuffBySeat[i3] = 0;
      }
      hideWarriorFrenzyModal();
      hideClericExorcismModal();
      hideWizardTamingModal();
      hideWizardTamingPickModal();
      hideThiefTheftModal();
      hideThiefTheftStealModal();
      clearThiefTheftBoardDicePrompt();
      escapeWizardFlightPending = null;
      hideWizardFlightModal();
      hideThiefTrimModal();
    }
    if (!restoring && isSameBattleTurn) {
      window.FoldCount = 0;
      foldedOnTurnSeat = null;
    }
    updateHelpUi();
    clearInterval(countdownInterval);
    foldButton.onclick = handleFoldButtonClick;
    endTurnButton.onclick = handleEndTurnClick;
    warriorFrenzyButton.onclick = handleWarriorFrenzyClick;
    clericExorcismButton.onclick = handleClericExorcismClick;
    wizardTamingButton.onclick = handleWizardTamingClick;
    thiefTheftButton.onclick = handleThiefTheftClick;
    thiefTrimButton.onclick = handleThiefTrimClick;
    function handleFoldButtonClick() {
      if (foldedOnTurnSeat === currentTurnSeat || turnResolved) {
        return;
      }
      foldedOnTurnSeat = currentTurnSeat;
      window.FoldCount++;
      flag = false;
      console.log(window.FoldCount);
      const messageUpdateData = {
        method: "FoldCount",
        turnSeat: currentTurnSeat
      };
      socket_default.emit("message", messageUpdateData);
    }
    function handleEndTurnClick() {
      tryCompleteManualTurnEnd();
    }
    function handleOfferHelpClick() {
      if (!battleActive || localSeat === null || localSeat === void 0) {
        return;
      }
      if (Number(localSeat) === Number(getMonsterFightSeat())) {
        return;
      }
      socket_default.emit("message", {
        method: "OfferHelp",
        helperSeat: localSeat,
        turnSeat: getMonsterFightSeat()
      });
      if (offerHelpButton) {
        offerHelpButton.style.display = "none";
      }
    }
    function handleWarriorFrenzyClick() {
      openWarriorFrenzyModal();
    }
    function handleClericExorcismClick() {
      openClericExorcismModal();
    }
    function handleWizardTamingClick() {
      openWizardTamingModal();
    }
    function handleThiefTheftClick() {
      openThiefTheftModal();
    }
    function handleThiefTrimClick() {
      openThiefTrimModal();
    }
    if (offerHelpButton) {
      offerHelpButton.onclick = handleOfferHelpClick;
    }
    if (timerElement) {
      timerElement.textContent = formatTime(secondsRemaining);
    }
    updateTurnActionButtons(true);
    const finishTurn = () => {
      if (turnResolved) {
        return;
      }
      turnResolved = true;
      clearInterval(countdownInterval);
      timerRunning = false;
      timerSecondsRemaining = 0;
      timerElement.textContent = "";
      window.FoldCount = 0;
      foldedOnTurnSeat = null;
      flag = false;
      pendingHelpSeats.clear();
      applyTurnHighlight();
      updateHelpUi();
      updateTurnActionButtons(false);
      if (localSeat === 0) {
        resolveCombatAndBroadcast();
      }
    };
    countdownInterval = setInterval(() => {
      secondsRemaining--;
      timerSecondsRemaining = secondsRemaining;
      timerElement.textContent = formatTime(secondsRemaining);
      if (window.FoldCount >= window.num) {
        secondsRemaining = 0;
        finishTurn();
      }
      if (secondsRemaining === 0) {
        finishTurn();
      }
      updateTurnActionButtons(flag);
      updateEffectiveMonsterBonusDisplay();
      updateWarriorFrenzyUi();
      updateClericExorcismUi();
      updateWizardTamingUi();
      updateWizardFlightUi();
      updateThiefTheftUi();
      updateThiefTrimUi();
    }, 1e3);
  }
  function MoveMonstersToDrop() {
    const monsterZone = document.querySelector(".zone_monster");
    const BonusZone = document.querySelector(".zone3");
    const zone_doors_drop = document.querySelector(".zone_doors_drop");
    const zone_treasure_drop = document.querySelector(".zone_treasure_drop");
    if (monsterZone && BonusZone && zone_doors_drop && zone_treasure_drop) {
      const cards = [...monsterZone.querySelectorAll(".card"), ...BonusZone.querySelectorAll(".card")];
      cards.forEach((card) => {
        const fromZoneId = card.parentElement?.id || null;
        if (card.id.includes("door")) {
          let targetId = null;
          {
            const dropEls = Array.from(zone_doors_drop.querySelectorAll(".card"));
            for (let i3 = dropEls.length - 1; i3 >= 0; i3--) {
              const id = dropEls[i3]?.id;
              if (!id || id === "card" || id === card.id) continue;
              targetId = id;
              break;
            }
          }
          zone_doors_drop.appendChild(card);
          socket_default.emit("message", {
            method: "moveCard",
            cardId: card.id,
            targetId,
            zoneId: "zone_doors_drop",
            fromZoneId
          });
        } else if (card.id.includes("treasure")) {
          let targetId = null;
          {
            const dropEls = Array.from(zone_treasure_drop.querySelectorAll(".card"));
            for (let i3 = dropEls.length - 1; i3 >= 0; i3--) {
              const id = dropEls[i3]?.id;
              if (!id || id === "card" || id === card.id) continue;
              targetId = id;
              break;
            }
          }
          zone_treasure_drop.appendChild(card);
          socket_default.emit("message", {
            method: "moveCard",
            cardId: card.id,
            targetId,
            zoneId: "zone_treasure_drop",
            fromZoneId
          });
        }
      });
    }
    const MonsterBonus = document.querySelector(".MonsterBonus");
    if (MonsterBonus) {
      MonsterBonus.dataset.basePower = "0";
      MonsterBonus.textContent = "0";
    }
    const MyBonus = document.querySelector(".MyBonus");
    MyBonus.textContent = 0;
  }
  function initializeSellTreasuresUi() {
    if (!sellTreasuresDelegated) {
      document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
          return;
        }
        if (target.closest(".MoneyBag")) {
          openSellTreasuresModal();
        }
      });
      sellTreasuresDelegated = true;
    }
    const moneyBag = document.querySelector(".MoneyBag");
    if (!moneyBag) {
      return;
    }
    moneyBag.style.pointerEvents = "auto";
    moneyBag.style.cursor = "pointer";
  }
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  var fl, num, localSeat, pendingPlayerMetaSnapshot, currentTurnSeat, levelBySeat, STEAL_LEVEL_CARD_NAME, KILL_THE_HIRELING_SPECIAL, WHINE_AT_GM_SPECIAL, WINNING_LEVEL, malignMirrorPendingBySeat, malignMirrorActiveBySeat, changeSexPendingBySeat, changeSexActiveBySeat, incomeTaxSession, PlayerCharacterState, characterBySeat, battleActive, pendingHelpSeats, acceptedHelperSeat, monsterFightSeat, escapeActive, escapeQueue, escapeQueueIndex, escapeMonsterRemover, escapeMonsterBadStaff, escapeMonsterQueue, escapeMonsterInitialCount, escapeMonsterTemplateQueue, escapeCurrentMonsterCardId, escapeCurrentSeat, escapeWaitingForRoll, escapeOwnerSeat, escapeRollInProgress, escapeAttemptNumber, escapeHalflingRetryUsedForCurrentAttempt, escapeHalflingRetryPending, escapeWizardFlightPending, escapeInstantWallGate, escapeInstantWallOfferPending, instantWallSoloAidWaitingEmitted, escapeInstantWallAutoSeats, escapeFailAidPending, escapeBadStaffDicePending, escapeGluePromptState, escapeGlueWaitingKey, escapeMonsterPickSession, sellTreasuresDelegated, turnAwaitingManualEnd, deathLootActive, deathLootState, resumeEscapeAfterLoot, deathLootAwaitingEscapeFinish, halflingDoubleSellUsedBySeat, warriorFrenzyUsedBySeat, warriorFrenzyBonusBySeat, clericExorcismUsedBySeat, clericExorcismBonusBySeat, victimThiefTrimUsedBySeat, thiefBackstabDebuffBySeat, THIEF_THEFT_SUCCESS_ROLL, thiefTheftBoardDicePending, thiefTheftBoardDiceInProgress, ESCAPE_TARGET_ROLL, WIZARD_FLIGHT_MAX_DISCARD, ACTIVE_TURN_FILTER, HELPER_FILTER, TOP_ICON_SELECTORS, ALL_ICON_SELECTORS, lobbyConnectedPlayers, TABLE_OPPONENT_ZONE_GROUPS, TABLE_ALWAYS_ACTIVE_ZONE_IDS, TABLE_ALL_OPPONENT_ZONE_IDS, seatTooltipGlobalListenersBound, BATTLE_MAIN_SELECTOR_TO_SIDE_SELECTOR, loseYourClassPendingBySeat, HALITOSIS_SPECIAL, HALITOSIS_TARGET_MONSTER_ID, WISHING_RING_LABEL, curseWishingRingActive, INSTANT_WALL_OFFER_WAITING_ID, INSTANT_WALL_HELPER_WAITING_ID, INSTANT_WALL_SOLO_AID_WAITING_ID, ESCAPE_GLUE_WAITING_BANNER_ID, BATTLE_EQUIPMENT_OUTLINE_CLASS, lastMonsterBonusAttachmentsJson, openModalsSyncTimer, lastOpenModalIdsJson, openModalsObserverStarted, turnStateSyncTimer, lastTurnStateSyncJson, acceptHelpViewportResizeRaf, FOUR_PLAYER_HAND_IDS, FOUR_PLAYER_HAND_CLASSES, FOUR_PLAYER_MAIN_IDS, FOUR_PLAYER_MAIN_CLASSES, FOUR_PLAYER_SIDE_IDS, FOUR_PLAYER_SIDE_CLASSES, FIVE_PLAYER_HAND_IDS, FIVE_PLAYER_HAND_CLASSES, FIVE_PLAYER_MAIN_IDS, FIVE_PLAYER_MAIN_CLASSES, FIVE_PLAYER_SIDE_IDS, FIVE_PLAYER_SIDE_CLASSES, SIX_PLAYER_HAND_IDS, SIX_PLAYER_HAND_CLASSES, SIX_PLAYER_MAIN_IDS, SIX_PLAYER_MAIN_CLASSES, SIX_PLAYER_SIDE_IDS, SIX_PLAYER_SIDE_CLASSES, gameVictoryModalEl, gameStarted, Card_treasure, treasure1, treasure3, treasure2, treasure4, treasure5, treasure6, treasure7, treasure8, treasure9, treasure10, treasure11, treasure12, treasure13, treasure14, treasure15, treasure16, treasure17, treasure18, treasure19, treasure20, treasure21, treasure22, treasure23, treasure24, treasure25, treasure26, treasure27, treasure28, treasure29, treasure30, treasure31, treasure32, treasure33, treasure34, treasure35, treasure36, treasure37, treasure38, treasure39, treasure40, treasure41, treasure42, treasure43, treasure44, treasure45, treasure46, treasure47, treasure48, treasure49, treasure50, treasure51, treasure52, treasure53, treasure54, treasure55, treasure56, treasure57, treasure58, treasure59, treasure60, treasure61, treasure62, treasure63, treasure64, treasure65, treasure66, treasure67, treasure68, treasure69, treasure70, treasure71, treasure72, treasure73, Card_door, door1, door2, door3, door4, door5, door6, door7, door8, door9, door10, door11, door12, door13, door14, door15, door16, door17, door18, door19, door20, door21, door22, door23, door24, door25, door26, door27, door28, door29, door30, door31, door32, door33, door34, door35, door36, door37, door38, door39, door40, door41, door42, door43, door44, door45, door46, door47, door48, door49, door50, door51, door52, door53, door54, door55, door56, door57, door58, door59, door60, door61, door62, door63, door64, door65, door66, door67, door68, door69, door70, door71, door72, door73, door74, door75, door76, door77, door78, door79, door80, door81, door82, door83, door84, door85, door86, door87, door88, door89, door90, door91, door92, door93, door94, door95, countdownInterval, flag, foldedOnTurnSeat, battleTurnSeat, timerSecondsRemaining, timerRunning, TURN_TIMER_SECONDS;
  var init_game = __esm({
    "src/game.js"() {
      init_card_block();
      init_card_block();
      init__();
      init_socket3();
      init_profileSession();
      init_playerProfileModal();
      window.doors = [];
      window.treasures = [];
      localSeat = null;
      pendingPlayerMetaSnapshot = null;
      currentTurnSeat = 0;
      levelBySeat = [1, 1, 1, 1, 1, 1];
      STEAL_LEVEL_CARD_NAME = "Steal a level";
      KILL_THE_HIRELING_SPECIAL = "Kill the hireling";
      WHINE_AT_GM_SPECIAL = "Whine at the GM";
      WINNING_LEVEL = 10;
      malignMirrorPendingBySeat = /* @__PURE__ */ new Map();
      malignMirrorActiveBySeat = /* @__PURE__ */ new Map();
      changeSexPendingBySeat = /* @__PURE__ */ new Map();
      changeSexActiveBySeat = /* @__PURE__ */ new Map();
      incomeTaxSession = null;
      PlayerCharacterState = class {
        constructor(seat) {
          this.seat = seat;
          this.name = `\u0418\u0433\u0440\u043E\u043A ${Number(seat) + 1}`;
          this.gender = "Male";
          this.level = 1;
          this.power = 1;
          this.race = "Human";
          this.race2 = "";
          this.hasHalfBreed = false;
          this.kind = "";
          this.kind2 = "";
          this.hasSuperMunchkin = false;
          this.body = 0;
          this.hand = 0;
          this.footwear = 0;
          this.hat = 0;
          this.big = 0;
          this.equipmentPower = 0;
          this.remover = 0;
          this.freeSlots = {
            body: 1,
            hand: 2,
            footwear: 1,
            hat: 1,
            big: 1
          };
        }
        setLevel(level) {
          this.level = Math.max(1, Math.floor(Number(level)) || 1);
          this.power = Math.max(1, this.level + this.equipmentPower);
        }
        applyEquipmentCards(cards) {
          this.body = 0;
          this.hand = 0;
          this.footwear = 0;
          this.hat = 0;
          this.big = 0;
          this.equipmentPower = 0;
          this.remover = 0;
          cards.forEach((card) => {
            this.body += Number(card?.body) || 0;
            this.hand += Number(card?.hand) || 0;
            this.footwear += Number(card?.footwear) || 0;
            this.hat += Number(card?.hat) || 0;
            this.big += Number(card?.big) || 0;
            this.equipmentPower += getTreasureEffectivePower(card, this);
            this.remover += Number(card?.remover) || 0;
          });
          this.freeSlots = {
            body: Math.max(0, 1 - this.body),
            hand: Math.max(0, 2 - this.hand),
            footwear: Math.max(0, 1 - this.footwear),
            hat: Math.max(0, 1 - this.hat),
            big: Math.max(0, 1 - this.big)
          };
          this.power = Math.max(1, this.level + this.equipmentPower);
        }
      };
      characterBySeat = [
        new PlayerCharacterState(0),
        new PlayerCharacterState(1),
        new PlayerCharacterState(2),
        new PlayerCharacterState(3),
        new PlayerCharacterState(4),
        new PlayerCharacterState(5)
      ];
      window.characterBySeat = characterBySeat;
      battleActive = false;
      pendingHelpSeats = /* @__PURE__ */ new Set();
      acceptedHelperSeat = null;
      monsterFightSeat = null;
      escapeActive = false;
      escapeQueue = [];
      escapeQueueIndex = -1;
      escapeMonsterRemover = 0;
      escapeMonsterBadStaff = null;
      escapeMonsterQueue = [];
      escapeMonsterInitialCount = 0;
      escapeMonsterTemplateQueue = [];
      escapeCurrentMonsterCardId = null;
      escapeCurrentSeat = null;
      escapeWaitingForRoll = false;
      escapeOwnerSeat = null;
      escapeRollInProgress = false;
      escapeAttemptNumber = 0;
      escapeHalflingRetryUsedForCurrentAttempt = false;
      escapeHalflingRetryPending = null;
      escapeWizardFlightPending = null;
      escapeInstantWallGate = null;
      escapeInstantWallOfferPending = null;
      instantWallSoloAidWaitingEmitted = false;
      escapeInstantWallAutoSeats = /* @__PURE__ */ new Set();
      escapeFailAidPending = null;
      escapeBadStaffDicePending = null;
      escapeGluePromptState = null;
      escapeGlueWaitingKey = null;
      escapeMonsterPickSession = null;
      sellTreasuresDelegated = false;
      turnAwaitingManualEnd = false;
      deathLootActive = false;
      deathLootState = null;
      resumeEscapeAfterLoot = false;
      deathLootAwaitingEscapeFinish = false;
      halflingDoubleSellUsedBySeat = [false, false, false, false, false, false];
      warriorFrenzyUsedBySeat = [0, 0, 0, 0, 0, 0];
      warriorFrenzyBonusBySeat = [0, 0, 0, 0, 0, 0];
      clericExorcismUsedBySeat = [0, 0, 0, 0, 0, 0];
      clericExorcismBonusBySeat = [0, 0, 0, 0, 0, 0];
      victimThiefTrimUsedBySeat = [0, 0, 0, 0, 0, 0];
      thiefBackstabDebuffBySeat = [0, 0, 0, 0, 0, 0];
      THIEF_THEFT_SUCCESS_ROLL = 4;
      thiefTheftBoardDicePending = false;
      thiefTheftBoardDiceInProgress = false;
      ESCAPE_TARGET_ROLL = 5;
      WIZARD_FLIGHT_MAX_DISCARD = 3;
      ACTIVE_TURN_FILTER = "brightness(0) saturate(100%) invert(90%) sepia(100%) saturate(1000%) hue-rotate(30deg) brightness(100%) contrast(100%)";
      HELPER_FILTER = "brightness(0.9) saturate(120%) invert(37%) sepia(99%) saturate(1598%) hue-rotate(188deg) brightness(100%) contrast(101%)";
      TOP_ICON_SELECTORS = /* @__PURE__ */ new Set([
        ".top-center-image",
        ".image-top-left",
        ".image-top-right"
      ]);
      ALL_ICON_SELECTORS = [
        ".image-bottom-center",
        ".top-center-image",
        ".image-top-right",
        ".image-top-left",
        ".image-bl-corner",
        ".image-br-corner",
        ".image-bottom-right",
        ".image-bottom-left"
      ];
      lobbyConnectedPlayers = 1;
      TABLE_OPPONENT_ZONE_GROUPS = {
        /** 2 и 4+ игроков: верх-центр */
        center: ["opponenthand", "zone_opponent", "zone_opponent_side"],
        /** 3+ игроков: верх-справа (seat 1 в раскладке 3P) */
        right: ["opponent2hand", "zone_opponent2", "zone_opponent2_side"],
        /** 3+ игроков: верх-слева (seat 2 в раскладке 3P) */
        left: ["opponent3hand", "zone_opponent3", "zone_opponent3_side"],
        /** 5 игроков: низ-слева */
        bl: ["opponent_bl_hand", "zone_opponent_bl", "zone_opponent_bl_side"],
        /** 6 игроков: низ-справа */
        br: ["opponent_br_hand", "zone_opponent_br", "zone_opponent_br_side"]
      };
      TABLE_ALWAYS_ACTIVE_ZONE_IDS = [
        "myhand",
        "zone2",
        "zone3",
        "zone5",
        "zone_monster",
        "zone_doors",
        "zone_treasure",
        "zone_doors_drop",
        "zone_treasure_drop"
      ];
      TABLE_ALL_OPPONENT_ZONE_IDS = [
        ...TABLE_OPPONENT_ZONE_GROUPS.center,
        ...TABLE_OPPONENT_ZONE_GROUPS.right,
        ...TABLE_OPPONENT_ZONE_GROUPS.left,
        ...TABLE_OPPONENT_ZONE_GROUPS.bl,
        ...TABLE_OPPONENT_ZONE_GROUPS.br
      ];
      seatTooltipGlobalListenersBound = false;
      BATTLE_MAIN_SELECTOR_TO_SIDE_SELECTOR = {
        ".zone2": ".zone5",
        "#zone2": "#zone5",
        ".zone_opponent": ".zone_opponent_side",
        "#zone_opponent": "#zone_opponent_side",
        ".zone_opponent2": ".zone_opponent2_side",
        "#zone_opponent2": "#zone_opponent2_side",
        ".zone_opponent3": ".zone_opponent3_side",
        "#zone_opponent3": "#zone_opponent3_side",
        ".zone_opponent_bl": ".zone_opponent_bl_side",
        "#zone_opponent_bl": "#zone_opponent_bl_side",
        ".zone_opponent_br": ".zone_opponent_br_side",
        "#zone_opponent_br": "#zone_opponent_br_side"
      };
      loseYourClassPendingBySeat = /* @__PURE__ */ new Map();
      HALITOSIS_SPECIAL = "Potion of halitosis";
      HALITOSIS_TARGET_MONSTER_ID = "door68";
      WISHING_RING_LABEL = "Wishing ring";
      curseWishingRingActive = null;
      if (typeof window !== "undefined") {
        window.addEventListener("munchkin:playerProfileStorageUpdated", () => {
          try {
            syncLocalProfileFromStorageToSeatCharacter();
          } catch {
          }
        });
      }
      INSTANT_WALL_OFFER_WAITING_ID = "instant-wall-offer-waiting-banner";
      INSTANT_WALL_HELPER_WAITING_ID = "instant-wall-helper-waiting-banner";
      INSTANT_WALL_SOLO_AID_WAITING_ID = "instant-wall-solo-aid-waiting-banner";
      ESCAPE_GLUE_WAITING_BANNER_ID = "escape-glue-waiting-banner";
      BATTLE_EQUIPMENT_OUTLINE_CLASS = "battle-equipment-cards-outline";
      lastMonsterBonusAttachmentsJson = "";
      openModalsSyncTimer = null;
      lastOpenModalIdsJson = "";
      openModalsObserverStarted = false;
      turnStateSyncTimer = null;
      lastTurnStateSyncJson = "";
      acceptHelpViewportResizeRaf = 0;
      if (typeof window !== "undefined" && !window.__munchkinAcceptHelpViewportListeners) {
        window.__munchkinAcceptHelpViewportListeners = true;
        window.addEventListener("resize", scheduleRepositionAcceptHelpButtonsForViewport, { passive: true });
      }
      if (typeof window !== "undefined" && !window.__munchkinBrHandSyncListener) {
        window.__munchkinBrHandSyncListener = true;
        window.addEventListener("munchkin:zonesChanged", syncBrTableZonesForPlayerCount);
      }
      FOUR_PLAYER_HAND_IDS = ["myhand", "opponent2hand", "opponent3hand", "opponenthand"];
      FOUR_PLAYER_HAND_CLASSES = ["myhand", "opponent3hand", "opponenthand", "opponent2hand"];
      FOUR_PLAYER_MAIN_IDS = ["zone2", "zone_opponent2", "zone_opponent3", "zone_opponent"];
      FOUR_PLAYER_MAIN_CLASSES = ["zone2", "zone_opponent3", "zone_opponent", "zone_opponent2"];
      FOUR_PLAYER_SIDE_IDS = ["zone5", "zone_opponent2_side", "zone_opponent3_side", "zone_opponent_side"];
      FOUR_PLAYER_SIDE_CLASSES = ["zone5", "zone_opponent3_side", "zone_opponent_side", "zone_opponent2_side"];
      FIVE_PLAYER_HAND_IDS = ["myhand", "opponent_bl_hand", "opponent2hand", "opponent3hand", "opponenthand"];
      FIVE_PLAYER_HAND_CLASSES = ["myhand", "opponent_bl_hand", "opponent3hand", "opponenthand", "opponent2hand"];
      FIVE_PLAYER_MAIN_IDS = ["zone2", "zone_opponent_bl", "zone_opponent2", "zone_opponent3", "zone_opponent"];
      FIVE_PLAYER_MAIN_CLASSES = ["zone2", "zone_opponent_bl", "zone_opponent3", "zone_opponent", "zone_opponent2"];
      FIVE_PLAYER_SIDE_IDS = ["zone5", "zone_opponent_bl_side", "zone_opponent2_side", "zone_opponent3_side", "zone_opponent_side"];
      FIVE_PLAYER_SIDE_CLASSES = ["zone5", "zone_opponent_bl_side", "zone_opponent3_side", "zone_opponent_side", "zone_opponent2_side"];
      SIX_PLAYER_HAND_IDS = ["myhand", "opponent_bl_hand", "opponent2hand", "opponent3hand", "opponenthand", "opponent_br_hand"];
      SIX_PLAYER_HAND_CLASSES = ["myhand", "opponent_bl_hand", "opponent3hand", "opponenthand", "opponent2hand", "opponent_br_hand"];
      SIX_PLAYER_MAIN_IDS = ["zone2", "zone_opponent_bl", "zone_opponent2", "zone_opponent3", "zone_opponent", "zone_opponent_br"];
      SIX_PLAYER_MAIN_CLASSES = ["zone2", "zone_opponent_bl", "zone_opponent3", "zone_opponent", "zone_opponent2", "zone_opponent_br"];
      SIX_PLAYER_SIDE_IDS = ["zone5", "zone_opponent_bl_side", "zone_opponent2_side", "zone_opponent3_side", "zone_opponent_side", "zone_opponent_br_side"];
      SIX_PLAYER_SIDE_CLASSES = ["zone5", "zone_opponent_bl_side", "zone_opponent3_side", "zone_opponent_side", "zone_opponent2_side", "zone_opponent_br_side"];
      gameVictoryModalEl = null;
      gameStarted = false;
      socket_default.on("message", (response) => {
        function applySeatLayoutForRestore(seat, players) {
          if (!players || players < 2) return;
          const setZoneClass = (id, zoneClass) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.className = `${zoneClass} cards-zone`;
          };
          if (players === 2) {
            if (seat === 0) {
              setZoneClass("myhand", "myhand");
              setZoneClass("opponenthand", "opponenthand");
              setZoneClass("zone2", "zone2");
              setZoneClass("zone_opponent", "zone_opponent");
              setZoneClass("zone5", "zone5");
              setZoneClass("zone_opponent_side", "zone_opponent_side");
            } else if (seat === 1) {
              setZoneClass("myhand", "opponenthand");
              setZoneClass("opponenthand", "myhand");
              setZoneClass("zone2", "zone_opponent");
              setZoneClass("zone_opponent", "zone2");
              setZoneClass("zone5", "zone_opponent_side");
              setZoneClass("zone_opponent_side", "zone5");
            }
            return;
          }
          if (players === 3) {
            resetThreePlayerLayoutToSeatZero();
            if (seat === 0) {
              return;
            }
            if (seat === 1) {
              applyThreePlayerLayoutSeat1AsInJoinMessage();
              return;
            }
            if (seat === 2) {
              applyThreePlayerLayoutSeat2AsInJoinMessage();
            }
            return;
          }
          if (players === 4) {
            resetFourPlayerLayoutToSeatZero();
            applyFourPlayerCanonicalClassShift(seat);
            return;
          }
          if (players === 5) {
            resetFivePlayerLayoutToSeatZero();
            applyFivePlayerCanonicalClassShift(seat);
            return;
          }
          if (players === 6) {
            resetSixPlayerLayoutToSeatZero();
            applySixPlayerCanonicalClassShift(seat);
            return;
          }
        }
        if (response.method === "RestoreSeat") {
          const seat = parseInt(response.seat, 10);
          const n = parseInt(response.num, 10);
          if (Number.isNaN(seat) || seat < 0) {
            return;
          }
          console.log("[restore] RestoreSeat received", { seat, num: n });
          localSeat = seat;
          if (!Number.isNaN(n) && n > 0) {
            num = n;
            window.num = n;
          }
          applySeatLayoutForRestore(seat, num);
          try {
            window.dispatchEvent(new Event("munchkin:zonesChanged"));
          } catch {
          }
          console.log("[restore] layout applied", {
            seat,
            players: num,
            myhand: document.getElementById("myhand")?.className,
            opponent2hand: document.getElementById("opponent2hand")?.className,
            opponent3hand: document.getElementById("opponent3hand")?.className,
            zone2: document.getElementById("zone2")?.className,
            zone5: document.getElementById("zone5")?.className,
            zone_opponent2: document.getElementById("zone_opponent2")?.className,
            zone_opponent3: document.getElementById("zone_opponent3")?.className
          });
          ensureLocalPlayerProfileChosen();
          flushPendingPlayerMetaSnapshotIfNeeded();
          syncLocalProfileFromStorageToSeatCharacter();
          updatePlayersUiVisibility(num);
          recalculateAllPowerDisplays();
          applyTurnHighlight();
        }
        if (response.method === "RoomLobbyUpdate") {
          updateRoomLobbyBarFromServer(response.connectedPlayers, response.maxPlayers);
          if (!gameStarted) {
            const lobbyCount = Math.max(1, Math.min(6, Math.floor(Number(response.connectedPlayers) || 1)));
            updateLobbySeatIcons(lobbyCount);
            bindSeatIconHoverTooltips();
          }
          return;
        }
        if (response.method === "RoomPlayerMetaSnapshot") {
          applyPlayerMetaBySeatFromServer(response.playerMetaBySeat);
          if (localSeat === null || localSeat === void 0) {
            pendingPlayerMetaSnapshot = response.playerMetaBySeat;
          } else {
            pendingPlayerMetaSnapshot = null;
          }
          hideSeatIconTooltip();
          bindSeatIconHoverTooltips();
          recalculateAllPowerDisplays();
          return;
        }
        if (response.method === "RoomState") {
          const state = response.state;
          if (!state || typeof state !== "object") {
            return;
          }
          const seatFromMsg = parseInt(response.seat, 10);
          if ((localSeat === null || localSeat === void 0) && !Number.isNaN(seatFromMsg) && seatFromMsg >= 0) {
            localSeat = seatFromMsg;
          }
          flushPendingPlayerMetaSnapshotIfNeeded();
          const nPlayers = Number(state?.num) || window.num || num || 0;
          if (nPlayers > 0) {
            num = nPlayers;
            window.num = nPlayers;
          }
          console.log("[restore] RoomState received", { num: state.num, cards: Object.keys(state.cards || {}).length, hasGame: Boolean(state.game) });
          if (localSeat !== null && localSeat !== void 0) {
            applySeatLayoutForRestore(localSeat, window.num || num || state?.num);
            try {
              window.dispatchEvent(new Event("munchkin:zonesChanged"));
            } catch {
            }
          }
          console.log("[restore] before applyRoomStateFromServer", {
            localSeat,
            myhand: document.getElementById("myhand")?.className,
            opponent2hand: document.getElementById("opponent2hand")?.className,
            opponent3hand: document.getElementById("opponent3hand")?.className,
            zone2: document.getElementById("zone2")?.className,
            zone5: document.getElementById("zone5")?.className
          });
          applyRoomStateFromServer(state);
          console.log("[restore] after applyRoomStateFromServer", {
            localSeat,
            myhand: document.getElementById("myhand")?.className,
            opponent2hand: document.getElementById("opponent2hand")?.className,
            opponent3hand: document.getElementById("opponent3hand")?.className,
            zone2: document.getElementById("zone2")?.className,
            zone5: document.getElementById("zone5")?.className
          });
          return;
        }
        const maybeNum = parseInt(response.num, 10);
        if (!Number.isNaN(maybeNum) && maybeNum > 0) {
          num = maybeNum;
          window.num = maybeNum;
        }
        if (response.method === "moveCard") {
          const card = document.getElementById(response.cardId);
          const target = response.targetId ? document.getElementById(response.targetId) : null;
          let zone = null;
          if (response.zoneId) {
            const z = String(response.zoneId);
            const handMatch = z.match(/^hand(\d)$/);
            const mainMatch = z.match(/^main(\d)$/);
            const sideMatch = z.match(/^side(\d)$/);
            if (handMatch) {
              zone = getHandElementForPlayerSeat(parseInt(handMatch[1], 10));
            } else if (mainMatch) {
              zone = getMainAndSideZoneElementsForSeat(parseInt(mainMatch[1], 10))?.main || null;
            } else if (sideMatch) {
              zone = getMainAndSideZoneElementsForSeat(parseInt(sideMatch[1], 10))?.side || null;
            } else {
              zone = document.getElementById(z);
            }
          }
          const fromZone = response.fromZoneId ? document.getElementById(response.fromZoneId) : null;
          const prevParent = fromZone || card?.parentElement || null;
          const prevWasEquip = isPlayerPlayZoneElement(prevParent);
          if (card && zone) {
            if (target && zone.contains(target)) {
              zone.insertBefore(card, target.nextSibling);
            } else {
              zone.appendChild(card);
            }
          }
          if (response.zoneId === "zone_doors_drop" && card && String(card.dataset?.changeSexUsedNotDiscarded || "") === "1") {
            card.dataset.changeSexUsedNotDiscarded = "";
          }
          adjustCardWidth(".myhand");
          adjustCardWidth(".zone2");
          adjustCardWidth(".zone5");
          adjustCardHeight(".zone3");
          adjustCardHeight(".zone_monster");
          adjustCardWidth(".opponenthand");
          adjustCardWidth(".zone_opponent");
          adjustCardWidth(".zone_opponent_side");
          adjustCardWidth(".opponent2hand");
          adjustCardWidth(".zone_opponent2");
          adjustCardWidth(".zone_opponent2_side");
          adjustCardWidth(".opponent3hand");
          adjustCardWidth(".zone_opponent3");
          adjustCardWidth(".zone_opponent3_side");
          adjustCardWidth(".opponent_bl_hand");
          adjustCardWidth(".zone_opponent_bl");
          adjustCardWidth(".zone_opponent_bl_side");
          adjustCardWidth(".opponent_br_hand");
          adjustCardWidth(".zone_opponent_br");
          adjustCardWidth(".zone_opponent_br_side");
          syncBrTableZonesForPlayerCount();
          UpdatebackImgDoor();
          UpdatebackImgTreasure();
          if (card && String(card.id || "").includes("treasure") && isMainEquipmentZoneElement(zone)) {
            const seat = getGlobalSeatForPlayZone(zone);
            if (seat != null && Number(seat) === Number(localSeat)) {
              zone.querySelectorAll?.(".card")?.forEach((maybeCheatEl) => {
                if (!maybeCheatEl?.id) {
                  return;
                }
                const door96 = window.doors?.find((d) => d.name === maybeCheatEl.id);
                if (!door96 || String(door96.special || "") !== "Cheat") {
                  return;
                }
                const pending = String(maybeCheatEl.dataset?.cheatPendingTreasureId || "");
                if (pending && pending === card.id) {
                  maybeCheatEl.dataset.cheatPendingTreasureId = "";
                  socket_default.emit("message", { method: "CheatAttach", seat, cheatCardId: maybeCheatEl.id, treasureCardId: pending });
                }
              });
            }
          }
          if (card && isMainEquipmentZoneElement(prevParent) && !isMainEquipmentZoneElement(zone)) {
            const attachedCheatId = String(card.dataset?.cheatCardId || "");
            if (attachedCheatId) {
              card.dataset.cheatCardId = "";
              clearCheatVisualPlacement(attachedCheatId, card.id);
              const cheatEl = document.getElementById(attachedCheatId);
              const alreadyInDrop = cheatEl?.parentElement?.id === "zone_doors_drop";
              if (!alreadyInDrop) {
                socket_default.emit("message", {
                  method: "moveCard",
                  cardId: attachedCheatId,
                  targetId: null,
                  zoneId: "zone_doors_drop"
                });
              }
            }
          }
          if (card) {
            const hId = String(card.dataset?.hirelingCardId || "");
            if (hId) {
              const hEl = document.getElementById(hId);
              const hirelingParent = hEl?.parentElement || null;
              const sameContainer = Boolean(hirelingParent && zone && hirelingParent === zone);
              const toSideEquip = Boolean(zone && isSideEquipmentZoneElement(zone));
              const mustDetachHirelingCarry = !sameContainer || toSideEquip;
              if (mustDetachHirelingCarry) {
                card.dataset.hirelingJustDetached = "1";
                setTimeout(() => {
                  const el = document.getElementById(card.id);
                  if (el) {
                    el.dataset.hirelingJustDetached = "";
                  }
                }, 800);
                card.dataset.hirelingCardId = "";
                if (hEl && String(hEl.dataset?.hirelingAttachedTreasureId || "") === String(card.id || "")) {
                  hEl.dataset.hirelingAttachedTreasureId = "";
                  hEl.dataset.hirelingSuppressOffer = "1";
                  setTimeout(() => {
                    const hh = document.getElementById(hId);
                    if (hh) {
                      hh.dataset.hirelingSuppressOffer = "";
                    }
                  }, 800);
                }
                const detachSeat = getTreasureOwnerSeatFromZoneElement(prevParent) ?? getTreasureOwnerSeatFromZoneElement(hirelingParent);
                if (detachSeat != null && Number.isFinite(Number(detachSeat)) && Number(detachSeat) >= 0) {
                  socket_default.emit("message", {
                    method: "MercenaryDetach",
                    seat: Number(detachSeat),
                    hirelingCardId: hId,
                    treasureCardId: card.id
                  });
                }
              }
            }
          }
          if (card && isTreasureSpecial(card.id, "Hireling")) {
            const attachedId = String(card.dataset?.hirelingAttachedTreasureId || "");
            if (attachedId && zone) {
              const trEl = document.getElementById(attachedId);
              if (trEl && trEl.parentElement !== zone) {
                const zid = String(zone?.id || response.zoneId || "").trim();
                if (zid) {
                  socket_default.emit("message", { method: "moveCard", cardId: attachedId, targetId: null, zoneId: zid });
                }
              }
            }
          }
          if (card && zone) {
            if (isDoorSpecial(card.id, "Divine intervention") && zone.id === "zone_doors_drop") {
              card.dataset.divineScheduled = "";
            }
            scheduleDivineInterventionIfNeeded(card.id, zone);
          }
          if (card && zone && isDoorSpecial(card.id, "Mate")) {
            const prevId = prevParent?.id || "";
            const wasOnBattle = prevId === "zone_monster" || prevId === "zone3";
            const nowOnBattle = zone.id === "zone_monster" || zone.id === "zone3";
            if (wasOnBattle && !nowOnBattle) {
              const mateId = card.id;
              const pairId = String(card.dataset?.matePairId || "");
              const srcId = String(card.dataset?.mateSourceMonsterId || "");
              const monsterZone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
              if (monsterZone && pairId) {
                monsterZone.querySelectorAll(".card").forEach((el) => {
                  if (String(el?.dataset?.matePairId || "") === pairId) {
                    el.dataset.matePairId = "";
                  }
                });
              }
              if (monsterZone) {
                const srcEl = srcId ? document.getElementById(srcId) : null;
                const canReattach = Boolean(srcEl && srcEl.parentElement?.id === "zone_monster");
                monsterZone.querySelectorAll(".card").forEach((el) => {
                  const bId = el?.id;
                  if (!bId) {
                    return;
                  }
                  const bDoor = window.doors?.find((d) => d.name === bId);
                  if (!bDoor || String(bDoor.special || "") !== "bonus_power_monster") {
                    return;
                  }
                  if (String(el.dataset?.attachedMonsterId || "") === String(mateId)) {
                    el.dataset.attachedMonsterId = canReattach ? srcId : "";
                  }
                });
              }
              card.dataset.mateUsed = "";
              card.dataset.mateSourceMonsterId = "";
              card.dataset.matePairId = "";
            }
          }
          if (card && zone && isDoorSpecial(card.id, "Mate") && zone.id === "zone_doors_drop") {
            card.dataset.mateUsed = "";
            card.dataset.mateSourceMonsterId = "";
            card.dataset.matePairId = "";
            const door96 = window.doors?.find((d) => d.name === card.id);
            const imgEl = card.querySelector?.(".card-item");
            if (imgEl && door96?.img) {
              imgEl.src = door96.img;
            }
          }
          if (card && zone && isDoorSpecial(card.id, "Mate") && zone.id === "zone3") {
            if (!card.dataset?.mateRelocating) {
              card.dataset.mateRelocating = "1";
              socket_default.emit("message", { method: "moveCard", cardId: card.id, targetId: null, zoneId: "zone_monster", fromZoneId: "zone3" });
            }
          }
          if (card && zone && isDoorSpecial(card.id, "Mate") && zone.id === "zone_monster") {
            card.dataset.mateRelocating = "";
          }
          if (card && zone) {
            if (isDoorSpecial(card.id, "Out to lunch") && zone.id === "zone_doors_drop") {
              card.dataset.outToLunchScheduled = "";
            }
            scheduleOutToLunchIfNeeded(card.id, zone);
          }
          if (card && zone) {
            if (isTreasureSpecial(card.id, "Friendship potion") && zone.id === "zone_treasure_drop") {
              card.dataset.friendshipPotionScheduled = "";
            }
            scheduleFriendshipPotionIfNeeded(card.id, zone);
          }
          if (card && zone) {
            if (isTreasureSpecial(card.id, "Potion of halitosis") && zone.id === "zone_treasure_drop") {
              card.dataset.halitosisScheduled = "";
              card.dataset.halitosisActorSeat = "";
            }
            scheduleHalitosisPotionIfNeeded(card.id, zone, response.playedBySeat);
          }
          if (card && zone) {
            scheduleWandOfDowsingIfNeeded(card.id, zone, response.playedBySeat);
          }
          if (card && zone) {
            scheduleTransferralPotionIfNeeded(card.id, zone, response.playedBySeat);
          }
          if (card && zone && zone.id === "zone_treasure_drop") {
            const tr = window.treasures?.find((t) => t.name === card.id);
            if (tr && (String(tr.special || "") === "Magic lamp" || String(tr.special || "") === "Pollymorth Potion")) {
              card.dataset.potionUsed = "";
            }
            if (isTreasureSpecial(card.id, "Wand of dowsing")) {
              card.dataset.wandDowsingScheduled = "";
            }
            if (isTreasureSpecial(card.id, "Transferral potion")) {
              card.dataset.transferralPotionScheduled = "";
            }
            if (isTreasureSpecial(card.id, "Potion of halitosis")) {
              card.dataset.halitosisScheduled = "";
              card.dataset.halitosisActorSeat = "";
            }
          }
          if (card && String(card.id || "").includes("treasure") && isMainEquipmentZoneElement(zone)) {
            const seat = getGlobalSeatForPlayZone(zone);
            if (seat != null && Number(seat) === Number(localSeat)) {
              if (card.dataset?.hirelingJustDetached) {
                return;
              }
              const tr = window.treasures?.find((t) => t.name === card.id);
              const alreadyBound = Boolean(card.dataset?.hirelingCardId) || Boolean(card.dataset?.cheatCardId) || Boolean(card.dataset?.cheatPendingIncoming);
              const isHireling = isTreasureSpecial(card.id, "Hireling");
              if (tr && !tr.oneTime && !alreadyBound && !isHireling) {
                const hEl = getHirelingCardInMainForSeat(seat);
                if (hEl && !String(hEl.dataset?.hirelingAttachedTreasureId || "") && !hEl.dataset?.hirelingSuppressOffer) {
                  openHirelingOfferModal({ seat, treasureCardId: card.id, fromZoneId: response.fromZoneId || null });
                }
              }
            }
          }
          if (card && card.dataset?.cheatCardId && !isMainEquipmentZoneElement(zone)) {
            const attachedCheatId = String(card.dataset.cheatCardId || "");
            card.dataset.cheatCardId = "";
            clearCheatVisualPlacement(attachedCheatId, card.id);
            const cheatEl = document.getElementById(attachedCheatId);
            const alreadyInDrop = cheatEl?.parentElement?.id === "zone_doors_drop";
            if (attachedCheatId && !alreadyInDrop) {
              socket_default.emit("message", {
                method: "moveCard",
                cardId: attachedCheatId,
                targetId: null,
                zoneId: "zone_doors_drop"
              });
            }
          }
          const movedDoor = window.doors?.find((d) => d.name === response.cardId);
          if (movedDoor && String(movedDoor.special || "") === "Cheat") {
            const movedEl = document.getElementById(response.cardId);
            if (movedEl) {
              if (response.zoneId === "zone_doors_drop") {
                movedEl.dataset.cheatUsed = "";
              }
              if (response.zoneId === "zone_doors_drop") {
                const trId = String(movedEl.dataset?.cheatAttachedTreasureId || "");
                if (trId) {
                  const trEl = document.getElementById(trId);
                  if (trEl) {
                    trEl.dataset.cheatCardId = "";
                  }
                }
                clearCheatVisualPlacement(movedEl.id, trId);
                movedEl.dataset.cheatAttachedTreasureId = "";
              } else if (!isPlayerPlayZoneElement(zone)) {
                clearCheatVisualPlacement(movedEl.id, String(movedEl.dataset?.cheatAttachedTreasureId || ""));
                movedEl.dataset.cheatAttachedTreasureId = "";
              }
            }
          }
          if (movedDoor && String(movedDoor.special || "") === "bonus_power_monster") {
            const movedEl = document.getElementById(response.cardId);
            if (movedEl && response.zoneId !== "zone_monster") {
              movedEl.dataset.attachedMonsterId = "";
            }
          }
          pushMonsterBonusAttachmentsToServer();
          recalculateAllPowerDisplays();
          UpdateZones();
        }
        if (response.method === "UpdatePower") {
          recalculateAllPowerDisplays();
        }
        if (response.method === "PlayerMeta") {
          const seat = parseInt(response.seat, 10);
          if (Number.isNaN(seat) || seat < 0) {
            return;
          }
          const name = String(response.name || "").trim();
          const gender = String(response.gender || "");
          if (characterBySeat?.[seat]) {
            characterBySeat[seat].name = name;
            characterBySeat[seat].gender = gender === "Male" || gender === "Female" ? gender : "";
          }
          recalculateAllPowerDisplays();
          hideSeatIconTooltip();
        }
        if (response.method === "CheatAttach") {
          const seat = parseInt(response.seat, 10);
          const cheatCardId = String(response.cheatCardId || "");
          const treasureCardId = String(response.treasureCardId || "");
          if (Number.isNaN(seat) || seat < 0 || !cheatCardId || !treasureCardId) {
            return;
          }
          setCheatAttachment(cheatCardId, treasureCardId);
          const trEl = document.getElementById(treasureCardId);
          if (trEl) {
            trEl.dataset.cheatPendingIncoming = "";
          }
        }
        if (response.method === "MercenaryAttach") {
          const seat = parseInt(response.seat, 10);
          const hirelingCardId = String(response.hirelingCardId || "");
          const treasureCardId = String(response.treasureCardId || "");
          if (Number.isNaN(seat) || seat < 0 || !hirelingCardId || !treasureCardId) {
            return;
          }
          setHirelingAttachment(hirelingCardId, treasureCardId);
        }
        if (response.method === "MercenaryDetach") {
          const seat = parseInt(response.seat, 10);
          const hirelingCardId = String(response.hirelingCardId || "");
          const treasureCardId = String(response.treasureCardId || "");
          if (Number.isNaN(seat) || seat < 0 || !hirelingCardId || !treasureCardId) {
            return;
          }
          clearHirelingAttachment(hirelingCardId, treasureCardId);
        }
        if (response.method === "DivineInterventionResolve") {
          const cardId = String(response.cardId || "");
          const clericSeats = Array.isArray(response.clericSeats) ? response.clericSeats : null;
          if (!cardId) {
            return;
          }
          applyDivineInterventionResolve(cardId, clericSeats);
        }
        if (response.method === "OutToLunchResolve") {
          const cardId = String(response.cardId || "");
          if (!cardId) {
            return;
          }
          applyOutToLunchResolve(cardId);
        }
        if (response.method === "FriendshipPotionResolve") {
          const cardId = String(response.cardId || "");
          if (!cardId) {
            return;
          }
          applyFriendshipPotionResolve(cardId);
        }
        if (response.method === "HalitosisKillDoor68Resolve") {
          const potionCardId = String(response.potionCardId || "");
          if (!potionCardId) {
            return;
          }
          applyHalitosisKillDoor68Resolve(potionCardId);
        }
        if (response.method === "WandOfDowsingResolve") {
          const wandCardId = String(response.wandCardId || "");
          const pickedCardId = String(response.pickedCardId || "");
          const actorSeat = parseInt(response.actorSeat, 10);
          if (!wandCardId || Number.isNaN(actorSeat) || actorSeat < 0) {
            return;
          }
          applyWandOfDowsingResolve({ wandCardId, pickedCardId, actorSeat });
        }
        if (response.method === "TransferralPotionResolve") {
          const potionCardId = String(response.potionCardId || "");
          const newFighterSeat = parseInt(response.newFighterSeat, 10);
          if (!potionCardId || Number.isNaN(newFighterSeat) || newFighterSeat < 0) {
            return;
          }
          applyTransferralPotionResolve({ potionCardId, newFighterSeat });
        }
        if (response.method === "PotionResolve") {
          const potionCardId = String(response.potionCardId || "");
          const monsterCardId = String(response.monsterCardId || "");
          if (!potionCardId || !monsterCardId) {
            return;
          }
          applyPotionDiscardMonster({ potionCardId, monsterCardId });
          hidePotionPickMonsterModal();
        }
        if (response.method === "PotionResolveSingleMonster") {
          const potionCardId = String(response.potionCardId || "");
          if (!potionCardId) {
            return;
          }
          const el = document.getElementById(potionCardId);
          if (el) {
            el.dataset.potionUsed = "";
          }
          endBattleNoWinnerAndDropBattlefield(null, 0);
          hidePotionPickMonsterModal();
        }
        if (response.method === "IllusionResolve") {
          const illusionCardId = String(response.illusionCardId || "");
          const discardMonsterId = String(response.discardMonsterId || "");
          const addMonsterId = String(response.addMonsterId || "");
          if (!illusionCardId || !discardMonsterId || !addMonsterId) {
            return;
          }
          moveCardToDiscardById(discardMonsterId);
          moveBadStaffCardToDiscard(illusionCardId);
          const illEl = document.getElementById(illusionCardId);
          if (illEl) {
            illEl.dataset.illusionUsed = "";
          }
          const addEl = document.getElementById(addMonsterId);
          const monsterZone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
          if (addEl && monsterZone) {
            monsterZone.appendChild(addEl);
            UpdatebackImgDoor();
            adjustCardHeight(".zone_monster");
          }
          setMonsterBasePower(computeMonsterZoneBasePower());
          recalculateAllPowerDisplays();
          hidePotionPickMonsterModal();
          const m = document.getElementById("illusion-pick-hand-monster-modal");
          if (m) {
            m.remove();
          }
        }
        if (response.method === "MateApply") {
          const mateCardId = String(response.mateCardId || "");
          const sourceMonsterId = String(response.sourceMonsterId || "");
          const pairId = String(response.pairId || "");
          if (!mateCardId || !sourceMonsterId || !pairId) {
            return;
          }
          const mateEl = document.getElementById(mateCardId);
          const srcEl = document.getElementById(sourceMonsterId);
          const srcDoor = window.doors?.find((d) => d.name === sourceMonsterId);
          if (!mateEl || !srcEl || !srcDoor || String(srcDoor.race || "") !== "monster") {
            return;
          }
          if (srcEl.dataset?.matePairId) {
            mateEl.dataset.mateUsed = "";
            return;
          }
          srcEl.dataset.matePairId = pairId;
          mateEl.dataset.matePairId = pairId;
          mateEl.dataset.mateSourceMonsterId = sourceMonsterId;
          setMonsterBasePower(computeMonsterZoneBasePower());
          recalculateAllPowerDisplays();
          hideMatePickModal();
        }
        if (response.method === "SetTurn") {
          const nextSeat = parseInt(response.seat, 10);
          if (!Number.isNaN(nextSeat)) {
            setCurrentTurn(nextSeat, false);
          }
        }
        if (response.method === "WarriorFrenzyApply") {
          applyWarriorFrenzyDiscardAndBonus(response.seat, response.cardIds);
        }
        if (response.method === "ClericExorcismApply") {
          applyClericExorcismDiscardAndBonus(response.seat, response.cardIds);
        }
        if (response.method === "ThiefTrimApply") {
          applyThiefTrimDiscardAndDebuff(response.seat, response.assignments);
        }
        if (response.method === "ThiefTheftStart") {
          applyThiefTheftStartDiscard(response.seat, response.cardId);
        }
        if (response.method === "ThiefTheftRoll") {
          applyThiefTheftRollResult(response.seat, response.value);
        }
        if (response.method === "ThiefTheftTake") {
          const hId = String(response.hirelingCardId || "");
          if (hId && response.cardId) {
            clearHirelingAttachment(hId, response.cardId);
          }
          applyThiefTheftStolenCardMove(response.thiefSeat, response.fromSeat, response.cardId);
        }
        if (response.method === "WizardFlightApply") {
          applyWizardFlightDiscardAndResolve(response.seat, response.cardIds);
        }
        if (response.method === "WizardTamingApply") {
          applyWizardTaming(response.seat, response.handCardIds, response.monsterCardId);
        }
        if (response.method === "OfferHelp") {
          const helperSeat = parseInt(response.helperSeat, 10);
          const turnSeat = parseInt(response.turnSeat, 10);
          if (monsterBattlefieldDismissesBattleHelpers()) {
            return;
          }
          if (!Number.isNaN(helperSeat) && !Number.isNaN(turnSeat) && acceptedHelperSeat === null) {
            pendingHelpSeats.add(helperSeat);
            updateHelpUi();
          }
        }
        if (response.method === "AcceptHelp") {
          if (monsterBattlefieldDismissesBattleHelpers()) {
            return;
          }
          const helperSeat = parseInt(response.helperSeat, 10);
          const turnSeat = parseInt(response.turnSeat, 10);
          if (!Number.isNaN(helperSeat) && !Number.isNaN(turnSeat) && acceptedHelperSeat === null) {
            acceptedHelperSeat = helperSeat;
            pendingHelpSeats.clear();
            applyTurnHighlight();
            recalculateAllPowerDisplays();
            updateHelpUi();
          }
          if (!Number.isNaN(helperSeat) && Number(localSeat) === Number(helperSeat)) {
            tryActivateMalignMirrorForSeat(helperSeat);
            recalculateAllPowerDisplays();
          }
        }
        if (response.method === "DissolveBattleHelp") {
          pendingHelpSeats.clear();
          acceptedHelperSeat = null;
          hideAllAcceptHelpButtons();
          scheduleTurnStateSync();
          recalculateAllPowerDisplays();
          updateHelpUi();
          applyTurnHighlight();
        }
        if (response.method === "CombatResolved") {
          const resolvedSeat = parseInt(response.seat, 10);
          if (response.winner === "player") {
            const updatedLevel = parseInt(response.level, 10);
            if (!Number.isNaN(updatedLevel)) {
              setLevelBySeat(response.seat, updatedLevel);
              recalculateAllPowerDisplays();
            }
            const helperSeat = parseInt(response.helperSeat, 10);
            const helperLevel = parseInt(response.helperLevel, 10);
            const helperLevelGain = Number(response.helperLevelGain) || 0;
            if (!Number.isNaN(helperSeat) && !Number.isNaN(helperLevel) && helperLevelGain > 0) {
              setLevelBySeat(helperSeat, helperLevel);
              recalculateAllPowerDisplays();
            }
          }
          if (response.winner === "monster" && !Number.isNaN(resolvedSeat)) {
            showBattleResult(`\u041F\u043E\u0431\u0435\u0434\u0438\u043B \u043C\u043E\u043D\u0441\u0442\u0440, ${seatAddressComma(resolvedSeat)} \u043A\u0438\u043D\u044C \u043A\u0443\u0431\u0438\u043A, \u0447\u0442\u043E\u0431\u044B \u0441\u043C\u044B\u0442\u044C\u0441\u044F \u043E\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u0430.`);
          } else if (response.winner === "player") {
            showBattleResult(response.text || (response.winner === "player" ? "\u041C\u043E\u043D\u0441\u0442\u0440 \u043F\u043E\u0432\u0435\u0440\u0436\u0435\u043D" : "\u041F\u043E\u0431\u0435\u0434\u0438\u043B \u043C\u043E\u043D\u0441\u0442\u0440"));
            setTimeout(() => {
              hideBattleResult();
            }, 1500);
          } else {
            hideBattleResult();
          }
          pendingHelpSeats.clear();
          acceptedHelperSeat = null;
          monsterFightSeat = null;
          battleActive = false;
          battleTurnSeat = null;
          for (const [seat, curseId] of malignMirrorActiveBySeat.entries()) {
            if (Number(localSeat) === Number(seat) && curseId) {
              syncDoorCardMoveToDiscard(curseId);
            }
          }
          malignMirrorPendingBySeat.clear();
          malignMirrorActiveBySeat.clear();
          for (const [seat, curseId] of changeSexPendingBySeat.entries()) {
            if (Number(localSeat) === Number(seat) && curseId) {
              syncDoorCardMoveToDiscard(curseId);
            }
          }
          for (const [seat, curseId] of changeSexActiveBySeat.entries()) {
            if (Number(localSeat) === Number(seat) && curseId) {
              syncDoorCardMoveToDiscard(curseId);
            }
          }
          changeSexPendingBySeat.clear();
          changeSexActiveBySeat.clear();
          applyTurnHighlight();
          updateHelpUi();
          if (response.winner === "player") {
            MoveMonstersToDrop();
            turnAwaitingManualEnd = true;
          } else if (response.winner === "none") {
            MoveMonstersToDrop();
            turnAwaitingManualEnd = true;
          } else if (!Number.isNaN(resolvedSeat) && localSeat === resolvedSeat) {
            escapeMonsterBadStaff = normalizeBadStaff(response.monsterBadStaff);
            escapeMonsterQueue = Array.isArray(response.monsterQueue) ? response.monsterQueue.slice() : [];
            startEscapeSequenceAndBroadcast(response.seat, response.helperSeat, response.monsterRemover);
          }
          recalculateAllPowerDisplays();
          updateTurnActionButtons(false);
        }
        if (response.method === "DeathStart") {
          const deadSeat = parseInt(response.deadSeat, 10);
          const ownerSeat = parseInt(response.ownerSeat, 10);
          const lootersOrder = Array.isArray(response.lootersOrder) ? response.lootersOrder.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x)) : [];
          const lootCardIds = Array.isArray(response.lootCardIds) ? response.lootCardIds.filter(Boolean) : [];
          if (Number.isNaN(deadSeat) || deadSeat < 0) {
            return;
          }
          deathLootActive = true;
          deathLootState = {
            deadSeat,
            ownerSeat: !Number.isNaN(ownerSeat) ? ownerSeat : deadSeat,
            lootersOrder,
            remaining: lootCardIds.slice(),
            index: 0
          };
          removeSeatFromEscapeQueue(deadSeat);
          battleActive = false;
          battleTurnSeat = null;
          pendingHelpSeats.clear();
          acceptedHelperSeat = null;
          monsterFightSeat = null;
          applyTurnHighlight();
          updateHelpUi();
          updateTurnActionButtons(false);
          if (localSeat === deadSeat) {
            showLootStatus("\u0422\u044B \u0443\u043C\u0435\u0440.");
          } else {
            showLootStatus(`${getSeatLabel(deadSeat)} \u043F\u043E\u0433\u0438\u0431. \u041D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F \u0433\u0440\u0430\u0431\u0451\u0436.`);
          }
          const lootZone = ensureDeathLootZoneElement();
          lootZone.replaceChildren();
          if (deathLootState && Number(localSeat) === Number(deathLootState.ownerSeat)) {
            let prevId = null;
            lootCardIds.forEach((id) => {
              const move = {
                method: "moveCard",
                cardId: id,
                targetId: prevId,
                zoneId: "death-loot-zone"
              };
              applyMoveCardLocally(move);
              socket_default.emit("message", move);
              prevId = id;
            });
          }
          adjustCardWidth(".zone_doors_drop");
          adjustCardWidth(".zone_treasure_drop");
          recalculateAllPowerDisplays();
          if (deathLootState && Number(localSeat) === Number(deathLootState.ownerSeat) && lootCardIds.length === 0) {
            socket_default.emit("message", {
              method: "DeathLootFinished",
              deadSeat,
              remainingCardIds: []
            });
            return;
          }
          if (deathLootState && Number(localSeat) === Number(deathLootState.ownerSeat)) {
            socket_default.emit("message", {
              method: "DeathLootTurn",
              deadSeat,
              ownerSeat: deathLootState.ownerSeat,
              looterSeat: lootersOrder[0] ?? null,
              remainingCardIds: lootCardIds.slice()
            });
          }
        }
        if (response.method === "DeathLootTurn") {
          const deadSeat = parseInt(response.deadSeat, 10);
          const ownerSeat = parseInt(response.ownerSeat, 10);
          const looterSeat = parseInt(response.looterSeat, 10);
          const remainingCardIds = Array.isArray(response.remainingCardIds) ? response.remainingCardIds.filter(Boolean) : [];
          if (Number.isNaN(deadSeat) || Number.isNaN(looterSeat)) {
            return;
          }
          if (!deathLootActive || !deathLootState || Number(deathLootState.deadSeat) !== Number(deadSeat)) {
            deathLootActive = true;
            deathLootState = {
              deadSeat,
              ownerSeat: !Number.isNaN(ownerSeat) ? ownerSeat : deathLootState?.ownerSeat ?? escapeOwnerSeat ?? deadSeat,
              lootersOrder: [],
              remaining: remainingCardIds.slice(),
              index: 0
            };
          } else {
            deathLootState.remaining = remainingCardIds.slice();
            if (deathLootState.ownerSeat == null && !Number.isNaN(ownerSeat)) {
              deathLootState.ownerSeat = ownerSeat;
            }
          }
          if (localSeat === deadSeat) {
            showLootStatus("\u0422\u044B \u0443\u043C\u0435\u0440.");
          } else if (localSeat === looterSeat) {
            showLootStatus(`\u0422\u0432\u043E\u044F \u043E\u0447\u0435\u0440\u0435\u0434\u044C \u0433\u0440\u0430\u0431\u0438\u0442\u044C ${getSeatLabel(deadSeat)}`);
          } else {
            showLootStatus(`\u0421\u0435\u0439\u0447\u0430\u0441 \u0433\u0440\u0430\u0431\u0438\u0442 ${getSeatLabel(looterSeat)} (${getSeatLabel(deadSeat)})`);
          }
          if (localSeat === looterSeat) {
            if (!remainingCardIds.length) {
              return;
            }
            openDeathLootPickModal(deadSeat, looterSeat, remainingCardIds);
          } else {
            const modal = document.getElementById("death-loot-pick-modal");
            if (modal) {
              modal.remove();
            }
          }
        }
        if (response.method === "DeathLootPicked") {
          const deadSeat = parseInt(response.deadSeat, 10);
          const looterSeat = parseInt(response.looterSeat, 10);
          const cardId = response.cardId;
          const remainingCardIds = Array.isArray(response.remainingCardIds) ? response.remainingCardIds.filter(Boolean) : [];
          if (Number.isNaN(deadSeat) || Number.isNaN(looterSeat) || !cardId) {
            return;
          }
          if (deathLootState && Number(deathLootState.deadSeat) === Number(deadSeat)) {
            deathLootState.remaining = remainingCardIds.slice();
          }
          const modal = document.getElementById("death-loot-pick-modal");
          if (modal) {
            modal.remove();
          }
          recalculateAllPowerDisplays();
        }
        if (response.method === "DeathLootFinished") {
          const deadSeat = parseInt(response.deadSeat, 10);
          const remainingCardIds = Array.isArray(response.remainingCardIds) ? response.remainingCardIds.filter(Boolean) : [];
          if (Number.isNaN(deadSeat)) {
            return;
          }
          const lootOwnerSeatSnapshot = deathLootState?.ownerSeat;
          remainingCardIds.forEach((id) => moveCardIdToDiscard(id));
          deathLootActive = false;
          deathLootState = null;
          clearDeathLootUi();
          showLootStatus(`\u0413\u0440\u0430\u0431\u0451\u0436 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D. ${getSeatLabel(deadSeat)} \u0432\u043E\u0437\u0440\u043E\u0436\u0434\u0430\u0435\u0442\u0441\u044F \u0431\u0435\u0437 \u043A\u0430\u0440\u0442.`);
          setTimeout(() => {
            hideBattleResult();
          }, 1800);
          recalculateAllPowerDisplays();
          const canResumeEscape = escapeActive && Array.isArray(escapeQueue) && escapeQueue.length > 0 && (escapeQueueIndex < 0 || escapeQueueIndex < escapeQueue.length);
          if (canResumeEscape && lootOwnerSeatSnapshot != null && Number(localSeat) === Number(lootOwnerSeatSnapshot)) {
            if (!escapeActive) {
              escapeActive = true;
            }
            if (escapeQueueIndex < 0) {
              escapeQueueIndex = 0;
            }
            deathLootAwaitingEscapeFinish = true;
            socket_default.emit("message", {
              method: "DeathLootResumeEscape",
              ownerSeat: lootOwnerSeatSnapshot
            });
            return;
          }
          if (lootOwnerSeatSnapshot != null && Number(localSeat) === Number(lootOwnerSeatSnapshot)) {
            socket_default.emit("message", {
              method: "DeathLootDropMonsters"
            });
          }
        }
        if (response.method === "DeathLootResumeEscape") {
          const ownerSeat = parseInt(response.ownerSeat, 10);
          deathLootAwaitingEscapeFinish = true;
          if (!Number.isNaN(ownerSeat) && ownerSeat >= 0) {
            escapeOwnerSeat = ownerSeat;
          }
          if (!escapeActive) {
            escapeActive = true;
          }
          if (escapeQueueIndex < 0) {
            escapeQueueIndex = 0;
          }
          turnAwaitingManualEnd = false;
          updateTurnActionButtons(false);
          setTimeout(() => {
            if (!Number.isNaN(ownerSeat) && Number(localSeat) === Number(ownerSeat)) {
              runNextEscapeAttemptAndBroadcast();
            }
          }, 500);
        }
        if (response.method === "DeathLootDropMonsters") {
          deathLootAwaitingEscapeFinish = false;
          MoveMonstersToDrop();
          turnAwaitingManualEnd = true;
          updateTurnActionButtons(false);
          recalculateAllPowerDisplays();
        }
        if (response.method === "MonsterBonusAttach") {
          const bonusCardId = response.bonusCardId;
          const monsterCardId = response.monsterCardId;
          if (bonusCardId && monsterCardId) {
            setBonusPowerMonsterAttachment(bonusCardId, monsterCardId);
          }
        }
        if (response.method === "EscapeSequenceStart") {
          const incomingOwnerSeat = parseInt(response.ownerSeat, 10);
          hideEscapeAidOptionsModal(true);
          hideEscapeRatMonsterPickModal();
          if (escapeActive && escapeQueue.length > 0 && !Number.isNaN(incomingOwnerSeat) && localSeat === incomingOwnerSeat) {
            return;
          }
          escapeActive = true;
          escapeQueue = Array.isArray(response.queue) ? response.queue.slice() : [];
          escapeQueueIndex = -1;
          escapeMonsterRemover = Number(response.monsterRemover) || 0;
          escapeMonsterBadStaff = normalizeBadStaff(response.monsterBadStaff);
          escapeMonsterQueue = Array.isArray(response.monsterQueue) ? response.monsterQueue.slice() : [];
          escapeMonsterTemplateQueue = Array.isArray(response.monsterTemplateQueue) ? response.monsterTemplateQueue.slice() : escapeMonsterQueue.slice();
          escapeMonsterInitialCount = Number(response.monsterInitialCount) || escapeMonsterQueue.length;
          escapeOwnerSeat = incomingOwnerSeat;
          escapeAttemptNumber = 0;
          escapeHalflingRetryUsedForCurrentAttempt = false;
          escapeHalflingRetryPending = null;
          escapeWizardFlightPending = null;
          hideWizardFlightModal();
          hideEscapeHalflingRetryModal();
          escapeInstantWallGate = null;
          if (Array.isArray(escapeQueue) && escapeQueue.length === 2) {
            const a = Number(escapeQueue[0]);
            const b = Number(escapeQueue[1]);
            if (Number.isFinite(a) && Number.isFinite(b) && a !== b) {
              escapeInstantWallGate = { loserSeat: a, helperSeat: b };
            }
          }
          recalculateAllPowerDisplays();
          updateTurnActionButtons(false);
        }
        if (response.method === "EscapeMonsterPickStart") {
          const seat = parseInt(response.seat, 10);
          const monsters = Array.isArray(response.monsters) ? response.monsters : [];
          hideEscapeRatMonsterPickModal();
          hideEscapeMonsterPicker();
          if (!Number.isNaN(seat) && monsters.length > 0) {
            escapeMonsterPickSession = {
              seat,
              monsters: cloneTurnStateJson(monsters) || []
            };
            flushTurnStateSyncToServer();
          } else {
            clearEscapeMonsterPickSession();
          }
          if (!Number.isNaN(seat) && localSeat === seat) {
            const aidEntries = collectEscapeAidCardEntriesForSeat(seat);
            const hasAid = aidEntries.length > 0;
            if (hasAid) {
              openEscapeAidOptionsModal();
            } else {
              maybeTryOpenEscapeAidOptionsModal();
            }
            if (!hasAid && !shouldSuppressEscapeMonsterPickBannerForSeat(seat)) {
              showBattleResult("\u0412\u044B\u0431\u0435\u0440\u0438 \u043C\u043E\u043D\u0441\u0442\u0440\u0430, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0431\u0443\u0434\u0435\u0448\u044C \u0441\u043C\u044B\u0432\u0430\u0442\u044C\u0441\u044F.");
              showEscapeMonsterPicker(monsters, (cardId) => {
                hideEscapeMonsterPicker();
                socket_default.emit("message", {
                  method: "EscapeMonsterChosen",
                  seat: localSeat,
                  cardId
                });
              });
            }
          } else if (!Number.isNaN(seat) && !shouldSuppressEscapeMonsterPickBannerForSeat(seat)) {
            showBattleResult(`${getSeatLabel(seat)} \u0432\u044B\u0431\u0438\u0440\u0430\u0435\u0442 \u043C\u043E\u043D\u0441\u0442\u0440\u0430 \u0434\u043B\u044F \u0441\u043C\u044B\u0432\u043A\u0438...`);
          }
        }
        if (response.method === "EscapeMonsterChosen") {
          clearEscapeMonsterPickSession();
          hideEscapeMonsterPicker();
          const chosenSeat = parseInt(response.seat, 10);
          const pickedId = response.cardId ? String(response.cardId) : "";
          if (!Number.isNaN(chosenSeat) && pickedId) {
            setCurrentEscapeMonsterById(pickedId);
          }
          if (localSeat === escapeOwnerSeat && !Number.isNaN(chosenSeat) && chosenSeat === escapeQueue[escapeQueueIndex]) {
            socket_default.emit("message", {
              method: "EscapeTurnStart",
              seat: chosenSeat,
              index: escapeQueueIndex,
              isRetry: false
            });
          }
          flushTurnStateSyncToServer();
        }
        if (response.method === "EscapeTurnStart") {
          clearEscapeMonsterPickSession();
          const seat = parseInt(response.seat, 10);
          const isRetry = Boolean(response.isRetry);
          if (!Number.isNaN(seat)) {
            escapeCurrentSeat = seat;
            escapeWaitingForRoll = true;
            escapeRollInProgress = false;
            if (!isRetry) {
              escapeAttemptNumber = 0;
              escapeHalflingRetryUsedForCurrentAttempt = false;
              escapeHalflingRetryPending = null;
            }
            hideEscapeHalflingRetryModal();
            showEscapeTurnText(seat);
          }
          flushTurnStateSyncToServer();
          maybeTryOpenEscapeAidOptionsModal();
          if (!Number.isNaN(seat) && escapeWaitingForRoll && isEscapeAutoSuccessForMonster(escapeCurrentMonsterCardId, seat)) {
            setTimeout(() => {
              if (Number(localSeat) !== Number(escapeOwnerSeat)) {
                return;
              }
              if (!escapeWaitingForRoll || !escapeActive) {
                return;
              }
              const payload = {
                method: "EscapeRollResult",
                seat: Number(seat),
                escapePenaltySeat: Number(seat),
                rawRoll: 6,
                equipRemover: getSeatEquipmentRemover(Number(seat)),
                monsterRemover: escapeMonsterRemover,
                totalRoll: ESCAPE_TARGET_ROLL,
                escaped: true,
                badStaffPenalty: null,
                monsterCardId: escapeCurrentMonsterCardId,
                viaAutoEscapeMonster: true
              };
              emitEscapeRollResultAndAdvance(payload);
            }, 80);
          }
          if (!Number.isNaN(seat) && escapeWaitingForRoll && isCurrentEscapeMonsterAutoFailEscape()) {
            setTimeout(() => {
              if (Number(localSeat) !== Number(escapeOwnerSeat)) {
                return;
              }
              if (!escapeWaitingForRoll || !escapeActive) {
                return;
              }
              const payload = {
                method: "EscapeRollResult",
                seat: Number(seat),
                escapePenaltySeat: Number(seat),
                rawRoll: 1,
                equipRemover: getSeatEquipmentRemover(Number(seat)),
                monsterRemover: escapeMonsterRemover,
                totalRoll: 0,
                escaped: false,
                badStaffPenalty: escapeMonsterBadStaff,
                monsterCardId: escapeCurrentMonsterCardId,
                viaAutoFailEscapeMonster: true
              };
              emitEscapeRollResultAndAdvance(payload);
            }, 80);
          }
        }
        if (response.method === "EscapeCloseAidModals") {
          hideEscapeAidOptionsModal(true);
          hideEscapeRatMonsterPickModal();
          hideEscapeLoseHandOrLevelsModal();
        }
        if (response.method === "EscapeFailAidPrompt") {
          const seat = parseInt(response.seat, 10);
          const attemptNumber = Number(response.attemptNumber) || 0;
          const payload = response.payload && typeof response.payload === "object" ? response.payload : null;
          if (Number.isNaN(seat) || !payload) {
            return;
          }
          escapeFailAidPending = { seat, payload: cloneTurnStateJson(payload) || { ...payload }, attemptNumber };
          if (Number(localSeat) === Number(seat)) {
            openEscapeFailAidModal({ seat, attemptNumber });
          } else {
            showBattleResult(`${getSeatLabel(seat)} \u0432\u044B\u0431\u0438\u0440\u0430\u0435\u0442, \u043A\u0430\u043A \u043F\u043E\u043C\u043E\u0447\u044C \u0441\u043C\u044B\u0432\u043A\u0435...`);
          }
        }
        if (response.method === "EscapeFailAidSkip") {
          if (Number(localSeat) !== Number(escapeOwnerSeat)) {
            return;
          }
          const seat = parseInt(response.seat, 10);
          if (Number.isNaN(seat) || !escapeFailAidPending || Number(escapeFailAidPending.seat) !== Number(seat) || !escapeFailAidPending.payload) {
            return;
          }
          const pendingPayload = { ...escapeFailAidPending.payload };
          escapeFailAidPending = null;
          emitEscapeRollResultAndAdvance(pendingPayload);
        }
        if (response.method === "EscapeLoseHandOrLevelsResolve") {
          hideEscapeLoseHandOrLevelsModal();
          applyEscapeLoseHandOrLevelsResolveFromNetwork(response);
        }
        if (response.method === "EscapeInvisibilityPotionApply") {
          const actingSeat = Number(response.actingSeat);
          const cardId = String(response.cardId || "");
          if (escapeFailAidPending && Number(escapeFailAidPending.seat) === Number(actingSeat)) {
            escapeFailAidPending = null;
          }
          hideEscapeFailAidModal();
          hideWizardFlightModal();
          updateWizardFlightUi();
          if (cardId && Number.isFinite(actingSeat)) {
            moveTreasureCardToDiscard(cardId, { ownerSeat: actingSeat });
          }
          adjustCardWidth(".myhand");
          adjustCardWidth(".zone2");
          adjustCardWidth(".zone5");
          adjustCardWidth(".opponenthand");
          adjustCardWidth(".opponent2hand");
          adjustCardWidth(".opponent3hand");
          UpdatebackImgTreasure();
          if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive && Number.isFinite(actingSeat) && Number(actingSeat) === Number(escapeCurrentSeat)) {
            const fleeSeat = Math.floor(Number(escapeCurrentSeat));
            const payload = {
              method: "EscapeRollResult",
              seat: fleeSeat,
              escapePenaltySeat: fleeSeat,
              rawRoll: 6,
              equipRemover: getSeatEquipmentRemover(fleeSeat),
              monsterRemover: escapeMonsterRemover,
              totalRoll: ESCAPE_TARGET_ROLL,
              escaped: true,
              badStaffPenalty: null,
              monsterCardId: escapeCurrentMonsterCardId,
              viaInvisibilityPotion: true
            };
            emitEscapeRollResultAndAdvance(payload);
          }
        }
        if (response.method === "EscapeHirelingApply") {
          const actingSeat = Number(response.actingSeat);
          const cardId = String(response.cardId || "");
          if (escapeFailAidPending && Number(escapeFailAidPending.seat) === Number(actingSeat)) {
            escapeFailAidPending = null;
          }
          hideEscapeFailAidModal();
          hideWizardFlightModal();
          updateWizardFlightUi();
          if (cardId && Number.isFinite(actingSeat)) {
            moveTreasureCardToDiscard(cardId, { ownerSeat: actingSeat });
          }
          adjustCardWidth(".myhand");
          adjustCardWidth(".zone2");
          adjustCardWidth(".zone5");
          adjustCardWidth(".opponenthand");
          adjustCardWidth(".opponent2hand");
          adjustCardWidth(".opponent3hand");
          UpdatebackImgTreasure();
          if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive && Number.isFinite(actingSeat) && Number(actingSeat) === Number(escapeCurrentSeat)) {
            const fleeSeat = Math.floor(Number(escapeCurrentSeat));
            const payload = {
              method: "EscapeRollResult",
              seat: fleeSeat,
              escapePenaltySeat: fleeSeat,
              rawRoll: 6,
              equipRemover: getSeatEquipmentRemover(fleeSeat),
              monsterRemover: escapeMonsterRemover,
              totalRoll: ESCAPE_TARGET_ROLL,
              escaped: true,
              badStaffPenalty: null,
              monsterCardId: escapeCurrentMonsterCardId,
              viaHirelingEscape: true
            };
            emitEscapeRollResultAndAdvance(payload);
          }
        }
        if (response.method === "EscapeMagicLampBanish") {
          const actingSeat = Number(response.actingSeat);
          const lampId = String(response.cardId || "");
          const monsterId = String(response.monsterCardId || "");
          if (escapeFailAidPending && Number(escapeFailAidPending.seat) === Number(actingSeat)) {
            escapeFailAidPending = null;
          }
          hideEscapeFailAidModal();
          hideWizardFlightModal();
          updateWizardFlightUi();
          if (lampId && Number.isFinite(actingSeat)) {
            moveTreasureCardToDiscard(lampId, { ownerSeat: actingSeat });
          }
          if (monsterId) {
            moveCardToDiscardById(monsterId);
            setMonsterBasePower(computeMonsterZoneBasePower());
          }
          showBattleResult(`\u041C\u043E\u043D\u0441\u0442\u0440 \u043F\u0440\u043E\u0433\u043D\u0430\u043D \u0432\u043E\u043B\u0448\u0435\u0431\u043D\u043E\u0439 \u043B\u0430\u043C\u043F\u043E\u0439!`);
          setTimeout(() => hideBattleResult(), 1600);
          if (monsterId) {
            removeMonsterIdFromEscapeQueues(monsterId);
          }
          if (monsterId && String(escapeCurrentMonsterCardId) === monsterId) {
            escapeCurrentMonsterCardId = null;
            escapeWaitingForRoll = false;
            escapeRollInProgress = false;
          }
          recalculateAllPowerDisplays();
          pushOpenModalsToServerDebounced();
          if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive) {
            setTimeout(() => {
              runNextEscapeAttemptAndBroadcast();
            }, 250);
          }
        }
        if (response.method === "LoadedDieDiscard") {
          const seat = Number(response.seat);
          const cardId = String(response.cardId || "");
          hideLoadedDieModals();
          if (cardId && Number.isFinite(seat) && cardId.includes("treasure")) {
            moveTreasureCardToDiscard(cardId, { ownerSeat: seat });
          } else if (cardId) {
            moveCardToDiscardById(cardId);
          }
          recalculateAllPowerDisplays();
        }
        if (response.method === "EscapeGluePrompt") {
          const key = String(response.key || "");
          const escapedSeat = Number(response.escapedSeat);
          const monsterCardId = String(response.monsterCardId || "");
          const viaInstantWall = Boolean(response.viaInstantWall);
          const wallFleeRaw = Array.isArray(response.wallFleeSeats) ? response.wallFleeSeats : [];
          const wallFleeSet = new Set(
            wallFleeRaw.map((x) => Number(x)).filter((x) => Number.isFinite(x))
          );
          if (!wallFleeSet.size && Number.isFinite(escapedSeat)) {
            wallFleeSet.add(Number(escapedSeat));
          }
          if (!key || !Number.isFinite(escapedSeat) || !monsterCardId && !viaInstantWall) {
            return;
          }
          clearEscapeMonsterPickSession();
          hideEscapeMonsterPicker();
          if (wallFleeSet.has(Number(localSeat))) {
            return;
          }
          const ids = getFlaskOfGlueTreasureCardIdsForSeat(localSeat);
          if (!ids.length) {
            socket_default.emit("message", { method: "EscapeGlueDecision", key, used: false, actingSeat: Number(localSeat) });
            return;
          }
          socket_default.emit("message", { method: "EscapeGlueWaiting", key, actingSeat: Number(localSeat) });
          openFlaskOfGlueConfirmModal({
            promptKey: key,
            escapedSeat,
            monsterCardId,
            viaInstantWall,
            wallFleeSeats: Array.from(wallFleeSet)
          });
        }
        if (response.method === "EscapeGlueWaiting") {
          const key = String(response.key || "");
          const actingSeat = Number(response.actingSeat);
          if (!key || !Number.isFinite(actingSeat)) {
            return;
          }
          if (Number(localSeat) === Number(actingSeat)) {
            return;
          }
          showEscapeGlueWaitingBanner(key, actingSeat);
        }
        if (response.method === "EscapeGlueClose") {
          hideFlaskOfGlueModal();
          const key = String(response.key || "");
          if (key && escapeGlueWaitingKey && key === escapeGlueWaitingKey) {
            escapeGlueWaitingKey = null;
            removeEscapeGlueWaitingBanner();
          }
        }
        if (response.method === "EscapeGlueDecision") {
          const usedAny = Boolean(response.used);
          const actingSeatAny = Number(response.actingSeat);
          const glueIdAny = String(response.cardId || "");
          if (usedAny && glueIdAny && Number.isFinite(actingSeatAny) && glueIdAny.includes("treasure")) {
            moveTreasureCardToDiscard(glueIdAny, { ownerSeat: actingSeatAny });
            recalculateAllPowerDisplays();
          }
          if (Number(localSeat) !== Number(escapeOwnerSeat) || !escapeGluePromptState) {
            return;
          }
          const key = String(response.key || "");
          if (!key || key !== String(escapeGluePromptState.key || "")) {
            return;
          }
          const actingSeat = Number(response.actingSeat);
          if (!Number.isFinite(actingSeat)) {
            return;
          }
          escapeGluePromptState.pending?.delete?.(actingSeat);
          const used = Boolean(response.used);
          if (used) {
            escapeGluePromptState.resolved = true;
            const targetSeat = Number(response.targetSeat);
            const glueId = String(response.cardId || "");
            const monsterId = String(response.monsterCardId || "");
            const wasInstantWall = Boolean(escapeGluePromptState.viaInstantWall);
            const victimsFromMsg = Array.isArray(response.wallFleeSeats) ? response.wallFleeSeats.map((x) => Number(x)).filter((x) => Number.isFinite(x)) : [];
            const victimsFromState = Array.isArray(escapeGluePromptState.wallFleeSeats) ? escapeGluePromptState.wallFleeSeats.map((x) => Number(x)).filter((x) => Number.isFinite(x)) : [];
            const victims = victimsFromMsg.length ? victimsFromMsg : victimsFromState.length ? victimsFromState : Number.isFinite(targetSeat) ? [targetSeat] : [];
            socket_default.emit("message", { method: "EscapeGlueClose", key });
            if (glueId && Number.isFinite(actingSeat)) {
              moveTreasureCardToDiscard(glueId, { ownerSeat: actingSeat });
            }
            if (monsterId || wasInstantWall) {
              const lab = victims.map((s) => getSeatLabel(s)).join(" \u0438 ");
              showBattleResult(
                victims.length > 1 ? `\u0422\u044E\u0431\u0438\u043A \u043A\u043B\u0435\u044F! ${lab} \u0441\u043D\u043E\u0432\u0430 \u0441\u043C\u044B\u0432\u0430\u044E\u0442\u0441\u044F.` : `\u0422\u044E\u0431\u0438\u043A \u043A\u043B\u0435\u044F! ${lab || getSeatLabel(targetSeat)} \u0441\u043C\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0441\u043D\u043E\u0432\u0430.`
              );
            }
            escapeAttemptNumber = 0;
            escapeHalflingRetryUsedForCurrentAttempt = false;
            escapeHalflingRetryPending = null;
            escapeWizardFlightPending = null;
            escapeFailAidPending = null;
            hideEscapeFailAidModal();
            hideWizardFlightModal();
            updateWizardFlightUi();
            escapeRollInProgress = false;
            escapeGluePromptState = null;
            if (wasInstantWall) {
              victims.forEach((s) => {
                try {
                  escapeInstantWallAutoSeats?.delete?.(Number(s));
                } catch {
                }
              });
              escapeCurrentMonsterCardId = null;
              escapeMonsterQueue = (escapeMonsterTemplateQueue || []).slice();
              escapeMonsterInitialCount = escapeMonsterQueue.length;
              escapeQueueIndex = 0;
              escapeWaitingForRoll = false;
              escapeCurrentSeat = null;
              runNextEscapeAttemptAndBroadcast();
            } else {
              setCurrentEscapeMonsterById(monsterId);
              escapeCurrentSeat = Number(targetSeat);
              escapeWaitingForRoll = true;
              socket_default.emit("message", {
                method: "EscapeTurnStart",
                seat: Number(targetSeat),
                index: escapeQueueIndex,
                isRetry: false
              });
            }
            return;
          }
          if (!escapeGluePromptState.resolved && escapeGluePromptState.pending && escapeGluePromptState.pending.size <= 0) {
            const k = escapeGluePromptState.key;
            const finishAfter = Boolean(escapeGluePromptState.finishAfter);
            escapeGluePromptState = null;
            socket_default.emit("message", { method: "EscapeGlueClose", key: k });
            setTimeout(() => {
              if (finishAfter) {
                finishEscapeSequenceAndBroadcast();
              } else {
                runNextEscapeAttemptAndBroadcast();
              }
            }, 1200);
          }
        }
        if (response.method === "EscapeHalflingRetryPrompt") {
          openHalflingRetryModalNow(response.seat);
        }
        if (response.method === "EscapeHalflingRetryDecision") {
          if (localSeat !== escapeOwnerSeat) {
            return;
          }
          const seat = parseInt(response.seat, 10);
          if (Number.isNaN(seat) || seat !== escapeCurrentSeat) {
            return;
          }
          let pendingPayload = escapeHalflingRetryPending;
          if (!pendingPayload && escapeFailAidPending && Number(escapeFailAidPending.seat) === Number(seat) && escapeFailAidPending.payload) {
            pendingPayload = escapeFailAidPending.payload;
          }
          if (!pendingPayload) {
            return;
          }
          const clearEscapePendingForSeat = () => {
            escapeHalflingRetryPending = null;
            if (escapeFailAidPending && Number(escapeFailAidPending.seat) === Number(seat)) {
              escapeFailAidPending = null;
            }
          };
          const useAbility = Boolean(response.useAbility);
          const cardId = response.cardId;
          if (!useAbility) {
            const failedPayload = { ...pendingPayload };
            clearEscapePendingForSeat();
            emitEscapeRollResultAndAdvance(failedPayload);
            return;
          }
          if (!cardId) {
            const failedPayload = { ...pendingPayload };
            clearEscapePendingForSeat();
            emitEscapeRollResultAndAdvance(failedPayload);
            return;
          }
          clearEscapePendingForSeat();
          socket_default.emit("message", {
            method: "HalflingEscapeDiscard",
            cardId,
            seat
          });
          escapeWaitingForRoll = true;
          escapeRollInProgress = false;
          socket_default.emit("message", {
            method: "EscapeTurnStart",
            seat,
            index: escapeQueueIndex,
            isRetry: true
          });
        }
        if (response.method === "HalflingEscapeDiscard") {
          const cid = String(response.cardId || "");
          const seat = Number(response.seat);
          if (cid.includes("treasure") && Number.isFinite(seat)) {
            moveTreasureCardToDiscard(cid, { ownerSeat: seat });
          } else if (cid) {
            moveCardToDiscardById(cid);
          }
        }
        if (response.method === "EscapeRollSubmit") {
          const seat = parseInt(response.seat, 10);
          const rawRoll = Number(response.rawRoll);
          if (!Number.isNaN(seat) && Number.isFinite(rawRoll) && localSeat === escapeOwnerSeat) {
            resolveEscapeRollAndBroadcast(seat, rawRoll);
          }
        }
        if (response.method === "EscapeRollResult") {
          hideEscapeAidOptionsModal(true);
          hideEscapeRatMonsterPickModal();
          escapeWizardFlightPending = null;
          hideWizardFlightModal();
          updateWizardFlightUi();
          escapeWaitingForRoll = false;
          escapeRollInProgress = false;
          const penaltySeat = escapeRollPenaltySeatFromPayload(response);
          const rawRoll = Number(response.rawRoll);
          const equipRemover = Number(response.equipRemover) || 0;
          const monsterRemover = Number(response.monsterRemover) || 0;
          const totalRoll = Number(response.totalRoll);
          const escaped = Boolean(response.escaped);
          const monsterCardId = String(response.monsterCardId || "");
          const badStaffPenalty = normalizeBadStaff(response.badStaffPenalty);
          if (Number.isFinite(penaltySeat) && penaltySeat >= 0 && Number.isFinite(rawRoll) && Number.isFinite(totalRoll)) {
            if (!escaped && badStaffPenalty && badStaffPenalty.type === "escape_dice_death_or_levels") {
              showBattleResult("\u0421\u043C\u044B\u0432\u043A\u0430 \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C. \u0411\u0440\u043E\u0441\u044C \u043A\u0443\u0431\u0438\u043A, \u0447\u0442\u043E\u0431\u044B \u0443\u0437\u043D\u0430\u0442\u044C \u044D\u0444\u0444\u0435\u043A\u0442 \u043D\u0435\u043F\u043E\u0442\u0440\u0435\u0431\u0441\u0442\u0432\u0430.");
              escapeBadStaffDicePending = {
                penaltySeat: Number(penaltySeat),
                deathAtOrBelow: Number(badStaffPenalty.deathAtOrBelow) || 2
              };
              scheduleTurnStateSync();
            } else {
              showBattleResult(escaped ? "\u0421\u043C\u044B\u0432\u043A\u0430 \u0443\u0434\u0430\u043B\u0430\u0441\u044C!" : "\u0421\u043C\u044B\u0432\u043A\u0430 \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C");
              if (!escaped && badStaffPenalty) {
                if (badStaffPenalty.type !== "lose_hand_or_lose_levels" && badStaffPenalty.type !== "escape_dice_death_or_levels") {
                  applyEscapeBadStaffPenaltyFromOwner(penaltySeat, badStaffPenalty);
                }
              }
            }
          }
          if (!escaped && badStaffPenalty && badStaffPenalty.type === "lose_hand_or_lose_levels") {
            if (localSeat !== null && localSeat !== void 0 && Number(localSeat) === Number(penaltySeat)) {
              const loss = Number(badStaffPenalty.levels) || 2;
              openEscapeLoseHandOrLevelsModal({ seat: penaltySeat, levelLoss: loss });
            }
          }
        }
        if (response.method === "EscapeBadStaffDiceRoll") {
          const penaltySeat = Number(response.penaltySeat);
          const deathAtOrBelow = Number(response.deathAtOrBelow) || 2;
          const rawRoll = applyDicePenaltyForSeat(penaltySeat, Number(response.rawRoll));
          const msgOwner = response.escapeQueueOwnerSeat != null && response.escapeQueueOwnerSeat !== "" ? Number(response.escapeQueueOwnerSeat) : NaN;
          const queueOwner = Number.isFinite(msgOwner) && !Number.isNaN(msgOwner) ? msgOwner : escapeOwnerSeat != null && Number.isFinite(Number(escapeOwnerSeat)) ? Number(escapeOwnerSeat) : penaltySeat;
          const mustApply = Number(localSeat) === queueOwner;
          escapeBadStaffDicePending = null;
          escapeRollInProgress = false;
          scheduleTurnStateSync();
          if (Number.isFinite(penaltySeat) && penaltySeat >= 0 && Number.isFinite(rawRoll) && rawRoll >= 1 && rawRoll <= 6) {
            if (rawRoll <= deathAtOrBelow) {
              showBattleResult(`\u041D\u0435\u043F\u043E\u0442\u0440\u0435\u0431\u0441\u0442\u0432\u043E: ${rawRoll} \u2014 \u0441\u043C\u0435\u0440\u0442\u044C.`);
            } else {
              showBattleResult(`\u041D\u0435\u043F\u043E\u0442\u0440\u0435\u0431\u0441\u0442\u0432\u043E: ${rawRoll}. \u041F\u043E\u0442\u0435\u0440\u044F \u0443\u0440\u043E\u0432\u043D\u0435\u0439: ${rawRoll}.`);
            }
          }
          if (!mustApply) {
            return;
          }
          if (!Number.isFinite(penaltySeat) || penaltySeat < 0 || !Number.isFinite(rawRoll) || rawRoll < 1 || rawRoll > 6) {
            setTimeout(() => {
              runNextEscapeAttemptAndBroadcast();
            }, 1200);
            return;
          }
          if (rawRoll <= deathAtOrBelow) {
            triggerDeathAfterFailedEscape(penaltySeat, queueOwner);
            return;
          }
          emitLevelAdjust(penaltySeat, -rawRoll);
          setTimeout(() => {
            runNextEscapeAttemptAndBroadcast();
          }, 1200);
        }
        if (response.method === "EscapeSequenceFinished") {
          hideEscapeAidOptionsModal(true);
          hideEscapeRatMonsterPickModal();
          hideEscapeLoseHandOrLevelsModal();
          removeInstantWallWaitingBanners();
          removeInstantWallSoloAidWaitingBanner();
          instantWallSoloAidWaitingEmitted = false;
          hideInstantWallModal();
          hideFlaskOfGlueModal();
          removeEscapeGlueWaitingBanner();
          escapeGlueWaitingKey = null;
          clearEscapeMonsterPickSession();
          escapeActive = false;
          escapeQueue = [];
          escapeQueueIndex = -1;
          escapeMonsterRemover = 0;
          escapeMonsterBadStaff = null;
          escapeMonsterQueue = [];
          escapeMonsterInitialCount = 0;
          escapeMonsterTemplateQueue = [];
          escapeCurrentMonsterCardId = null;
          escapeCurrentSeat = null;
          escapeWaitingForRoll = false;
          escapeOwnerSeat = null;
          escapeRollInProgress = false;
          escapeAttemptNumber = 0;
          escapeHalflingRetryUsedForCurrentAttempt = false;
          escapeHalflingRetryPending = null;
          escapeWizardFlightPending = null;
          escapeBadStaffDicePending = null;
          escapeInstantWallGate = null;
          escapeInstantWallOfferPending = null;
          escapeInstantWallAutoSeats = /* @__PURE__ */ new Set();
          hideWizardFlightModal();
          hideEscapeMonsterPicker();
          hideEscapeHalflingRetryModal();
          if (!deathLootActive) {
            MoveMonstersToDrop();
            turnAwaitingManualEnd = true;
            updateTurnActionButtons(false);
            recalculateAllPowerDisplays();
            setTimeout(() => {
              hideBattleResult();
            }, 1500);
          }
          deathLootAwaitingEscapeFinish = false;
        }
        if (response.method === "EscapeOwnerTransfer") {
          const nextOwner = parseInt(response.ownerSeat, 10);
          if (!Number.isNaN(nextOwner) && nextOwner >= 0) {
            escapeOwnerSeat = nextOwner;
          }
        }
        if (response.method === "IncomeTaxStart") {
          handleIncomeTaxStart(response);
        }
        if (response.method === "IncomeTaxInitiatorPick") {
          handleIncomeTaxInitiatorPick(response);
        }
        if (response.method === "IncomeTaxInsufficientDumpSync") {
          handleIncomeTaxInsufficientDumpSync(response);
        }
        if (response.method === "IncomeTaxResponderSubmit") {
          handleIncomeTaxResponderSubmit(response);
        }
        if (response.method === "IncomeTaxCurseFinished") {
          const cid = String(response.curseCardId || "").trim();
          finishIncomeTaxCurse(cid);
        }
        if (response.method === "BadStaffLevel") {
          applyBadStaffLevelFromNetwork(response);
        }
        if (response.method === "CurseAppliedNotify") {
          const seat = Number(response.seat);
          const curseCardId = String(response.curseCardId || "").trim();
          if (!Number.isFinite(seat) || seat < 0) {
            return;
          }
          const door96 = curseCardId ? window.doors?.find((d) => d.name === curseCardId) : null;
          if (curseSkipsAppliedBanner(door96?.bad_staff)) {
            return;
          }
          showCurseAppliedBannerForSeat(seat);
        }
        if (response.method === "CurseWishingRingOffer") {
          handleCurseWishingRingOffer(response);
        }
        if (response.method === "CurseWishingRingResponse") {
          handleCurseWishingRingResponse(response);
        }
        if (response.method === "CurseWishingRingAllSkippedApply") {
          handleCurseWishingRingAllSkippedApply(response);
        }
        if (response.method === "MalignMirrorApply") {
          const seat = Number(response.seat);
          const curseId = String(response.curseCardId || "").trim();
          if (Number.isFinite(seat) && seat >= 0 && curseId) {
            if (!malignMirrorActiveBySeat.has(seat) && !malignMirrorPendingBySeat.has(seat)) {
              malignMirrorPendingBySeat.set(seat, curseId);
            }
            tryActivateMalignMirrorForSeat(seat);
            recalculateAllPowerDisplays();
          }
        }
        if (response.method === "ChangeSexApply") {
          const seat = Number(response.seat);
          const curseId = String(response.curseCardId || "").trim();
          const gender = String(response.gender || "").trim();
          if (Number.isFinite(seat) && seat >= 0 && curseId && (gender === "Male" || gender === "Female")) {
            const curseEl = document.getElementById(curseId);
            if (curseEl) {
              curseEl.dataset.changeSexUsedNotDiscarded = "1";
            }
            if (characterBySeat?.[seat]) {
              characterBySeat[seat].gender = gender;
            }
            showBattleResult(`${getSeatLabel(seat)}: \u043F\u043E\u043B \u0441\u043C\u0435\u043D\u0451\u043D`);
            setTimeout(() => hideBattleResult(), 2e3);
            hideSeatIconTooltip();
            if (!changeSexActiveBySeat.has(seat) && !changeSexPendingBySeat.has(seat)) {
              changeSexPendingBySeat.set(seat, curseId);
            }
            tryActivateChangeSexPenaltyForSeat(seat);
            recalculateAllPowerDisplays();
          }
        }
        if (response.method === "LoseYourClassResolve") {
          resolveLoseYourClassCurse({
            seat: response.seat,
            curseCardId: response.curseCardId,
            chosenClassCardId: response.chosenClassCardId
          });
        }
        if (response.method === "LevelAdjust") {
          const seat = Number(response.seat);
          const delta = Number(response.delta) || 0;
          const allowWinningLevel = Boolean(response.allowWinningLevel);
          if (Number.isFinite(seat) && seat >= 0 && Number.isFinite(delta) && delta !== 0) {
            let cur = levelBySeat[seat];
            if (cur == null || Number.isNaN(cur)) {
              cur = 1;
            }
            cur = Math.max(1, cur);
            const next = allowWinningLevel ? Math.max(1, cur + delta) : applyLevelDeltaWithWinRule(cur, delta, false);
            setLevelBySeat(seat, next);
            recalculateAllPowerDisplays();
          }
        }
        if (response.method === "TreasureLevel") {
          if (response.treasureLevelApplied === false) {
            const actorSeat = parseInt(response.actorSeat, 10);
            const cardId2 = response.cardId;
            if (!Number.isNaN(actorSeat) && cardId2) {
              appendCardToSeatHand(cardId2, actorSeat);
            }
            if (!Number.isNaN(actorSeat) && Number(actorSeat) === Number(localSeat)) {
              let msg = "\u041A\u0430\u0440\u0442\u0443 \xAB\u043F\u043E\u043B\u0443\u0447\u0438 \u0443\u0440\u043E\u0432\u0435\u043D\u044C\xBB \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043A \u0438\u0433\u0440\u043E\u043A\u0443 9 \u0443\u0440\u043E\u0432\u043D\u044F.";
              const cid = String(cardId2 || "");
              if (cid === "treasure39" || isTreasureSpecial(cid, WHINE_AT_GM_SPECIAL)) {
                msg = `\u041A\u0430\u0440\u0442\u0443 \xAB${WHINE_AT_GM_SPECIAL}\xBB \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043A \u0438\u0433\u0440\u043E\u043A\u0443 \u043D\u0430 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u043C \u0443\u0440\u043E\u0432\u043D\u0435 \u0437\u0430 \u0441\u0442\u043E\u043B\u043E\u043C.`;
              }
              showBattleResult(msg);
              setTimeout(() => {
                hideBattleResult();
              }, 2e3);
            }
            return;
          }
          const seat = parseInt(response.seat, 10);
          const levelGain = Number(response.level);
          const cardId = response.cardId;
          if (!Number.isNaN(seat) && Number.isFinite(levelGain) && levelGain > 0 && cardId) {
            applyTreasureLevelToSeat(seat, levelGain);
            moveTreasureCardToDiscard(cardId);
            const hid = String(response.killedHirelingCardId || "").trim();
            if (hid) {
              moveTreasureCardToDiscard(hid);
            }
          }
        }
        if (response.method === "Treasure65LevelSwap") {
          const fromSeat = parseInt(response.fromSeat, 10);
          const toSeat = parseInt(response.toSeat, 10);
          const cardId = response.cardId;
          const cardName = response.card_name;
          if (!Number.isNaN(fromSeat) && !Number.isNaN(toSeat) && cardName === STEAL_LEVEL_CARD_NAME && cardId) {
            applyTreasure65LevelSwap(fromSeat, toSeat);
            moveTreasureCardToDiscard(cardId);
          }
        }
        if (response.method === "SellTreasures") {
          applyTreasureSellResult(response.seat, response.cardIds, response.totalCost);
        }
        if (response.method === "UpdateBonus") {
          recalculateMyBonusDisplay();
        }
        if (response.method === "UpdateMonster") {
          const CurrentPower = response.power;
          setMonsterBasePower(CurrentPower);
        }
        if (response.method === "UpdateTimer") {
          if (!getMonsterBattleContext().hasMonster) {
            return;
          }
          timer();
        }
        if (response.method === "DeathLootPick") {
          if (!deathLootState || Number(localSeat) !== Number(deathLootState.ownerSeat)) {
            return;
          }
          const deadSeat = parseInt(response.deadSeat, 10);
          const looterSeat = parseInt(response.looterSeat, 10);
          const cardId = response.cardId;
          const handZoneId = response.handZoneId;
          if (Number.isNaN(deadSeat) || Number.isNaN(looterSeat) || !cardId) {
            return;
          }
          if (!deathLootActive || !deathLootState || Number(deathLootState.deadSeat) !== Number(deadSeat)) {
            return;
          }
          const state = deathLootState;
          const expectedLooter = state.lootersOrder?.[state.index];
          if (Number(expectedLooter) !== Number(looterSeat)) {
            return;
          }
          if (state.remaining.indexOf(cardId) === -1) {
            return;
          }
          if (handZoneId && typeof handZoneId === "string") {
            const move = {
              method: "moveCard",
              cardId,
              targetId: null,
              zoneId: handZoneId
            };
            applyMoveCardLocally(move);
            socket_default.emit("message", move);
          }
          state.remaining = state.remaining.filter((x) => x !== cardId);
          socket_default.emit("message", {
            method: "DeathLootPicked",
            deadSeat,
            looterSeat,
            cardId,
            remainingCardIds: state.remaining.slice()
          });
          state.index += 1;
          if (state.remaining.length <= 0 || state.index >= (state.lootersOrder?.length || 0)) {
            socket_default.emit("message", {
              method: "DeathLootFinished",
              deadSeat,
              remainingCardIds: state.remaining.slice()
            });
            return;
          }
          socket_default.emit("message", {
            method: "DeathLootTurn",
            deadSeat,
            ownerSeat: state.ownerSeat ?? escapeOwnerSeat ?? deadSeat,
            looterSeat: state.lootersOrder[state.index],
            remainingCardIds: state.remaining.slice()
          });
        }
        if (response.method === "shuffleDeck") {
          window.doors = response.deckDoors;
          window.treasures = response.deckTreasure;
        }
        if (response.method === "1") {
          fl = response.fl;
          localSeat = 0;
          const nFromMsg = Number(response.num);
          if (Number.isFinite(nFromMsg) && nFromMsg > 0) {
            num = nFromMsg;
            window.num = num;
          }
          if (Number(num) === 4) {
            resetFourPlayerLayoutToSeatZero();
            applyFourPlayerCanonicalClassShift(0);
          } else if (Number(num) === 5) {
            resetFivePlayerLayoutToSeatZero();
            applyFivePlayerCanonicalClassShift(0);
          } else if (Number(num) === 6) {
            resetSixPlayerLayoutToSeatZero();
            applySixPlayerCanonicalClassShift(0);
          }
          flushPendingPlayerMetaSnapshotIfNeeded();
          ensureLocalPlayerProfileChosen();
          updatePlayersUiVisibility(num);
          recalculateAllPowerDisplays();
          applyTurnHighlight();
          for (let i = 1; i <= 95; i++) {
            const door = eval(`door${i}`);
            window.doors.push(door);
          }
          for (let i = 1; i <= 73; i++) {
            const treasure = eval(`treasure${i}`);
            window.treasures.push(treasure);
          }
          shuffle(window.doors);
          shuffle(window.treasures);
          const shuffleDeck = {
            method: "shuffleDeck",
            deckDoors: window.doors,
            deckTreasure: window.treasures,
            num: Number(num) || (Number.isFinite(nFromMsg) && nFromMsg > 0 ? nFromMsg : 2)
          };
          socket_default.emit("message", shuffleDeck);
        }
        if (response.method === "2Players") {
          fl = response.fl;
          localSeat = 1;
          flushPendingPlayerMetaSnapshotIfNeeded();
          ensureLocalPlayerProfileChosen();
          num = 2;
          window.num = num;
          const opponenthand = document.getElementById("opponenthand");
          const myhand = document.getElementById("myhand");
          const zone_opponent = document.getElementById("zone_opponent");
          const zone2 = document.getElementById("zone2");
          const zone_opponent_side = document.getElementById("zone_opponent_side");
          const zone5 = document.getElementById("zone5");
          if (fl == true) {
            opponenthand.classList.remove("opponenthand");
            opponenthand.classList.add("myhand");
            myhand.classList.remove("myhand");
            myhand.classList.add("opponenthand");
            zone_opponent.classList.remove("zone_opponent");
            zone_opponent.classList.add("zone2");
            zone2.classList.remove("zone2");
            zone2.classList.add("zone_opponent");
            zone_opponent_side.classList.remove("zone_opponent_side");
            zone_opponent_side.classList.add("zone5");
            zone5.classList.remove("zone5");
            zone5.classList.add("zone_opponent_side");
            fl = false;
          }
          updatePlayersUiVisibility(num);
          recalculateAllPowerDisplays();
          applyTurnHighlight();
        }
        if (response.method === "3Players") {
          fl = response.fl;
          localSeat = fl === "3player" ? 2 : 1;
          flushPendingPlayerMetaSnapshotIfNeeded();
          ensureLocalPlayerProfileChosen();
          num = 3;
          window.num = num;
          resetThreePlayerLayoutToSeatZero();
          if (localSeat === 1) {
            applyThreePlayerLayoutSeat1AsInJoinMessage();
          } else if (localSeat === 2) {
            applyThreePlayerLayoutSeat2AsInJoinMessage();
          }
          updatePlayersUiVisibility(num);
          recalculateAllPowerDisplays();
          applyTurnHighlight();
        }
        if (response.method === "4Players") {
          fl = response.fl;
          localSeat = fl === "p3" ? 3 : fl === "p2" ? 2 : 1;
          flushPendingPlayerMetaSnapshotIfNeeded();
          ensureLocalPlayerProfileChosen();
          num = 4;
          window.num = num;
          resetFourPlayerLayoutToSeatZero();
          applyFourPlayerCanonicalClassShift(localSeat);
          updatePlayersUiVisibility(num);
          recalculateAllPowerDisplays();
          applyTurnHighlight();
        }
        if (response.method === "5Players") {
          fl = response.fl;
          localSeat = fl === "p4" ? 4 : fl === "p3" ? 3 : fl === "p2" ? 2 : 1;
          flushPendingPlayerMetaSnapshotIfNeeded();
          ensureLocalPlayerProfileChosen();
          num = 5;
          window.num = num;
          resetFivePlayerLayoutToSeatZero();
          applyFivePlayerCanonicalClassShift(localSeat);
          updatePlayersUiVisibility(num);
          recalculateAllPowerDisplays();
          applyTurnHighlight();
        }
        if (response.method === "6Players") {
          fl = response.fl;
          localSeat = fl === "p5" ? 5 : fl === "p4" ? 4 : fl === "p3" ? 3 : fl === "p2" ? 2 : 1;
          flushPendingPlayerMetaSnapshotIfNeeded();
          ensureLocalPlayerProfileChosen();
          num = 6;
          window.num = num;
          resetSixPlayerLayoutToSeatZero();
          applySixPlayerCanonicalClassShift(localSeat);
          updatePlayersUiVisibility(num);
          recalculateAllPowerDisplays();
          applyTurnHighlight();
        }
        if (response.method === "RandDice") {
          const rand = response.digit;
          const NUMBER_OF_DICE = 1;
          const diceContainer = document.querySelector(".dice-container");
          window.flag_dice = false;
          randomizeDice(diceContainer, 0);
          const dice = createDice(rand);
          diceContainer.appendChild(dice);
        }
        if (response.method === "GameVictory") {
          const winners = Array.isArray(response.winners) ? response.winners : [];
          openGameVictoryModal(winners);
        }
        if (response.method === "StartGame" && (!gameStarted || response.restarted)) {
          if (response.restarted) {
            resetLocalTableForRestart();
          }
          if (Array.isArray(response.deckDoors)) {
            window.doors = response.deckDoors;
          }
          if (Array.isArray(response.deckTreasure)) {
            window.treasures = response.deckTreasure;
          }
          num = response.num;
          window.num = num;
          updatePlayersUiVisibility(num);
          bindSeatIconHoverTooltips();
          recalculateAllPowerDisplays();
          applyTurnHighlight();
          window.zonedoor = document.querySelector(".zone_doors");
          window.zoneTreasure = document.querySelector(".zone_treasure");
          if (window.zonedoor && window.zoneTreasure) {
            Deck_filling(window.doors, window.zonedoor);
            UpdatebackImgDoor();
            Deck_filling(window.treasures, window.zoneTreasure);
            UpdatebackImgTreasure();
            UpdateZones();
            window.allCards = document.querySelectorAll(".card");
          }
          recalculateAllPowerDisplays();
          applyTurnHighlight();
          if (window.button) {
            window.button.remove();
            window.button = null;
          }
          UpdatebackImgDoor();
          UpdatebackImgTreasure();
          UpdateZones();
          initializeSellTreasuresUi();
          adjustCardWidth(".myhand");
          adjustCardWidth(".zone2");
          adjustCardWidth(".zone5");
          adjustCardHeight(".zone3");
          adjustCardHeight(".zone_monster");
          adjustCardWidth(".opponenthand");
          const thiefTheftInitBtn = document.getElementById("thief-theft-btn");
          if (thiefTheftInitBtn) {
            thiefTheftInitBtn.onclick = () => openThiefTheftModal();
          }
          const thiefTrimInitBtn = document.getElementById("thief-trim-btn");
          if (thiefTrimInitBtn) {
            thiefTrimInitBtn.onclick = () => openThiefTrimModal();
          }
          const wizardTamingInitBtn = document.getElementById("wizard-taming-btn");
          if (wizardTamingInitBtn) {
            wizardTamingInitBtn.onclick = () => openWizardTamingModal();
          }
          updateWizardTamingUi();
          updateWizardFlightUi();
          updateThiefTheftUi();
          updateThiefTrimUi();
          gameStarted = true;
          hideRoomLobbyBar();
          ensureRoomOpenModalsMutationObserver();
          wireEndTurnButtonClick();
          if (localSeat === 0) {
            setRandomFirstTurn();
          }
          setupMunchkinDiceAfterGameStart();
          try {
            window.dispatchEvent(new Event("munchkin:zonesChanged"));
          } catch {
          }
        }
        if (response.method === "EscapeRatOnStickApply") {
          applyEscapeRatOnStickFromNetwork({
            ratCardId: response.ratCardId,
            monsterCardId: response.monsterCardId,
            actingSeat: response.actingSeat
          });
        }
        if (response.method === "InstantWallHelperPrompt") {
          const helperSeat = Number(response.helperSeat);
          const loserSeat = Number(response.loserSeat);
          if (!Number.isFinite(helperSeat) || !Number.isFinite(loserSeat)) {
            return;
          }
          if (!localSeatMatchesSeat(helperSeat)) {
            return;
          }
          openInstantWallPickModal({
            title: "Instant wall: \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u0441\u0442\u0435\u043D\u043A\u0443 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043A\u0443?",
            seat: helperSeat,
            onPick: (cardId) => {
              socket_default.emit("message", { method: "InstantWallHelperDecision", helperSeat, loserSeat, used: true, cardId });
            },
            onSkip: () => {
              socket_default.emit("message", { method: "InstantWallHelperDecision", helperSeat, loserSeat, used: false, cardId: null });
            }
          });
        }
        if (response.method === "InstantWallHelperWaiting") {
          const helperSeat = Number(response.helperSeat);
          if (!Number.isFinite(helperSeat)) {
            return;
          }
          if (localSeatMatchesSeat(helperSeat)) {
            return;
          }
          showInstantWallHelperWaitingBanner(helperSeat);
        }
        if (response.method === "InstantWallOfferWaiting") {
          const fromSeat = Number(response.fromSeat);
          const toSeat = Number(response.toSeat);
          if (!Number.isFinite(fromSeat) || !Number.isFinite(toSeat)) {
            return;
          }
          if (localSeatMatchesSeat(toSeat)) {
            return;
          }
          showInstantWallOfferWaitingBanner(fromSeat, toSeat);
        }
        if (response.method === "InstantWallSoloAidWaiting") {
          const deciderSeat = Number(response.deciderSeat);
          if (!Number.isFinite(deciderSeat)) {
            return;
          }
          if (localSeatMatchesSeat(deciderSeat)) {
            return;
          }
          showInstantWallSoloAidWaitingBanner(deciderSeat);
        }
        if (response.method === "InstantWallSoloAidClose") {
          removeInstantWallSoloAidWaitingBanner();
        }
        if (response.method === "InstantWallHelperDecision") {
          removeInstantWallWaitingBanners();
          hideInstantWallModal();
          const helperSeat = Number(response.helperSeat);
          const loserSeat = Number(response.loserSeat);
          const used = Boolean(response.used);
          const cardId = response.cardId ? String(response.cardId) : "";
          if (used && cardId) {
            moveTreasureCardToDiscard(cardId, { ownerSeat: helperSeat });
          }
          const gateMatch = Boolean(
            escapeInstantWallGate && Number.isFinite(helperSeat) && Number(escapeInstantWallGate.helperSeat) === helperSeat
          );
          escapeInstantWallGate = null;
          if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive && gateMatch) {
            if (!used) {
              runNextEscapeAttemptAndBroadcast();
            } else {
              escapeInstantWallOfferPending = { helperSeat, loserSeat };
              socket_default.emit("message", { method: "InstantWallOffer", fromSeat: helperSeat, toSeat: loserSeat });
            }
          }
        }
        if (response.method === "InstantWallUse") {
          const cardId = response.cardId ? String(response.cardId) : "";
          const actingSeat = Number(response.actingSeat);
          if (cardId && Number.isFinite(actingSeat)) {
            moveTreasureCardToDiscard(cardId, { ownerSeat: actingSeat });
          }
          if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive && Number.isFinite(actingSeat)) {
            const otherSeat = (Array.isArray(escapeQueue) ? escapeQueue : []).find((s) => Number(s) !== Number(actingSeat));
            if (otherSeat != null && Number.isFinite(Number(otherSeat))) {
              socket_default.emit("message", { method: "InstantWallOffer", fromSeat: actingSeat, toSeat: Number(otherSeat) });
            } else if (!startEscapeGluePromptFromOwner({
              escapedSeat: Number(actingSeat),
              monsterCardId: "",
              viaInstantWall: true,
              finishAfter: true,
              wallFleeSeats: [Number(actingSeat)]
            })) {
              finishEscapeSequenceAndBroadcast();
            }
          }
        }
        if (response.method === "InstantWallOffer") {
          const fromSeat = Number(response.fromSeat);
          const toSeat = Number(response.toSeat);
          if (!Number.isFinite(fromSeat) || !Number.isFinite(toSeat)) {
            return;
          }
          if (!localSeatMatchesSeat(toSeat)) {
            return;
          }
          openInstantWallOfferModal({ fromSeat, toSeat });
        }
        if (response.method === "InstantWallOfferDecision") {
          removeInstantWallWaitingBanners();
          hideInstantWallModal();
          const fromSeat = Number(response.fromSeat);
          const toSeat = Number(response.toSeat);
          const accept = Boolean(response.accept);
          if (!Number.isFinite(fromSeat) || !Number.isFinite(toSeat)) {
            return;
          }
          if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive) {
            if (accept) {
              const monsterPick = String(escapeCurrentMonsterCardId || escapeMonsterTemplateQueue?.[0]?.cardId || "__instant_wall__");
              if (!startEscapeGluePromptFromOwner({
                escapedSeat: Number(toSeat),
                monsterCardId: monsterPick,
                viaInstantWall: true,
                finishAfter: true,
                wallFleeSeats: [Number(fromSeat), Number(toSeat)]
              })) {
                finishEscapeSequenceAndBroadcast();
              }
              return;
            }
            try {
              escapeInstantWallAutoSeats?.add?.(Number(fromSeat));
            } catch {
            }
            runNextEscapeAttemptAndBroadcast();
          }
        }
        if (response.method === "MateTestDeal") {
          const seat = parseInt(response.seat, 10);
          const cardId = String(response.cardId || "");
          if (Number.isNaN(seat) || seat < 0 || !cardId) {
            return;
          }
          const card = document.getElementById(cardId);
          const hand = getHandElementForPlayerSeat(seat);
          if (card && hand) {
            hand.appendChild(card);
            UpdatebackImgDoor();
            adjustCardWidth(".myhand");
            adjustCardWidth(".opponenthand");
            adjustCardWidth(".opponent2hand");
            adjustCardWidth(".opponent3hand");
          }
        }
        if (response.method === "FoldCount") {
          const turnSeat = parseInt(response.turnSeat, 10);
          if (!Number.isNaN(turnSeat) && turnSeat === currentTurnSeat) {
            window.FoldCount++;
          }
        }
        scheduleTurnStateSync();
      });
      Card_treasure = class {
        constructor(name = "", card_name = "", img = "", backimg = "", power = 0, cost = 0, body = 0, hand = 0, footwear = 0, hat = 0, big = 0, level = 0, special = "", remover = 0, restrictions = null, oneTime = false) {
          this.name = name;
          this.card_name = card_name;
          this.img = img;
          this.backimg = backimg;
          this.power = power;
          this.cost = cost;
          this.body = body;
          this.hand = hand;
          this.footwear = footwear;
          this.hat = hat;
          this.big = big;
          this.level = level;
          this.special = special;
          this.remover = remover;
          this.restrictions = restrictions;
          this.oneTime = Boolean(oneTime);
        }
      };
      treasure1 = new Card_treasure("treasure1", "", "../img/treasure1/card0096.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 1, 0, 0, "", 0, [{ mode: "only", race: ["Human"] }]);
      treasure3 = new Card_treasure("treasure3", "", "../img/treasure1/card0098.png", "../img/treasure1/cardBack_Treasure.png", 1, 600, 0, 0, 0, 1);
      treasure3.powerByRace = { Elf: 3 };
      treasure2 = new Card_treasure("treasure2", "", "../img/treasure1/card0097.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 0, 0, 0, 1);
      treasure4 = new Card_treasure("treasure4", "", "../img/treasure1/card0099.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 1, 0, 0, "", 0, [{ mode: "only", kind: ["Wizard"] }]);
      treasure5 = new Card_treasure("treasure5", "", "../img/treasure1/card0100.png", "../img/treasure1/cardBack_Treasure.png", 2, 400, 1, 0, 0, 0);
      treasure6 = new Card_treasure("treasure6", "", "../img/treasure1/card0101.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 1, 0, 0, 0);
      treasure7 = new Card_treasure("treasure7", "", "../img/treasure1/card0102.png", "../img/treasure1/cardBack_Treasure.png", 3, 600, 1, 0, 0, 0, 1, 0, "", 0, [{ mode: "not", kind: ["Wizard"] }]);
      treasure8 = new Card_treasure("treasure8", "", "../img/treasure1/card0103.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 1, 0, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Dwarf"] }]);
      treasure9 = new Card_treasure("treasure9", "", "../img/treasure1/card0104.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 1, 0, 0, 0);
      treasure10 = new Card_treasure("treasure10", "", "../img/treasure1/card0105.png", "../img/treasure1/cardBack_Treasure.png", 2, 400, 0, 0, 1, 0);
      treasure11 = new Card_treasure("treasure11", "", "../img/treasure1/card0106.png", "../img/treasure1/cardBack_Treasure.png", 0, 400, 0, 0, 1, 0, 0, 0, "", 2);
      treasure12 = new Card_treasure("treasure12", "", "../img/treasure1/card0107.png", "../img/treasure1/cardBack_Treasure.png", 0, 700, 0, 0, 1, 0);
      treasure13 = new Card_treasure("treasure13", "", "../img/treasure1/card0108.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", gender: ["Female"] }]);
      treasure14 = new Card_treasure("treasure14", "", "../img/treasure1/card0109.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", gender: ["Male"] }]);
      treasure15 = new Card_treasure("treasure15", "", "../img/treasure1/card0110.png", "../img/treasure1/cardBack_Treasure.png", 3, 600, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Elf"] }]);
      treasure16 = new Card_treasure("treasure16", "", "../img/treasure1/card0111.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Cleric"] }]);
      treasure17 = new Card_treasure("treasure17", "", "../img/treasure1/card0112.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Thief"] }]);
      treasure18 = new Card_treasure("treasure18", "", "../img/treasure1/card0113.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Dwarf"] }]);
      treasure19 = new Card_treasure("treasure19", "", "../img/treasure1/card0114.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Cleric"] }]);
      treasure20 = new Card_treasure("treasure20", "", "../img/treasure1/card0115.png", "../img/treasure1/cardBack_Treasure.png", 2, 400, 0, 1, 0, 0);
      treasure21 = new Card_treasure("treasure21", "", "../img/treasure1/card0116.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 1, 0, 0, 1, 0, "", 0, [{ mode: "only", kind: ["Warrior"] }]);
      treasure22 = new Card_treasure("treasure22", "", "../img/treasure1/card0117.png", "../img/treasure1/cardBack_Treasure.png", 2, 400, 0, 1, 0, 0);
      treasure23 = new Card_treasure("treasure23", "", "../img/treasure1/card0118.png", "../img/treasure1/cardBack_Treasure.png", 5, 800, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Wizard"] }]);
      treasure24 = new Card_treasure("treasure24", "", "../img/treasure1/card0119.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 1, 0, 0, 1, 0, "", 3);
      treasure25 = new Card_treasure("treasure25", "Rat on a stick", "../img/treasure1/card0120.png", "../img/treasure1/cardBack_Treasure.png", 1, 0, 0, 1, 0, 0, 0, 0, "Rat on a stick", 0, null, false);
      treasure26 = new Card_treasure("treasure26", "", "../img/treasure1/card0121.png", "../img/treasure1/cardBack_Treasure.png", 3, 600, 0, 2, 0, 0, 1);
      treasure27 = new Card_treasure("treasure27", "", "../img/treasure1/card0122.png", "../img/treasure1/cardBack_Treasure.png", 4, 800, 0, 2, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Elf"] }]);
      treasure28 = new Card_treasure("treasure28", "", "../img/treasure1/card0123.png", "../img/treasure1/cardBack_Treasure.png", 3, 0, 0, 2, 0, 0, 1);
      treasure29 = new Card_treasure("treasure29", "", "../img/treasure1/card0124.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 2, 0, 0, 1, 0, "", 0, [{ mode: "only", race: ["Human"] }]);
      treasure30 = new Card_treasure("treasure30", "", "../img/treasure1/card0125.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 0, 2, 0, 0);
      treasure31 = new Card_treasure("treasure31", "", "../img/treasure1/card0126.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
      treasure32 = new Card_treasure("treasure32", "", "../img/treasure1/card0127.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
      treasure33 = new Card_treasure("treasure33", "", "../img/treasure1/card0128.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
      treasure34 = new Card_treasure("treasure34", "", "../img/treasure1/card0129.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
      treasure35 = new Card_treasure("treasure35", "", "../img/treasure1/card0130.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
      treasure36 = new Card_treasure("treasure36", "Kill the hireling", "../img/treasure1/card0131.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "Kill the hireling", 0, null, true);
      treasure37 = new Card_treasure("treasure37", "", "../img/treasure1/card0132.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
      treasure38 = new Card_treasure("treasure38", "", "../img/treasure1/card0133.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
      treasure39 = new Card_treasure("treasure39", "Whine at the GM", "../img/treasure1/card0134.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "Whine at the GM", 0, null, true);
      treasure40 = new Card_treasure("treasure40", "", "../img/treasure1/card0135.png", "../img/treasure1/cardBack_Treasure.png", 1, -1, 0, 0, 0, 0, 0, 0, "Hireling", 0, null);
      treasure41 = new Card_treasure("treasure41", "Instant wall", "../img/treasure1/card0136.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0, 0, 0, "Instant wall", 0, null, true);
      treasure42 = new Card_treasure("treasure42", "Wishing ring", "../img/treasure1/card0137.png", "../img/treasure1/cardBack_Treasure.png", 0, 500, 0, 0, 0, 0, 0, 0, "Wishing ring", 0, null, true);
      treasure43 = new Card_treasure("treasure43", "Wishing ring", "../img/treasure1/card0138.png", "../img/treasure1/cardBack_Treasure.png", 0, 500, 0, 0, 0, 0, 0, 0, "Wishing ring", 0, null, true);
      treasure44 = new Card_treasure("treasure44", "Loaded die", "../img/treasure1/card0139.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0, 0, 0, "Loaded die", 0, null, true);
      treasure45 = new Card_treasure("treasure45", "Magic lamp", "../img/treasure1/card0140.png", "../img/treasure1/cardBack_Treasure.png", 0, 500, 0, 0, 0, 0, 0, 0, "Magic lamp", 0, null, true);
      treasure46 = new Card_treasure("treasure46", "Wand of dowsing", "../img/treasure1/card0141.png", "../img/treasure1/cardBack_Treasure.png", 0, 1100, 0, 0, 0, 0, 0, 0, "Wand of dowsing", 0, null, true);
      treasure47 = new Card_treasure("treasure47", "Doppleganger", "../img/treasure1/card0142.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0, 0, 0, "Doppleganger", 0, null, true);
      treasure48 = new Card_treasure("treasure48", "Flask of glue", "../img/treasure1/card0143.png", "../img/treasure1/cardBack_Treasure.png", 0, 100, 0, 0, 0, 0, 0, 0, "Flask of glue", 0, null, true);
      treasure49 = new Card_treasure("treasure49", "", "../img/treasure1/card0144.png", "../img/treasure1/cardBack_Treasure.png", 5, 0, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure50 = new Card_treasure("treasure50", "", "../img/treasure1/card0145.png", "../img/treasure1/cardBack_Treasure.png", 2, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure51 = new Card_treasure("treasure51", "Yuppie water", "../img/treasure1/card0146.png", "../img/treasure1/cardBack_Treasure.png", 0, 100, 0, 0, 0, 0, 0, 0, "Yuppie water", 0, null, true);
      treasure52 = new Card_treasure("treasure52", "", "../img/treasure1/card0147.png", "../img/treasure1/cardBack_Treasure.png", 3, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure53 = new Card_treasure("treasure53", "", "../img/treasure1/card0148.png", "../img/treasure1/cardBack_Treasure.png", 3, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure54 = new Card_treasure("treasure54", "", "../img/treasure1/card0149.png", "../img/treasure1/cardBack_Treasure.png", 2, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure55 = new Card_treasure("treasure55", "Invisibility potion", "../img/treasure1/card0150.png", "../img/treasure1/cardBack_Treasure.png", 0, 200, 0, 0, 0, 0, 0, 0, "Invisibility potion", 0, null, true);
      treasure56 = new Card_treasure("treasure56", "", "../img/treasure1/card0151.png", "../img/treasure1/cardBack_Treasure.png", 5, 200, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure57 = new Card_treasure("treasure57", "Pollymorth Potion", "../img/treasure1/card0152.png", "../img/treasure1/cardBack_Treasure.png", 0, 1300, 0, 0, 0, 0, 0, 0, "Pollymorth Potion", 0, null, true);
      treasure58 = new Card_treasure("treasure58", "Transferral potion", "../img/treasure1/card0153.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0, 0, 0, "Transferral potion", 0, null, true);
      treasure59 = new Card_treasure("treasure59", "", "../img/treasure1/card0154.png", "../img/treasure1/cardBack_Treasure.png", 5, 300, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure60 = new Card_treasure("treasure60", "", "../img/treasure1/card0155.png", "../img/treasure1/cardBack_Treasure.png", 2, 200, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure61 = new Card_treasure("treasure61", "Potion of halitosis", "../img/treasure1/card0156.png", "../img/treasure1/cardBack_Treasure.png", 2, 100, 0, 0, 0, 0, 0, 0, "Potion of halitosis", 0, null, true);
      treasure62 = new Card_treasure("treasure62", "", "../img/treasure1/card0157.png", "../img/treasure1/cardBack_Treasure.png", 3, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure63 = new Card_treasure("treasure63", "Friendship potion", "../img/treasure1/card0158.png", "../img/treasure1/cardBack_Treasure.png", 0, 200, 0, 0, 0, 0, 0, 0, "Friendship potion", 0, null, true);
      treasure64 = new Card_treasure("treasure64", "", "../img/treasure1/card0159.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure65 = new Card_treasure("treasure65", "Steal a level", "../img/treasure1/card0160.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 0, "", 0, null, true);
      treasure66 = new Card_treasure("treasure66", "", "../img/treasure1/card0161.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 0, 0, 0, 0);
      treasure67 = new Card_treasure("treasure67", "", "../img/treasure1/card0162.png", "../img/treasure1/cardBack_Treasure.png", 2, 600, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "not", kind: ["Thief"] }]);
      treasure68 = new Card_treasure("treasure68", "", "../img/treasure1/card0163.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Halfling"] }]);
      treasure69 = new Card_treasure("treasure69", "", "../img/treasure1/card0164.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Halfling"] }]);
      treasure70 = new Card_treasure("treasure70", "", "../img/treasure1/card0165.png", "../img/treasure1/cardBack_Treasure.png", 3, 0, 0, 0, 0, 0);
      treasure71 = new Card_treasure("treasure71", "", "../img/treasure1/card0166.png", "../img/treasure1/cardBack_Treasure.png", 3, 600, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "not", kind: ["Warrior"] }]);
      treasure72 = new Card_treasure("treasure72", "", "../img/treasure1/card0167.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Thief"] }]);
      treasure73 = new Card_treasure("treasure73", "", "../img/treasure1/card0168.png", "../img/treasure1/cardBack_Treasure.png", 0, 600, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "not", kind: ["Cleric"] }]);
      Card_door = class {
        constructor(name = "", card_name = "", img = "", backimg = "", power = 0, race = "", kind = "", special = "", level = 0, bad_staff = null, remover = 0, weakness = null, advantage = null) {
          this.name = name;
          this.card_name = card_name;
          this.img = img;
          this.backimg = backimg;
          this.power = power;
          this.race = race;
          this.kind = kind;
          this.special = special;
          this.level = level;
          this.bad_staff = bad_staff;
          this.remover = remover;
          this.weakness = weakness;
          this.advantage = advantage;
        }
      };
      door1 = new Card_door("door1", "", "../img/doors1/card0001.png", "../img/doors1/cardBack_Doors.png", 0, "", "Cleric");
      door2 = new Card_door("door2", "", "../img/doors1/card0002.png", "../img/doors1/cardBack_Doors.png", 0, "", "Cleric");
      door3 = new Card_door("door3", "", "../img/doors1/card0003.png", "../img/doors1/cardBack_Doors.png", 0, "", "Thief");
      door4 = new Card_door("door4", "", "../img/doors1/card0004.png", "../img/doors1/cardBack_Doors.png", 0, "", "Thief");
      door5 = new Card_door("door5", "", "../img/doors1/card0005.png", "../img/doors1/cardBack_Doors.png", 0, "", "Thief");
      door6 = new Card_door("door6", "", "../img/doors1/card0006.png", "../img/doors1/cardBack_Doors.png", 0, "", "Warrior");
      door7 = new Card_door("door7", "", "../img/doors1/card0007.png", "../img/doors1/cardBack_Doors.png", 0, "", "Warrior");
      door8 = new Card_door("door8", "", "../img/doors1/card0008.png", "../img/doors1/cardBack_Doors.png", 0, "", "Warrior");
      door9 = new Card_door("door9", "", "../img/doors1/card0009.png", "../img/doors1/cardBack_Doors.png", 0, "", "Wizard");
      door10 = new Card_door("door10", "", "../img/doors1/card0010.png", "../img/doors1/cardBack_Doors.png", 0, "", "Wizard");
      door11 = new Card_door("door11", "", "../img/doors1/card0010.png", "../img/doors1/cardBack_Doors.png", 0, "", "Wizard");
      door12 = new Card_door("door12", "", "../img/doors1/card0012.png", "../img/doors1/cardBack_Doors.png", 0, "Dwarf");
      door13 = new Card_door("door13", "", "../img/doors1/card0013.png", "../img/doors1/cardBack_Doors.png", 0, "Dwarf");
      door14 = new Card_door("door14", "", "../img/doors1/card0014.png", "../img/doors1/cardBack_Doors.png", 0, "Dwarf");
      door15 = new Card_door("door15", "", "../img/doors1/card0015.png", "../img/doors1/cardBack_Doors.png", 0, "Elf", "", "", 0, 0, 1);
      door16 = new Card_door("door16", "", "../img/doors1/card0016.png", "../img/doors1/cardBack_Doors.png", 0, "Elf", "", "", 0, 0, 1);
      door17 = new Card_door("door17", "", "../img/doors1/card0017.png", "../img/doors1/cardBack_Doors.png", 0, "Elf", "", "", 0, 0, 1);
      door18 = new Card_door("door18", "", "../img/doors1/card0018.png", "../img/doors1/cardBack_Doors.png", 0, "Halfling");
      door19 = new Card_door("door19", "", "../img/doors1/card0019.png", "../img/doors1/cardBack_Doors.png", 0, "Halfling");
      door20 = new Card_door("door20", "", "../img/doors1/card0020.png", "../img/doors1/cardBack_Doors.png", 0, "Halfling");
      door21 = new Card_door("door21", "", "../img/doors1/card0021.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "change class" });
      door22 = new Card_door("door22", "", "../img/doors1/card0022.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "change race" });
      door23 = new Card_door("door23", "", "../img/doors1/card0023.png", "../img/doors1/cardBack_Doors.png", -5, "", "", "Curse", 0, { type: "change sex" });
      door24 = new Card_door("door24", "", "../img/doors1/card0024.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "chicken on your head" });
      door25 = new Card_door("door25", "", "../img/doors1/card0025.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose_levels", levels: 2 });
      door26 = new Card_door("door26", "", "../img/doors1/card0026.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "income tax" });
      door27 = new Card_door("door27", "", "../img/doors1/card0027.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
      door28 = new Card_door("door28", "", "../img/doors1/card0028.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose_levels", levels: 1 });
      door29 = new Card_door("door29", "", "../img/doors1/card0029.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose_levels", levels: 1 });
      door30 = new Card_door("door30", "", "../img/doors1/card0030.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
      door31 = new Card_door("door31", "", "../img/doors1/card0031.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
      door32 = new Card_door("door32", "", "../img/doors1/card0032.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
      door33 = new Card_door("door33", "", "../img/doors1/card0033.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
      door34 = new Card_door("door34", "", "../img/doors1/card0034.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
      door35 = new Card_door("door35", "", "../img/doors1/card0035.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
      door36 = new Card_door("door36", "", "../img/doors1/card0036.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose your class" });
      door37 = new Card_door("door37", "", "../img/doors1/card0037.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose your race" });
      door38 = new Card_door("door38", "", "../img/doors1/card0038.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "malign mirrror" });
      door39 = new Card_door("door39", "", "../img/doors1/card0039.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
      door40 = new Card_door("door40", "", "../img/doors1/card0040.png", "../img/doors1/cardBack_Doors.png", 10, "", "", "bonus_power_monster");
      door41 = new Card_door("door41", "", "../img/doors1/card0041.png", "../img/doors1/cardBack_Doors.png", -5, "", "", "bonus_power_monster");
      door42 = new Card_door("door42", "", "../img/doors1/card0042.png", "../img/doors1/cardBack_Doors.png", 5, "", "", "bonus_power_monster");
      door43 = new Card_door("door43", "", "../img/doors1/card0043.png", "../img/doors1/cardBack_Doors.png", 10, "", "", "bonus_power_monster");
      door44 = new Card_door("door44", "", "../img/doors1/card0044.png", "../img/doors1/cardBack_Doors.png", 5, "", "", "bonus_power_monster");
      door45 = new Card_door("door45", "", "../img/doors1/card0045.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, 0);
      door45.monsterAbilities = { autoEscape: true };
      door46 = new Card_door("door46", "", "../img/doors1/card0046.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, { type: "lose_levels", levels: 1 }, 1);
      door47 = new Card_door("door47", "", "../img/doors1/card0047.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, { type: "discard_footwear_or_lose_level" }, 0, 0, { type: "Elf", power: 4 });
      door48 = new Card_door("door48", "", "../img/doors1/card0048.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, 0);
      door48.monsterAbilities = { autoFailEscape: true };
      door49 = new Card_door("door49", "", "../img/doors1/card0049.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, { type: "lose_levels", levels: 1 }, 0, 0, { type: "Cleric", power: 3 });
      door50 = new Card_door("door50", "", "../img/doors1/card0050.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "", 1, { type: "lose_levels", levels: 2 }, -1);
      door51 = new Card_door("door51", "", "../img/doors1/card0051.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "", 1, 0, 1);
      door52 = new Card_door("door52", "", "../img/doors1/card0052.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "", 1, { type: "lose_levels", levels: 1 }, 0, { type: "fire", bonus_level: 1 });
      door52.monsterAbilities = { bonusLevelIfEquippedTreasureIds: ["treasure5", "treasure23"], bonusLevelIfEquippedTreasureBonus: 1 };
      door53 = new Card_door("door53", "", "../img/doors1/card0053.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "Undead", 1, { type: "lose_levels", levels: 3 });
      door53.monsterAbilities = { loseLevelOnEscape: 1 };
      door54 = new Card_door("door54", "", "../img/doors1/card0054.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "", 1, { type: "lose_levels", levels: 2 });
      door55 = new Card_door("door55", "", "../img/doors1/card0055.png", "../img/doors1/cardBack_Doors.png", 4, "monster", "", "", 1, 0, 0, 0, { type: "Elf", power: 5 });
      door56 = new Card_door("door56", "", "../img/doors1/card0056.png", "../img/doors1/cardBack_Doors.png", 4, "monster", "", "", 1, 0, -2);
      door57 = new Card_door("door57", "", "../img/doors1/card0057.png", "../img/doors1/cardBack_Doors.png", 4, "monster", "", "", 1, { type: "lose_levels", levels: 2 }, 0, 0, { type: "Wizard", power: 5 });
      door58 = new Card_door("door58", "", "../img/doors1/card0058.png", "../img/doors1/cardBack_Doors.png", 4, "monster", "", "Undead", 1, { type: "lose_levels", levels: 2 }, 0, 0, { type: "Dwarf", power: 5 });
      door59 = new Card_door("door59", "", "../img/doors1/card0059.png", "../img/doors1/cardBack_Doors.png", 6, "monster", "", "", 1, 0);
      door60 = new Card_door("door60", "", "../img/doors1/card0060.png", "../img/doors1/cardBack_Doors.png", 6, "monster", "", "", 1, 0, 0, 0, { type: "Warrior", power: 6 });
      door61 = new Card_door("door61", "", "../img/doors1/card0061.png", "../img/doors1/cardBack_Doors.png", 6, "monster", "", "", 1, 0, 0, { type: "level", bonus_level: 1 });
      door61.monsterAbilities = { bonusLevelIfOwnLevelEnough: true, bonusLevelIfOwnLevelEnoughBonus: 1 };
      door62 = new Card_door("door62", "", "../img/doors1/card0062.png", "../img/doors1/cardBack_Doors.png", 6, "monster", "", "", 1, { type: "lose_hand_or_lose_levels", levels: 2 }, 0, 0, { type: "Wizard", power: 6 });
      door63 = new Card_door("door63", "", "../img/doors1/card0063.png", "../img/doors1/cardBack_Doors.png", 8, "monster", "", "", 1, { type: "lose_all_equipped_classes_or_levels", levels: 3 });
      door64 = new Card_door("door64", "", "../img/doors1/card0064.png", "../img/doors1/cardBack_Doors.png", 8, "monster", "", "", 1, { type: "lose_levels", levels: 1 }, 0, 0, { type: "Elf", power: 6 });
      door65 = new Card_door("door65", "", "../img/doors1/card0065.png", "../img/doors1/cardBack_Doors.png", 8, "monster", "", "", 1, { type: "lose_levels", levels: 3 });
      door65.monsterAbilities = { dismissBattleHelpersWhileOnField: true };
      door66 = new Card_door("door66", "", "../img/doors1/card0066.png", "../img/doors1/cardBack_Doors.png", 8, "monster", "", "", 1, { type: "level_to_table_minimum" });
      door66.monsterAbilities = { combatPowerFromLevelOnly: true };
      door67 = new Card_door("door67", "", "../img/doors1/card0067.png", "../img/doors1/cardBack_Doors.png", 10, "monster", "", "", 1, { type: "escape_dice_death_or_levels", deathAtOrBelow: 2 }, 0, 0, { type: "Dwarf", power: 6 });
      door68 = new Card_door("door68", "", "../img/doors1/card0068.png", "../img/doors1/cardBack_Doors.png", 10, "monster", "", "", 1, { type: "lose_levels", levels: 3 });
      door68.monsterAbilities = { autoFailEscape: true };
      door69 = new Card_door("door69", "", "../img/doors1/card0069.png", "../img/doors1/cardBack_Doors.png", 10, "monster", "", "", 1, 0);
      door70 = new Card_door("door70", "", "../img/doors1/card0070.png", "../img/doors1/cardBack_Doors.png", 12, "monster", "", "", 1, 0, 0, 0, { type: "Dwarf, Halfling", power: 3 });
      door71 = new Card_door("door71", "", "../img/doors1/card0071.png", "../img/doors1/cardBack_Doors.png", 12, "monster", "", "", 1, { type: "lose_levels", levels: 2 }, 0, 0, { type: "Cleric", power: 4 });
      door71.monsterAbilities = { escapeLoseLevelsElfLevels: 3 };
      door72 = new Card_door("door72", "", "../img/doors1/card0072.png", "../img/doors1/cardBack_Doors.png", 12, "monster", "", "", 1, { type: "lose_levels", levels: 3 });
      door73 = new Card_door("door73", "", "../img/doors1/card0073.png", "../img/doors1/cardBack_Doors.png", 14, "monster", "", "", 1, { type: "death" }, 0, 0, { type: "Warrior", power: 4 });
      door73.monsterAbilities = { deathBadStaffWizardDiscardsClassOnly: true };
      door74 = new Card_door("door74", "", "../img/doors1/card0074.png", "../img/doors1/cardBack_Doors.png", 14, "monster", "", "", 1, 0);
      door74.monsterAbilities = { combatPowerExcludesLevel: true };
      door75 = new Card_door("door75", "", "../img/doors1/card0075.png", "../img/doors1/cardBack_Doors.png", 14, "monster", "", "", 1, { type: "death" });
      door76 = new Card_door("door76", "", "../img/doors1/card0076.png", "../img/doors1/cardBack_Doors.png", 16, "monster", "", "Undead", 2, { type: "lose_levels", levels: 2 });
      door76.monsterAbilities = {
        escapeAutoSuccessMaxPlayerLevel: 3,
        loseLevelsOnEscapeSuccessMinPlayerLevel: 4,
        loseLevelsOnEscapeSuccessAmount: 2
      };
      door77 = new Card_door("door77", "", "../img/doors1/card0077.png", "../img/doors1/cardBack_Doors.png", 16, "monster", "", "", 2, 0);
      door77.monsterAbilities = { escapeAutoSuccessMaxPlayerLevel: 3 };
      door78 = new Card_door("door78", "", "../img/doors1/card0078.png", "../img/doors1/cardBack_Doors.png", 16, "monster", "", "Undead", 2, { type: "lose_levels", levels: 9 });
      door78.monsterAbilities = {
        escapeAutoSuccessMaxPlayerLevel: 3,
        loseLevelsOnEscapeSuccessMinPlayerLevel: 4,
        loseLevelsOnEscapeSuccessAmount: 2
      };
      door79 = new Card_door("door79", "", "../img/doors1/card0079.png", "../img/doors1/cardBack_Doors.png", 18, "monster", "", "", 2, { type: "death" });
      door79.monsterAbilities = {
        battleElfCombatPenaltyEach: 4,
        escapeAutoSuccessMaxPlayerLevel: 4,
        escapeAutoSuccessExcludeRaceElf: true
      };
      door80 = new Card_door("door80", "", "../img/doors1/card0080.png", "../img/doors1/cardBack_Doors.png", 18, "monster", "", "", 2, { type: "death" });
      door80.monsterAbilities = { escapeAutoSuccessMaxPlayerLevel: 4 };
      door81 = new Card_door("door81", "", "../img/doors1/card0081.png", "../img/doors1/cardBack_Doors.png", 20, "monster", "", "", 2, { type: "death" });
      door81.monsterAbilities = { escapeAutoSuccessMaxPlayerLevel: 5 };
      door82 = new Card_door("door82", "Half-breed", "../img/doors1/card0082.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Half-breed");
      door83 = new Card_door("door83", "Half-breed", "../img/doors1/card0083.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Half-breed");
      door84 = new Card_door("door84", "Super Munchkin", "../img/doors1/card0084.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Super Munchkin");
      door85 = new Card_door("door85", "Super Munchkin", "../img/doors1/card0085.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Super Munchkin");
      door86 = new Card_door("door86", "Wandering Monster", "../img/doors1/card0086.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Wandering Monster");
      door87 = new Card_door("door87", "Wandering Monster", "../img/doors1/card0087.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Wandering Monster");
      door88 = new Card_door("door88", "Wandering Monster", "../img/doors1/card0088.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Wandering Monster");
      door89 = new Card_door("door89", "Cheat", "../img/doors1/card0089.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Cheat");
      door90 = new Card_door("door90", "Divine intervention", "../img/doors1/card0090.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Divine intervention");
      door91 = new Card_door("door91", "", "../img/doors1/card0091.png", "../img/doors1/cardBack_Doors.png", 0);
      door92 = new Card_door("door92", "Illusion", "../img/doors1/card0092.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Illusion");
      door93 = new Card_door("door93", "Mate", "../img/doors1/card0093.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Mate");
      door94 = new Card_door("door94", "Out to lunch", "../img/doors1/card0094.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Out to lunch");
      door95 = new Card_door("door95", "", "../img/doors1/card0000.png", "../img/doors1/cardBack_Doors.png", 0, "", "Cleric");
      UpdatebackImgTreasure();
      UpdatebackImgDoor();
      document.addEventListener("DOMContentLoaded", function() {
        function initialize() {
          if (gameStarted) {
            document.querySelector(".button_start_game")?.remove?.();
            window.button = null;
            return;
          }
          window.button = document.querySelector(".button_start_game");
          window.zonedoor = document.querySelector(".zone_doors");
          window.zoneTreasure = document.querySelector(".zone_treasure");
          setZoneInteractivityByPlayers(0);
          if (lobbyConnectedPlayers > 0) {
            applySeatIconsForPlayerCount(lobbyConnectedPlayers);
          } else {
            applySeatIconsForPlayerCount(1);
          }
          if (!window.__lobbySyncRequested) {
            window.__lobbySyncRequested = true;
            const roomMatch = window.location.pathname.match(/\/room\/([^/]+)/);
            const rid = roomMatch && roomMatch[1];
            if (rid) {
              socket_default.emit("message", { method: "RequestRoomLobby", roomID: rid });
            }
          }
          if (!window.button) {
            setTimeout(initialize, 1e3);
          } else if (!window.__startButtonBound) {
            window.__startButtonBound = true;
            window.button.addEventListener("click", function() {
              const Start = {
                method: "Start",
                num
              };
              socket_default.emit("message", Start);
            });
          }
        }
        initialize();
        initializeSellTreasuresUi();
      });
      flag = false;
      window.FoldCount = 0;
      foldedOnTurnSeat = null;
      battleTurnSeat = null;
      timerSecondsRemaining = 0;
      timerRunning = false;
      TURN_TIMER_SECONDS = 60;
    }
  });

  // src/tutorial-runtime.js
  var tutorial_runtime_exports = {};
  __export(tutorial_runtime_exports, {
    applyTutorialSeatDisplayNames: () => applyTutorialSeatDisplayNames,
    canDragCardFromTutorialDeck: () => canDragCardFromTutorialDeck,
    canDragCardToTutorialDeck: () => canDragCardToTutorialDeck,
    configureTutorialGameState: () => configureTutorialGameState,
    deckFilling: () => deckFilling,
    ensureCardCatalogLoaded: () => ensureCardCatalogLoaded,
    ensureTutorialDice: () => ensureTutorialDice,
    markTutorialDeckCard: () => markTutorialDeckCard,
    refreshTutorialDeckTakeRules: () => refreshTutorialDeckTakeRules,
    resetTutorialDeckTakeLimits: () => resetTutorialDeckTakeLimits,
    syncTutorialLevelsAfterCatalog: () => syncTutorialLevelsAfterCatalog,
    tryStartTutorialBattleTimer: () => tryStartTutorialBattleTimer,
    wireTutorialEndTurnButton: () => wireTutorialEndTurnButton
  });
  function migrateTutorialLevelsShape() {
    const lv = window.__tutorialLevels;
    if (!lv || typeof lv !== "object") {
      return;
    }
    if (lv.player != null || lv.opponent != null) {
      return;
    }
    window.__tutorialLevels = {
      player: Math.max(1, Number(lv[0]) || 1),
      opponent: Math.max(1, Number(lv[1]) || 4)
    };
  }
  function ensureTutorialLevels() {
    if (!window.__tutorialLevels) {
      window.__tutorialLevels = { player: 1, opponent: 4 };
    }
    migrateTutorialLevelsShape();
    return window.__tutorialLevels;
  }
  function getTutorialLevel(role) {
    return ensureTutorialLevels()[role] ?? 1;
  }
  function setTutorialLevel(role, level) {
    const lv = Math.max(1, Math.floor(Number(level)) || 1);
    ensureTutorialLevels()[role] = lv;
    const sel = TUTORIAL_LEVEL_UI[role];
    const el = sel ? document.querySelector(sel) : null;
    if (el) {
      el.textContent = String(lv);
    }
  }
  function adjustTutorialLevelDisplay(role, delta) {
    setTutorialLevel(role, getTutorialLevel(role) + (Number(delta) || 0));
  }
  function tutorialRoleToGameSeat(role) {
    return role === "opponent" ? 1 : 0;
  }
  function gameSeatToTutorialRole(seat) {
    return Number(seat) === 1 ? "opponent" : "player";
  }
  function applyTutorialSeatDisplayNames() {
    if (!window.__TUTORIAL_BOARD) {
      return;
    }
    Object.entries(TUTORIAL_SEAT_DISPLAY_NAMES).forEach(([seat, name]) => {
      const ch = window.characterBySeat?.[Number(seat)];
      if (ch) {
        ch.name = name;
      }
    });
  }
  function getTutorialRoleForCardZone(cardId) {
    const card = document.getElementById(cardId);
    const zoneId = card?.parentElement?.id;
    if (!zoneId) {
      return null;
    }
    if (OPPONENT_EQUIP_ZONE_IDS.includes(zoneId) || zoneId === "opponenthand") {
      return "opponent";
    }
    if (zoneId === "zone2" || zoneId === "zone5" || zoneId === "myhand") {
      return "player";
    }
    return null;
  }
  function resolveTutorialCurseTargetRole(cardId, networkSeat) {
    return getTutorialRoleForCardZone(cardId) ?? gameSeatToTutorialRole(networkSeat);
  }
  function isTutorialDeckMovableCard(cardId) {
    return Boolean(cardId) && TUTORIAL_DEAL_CARD_IDS.has(cardId);
  }
  function markTutorialDeckCard(card) {
    if (card) {
      card.dataset.tutorialDeckCard = "1";
    }
  }
  function deckFilling(deck, zone) {
    if (!Array.isArray(deck) || !zone) return;
    const markAsDeckCard = window.__TUTORIAL_BOARD && (zone.id === "zone_doors" || zone.id === "zone_treasure");
    for (const def of deck) {
      const card = document.createElement("div");
      card.classList.add("card");
      card.setAttribute("id", def.name);
      card.setAttribute("draggable", "true");
      const image = document.createElement("img");
      image.classList.add("card-item");
      image.setAttribute("src", def.img);
      card.appendChild(image);
      if (markAsDeckCard) {
        markTutorialDeckCard(card);
      }
      zone.appendChild(card);
    }
  }
  function normalizeTutorialBadStaff(badStaff) {
    if (!badStaff || typeof badStaff !== "object") {
      return null;
    }
    const type = String(badStaff.type || "").trim();
    if (!type) {
      return null;
    }
    if (type === "lose_levels") {
      return { type, levels: Number(badStaff.levels) || 1 };
    }
    return { type };
  }
  function moveDoorCardToDiscard(cardId) {
    const zone = document.getElementById("zone_doors_drop");
    const card = document.getElementById(cardId);
    if (zone && card) {
      zone.appendChild(card);
    }
  }
  function moveTreasureCardToDiscard2(cardId) {
    const zone = document.getElementById("zone_treasure_drop");
    const card = document.getElementById(cardId);
    if (zone && card) {
      zone.appendChild(card);
    }
  }
  function findTopDoorDiscardClassCardId2() {
    const zone = document.getElementById("zone_doors_drop");
    if (!zone) {
      return null;
    }
    const els = Array.from(zone.querySelectorAll(".card"));
    for (let i3 = els.length - 1; i3 >= 0; i3 -= 1) {
      const id = els[i3]?.id;
      if (!id) {
        continue;
      }
      const door96 = window.doors?.find((d) => d.name === id);
      if (door96 && String(door96.kind || "").trim()) {
        return id;
      }
    }
    return null;
  }
  function applyTutorialChangeClassOnSeat(role) {
    const zones = role === "opponent" ? OPPONENT_EQUIP_ZONE_IDS : ["zone2", "zone5"];
    const classIds = collectClassCardIdsInZones(zones);
    if (classIds.length === 0) {
      return;
    }
    classIds.forEach((id) => moveDoorCardToDiscard(id));
    const replacementId = findTopDoorDiscardClassCardId2();
    if (replacementId) {
      const mainZone = document.getElementById(role === "opponent" ? "zone_opponent" : "zone2");
      const card = document.getElementById(replacementId);
      if (mainZone && card) {
        mainZone.appendChild(card);
      }
    }
  }
  function collectClassCardIdsInZones(zoneIds) {
    const out = [];
    zoneIds.forEach((zid) => {
      const zone = document.getElementById(zid);
      if (!zone) {
        return;
      }
      zone.querySelectorAll(":scope > .card").forEach((el) => {
        const door96 = window.doors?.find((d) => d.name === el.id);
        if (!door96 || String(door96.race || "") === "monster") {
          return;
        }
        if (String(door96.kind || "").trim() && !out.includes(el.id)) {
          out.push(el.id);
        }
      });
    });
    return out;
  }
  function applyTutorialCurseOnSeat(role, cardId) {
    const door96 = window.doors?.find((d) => d.name === cardId);
    if (!door96) {
      return;
    }
    const bad = normalizeTutorialBadStaff(door96.bad_staff);
    const zones = role === "opponent" ? OPPONENT_EQUIP_ZONE_IDS : ["zone2", "zone5"];
    if (bad?.type === "lose your class") {
      const classIds = collectClassCardIdsInZones(zones);
      if (classIds.length === 0) {
        adjustTutorialLevelDisplay(role, -1);
      } else {
        classIds.forEach((id) => moveDoorCardToDiscard(id));
      }
    } else if (bad?.type === "change class") {
      applyTutorialChangeClassOnSeat(role);
    } else if (bad?.type === "lose_levels") {
      adjustTutorialLevelDisplay(role, -(Number(bad.levels) || 1));
    } else if (bad?.type === "lose your race") {
      zones.forEach((zid) => {
        const zone = document.getElementById(zid);
        if (!zone) {
          return;
        }
        Array.from(zone.querySelectorAll(":scope > .card")).forEach((el) => {
          const d = window.doors?.find((x) => x.name === el.id);
          if (d && String(d.race || "").trim() && String(d.race) !== "monster" && !String(d.kind || "").trim()) {
            moveDoorCardToDiscard(el.id);
          }
        });
      });
    }
    moveDoorCardToDiscard(cardId);
    afterTutorialLevelOrPowerChange();
  }
  function curseNeedsLocalApplyOnOpponent(door96) {
    const bad = normalizeTutorialBadStaff(door96?.bad_staff);
    return Boolean(bad && OPPONENT_CURSE_TYPES_LOCAL_ONLY.has(bad.type));
  }
  function applyTutorialBadStaffFromNetwork(seat, badStaff, cardId) {
    if (!cardId) {
      return;
    }
    const role = resolveTutorialCurseTargetRole(cardId, seat);
    const bad = normalizeTutorialBadStaff(badStaff);
    if (!bad) {
      moveDoorCardToDiscard(cardId);
      afterTutorialLevelOrPowerChange();
      return;
    }
    if (bad.type === "lose_levels") {
      adjustTutorialLevelDisplay(role, -(bad.levels || 1));
      moveDoorCardToDiscard(cardId);
    } else {
      applyTutorialCurseOnSeat(role, cardId);
      return;
    }
    afterTutorialLevelOrPowerChange();
  }
  function applyCommittedOpponentCurses() {
    if (!window.__TUTORIAL_BOARD) {
      return;
    }
    OPPONENT_EQUIP_ZONE_IDS.forEach((zoneId) => {
      const zone = document.getElementById(zoneId);
      if (!zone) {
        return;
      }
      Array.from(zone.querySelectorAll(":scope > .card")).forEach((card) => {
        const id = card.id;
        if (!id) {
          return;
        }
        const door96 = window.doors?.find((d) => d.name === id);
        if (String(door96?.special || "").trim().toLowerCase() !== "curse") {
          return;
        }
        if (!curseNeedsLocalApplyOnOpponent(door96)) {
          return;
        }
        applyTutorialCurseOnSeat("opponent", id);
      });
    });
  }
  function bindTutorialSocketInterceptHandlers() {
    if (tutorialSocketInterceptBound) {
      return;
    }
    tutorialSocketInterceptBound = true;
    window.addEventListener("munchkin:tutorialBadStaff", (ev) => {
      if (!window.__TUTORIAL_BOARD) {
        return;
      }
      const { seat, bad_staff: badStaff, cardId } = ev.detail || {};
      applyTutorialBadStaffFromNetwork(seat, badStaff, cardId);
    });
    window.addEventListener("munchkin:tutorialTreasure65", (ev) => {
      if (!window.__TUTORIAL_BOARD) {
        return;
      }
      const detail = ev.detail || {};
      const cardId = String(detail.cardId || "treasure65");
      adjustTutorialLevelDisplay("player", 1);
      adjustTutorialLevelDisplay("opponent", -1);
      moveTreasureCardToDiscard2(cardId);
      afterTutorialLevelOrPowerChange();
    });
    window.addEventListener("munchkin:tutorialTreasureLevel", (ev) => {
      if (!window.__TUTORIAL_BOARD) {
        return;
      }
      const { seat, level, cardId, treasureLevelApplied } = ev.detail || {};
      if (treasureLevelApplied === false || !cardId) {
        return;
      }
      const gain = Number(level);
      if (!Number.isFinite(gain) || gain <= 0) {
        return;
      }
      const role = getTutorialRoleForCardZone(cardId) ?? gameSeatToTutorialRole(seat);
      adjustTutorialLevelDisplay(role, gain);
      moveTreasureCardToDiscard2(cardId);
      const hid = String(ev.detail?.killedHirelingCardId || "").trim();
      if (hid) {
        moveTreasureCardToDiscard2(hid);
      }
      afterTutorialLevelOrPowerChange();
    });
    window.addEventListener("munchkin:tutorialLevelAdjust", (ev) => {
      if (!window.__TUTORIAL_BOARD) {
        return;
      }
      const { seat, delta } = ev.detail || {};
      const d = Number(delta);
      if (!Number.isFinite(d) || d === 0) {
        return;
      }
      adjustTutorialLevelDisplay(gameSeatToTutorialRole(seat), d);
      afterTutorialLevelOrPowerChange();
    });
    window.addEventListener("munchkin:tutorialEscapeFinished", () => {
      if (!window.__TUTORIAL_BOARD || window.__tutorialBattleCompleted) {
        return;
      }
      tutorialFinishBattleAfterEscape();
    });
    window.addEventListener("munchkin:playerProfileStorageUpdated", () => {
      applyTutorialSeatDisplayNames();
    });
  }
  function tutorialMoveBattleCardsToDiscard() {
    const doorDrop = document.getElementById("zone_doors_drop");
    const treasureDrop = document.getElementById("zone_treasure_drop");
    ["zone_monster", "zone3"].forEach((zoneId) => {
      const zone = document.getElementById(zoneId);
      if (!zone) {
        return;
      }
      Array.from(zone.querySelectorAll(":scope > .card")).forEach((card) => {
        const id = String(card.id || "");
        if (!id || id === "card") {
          return;
        }
        const drop = id.includes("door") ? doorDrop : treasureDrop;
        if (drop) {
          drop.appendChild(card);
        }
      });
    });
  }
  function tutorialFinishBattleAfterEscape() {
    tutorialMoveBattleCardsToDiscard();
    const timerEl = document.getElementById("timer");
    if (timerEl) {
      timerEl.textContent = "";
    }
    window.__tutorialAwaitingEndTurn = true;
    const endTurn = document.getElementById("end-turn");
    const fold = document.getElementById("fold");
    if (endTurn) {
      endTurn.style.display = "flex";
    }
    if (fold) {
      fold.style.display = "none";
    }
    try {
      recalculateAllPowerDisplays();
      updateTurnActionButtons(false);
      window.dispatchEvent(new Event("munchkin:zonesChanged"));
    } catch {
    }
  }
  function ensureTutorialDice() {
    if (!window.__TUTORIAL_BOARD) {
      return;
    }
    const diceContainer = document.querySelector(".dice-container");
    if (!diceContainer) {
      return;
    }
    diceContainer.style.pointerEvents = "auto";
    diceContainer.style.cursor = "pointer";
    setupMunchkinDiceAfterGameStart();
  }
  function initTutorialLevelDisplays() {
    setTutorialLevel("player", 1);
    setTutorialLevel("opponent", 4);
    syncTutorialLevelBySeatToGame();
  }
  function syncTutorialLevelBySeatToGame() {
    if (!window.__TUTORIAL_BOARD) {
      return;
    }
    Object.entries(TUTORIAL_LEVEL_UI).forEach(([role]) => {
      const seat = tutorialRoleToGameSeat(role);
      setLevelBySeat(seat, getTutorialLevel(role));
    });
  }
  function applyTutorialLevelsToCharacterPower() {
    if (!window.__TUTORIAL_BOARD) {
      return;
    }
    syncTutorialLevelBySeatToGame();
    try {
      recalculateAllPowerDisplays();
    } catch {
    }
    const oppEl = document.getElementById("PowerPlayer2");
    const myEl = document.getElementById("MyPower");
    const oppCh = window.characterBySeat?.[tutorialRoleToGameSeat("opponent")];
    const myCh = window.characterBySeat?.[tutorialRoleToGameSeat("player")];
    if (oppEl && oppCh) {
      oppEl.textContent = String(oppCh.power);
    }
    if (myEl && myCh) {
      myEl.textContent = String(myCh.power);
    }
  }
  function afterTutorialLevelOrPowerChange() {
    applyTutorialLevelsToCharacterPower();
  }
  function syncTutorialLevelsAfterCatalog() {
    if (!window.__TUTORIAL_BOARD) {
      return;
    }
    setTutorialLevel("player", getTutorialLevel("player"));
    setTutorialLevel("opponent", getTutorialLevel("opponent"));
    applyTutorialSeatDisplayNames();
    applyTutorialLevelsToCharacterPower();
  }
  function ensureCardCatalogLoaded() {
    if (Array.isArray(window.doors) && window.doors.length > 0 && Array.isArray(window.treasures) && window.treasures.length > 0) {
      return;
    }
    socket_default.emit("message", { method: "1", fl: true, num: 2 });
  }
  function enableTutorialZones() {
    TUTORIAL_ACTIVE_ZONE_IDS.forEach((id) => {
      const zone = document.getElementById(id);
      if (!zone) {
        return;
      }
      zone.style.pointerEvents = "auto";
      zone.style.opacity = "";
    });
  }
  function bindTutorialCatalogReadySync() {
    if (window.__tutorialCatalogSyncBound) {
      return;
    }
    window.__tutorialCatalogSyncBound = true;
    const resync = () => {
      if (!window.__TUTORIAL_BOARD) {
        return;
      }
      migrateTutorialLevelsShape();
      initTutorialLevelDisplays();
      applyTutorialSeatDisplayNames();
      applyTutorialLevelsToCharacterPower();
      refreshTutorialDeckTakeRules();
      ensureTutorialDice();
    };
    window.addEventListener("munchkin:tutorialCatalogReady", resync);
    window.addEventListener("munchkin:zonesChanged", () => {
      requestAnimationFrame(() => applyTutorialLevelsToCharacterPower());
    });
  }
  function configureTutorialGameState() {
    window.__TUTORIAL_BOARD = true;
    window.num = 2;
    window.__tutorialBattleCompleted = false;
    window.__tutorialAwaitingEndTurn = false;
    window.__lobbySyncRequested = true;
    migrateTutorialLevelsShape();
    enableTutorialZones();
    initTutorialLevelDisplays();
    bindTutorialSocketInterceptHandlers();
    bindTutorialDragCleanup();
    bindTutorialCatalogReadySync();
    applyTutorialSeatDisplayNames();
    if (typeof window !== "undefined") {
      window.__applyTutorialSeatDisplayNames = applyTutorialSeatDisplayNames;
    }
  }
  function getTutorialTreasureDrawableIdsFromDeck() {
    const zone = document.getElementById("zone_treasure");
    if (!zone) {
      return [];
    }
    const ids = Array.from(zone.querySelectorAll(":scope > .card")).map((c) => c.id).filter(Boolean);
    const allowed = [];
    for (let i3 = ids.length - 1; i3 >= 0; i3 -= 1) {
      const id = ids[i3];
      if (TUTORIAL_TREASURE_DRAWABLE_IDS.includes(id)) {
        allowed.unshift(id);
      } else if (allowed.length > 0) {
        break;
      }
    }
    return allowed.filter((id) => TUTORIAL_TREASURE_DRAWABLE_IDS.includes(id));
  }
  function getTutorialDoorDrawableIdsFromDeck() {
    const zone = document.getElementById("zone_doors");
    if (!zone) {
      return [];
    }
    const ids = Array.from(zone.querySelectorAll(":scope > .card")).map((c) => c.id).filter(Boolean);
    const allowed = [];
    for (let i3 = ids.length - 1; i3 >= 0; i3 -= 1) {
      const id = ids[i3];
      if (TUTORIAL_DOOR_DRAWABLE_IDS.includes(id)) {
        allowed.unshift(id);
      } else if (allowed.length > 0) {
        break;
      }
    }
    return allowed.filter((id) => TUTORIAL_DOOR_DRAWABLE_IDS.includes(id));
  }
  function canDragCardToTutorialDeck(cardId) {
    if (!window.__TUTORIAL_BOARD || !cardId) {
      return true;
    }
    return isTutorialDeckMovableCard(cardId);
  }
  function canDragCardFromTutorialDeck(cardId, fromZoneId) {
    if (!window.__TUTORIAL_BOARD || !cardId || !fromZoneId) {
      return true;
    }
    if (!isTutorialDeckMovableCard(cardId)) {
      return false;
    }
    if (fromZoneId === "zone_doors") {
      if (TUTORIAL_DOOR_DRAWABLE_IDS.includes(cardId)) {
        return getTutorialDoorDrawableIdsFromDeck().includes(cardId);
      }
      return TUTORIAL_HAND_ZONE_BY_CARD.has(cardId) || cardId === "door9";
    }
    if (fromZoneId === "zone_treasure") {
      if (TUTORIAL_TREASURE_DRAWABLE_IDS.includes(cardId)) {
        return getTutorialTreasureDrawableIdsFromDeck().includes(cardId);
      }
      return TUTORIAL_HAND_ZONE_BY_CARD.has(cardId);
    }
    return true;
  }
  function refreshTutorialDeckTakeRules() {
    if (!window.__TUTORIAL_BOARD) {
      return;
    }
    const doorAllowed = new Set(getTutorialDoorDrawableIdsFromDeck());
    const treasureAllowed = new Set(getTutorialTreasureDrawableIdsFromDeck());
    ["zone_doors", "zone_treasure"].forEach((zoneId) => {
      const zone = document.getElementById(zoneId);
      if (!zone) {
        return;
      }
      zone.querySelectorAll(":scope > .card").forEach((card) => {
        const id = card.id;
        if (!id || id === "card") {
          return;
        }
        if (card.dataset.tutorialDeckCard === "1") {
          const allowed = zoneId === "zone_doors" ? doorAllowed : treasureAllowed;
          card.draggable = allowed.has(id);
          return;
        }
        card.draggable = isTutorialDeckMovableCard(id);
      });
    });
    if (!tutorialDeckDragGuardBound) {
      tutorialDeckDragGuardBound = true;
      document.addEventListener("dragstart", (event) => {
        const card = event.target?.closest?.(".card");
        if (!card?.id) {
          return;
        }
        const zoneId = card.parentElement?.id;
        if ((zoneId === "zone_doors" || zoneId === "zone_treasure") && !canDragCardFromTutorialDeck(card.id, zoneId)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
      document.addEventListener("dragover", (event) => {
        if (!window.__TUTORIAL_BOARD || !tutorialDraggingCardId) {
          return;
        }
        const zone = event.target?.closest?.(".cards-zone");
        if (!zone || zone.id !== "zone_doors" && zone.id !== "zone_treasure") {
          return;
        }
        if (!canDragCardToTutorialDeck(tutorialDraggingCardId)) {
          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "none";
          }
        }
      }, true);
    }
  }
  function markTutorialDeckCommittedCards() {
    ["zone_doors", "zone_treasure"].forEach((zoneId) => {
      const zone = document.getElementById(zoneId);
      if (!zone) {
        return;
      }
      Array.from(zone.querySelectorAll(":scope > .card")).forEach((card) => {
        if (card.dataset.tutorialDeckCard === "1") {
          return;
        }
        if (isTutorialDeckMovableCard(card.id)) {
          card.dataset.tutorialCommittedToDeck = "1";
        }
      });
    });
  }
  function restoreMisplacedHandCardsFromDecks() {
    ["zone_doors", "zone_treasure"].forEach((zoneId) => {
      const zone = document.getElementById(zoneId);
      if (!zone) {
        return;
      }
      Array.from(zone.querySelectorAll(":scope > .card")).forEach((card) => {
        if (card.dataset.tutorialDeckCard === "1") {
          return;
        }
        if (card.dataset.tutorialCommittedToDeck === "1" && isTutorialDeckMovableCard(card.id)) {
          return;
        }
        const home = TUTORIAL_CARD_HOME_ZONE.get(card.id);
        if (!home) {
          return;
        }
        const homeZone = document.getElementById(home);
        if (homeZone) {
          homeZone.appendChild(card);
        }
        delete card.dataset.tutorialCommittedToDeck;
        card.style.opacity = "";
        card.style.pointerEvents = "";
        card.style.filter = "";
        card.draggable = true;
      });
    });
  }
  function runTutorialDragEndCleanup() {
    if (!window.__TUTORIAL_BOARD) {
      return;
    }
    markTutorialDeckCommittedCards();
    restoreMisplacedHandCardsFromDecks();
    applyCommittedOpponentCurses();
    document.querySelectorAll(".card").forEach((card) => {
      if (card.dataset.tutorialDeckCard !== "1") {
        card.style.opacity = "";
        card.style.pointerEvents = "";
      }
    });
    refreshTutorialDeckTakeRules();
    tryStartTutorialBattleTimer();
  }
  function bindTutorialDragCleanup() {
    if (tutorialDragCleanupBound) {
      return;
    }
    tutorialDragCleanupBound = true;
    document.addEventListener("dragstart", (event) => {
      if (!window.__TUTORIAL_BOARD) {
        return;
      }
      tutorialDragActive = true;
      const card = event.target?.closest?.(".card");
      tutorialDraggingCardId = card?.id || null;
      if (card?.dataset?.tutorialCommittedToDeck === "1") {
        delete card.dataset.tutorialCommittedToDeck;
      }
    }, true);
    document.addEventListener("dragend", () => {
      if (!window.__TUTORIAL_BOARD) {
        return;
      }
      setTimeout(() => {
        tutorialDragActive = false;
        tutorialDraggingCardId = null;
        runTutorialDragEndCleanup();
      }, 0);
    }, false);
  }
  function tryStartTutorialBattleTimer() {
    if (!window.__TUTORIAL_BOARD || window.__tutorialBattleCompleted) {
      return;
    }
    if (window.__tutorialAwaitingEndTurn) {
      return;
    }
    if (tutorialDragActive) {
      return;
    }
    if (!getMonsterBattleContext().hasMonster) {
      return;
    }
    const battleZoneIds = ["zone3", "zone_monster"];
    const hasMonsterInBattleZone = battleZoneIds.some((zoneId) => {
      const zone = document.getElementById(zoneId);
      if (!zone) {
        return false;
      }
      return Array.from(zone.querySelectorAll(":scope > .card")).some((card) => {
        const door96 = window.doors?.find((d) => d.name === card.id);
        return door96 && String(door96.race || "") === "monster";
      });
    });
    if (!hasMonsterInBattleZone) {
      return;
    }
    const timerEl = document.getElementById("timer");
    if (timerEl && timerEl.textContent) {
      return;
    }
    window.__tutorialAwaitingEndTurn = false;
    timer();
    try {
      window.dispatchEvent(new Event("munchkin:tutorialTimerUiChanged"));
    } catch {
    }
  }
  function resetTutorialDeckTakeLimits() {
  }
  function wireTutorialEndTurnButton() {
    const btn = document.getElementById("end-turn");
    if (!btn || btn.dataset.tutorialWired === "1") {
      return;
    }
    btn.dataset.tutorialWired = "1";
    btn.addEventListener("click", () => {
      window.__tutorialBattleCompleted = true;
      document.body.classList.add("tutorial-finished");
      const overlay = document.getElementById("tutorial-complete-overlay");
      if (overlay) {
        overlay.classList.remove("is-hidden");
        overlay.setAttribute("aria-hidden", "false");
      }
      try {
        window.dispatchEvent(new Event("munchkin:tutorialTimerUiChanged"));
      } catch {
      }
    });
  }
  var TUTORIAL_DOOR_DRAWABLE_IDS, TUTORIAL_TREASURE_DRAWABLE_IDS, OPPONENT_EQUIP_ZONE_IDS, TUTORIAL_DEAL_CARD_IDS, TUTORIAL_LEVEL_UI, TUTORIAL_ACTIVE_ZONE_IDS, TUTORIAL_HAND_ZONE_BY_CARD, TUTORIAL_CARD_HOME_ZONE, TUTORIAL_SEAT_DISPLAY_NAMES, OPPONENT_CURSE_TYPES_LOCAL_ONLY, tutorialDeckDragGuardBound, tutorialDragCleanupBound, tutorialSocketInterceptBound, tutorialDragActive, tutorialDraggingCardId;
  var init_tutorial_runtime = __esm({
    "src/tutorial-runtime.js"() {
      init_socket3();
      init_game();
      TUTORIAL_DOOR_DRAWABLE_IDS = ["door89", "door28"];
      TUTORIAL_TREASURE_DRAWABLE_IDS = ["treasure72", "treasure71"];
      OPPONENT_EQUIP_ZONE_IDS = ["zone_opponent", "zone_opponent_side"];
      TUTORIAL_DEAL_CARD_IDS = /* @__PURE__ */ new Set([
        ...["door51", "door94", "door36", "door12", "treasure65", "treasure32", "treasure7", "treasure16"],
        ...["treasure31", "treasure11", "treasure56", "door45"],
        "door9",
        "door28",
        "door89",
        "treasure71",
        "treasure72"
      ]);
      TUTORIAL_LEVEL_UI = {
        player: ".level-bottom-center",
        opponent: ".level-top-center"
      };
      TUTORIAL_ACTIVE_ZONE_IDS = [
        "myhand",
        "opponenthand",
        "zone_opponent",
        "zone_opponent_side",
        "zone2",
        "zone5",
        "zone3",
        "zone_monster",
        "zone_doors",
        "zone_treasure",
        "zone_doors_drop",
        "zone_treasure_drop"
      ];
      TUTORIAL_HAND_ZONE_BY_CARD = /* @__PURE__ */ new Map([
        ["door51", "myhand"],
        ["door94", "myhand"],
        ["door36", "myhand"],
        ["door12", "myhand"],
        ["treasure65", "myhand"],
        ["treasure32", "myhand"],
        ["treasure7", "myhand"],
        ["treasure16", "myhand"],
        ["treasure31", "opponenthand"],
        ["treasure11", "opponenthand"],
        ["treasure56", "opponenthand"],
        ["door45", "opponenthand"]
      ]);
      TUTORIAL_CARD_HOME_ZONE = new Map([
        ...TUTORIAL_HAND_ZONE_BY_CARD.entries()
      ]);
      TUTORIAL_SEAT_DISPLAY_NAMES = {
        0: "\u0418\u0433\u0440\u043E\u043A",
        1: "\u0421\u043E\u043F\u0435\u0440\u043D\u0438\u043A"
      };
      OPPONENT_CURSE_TYPES_LOCAL_ONLY = /* @__PURE__ */ new Set([
        "lose your class",
        "lose your race",
        "change class",
        "change race",
        "change sex",
        "malign mirrror",
        "lose_all_equipped_classes_or_levels"
      ]);
      tutorialDeckDragGuardBound = false;
      tutorialDragCleanupBound = false;
      tutorialSocketInterceptBound = false;
      tutorialDragActive = false;
      tutorialDraggingCardId = null;
      window.canDragCardFromTutorialDeck = canDragCardFromTutorialDeck;
    }
  });

  // src/tutorial-board-entry.js
  init_game();
  init_card_block();
  init__();

  // src/tutorial-board.js
  init__();
  init_card_block();
  init_game();
  init_tutorial_runtime();
  var TUTORIAL_CARD_IDS = /* @__PURE__ */ new Set([
    "door12",
    "door36",
    "door51",
    "door9",
    "door94",
    "treasure7",
    "treasure16",
    "treasure31",
    "treasure32",
    "treasure65",
    "treasure11",
    "treasure56",
    "door45"
  ]);
  var PLAYER_HAND = [
    "door51",
    "door94",
    "door36",
    "door12",
    "treasure65",
    "treasure32",
    "treasure7",
    "treasure16"
  ];
  var OPPONENT_HAND = ["treasure31", "treasure11", "treasure56", "door45"];
  var OPPONENT_EQUIP = ["door9"];
  var TUTORIAL_DOOR_DECK_STACK = ["door28", "door89"];
  var TUTORIAL_TREASURE_DECK_STACK = ["treasure71", "treasure72"];
  var TUTORIAL_DECK_RESERVED_DOOR_IDS = /* @__PURE__ */ new Set([
    ...TUTORIAL_CARD_IDS,
    ...TUTORIAL_DOOR_DECK_STACK
  ]);
  var TUTORIAL_DECK_RESERVED_TREASURE_IDS = /* @__PURE__ */ new Set([
    ...TUTORIAL_CARD_IDS,
    ...TUTORIAL_TREASURE_DECK_STACK
  ]);
  var ZONE_HINT_WATCH_IDS = ["zone2", "zone5", "zone3", "zone_monster", "zone_opponent"];
  var LAYOUT_ZONE_SELECTORS = [
    "#myhand",
    "#opponenthand",
    "#zone2",
    "#zone5",
    "#zone3",
    "#zone_monster",
    "#zone_doors",
    "#zone_treasure",
    "#zone_opponent"
  ];
  function scheduleAdjustAllZonesCardLayout() {
    LAYOUT_ZONE_SELECTORS.forEach((sel) => {
      adjustCardWidth(sel);
      adjustCardHeight(sel);
    });
  }
  var tutorialSideHintDismissedPermanently = false;
  var tutorialOpponentHintDismissedPermanently = false;
  var TUTORIAL_DECK_WATCH_IDS = ["zone_doors", "zone_treasure"];
  function zoneHasAnyCard(zoneId) {
    const zone = document.getElementById(zoneId);
    if (!zone) {
      return false;
    }
    return zone.querySelectorAll(":scope > .card").length > 0;
  }
  function zoneOpponentHasCurse() {
    const zone = document.getElementById("zone_opponent");
    if (!zone) {
      return false;
    }
    return Array.from(zone.querySelectorAll(":scope > .card")).some((card) => {
      const door96 = window.doors?.find((d) => d.name === card.id);
      return String(door96?.special || "").trim().toLowerCase() === "curse";
    });
  }
  function isTutorialTimerVisible() {
    const timer2 = document.getElementById("timer");
    if (!timer2) {
      return false;
    }
    return getComputedStyle(timer2).display !== "none";
  }
  function setHintVisible(hintId, visible) {
    const el = document.getElementById(hintId);
    if (!el) {
      return;
    }
    el.classList.toggle("is-hidden", !visible);
    el.setAttribute("aria-hidden", visible ? "false" : "true");
  }
  function updateTutorialHints() {
    if (!window.__TUTORIAL_BOARD) {
      return;
    }
    setHintVisible("tutorial-equip-hint", !zoneHasAnyCard("zone2"));
    if (!tutorialSideHintDismissedPermanently && zoneHasAnyCard("zone5")) {
      tutorialSideHintDismissedPermanently = true;
    }
    setHintVisible("tutorial-side-hint", !tutorialSideHintDismissedPermanently);
    if (!tutorialOpponentHintDismissedPermanently && zoneOpponentHasCurse()) {
      tutorialOpponentHintDismissedPermanently = true;
    }
    setHintVisible("tutorial-opponent-target-hint", !tutorialOpponentHintDismissedPermanently);
    const battleZonesEmpty = !zoneHasAnyCard("zone3") && !zoneHasAnyCard("zone_monster");
    setHintVisible("tutorial-battle-center-hint", battleZonesEmpty);
    const timerActive = isTutorialTimerVisible() && getMonsterBattleContext().hasMonster;
    setHintVisible("tutorial-timer-hint", timerActive);
    setHintVisible("tutorial-battle-highlight-hint", timerActive);
  }
  var tutorialHintObservers = null;
  function bindTutorialHintWatchers() {
    updateTutorialHints();
    if (tutorialHintObservers) {
      return;
    }
    tutorialHintObservers = [];
    const onZoneCardsChanged = () => {
      updateTutorialHints();
      refreshTutorialDeckTakeRules();
    };
    [...ZONE_HINT_WATCH_IDS, ...TUTORIAL_DECK_WATCH_IDS].forEach((zoneId) => {
      const zone = document.getElementById(zoneId);
      if (!zone) {
        return;
      }
      const observer = new MutationObserver(onZoneCardsChanged);
      observer.observe(zone, { childList: true });
      tutorialHintObservers.push(observer);
    });
    const timerEl = document.getElementById("timer");
    if (timerEl) {
      const timerObserver = new MutationObserver(() => updateTutorialHints());
      timerObserver.observe(timerEl, { attributes: true, attributeFilter: ["style", "class"] });
      tutorialHintObservers.push(timerObserver);
    }
  }
  function placeCardInZone(cardId, zoneId) {
    const zone = document.getElementById(zoneId);
    if (!zone) {
      return;
    }
    let card = document.getElementById(cardId);
    if (!card) {
      const def = window.doors.find((d) => d.name === cardId) || window.treasures.find((t) => t.name === cardId);
      if (!def) {
        return;
      }
      const holder = document.createElement("div");
      deckFilling([def], holder);
      card = holder.querySelector(".card");
    }
    if (card) {
      zone.appendChild(card);
    }
  }
  function appendTutorialDeckCard(def, zone) {
    if (!def || !zone) {
      return;
    }
    const holder = document.createElement("div");
    deckFilling([def], holder);
    const card = holder.querySelector(".card");
    if (card) {
      markTutorialDeckCard(card);
      zone.appendChild(card);
    }
  }
  function fillTutorialDecks() {
    const zoneDoors = document.getElementById("zone_doors");
    const zoneTreasure = document.getElementById("zone_treasure");
    if (!zoneDoors || !zoneTreasure) {
      return;
    }
    zoneDoors.innerHTML = "";
    zoneTreasure.innerHTML = "";
    const deckDoors = window.doors.filter((d) => !TUTORIAL_DECK_RESERVED_DOOR_IDS.has(d.name));
    const deckTreasures = window.treasures.filter((t) => !TUTORIAL_DECK_RESERVED_TREASURE_IDS.has(t.name));
    deckFilling(deckDoors, zoneDoors);
    TUTORIAL_DOOR_DECK_STACK.forEach((cardId) => {
      const def = window.doors.find((d) => d.name === cardId);
      appendTutorialDeckCard(def, zoneDoors);
    });
    deckFilling(deckTreasures, zoneTreasure);
    TUTORIAL_TREASURE_DECK_STACK.forEach((cardId) => {
      const def = window.treasures.find((t) => t.name === cardId);
      appendTutorialDeckCard(def, zoneTreasure);
    });
  }
  function dealTutorialHands() {
    TUTORIAL_CARD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.remove();
      }
    });
    PLAYER_HAND.forEach((id) => placeCardInZone(id, "myhand"));
    OPPONENT_HAND.forEach((id) => placeCardInZone(id, "opponenthand"));
    OPPONENT_EQUIP.forEach((id) => placeCardInZone(id, "zone_opponent"));
  }
  function setupTutorialScene() {
    tutorialSideHintDismissedPermanently = false;
    tutorialOpponentHintDismissedPermanently = false;
    resetTutorialDeckTakeLimits();
    configureTutorialGameState();
    ensureCardCatalogLoaded();
    fillTutorialDecks();
    dealTutorialHands();
    UpdatebackImgDoor();
    UpdatebackImgTreasure();
    UpdateZones();
    window.allCards = document.querySelectorAll(".card");
    scheduleAdjustAllZonesCardLayout();
    window.dispatchEvent(new Event("munchkin:zonesChanged"));
    bindTutorialHintWatchers();
    refreshTutorialDeckTakeRules();
    applyTutorialSeatDisplayNames();
    syncTutorialLevelsAfterCatalog();
    ensureTutorialDice();
    wireTutorialEndTurnButton();
  }
  window.addEventListener("munchkin:zonesChanged", () => {
    updateTutorialHints();
    refreshTutorialDeckTakeRules();
    syncTutorialLevelsAfterCatalog();
    ensureTutorialDice();
  });
  window.addEventListener("munchkin:tutorialTimerUiChanged", updateTutorialHints);

  // src/tutorial-board-entry.js
  function runTutorial() {
    setupTutorialScene();
    setTimeout(() => {
      Promise.resolve().then(() => (init_tutorial_runtime(), tutorial_runtime_exports)).then(({ configureTutorialGameState: configureTutorialGameState2 }) => {
        configureTutorialGameState2();
      });
    }, 1200);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runTutorial);
  } else {
    runTutorial();
  }
})();
//# sourceMappingURL=tutorial-board.bundle.js.map
