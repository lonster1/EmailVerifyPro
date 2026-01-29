\# API Documentation Structure  
\#\# EmailVerify Pro \- Complete API Reference

\*\*API Base URL\*\*: \`https://api.emailverifypro.com/v1\`    
\*\*Authentication\*\*: Bearer Token (API Key)    
\*\*Format\*\*: REST API with JSON responses

\---

\#\# Table of Contents

1\. \[Getting Started\](\#getting-started)  
2\. \[Authentication\](\#authentication)  
3\. \[Rate Limits\](\#rate-limits)  
4\. \[Error Handling\](\#error-handling)  
5\. \[Endpoints\](\#endpoints)  
6\. \[Webhooks\](\#webhooks)  
7\. \[Code Examples\](\#code-examples)  
8\. \[SDKs & Libraries\](\#sdks--libraries)  
9\. \[Changelog\](\#changelog)

\---

\#\# Getting Started

\#\#\# Quick Start

\*\*Step 1: Get Your API Key\*\*  
\`\`\`  
1\. Sign up at https://emailverifypro.com  
2\. Navigate to Dashboard → API Keys  
3\. Click "Create New API Key"  
4\. Copy your key (starts with evp\_live\_...)  
\`\`\`

\*\*Step 2: Make Your First Request\*\*  
\`\`\`bash  
curl \-X POST https://api.emailverifypro.com/v1/verify/single \\  
  \-H "Authorization: Bearer evp\_live\_your\_api\_key\_here" \\  
  \-H "Content-Type: application/json" \\  
  \-d '{"email":"test@example.com"}'  
\`\`\`

\*\*Step 3: Review the Response\*\*  
\`\`\`json  
{  
  "email": "test@example.com",  
  "status": "valid",  
  "score": 95,  
  "details": {  
    "syntax": true,  
    "domain": true,  
    "mx": true,  
    "smtp": true,  
    "disposable": false,  
    "role": false  
  },  
  "credits\_consumed": 1,  
  "processing\_time": 0.247  
}  
\`\`\`

\---

\#\# Authentication

\#\#\# API Keys

All API requests require authentication using an API key in the \`Authorization\` header:  
\`\`\`  
Authorization: Bearer evp\_live\_your\_api\_key\_here  
\`\`\`

\#\#\# API Key Types

\*\*Live Keys\*\* (Production):  
\- Prefix: \`evp\_live\_\`  
\- Used for production verification  
\- Consumes credits

\*\*Test Keys\*\* (Development):  
\- Prefix: \`evp\_test\_\`  
\- Used for testing integration  
\- Does not consume credits  
\- Returns mock data

\#\#\# Security Best Practices

✅ \*\*Do:\*\*  
\- Store API keys in environment variables  
\- Use different keys for development and production  
\- Rotate keys regularly  
\- Revoke compromised keys immediately

❌ \*\*Don't:\*\*  
\- Commit API keys to version control  
\- Share keys publicly (GitHub, forums, etc.)  
\- Use production keys in client-side code  
\- Reuse keys across multiple applications

\#\#\# Creating API Keys

\*\*Via Dashboard:\*\*  
1\. Go to Dashboard → API Keys  
2\. Click "Create New Key"  
3\. Enter a descriptive name (e.g., "Production Server")  
4\. Copy the key immediately (shown only once)

\*\*Key Management:\*\*  
\- View all active keys  
\- See last used timestamp  
\- Revoke keys at any time  
\- Create unlimited keys per account

\---

\#\# Rate Limits

\#\#\# Standard Limits

| Plan | Rate Limit | Burst Limit |  
|------|------------|-------------|  
| \*\*Free\*\* | 10 requests/minute | 20 requests |  
| \*\*Paid\*\* | 100 requests/minute | 200 requests |  
| \*\*Enterprise\*\* | 1,000 requests/minute | 2,000 requests |

\#\#\# Rate Limit Headers

Every API response includes rate limit information:  
\`\`\`  
X-RateLimit-Limit: 100  
X-RateLimit-Remaining: 87  
X-RateLimit-Reset: 1642531200  
\`\`\`

\- \`X-RateLimit-Limit\`: Maximum requests per window  
\- \`X-RateLimit-Remaining\`: Requests remaining in current window  
\- \`X-RateLimit-Reset\`: Unix timestamp when window resets

\#\#\# Handling Rate Limits

When you exceed the rate limit, you'll receive a \`429 Too Many Requests\` response:  
\`\`\`json  
{  
  "error": {  
    "code": "rate\_limit\_exceeded",  
    "message": "Rate limit exceeded. Please retry after 60 seconds.",  
    "retry\_after": 60  
  }  
}  
\`\`\`

\*\*Best Practices:\*\*  
\- Implement exponential backoff  
\- Cache results when possible  
\- Use batch endpoints for multiple emails  
\- Monitor \`X-RateLimit-Remaining\` header  
\- Upgrade plan if consistently hitting limits

\---

\#\# Error Handling

\#\#\# HTTP Status Codes

| Code | Meaning | Description |  
|------|---------|-------------|  
| \`200\` | OK | Request successful |  
| \`400\` | Bad Request | Invalid parameters or request format |  
| \`401\` | Unauthorized | Missing or invalid API key |  
| \`402\` | Payment Required | Insufficient credits |  
| \`404\` | Not Found | Resource does not exist |  
| \`429\` | Too Many Requests | Rate limit exceeded |  
| \`500\` | Internal Server Error | Server error, contact support |  
| \`503\` | Service Unavailable | Temporary service disruption |

\#\#\# Error Response Format

All errors return a consistent JSON structure:  
\`\`\`json  
{  
  "error": {  
    "code": "insufficient\_credits",  
    "message": "You need 100 credits but only have 23 remaining.",  
    "details": {  
      "required": 100,  
      "available": 23  
    }  
  }  
}  
\`\`\`

\#\#\# Common Error Codes

\#\#\#\# Authentication Errors  
\`\`\`json  
{  
  "error": {  
    "code": "invalid\_api\_key",  
    "message": "The provided API key is invalid or has been revoked."  
  }  
}  
\`\`\`

\#\#\#\# Validation Errors  
\`\`\`json  
{  
  "error": {  
    "code": "invalid\_email\_format",  
    "message": "The email address 'not-an-email' is not valid.",  
    "details": {  
      "email": "not-an-email",  
      "reason": "Invalid syntax"  
    }  
  }  
}  
\`\`\`

\#\#\#\# Credit Errors  
\`\`\`json  
{  
  "error": {  
    "code": "insufficient\_credits",  
    "message": "You need 1 credit but your balance is 0.",  
    "details": {  
      "required": 1,  
      "available": 0,  
      "upgrade\_url": "https://emailverifypro.com/dashboard/billing"  
    }  
  }  
}  
\`\`\`

\---

\#\# Endpoints

\#\#\# Overview

| Endpoint | Method | Description |  
|----------|--------|-------------|  
| \`/verify/single\` | POST | Verify a single email address |  
| \`/verify/batch\` | POST | Verify up to 100 emails synchronously |  
| \`/verify/bulk\` | POST | Start async bulk verification job |  
| \`/verify/job/{id}\` | GET | Get status of bulk job |  
| \`/verify/job/{id}/results\` | GET | Download bulk job results |  
| \`/credits/balance\` | GET | Check credit balance |  
| \`/credits/history\` | GET | View credit transaction history |

\---

\#\#\# Verify Single Email

Verify a single email address in real-time.

\*\*Endpoint:\*\*  
\`\`\`  
POST /v1/verify/single  
\`\`\`

\*\*Request:\*\*  
\`\`\`json  
{  
  "email": "user@example.com"  
}  
\`\`\`

\*\*Response:\*\*  
\`\`\`json  
{  
  "email": "user@example.com",  
  "status": "valid",  
  "score": 95,  
  "details": {  
    "syntax": true,  
    "domain": true,  
    "mx": true,  
    "smtp": true,  
    "disposable": false,  
    "role": false,  
    "free\_provider": true,  
    "accept\_all": false  
  },  
  "metadata": {  
    "domain": "example.com",  
    "provider": "Gmail",  
    "created\_at": "2026-01-23T14:30:00Z"  
  },  
  "credits\_consumed": 1,  
  "processing\_time": 0.247  
}  
\`\`\`

\*\*Status Values:\*\*  
\- \`valid\` \- Email is safe to send to  
\- \`invalid\` \- Email does not exist or will bounce  
\- \`risky\` \- Email exists but has risk factors  
\- \`unknown\` \- Cannot determine status (server timeout, etc.)  
\- \`catch\_all\` \- Domain accepts all emails (moderate risk)

\*\*Details Object:\*\*  
\- \`syntax\`: Email format is valid  
\- \`domain\`: Domain exists and has MX records  
\- \`mx\`: Mail server is configured  
\- \`smtp\`: SMTP server responds positively  
\- \`disposable\`: Is a temporary/disposable email  
\- \`role\`: Is a role-based email (info@, support@, etc.)  
\- \`free\_provider\`: Uses free email provider (Gmail, Yahoo, etc.)  
\- \`accept\_all\`: Domain is catch-all (accepts any email)

\*\*Example Request (cURL):\*\*  
\`\`\`bash  
curl \-X POST https://api.emailverifypro.com/v1/verify/single \\  
  \-H "Authorization: Bearer evp\_live\_your\_api\_key" \\  
  \-H "Content-Type: application/json" \\  
  \-d '{"email":"user@example.com"}'  
\`\`\`

\*\*Example Request (Python):\*\*  
\`\`\`python  
import requests

url \= "https://api.emailverifypro.com/v1/verify/single"  
headers \= {  
    "Authorization": "Bearer evp\_live\_your\_api\_key",  
    "Content-Type": "application/json"  
}  
data \= {"email": "user@example.com"}

response \= requests.post(url, json=data, headers=headers)  
result \= response.json()

print(f"Status: {result\['status'\]}")  
print(f"Score: {result\['score'\]}")  
\`\`\`

\*\*Example Request (Node.js):\*\*  
\`\`\`javascript  
const axios \= require('axios');

const verifyEmail \= async (email) \=\> {  
  const response \= await axios.post(  
    'https://api.emailverifypro.com/v1/verify/single',  
    { email },  
    {  
      headers: {  
        'Authorization': 'Bearer evp\_live\_your\_api\_key',  
        'Content-Type': 'application/json'  
      }  
    }  
  );  
    
  return response.data;  
};

verifyEmail('user@example.com').then(result \=\> {  
  console.log(\`Status: ${result.status}\`);  
  console.log(\`Score: ${result.score}\`);  
});  
\`\`\`

\*\*Example Request (PHP):\*\*  
\`\`\`php  
\<?php  
$url \= 'https://api.emailverifypro.com/v1/verify/single';  
$data \= array('email' \=\> 'user@example.com');

$options \= array(  
    'http' \=\> array(  
        'header'  \=\> "Authorization: Bearer evp\_live\_your\_api\_key\\r\\n" .  
                     "Content-Type: application/json\\r\\n",  
        'method'  \=\> 'POST',  
        'content' \=\> json\_encode($data)  
    )  
);

$context  \= stream\_context\_create($options);  
$result \= file\_get\_contents($url, false, $context);  
$response \= json\_decode($result);

echo "Status: " . $response-\>status . "\\n";  
echo "Score: " . $response-\>score . "\\n";  
?\>  
\`\`\`

\---

\#\#\# Verify Batch (Synchronous)

Verify up to 100 emails in a single request with immediate results.

\*\*Endpoint:\*\*  
\`\`\`  
POST /v1/verify/batch  
\`\`\`

\*\*Request:\*\*  
\`\`\`json  
{  
  "emails": \[  
    "user1@example.com",  
    "user2@example.com",  
    "user3@example.com"  
  \]  
}  
\`\`\`

\*\*Constraints:\*\*  
\- Maximum 100 emails per request  
\- Duplicate emails processed only once  
\- Returns results for all emails in single response

\*\*Response:\*\*  
\`\`\`json  
{  
  "results": \[  
    {  
      "email": "user1@example.com",  
      "status": "valid",  
      "score": 95  
    },  
    {  
      "email": "user2@example.com",  
      "status": "invalid",  
      "score": 15  
    },  
    {  
      "email": "user3@example.com",  
      "status": "risky",  
      "score": 67  
    }  
  \],  
  "summary": {  
    "total": 3,  
    "valid": 1,  
    "invalid": 1,  
    "risky": 1,  
    "unknown": 0,  
    "catch\_all": 0  
  },  
  "credits\_consumed": 3,  
  "processing\_time": 2.145  
}  
\`\`\`

\*\*Example Request (cURL):\*\*  
\`\`\`bash  
curl \-X POST https://api.emailverifypro.com/v1/verify/batch \\  
  \-H "Authorization: Bearer evp\_live\_your\_api\_key" \\  
  \-H "Content-Type: application/json" \\  
  \-d '{  
    "emails": \[  
      "user1@example.com",  
      "user2@example.com",  
      "user3@example.com"  
    \]  
  }'  
\`\`\`

\---

\#\#\# Verify Bulk (Asynchronous)

Start a bulk verification job for large lists (100+ emails). Returns job ID for status polling.

\*\*Endpoint:\*\*  
\`\`\`  
POST /v1/verify/bulk  
\`\`\`

\*\*Request:\*\*  
\`\`\`json  
{  
  "emails": \["email1@example.com", "email2@example.com", "..."\],  
  "callback\_url": "https://yourdomain.com/webhook" // optional  
}  
\`\`\`

\*\*Response:\*\*  
\`\`\`json  
{  
  "job\_id": "job\_abc123xyz",  
  "status": "queued",  
  "total\_emails": 10000,  
  "estimated\_completion": "2026-01-23T15:00:00Z",  
  "credits\_required": 10000,  
  "credits\_available": 25000  
}  
\`\`\`

\*\*Job Status Values:\*\*  
\- \`queued\` \- Job is waiting to be processed  
\- \`processing\` \- Job is currently being processed  
\- \`completed\` \- Job finished successfully  
\- \`failed\` \- Job encountered an error

\---

\#\#\# Get Job Status

Check the status of a bulk verification job.

\*\*Endpoint:\*\*  
\`\`\`  
GET /v1/verify/job/{job\_id}  
\`\`\`

\*\*Response:\*\*  
\`\`\`json  
{  
  "job\_id": "job\_abc123xyz",  
  "status": "processing",  
  "progress": {  
    "total": 10000,  
    "processed": 6543,  
    "percentage": 65.43  
  },  
  "summary": {  
    "valid": 5234,  
    "invalid": 892,  
    "risky": 287,  
    "unknown": 85,  
    "catch\_all": 45  
  },  
  "estimated\_completion": "2026-01-23T14:55:00Z",  
  "started\_at": "2026-01-23T14:30:00Z"  
}  
\`\`\`

\*\*Polling Recommendations:\*\*  
\- Poll every 10-30 seconds for jobs under 10K emails  
\- Poll every 60 seconds for larger jobs  
\- Use webhooks instead of polling when possible

\---

\#\#\# Download Job Results

Download the results of a completed bulk job.

\*\*Endpoint:\*\*  
\`\`\`  
GET /v1/verify/job/{job\_id}/results?format=json  
\`\`\`

\*\*Query Parameters:\*\*  
\- \`format\` (optional): \`json\` or \`csv\` (default: \`json\`)  
\- \`filter\` (optional): \`valid\`, \`invalid\`, \`risky\`, \`all\` (default: \`all\`)

\*\*Response (JSON format):\*\*  
\`\`\`json  
{  
  "job\_id": "job\_abc123xyz",  
  "completed\_at": "2026-01-23T14:50:00Z",  
  "results": \[  
    {  
      "email": "user1@example.com",  
      "status": "valid",  
      "score": 95,  
      "details": { /\* ... \*/ }  
    },  
    {  
      "email": "user2@example.com",  
      "status": "invalid",  
      "score": 10,  
      "details": { /\* ... \*/ }  
    }  
    // ... more results  
  \],  
  "summary": {  
    "total": 10000,  
    "valid": 8234,  
    "invalid": 1123,  
    "risky": 456,  
    "unknown": 142,  
    "catch\_all": 45  
  },  
  "credits\_consumed": 9858 // unknown emails don't consume credits  
}  
\`\`\`

\*\*Response (CSV format):\*\*  
\`\`\`  
email,status,score  
user1@example.com,valid,95  
user2@example.com,invalid,10  
user3@example.com,risky,67  
\`\`\`

\---

\#\#\# Check Credit Balance

Get your current credit balance.

\*\*Endpoint:\*\*  
\`\`\`  
GET /v1/credits/balance  
\`\`\`

\*\*Response:\*\*  
\`\`\`json  
{  
  "balance": 12543,  
  "last\_purchase": {  
    "amount": 25000,  
    "date": "2026-01-15T09:30:00Z",  
    "price": 30.00  
  }  
}  
\`\`\`

\---

\#\#\# Credit Transaction History

View your credit transaction history.

\*\*Endpoint:\*\*  
\`\`\`  
GET /v1/credits/history?limit=50\&offset=0  
\`\`\`

\*\*Query Parameters:\*\*  
\- \`limit\` (optional): Results per page (default: 50, max: 100\)  
\- \`offset\` (optional): Pagination offset (default: 0\)  
\- \`type\` (optional): Filter by type (\`purchase\`, \`usage\`, \`refund\`)

\*\*Response:\*\*  
\`\`\`json  
{  
  "transactions": \[  
    {  
      "id": "txn\_abc123",  
      "type": "usage",  
      "amount": \-1523,  
      "balance\_after": 12543,  
      "description": "Bulk verification job\_abc123xyz",  
      "created\_at": "2026-01-23T14:50:00Z"  
    },  
    {  
      "id": "txn\_def456",  
      "type": "purchase",  
      "amount": 25000,  
      "balance\_after": 14066,  
      "description": "Purchased 25,000 credits",  
      "created\_at": "2026-01-15T09:30:00Z"  
    }  
  \],  
  "pagination": {  
    "total": 234,  
    "limit": 50,  
    "offset": 0,  
    "has\_more": true  
  }  
}  
\`\`\`

\---

\#\# Webhooks

\#\#\# Overview

Webhooks allow you to receive real-time notifications when events occur in your account.

\*\*Supported Events:\*\*  
\- \`verification.bulk.completed\` \- Bulk job finished  
\- \`credits.low\` \- Credit balance below threshold  
\- \`credits.depleted\` \- Credit balance reached zero

\#\#\# Configuring Webhooks

\*\*Via Dashboard:\*\*  
1\. Go to Settings → Webhooks  
2\. Click "Add Webhook URL"  
3\. Enter your endpoint URL  
4\. Select events to subscribe to  
5\. Save configuration

\*\*Webhook URL Requirements:\*\*  
\- Must use HTTPS (not HTTP)  
\- Must return \`200 OK\` within 5 seconds  
\- Must handle duplicate deliveries (idempotent)

\#\#\# Webhook Payload Structure

All webhook events use this format:  
\`\`\`json  
{  
  "id": "evt\_abc123xyz",  
  "type": "verification.bulk.completed",  
  "created\_at": "2026-01-23T14:50:00Z",  
  "data": {  
    "job\_id": "job\_abc123xyz",  
    "status": "completed",  
    "summary": {  
      "total": 10000,  
      "valid": 8234,  
      "invalid": 1123,  
      "risky": 456,  
      "unknown": 142,  
      "catch\_all": 45  
    },  
    "credits\_consumed": 9858,  
    "results\_url": "https://api.emailverifypro.com/v1/verify/job/job\_abc123xyz/results"  
  }  
}  
\`\`\`

\#\#\# Webhook Signatures

Every webhook includes a signature for verification:

\*\*Headers:\*\*  
\`\`\`  
X-Webhook-Signature: sha256=abc123...  
X-Webhook-Timestamp: 1642531200  
\`\`\`

\*\*Verification (Python):\*\*  
\`\`\`python  
import hmac  
import hashlib

def verify\_webhook(payload, signature, secret):  
    expected \= hmac.new(  
        secret.encode(),  
        payload.encode(),  
        hashlib.sha256  
    ).hexdigest()  
      
    return hmac.compare\_digest(f"sha256={expected}", signature)  
\`\`\`

\#\#\# Webhook Retry Logic

If your endpoint fails to respond with \`200 OK\`:  
1\. First retry: Immediately  
2\. Second retry: After 1 minute  
3\. Third retry: After 5 minutes  
4\. After 3 failures: Event is marked as failed

\*\*Best Practices:\*\*  
\- Return \`200 OK\` quickly (process async if needed)  
\- Log all webhook events for debugging  
\- Implement idempotency (deduplicate by \`event.id\`)  
\- Monitor for missed webhooks

\---

\#\# Code Examples

\#\#\# Complete Integration Examples

\#\#\#\# Python (with requests)  
\`\`\`python  
import requests

class EmailVerifyClient:  
    def \_\_init\_\_(self, api\_key):  
        self.api\_key \= api\_key  
        self.base\_url \= "https://api.emailverifypro.com/v1"  
        self.headers \= {  
            "Authorization": f"Bearer {api\_key}",  
            "Content-Type": "application/json"  
        }  
      
    def verify\_single(self, email):  
        """Verify a single email address"""  
        response \= requests.post(  
            f"{self.base\_url}/verify/single",  
            json={"email": email},  
            headers=self.headers  
        )  
        response.raise\_for\_status()  
        return response.json()  
      
    def verify\_batch(self, emails):  
        """Verify multiple emails (up to 100)"""  
        response \= requests.post(  
            f"{self.base\_url}/verify/batch",  
            json={"emails": emails},  
            headers=self.headers  
        )  
        response.raise\_for\_status()  
        return response.json()  
      
    def get\_balance(self):  
        """Check credit balance"""  
        response \= requests.get(  
            f"{self.base\_url}/credits/balance",  
            headers=self.headers  
        )  
        response.raise\_for\_status()  
        return response.json()

\# Usage  
client \= EmailVerifyClient("evp\_live\_your\_api\_key")  
result \= client.verify\_single("test@example.com")  
print(f"Status: {result\['status'\]}, Score: {result\['score'\]}")  
\`\`\`

\#\#\#\# Node.js (with axios)  
\`\`\`javascript  
const axios \= require('axios');

class EmailVerifyClient {  
  constructor(apiKey) {  
    this.apiKey \= apiKey;  
    this.baseUrl \= 'https://api.emailverifypro.com/v1';  
    this.headers \= {  
      'Authorization': \`Bearer ${apiKey}\`,  
      'Content-Type': 'application/json'  
    };  
  }

  async verifySingle(email) {  
    const response \= await axios.post(  
      \`${this.baseUrl}/verify/single\`,  
      { email },  
      { headers: this.headers }  
    );  
    return response.data;  
  }

  async verifyBatch(emails) {  
    const response \= await axios.post(  
      \`${this.baseUrl}/verify/batch\`,  
      { emails },  
      { headers: this.headers }  
    );  
    return response.data;  
  }

  async getBalance() {  
    const response \= await axios.get(  
      \`${this.baseUrl}/credits/balance\`,  
      { headers: this.headers }  
    );  
    return response.data;  
  }  
}

// Usage  
const client \= new EmailVerifyClient('evp\_live\_your\_api\_key');

(async () \=\> {  
  const result \= await client.verifySingle('test@example.com');  
  console.log(\`Status: ${result.status}, Score: ${result.score}\`);  
})();  
\`\`\`

\#\#\#\# PHP  
\`\`\`php  
\<?php

class EmailVerifyClient {  
    private $apiKey;  
    private $baseUrl \= 'https://api.emailverifypro.com/v1';

    public function \_\_construct($apiKey) {  
        $this-\>apiKey \= $apiKey;  
    }

    private function makeRequest($method, $endpoint, $data \= null) {  
        $url \= $this-\>baseUrl . $endpoint;  
          
        $options \= \[  
            'http' \=\> \[  
                'header' \=\> "Authorization: Bearer {$this-\>apiKey}\\r\\n" .  
                           "Content-Type: application/json\\r\\n",  
                'method' \=\> $method  
            \]  
        \];

        if ($data \!== null) {  
            $options\['http'\]\['content'\] \= json\_encode($data);  
        }

        $context \= stream\_context\_create($options);  
        $result \= file\_get\_contents($url, false, $context);  
          
        return json\_decode($result, true);  
    }

    public function verifySingle($email) {  
        return $this-\>makeRequest('POST', '/verify/single', \['email' \=\> $email\]);  
    }

    public function verifyBatch($emails) {  
        return $this-\>makeRequest('POST', '/verify/batch', \['emails' \=\> $emails\]);  
    }

    public function getBalance() {  
        return $this-\>makeRequest('GET', '/credits/balance');  
    }  
}

// Usage  
$client \= new EmailVerifyClient('evp\_live\_your\_api\_key');  
$result \= $client-\>verifySingle('test@example.com');

echo "Status: " . $result\['status'\] . "\\n";  
echo "Score: " . $result\['score'\] . "\\n";  
?\>  
\`\`\`

\#\#\#\# Ruby  
\`\`\`ruby  
require 'net/http'  
require 'json'

class EmailVerifyClient  
  def initialize(api\_key)  
    @api\_key \= api\_key  
    @base\_url \= 'https://api.emailverifypro.com/v1'  
  end

  def verify\_single(email)  
    make\_request('POST', '/verify/single', { email: email })  
  end

  def verify\_batch(emails)  
    make\_request('POST', '/verify/batch', { emails: emails })  
  end

  def get\_balance  
    make\_request('GET', '/credits/balance')  
  end

  private

  def make\_request(method, endpoint, body \= nil)  
    uri \= URI("\#{@base\_url}\#{endpoint}")  
    http \= Net::HTTP.new(uri.host, uri.port)  
    http.use\_ssl \= true

    request \= case method  
              when 'GET' then Net::HTTP::Get.new(uri)  
              when 'POST' then Net::HTTP::Post.new(uri)  
              end

    request\['Authorization'\] \= "Bearer \#{@api\_key}"  
    request\['Content-Type'\] \= 'application/json'  
    request.body \= body.to\_json if body

    response \= http.request(request)  
    JSON.parse(response.body)  
  end  
end

\# Usage  
client \= EmailVerifyClient.new('evp\_live\_your\_api\_key')  
result \= client.verify\_single('test@example.com')

puts "Status: \#{result\['status'\]}, Score: \#{result\['score'\]}"  
\`\`\`

\---

\#\# SDKs & Libraries

\#\#\# Official SDKs

\*\*Coming Soon:\*\*  
\- Python SDK (PyPI)  
\- Node.js SDK (npm)  
\- PHP SDK (Composer)  
\- Ruby Gem  
\- Go Module

\#\#\# Community Libraries

\*List of community-maintained libraries will appear here as they're created.\*

\#\#\# Integration Platforms

\*\*n8n Community Node:\*\*  
\`\`\`  
npm install n8n-nodes-emailverifypro  
\`\`\`

\*\*Zapier App:\*\*  
Available in Zapier App Directory \- search "EmailVerify Pro"

\*\*Make.com Module:\*\*  
Available in Make.com Apps \- search "EmailVerify Pro"

\---

\#\# Changelog

\#\#\# Version 1.0 (January 2026\)  
\- Initial API release  
\- Single email verification endpoint  
\- Batch verification endpoint  
\- Bulk verification with job management  
\- Credit balance and history endpoints  
\- Webhook support for bulk jobs

\#\#\# Upcoming Features  
\- Email list validation (check entire domains)  
\- Historical verification lookup  
\- Advanced filtering options  
\- Subscription management endpoints  
\- Team management API

\---

\#\# Support

\#\#\# Getting Help

\*\*Documentation\*\*: https://docs.emailverifypro.com  
\*\*Email Support\*\*: support@emailverifypro.com  
\*\*Live Chat\*\*: Available in dashboard  
\*\*Status Page\*\*: https://status.emailverifypro.com

\#\#\# Response Times  
\- Email: Within 24 hours  
\- Live Chat: During business hours (9am-5pm EST)  
\- Critical Issues: Within 1 hour

\---

\*\*END OF API DOCUMENTATION STRUCTURE\*\*  
