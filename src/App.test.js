// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost/listbuilder/" }
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the Kings of War listbuilder landing page', async () => {
    render(<App />);
    await waitFor(
      () =>
        expect(
          screen.getByText(
            /This listbuilder contains units available in Kings of War/i
          )
        ).toBeInTheDocument()
    );
  });
});
