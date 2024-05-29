export const generateIV = (): Uint8Array =>
  crypto.getRandomValues(new Uint8Array(16));

const buildKey = async (secretKey: string): Promise<CryptoKey> => {
  const keyBuffer = Buffer.from(secretKey, "hex");
  return crypto.subtle.importKey("raw", keyBuffer, "AES-CBC", false, [
    "decrypt",
    "encrypt",
  ]);
};

export const encrypt = async (
  text: string,
  secretKey: string,
  iv: Uint8Array,
): Promise<Buffer> => {
  const key = await buildKey(secretKey);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    new Uint8Array(new TextEncoder().encode(text)),
  );
  return Buffer.from(new Uint8Array(encryptedBuffer));
};

export const decrypt = async (
  encryptedText: Buffer,
  secretKey: string,
  iv: Uint8Array,
): Promise<string> => {
  const key = await buildKey(secretKey);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    new Uint8Array(encryptedText),
  );
  return new TextDecoder().decode(decryptedBuffer);
};
