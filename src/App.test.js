import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  test('renders learn react link', () => {
    const { getByText } = render(<App />);
    const linkElement = getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
    // screen.debug(); // print the raw html

    // this would have to be an exact match. you can try to do regex instead
    // expect(screen.getByText('Search:')).toBeInTheDocument(); // you can grab things and insure they're there 
  });
});

