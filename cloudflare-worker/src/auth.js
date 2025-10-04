// Firebase token verification for Cloudflare Workers
// This validates Firebase ID tokens without Firebase Admin SDK

export async function verifyFirebaseToken(token) {
  // Get Firebase project ID from token (or set as env var)
  const decoded = parseJwt(token);

  if (!decoded) {
    throw new Error('Invalid token format');
  }

  // Verify token signature using Firebase public keys
  const projectId = decoded.aud; // Firebase project ID is in the audience claim
  const keys = await getFirebasePublicKeys();

  const isValid = await verifySignature(token, keys, decoded);

  if (!isValid) {
    throw new Error('Invalid token signature');
  }

  // Verify token claims
  if (decoded.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  return {
    uid: decoded.sub,
    email: decoded.email,
    emailVerified: decoded.email_verified
  };
}

function parseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    return null;
  }
}

async function getFirebasePublicKeys() {
  const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  return await response.json();
}

async function verifySignature(token, keys, decoded) {
  const kid = getKidFromToken(token);
  const publicKey = keys[kid];

  if (!publicKey) {
    return false;
  }

  // Import the key and verify
  try {
    const parts = token.split('.');
    const header = parts[0];
    const payload = parts[1];
    const signature = parts[2];

    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(publicKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureData = base64UrlDecode(signature);
    const dataToVerify = new TextEncoder().encode(`${header}.${payload}`);

    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureData,
      dataToVerify
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function getKidFromToken(token) {
  const parts = token.split('.');
  const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
  return header.kid;
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\n/g, '');

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
