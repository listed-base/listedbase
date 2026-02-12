import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UinRAngular } from '@listedbase/angular-reactive';
import { uniReactive } from '@listedbase/uni-reactive';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  website?: string;
}

@Component({
  selector: 'app-reactive-playground',
  templateUrl: './reactive-playground.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  standalone: true,
})
export class ReactivePlaygroundComponent {
  injector = inject(Injector);
  reactiveAdp = new UinRAngular(this.injector);

  constructor() {
    uniReactive(this.reactiveAdp);
  }

  protected items = this.reactiveAdp.from(['العنصر 1', 'العنصر 2', 'العنصر 3']);
  protected newItem = this.reactiveAdp.from('');

  addItem() {
    const item = this.newItem.value().trim();
    if (item) {
      this.items.modify((list) => [...list, item]);
      this.newItem.set('');
    }
  }

  removeItem(index: number) {
    this.items.modify((list) => list.filter((_, i) => i !== index));
  }

  // 2️⃣ Async
  query = signal('');
  public users = this.reactiveAdp.fromAsync<User[], string>(
    (p) => this.fetchUsers(p),
    this.query,
  );

  updateQuery(newQuery: string) {
    this.query.update(() => newQuery);
  }

  private async fetchUsers(query?: string) {
  
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/users/' + (query ? `?username=${query}` : ''),
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: User[] = await response.json();
      console.log(data);
      
      return data;
  }

  
}
