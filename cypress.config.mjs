import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    viewportWidth: 1280,
    viewportHeight: 800,
    // The demo is timeline-driven, so checkpoints can take a few seconds to appear.
    defaultCommandTimeout: 12000,
  },
})
