export function addCommas(intNum) {
    return (intNum + "").replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}
export function randomFrom(array) {
    return array[Math.floor(Math.random() * array.length)];
}
export function sendEvent(c, a, l, v) {
    if (v) {
        ga("send", "event", { eventCategory: c, eventAction: a, eventLabel: l, eventValue: v });
    }
    else if (l) {
        ga("send", "event", { eventCategory: c, eventAction: a, eventLabel: l });
    }
    else {
        ga("send", "event", { eventCategory: c, eventAction: a });
    }
}
//# sourceMappingURL=_functions.js.map