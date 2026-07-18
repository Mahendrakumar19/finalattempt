import { Router, Response } from 'express';
import { db } from '../db';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';

const router = Router();

// ISO 8601 duration parser (converts PT12M30S to 12:30 or 12 mins)
function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Global/Exported Youtube synchronization task
export async function syncYouTubeChannel(): Promise<{ syncedCount: number; error: string | null }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    const errText = 'YOUTUBE_API_KEY is not defined in environment variables.';
    console.warn(`[YouTube Sync] ${errText}`);
    await db.logYoutubeSync(0, 'FAILURE', errText);
    return { syncedCount: 0, error: errText };
  }

  try {
    console.log('[YouTube Sync] Resolving channel handle @finalattemptofficial...');
    
    // 1. Get channel uploads playlist ID using the channel handle query
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=@finalattemptofficial&key=${apiKey}`;
    const channelRes = await fetch(channelUrl);
    
    if (!channelRes.ok) {
      const errBody = await channelRes.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || `HTTP ${channelRes.status}`;
      throw new Error(`Failed resolving handle: ${errMsg}`);
    }

    const channelData = await channelRes.json();
    const channelItem = channelData?.items?.[0];
    if (!channelItem) {
      throw new Error('Channel handle @finalattemptofficial not resolved. Verify handle or API key.');
    }

    const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      throw new Error('Uploads playlist ID not found for resolved channel.');
    }

    console.log(`[YouTube Sync] Uploads playlist resolved: ${uploadsPlaylistId}. Fetching playlist items...`);

    // 2. Get playlist items (latest 50 uploads)
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
    const playlistRes = await fetch(playlistUrl);
    
    if (!playlistRes.ok) {
      const errBody = await playlistRes.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || `HTTP ${playlistRes.status}`;
      throw new Error(`Failed fetching playlist items: ${errMsg}`);
    }

    const playlistData = await playlistRes.json();
    const items = playlistData?.items || [];
    if (items.length === 0) {
      console.log('[YouTube Sync] No upload items found in playlist.');
      await db.logYoutubeSync(0, 'SUCCESS', null);
      return { syncedCount: 0, error: null };
    }

    // Extract video IDs for duration lookup
    const videoIds = items.map((item: any) => item.contentDetails?.videoId).filter(Boolean);

    // 3. Lookup durations in batch (up to 50)
    let durationMap: Record<string, string> = {};
    if (videoIds.length > 0) {
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
      const videosRes = await fetch(videosUrl);
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        const videoItems = videosData?.items || [];
        for (const vItem of videoItems) {
          durationMap[vItem.id] = parseDuration(vItem.contentDetails?.duration || 'PT0S');
        }
      }
    }

    // 4. Save metadata records in DB
    let syncedCount = 0;
    for (const item of items) {
      const vId = item.contentDetails?.videoId;
      if (!vId) continue;

      const snippet = item.snippet || {};
      const video = {
        youtubeVideoId: vId,
        title: snippet.title || 'Untitled',
        description: snippet.description || '',
        thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        duration: durationMap[vId] || '0:00',
        publishedAt: snippet.publishedAt || new Date().toISOString(),
        channelTitle: snippet.channelTitle || 'Final Attempt'
      };

      await db.upsertYoutubeVideo(video);
      syncedCount++;
    }

    console.log(`[YouTube Sync] Successfully synced ${syncedCount} videos.`);
    await db.logYoutubeSync(syncedCount, 'SUCCESS', null);
    return { syncedCount, error: null };

  } catch (err: any) {
    const errorMsg = err.message || 'Unknown Sync Error';
    console.error('[YouTube Sync] Synchronization failure:', errorMsg);
    await db.logYoutubeSync(0, 'FAILURE', errorMsg);
    return { syncedCount: 0, error: errorMsg };
  }
}

/**
 * @swagger
 * /api/youtube/videos:
 *   get:
 *     summary: Retrieve synced YouTube videos (cached in database)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for offset calculation
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Query string matching video title/description
 *     responses:
 *       200:
 *         description: List of videos and pagination details
 */
router.get('/videos', async (req: any, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 9;
  const page = parseInt(req.query.page as string) || 1;
  const search = (req.query.search as string) || '';

  try {
    const data = await db.getYoutubeVideos(limit, page, search);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/youtube/status:
 *   get:
 *     summary: Get last synchronization details and errors
 */
router.get('/status', async (req: any, res: Response) => {
  try {
    const statusLog = await db.getLastSyncLog();
    res.json({
      lastSyncTime: statusLog?.syncTime || null,
      videosSynced: statusLog?.videosSynced ?? 0,
      status: statusLog?.status || 'IDLE',
      error: statusLog?.error || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/youtube/sync:
 *   post:
 *     summary: Manually trigger YouTube channel sync (Admin only)
 */
router.post('/sync', authenticate, requireAdmin, async (req: any, res: Response) => {
  try {
    const result = await syncYouTubeChannel();
    if (result.error) {
      res.status(500).json({ success: false, error: result.error });
    } else {
      res.json({ success: true, syncedCount: result.syncedCount });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
