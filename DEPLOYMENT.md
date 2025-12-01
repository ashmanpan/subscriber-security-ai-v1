# AWS Amplify Deployment Instructions

## GitHub Repository
✅ **Repository Created:** https://github.com/ashmanpan/subscriber-security-ai-v1
✅ **Code Pushed:** All files successfully pushed to main branch

## AWS Amplify App Details
- **App Name:** subscriber-security-ai
- **App ID:** d3eyem2qvmij75
- **Region:** ap-south-1 (Mumbai)
- **Default Domain:** d3eyem2qvmij75.amplifyapp.com

## Connect GitHub to Amplify (AWS Console Method)

### Step 1: Open AWS Amplify Console
```bash
# Open in browser:
https://ap-south-1.console.aws.amazon.com/amplify/home?region=ap-south-1#/d3eyem2qvmij75
```

### Step 2: Connect GitHub Repository
1. Click **"Connect branch"** or **"Host web app"**
2. Select **"GitHub"** as the repository service
3. Authorize AWS Amplify to access your GitHub account
4. Select repository: **ashmanpan/subscriber-security-ai-v1**
5. Select branch: **main**
6. Click **"Next"**

### Step 3: Configure Build Settings
The app will auto-detect the `amplify.yml` file. Review the settings:

```yaml
version: 1
frontend:
  phases:
    build:
      commands:
        - echo "Building Subscriber Security AI frontend..."
        - echo "No build step required for static HTML/JS/CSS"
  artifacts:
    baseDirectory: /
    files:
      - '**/*'
```

Click **"Next"**

### Step 4: Review and Deploy
1. Review all settings
2. Click **"Save and deploy"**
3. Wait for deployment to complete (2-3 minutes)

## Alternative: CLI Method with Personal Access Token

If you prefer CLI deployment, you'll need a GitHub Personal Access Token:

### Create GitHub Token:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (Full control of private repositories)
4. Generate and copy the token

### Deploy via CLI:
```bash
cd /home/kpanse/msl-myprojects/subscriber-security-ai

# Save token temporarily (replace YOUR_TOKEN)
export GITHUB_TOKEN="YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"

# Update Amplify app with GitHub connection
aws amplify update-app \
  --app-id d3eyem2qvmij75 \
  --repository https://github.com/ashmanpan/subscriber-security-ai-v1 \
  --access-token $GITHUB_TOKEN \
  --region ap-south-1

# Create and deploy branch
aws amplify create-branch \
  --app-id d3eyem2qvmij75 \
  --branch-name main \
  --region ap-south-1

# Start deployment
aws amplify start-job \
  --app-id d3eyem2qvmij75 \
  --branch-name main \
  --job-type RELEASE \
  --region ap-south-1
```

## Post-Deployment Configuration

### Update config.js with Real Endpoints

After deployment, you'll need to update the API endpoints in `config.js`:

```javascript
const CONFIG = {
    ENV: 'production',
    API_ENDPOINTS: {
        // Replace these with your actual ECS service endpoints
        MOBSF_INTEGRATION: 'http://YOUR-ALB-DNS:6000/api/v1',
        P_GATEWAY: 'http://YOUR-ALB-DNS:8080/api',
        FTD_INTEGRATION: 'http://YOUR-ALB-DNS:5000/api',
        ANALYTICS: 'http://YOUR-ALB-DNS:7000/api',
    }
};
```

### Configure CORS on Backend Services

Each backend service needs to allow the Amplify domain:

**Example for Flask (Python):**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    'https://d3eyem2qvmij75.amplifyapp.com',
    'http://localhost:*'  # For local development
])
```

### Environment Variables (Optional)

If you want to use environment variables instead of hardcoding endpoints:

1. Go to Amplify Console → App settings → Environment variables
2. Add variables:
   - `MOBSF_API_ENDPOINT`
   - `P_GATEWAY_API_ENDPOINT`
   - `FTD_API_ENDPOINT`
   - `ANALYTICS_API_ENDPOINT`

3. Update `config.js` to read from environment (using build-time substitution)

## Verify Deployment

### Check Deployment Status:
```bash
aws amplify list-branches --app-id d3eyem2qvmij75 --region ap-south-1
```

### Access the Application:
- **Main URL:** https://d3eyem2qvmij75.amplifyapp.com
- **Login Page:** https://d3eyem2qvmij75.amplifyapp.com/login.html
- **Dashboard:** https://d3eyem2qvmij75.amplifyapp.com/index.html
- **Admin Console:** https://d3eyem2qvmij75.amplifyapp.com/admin.html

### Test the Application:
1. Open login page
2. Login with any credentials (demo mode)
3. Navigate to Dashboard
4. Check Admin Console to view service status
5. Try the App Scanning page

## Continuous Deployment

Once GitHub is connected, any push to the `main` branch will automatically trigger a new deployment:

```bash
cd /home/kpanse/msl-myprojects/subscriber-security-ai

# Make changes to files...

git add .
git commit -m "Your commit message"
git push origin main

# Amplify will automatically detect the push and deploy
```

## Custom Domain (Optional)

To use a custom domain:

1. Go to Amplify Console → App settings → Domain management
2. Click "Add domain"
3. Follow the instructions to configure DNS

## Monitoring

### View Logs:
```bash
# List deployments
aws amplify list-jobs --app-id d3eyem2qvmij75 --branch-name main --region ap-south-1

# Get specific job details
aws amplify get-job --app-id d3eyem2qvmij75 --branch-name main --job-id JOB_ID --region ap-south-1
```

### CloudWatch Logs:
Amplify automatically sends logs to CloudWatch:
- Go to CloudWatch → Log groups
- Look for `/aws/amplify/d3eyem2qvmij75`

## Troubleshooting

### Build Failed:
- Check build logs in Amplify Console
- Verify amplify.yml syntax
- Ensure all files are committed to Git

### CORS Errors:
- Update backend services to allow Amplify domain
- Check browser console for specific CORS error messages

### API Not Responding:
- Verify ECS services are running
- Check security groups allow inbound traffic
- Update config.js with correct endpoints

## Cost Estimate

AWS Amplify Pricing:
- **Build & Deploy:** $0.01 per build minute
- **Hosting:** $0.15 per GB stored per month
- **Data Transfer:** $0.15 per GB served

Estimated Monthly Cost: **~$5-10/month** (depending on traffic)

## Support

For issues:
1. Check Amplify Console build logs
2. Review CloudWatch logs
3. Test API endpoints directly using curl/Postman
4. Verify CORS configuration on backend services

---

**Deployment Status:** ✅ Ready for GitHub Connection
**Next Step:** Connect GitHub repository via AWS Amplify Console
