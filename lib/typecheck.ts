export async function typecheck(...entrypoints: string[]) {
  const start = performance.now();
  const command = new Deno.Command(
    Deno.execPath(),
    { args: ["check", ...entrypoints] },
  );
  await command.output();
  const end = performance.now();
  return end - start;
}
