import {createSeed, validateData} from './model.js';
const KEY = 'rotina-da-rafa:v1';
export function load() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return createSeed();
  return validateData(JSON.parse(raw));
}
export function save(data) {
  validateData(data);
  localStorage.setItem(KEY, JSON.stringify(data));
}
export {KEY};
