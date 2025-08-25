// Simple toast implementation
export const toast = {
  success: (message: string) => {
    console.log('✅ Success:', message);
    // You can implement a proper toast UI later
    if (typeof window !== 'undefined') {
      // Simple browser notification for now
      const event = new CustomEvent('toast', {
        detail: { type: 'success', message }
      });
      window.dispatchEvent(event);
    }
  },
  error: (message: string) => {
    console.error('❌ Error:', message);
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', {
        detail: { type: 'error', message }
      });
      window.dispatchEvent(event);
    }
  },
  info: (message: string) => {
    console.log('ℹ️ Info:', message);
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', {
        detail: { type: 'info', message }
      });
      window.dispatchEvent(event);
    }
  }
};
