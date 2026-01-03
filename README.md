# Dayflow HRMS

A modern Human Resource Management System built with Next.js, Supabase, and TypeScript.

## Features

- **Admin Dashboard**: Complete employee management, attendance tracking, leave management
- **Employee Portal**: Personal profile, attendance check-in/out, leave requests
- **Salary Management**: Comprehensive salary structure with automatic calculations
- **Leave Management**: Multiple leave types with document upload support
- **Attendance System**: Real-time check-in/out with work hours calculation
- **Company Setup**: Multi-company support with custom branding

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dayflow-hrms
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:
   - Run the SQL commands in `supabase/schema.sql` in your Supabase SQL Editor
   - Run the SQL commands in `supabase/storage-setup.sql` to set up file storage
   - Run the SQL commands in `FIX_LEAVE_REQUESTS.sql` if needed

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. Navigate to `/sign-up` to create your first admin account
2. Fill in your company details and admin information
3. Upload your company logo (optional)
4. Complete the signup process
5. Sign in with your admin credentials

## Usage

### Admin Features
- **Employee Management**: Add, edit, delete employee profiles
- **Attendance Monitoring**: View all employee attendance records
- **Leave Management**: Approve/reject leave requests, view documents
- **Salary Configuration**: Set up salary structures for employees

### Employee Features
- **Profile Management**: View and update personal information
- **Attendance**: Check-in/out with automatic time tracking
- **Leave Requests**: Submit leave requests with document uploads
- **Salary Information**: View salary breakdown and components

## Database Schema

The application uses the following main tables:
- `users` - Authentication and role management
- `companies` - Company information and branding
- `employees` - Employee profiles and job details
- `attendance` - Daily attendance records
- `leave_requests` - Leave applications and approvals
- `leave_balances` - Annual leave allocations
- `salary_info` - Salary structures and components

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: shadcn/ui, Lucide React
- **Authentication**: Supabase Auth with RLS policies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.