import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UinRAngular } from '@listedbase/angular-reactive';

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

  items = this.reactiveAdp.from<string[]>(['العنصر 1', 'العنصر 2', 'العنصر 3']);
  newItem = this.reactiveAdp.from<string>('');

  addItem() {
    const item = this.newItem.value().trim();
    if (item) {
      this.items.modify((list) => [...(list as string[]), item]);
    }
  }

  removeItem(index: number) {
    this.items.modify((list) =>
      (list as string[]).filter((_, i) => i !== index),
    );
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
      'https://jsonplaceholder.typicode.com/users/' +
        (query ? `?username=${query}` : ''),
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: User[] = await response.json();
    console.log(data);

    return data;
  }
}
