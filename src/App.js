import "./App.css";
import React from "react";
import { Provider } from "react-redux";
import { CookiesProvider } from "react-cookie";
import store from "./store";
import { RouteComponent } from "./RouteComponent";
import GoogleCaptchaWrapper from "./GoogleCaptchWrapper";

function App() {
  return (
    <Provider store={store}>
      <CookiesProvider>
        <GoogleCaptchaWrapper>
          <div className="App">
            <RouteComponent />
          </div>
        </GoogleCaptchaWrapper>
      </CookiesProvider>
    </Provider>
  );
}

export default App;
