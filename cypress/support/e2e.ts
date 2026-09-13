/// <reference types="cypress" />

// Shared helpers for driving the operator console.

/** Pick a demo scenario from the header Select, then start the call. */
Cypress.Commands.add('startScenario', (label?: string) => {
  if (label) {
    cy.get('[aria-label="Demo scenario"]').click()
    cy.get('[role="option"]').contains(label).click()
  }
  cy.contains('button', 'Start demo').click()
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      startScenario(label?: string): Chainable<void>
    }
  }
}

export {}
