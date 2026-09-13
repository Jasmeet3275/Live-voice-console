/// <reference types="cypress" />

describe('Service outage — agent hands off to the operator', () => {
  it('shows the error reason and lets the operator take over', () => {
    cy.visit('/')
    cy.startScenario('Service outage → take over')

    // The scheduling service fails and the agent escalates with a reason.
    cy.contains('Scheduling service unavailable').should('be.visible')
    cy.contains(/take over/i).should('be.visible')

    // Taking over opens the manual booking wizard.
    cy.contains('button', 'Take over the call').click()
    cy.contains('Book appointment').should('be.visible')
  })
})
