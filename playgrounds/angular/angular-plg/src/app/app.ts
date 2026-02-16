import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { duct } from '@listedbase/duct';
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterModule],
})
export class App {
  
  send( ) {

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
