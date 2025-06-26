import { supabase } from '@/database/supabaseClient';

export class AnalyticsService {
  // Track user engagement metrics
  static async trackUserEngagement(userId: string, action: string, metadata?: any) {
    try {
      await supabase
        .from('user_analytics')
        .insert([{ user_id: userId, action, metadata: JSON.stringify(metadata || {}), timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error tracking user engagement:', error);
    }
  }

  // Get artist analytics
  static async getArtistAnalytics(artistId: string, timeframe = '30') {
    try {
      const since = new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000).toISOString();

      // Total plays for this artist's tracks
      const { data: artistTracks } = await supabase
        .from('tracks')
        .select('id')
        .eq('artist_id', artistId);

      const trackIds = artistTracks?.map(t => t.id) || [];

      const { data: playsData, error: playsError } = await supabase
        .from('play_history')
        .select('id, track_id, device_type')
        .in('track_id', trackIds)
        .gte('played_at', since);

      const totalPlays = playsError || !playsData ? 0 : playsData.length;

      // Likes for this artist's tracks
      const { data: likesData, error: likesError } = await supabase
        .from('user_likes')
        .select('id, track_id')
        .in('track_id', trackIds)
        .gte('liked_at', since);

      const totalLikes = likesError || !likesData ? 0 : likesData.length;

      // Followers
      const { data: followersData, error: followersError } = await supabase
        .from('user_follows')
        .select('id')
        .eq('artist_id', artistId)
        .gte('followed_at', since);

      const newFollowers = followersError || !followersData ? 0 : followersData.length;

      // Top tracks by play count
      const playCounts: Record<string, number> = {};
      playsData?.forEach(row => {
        playCounts[row.track_id] = (playCounts[row.track_id] || 0) + 1;
      });
      const topTracks = artistTracks
        ?.map(track => ({
          ...track,
          playCount: playCounts[track.id] || 0
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 10) || [];

      // Demographics (device_type)
      const demographics = playsData?.reduce((acc, row) => {
        const type = row.device_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalPlays,
        totalLikes,
        newFollowers,
        topTracks,
        demographics,
        timeframe
      };
    } catch (error) {
      console.error('Error getting artist analytics:', error);
      throw error;
    }
  }

  // Get platform analytics (admin only)
  static async getPlatformAnalytics(timeframe = '30') {
    try {
      const since = new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000).toISOString();

      // New users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id')
        .gte('created_at', since);
      const newUsers = usersError || !usersData ? 0 : usersData.length;

      // New tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('id, genres, duration')
        .gte('created_at', since);
      const newTracks = tracksError || !tracksData ? 0 : tracksData.length;

      // Total plays
      const { data: playsData, error: playsError } = await supabase
        .from('play_history')
        .select('id, played_at')
        .gte('played_at', since);
      const totalPlays = playsError || !playsData ? 0 : playsData.length;

      // Total duration (sum of track durations)
      const totalDuration = tracksData?.reduce((acc, track) => acc + (track.duration || 0), 0) ?? 0;

      // Top genres (client-side grouping)
      const genreCounts = tracksData?.reduce((acc, row) => {
        const genres = Array.isArray(row.genres) ? row.genres : [row.genres];
        genres.forEach((genre: string) => {
          if (genre) acc[genre] = (acc[genre] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>) || {};

      // User activity by day (client-side grouping)
      const dailyActivity = playsData?.reduce((acc, row) => {
        const date = row.played_at?.slice(0, 10) || 'unknown';
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        newUsers,
        newTracks,
        totalPlays,
        totalDuration,
        topGenres: genreCounts,
        dailyActivity,
        timeframe
      };
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      throw error;
    }
  }

  // Generate trending content
  static async updateTrendingContent() {
    try {
      // Trending tracks: most played in last 7 days
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: playsData, error } = await supabase
        .from('play_history')
        .select('track_id')
        .gte('played_at', since);

      if (error || !playsData) return { trendingTracks: [], trendingArtists: [] };

      // Count plays per track
      const trackCounts: Record<string, number> = {};
      playsData.forEach(row => {
        trackCounts[row.track_id] = (trackCounts[row.track_id] || 0) + 1;
      });

      // Get top 50 track IDs
      const topTrackIds = Object.entries(trackCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([trackId]) => trackId);

      // Fetch track details
      const { data: tracks } = await supabase
        .from('tracks')
        .select('*')
        .in('id', topTrackIds);

      // Trending artists: most played artists in last 7 days
      const { data: allTracks } = await supabase
        .from('tracks')
        .select('id, artist_id')
        .in('id', playsData.map(row => row.track_id));

      const artistCounts: Record<string, number> = {};
      allTracks?.forEach(track => {
        if (track.artist_id) {
          artistCounts[track.artist_id] = (artistCounts[track.artist_id] || 0) + (trackCounts[track.id] || 0);
        }
      });

      const topArtistIds = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([artistId]) => artistId);

      const { data: artists } = await supabase
        .from('artists')
        .select('*')
        .in('id', topArtistIds);

      return { trendingTracks: tracks || [], trendingArtists: artists || [] };
    } catch (error) {
      console.error('Error updating trending content:', error);
      throw error;
    }
  }
}