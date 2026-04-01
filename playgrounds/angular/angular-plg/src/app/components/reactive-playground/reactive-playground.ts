import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { lSchema } from '@listedbase/core';
import z from 'zod/v4';


import {  defineEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
})

export const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    books: () => p.manyToOne(Book),
  },
})


export const USER = lSchema({
  name:"users",
  fields:{
    id: z.string(),
    name: z.string(),

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

  // users = list(sUser);
  // posts = list(sPosts)
  newItemName = signal('');
  addItem() {
    // this.users.create({
    //   name: this.newItemName(),
    //   email: "ddsss@mail.com",
    //   posts: []
    // })
    // this.posts.create({
    //   obj: { one: "ddd" }
    // })
    // console.log(this.posts.items);
    // console.log(this.users.items);

  }

  removeItem(id: any) {
    // this.users.delete({ where: { id } });

  }



  updateQuery(newQuery: string) {
    console.log("updateQuery", newQuery);

  }


}
