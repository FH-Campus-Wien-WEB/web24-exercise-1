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
      throw new Error('Not implemented: The matched() method must be overridden by subclasses.')
    }
  }
  
  export class ValueChecker extends AbstractChecker {
    constructor(minValue, maxValue, unit = 'px') {
      super(new RegExp(`(\\d+)(${unit})`))
      this.expectedUnit = unit
      this.minValue = minValue
      this.maxValue = maxValue
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
      expect(this.value, `${prefix} is expected to be between ${this.minValue} and ${this.maxValue} ${this.expectedUnit}.`)
        .to.be.within(this.minValue, this.maxValue)
    }
  
    toString() {
      return `${this.ordinal ? this.ordinal + ' ' : ''}value must be within ${this.minValue} and ${this.maxValue} ${this.expectedUnit}`
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
      return "Border style must be specified, e.g. solid, dotted, etc."
    }
  }
  
  const COLOR_KEYWORDS = [
    'black', 'silver', 'gray', 'white', 'maroon', 'red', 'purple', 'fuchsia', 'green',
    'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua',
    'orange',
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
    'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'whitesmoke', 'yellowgreen'
  ]
  
  const COLOR_REGEXP = new RegExp(
    '(' +
      COLOR_KEYWORDS.join('|') +
      '|#([0-9a-fA-F]{3}){1,2})|' +
      'rgb\\((?:(?:\\s*\\d+\\s*,){2}\\s*\\d+|' +
      '(?:\\s*\\d+(?:\\.\\d+)?%\\s*,){2}\\s*\\d+(?:\\.\\d+)?%)\\s*\\)|' +
      'rgba\\((?:(?:\\s*\\d+\\s*,){3}|' +
      '(?:\\s*\\d+(?:\\.\\d+)?%\\s*,){3})\\s*\\d+(?:\\.\\d+)?\\s*\\)'
  )
  
  export class ColorChecker extends AbstractChecker {
    constructor() {
      super(COLOR_REGEXP)
    }
  
    matched(result) {
      this.color = result[1]
    }
  
    toString() {
      return "Color must be specified, e.g. grey, #aa0, #aa3300, etc."
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
  
      cy.fail(`Expected to find a CSS rule with selector "${selector}", but none was found.`)
    }
  
    get(property) {
      const value = this.styleMap.get(property)
      return value ? value.toString() : ''
    }
  
    exists(property) {
      expect(this.styleMap.has(property), `${this.prefix(property)} should exist in the CSS rule.`).to.eq(true)
      return this
    }
  
    prefix(property, count = 0) {
      return `${count > 1 ? "Compound " : ""}CSS property "${property}" of selector "${this.selector}" is expected`
    }
  
    eq(property, value) {
      this.exists(property)
      expect(this.get(property), `${this.prefix(property)} to equal "${value}".`).to.eq(value)
      return this
    }
  
    compound() {
      const property = arguments[0]
      let value = this.get(property)
  
      const checkers = []
      for (let j = 1; j < arguments.length; j++) {
        checkers.unshift(arguments[j])
      }
  
      const matched = []
      for (let j = checkers.length - 1; j >= 0; j--) {
        const match = checkers[j].from(value)
        if (match) {
          value = value.replace(match[0], '')
          matched.push(checkers.splice(j, 1)[0])
        }
      }
  
      const expectedChecks = arguments.length - 1
  
      const message = `${this.prefix(property, expectedChecks)} to pass ${expectedChecks} check(s), but only ${matched.length} passed. Failing checks: ${checkers.join(', ')}. This indicates that either the CSS property is missing or its value is invalid.`
      
      expect(matched.length, message).to.eq(expectedChecks)
      
      matched.forEach(checker => {
        checker.check(this.prefix(property))
      })
  
      return this
    }
  }
  
