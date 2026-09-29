import React, { useEffect, useRef } from 'react';
import StandardIndex from 'components/views/StandardIndex';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ReactGA from 'react-ga4';

const App = () => {
  // Initialize only once (StrictMode double-invokes effects in dev).
  // testMode keeps jsdom tests from loading a GA script.
  const gaInited = useRef(false);
  useEffect(() => {
    if (gaInited.current) return;
    gaInited.current = true;
    ReactGA.initialize('UA-213455639-1', {
      testMode: import.meta.env.MODE === 'test',
    });
    // react-ga4 has no pageview(); send() is the equivalent (see its README).
    ReactGA.send({ hitType: 'pageview', page: 'Landing page' });
  }, []);

  return (
    <Router basename="/listbuilder">
      <Routes>
        <Route path="/" element={<StandardIndex />} />
      </Routes>
    </Router>
  );
};

export default App;
