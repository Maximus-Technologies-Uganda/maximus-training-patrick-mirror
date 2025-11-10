#!/usr/bin/env node

/**
 * Seed script to create sample posts for demonstration purposes
 *
 * Usage:
 *   node scripts/seed-sample-posts.js [FRONTEND_URL]
 *
 * Examples:
 *   # Local development (uses frontend BFF fallback)
 *   node scripts/seed-sample-posts.js http://localhost:3001
 *
 *   # Production (requires proper authentication - see limitations below)
 *   node scripts/seed-sample-posts.js https://your-frontend-url.run.app
 *
 * Limitations:
 *   - Local development: Works with dev tokens created by frontend login
 *   - Production: Requires IAP/service authentication or manual post creation via UI
 *   - The script uses userId/name format which creates dev tokens that work locally
 *     but may not work in production if backend validates token signatures strictly
 */

// Use frontend URL - it will forward to backend API with proper authentication
const FRONTEND_URL = process.argv[2] || process.env.FRONTEND_URL || 'http://localhost:3001';
const API_URL = FRONTEND_URL; // Use frontend BFF - it handles authentication forwarding

// Detect environment
const IS_PRODUCTION =
  API_URL.includes('run.app') ||
  API_URL.includes('cloudfunctions.net') ||
  process.env.NODE_ENV === 'production';

const samplePosts = [
  {
    title: 'Welcome to Posts App!',
    content:
      'This is your first post. You can create, edit, and delete posts here. Try sorting by different criteria or creating your own post!',
    published: true,
    tags: ['welcome', 'getting-started'],
  },
  {
    title: 'Getting Started Guide',
    content:
      "Here's how to use this app:\n\n1. Sign in with your credentials\n2. Create a new post using the form\n3. Sort posts by date or title\n4. Navigate through pages if you have many posts\n\nHappy posting!",
    published: true,
    tags: ['guide', 'tutorial'],
  },
  {
    title: 'Tips for Great Posts',
    content:
      'Make your posts engaging:\n\n• Write clear and concise content\n• Use relevant tags\n• Keep titles descriptive\n• Share valuable insights\n\nRemember, quality over quantity!',
    published: true,
    tags: ['tips', 'best-practices'],
  },
  {
    title: 'Exploring Features',
    content:
      'This app includes several features:\n\n• Server-side rendering for fast page loads\n• Pagination for easy navigation\n• Sorting by date and title\n• Search functionality\n• Responsive design\n\nTry them all out!',
    published: true,
    tags: ['features', 'overview'],
  },
  {
    title: 'Community Guidelines',
    content:
      "Please follow these guidelines:\n\n• Be respectful to others\n• Share meaningful content\n• Use appropriate language\n• Follow community standards\n\nLet's build a positive community together!",
    published: true,
    tags: ['guidelines', 'community'],
  },
];

// Cookie storage for maintaining session across requests
let cookieJar = '';

function getAllCookies(response) {
  // Node.js fetch: set-cookie headers may be comma-separated in a single string
  // or we need to access raw headers
  let setCookieHeaders = [];

  // Try to get raw headers first (Node.js fetch may support this)
  if (response.headers.raw && typeof response.headers.raw === 'function') {
    const raw = response.headers.raw();
    setCookieHeaders = raw['set-cookie'] || [];
  } else if (response.headers.raw && Array.isArray(response.headers.raw['set-cookie'])) {
    setCookieHeaders = response.headers.raw['set-cookie'];
  } else {
    // Fallback: get single header and split if comma-separated
    const header = response.headers.get('set-cookie');
    if (header) {
      // Split by comma, but be careful - cookie values can contain commas
      // Simple approach: split by ', ' (comma-space) which is the standard separator
      setCookieHeaders = header.split(/,\s*(?=[^=]+=)/);
    }
  }

  if (!setCookieHeaders || setCookieHeaders.length === 0) return '';

  // Extract cookie name and value from each header
  const cookies = [];
  for (const header of setCookieHeaders) {
    const match = header.trim().match(/^([^=]+)=([^;]+)/);
    if (match) {
      cookies.push(`${match[1]}=${match[2]}`);
    }
  }

  return cookies.join('; ');
}

async function createPost(post, userId = 'admin') {
  try {
    // First, authenticate to get a session (only once)
    if (!cookieJar) {
      // Use frontend BFF API endpoint - it forwards to backend with proper auth
      const loginEndpoint = `${API_URL}/api/auth/login`;

      const loginResponse = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        // Use userId/name format - frontend creates local dev token with CSRF
        // Note: This creates a dev token that works for local development
        // In production, proper IAP/service authentication is required
        body: JSON.stringify({ userId: userId, name: userId }),
      });

      if (!loginResponse.ok) {
        await loginResponse.text(); // Consume response body
        console.error(`✗ Failed to authenticate: ${loginResponse.status}`);
        if (IS_PRODUCTION && loginResponse.status === 403) {
          console.error(
            `   Production environment detected. Authentication may require IAP/service tokens.`,
          );
        }
        return null;
      }

      // Extract all cookies from response (session and csrf)
      cookieJar = getAllCookies(loginResponse);

      if (!cookieJar) {
        console.error('No cookies received from login');
        return null;
      }

      // Verify cookies were extracted (only log in development)
      if (!IS_PRODUCTION) {
        const sessionMatch = cookieJar.match(/session=([^;]+)/);
        const csrfMatch = cookieJar.match(/csrf=([^;]+)/);
        console.log(`Debug: Session cookie: ${sessionMatch ? 'present' : 'missing'}`);
        console.log(`Debug: CSRF cookie: ${csrfMatch ? 'present' : 'missing'}`);
        if (csrfMatch) {
          console.log(`Debug: CSRF token: ${csrfMatch[1].substring(0, 30)}...`);
        }
      }
    }

    // Extract CSRF token from cookies
    const csrfMatch = cookieJar.match(/csrf=([^;]+)/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    // Create the post with cookies and CSRF token
    // Use frontend BFF API endpoint - it forwards to backend with proper auth
    const postsEndpoint = `${API_URL}/api/posts`;

    const createResponse = await fetch(postsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieJar,
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(post),
    });

    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log(`✓ Created post: "${post.title}" (ID: ${created.id})`);
      return created;
    } else {
      const errorText = await createResponse.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorText;
      } catch {
        // Use raw error text
      }

      // Provide helpful context for common errors
      if (createResponse.status === 401 && IS_PRODUCTION) {
        console.error(
          `✗ Failed to create "${post.title}": Authentication token rejected (expected in production)`,
        );
      } else if (createResponse.status === 400 && errorMessage.includes('CSRF')) {
        console.error(
          `✗ Failed to create "${post.title}": CSRF token issue - check cookie extraction`,
        );
      } else {
        console.error(
          `✗ Failed to create "${post.title}": ${createResponse.status} - ${errorMessage}`,
        );
      }
      return null;
    }
  } catch (error) {
    console.error(`✗ Error creating "${post.title}":`, error.message);
    return null;
  }
}

async function seedPosts() {
  console.log(`\n🌱 Seeding sample posts to ${API_URL}\n`);

  if (IS_PRODUCTION) {
    console.log(`⚠️  PRODUCTION MODE DETECTED\n`);
    console.log(`   This script uses dev tokens which may not work in production.`);
    console.log(`   If posts fail to create, consider:`);
    console.log(`   1. Creating posts manually via the browser UI`);
    console.log(`   2. Using proper IAP/service authentication`);
    console.log(`   3. Running this script against a local development environment\n`);
  } else {
    console.log(`✓ Local development mode - dev tokens will be used\n`);
  }

  console.log(`Using credentials: admin/admin (userId/name format)\n`);

  let successCount = 0;
  let failCount = 0;
  let firstError = null;

  // Reset cookie jar for fresh session
  cookieJar = '';

  for (const post of samplePosts) {
    const result = await createPost(post, 'admin', 'admin');
    if (result) {
      successCount++;
    } else {
      failCount++;
      // Capture first error for better diagnostics
      if (!firstError && failCount === 1) {
        firstError = post.title;
      }
    }
    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✓ Successfully created: ${successCount}`);
  console.log(`   ✗ Failed: ${failCount}`);

  if (failCount > 0 && IS_PRODUCTION) {
    console.log(`\n⚠️  Production Authentication Issue:`);
    console.log(`   The backend rejected the dev token. This is expected in production.`);
    console.log(`   Solutions:`);
    console.log(`   1. Use the browser UI: Log in at ${API_URL}/login, then create posts`);
    console.log(`   2. Configure IAP/service authentication for automated seeding`);
    console.log(`   3. Run this script against local development environment\n`);
  } else if (failCount > 0) {
    console.log(`\n⚠️  Some posts failed to create. Check the error messages above.\n`);
  }

  const frontendUrl = API_URL.includes('api')
    ? API_URL.replace('api', 'frontend').replace(':3000', ':3001')
    : FRONTEND_URL;

  if (successCount > 0) {
    console.log(
      `✨ Successfully created ${successCount} post(s)! Visit ${frontendUrl}/posts to see them.\n`,
    );
  } else {
    console.log(
      `\n💡 Tip: Try creating posts manually via the browser UI at ${frontendUrl}/posts\n`,
    );
  }
}

// Run the seed script
seedPosts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
