import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('play_history').del();
  await knex('user_likes').del();
  await knex('playlist_tracks').del();
  await knex('playlists').del();
  await knex('tracks').del();
  await knex('albums').del();
  await knex('artists').del();
  await knex('users').del();


  // Add tracks to playlists
  await knex('playlist_tracks').insert([
    {
      playlist_id: '550e8400-e29b-41d4-a716-446655440041',
      track_id: '550e8400-e29b-41d4-a716-446655440031',
      added_by: '550e8400-e29b-41d4-a716-446655440004',
      position: 1
    },
    {
      playlist_id: '550e8400-e29b-41d4-a716-446655440041',
      track_id: '550e8400-e29b-41d4-a716-446655440032',
      added_by: '550e8400-e29b-41d4-a716-446655440004',
      position: 2
    },
    {
      playlist_id: '550e8400-e29b-41d4-a716-446655440042',
      track_id: '550e8400-e29b-41d4-a716-446655440031',
      added_by: '550e8400-e29b-41d4-a716-446655440004',
      position: 1
    }
  ]);

  // Add some user likes
  await knex('user_likes').insert([
    {
      user_id: '550e8400-e29b-41d4-a716-446655440004',
      track_id: '550e8400-e29b-41d4-a716-446655440031'
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440004',
      track_id: '550e8400-e29b-41d4-a716-446655440033'
    }
  ]);

  console.log('✅ Sample data seeded successfully');
}