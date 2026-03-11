import './styles.css';
import { createApp } from 'vue';
import App from './app/App.vue';
import { vueReactive } from "@listedbase/vue-reactive";

import { registerReactive } from '@listedbase/uni-reactive';
registerReactive(vueReactive)

import { lField, lSchema, list } from '@listedbase/core';
import { z } from 'zod/v4';



const sUser = lSchema({
    name: 'users',
    fields: {
        id: lField.id.autouuid(),
        name: lField.index(z.string()),
        age: z.number().optional(),
    }
})

const users = list(sUser);


users.create({
    name: 'Alice',
})

console.log(users.items);


const app = createApp(App);
app.mount('#root');
