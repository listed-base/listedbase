import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { lField, lSchema, list } from '@listedbase/core';
import { z } from 'zod/v4';


const sUser = lSchema({
  name: 'users',
  fields: {
    id: lField.id.auto(),
    createdAt: lField.now(),
    updatedAt: lField.updatedAt(),
    name: lField.index(z.string()),
  }
})
@Component({
  selector: 'app-reactive-playground',  
  templateUrl: './reactive-playground.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class ReactivePlaygroundComponent {
  injector = inject(Injector);

  users = list(sUser);

  newItemName = signal('');
  addItem() {
    this.users.create({
      name: this.newItemName(),
    })
  }

  removeItem(id: string) {
    this.users.delete({ where: { id } });

  }



  updateQuery(newQuery: string) {
    console.log("updateQuery", newQuery);

  }


}
