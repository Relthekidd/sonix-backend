# Sonix Music API

A comprehensive backend API for the Sonix music streaming application built with Node.js, Express, and Supabase.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Music Management**: Complete CRUD operations for tracks, albums, playlists, and artist profiles
- **File Upload**: (If using Supabase Storage or Firebase, update here)
- **Search Functionality**: Full-text search across tracks, artists, albums, and playlists
- **User Interactions**: Follow/unfollow users, like tracks, create playlists
- **Security**: Rate limiting, input validation, secure file uploads
- **Documentation**: Comprehensive Swagger/OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL + REST/Realtime API)
- **File Storage**: (Update to Supabase Storage or Firebase if used)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi and express-validator
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate limiting

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Supabase project (free tier is sufficient)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000

   # Supabase
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   ```

4. **Database Setup**
   - **No local database or migrations needed!**
   - All schema changes and management are done via the [Supabase UI](https://app.supabase.com/).
   - You can use Supabase SQL editor for custom queries or schema changes.

5. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/change-password` - Change password

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/:id/follow` - Follow user
- `DELETE /api/v1/users/:id/unfollow` - Unfollow user
- `GET /api/v1/users/liked-tracks` - Get liked tracks

### Artists
- `GET /api/v1/artists` - Get all artists
- `POST /api/v1/artists/profile` - Create artist profile
- `GET /api/v1/artists/:id` - Get artist by ID
- `GET /api/v1/artists/:id/tracks` - Get artist tracks

### Tracks
- `GET /api/v1/tracks` - Get all tracks
- `GET /api/v1/tracks/trending` - Get trending tracks
- `GET /api/v1/tracks/recent` - Get recent releases
- `GET /api/v1/tracks/:id` - Get track by ID
- `POST /api/v1/tracks` - Create new track
- `PUT /api/v1/tracks/:id` - Update track
- `DELETE /api/v1/tracks/:id` - Delete track
- `POST /api/v1/tracks/:id/play` - Record play

### Albums
- `GET /api/v1/albums` - Get all albums
- `GET /api/v1/albums/:id` - Get album by ID
- `POST /api/v1/albums` - Create new album

### Playlists
- `GET /api/v1/playlists` - Get public playlists
- `GET /api/v1/playlists/:id` - Get playlist by ID
- `POST /api/v1/playlists` - Create new playlist
- `POST /api/v1/playlists/:id/tracks` - Add track to playlist

### Search
- `GET /api/v1/search` - Search across all content
- `GET /api/v1/search/suggestions` - Get search suggestions
- `GET /api/v1/search/trending` - Get trending searches

### Upload
- `POST /api/v1/upload/audio` - Upload audio file
- `POST /api/v1/upload/image` - Upload image file

## Database Schema

- **Supabase** is the database platform (PostgreSQL under the hood).
- All schema changes are managed in the Supabase dashboard.
- **Row Level Security (RLS)**: If enabled, policies are managed in Supabase UI.
- Relationships, constraints, and indexes are managed via Supabase.

## Security Features

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control
- **Rate Limiting**: Configurable request limits
- **Input Validation**: Comprehensive validation on all endpoints
- **File Upload Security**: Type validation and size limits
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers

## File Upload

<!--
If using Supabase Storage:
-->
- **Audio Files & Images**: Uploaded to Supabase Storage buckets
- **Size Limits**: Configurable per file type
- **Organization**: Automatic folder structure in Supabase Storage

<!--
If using Firebase or another provider, update this section accordingly.
-->

## Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run test         # Run tests
```

## Deployment

### Environment Variables
Ensure all production environment variables are set:
- Supabase connection (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- JWT secrets
- CORS origins

### Database
- All schema changes are managed in Supabase UI
- Enable/adjust Row Level Security (RLS) as needed
- Configure backups in Supabase

### File Storage
- Configure Supabase Storage bucket policies
- Set up CDN if needed
- Configure backup strategies

### Deploying the Backend
- Deploy with [Railway](https://railway.app/), [Vercel](https://vercel.com/), or your preferred Node.js host.
- No database migrations or seeds are needed—Supabase manages your schema.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.