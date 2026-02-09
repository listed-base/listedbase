import { Component, inject, Injector } from '@angular/core';
import { UinRAngular } from '@listedbase/angular-reactive';
import { uniReactive } from '@listedbase/uni-reactive';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  injector = inject(Injector)
   reactiveAdp = new UinRAngular(this.injector)
  reactive = uniReactive.get()
  constructor() {
    uniReactive(this.reactiveAdp)


  }
  protected title = this.reactiveAdp.from("Hello World")
}
