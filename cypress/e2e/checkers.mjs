class AbstractChecker {
    constructor(expression) {
        this.expression = expression
    }

    from(value) {
        const result = value.match(this.expression)
        if (result) {
            this.matched(result)
        }
        return result
    }

    check(prefix) {
        return true
    }

    matched(result) {
        throw new Error('Not implemeted.')
    }
}

export class ValueChecker extends AbstractChecker {
    constructor(minValue, maxValue, unit = 'px') {
        super(new RegExp('(\\d+)(' + unit + ')'))
        this.expectedUnit = unit
        this.minValue = minValue;
        this.maxValue = maxValue;
    }

    first() {
        this.ordinal = "first"
        return this
    }

    second() {
        this.ordinal = "second"
        return this
    }

    matched(result) {
        this.value = +result[1]
        this.unit = result[2]
    }

    check(prefix) {
        expect(this.value, prefix + ' is expected to be within ' + this.minValue + ' and ' +  this.maxValue)
            .to.be.within(this.minValue, this.maxValue)
    }

    toString() {
        return (this.ordinal ? this.ordinal : "") + " value must be within " + this.minValue + " and " + this.maxValue
            + ", its unit must be '" + this.expectedUnit + "'"
    }
}

const BORDER_STYLE_REGEXP = new RegExp('(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)')

export class BorderStyleChecker extends AbstractChecker {
    constructor() {
        super(BORDER_STYLE_REGEXP)
    }

    matched(result) {
        this.style = result[1]
    }

    toString() {
        return "border style must be given, e.g. solid, dotted, ..."
    }
}

const COLOR_KEYWORDS = [
    /* CSS Level 1 */
    'black', 'silver', 'gray', 'white', 'maroon', 'red', 'purple', 'fuchsia', 'green',
    'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua',
    /* CSS Level 2 */
    'orange',
    /* CSS Level 3 */
    'aliceblue', 'antiquewhite', 'aquamarine', 'azure', 'beige', 'bisque', 'blanchedalmond',
    'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral',
    'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod',
    'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
    'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue',
    'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink',
    'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite',
    'forestgreen', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'greenyellow', 'grey',
    'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
    'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
    'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink',
    'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey',
    'lightsteelblue', 'lightyellow', 'limegreen', 'linen', 'magenta', 'mediumaquamarine',
    'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
    'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream',
    'mistyrose', 'moccasin', 'navajowhite', 'oldlace', 'olivedrab', 'orangered', 'orchid',
    'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip',
    'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'rosybrown', 'royalblue',
    'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'skyblue',
    'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan',
    'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'whitesmoke', 'yellowgreen']

const COLOR_REGEXP = new RegExp('(' + COLOR_KEYWORDS.join('|') + '|#([0-9a-fA-F]{3}){1,2})|'
    + 'rgb\\((?:(?:\\s*\\d+\\s*,){2}\\s*\\d+|' +
    '(?:\\s*\\d+(?:\\.\\d+)?%\\s*,){2}\\s*\\d+(?:\\.\\d+)?%)\\s*\\)|' +
    'rgba\\((?:(?:\\s*\\d+\\s*,){3}|' +
    '(?:\\s*\\d+(?:\\.\\d+)?%\\s*,){3})\\s*\\d+(?:\\.\\d+)?\\s*\\)')

export class ColorChecker extends AbstractChecker {
    constructor() {
        super(COLOR_REGEXP)
    }

    matched(result) {
        this.color = result[1]
    }

    toString() {
        return "color must be specified, e.g. grey, #aa0, #aa3300, ..."
    }
}

export class StyleChecker {

    constructor(selector) {

        const document = cy.state('document')
        const rules = document.styleSheets[0].rules

        for (let i = 0; i < rules.length; i++) {
            if (rules[i].selectorText === selector) {
                this.selector = selector
                this.styleMap = rules[i].styleMap
                return
            }
        }

        cy.fail("Expected to find a CSS rule with selector '" + selector + "'")
    }
    
    get(property) {
        const value = this.styleMap.get(property)
        return value ? value.toString() : ''
    }

    exists(property) {
        expect(this.styleMap.has(property), this.prefix(property) + ' to exist').to.eq(true)
        return this
    }

    prefix(property, count = 0) {
        return (count > 1 ? "Compound " : "") + "CSS property '" 
            + property + "' of selector '" + this.selector + "' is expected"
    }

    eq(property, value) {
        this.exists(property)
        expect(this.get(property), this.prefix(property) + ' to be ' + value).to.eq(value)
        return this
    }

    compound() {
        const property = arguments[0]
        let value = this.get(property)

        const checkers = []
        for (let j = 1; j < arguments.length; j++) {
            checkers.unshift(arguments[j]);
        }

        const matched = []
        for (let j = checkers.length - 1; j >= 0; j--) {
            const match = checkers[j].from(value)
            if (match) {
                value = value.replace(match[0], '')
                matched.push(checkers.splice(j, 1)[0])
            }
        }

        const checkCount = arguments.length - 1

        const checks = count => count > 1 ? "checks" : "check"
        const is = count => count > 1 ? "are" : "is"
        const number = count => count === 0 ? "none" : ("only " + number)

        const message = this.prefix(property, checkCount) 
            + " to pass " + checkCount + " " + checks(checkCount) + ", but passed " 
            + number(matched.length) + " of them." + " Here " + is(checkCount)
            + " the failing " + checks(checkCount) + ": " + checkers.join(', ') 
            + ". This indicates that you either did not specify the CSS property or that the value"
            + " you specified is not valid"

        expect(matched.length, message).to.eq(checkCount)
        
        matched.forEach(checker => {
            checker.check(this.prefix(property))
        })

        return this
    }

}

