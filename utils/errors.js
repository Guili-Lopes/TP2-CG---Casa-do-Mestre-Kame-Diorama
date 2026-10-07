"use strict";

(() => {
    const state = {
        cssInjected: false,
        button: null,
        dialog: null,
        list: null,
        scriptUrl: null,
        errorCount: 0,
        pending: [],
    };

    const hookedCanvases = new WeakSet();

    // Captura a URL deste script para resolver o caminho do CSS.
    // (document.currentScript só é confiável durante o carregamento do arquivo)
    const current = document.currentScript;
    if (current && current.src) state.scriptUrl = new URL(current.src, window.location.href);

    function ensureCss() {
        if (state.cssInjected) return;
        state.cssInjected = true;

        const href = state.scriptUrl
            ? new URL("../styling/errors.css", state.scriptUrl).toString()
            : "../utils/styling/errors.css";

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
    }

    function ensureUi() {
        if (state.button && state.dialog && state.list) return;

        // botão flutuante (um único)
        const button = document.createElement("button");
        button.type = "button";
        button.className = "errors-fab";
        button.setAttribute("aria-haspopup", "dialog");
        button.title = "Ver erros";
        button.textContent = "!";

        // modal com <dialog>
        const dialog = document.createElement("dialog");
        dialog.className = "errors-dialog";

        const header = document.createElement("header");
        header.className = "errors-dialog__header";

        const title = document.createElement("h2");
        title.className = "errors-dialog__title";
        title.textContent = "Erros";

        const close = document.createElement("button");
        close.type = "button";
        close.className = "errors-dialog__close";
        close.textContent = "Fechar";

        header.appendChild(title);
        header.appendChild(close);

        const body = document.createElement("div");
        body.className = "errors-dialog__body";

        const list = document.createElement("ol");
        list.className = "errors-dialog__list";

        body.appendChild(list);
        dialog.appendChild(header);
        dialog.appendChild(body);

        button.addEventListener("click", () => {
            if (typeof dialog.showModal === "function") dialog.showModal();
        });

        close.addEventListener("click", () => dialog.close());

        // clicar no backdrop fecha (comportamento comum de modal)
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) dialog.close();
        });

        const mount = document.body || document.documentElement;
        mount.appendChild(button);
        mount.appendChild(dialog);

        state.button = button;
        state.dialog = dialog;
        state.list = list;

        // se algum erro aconteceu antes de conseguirmos montar a UI, mostrar
        if (state.pending.length > 0) {
            for (const item of state.pending) {
                const li = document.createElement("li");
                li.className = "errors-dialog__item";

                const pre = document.createElement("pre");
                pre.className = "errors-dialog__pre";
                pre.textContent = item;

                li.appendChild(pre);
                state.list.appendChild(li);
            }
            state.pending.length = 0;
        }
    }

    function formatError(err, extra) {
        const time = new Date().toLocaleTimeString();
        const message = (err && err.message) ? err.message : String(err);
        const stack = (err && err.stack) ? String(err.stack) : "";
        const where = extra ? String(extra) : "";

        const parts = [`[${time}] ${message}`];
        if (where) parts.push(where);
        if (stack) parts.push(stack);
        return parts.join("\n");
    }

    function appendError(err, extra) {
        console.error("Erro:", err);

        ensureCss();
        ensureUi();

        state.errorCount += 1;
        state.button.title = `Ver erros (${state.errorCount})`;

        const text = formatError(err, extra);
        if (!state.list) {
            state.pending.push(text);
            return;
        }

        const li = document.createElement("li");
        li.className = "errors-dialog__item";

        const pre = document.createElement("pre");
        pre.className = "errors-dialog__pre";
        pre.textContent = text;

        li.appendChild(pre);
        state.list.appendChild(li);
    }

    window.addEventListener("error", (event) => {
        const err = event.error || new Error(event.message);
        const where = (event && event.filename)
            ? `${event.filename}:${event.lineno || 0}:${event.colno || 0}`
            : "";
        appendError(err, where);
    });

    window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        const err = (reason instanceof Error) ? reason : new Error(String(reason ?? "Rejeição de promessa não tratada"));
        appendError(err, "unhandledrejection");
    });

    function attachWebglContextLostHandlers() {
        const canvases = document.querySelectorAll("canvas");
        for (const canvas of canvases) {
            if (hookedCanvases.has(canvas)) continue;
            hookedCanvases.add(canvas);

            canvas.addEventListener(
                "webglcontextlost",
                (event) => {
                    // Recomendado: previne o comportamento padrão (alguns browsers podem tentar recarregar a página)
                    if (event && typeof event.preventDefault === "function") event.preventDefault();

                    const id = canvas.id ? `#${canvas.id}` : "";
                    const cls = canvas.className ? `.${String(canvas.className).trim().replace(/\s+/g, ".")}` : "";
                    const info = `webglcontextlost ${id}${cls} (${canvas.width}x${canvas.height})`;
                    appendError(new Error("WebGL context lost"), info);
                },
                { passive: false }
            );
        }
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", attachWebglContextLostHandlers, { once: true });
    } else {
        attachWebglContextLostHandlers();
    }
})();