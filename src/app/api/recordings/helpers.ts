export const dataUrlToBuffer = (dataUrl: string) => {
  const [, base64Payload] = dataUrl.split(",");
  return Buffer.from(base64Payload ?? "", "base64");
};
