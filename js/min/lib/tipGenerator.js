export function resolveNode(k, rng = Math.random) {
    if (!Array.isArray(k))
        return String(k);
    const z = Math.floor(rng() * k.length);
    const kz = k[z];
    if (!Array.isArray(kz))
        return String(kz);
    let out = "";
    for (const a of kz) {
        if (!Array.isArray(a)) {
            out += String(a);
        }
        else {
            out += String(a[Math.floor(rng() * a.length)]);
        }
    }
    return out;
}
export function generateTip(sexActs, rng = Math.random) {
    const categoryIndex = Math.floor(rng() * sexActs.length);
    const category = sexActs[categoryIndex];
    let result = "";
    for (const k of category) {
        result += resolveNode(k, rng);
    }
    return result;
}
//# sourceMappingURL=tipGenerator.js.map