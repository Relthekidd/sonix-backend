import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '@/database/supabaseClient';

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface User {
      id: string;
      [key: string]: any;
    }
    interface Request {
      user?: User;
    }
  }
}

// Create a new track (already implemented)
export async function createTrack(req: Request, res: Response) {
  // Ensure req.user is defined
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: user not authenticated' });
  }
  // Fetch the latest role from the users table
  const { data: user, error } = await supabase
    .from('users') // or 'profiles' if you use a separate table
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(403).json({ message: 'User not found or cannot fetch role' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can upload tracks' });
  }

  try {
    // Extract and sanitize fields
    const {
      title,
      audio_url,
      cover_url,
      created_by,
      genre,
      description,
      album_id,
      ...rest
    } = req.body;

    // Ensure required fields
    if (!title || !audio_url || !created_by) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Prepare data for Supabase
    const trackData: any = {
      title,
      audio_url,
      cover_url: cover_url || null,
      created_by,
      genre: genre || null, // or genre: genre ? [genre] : null if expecting text[]
      description: description || null,
      album_id: album_id || null,
      ...rest
    };

    // Remove undefined fields (optional, but helps with Supabase strictness)
    Object.keys(trackData).forEach(
      (key) => trackData[key] === undefined && delete trackData[key]
    );

    const { data, error: insertError } = await supabaseAdmin
      .from('tracks')
      .insert([trackData])
      .select()
      .single();

    if (insertError) {
      // Show detailed error in dev, generic in prod
      const isDev = process.env.NODE_ENV !== 'production';
      return res.status(500).json({
        message: 'Failed to upload track',
        error: isDev ? insertError : undefined,
        code: insertError.code,
        details: isDev ? insertError.details : undefined,
      });
    }

    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      message: 'Internal server error',
      error: isDev ? err.message : undefined,
      stack: isDev ? err.stack : undefined,
    });
  }
}

// Get all tracks with metadata
export async function getAllTracks(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getAllTracks error:', error);
      return res.status(500).json({ message: 'Failed to fetch tracks' });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get trending tracks (most play_count in last 7 days)
export async function getTrendingTracks(_req: Request, res: Response) {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get play counts for tracks in last 7 days
    const { data: plays, error: playsError } = await supabase
      .from('song_plays')
      .select('track_id')
      .gte('played_at', since);

    if (playsError) {
      console.error('Supabase getTrendingTracks error:', playsError);
      return res.status(500).json({ message: 'Failed to fetch trending tracks' });
    }

    // Count plays per track
    const playCounts: Record<string, number> = {};
    plays?.forEach(row => {
      playCounts[row.track_id] = (playCounts[row.track_id] || 0) + 1;
    });

    // Get top 20 track IDs
    const topTrackIds = Object.entries(playCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([trackId]) => trackId);

    if (topTrackIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Fetch track metadata
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('*')
      .in('id', topTrackIds);

    if (tracksError) {
      console.error('Supabase getTrendingTracks error:', tracksError);
      return res.status(500).json({ message: 'Failed to fetch trending tracks' });
    }

    // Sort tracks by play count
    const sortedTracks = tracks?.sort(
      (a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0)
    );

    return res.status(200).json({ success: true, data: sortedTracks });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get recent releases (sorted by most recent release_date)
export async function getRecentReleases(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Supabase getRecentReleases error:', error);
      return res.status(500).json({ message: 'Failed to fetch recent releases' });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get metadata for a single track by id
export async function getTrackById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Track not found' });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update a track’s metadata by id
export async function updateTrack(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabaseAdmin
      .from('tracks')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Failed to update track' });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Remove a track by id
export async function deleteTrack(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('tracks')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(404).json({ message: 'Failed to delete track' });
    }

    return res.status(200).json({ success: true, message: 'Track deleted' });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Log a new play in song_plays and increment the track’s play_count
export async function recordPlay(req: Request, res: Response) {
  try {
    const { track_id, user_id, device_type } = req.body;

    // 1. Insert play record
    const { error: playError } = await supabaseAdmin
      .from('song_plays')
      .insert([{
        track_id,
        user_id,
        device_type: device_type || 'unknown',
        played_at: new Date().toISOString()
      }]);

    if (playError) {
      console.error('Supabase recordPlay error:', playError);
      return res.status(500).json({ message: 'Failed to record play' });
    }

    // 2. Increment play_count
    // Fetch current play_count
    const { data: track, error: trackError } = await supabaseAdmin
      .from('tracks')
      .select('play_count')
      .eq('id', track_id)
      .single();

    if (!trackError && track) {
      await supabaseAdmin
        .from('tracks')
        .update({ play_count: (track.play_count || 0) + 1 })
        .eq('id', track_id);
    }

    return res.status(201).json({ success: true, message: 'Play recorded' });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}