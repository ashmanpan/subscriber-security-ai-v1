# Subscriber Security AI - Web Dashboard

Complete end-to-end web interface for the Parental Control system with MobSF integration, Cisco FTD firewall monitoring, and Splunk MLTK anomaly detection.

## Features

### 🏠 Dashboard
- Real-time security overview
- Quick stats (children protected, apps scanned, threats detected)
- Recent activity feed
- Recent app scan results
- Quick access to children management

### 👥 Children Management
- Add/remove children profiles
- Track phone numbers and devices
- Manage per-child settings
- View child-specific security data

### 🔍 App Security Scanning (MobSF Integration)
- View all scanned APK/IPA files
- Risk assessment scores (0-10 scale)
- Detailed vulnerability breakdown (Critical/High/Medium/Low)
- Permission analysis
- Tracker detection
- Search and filter capabilities
- Detailed scan reports with recommendations

### 📊 Real-time Monitoring
- Live network activity stream
- Active connections tracking
- Blocked requests counter
- File download monitoring
- Security alerts from Splunk MLTK
- AI-powered anomaly detection
- Data usage tracking

### 📈 Analytics & Reports
- Threat detection trends
- App risk distribution charts
- Network activity patterns
- Data usage by child
- Top security threats table
- Splunk MLTK insights
- Exportable reports

### ⚙️ Admin Console
- Service status monitoring (P-Gateway, MobSF, FTD, Analytics)
- P-Gateway simulator controls
- Manual scan triggers
- System logs viewer
- Database statistics

## Architecture

### Frontend Stack
- **Pure HTML/CSS/JavaScript** - No frameworks, fast and simple
- **Chart.js** - Data visualization
- **LocalStorage** - Client-side data persistence (demo mode)
- **Responsive Design** - Mobile-friendly interface

### Backend Integration
- **MobSF Integration API** (Port 6000) - Mobile app security scanning
- **P-Gateway API** (Port 8080) - Main API gateway and simulator
- **FTD Integration API** (Port 5000) - Cisco FTD firewall integration
- **Analytics Dashboard API** (Port 7000) - Splunk and analytics data

### AWS Services
- **AWS Amplify** - Frontend hosting and CI/CD
- **Amazon ECS** - Backend microservices hosting
- **Amazon S3** - APK/IPA file storage (pc-prod-mobile-apps)
- **Amazon DynamoDB** - Scan results storage (pc-prod-mobsf-scans)
- **Amazon SQS** - Message queuing for async processing
- **Amazon SNS** - Alert notifications

## Deployment

### AWS Amplify Deployment

1. **Create Amplify App:**
   ```bash
   aws amplify create-app --name subscriber-security-ai --region ap-south-1
   ```

2. **Connect to Git or Deploy from Local:**

   **Option A: Deploy from Local Directory**
   ```bash
   cd /home/kpanse/wsl-myprojects/perental-controle-demo/subscriber-security-ai
   zip -r ../subscriber-security-ai.zip .
   aws s3 cp ../subscriber-security-ai.zip s3://YOUR-DEPLOYMENT-BUCKET/
   ```

   **Option B: Connect to GitHub**
   - Create a new GitHub repository
   - Push code to repository
   - Connect Amplify app to GitHub repo via AWS Console

3. **Configure Environment Variables in Amplify:**
   - Go to AWS Amplify Console
   - App Settings → Environment variables
   - Add API endpoint configurations

4. **Deploy:**
   ```bash
   aws amplify start-deployment --app-id YOUR-APP-ID --branch-name main
   ```

### Configuration

Update `config.js` with your actual ECS service endpoints:

```javascript
const CONFIG = {
    ENV: 'production',
    API_ENDPOINTS: {
        MOBSF_INTEGRATION: 'http://YOUR-MOBSF-SERVICE-ENDPOINT:6000/api/v1',
        P_GATEWAY: 'http://YOUR-P-GATEWAY-ENDPOINT:8080/api',
        FTD_INTEGRATION: 'http://YOUR-FTD-SERVICE-ENDPOINT:5000/api',
        ANALYTICS: 'http://YOUR-ANALYTICS-ENDPOINT:7000/api',
    }
};
```

## File Structure

```
subscriber-security-ai/
├── index.html              # Dashboard page
├── login.html              # Authentication page
├── children.html           # Children management
├── app-scanning.html       # MobSF scan results
├── monitoring.html         # Real-time monitoring
├── analytics.html          # Analytics and reports
├── admin.html              # Admin console
├── config.js               # Configuration file
├── amplify.yml             # Amplify build config
├── styles/
│   └── main.css            # Main stylesheet
├── scripts/
│   ├── api.js              # API service layer
│   ├── dashboard.js        # Dashboard logic
│   ├── login.js            # Authentication logic
│   ├── children.js         # Children management logic
│   ├── app-scanning.js     # App scanning logic
│   ├── monitoring.js       # Real-time monitoring logic
│   ├── analytics.js        # Analytics and charts logic
│   └── admin.js            # Admin console logic
└── README.md               # This file
```

## Usage

### Default Login
For demo purposes, any email/password combination will work. In production, integrate with your authentication service.

### Admin Console
Access the admin console at `/admin.html` to:
- Start/stop the P-Gateway simulator
- Monitor service health
- Trigger manual scans
- View system logs

### API Integration

All pages make real API calls to backend services. Demo data is shown as fallback when APIs are unavailable.

To use real data:
1. Ensure all backend services are running
2. Update `config.js` with correct endpoints
3. Configure CORS on backend services to allow frontend domain

## Security Notes

- **Authentication**: Currently uses localStorage for demo. Replace with proper JWT/OAuth in production.
- **API Keys**: Store sensitive keys in environment variables, not in code
- **CORS**: Configure backend services to only allow your Amplify domain
- **HTTPS**: Always use HTTPS in production (Amplify provides this automatically)

## Development

### Local Testing
1. Open `login.html` in a web browser
2. Login with any credentials (demo mode)
3. Navigate through the application

### API Mocking
When backend services are unavailable, the app uses demo data defined in `scripts/api.js`

## Support

For issues or questions:
- Check AWS CloudWatch logs for backend services
- Review browser console for JavaScript errors
- Verify API endpoints are accessible
- Check CORS configuration

## License

Cisco Internal Use Only
