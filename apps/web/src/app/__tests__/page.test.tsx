import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../page";

// Mock WebSocket
class MockWebSocket {
  readyState = 1;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor() {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen({} as Event);
      }
    }, 0);
  }

  send() {}
  close() {}
}

global.WebSocket = MockWebSocket as any;

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
