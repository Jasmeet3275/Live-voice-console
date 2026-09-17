import type { Preview } from '@storybook/react-vite'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import { TooltipProvider, ToastProvider } from '../src/components/atoms'
import '@fontsource-variable/inter'
import '../src/index.css'

/* The three reference screens from the handoff — pick from the viewport toolbar
   to see any component reflow. Organism stories also ship explicit width frames. */
const viewports = {
  mobile: { name: 'Mobile · 390', styles: { width: '390px', height: '844px' } },
  tablet: { name: 'Tablet · 768', styles: { width: '768px', height: '1024px' } },
  desktop: { name: 'Desktop · 1280', styles: { width: '1280px', height: '900px' } },
  wide: { name: 'Wide · 1440', styles: { width: '1440px', height: '900px' } },
}

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: {
      storySort: {
        order: ['Design', ['Tokens'], 'Atoms', 'Molecules', 'Organisms', 'Pages'],
      },
    },
    // Best-effort toolbar list; explicit width frames on organism stories are the
    // guaranteed path for "different screens".
    viewport: { options: viewports },
    backgrounds: { disable: true },
  },
  initialGlobals: {
    viewport: { value: 'desktop', isRotated: false },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: { Light: 'light', Dark: 'dark' },
      defaultTheme: 'Light',
      attributeName: 'data-theme',
    }),
    (Story) => (
      <ToastProvider>
        <TooltipProvider>
          <Story />
        </TooltipProvider>
      </ToastProvider>
    ),
  ],
}

export default preview
