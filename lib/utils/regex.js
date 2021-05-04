module.exports = {
    invisChars: new RegExp(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu),
    racism: new RegExp(/(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/),
    accents: new RegExp(/[\u0300-\u036f]/g),
    punctuation: new RegExp(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g)
}