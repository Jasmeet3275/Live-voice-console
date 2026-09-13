/// <reference types="cypress" />

describe('Low transcript confidence — human-in-the-loop correction', () => {
  it('surfaces the fade/facial checkpoint and continues after the operator confirms', () => {
    cy.visit('/')
    cy.startScenario('Low transcript confidence')

    // The low-confidence word pauses the flow for operator judgement.
    cy.contains('What did the caller say?').should('be.visible')
    cy.contains('button', /fades/).should('be.visible')
    cy.contains('button', /facial/).should('be.visible')

    // Confirm the word (default is the heard "fades") → flow resumes.
    cy.contains('button', /^Use/).click()

    // Continues into the normal booking flow.
    cy.contains('button', 'Book this slot').click()
    cy.contains('button', 'Confirm & book').click()
    cy.contains(/You're all set/).should('be.visible')
    cy.contains('Call summary').should('be.visible')
  })
})
