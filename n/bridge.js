/*
 * Lógica de la página puente del QR de referido (T68, Requirement 24.4 y 24.9).
 * JavaScript plano de navegador (ES5, sin módulos ni dependencias) para que corra
 * en cualquier teléfono, incluidos los navegadores internos de WhatsApp o Instagram.
 * Se prueba en `scripts/bridge-page.test.ts`.
 *
 * El enlace del QR es `<sitio>/n/?c=<código>` y, fuera de producción,
 * `&e=<ambiente>` (lo arma la app, `src/utils/referralLink.ts`). Acá solo se
 * validan esos dos datos y se arma el enlace que abre la app: su esquema es
 * `tuoficio` en producción y `tuoficio-<ambiente>` en los demás.
 */
(function (root) {
  "use strict";

  // Mismo alfabeto que genera `get_my_referral_code`: A-Z sin I ni O, y 2-9.
  var CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;
  // Un ambiente es una palabra corta (`preview`, `development`): nunca un esquema arbitrario.
  var ENV_PATTERN = /^[a-z0-9-]{1,20}$/;

  function readParam(search, name) {
    var query = String(search || "").replace(/^\?/, "");
    var pairs = query.split("&");
    for (var i = 0; i < pairs.length; i++) {
      var eq = pairs[i].indexOf("=");
      var key = eq === -1 ? pairs[i] : pairs[i].slice(0, eq);
      if (key === name) {
        var raw = eq === -1 ? "" : pairs[i].slice(eq + 1);
        try {
          return decodeURIComponent(raw.replace(/\+/g, " "));
        } catch (error) {
          return "";
        }
      }
    }
    return "";
  }

  function normalizeCode(raw) {
    var code = String(raw || "").replace(/\s/g, "").toUpperCase();
    return CODE_PATTERN.test(code) ? code : null;
  }

  function readEnvironment(search) {
    var env = readParam(search, "e").toLowerCase();
    return ENV_PATTERN.test(env) && env !== "production" ? env : null;
  }

  function safeDownloadUrl(url) {
    return typeof url === "string" && /^https?:\/\/\S+$/i.test(url) ? url : null;
  }

  /**
   * `search` es `location.search`. Devuelve `{ valid, code, openUrl, downloadUrl }`;
   * sin un código válido no arma ningún enlace.
   */
  function buildBridge(search, config) {
    var code = normalizeCode(readParam(search, "c"));
    var downloadUrl = safeDownloadUrl(config && config.downloadUrl);
    if (!code) {
      return { valid: false, code: null, openUrl: null, downloadUrl: downloadUrl };
    }
    var env = readEnvironment(search);
    var scheme = env ? "tuoficio-" + env : "tuoficio";
    return { valid: true, code: code, openUrl: scheme + "://n/" + code, downloadUrl: downloadUrl };
  }

  var api = { buildBridge: buildBridge };
  root.TuOficioBridge = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : this);
