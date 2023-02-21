describe('Testing API response', () => {

  it('Data endpoint returns expected format', () => {
    cy.request('/data').as('books')
    cy.get('@books').should((response) => {
      expect(response.body).to.have.length(3)
      expect(response.body).to.be.a('array')

      response.body.forEach(book => {
        expect(book).to.have.keys('title', 'isbn', 'price')
        expect(book.title).to.be.a('string')
        expect(book.isbn).to.match(new RegExp("^\\d{10}$"))
        expect(book.price).to.be.a('object')
        expect(book.price).to.have.keys('value', 'currency')
        expect(book.price.value).to.be.a('number')
          .and.to.be.greaterThan(0)
        expect(book.price.currency).to.be.a('string')
          .and.to.have.length(1)
      })
    })
  })

  function toChildTagNames(element) {
    return Array.from(element.children).map(e => e.tagName)
  }

  it('Data is structured correctly', () => {
    cy.visit('/').then(() => {

      cy.request('/data').then(response => {
        const books = response.body

        cy.get('article').then(bookElements => {
          expect(bookElements).to.have.length(3)

          for (let i = 0; i < bookElements.length; i++) {
            const bookElement = bookElements[i]

            expect(bookElement.children.length).to.be.eq(3)
            expect(toChildTagNames(bookElement)).to.deep.eq(["H1", "P", "P"])

            const book = books[i]
            expect(bookElement.children[0].textContent).to.be.eq(book.title)

            expect(toChildTagNames(bookElement.children[1])).to.deep.eq(["SPAN"])
            expect(bookElement.children[1].textContent).to.contain(book.isbn)

            expect(toChildTagNames(bookElement.children[2])).to.deep.eq(["SPAN"])
            expect(bookElement.children[2].textContent).to.contain(book.price.value.toFixed(2))
          }
        })
      })
    })
  })

  it('Data is styled correctly', () => {
    cy.visit('/').then(() => {

      cy.get('body').then(bodyElement => {
        expect(bodyElement).to.have.css('font-family', '"Lucida Sans", sans-serif')
      })

      cy.get('article').then(bookElements => {
        Array.from(bookElements).forEach(bookElement => {
          expect(bookElement)
            .to.have.css('border-style', 'solid').and
            .to.have.css('border-radius', '12px').and
            .to.have.css('padding', '4px').and
            .to.have.css('margin', '4px')
        })

        cy.get('span').then(labelElements => {
          Array.from(labelElements).forEach(labelElement => {
            expect(labelElement)
              .to.have.css('margin-right', '4px').and
              .to.have.css('font-weight', '700')
          })
        })
      })
    })
  })
});
