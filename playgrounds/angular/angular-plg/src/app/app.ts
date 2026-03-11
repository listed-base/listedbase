import { Component, inject, Injector } from '@angular/core';

import { RouterLink, RouterOutlet } from '@angular/router';
import { angularReactive } from '@listedbase/angular-reactive';
import { registerReactive } from '@listedbase/uni-reactive';


registerReactive(angularReactive); 





@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterOutlet, RouterLink],
})
export class App { 
  inj = inject(Injector);



}
