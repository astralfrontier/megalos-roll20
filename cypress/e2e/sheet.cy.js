/// <reference types="cypress" />

before(() => {
  // Don't stop the login process because Roll20 is bad
  Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false
  })

  // Sign into Roll20
  cy.visit('https://roll20.net')
  cy.get('#menu-signin').click()
  cy.get('#input_login-email').type(Cypress.env('roll20_username'))
  cy.get('#input_login-password').type(Cypress.env('roll20_password'))
  cy.get('form button[type=submit]').click()

  // Visit the sandbox URL - 15016261
  cy.visit('https://app.roll20.net/sheetsandbox')
  cy.get(`tr[data-campaignid=${Cypress.env('roll20_campaign')}] a.calltoaction`).click()

  // TODO: upload current HTML and CSS
  // TODO: click to open character name
})

describe('Character sheet', () => {
  it('does the thing', () => {
    expect(2+2).to.eq(4)
  })
})