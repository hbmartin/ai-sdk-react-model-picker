import { addons } from 'storybook/manager-api';
import { lightTheme } from './theme';

// Use light theme in the manager UI by default
addons.setConfig({
  theme: lightTheme
});
