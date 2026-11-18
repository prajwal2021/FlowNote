import { query, queryOne } from './db';
import { deleteObject, guideKey, shareKey } from './storage';
import { stripe } from './stripe';

export async function deleteUser(id: string): Promise<void> {
  const billing = await queryOne<{ subscription_id: string | null; subscription_status: string | null }>(
    'select subscription_id, subscription_status from users where id = $1',
    [id],
  );
  if (billing?.subscription_id && billing.subscription_status !== 'canceled') {
    await stripe(`/subscriptions/${billing.subscription_id}`, {}, 'DELETE');
  }
  const shares = await query<{ id: string }>('select id from shares where owner_id = $1', [id]);
  const guides = await query<{ id: string }>('select id from guides where owner_id = $1', [id]);
  await query('delete from users where id = $1', [id]);
  await Promise.all([
    ...shares.map((row) => deleteObject(shareKey(row.id))),
    ...guides.flatMap((row) => [
      deleteObject(guideKey(row.id, 'html')),
      deleteObject(guideKey(row.id, 'bundle')),
      deleteObject(guideKey(row.id, 'snapshot')),
    ]),
  ]);
}
