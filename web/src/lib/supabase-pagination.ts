export const supabaseReadPageSize = 1000;

export async function getAllSupabaseRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<{ data?: T[]; error?: string }> {
  const rows: T[] = [];
  for (let from = 0; ; from += supabaseReadPageSize) {
    const { data, error } = await fetchPage(
      from,
      from + supabaseReadPageSize - 1,
    );
    if (error) {
      return { error: error.message };
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < supabaseReadPageSize) {
      return { data: rows };
    }
  }
}
