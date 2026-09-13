/// <reference types="cypress" />

describe('Happy path — request → recommend → confirm → booked', () => {
  it('books an appointment end to end and closes the call', () => {
    cy.visit('/')

    // Dock controls are disabled until the call starts.
    cy.contains('Press Start to begin the call').should('be.visible')

    cy.startScenario() // happy path is the default scenario

    // Agent recommends slots → operator picks one.
    cy.contains('button', 'Book this slot').click()

    // Caller accepts → agent asks the operator to confirm the booking.
    cy.contains('button', 'Confirm & book').click()

    // Booking confirmed by the agent.
    cy.contains(/You're all set/).should('be.visible')

    // The agent closes the call and the end-of-call summary appears.
    cy.contains('Call ended').should('be.visible')
    cy.contains('Call summary').should('be.visible')
    cy.contains('Confirmed').should('be.visible')
  })
})
