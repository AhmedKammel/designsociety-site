function bytesToHex(bytes){
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex){
  const clean = (hex || "").replaceAll(/[^0-9a-f]/gi, "");
  const out = new Uint8Array(clean.length / 2);
  for(let i=0;i<out.length;i++){
    out[i] = parseInt(clean.substr(i*2, 2), 16);
  }
  return out;
}

async function sha256Hex(text){
  const enc = new TextEncoder();
  const buf = enc.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return bytesToHex(new Uint8Array(hash));
}

function newSaltHex(lenBytes=16){
  const b = new Uint8Array(lenBytes);
  crypto.getRandomValues(b);
  return bytesToHex(b);
}

async function hashPassword(password, saltHex){
  // hash = sha256( saltHex + ":" + password )
  return await sha256Hex(`${saltHex}:${password}`);
}

window.__DS_CRYPTO__ = { bytesToHex, hexToBytes, sha256Hex, newSaltHex, hashPassword };
