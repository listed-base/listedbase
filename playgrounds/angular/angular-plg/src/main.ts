import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { angularReactive } from '@listedbase/angular-reactive';
import {  registerReactive } from '@listedbase/uni-reactive';


registerReactive(angularReactive);
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
