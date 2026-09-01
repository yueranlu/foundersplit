// Global setup for jsdom component tests.
// Extends Vitest's `expect` with @testing-library matchers (toBeInTheDocument
// etc.) and cleans the DOM between tests.

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
