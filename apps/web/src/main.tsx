import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { installAuthenticatedFetch } from "./lib/public-auth";
import { RootApp } from "./RootApp";

installAuthenticatedFetch();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootApp origin={window.location.origin} pathname={window.location.pathname} />
  </React.StrictMode>
);
