/// <reference types="vite/client" />

declare global {
    interface Window {
      cordova: any; // You can refine this type further if you know the Cordova API structure
    }
  }