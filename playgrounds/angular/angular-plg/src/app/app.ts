import { Component, inject, Injector } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';

import { lQuery } from '@listedbase/core';
import { angularReactive } from '@listedbase/angular-reactive';
import { lSetting,list } from '@listedbase/core';
import { sPosts } from './schemas/post';
import { lIndexeddb } from '@listedbase/indexeddb';
// import { sUser } from './schemas/user';
lSetting.reactive(angularReactive);
lSetting.sources({
  primary: {
    data: lIndexeddb(),
  },
});
// import { z } from 'zod/v4';
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
  imports: [CommonModule, JsonPipe],
})
export class App {
  inj = inject(Injector);
  posts = list(sPosts);
  postsQuery = lQuery(this.posts, { take: 20 });
  
  async add() {
    this.postsQuery.modify((prev) => ({ ...prev, where: { no: 3 } }));
  }
}
