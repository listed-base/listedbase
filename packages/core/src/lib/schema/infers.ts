
// ============================================================
// 🧪 EXAMPLES
// ============================================================

type Post = {
  id: number | { idField: true };        // manual id → مطلوب في create
  title: string;
};

interface Profile {
  id: string | { idField: true };        // manual id → مطلوب في create
  bio: string;
}

type User = {
  id: number | { idField: true; autogen: true }; // autogen → مستبعد من create
  name: string;
  tags: string[];
  obj: { a: number; b: string };
  createdAt: Date | { now: true };
  updatedAt: Date | { updatedAt: true };
  email: string | { unique: true };
  profile: Profile | { oneFrom: true };
  posts: Post[] | { manyFrom: true };
};
