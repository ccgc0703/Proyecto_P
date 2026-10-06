import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sin globals de vitest el auto-cleanup de testing-library no se registra.
afterEach(() => cleanup());
