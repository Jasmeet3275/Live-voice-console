/// <reference types="cypress" />

describe('Keyboard shortcuts', () => {
  it('opens the shortcuts help from the header button', () => {
    cy.visit('/')
    cy.get('button[aria-label="Keyboard shortcuts"]').click()
    cy.contains('Keyboard shortcuts').should('be.visible')
    cy.contains('Play / pause the call').should('be.visible')
    cy.contains('Take over the call').should('be.visible')
  })

  it('opens the shortcuts help with the "?" key', () => {
    cy.visit('/')
    cy.get('body').trigger('keydown', { key: '?' })
    cy.contains('Play / pause the call').should('be.visible')
  })

  it('starts the call with the Space key', () => {
    cy.visit('/')
    cy.get('body').trigger('keydown', { key: ' ' })
    // Once started, the agent greeting appears in the feed.
    cy.contains(/Thanks for calling Luxe Salon/).should('be.visible')
  })
})
