# VaultX: Digital Inheritance Protocol

VaultX transforms how digital assets live on after us. In a world where our entire lives, passwords, crypto, memories exist digitally, we've built the ultimate platform ensuring your digital legacy reaches the right hands. We bridge the critical gap between your digital life and your loved ones through military-grade encryption and automated inheritance protocols.

Powered by zero-knowledge architecture, interactive dashboards, and beautiful modern design, VaultX creates secure ecosystems where your digital assets remain protected today and transfer seamlessly tomorrow. This isn't just another password manager; it's a movement that turns digital inheritance from impossible into inevitable, ensuring your digital life doesn't die with you.

<br>

## 📚 Table Of Contents

* [✨ Features](#-features)
* [📸 Preview](#-preview)
* [📁 Project Structure](#-project-structure)
* [⚙️ Technologies Used](#️-technologies-used)
* [🚀 Getting Started](#-getting-started)
* [🧭 Usage Guide](#-usage-guide)
* [🎯 Core Features](#-core-features)
* [🌈 Customization](#-customization)
* [🛠️ Future Enhancements](#️-future-enhancements)
* [🤝 Contributing](#-contributing)
* [📄 License](#-license)
* [🙌 Credits](#-credits)
* [📢 Author](#-author)

<br>

## ✨ Features

- **🔐 Military-Grade Encryption** – AES-256 encryption with zero-knowledge architecture (your data, your key only)
- **⚰️ Dead-Man Switch Protocol** – Automated asset release after verified inactivity with multi-step verification
- **👥 Role-Based Nominee Access** – Granular permissions controlling exactly who accesses what
- **🪙 Cryptocurrency Support** – Secure storage for wallet private keys, seed phrases, and exchange credentials
- **📁 Digital Asset Vault** – Store passwords, documents, photos, and subscription credentials
- **📊 Audit Trail** – Complete logs of all access requests and asset releases
- **📱 PWA Ready** – Installable progressive web app for mobile access
- **🌙 Dark Mode** – Seamless light/dark theme switching
- **✨ Modern UI Design** – Clean, intuitive interface with black/purple gradient theme

<br>

## 📸 Preview

| **Home Page** | **Vault Page** |
|---------------|---------------------|
| ![Home Page](VaultX_\frontend\public\preview\Image_1.webp) | ![Vault Dashboard](VaultX_\frontend\public\preview\Image_2.webp) |

| **Dashboard Page** | **Nominees Management Page** |
|------------------------|---------------------|
| ![Dashboard](VaultX_\frontend\public\preview\Image_3.webp) | ![Nominees](VaultX_\frontend\public\preview\Image_4.webp) |

| **Nominee Access Page** | **Dead Man Switch Page** |
|---------------|---------------------|
| ![Nominee Access](VaultX_\frontend\public\preview\Image_5.webp) | ![Dead Man Switch](VaultX_\frontend\public\preview\Image_6.webp) |

| **Audit Logs Page** | **Settings Page** |
|---------------|---------------------|
| ![Audit](VaultX_\frontend\public\preview\Image_7.webp) | ![Settings](VaultX_\frontend\public\preview\Image_8.webp) |

<br>

## 📁 Project Structure

```bash
VaultX/
└── 📁VaultX_
     ├── 📁backend/                         # Backend services (planned)
     │
     ├── 📁frontend/                        
     │    ├── 📁public/                      
     │    │    ├── 📁assets/                   
     │    │    │    └── 📁favicon/              # PWA application icons
     │    │    │         ├── apple-touch-icon.png            
     │    │    │         ├── favicon-96x96.png            
     │    │    │         ├── favicon.ico            
     │    │    │         ├── favicon.svg            
     │    │    │         ├── site.webmanifest           
     │    │    │         ├── web-app-manifest-192x192.png           
     │    │    │         └── web-app-manifest-512x512.png           
     │    │    │
     │    │    └── 📁preview/                   # Application screenshots
     │    │         ├── home.webp          
     │    │         ├── vault.webp          
     │    │         ├── nominees.webp          
     │    │         ├── deadman.webp          
     │    │         ├── audit.webp          
     │    │         └── nominee-access.webp          
     │    │
     │    └── 📁src/                         
     │         ├── 📁components/                # Reusable UI components
     │         │    ├── 📁auth/                 
     │         │    │    └── AuthGuard.tsx      # Route protection
     │         │    └── 📁navigation/           
     │         │         ├── BottomNav.tsx      # Bottom navigation bar
     │         │         └── Header.tsx         # Page header component
     │         │ 
     │         ├── 📁contexts/                   # React contexts
     │         │    └── 📁auth/                  
     │         │         ├── AuthContext.tsx    
     │         │         ├── AuthProvider.tsx   
     │         │         └── index.ts           
     │         │ 
     │         ├── 📁hooks/                       # Custom React hooks
     │         │    └── useAuth.ts                # Authentication hook
     │         │ 
     │         ├── 📁pages/                        # Application pages
     │         │    ├── Home.tsx                   # Landing page
     │         │    ├── Login.tsx                  # User login
     │         │    ├── Signup.tsx                 # User registration
     │         │    ├── Dashboard.tsx              # Main dashboard
     │         │    ├── Vault.tsx                  # Asset management
     │         │    ├── Nominees.tsx               # Nominee management
     │         │    ├── DeadManSwitch.tsx          # Inheritance configuration
     │         │    ├── Audit.tsx                  # Activity logs
     │         │    ├── NomineeAccess.tsx          # Nominee view
     │         │    └── Settings.tsx               # User settings
     │         │
     │         ├── 📁services/                      # API and business logic
     │         │    ├── supabase.ts                 # Supabase client
     │         │    ├── encryption.ts               # Crypto utilities
     │         │    ├── vaultService.ts             # Asset operations
     │         │    ├── nomineeService.ts           # Nominee management
     │         │    ├── deadManSwitchService.ts     # Inheritance logic
     │         │    ├── auditService.ts             # Activity logging
     │         │    ├── dashboardService.ts         # Dashboard data
     │         │    ├── settingsService.ts          # User preferences
     │         │    └── emailService.ts             # Notification service
     │         │
     │         ├── 📁types/                          # TypeScript definitions
     │         │    └── vault.ts                     # Asset types
     │         │
     │         ├── App.tsx                           # Main application component
     │         ├── index.css                         # Global styles
     │         ├── main.tsx                          # Application entry point
     │         └── vite-env.d.ts                     # Vite type definitions
     │
     ├── .env                                         # Environment variables
     ├── .gitattributes                               # Git attributes
     ├── .gitignore                                   # Git ignore rules
     ├── eslint.config.js                             # ESLint configuration
     ├── index.html                                   # HTML entry point
     ├── package-lock.json                            # Dependency lock file
     ├── package.json                                 # Frontend dependencies
     ├── tsconfig.app.json                            # TypeScript app config
     ├── tsconfig.json                                # TypeScript configuration
     ├── tsconfig.node.json                           # TypeScript node config
     ├── vercel.json                                   # Vercel deployment config
     └── vite.config.ts                               # Vite build configuration
```

<br>

## ⚙️ Technologies Used

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | Frontend framework | 18+ |
| **TypeScript** | Type-safe development | 5.x |
| **Vite** | Build tool and dev server | 5.x |
| **Tailwind CSS** | Utility-first styling | 3.x |
| **Supabase** | Backend, Auth, Database | 2.x |
| **PostgreSQL** | Primary database | 15.x |
| **Web Crypto API** | Client-side encryption | - |
| **Framer Motion** | Animations and transitions | 10.x |
| **Lucide React** | Icon library | 0.x |
| **date-fns** | Date manipulation | 2.x |
| **Web3Forms** | Email notifications | - |

<br>

## 🚀 Getting Started

### A) Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase account (free tier)
- Web3Forms API key (free)

### B) Installation

1. **Clone The Repository**
```bash
git clone https://github.com/FrostByte-49/VaultX.git
cd VaultX/VaultX_/frontend
```
#

2. **Install Dependencies**
```bash
npm install
```
#

3. **Set Up Environment Variables**
Create a `.env` file in the frontend directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WEB3FORMS_ACCESS_KEY=your_web3forms_key
```
#

4. **Start Development Server**
```bash
npm run dev
```
#

5. **Open Your Browser** 
Navigate to `http://localhost:5173` to access VaultX! <br><br>

### C) Database Setup

Run the SQL schema in your Supabase SQL editor:
- Tables for vaults, assets, nominees, nominee_access, dead_man_switches, audit_logs
- RLS policies for security
- Triggers for automatic vault creation

### D) Building for Production
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

<br>

## 🧭 Usage Guide

### A) For Vault Owners 👤
1. **Create Your Vault** – Sign up and set your master password (encryption happens locally)
2. **Add Digital Assets** – Store passwords, crypto wallets, documents, and notes
3. **Assign Nominees** – Add trusted individuals with granular permissions
4. **Configure Dead-Man Switch** – Set inactivity periods and verification methods
5. **Monitor Activity** – Use the audit log to track all access and changes
6. **Rest Easy** – Your digital legacy is protected and ready to transfer

### B) For Nominees 🤝
1. **Receive Invitation** – Get notified when someone adds you as a nominee
2. **Accept or Decline** – Choose to accept the responsibility
3. **Await Transfer** – Assets remain encrypted until the dead-man switch triggers
4. **Access Inherited Assets** – After verified inactivity, decrypt and access assigned assets
5. **View Audit Trail** – All access is logged for transparency

### C) For Executors ⚖️
1. **Full Access Rights** – Manage the entire vault if designated
2. **Configure Settings** – Update nominee permissions and dead-man switch
3. **Monitor All Activity** – Complete visibility into vault operations
4. **Ensure Compliance** – Audit logs provide legal-grade transparency

<br>

## 🎯 Core Features

### A) Zero-Knowledge Encryption 🔐
- **Client-side Encryption**: All data encrypted in browser using Web Crypto API
- **AES-256-GCM**: Military-grade encryption standard
- **PBKDF2 Key Derivation**: 100,000 iterations for password strengthening
- **Master Key Never Leaves Device**: Even VaultX cannot access your data
- **Unique IV Per Encryption**: Maximum cryptographic security

```typescript
// Encryption flow
const encrypt = async (data: string, masterKey: CryptoKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    encoder.encode(data)
  );
  // Store IV + encrypted data
  return combine(iv, encrypted);
};
```

### B) Dead-Man Switch Protocol ⚰️
- **Inactivity Detection**: Configurable periods (30-365 days)
- **Multi-step Verification**: Email + SMS checks before triggering
- **Grace Period**: 7-30 days to cancel release
- **Automatic Asset Transfer**: Secure release to nominees after verification
- **Cancellation Option**: User can cancel any time during grace period

### C) Role-Based Nominee Access 👥
- **Granular Permissions**: Control exactly what each nominee accesses
- **Access Levels**: View only, manage, or full control
- **Relationship Tagging**: Family, friend, lawyer, executor
- **Invitation System**: Secure email invitations with unique tokens
- **Revocation**: Instantly revoke access at any time

### D) Comprehensive Audit Trail 📊
- **All Events Logged**: Login, asset access, nominee changes, dead-man triggers
- **Metadata Tracking**: IP addresses, user agents, timestamps
- **Export Functionality**: Download logs as CSV for legal purposes
- **Search & Filter**: Find specific events by type, date, or description
- **Immutable Records**: Append-only logging for integrity

### E) Progressive Web App 📱
- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Service worker for reliable access
- **Responsive Design**: Optimized for all screen sizes
- **Dark Mode**: Seamless theme switching
- **Fast Performance**: Built with Vite for optimal loading

<br>

## 🌈 Customization

### A) Theming & Branding
- Modify `tailwind.config.js` to customize the black/purple gradient scheme
- Update PWA manifest in `public/assets/favicon/site.webmanifest` for app branding
- Replace favicon files in `public/assets/favicon/` with your branding
- Adjust animation speeds in Framer Motion components

### B) Security Configuration
- Extend encryption iterations in `encryption.ts` for stronger security
- Modify RLS policies in Supabase for custom access rules
- Add additional verification methods in dead-man switch
- Configure session timeouts in authentication settings

### C) UI/UX Customization
- Modify navigation structure in `BottomNav.tsx`
- Add new asset categories in `vault.ts` types
- Extend audit log event types in `auditService.ts`
- Customize dashboard metrics in `dashboardService.ts`

<br>

## 🛠️ Future Enhancements

* [ ] **Biometric Authentication** – Fingerprint and face ID support
* [ ] **Hardware Security Module** – YubiKey and Ledger integration
* [ ] **Multi-language Support** – Internationalization for global users
* [ ] **Legal Document Templates** – Will templates for digital assets
* [ ] **Blockchain Notarization** – Immutable timestamping of transfers
* [ ] **Family Vaults** – Shared access for family accounts
* [ ] **Emergency Contact** – Secondary verification contacts
* [ ] **Scheduled Releases** – Time-based asset distribution
* [ ] **Mobile Apps** – Native iOS and Android applications
* [ ] **API Access** – Developer API for third-party integration

<br>

## 🤝 Contributing

We welcome contributions to help secure digital legacies worldwide!

### A) How To Contribute

1. **Fork the repository**
#
2. **Create a feature branch**
```bash
git checkout -b feature/enhanced-encryption
```
#
3. **Commit your changes**
```bash
git commit -m "🔐 Add: Enhanced key derivation with increased iterations"
```
#
4. **Push to the branch**
```bash
git push origin feature/enhanced-encryption
```
#
5. **Open a Pull Request** <br><br>

### B) Areas For Contribution
- 🔐 Security audits and improvements
- 🎨 UI/UX design enhancements
- 📱 Mobile responsiveness
- 🌍 Accessibility features
- 📊 Analytics and reporting
- 🔧 Performance optimization
- 📚 Documentation
- 🧪 Testing and quality assurance

<br>

## 📄 License

This Project is licensed under the [MIT License](https://opensource.org/licenses/MIT). <br>
**© 2026 Pranav Khalate**  

```text
Permission Is Hereby Granted, Free Of Charge, To Any Person Obtaining A Copy...
```

<br>

## 🙌 Credits

* **Supabase Team** – Open-source Firebase alternative with PostgreSQL
* **Web Crypto API** – Browser-native cryptography
* **React Team** – Frontend library
* **Tailwind CSS** – Utility-first styling framework
* **Lucide Icons** – Beautiful, consistent icon library
* **Framer Motion** – Production-ready animations
* **All Beta Testers** – Early feedback and security insights

<br>

## 📢 Author

**Built With ❤️ By Team Zero**

[![Website](https://img.shields.io/badge/Website-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://tryvaultx.vercel.app/) &nbsp;
[![GitHub](https://img.shields.io/badge/GitHub-1e1e2f?style=for-the-badge&logo=github&logoColor=white)](https://github.com/FrostByte-49)

<br>

## 🌟 Support The Mission

If VaultX helps secure your digital legacy, please consider giving it a ⭐️ on GitHub. Your support helps raise awareness about digital inheritance and inspires more developers to create solutions for preserving digital lives.

> *At VaultX, We Believe That Your Digital Life Shouldn't Die With You. Every Line Of Code, Every Encryption Key, Every Transfer Protocol Represents A Promise That Your Legacy Lives On.*

> *Join Us In Building A World Where Digital Memories Never Fade.*

<br>

**Technical Note**: This application implements zero-knowledge client-side encryption with Supabase backend. All sensitive data is encrypted before transmission, ensuring complete privacy and security. The dead-man switch runs automated checks, releasing assets only after multi-step verification.