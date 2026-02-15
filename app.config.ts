import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { APP_ROUTES } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        // provideRouter enables routing and withComponentInputBinding allows router data (like :id) to be bound directly to component inputs.
        provideRouter(APP_ROUTES, withComponentInputBinding())
    ]
};