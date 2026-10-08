/* Gutter Cleaning pricing calculator and gutter quote-form estimate.
   Loaded only on the /gutter-cleaning/ pages, after config.js.

   Published launch pricing (keep in sync with the visible pricing copy and FAQs):
     First-story gutters ........ $1.00 per linear foot
     Second-story gutters ....... $1.50 per linear foot
     Minimum service charge ..... $150 (applies to the first- + second-story gutter charge)
     Gutter guards removed and reinstalled ... +$0.50 per linear foot affected (added on top)

   Footage is rounded to the nearest whole foot everywhere. */
(function () {
    "use strict";

    var PRICING = {
        firstStoryPerFt: 1.00,
        secondStoryPerFt: 1.50,
        guardPerFt: 0.50,
        minimum: 150,
        maxFeet: 2000
    };
    var TIMES = "\u00d7";
    var GUARD_CONFIRM_NOTE = "We'll confirm whether any gutter-guard removal is required before service.";
    var GUARD_MISSING_NOTE = "Enter the linear feet with gutter guards to include the gutter-guard charge.";
    var LABELS = {
        first: "first-story gutter length",
        second: "second-story gutter length",
        guard: "gutter-guard length"
    };

    function money(n) {
        var cents = Math.round(n * 100);
        var whole = cents % 100 === 0;
        return "$" + (cents / 100).toLocaleString("en-US", {
            minimumFractionDigits: whole ? 0 : 2,
            maximumFractionDigits: whole ? 0 : 2
        });
    }

    function rate(n) {
        return "$" + n.toFixed(2);
    }

    function feet(n) {
        return n.toLocaleString("en-US") + " ft";
    }

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // Reads a footage input. Blank and 0 are both treated as "nothing entered".
    function readFeet(input, label) {
        var result = { state: "blank", feet: 0, label: label };
        if (!input) return result;
        if (input.validity && input.validity.badInput) {
            result.state = "invalid";
            return result;
        }
        var raw = String(input.value || "").trim();
        if (raw === "") return result;
        var n = Number(raw);
        if (!isFinite(n)) {
            result.state = "invalid";
        } else if (n < 0) {
            result.state = "negative";
        } else {
            n = Math.round(n);
            result.feet = n;
            result.state = n > PRICING.maxFeet ? "toolarge" : "ok";
        }
        return result;
    }

    function feetError(r) {
        if (r.state === "invalid") return "Please enter the " + r.label + " as a number of feet.";
        if (r.state === "negative") return capitalize(r.label) + " can't be a negative number.";
        if (r.state === "toolarge") {
            return capitalize(r.label) + " looks too large (more than " + feet(PRICING.maxFeet) +
                "). Please check the measurement, or call (910) 420-8159 for very large properties.";
        }
        return "";
    }

    function compute(first, second, guards, guard) {
        var res = { status: "ok", errors: [], notes: [], lines: [], total: 0, f: 0, s: 0, g: 0, guardTooLong: false };

        [first, second].forEach(function (r) {
            var e = feetError(r);
            if (e) res.errors.push(e);
        });
        if (guards === "Yes") {
            var ge = feetError(guard);
            if (ge) res.errors.push(ge);
        }
        if (res.errors.length) {
            res.status = "error";
            return res;
        }

        var f = first.feet;
        var s = second.feet;
        var totalFeet = f + s;
        if (totalFeet === 0) {
            res.status = "empty";
            return res;
        }

        var g = 0;
        if (guards === "Yes") {
            if (guard.feet === 0) {
                res.notes.push(GUARD_MISSING_NOTE);
            } else if (guard.feet > totalFeet) {
                res.status = "error";
                res.guardTooLong = true;
                res.errors.push("Gutter-guard length (" + feet(guard.feet) + ") can't be more than your total gutter length (" +
                    feet(totalFeet) + "). Please correct the footage.");
                return res;
            } else {
                g = guard.feet;
            }
        } else if (guards === "Not sure") {
            res.notes.push(GUARD_CONFIRM_NOTE);
        }

        var firstAmt = f * PRICING.firstStoryPerFt;
        var secondAmt = s * PRICING.secondStoryPerFt;
        var guardAmt = g * PRICING.guardPerFt;
        var service = firstAmt + secondAmt;

        if (f > 0) {
            res.lines.push({ label: "First-story gutters: " + feet(f) + " " + TIMES + " " + rate(PRICING.firstStoryPerFt), amount: money(firstAmt) });
        }
        if (s > 0) {
            res.lines.push({ label: "Second-story gutters: " + feet(s) + " " + TIMES + " " + rate(PRICING.secondStoryPerFt), amount: money(secondAmt) });
        }
        res.minimumApplied = service < PRICING.minimum;
        if (res.minimumApplied) {
            // A subtotal line only adds information when both stories were entered.
            if (f > 0 && s > 0) res.lines.push({ label: "Cleaning subtotal", amount: money(service) });
            res.lines.push({ label: "Minimum service charge", amount: money(PRICING.minimum), cls: "gp-min" });
        }
        if (g > 0) {
            res.lines.push({ label: "Gutter guards: " + feet(g) + " " + TIMES + " " + rate(PRICING.guardPerFt), amount: "+" + money(guardAmt) });
        }

        res.f = f;
        res.s = s;
        res.g = g;
        res.service = service;
        res.total = Math.max(service, PRICING.minimum) + guardAmt;
        return res;
    }

    // Plain-text estimate recorded with the lead (shown to the customer in the form).
    function summarize(res, guards) {
        if (res.status !== "ok") return "";
        var parts = [];
        if (res.f) parts.push(res.f + " ft first story x " + rate(PRICING.firstStoryPerFt) + " = " + money(res.f * PRICING.firstStoryPerFt));
        if (res.s) parts.push(res.s + " ft second story x " + rate(PRICING.secondStoryPerFt) + " = " + money(res.s * PRICING.secondStoryPerFt));
        if (res.minimumApplied) parts.push("calculated " + money(res.service) + ", " + money(PRICING.minimum) + " minimum service charge applied");
        if (res.g) parts.push(res.g + " ft gutter guards x " + rate(PRICING.guardPerFt) + " = " + money(res.g * PRICING.guardPerFt));
        var text = money(res.total) + " estimated total (" + parts.join("; ") + ")";
        if (guards === "Not sure") text += ". Gutter guards: not sure, to be confirmed before service";
        if (guards === "Yes" && !res.g) text += ". Gutter guards: yes, footage not entered";
        return text + ".";
    }

    function blockInvalidKeys(input) {
        if (!input) return;
        input.addEventListener("keydown", function (e) {
            if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") e.preventDefault();
        });
    }

    // errorId: optional id of the element holding the error text, linked via aria-describedby while invalid.
    function setInvalid(input, bad, errorId) {
        if (!input) return;
        if (bad) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
        if (!errorId) return;
        if (input.dataset.gpDescribedby === undefined) input.dataset.gpDescribedby = input.getAttribute("aria-describedby") || "";
        var ids = input.dataset.gpDescribedby ? [input.dataset.gpDescribedby] : [];
        if (bad) ids.push(errorId);
        if (ids.length) input.setAttribute("aria-describedby", ids.join(" "));
        else input.removeAttribute("aria-describedby");
    }

    function clear(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    function addParagraph(parent, text) {
        var p = document.createElement("p");
        p.textContent = text;
        parent.appendChild(p);
    }

    /* ---------- Gutter quote form (all five gutter pages) ---------- */
    function initForm(form) {
        var first = form.querySelector("[data-gp='first']");
        if (!first) return null;
        var second = form.querySelector("[data-gp='second']");
        var guards = form.querySelector("[data-gp='guards']");
        var guardWrap = form.querySelector("[data-gp='guard-wrap']");
        var guardFt = form.querySelector("[data-gp='guard-ft']");
        var msg = form.querySelector("[data-gp='form-msg']");
        var estimate = form.querySelector("[data-gp='estimate']");
        var service = form.querySelector("select[name='service']");

        [first, second, guardFt].forEach(blockInvalidKeys);
        if (!msg.id) msg.id = "gutter-form-msg";

        function isGutter() {
            return !service || service.value === "Gutter Cleaning";
        }

        function update() {
            var g = guards.value;
            var showGuard = g === "Yes";
            guardWrap.hidden = !showGuard;
            // Hidden guard footage never submits (config.js disables all gutter fields for other services).
            guardFt.disabled = !isGutter() || !showGuard;

            var rf = readFeet(first, LABELS.first);
            var rs = readFeet(second, LABELS.second);
            var rg = readFeet(guardFt, LABELS.guard);
            var res = compute(rf, rs, g, rg);

            first.setCustomValidity(feetError(rf));
            second.setCustomValidity(feetError(rs));
            var guardMsg = showGuard ? (feetError(rg) || (res.guardTooLong ? res.errors[0] : "")) : "";
            guardFt.setCustomValidity(guardMsg);
            setInvalid(first, !!feetError(rf), msg.id);
            setInvalid(second, !!feetError(rs), msg.id);
            setInvalid(guardFt, !!guardMsg, msg.id);

            if (res.status === "error") {
                msg.textContent = res.errors.join(" ");
                msg.className = "gp-form-msg";
                msg.hidden = false;
            } else if (res.notes.length) {
                msg.textContent = res.notes.join(" ");
                msg.className = "gp-form-msg is-note";
                msg.hidden = false;
            } else {
                msg.textContent = "";
                msg.hidden = true;
            }

            estimate.value = summarize(res, g);
            estimate.placeholder = res.status === "error"
                ? "Correct the footage above to see your estimate"
                : "Enter your gutter length above to see your estimate";
        }

        [first, second, guardFt].forEach(function (el) {
            el.addEventListener("input", update);
        });
        guards.addEventListener("change", update);
        if (service) service.addEventListener("change", update);
        update();

        return {
            form: form,
            update: update,
            setValues: function (values) {
                first.value = values.first;
                second.value = values.second;
                guards.value = values.guards;
                guardFt.value = values.guardFt;
                update();
            }
        };
    }

    function goToForm(ctrl, helpMessage) {
        var form = ctrl.form;
        var service = form.querySelector("select[name='service']");
        if (service && service.value !== "Gutter Cleaning") {
            service.value = "Gutter Cleaning";
            service.dispatchEvent(new Event("change", { bubbles: true }));
        }
        var focusField = form.querySelector("input[name='name']");
        if (helpMessage) {
            var message = form.querySelector("textarea[name='message']");
            if (message) {
                var current = message.value;
                // Never erase what the customer already typed; add the request once.
                if (current.indexOf(helpMessage.trim()) === -1) {
                    message.value = current.trim() ? current.replace(/\s+$/, "") + "\n\n" + helpMessage : helpMessage;
                }
                focusField = message;
            }
        }
        var target = document.getElementById("contact") || form;
        var messageField = form.querySelector("textarea[name='message']");
        if (focusField) {
            focusField.focus({ preventScroll: true });
            if (focusField === messageField) {
                var end = focusField.value.length;
                focusField.setSelectionRange(end, end);
                focusField.scrollIntoView({ block: "center" });
                return;
            }
        }
        target.scrollIntoView({ block: "start" });
    }

    /* ---------- Calculator (/gutter-cleaning/ only) ---------- */
    function initCalculator(calc, formCtrl) {
        var first = calc.querySelector("#calc-first");
        var second = calc.querySelector("#calc-second");
        var guardFt = calc.querySelector("#calc-guard-ft");
        var guardWrap = calc.querySelector("#calc-guard-wrap");
        var radios = Array.prototype.slice.call(calc.querySelectorAll("input[name='calc-guards']"));
        var totalEl = calc.querySelector("#calc-total");
        var statusEl = calc.querySelector("#calc-status");
        var errorsEl = calc.querySelector("#calc-errors");
        var notesEl = calc.querySelector("#calc-notes");
        var breakdownEl = calc.querySelector("#calc-breakdown");
        var liveEl = calc.querySelector("#calc-live");
        var requestBtn = calc.querySelector("#calc-request");
        var minNoteEl = calc.querySelector("#calc-min-note");
        var lastLive = "";
        var latest = null;

        [first, second, guardFt].forEach(blockInvalidKeys);

        function guardsValue() {
            var v = "No";
            radios.forEach(function (r) { if (r.checked) v = r.value; });
            return v;
        }

        function render(fromUser) {
            var g = guardsValue();
            guardWrap.hidden = g !== "Yes";

            var rf = readFeet(first, LABELS.first);
            var rs = readFeet(second, LABELS.second);
            var rg = readFeet(guardFt, LABELS.guard);
            var res = compute(rf, rs, g, rg);
            latest = { res: res, g: g, rf: rf, rs: rs, rg: rg };

            setInvalid(first, !!feetError(rf), "calc-errors");
            setInvalid(second, !!feetError(rs), "calc-errors");
            setInvalid(guardFt, g === "Yes" && (!!feetError(rg) || res.guardTooLong), "calc-errors");

            clear(errorsEl);
            res.errors.forEach(function (e) { addParagraph(errorsEl, "Please correct: " + e); });
            errorsEl.hidden = res.errors.length === 0;

            clear(notesEl);
            res.notes.forEach(function (n) { addParagraph(notesEl, n); });
            notesEl.hidden = res.notes.length === 0;

            clear(breakdownEl);
            if (minNoteEl) minNoteEl.hidden = !(res.status === "ok" && res.minimumApplied);
            var live;
            if (res.status === "ok") {
                totalEl.textContent = money(res.total);
                totalEl.hidden = false;
                statusEl.hidden = true;
                res.lines.forEach(function (line) {
                    var li = document.createElement("li");
                    if (line.cls) li.className = line.cls;
                    var a = document.createElement("span");
                    a.textContent = line.label;
                    var b = document.createElement("span");
                    b.textContent = line.amount;
                    li.appendChild(a);
                    li.appendChild(b);
                    breakdownEl.appendChild(li);
                });
                var totalLi = document.createElement("li");
                totalLi.className = "gp-total-line";
                var t1 = document.createElement("span");
                t1.textContent = "Estimated total";
                var t2 = document.createElement("span");
                t2.textContent = money(res.total);
                totalLi.appendChild(t1);
                totalLi.appendChild(t2);
                breakdownEl.appendChild(totalLi);
                breakdownEl.hidden = false;
                requestBtn.hidden = false;
                live = "Estimated gutter cleaning price: " + money(res.total) + "." +
                    (res.minimumApplied ? " Includes the " + money(PRICING.minimum) + " minimum service charge." : "") +
                    (res.notes.length ? " " + res.notes.join(" ") : "");
            } else {
                totalEl.textContent = "";
                totalEl.hidden = true;
                breakdownEl.hidden = true;
                requestBtn.hidden = true;
                statusEl.hidden = false;
                statusEl.textContent = res.status === "error"
                    ? "Correct the footage to see your price."
                    : "Enter your gutter length to calculate a price.";
                live = res.status === "error" ? res.errors.join(" ") : statusEl.textContent;
            }
            if (live !== lastLive) {
                liveEl.textContent = live;
                lastLive = live;
            }

            if (fromUser && formCtrl) syncToForm();
        }

        function valueFor(r, input) {
            if (r.state === "ok") return r.feet > 0 ? String(r.feet) : "";
            if (r.state === "blank") return "";
            return input.value;
        }

        function syncToForm() {
            if (!latest || !formCtrl) return;
            formCtrl.setValues({
                first: valueFor(latest.rf, first),
                second: valueFor(latest.rs, second),
                guards: latest.g,
                guardFt: latest.g === "Yes" ? valueFor(latest.rg, guardFt) : ""
            });
        }

        [first, second, guardFt].forEach(function (el) {
            el.addEventListener("input", function () { render(true); });
        });
        radios.forEach(function (r) {
            r.addEventListener("change", function () { render(true); });
        });

        if (formCtrl) {
            requestBtn.addEventListener("click", function (e) {
                e.preventDefault();
                syncToForm();
                goToForm(formCtrl, "");
            });
        }

        render(false);
    }

    document.addEventListener("DOMContentLoaded", function () {
        var controllers = [];
        document.querySelectorAll("form.contact-form").forEach(function (form) {
            var ctrl = initForm(form);
            if (ctrl) controllers.push(ctrl);
        });
        var mainForm = controllers.length ? controllers[0] : null;

        var calc = document.querySelector("[data-gutter-calculator]");
        if (calc) initCalculator(calc, mainForm);

        document.querySelectorAll("[data-gp-help]").forEach(function (link) {
            if (!mainForm) return;
            link.addEventListener("click", function (e) {
                e.preventDefault();
                goToForm(mainForm, "Please help me estimate my gutter length. Property address: ");
            });
        });

        // "How to estimate it" link: open the measurement guide before jumping to it.
        document.querySelectorAll("[data-gp-open-measure]").forEach(function (link) {
            link.addEventListener("click", function () {
                var guide = document.getElementById("gutter-measure-help");
                if (guide) guide.open = true;
            });
        });
    });
})();
