export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

export function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function safeServiceCall({ request, fallback }) {
  if (USE_MOCK_API) {
    return cloneDeep(fallback);
  }

  try {
    return await request();
  } catch (error) {
    console.warn("Service call failed; returning fallback data", error);
    return cloneDeep(fallback);
  }
}
