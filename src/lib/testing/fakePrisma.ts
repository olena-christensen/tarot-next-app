// In-memory stand-in for the Prisma client, for unit tests only: just the calls
// the payment code makes, with the same "where" semantics (equality, null, not,
// in, notIn; dates compared by value) and "data" semantics (plain value or
// { increment }). It runs in one process, so it checks the logic of conditional
// writes, not real database locking.

export type Row = Record<string, unknown>;

function same(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return a === b;
}

export function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key] ?? null;
    if (cond !== null && typeof cond === "object" && !(cond instanceof Date)) {
      const c = cond as { not?: unknown; in?: unknown[]; notIn?: unknown[] };
      if ("not" in c) return !same(value, c.not);
      if (c.in) return c.in.some((v) => same(value, v));
      if (c.notIn) return !c.notIn.some((v) => same(value, v));
    }
    return same(value, cond);
  });
}

function apply(row: Row, data: Row): void {
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && typeof val === "object" && "increment" in (val as Row)) {
      row[key] = ((row[key] as number) ?? 0) + (val as { increment: number }).increment;
    } else {
      row[key] = val;
    }
  }
}

export function fakeTable(rows: Row[] = []) {
  return {
    rows,
    findFirst: async ({ where }: { where?: Row }) => rows.find((r) => matches(r, where)) ?? null,
    findUnique: async ({ where }: { where: Row }) => rows.find((r) => matches(r, where)) ?? null,
    updateMany: async ({ where, data }: { where?: Row; data: Row }) => {
      const hit = rows.filter((r) => matches(r, where));
      hit.forEach((r) => apply(r, data));
      return { count: hit.length };
    },
    update: async ({ where, data }: { where: Row; data: Row }) => {
      const row = rows.find((r) => matches(r, where));
      if (!row) throw new Error("Record to update not found");
      apply(row, data);
      return row;
    },
    create: async ({ data }: { data: Row }) => {
      rows.push(data);
      return data;
    },
  };
}

export type FakeTable = ReturnType<typeof fakeTable>;

/** A client over the given tables, with $transaction running the callback on itself. */
export function fakeClient(tables: Record<string, FakeTable>) {
  const client: Record<string, unknown> = {
    ...tables,
    $executeRaw: async () => 0,
    $transaction: async (fn: (tx: unknown) => unknown) => fn(client),
  };
  return client;
}
