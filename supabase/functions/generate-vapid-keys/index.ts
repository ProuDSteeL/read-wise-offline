const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    // Export public key as raw (uncompressed point)
    const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey));
    const publicKeyBase64Url = uint8ArrayToBase64Url(publicKeyRaw);

    // Export private key as PKCS8, extract the 32-byte raw scalar
    const privateKeyPkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey));
    // The raw 32-byte key is at the end of the PKCS8 structure
    const rawPrivateKey = privateKeyPkcs8.slice(privateKeyPkcs8.length - 32);
    const privateKeyBase64Url = uint8ArrayToBase64Url(rawPrivateKey);

    return new Response(
      JSON.stringify({ publicKey: publicKeyBase64Url, privateKey: privateKeyBase64Url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
