import { AxiosError } from 'axios';

export const isAxiosError = (err: unknown): err is AxiosError => {
  return typeof err === 'object' && err !== null && 'isAxiosError' in err;
};

export const getApiStatus = (err: unknown): number | undefined => {
  return isAxiosError(err) ? err.response?.status : undefined;
};

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
};
