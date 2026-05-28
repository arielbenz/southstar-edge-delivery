import '../styles/styles.css';
import '../styles/tokens.css';

export default {
  parameters: {
    backgrounds: {
      options: {
        light: { name: 'light', value: '#ffffff' },
        gray: { name: 'gray', value: '#f5f5f5' },
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light',
    },
  },
};
