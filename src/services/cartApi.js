/**
 * Cart APIs - require userId and Authorization token
 */

import { apiCall } from "./fetchApi";

export const cartApi = {
  /**
   * GET /cart/{userId} - Get user's cart items
   */
  async getCart(userId) {
    if (!userId) throw new Error("userId is required");
    try {
      return await apiCall(`/cart/${userId}`, "GET");
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      throw error;
    }
  },

  /**
   * POST /cart/{userId}/add - Add item to cart
   * @param {string} userId - User ID
   * @param {object} productData - Product data to add
   */
  async addToCart(userId, productData) {
    if (!userId) throw new Error("userId is required");
    if (!productData) throw new Error("productData is required");
    try {
      return await apiCall(`/cart/${userId}/add`, "POST", productData);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    }
  },

  /**
   * DELETE /cart/{userId}/{productId}/delete - Remove item from cart
   * @param {string} userId - User ID
   * @param {string} productId - Product ID to remove
   */
  async removeFromCart(userId, productId) {
    if (!userId) throw new Error("userId is required");
    if (!productId) throw new Error("productId is required");
    try {
      return await apiCall(`/cart/${userId}/${productId}/delete`, "DELETE");
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      throw error;
    }
  },
};
