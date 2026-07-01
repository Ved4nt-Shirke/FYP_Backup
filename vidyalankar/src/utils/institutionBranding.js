import { config } from "../config/api";

const getApiOrigin = () => config.apiBaseUrl.replace(/\/api\/?$/, "");

export const buildInstitutionLogoUrl = (logoUrl) => {
  if (!logoUrl || typeof logoUrl !== "string") return "";
  if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
    return logoUrl;
  }
  if (logoUrl.startsWith("/")) {
    return `${getApiOrigin()}${logoUrl}`;
  }
  return `${getApiOrigin()}/${logoUrl}`;
};

export const getInstitutionInitials = (name, code) => {
  const normalizedCode = (code || "").toString().trim().toUpperCase();
  if (normalizedCode) return normalizedCode.slice(0, 3);

  const words = (name || "")
    .toString()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "VP";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
};
