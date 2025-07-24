// src/api/driverApi.ts
import { BASE_URL } from '../../config';

const DEBUG = true;

const logFetch = async (url: string, options?: RequestInit) => {
  if (DEBUG) {
    console.log('%c[API REQUEST]', 'color: blue;', {
      url,
      method: options?.method || 'GET',
      headers: options?.headers,
      body: options?.body,
    });
  }

  try {
    const response = await fetch(url, options);
    console.log('response', response);
    const data = await response.json();

    if (DEBUG) {
      console.log('%c[API RESPONSE]', 'color: green;', {
        url,
        status: response.status,
        data,
      });
    }

    return data;
  } catch (error) {
    if (DEBUG) {
      console.error('%c[API ERROR]', 'color: red;', { url, error });
    }
    throw error;
  };
};

export const driverApi = {
  login: (payload: { email: string; password: string }) =>
    logFetch(`${BASE_URL}/driver/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getOrders: (userId: number) =>
    logFetch(`${BASE_URL}/driver/orders?user_id=${userId}`),

  updateStatus: (orderId: number, status: string) =>
    logFetch(`${BASE_URL}/driver/order/driver-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, order_id: orderId }),
    }),

  getChat: (orderId: number) =>
    logFetch(`${BASE_URL}/driver/order/${orderId}/chats`),

  sendChat: (
    orderId: number,
    payload: {
      user_id: string;
      text: string;
      type?: string;
    },
  ) => {
    const url = `${BASE_URL}/driver/order/${orderId}/chats`;
    const options: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };

    if (DEBUG) {
      console.log('%c[API REQUEST - sendChat]', 'color: blue;', {
        url,
        ...options,
      });
    }

    return fetch(url, options)
      .then(async response => {
        const data = await response.json();
        if (DEBUG) {
          console.log('%c[API RESPONSE - sendChat]', 'color: green;', {
            url,
            status: response.status,
            data,
          });
        }
        return data;
      })
      .catch(error => {
        if (DEBUG) {
          console.error('%c[API ERROR - sendChat]', 'color: red;', {
            url,
            error,
          });
        }
        throw error;
      });
  },

  getNotifications: (userId: number) =>
    logFetch(`${BASE_URL}/driver/notifications?update=true&user_id=${userId}`),
};