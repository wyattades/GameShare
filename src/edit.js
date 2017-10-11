import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import './styles/styles.scss';
import App from './components/App';

const _render = RootComponent => {
  render((
    <AppContainer>
      <RootComponent/>
    </AppContainer>
  ), document.getElementById('root'));
};

_render(App);

// Enable hot reloading
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./components/App', () => {
    // eslint-disable-next-line global-require
    const NextRootContainer = require('./components/App').default;
    _render(NextRootContainer);
  });
}
