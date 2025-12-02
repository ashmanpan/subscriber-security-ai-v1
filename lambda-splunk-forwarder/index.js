const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const https = require('https');
const { URL } = require('url');

const secretsClient = new SecretsManagerClient({ region: 'ap-south-1' });

let splunkConfig = null;

async function getSplunkConfig() {
    if (splunkConfig) {
        return splunkConfig;
    }

    try {
        const response = await secretsClient.send(new GetSecretValueCommand({
            SecretId: 'pc-prod-splunk-config'
        }));

        splunkConfig = JSON.parse(response.SecretString);
        return splunkConfig;
    } catch (error) {
        console.error('Error getting Splunk config:', error);
        throw error;
    }
}

async function sendToSplunk(events, config) {
    return new Promise((resolve, reject) => {
        const url = new URL(config.hec_url);

        // Format events for Splunk HEC
        const splunkEvents = events.map(event => ({
            time: event.timestamp ? Math.floor(event.timestamp / 1000) : Math.floor(Date.now() / 1000),
            source: 'parental-control',
            sourcetype: '_json',
            index: config.index || 'firewall',
            event: event
        }));

        const payload = splunkEvents.map(e => JSON.stringify(e)).join('\n');

        const options = {
            hostname: url.hostname,
            port: url.port || 8088,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Splunk ${config.hec_token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`Successfully sent ${events.length} events to Splunk`);
                    resolve({ statusCode: 200, body: data });
                } else {
                    console.error(`Splunk HEC error: ${res.statusCode} - ${data}`);
                    reject(new Error(`Splunk HEC returned status ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error sending to Splunk:', error);
            reject(error);
        });

        req.write(payload);
        req.end();
    });
}

exports.handler = async (event) => {
    try {
        // Get Splunk configuration
        const config = await getSplunkConfig();

        // Parse DynamoDB Stream records
        const trafficLogs = event.Records
            .filter(record => record.eventName === 'INSERT' || record.eventName === 'MODIFY')
            .map(record => {
                // Extract new image from DynamoDB Stream
                const newImage = record.dynamodb.NewImage;

                // Convert DynamoDB format to regular JavaScript object
                return {
                    logId: newImage.logId?.S,
                    timestamp: parseInt(newImage.timestamp?.N || '0'),
                    phoneNumber: newImage.phoneNumber?.S,
                    srcIp: newImage.srcIp?.S,
                    destIp: newImage.destIp?.S,
                    destDomain: newImage.destDomain?.S,
                    destPort: parseInt(newImage.destPort?.N || '0'),
                    protocol: newImage.protocol?.S,
                    action: newImage.action?.S,
                    bytesSent: parseInt(newImage.bytesSent?.N || '0'),
                    bytesReceived: parseInt(newImage.bytesReceived?.N || '0'),
                    category: newImage.category?.S,
                    risk: newImage.risk?.S,
                    connectionDuration: parseInt(newImage.connectionDuration?.N || '0'),
                    suspicious: newImage.suspicious?.BOOL || false
                };
            });

        if (trafficLogs.length === 0) {
            console.log('No traffic logs to forward');
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No logs to forward' })
            };
        }

        console.log(`Forwarding ${trafficLogs.length} traffic logs to Splunk`);

        // Send to Splunk HEC
        await sendToSplunk(trafficLogs, config);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully forwarded ${trafficLogs.length} logs to Splunk`,
                count: trafficLogs.length
            })
        };

    } catch (error) {
        console.error('Error in Splunk forwarder:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                details: 'Failed to forward logs to Splunk'
            })
        };
    }
};
