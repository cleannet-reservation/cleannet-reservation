import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import Success from "./Success";

const path = window.location.pathname;
const Component = path === "/success" ? Success : App;
createRoot(document.getElementById("root")).render(<Component />);
