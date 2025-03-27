import { StyleChecker, ColorChecker, BorderStyleChecker, ValueChecker } from "./checkers.mjs";

function validateArrayElements(array, propertyName, expectedType) {
  expect(array, `The movie property "${propertyName}" should be an array.`).to.be.an('array')
  array.forEach(item =>
    expect(item, `Each item in the movie property "${propertyName}" should be of type ${expectedType}.`).to.be.a(expectedType)
  )
}

function isValidURL(url) {
  try {
    new URL(url)
    return true
  } catch (_) {
    return false
  }
}

describe('Testing API response', () => {

  it('Data endpoint returns correctly formatted data', () => {
    cy.request('/movies').as('movies')
    cy.get('@movies').should((response) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/

      expect(response.body, 'The response should be an array of movie objects.').to.be.an('array')
      expect(response.body.length, 'The response array should contain at least 3 movies.').to.be.at.least(3)

      response.body.forEach(movie => {
        expect(movie, 'Each movie object must contain exactly the following keys: Title, Released, Runtime, Genres, Directors, Writers, Actors, Plot, Poster, Metascore, imdbRating.')
          .to.have.keys('Title', 'Released', 'Runtime', 'Genres', 'Directors', 'Writers', 'Actors', 'Plot', 'Poster', 'Metascore', 'imdbRating')
        
        expect(movie.Title, 'Movie property "Title" should be a string.').to.be.a('string')
        expect(movie.Released, 'Movie property "Released" must be an ISO 8601 formatted date string (YYYY-MM-DD).').to.match(dateRegex)
        
        expect(movie.Runtime, 'Movie property "Runtime" should be a number (minutes) and at least 1.').to.be.a('number').and.to.be.at.least(1)
       
        const stringArrayNames = ['Genres', 'Directors', 'Writers', 'Actors']
        stringArrayNames.forEach(property =>
          validateArrayElements(movie[property], property, 'string')
        )
        
        expect(movie.Plot, 'Movie property "Plot" should be a string.').to.be.a('string')
        expect(movie.Poster, 'Movie property "Poster" should be a string URL.').to.be.a('string')
        expect(isValidURL(movie.Poster), 'Movie property "Poster" must be a valid URL.').to.be.eq(true)
        
        expect(movie.Metascore, 'Movie property "Metascore" should be a number between 1 and 100.')
          .to.be.a('number')
          .and.to.be.greaterThan(0)
          .and.to.be.at.most(100)
        expect(movie.imdbRating, 'Movie property "imdbRating" should be a number between 1 and 10.')
          .to.be.a('number')
          .and.to.be.greaterThan(0)
          .and.to.be.at.most(10)
      })
    })
  })

  function getChildTagNames(element) {
    return Array.from(element.children).map(child => child.tagName)
  }

  function checkLabeledList(label, element, index, expectedItems) {
    expect(element.children[index - 1], `Expected label "${label}" before the list.`).to.contain(label)
    checkList(element, index, expectedItems, 'UL', 'LI')
  }

  function checkList(element, index, expectedItems, parentTag = 'P', childTag = 'SPAN') {
    const listElement = element.children[index]
    expect(listElement.tagName, `Expected element at index ${index} to be a <${parentTag}> element.`).to.eq(parentTag)
    expectedItems.forEach(item => {
      expect(listElement.textContent, `The list should contain "${item}".`).to.contain(item)
    })
    expect(getChildTagNames(listElement)).to.deep.eq(Array(expectedItems.length).fill(childTag))
  }

  it('Data rendering is correct', () => {
    cy.visit('/').then(() => {
      cy.request('/movies').then(response => {
        const movies = response.body

        cy.get('article').then(movieElements => {
          expect(movieElements.length, 'The number of <article> elements should match the number of movies.').to.eq(movies.length)

          for (let i = 0; i < movieElements.length; i++) {
            const movieElement = movieElements[i]
            expect(movieElement.children.length, "Each movie article must have exactly 11 child elements.").to.eq(11)
            expect(getChildTagNames(movieElement), "The child elements' tags of the movie article are not as expected.").to.deep.eq(['IMG', 'H1', 'P', 'P', 'P', 'H2', 'UL', 'H2', 'UL', 'H2', 'UL'])

            const movie = movies[i]

            expect(movieElement.children[0].src, 'The image source must contain the movie poster URL.').to.contain(movie.Poster)
            expect(movieElement.children[1], 'The <h1> element should contain the movie title.').to.contain(movie.Title)

            const infoElements = movieElement.children[2].children
            expect(infoElements.length, `The movie information paragraph must have exactly three child elements, but found ${infoElements.length}.`).to.eq(3)
            expect(infoElements[0], 'The first info span should contain the runtime.').to.contain('Runtime')
            const runtimeMatch = infoElements[0].innerText.match(/(\d+)h (\d+)m/)
            expect(parseInt(runtimeMatch[1]) * 60 + parseInt(runtimeMatch[2]), 'The converted runtime in minutes should match the movie Runtime property.')
              .to.be.eq(parseInt(movie.Runtime))
            expect(infoElements[1], 'The second info span should contain a bullet character (•).').to.contain('\u2022')
            expect(infoElements[2], 'The third info span should contain the released date information starting with "Released on".')
              .to.contain('Released on')
              .and.to.contain(new Date(movie.Released).toLocaleDateString())

            checkList(movieElement, 3, movie.Genres)
            const genreElements = movieElement.children[3].children
            for (let j = 0; j < genreElements.length; j++) {
              expect(genreElements[j], `Genre element at index ${j} should have class "genre".`).to.have.class("genre")
            }

            expect(movieElement.children[4], 'The plot paragraph should contain the movie plot.').to.contain(movie.Plot)
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
      expect(document.styleSheets.length, "Expected the document to contain exactly one style sheet.").to.eq(1)

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
