import '@fontsource-variable/anek-latin';
import '@fontsource-variable/anek-devanagari';
import './styles/tokens.css';
import './styles/base.css';
import './styles/print.css';
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
