# MJ Carros - Premium Automotive E-commerce

A modern, full-stack e-commerce platform built specifically for luxury and performance vehicles. Built with Next.js 14, TypeScript, Tailwind CSS, and MongoDB.

## ✨ Features

- 🚗 **Premium Vehicle Showcase** - Beautiful product displays for luxury cars
- 🔐 **JWT Authentication** - Secure user registration and login
- 👑 **Role-Based Access** - Admin and user roles with different permissions
- 🛒 **Shopping Cart** - Full cart functionality with persistent storage
- 💳 **Stripe Integration** - Secure payment processing
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 🗄️ **MongoDB Database** - Robust data storage with Prisma ORM
- 🖼️ **Image Management** - S3 integration for product images
- 📊 **Admin Dashboard** - Comprehensive admin panel for store management

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Payments**: Stripe integration
- **Storage**: AWS S3 for image uploads
- **State Management**: React Query for server state
- **Deployment**: Vercel ready

## 🏗️ Project Structure

```
mjcarros-ecommerce/
├── app/                    # Next.js 14 app directory
│   ├── (admin)/          # Admin panel routes
│   ├── (auth)/           # Authentication routes
│   ├── (routes)/         # Public routes
│   └── api/              # API endpoints
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── prisma/               # Database schema and migrations
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- AWS S3 bucket (optional)
- Stripe account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mjcarros-ecommerce.git
   cd mjcarros-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

4. **Configure your environment**
   - Update `.env.local` with your specific values
   - Set up S3 bucket if using image uploads
   - Configure Stripe keys if using payments

5. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Visit your application**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## 🔧 Configuration

### Environment Variables

See `env-setup.md` for detailed configuration instructions.

### Database Setup

The application uses MongoDB with Prisma ORM. The schema includes:
- Users (with role-based access)
- Products (vehicles with categories)
- Categories and Sizes
- Orders and Order Items
- Billboards for promotions

### S3 Configuration

For image uploads, configure your AWS S3 bucket:
1. Create an S3 bucket in your AWS account
2. Set up CORS configuration
3. Update environment variables with your bucket details

## 📱 Admin Features

- **Dashboard**: Sales analytics and overview
- **Product Management**: Add, edit, delete vehicles
- **Category Management**: Organize products by type
- **Order Management**: Track customer orders
- **User Management**: Manage customer accounts
- **Billboard Management**: Create promotional content

## 🎨 Customization

### Branding
- Update `config/site.ts` for site-wide settings
- Modify `components/Logo.tsx` for your logo
- Update color schemes in Tailwind config

### Styling
- All styling is done with Tailwind CSS
- Custom components in `components/ui/`
- Responsive design built-in

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
- Update `next.config.js` for your hosting platform
- Set production environment variables
- Build and deploy with `npm run build`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `env-setup.md`
- Review the code structure and examples

## 🙏 Acknowledgments

- Built with Next.js 14 and modern web technologies
- Designed for premium automotive experiences
- Optimized for performance and user experience

---

**MJ Carros** - Where Luxury Meets Technology 🚗✨

# Environment Setup

Create a `.env.local` in the project root with the following placeholders for email and site info:

```
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
EMAIL_FROM="MJ Carros <no-reply@mjcarros.com>"
SUPPORT_EMAIL=support@mjcarros.com

NEXT_PUBLIC_SITE_NAME=MJ Carros
NEXT_PUBLIC_SITE_ADDRESS1=178 Expensive Avenue
NEXT_PUBLIC_SITE_CITY=Philadelphia, 20100 PH
NEXT_PUBLIC_SITE_PHONE=+1 (555) 000-0000
NEXT_PUBLIC_SITE_EMAIL=info@mjcarros.com
NEXT_PUBLIC_SITE_WEB=www.mjcarros.com
```

Email sending is optional; if SMTP is not configured, the app will skip sending but proceed successfully.
