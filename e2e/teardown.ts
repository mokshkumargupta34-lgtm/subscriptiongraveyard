import { config } from "dotenv";
config({ path: ".env.local" });
config();

/* Remove synthetic @test.local users (cascades wipe their rows). */
export default async function teardown() {
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  const gone = await sql`delete from users where email like '%@test.local' returning email`;
  console.log(`teardown: removed ${gone.length} test user(s)`);
  await sql.end();
}
