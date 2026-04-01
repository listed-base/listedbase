import { Component, inject, Injector } from '@angular/core';

import { RouterLink, RouterOutlet } from '@angular/router';






@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterOutlet, RouterLink],
})
export class App { 
  inj = inject(Injector);



}
