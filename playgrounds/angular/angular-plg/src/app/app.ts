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
  query = lQuery(sPosts, {});
  posts = list(this.query);
  // posts = list(sPosts)
  // users = list(sUser)
  
  async add() {
    this.query.modify((prev) => {return {where: {no: 3}}})
  
  }
}
