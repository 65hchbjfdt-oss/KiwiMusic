// User types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: 'user' | 'premium' | 'admin';
  display_badge: string;
  country_code?: string;
  premium_until?: string;
  created_at: string;
}

// Track types
export interface Track {
  id: string;
  name: string;
  artist_name: string;
  artist_id: string;
  album_name?: string;
  album_id?: string;
  duration: number;
  audio_url: string;
  image_url?: string;
  genre?: string;
  tags: string[];
  has_lyrics: boolean;
  lyrics?: string;
  play_count: number;
  uri?: string;
}

// Player state
export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'none' | 'all' | 'one';
  queue: Track[];
  currentIndex: number;
}

// Event types
export interface Event {
  id: string;
  title: string;
  description: string;
  genre: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  sticker_id: string;
  sticker_name: string;
  sticker_url: string;
  tasks: EventTask[];
}

export interface EventTask {
  id: string;
  event_id: string;
  task_number: number;
  title: string;
  description: string;
  task_type: 'listen_genre' | 'like_tracks' | 'follow_artists';
  requirement_count: number;
  genre?: string;
}

export interface UserEventProgress {
  id: string;
  user_id: string;
  event_id: string;
  current_task: number;
  task_1_completed: boolean;
  task_2_completed: boolean;
  task_3_completed: boolean;
  event_completed: boolean;
  completed_at?: string;
}

export interface UserSticker {
  id: string;
  user_id: string;
  sticker_id: string;
  sticker_name: string;
  sticker_url: string;
  event_id?: string;
  earned_at: string;
  is_equipped: boolean;
}

// Album types
export interface Album {
  id: string;
  name: string;
  artist_name: string;
  artist_id: string;
  image_url?: string;
  tracks: Track[];
}

// Artist types
export interface Artist {
  id: string;
  name: string;
  image_url?: string;
  genres: string[];
  albums: Album[];
  popular_tracks: Track[];
}

// Search result types
export interface SearchResult {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  users: User[];
}

// Comment types
export interface Comment {
  id: string;
  track_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  is_censored: boolean;
  likes_count: number;
  replies_count: number;
  created_at: string;
  user?: User;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'follow' | 'comment_reply' | 'comment_on_track';
  title: string;
  message: string;
  actor_id?: string;
  actor_username?: string;
  actor_avatar?: string;
  target_id?: string;
  target_type?: string;
  is_read: boolean;
  created_at: string;
}

// Playlist types
export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  cover_url?: string;
  track_count: number;
  created_at: string;
}

// Listening history
export interface ListeningHistory {
  id: string;
  user_id: string;
  track_id: string;
  listened_at: string;
  listen_duration: number;
  completed: boolean;
}
