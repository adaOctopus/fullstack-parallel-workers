import { render, screen, waitFor } from "@testing-library/react";
import Home from "../page";

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  readyState = 1;
  onopen = null;
  onmessage = null;
  onerror = null;
  onclose = null;

  constructor() {
    setTimeout(() => {
      if (this.onopen) this.onopen({} as Event);
    }, 0);
  }

  send() {}
  close() {}
} as any;

describe("Home Page", () => {
  it("renders the main heading", () => {
    render(<Home />);
    expect(screen.getByText("Emma Worker Queue")).toBeInTheDocument();
  });

  it("renders input fields for numbers A and B", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText("Enter number A")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter number B")).toBeInTheDocument();
  });

  it("renders the compute button", () => {
    render(<Home />);
    expect(screen.getByText("Compute")).toBeInTheDocument();
  });
});
