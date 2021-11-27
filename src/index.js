import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const backendURL = process.env.REACT_APP_STARRY_BACKEND || 'https://queenbot.uc.r.appspot.com/starry-backend';

ReactDOM.render(
  <React.StrictMode>
    <App
      backendURL={backendURL}
    />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
