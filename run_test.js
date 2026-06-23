const axios = require('axios');

const NOTIFICATION_API_URL = 'http://4.224.186.213/evaluation-service/notifications';

const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzYWxhbW9oYW4uMjMuY3NlQGFuaXRzLmVkdS5pbiIsImV4cCI6MTc4MjIwMDcxMSwiaWF0IjoxNzgyMTk5ODExLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiYTI2N2ZjZTMtNjE0ZC00NzNkLWI4NzYtOTlkNzZhMzVhYTJkIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibW9oYW4gc2FsYSIsInN1YiI6ImJiZTE3NDVkLWJmY2UtNDg0Ny05MjQyLWE1ODg5MGFjZThjMiJ9LCJlbWFpbCI6InNhbGFtb2hhbi4yMy5jc2VAYW5pdHMuZWR1LmluIiwibmFtZSI6Im1vaGFuIHNhbGEiLCJyb2xsTm8iOiJhMjMxMjY1MTAyODAiLCJhY2Nlc3NDb2RlIjoiTVRxeGFyIiwiY2xpZW50SUQiOiJiYmUxNzQ1ZC1iZmNlLTQ4NDctOTI0Mi1hNTg4OTBhY2U4YzIiLCJjbGllbnRTZWNyZXQiOiJkenRwblFhdnlUcHd5SE1tIn0.6FuZcAcnV4MMnHMcCYT926Wdt9HIPG8JJzLqlIOBE7A'; 

const TYPE_WEIGHTS = {
    'placement': 3,
    'result': 2,
    'event': 1
};

async function getPriorityInbox() {
    try {
        console.log("Connecting to API endpoint to fetch notifications...");
        
        // 1. Fetch live items from the protected route
        const response = await axios.get(NOTIFICATION_API_URL, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const notifications = response.data.notifications;
        if (!notifications || !Array.isArray(notifications)) {
            console.error("Error: Invalid response layout received from server.");
            return;
        }

        console.log(`Successfully fetched ${notifications.length} items. Processing priorities...`);

        // 2. Sort items by priority weights first, then fallback to recency timestamp
        const sortedNotifications = notifications.sort((a, b) => {
            const weightA = TYPE_WEIGHTS[a.Type.toLowerCase()] || 0;
            const weightB = TYPE_WEIGHTS[b.Type.toLowerCase()] || 0;

            // Primary Key: If weights are different, higher weight takes precedence
            if (weightB !== weightA) {
                return weightB - weightA;
            }

            // Secondary Key: If weights are equal, compare recency timestamps (Newest First)
            return new Date(b.Timestamp) - new Date(a.Timestamp);
        });

        // 3. Slice the array to isolate the top 10 priority elements
        const top10Notifications = sortedNotifications.slice(0, 10);

        // 4. Output the results cleanly to your console
        console.log(`\n==============================================`);
        console.log(`===== TOP 10 PRIORITY INBOX NOTIFICATIONS =====`);
        console.log(`==============================================\n`);
        
        top10Notifications.forEach((notif, index) => {
            console.log(`${index + 1}. [${notif.Type.toUpperCase()}] - ${notif.Timestamp}`);
            console.log(`   Message: ${notif.Message}`);
            console.log(`   ID: ${notif.ID}\n`);
        });

    } catch (error) {
        console.error("Error executing priority inbox pipeline:");
        if (error.response) {
            console.error(`Status Code: ${error.response.status}`);
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

// Execute evaluation processing script
getPriorityInbox();