# YouTube Clone

A modern, full-stack YouTube clone built with Next.js 15, TypeScript, Tailwind CSS, and Supabase. This project replicates core YouTube functionality with a beautiful, responsive design.

## 🚀 Features

- **Video Streaming**: Watch videos with a custom video player
- **User Authentication**: Secure login/signup with Supabase Auth
- **Video Upload**: Upload and manage your own videos
- **Search Functionality**: Search videos with real-time results
- **User Profiles**: Customizable user profiles and channels
- **Video Recommendations**: AI-powered video suggestions
- **Like/Dislike System**: Interactive video engagement
- **Comments**: Real-time comment system
- **Playlists**: Create and manage video playlists
- **Responsive Design**: Mobile-first responsive UI
- **Dark/Light Theme**: Toggle between themes
- **History & Watch Later**: Track viewing history and save videos

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Video Player**: Plyr React
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks and context
- **Icons**: Lucide React
- **Package Manager**: pnpm

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- pnpm package manager
- Supabase account and project
- Git

## 🚀 Getting Started

### Quick Setup (Recommended)

**Windows:**
```bash
scripts/setup.bat
```

**macOS/Linux:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manual Setup

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd youtube-clone
```

#### 2. Install Dependencies

```bash
pnpm install
```

#### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### 4. Database Setup

Run the database setup script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of setup-database.sql
```

#### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
youtube-clone/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (pages)/           # Page components
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # UI components (Radix UI)
│   └── ...               # Feature components
├── lib/                  # Utilities and configurations
│   ├── supabase-client.ts
│   ├── supabase-server.ts
│   └── utils.ts
├── hooks/                # Custom React hooks
├── public/               # Static assets
└── styles/               # Additional styles
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🌟 Key Features Explained

### Authentication
- Secure user authentication with Supabase Auth
- Protected routes and user-specific content
- Profile management and customization

### Video Management
- Upload videos with metadata
- Video processing and storage
- Thumbnail generation
- Video categorization

### Search & Discovery
- Real-time search functionality
- Video recommendations
- Trending videos
- Category-based browsing

### User Experience
- Responsive design for all devices
- Dark/light theme toggle
- Smooth animations and transitions
- Intuitive navigation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend services
- [Tailwind CSS](https://tailwindcss.com/) for the styling
- [Radix UI](https://www.radix-ui.com/) for the component library
- [Plyr](https://plyr.io/) for the video player

## 📞 Support

If you have any questions or need help, please open an issue in the GitHub repository.

---

Made with ❤️ using Next.js and Supabase 