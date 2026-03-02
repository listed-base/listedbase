import { UinRAngular } from '@listedbase/angular-reactive';
import { Component, inject, Injector } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { duct } from '@listedbase/duct';
import { lField, lFilter, list, lSchema } from '@listedbase/core';
import z4, { z } from 'zod/v4';
import { container, REACTIVE_ADAPTER, UniRAdapterInterface } from '@listedbase/uni-reactive';

container.bind<UinRAngular>(REACTIVE_ADAPTER).to(UinRAngular).inSingletonScope();

const schema = lSchema({
  name: 'users',
  fields: {
    _id: lField.id.autouuid(),
    name: lField(z4.string()),
  },
})
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterOutlet],
})
export class App {
  inj = inject(Injector);
  filters = lFilter({})

  users = list<UinRAngular, any>(schema, {
    reactive: new UinRAngular(this.inj),
    filters: this.filters,
  })
  constructor() {


    this.users.create({
      // here full uuid 
      name: 'Alice',
    })
  }
  send() {

    console.log(this.users.items);
    
    duct.get().send('provider:change', [
      {
        list: 'my-list',
        op: 'add',
        data: {
          _id: 'item1',
          name: 'Item 1',
        },
      },
    ]);
  }

  on() {
    duct.get().on('provider:change', (msg) => {
      console.log('Received message:', msg);
    });
  }
}
