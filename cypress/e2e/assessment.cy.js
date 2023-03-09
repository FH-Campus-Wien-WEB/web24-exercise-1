import { StyleChecker, ColorChecker, BorderStyleChecker, ValueChecker } from "./checkers.mjs";

describe('Testing API response', () => {

  it('Data endpoint returns correctly formatted data', () => {

    function checkArray(array, name, type) {
      expect(array, 'Movie property "' + name + '" expected to be an Array').to.be.an('array')
      array.forEach(item => expect(item, 'Each item contained in Movie property "' + name + '" is expected to be of type ' + type).to.be.a(type))
    }
  
    function isValidURL(url) {
      try {
        new URL(url)
        return true
      } catch (_) {
        return false
      }
    }

    cy.request('/movies').as('movies')
    cy.get('@movies').should((response) => {
      const dateRegex = new RegExp("^\\d{4}-\\d{2}-\\d{2}$")

      expect(response.body, 'Response expected to be an Array').to.be.a('array')
      expect(response.body.length, 'Response Array expected to contain at least 3 Movies').to.be.at.least(3)

      response.body.forEach(movie => {
        expect(movie, 'Movie expected to have 11 pre-defined keys')
          .to.have.keys('Title', 'Released', 'Runtime', 'Genres', 'Directors', 'Writers', 'Actors', 'Plot', 'Poster', 'Metascore', 'imdbRating')
        expect(movie.Title).to.be.a('string')
        expect(movie.Released, 'Movie property "Released" is expected to be a ISO 8601 formatted date string').to.match(dateRegex)

        expect(movie.Runtime, 'Movie property "Runtime" is expected to be a number greater or equal to 1').to.be.a('number')
          .and.to.be.at.least(1)
        
        const stringArrayNames = ['Genres', 'Directors', 'Writers', 'Actors']
        stringArrayNames.forEach(name => checkArray(movie[name], name, 'string'))
        
        expect(movie.Plot).to.be.a('string')
        expect(movie.Poster).to.be.a('string')
        expect(isValidURL(movie.Poster), 'Movie property "Poster" is expected to be a URL').to.be.eq(true)

        expect(movie.Metascore, 'Movie property "Metascore" is expected to be a number greater than 0 and less or equal to 100').to.be.a('number')
          .and.to.be.greaterThan(0)
          .and.to.be.at.most(100)
        expect(movie.imdbRating, 'Movie property "imdbRating" is expected to be a number greater than 0 and less or equal to 10').to.be.a('number')
          .and.to.be.greaterThan(0)
          .and.to.be.at.most(10)
      })
    })
  })

  function toChildTagNames(element) {
    return Array.from(element.children).map(e => e.tagName)
  }

  function checkLabeledList(label, element, index, elements) {
    expect(element.children[index-1]).to.contain(label)
    checkList(element, index, elements, 'UL', 'LI')
  }

  function checkList(element, index, elements, parentTag = 'P', childTag = 'SPAN') {
    const child = element.children[index]
    expect(child.tagName).to.be.eq(parentTag)
    elements.forEach(e => expect(child.textContent).to.contain(e))
    expect(toChildTagNames(child)).to.deep.eq(Array(elements.length).fill(childTag))  // Exakte Struktur in anderem Test
  }

  it('Data rendering is correct', () => {
    cy.visit('/').then(() => {

      cy.request('/movies').then(response => {
        const movies = response.body

        cy.get('article').then(movieElements => {
          expect(movieElements.length).to.be.eq(movies.length)

          for (let i = 0; i < movieElements.length; i++) {
            const movieElement = movieElements[i]

            expect(movieElement.children.length, "Movie article must have exacly 11 child elements").to.eq(11)
            expect(toChildTagNames(movieElement), "Movie article child elements must be correct").to.deep.eq(['IMG', 'H1', 'P', 'P', 'P', 'H2', 'UL', 'H2', 'UL', 'H2', 'UL'])

            const movie = movies[i]
            
            expect(movieElement.children[0].src).to.contain(movie.Poster)
            expect(movieElement.children[1]).to.contain(movie.Title)

            const infoElements = movieElement.children[2].children

            expect(infoElements.length, "Movie information paragraph must have three children, but has " + infoElements.length).to.eq(3)
            expect(infoElements[0]).to.contain('Runtime')
            const r = infoElements[0].innerText.match(/(\d+)h (\d+)m/)
            expect(parseInt(r[1])*60 + parseInt(r[2])).to.be.eq(parseInt(movie.Runtime))
            expect(infoElements[1]).to.contain('\u2022')
            expect(infoElements[2]).to.contain('Released on').and
              .to.contain(new Date(movie.Released).toLocaleDateString())
            
            checkList(movieElement, 3, movie.Genres)
            const genreElements = movieElement.children[3].children
            for (let j = 0; j < genreElements.length; j++) {
              expect(genreElements[j]).to.have.class("genre")
            }
            
            expect(movieElement.children[4]).to.contain(movie.Plot)
            checkLabeledList('Director', movieElement, 6, movie.Directors)
            checkLabeledList('Writer', movieElement, 8, movie.Writers)
            checkLabeledList('Actor', movieElement, 10, movie.Actors)
          }
        })
      })
    })
  })

  it('Data styling is correct', () => {

    cy.visit('/').then(() => {

      const document = cy.state('document')
      expect(document.styleSheets.length, "Expect document to contain one style sheet").to.eq(1)

      new StyleChecker('body')
        .eq('font-family', '"Trebuchet MS", sans-serif')

      new StyleChecker('img')
        .compound('border-radius', new ValueChecker(2, 32))

      new StyleChecker('h1')
        .compound('font-size', new ValueChecker(100, 400, '%'))
        .compound('margin', new ValueChecker(4, 16).first(), new ValueChecker(0, 8).second())

      new StyleChecker('article')
        .exists('background-color')
        .compound('border-radius', new ValueChecker(2, 32))
        .compound('margin', new ValueChecker(2, 16, 'vw'))
        .compound('padding', new ValueChecker(2, 32))

      cy.get("span").should('not.have.css', 'margin-right', '0px')

      new StyleChecker('.genre')
        .eq('font-weight', 'bold')
        .exists('background-color')
        .compound('padding', new ValueChecker(2, 16).first(), new ValueChecker(2, 16).second())
        .compound('border-radius', new ValueChecker(2, 32))
        .compound('border', new ValueChecker(1, 8), new BorderStyleChecker(), new ColorChecker())
    })
  })

});
