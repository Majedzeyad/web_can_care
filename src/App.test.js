import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * Test case that verifies the App component renders correctly.
 * Checks if the component can be rendered without errors.
 */
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
