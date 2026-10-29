const PATHS = {
  key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-5-5 3-3m-1 5 3-3"/>',
  chest: '<path d="M3 10V7c0-3 18-3 18 0v3M3 10h18v11H3V10Zm0 4h18M10 12h4v5h-4v-5Z"/>',
  stairs: '<path d="M3 21h6v-5h5v-5h7V3M4 4l6 6m-6 0h6V4"/>',
  potion: '<path d="M9 2h6v5l5 9c2 5-18 5-16 0l5-9V2Zm0 4h6M6 14h12"/>',
  sword: '<path d="m4 20 5-5m-3-3 6 6M9 15l9-11 3-1-1 4-9 10M3 17l4 4"/>',
  axe: '<path d="M5 21 16 5m-6-1c5-2 8-1 11 2l-6 7c-3-1-5-3-5-9ZM3 19l3 3"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  heart: '<path d="M20.8 5.8c-2.5-2.8-6-1.8-8.8 1.2C9.2 4 5.7 3 3.2 5.8-.7 10.2 6 16 12 21c6-5 12.7-10.8 8.8-15.2Z"/>',
  leaf: '<path d="M20 3C9 2 2 7 5 15c3 7 17 4 15-12ZM4 21 17 7M8 15l6 1M12 11V7"/>',
  drop: '<path d="M12 2C9 7 4 11 4 15a8 8 0 0 0 16 0c0-4-5-8-8-13ZM8 15c0 3 1 4 4 4"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="3"/><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4"/>',
  rotate: '<path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h.01M17 7h.01M12 12h.01M7 17h.01M17 17h.01" stroke-width="3"/>',
  arrow: '<path d="m3 21 17-17m-9 0h9v9M3 14v7h7m-4-9 6 6"/>',
  flame: '<path d="M13 2c1 8-6 7-4 13 1-3 4-3 4-5 9 7 6 12-1 12S0 13 7 7c-1 5 2 5 2 5s0-5 4-10Z"/>',
  thorn: '<path d="M3 20 21 3M8 15 4 8m9 2-2-7m-1 10 8 2m-4-8h8M4 19l-1-5"/>',
  castle: '<path d="M4 21V9h4V4h3v5h2V4h3v5h4v12H4Zm6 0v-6h4v6M5 4v3m14-3v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="m12 6 4 6-4 6-4-6 4-6Z"/>',
  feather: '<path d="M4 21 17 7M6 18C-2 11 16-1 21 3c2 5-7 21-15 15Zm3-4h7m-4-4h7"/>',
  gem: '<path d="m7 3-5 6 10 13L22 9l-5-6H7ZM2 9h20M7 3l5 19 5-19"/>',
  crown: '<path d="M3 6 7 10l5-7 5 7 4-4-2 13H5L3 6Zm3 10h12"/>',
  skull: '<path d="M7 18H5v-4C0 4 8 2 12 2s12 2 7 12v4h-2v4H7v-4Z"/><circle cx="8" cy="11" r="2"/><circle cx="16" cy="11" r="2"/><path d="m11 16 1-2 1 2m-3 3v3m4-3v3"/>',
  tower: '<path d="M5 22V9l7-7 7 7v13H5ZM3 9h18M9 22v-5h6v5M9 12h6"/>',
  book: '<path d="M12 6c-4-3-7-3-10-2v16c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-1-10 2Zm0 0v16"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v.01"/>',
  sound: '<path d="m11 3-6 5H2v8h3l6 5V3Zm4 5c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  mute: '<path d="m11 3-6 5H2v8h3l6 5V3Zm5 6 6 6m0-6-6 6"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
};
export function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || PATHS.spark}</svg>`;
}
let artSerial = 0;
export function creature(kind, color = '#b99a67') {
  const id=`art${++artSerial}`;
  let body='';
  if(kind==='hero') body=`<path d="m75 179 13-65 32-18 32 18 14 65-40 17Z" fill="#476858"/><path d="m89 113-22 67 33-6 20-55 21 56 31 5-22-67" fill="#324e47"/><path d="m105 91 5 26 22 0 5-26" fill="#c4a681"/><path d="M91 92c0-44 58-44 58 0l-7 15h-42Z" fill="#24413b"/><path d="M102 85q18-17 36 0l-6 18h-23Z" fill="#ad9272"/><path d="M106 87h27l-5 8h-18Z" fill="#172d2b"/><path d="m85 121-12 34 12 5 12-30M151 122l14 28-11 9-16-30" fill="#b6956a"/><path d="m165 141 16-59 8-11 1 14-15 60Z" fill="#e8d8a9"/><path d="m158 141 24 7m-15-9-6 22" stroke="#9d783e" stroke-width="6"/><path d="M96 159h48v11H96Z" fill="#a78047"/><path d="m100 176-5 26h17l8-23 9 23h18l-7-26" fill="#172e2b"/><path d="m109 118 11 9 12-9-12 26Z" fill="#c8ab6d"/>`;
  else if(kind==='slime') body=`<path d="M48 171c0-29 14-50 40-61 4-46 57-59 74-11 30 5 45 37 39 72-15 35-132 37-153 0Z" fill="url(#${id}body)"/><path d="M66 157q17-51 43-29m48-16 20 38" stroke="#c1d2a1" stroke-width="8" opacity=".3"/><ellipse cx="100" cy="151" rx="7" ry="11" fill="#153b32"/><ellipse cx="150" cy="149" rx="7" ry="11" fill="#153b32"/><path d="M115 167q11 10 21-1" stroke="#315649" stroke-width="4"/><path d="m111 90 8-20 13 17 13-11 4 28" fill="#aeb87c"/><circle cx="75" cy="177" r="8" fill="#aec68b" opacity=".4"/>`;
  else if(kind==='wisp') body=`<path d="M65 185q-25-69 17-96-12-43 29-59-11 34 24 40 60 19 38 76l18 27-33 7-22 22-20-17-32 19 6-25Z" fill="url(#${id}body)"/><path d="M98 155q-35-41 20-73-12 36 22 49 23 20-6 40l-6-17-15 19Z" fill="#b8ebe1" opacity=".65"/><path d="m100 125 13 8m30-8-12 8" stroke="#183e3b" stroke-width="5"/><circle cx="120" cy="153" r="7" fill="#183e3b"/>`;
  else if(kind==='spider') body=`<path d="m87 113-39-26-19 37m64 8-46-2-24 40m72-24-40 22-13 29m110-84 39-26 20 37m-64 8 46-2 24 40m-72-24 40 22 13 29" stroke="${color}" stroke-width="9" fill="none"/><ellipse cx="122" cy="116" rx="38" ry="44" fill="url(#${id}body)"/><ellipse cx="122" cy="155" rx="30" ry="28" fill="#4a4159"/><path d="m101 172-7 16m48-16 8 16" stroke="#c7b5ac" stroke-width="5"/><circle cx="109" cy="152" r="5" fill="#e1b59c"/><circle cx="135" cy="152" r="5" fill="#e1b59c"/><path d="m117 97 5-9 6 9-6 12Z" fill="#dfd1ba" opacity=".7"/>`;
  else if(kind==='beast') body=`<path d="m58 177 8-54 22-33 6-35 22 16 24-3 24-17 7 44 24 36 5 45-29 16-18-19-14 23-25-14-24 13Z" fill="url(#${id}body)"/><path d="m86 104 27 13-12 11-23-13m57 2 26-14 8 15-24 12" fill="#263735"/><path d="m94 140 50-3-11 32-22-1Z" fill="#243533"/><path d="m99 140 7 17 7-16m15-1 5 15 5-17" fill="#dfcba8"/><path d="m91 80 6-17 11 15m40-1 15-17 2 23" fill="#5c4a42"/>`;
  else if(kind==='mage'||kind==='oracle') body=`<path d="m63 190 23-81 17-28 34-3 21 31 21 81-57 14Z" fill="url(#${id}body)"/><path d="m105 108 17 59 14-59-5 78h-18Z" fill="#d3bb86"/><path d="M91 95 100 59l24-29 28 33 2 32-28 16Z" fill="#393a4e"/><path d="m108 82 18-9 18 9-9 17h-18Z" fill="#bbb0bb"/><path d="M114 85h21" stroke="#172f32" stroke-width="6"/><path d="M65 157 43 100m1 0-4-37m0 2-13 11 14 13 14-13Z" stroke="#d0b172" stroke-width="5" fill="#7e759c"/><path d="m151 126 18 30 16-2" stroke="#a6a1b9" stroke-width="13"/>${kind==='oracle'?`<circle cx="125" cy="60" r="52" stroke="#c8b375" stroke-width="1.5" fill="none"/><path d="m82 58 13-42 22 18 12-30 15 30 23-13 4 37" stroke="#d5bd82" stroke-width="4" fill="none"/><circle cx="125" cy="3" r="4" fill="#eadbad"/>`:''}`;
  else if(kind==='rogue') body=`<path d="m69 193 19-72 27-23 24 8 19 31 14 56-49 7Z" fill="url(#${id}body)"/><path d="m98 172-10 31h18l15-29 11 29h17l-3-36" fill="#1e3331"/><path d="m95 107 4-40 24-29 26 33 1 35-27 16Z" fill="#3c4441"/><path d="m106 85 17-6 16 6-8 17h-17Z" fill="#c2a685"/><path d="m108 89 29 0" stroke="#20302e" stroke-width="5"/><path d="m87 128-24 34 10 7 24-25m54-14 22 32-10 6-21-27" fill="#a99274"/><path d="m61 163-13-37 21 31m102 8 17-38-9 44" fill="#c3c8b3"/><path d="M94 164h58" stroke="#bc9c60" stroke-width="7"/>`;
  else body=`<path d="m68 184 13-69 22-20 38 0 25 22 13 67-28 14H95Z" fill="url(#${id}body)"/><path d="m91 109 32 12 31-13-7 54-23 18-26-17Z" fill="#78867d"/><path d="m104 120 19 9 20-9-7 30-13 10-14-10Z" fill="#c6ad70"/><path d="M96 100V63l26-18 29 18v38l-28 12Z" fill="#9f9b80"/><path d="M99 75h48v12H99Z" fill="#1d3733"/><path d="M123 53v47m-10-29-1 19m23-19v19" stroke="#cdba86" stroke-width="3"/><path d="m70 128-23 4-2 46 29 16 26-25-4-38Z" fill="#7b8d7c" stroke="#cab37a" stroke-width="4"/><path d="m57 148 16-6 11 8-13 25Z" fill="#d2b97c"/><path d="m166 151 17-76 6-13 3 17-15 77Z" fill="#d2d5bc"/><path d="m163 149 25 7" stroke="#b59959" stroke-width="6"/><path d="m98 185-5 21h20l10-21 10 21h21l-9-21" fill="#243b35"/>${kind==='boss'?'<path d="m98 61-7-28 22 13 11-29 13 28 24-12-10 29" fill="#cfac64"/>':''}`;
  return `<svg class="creature creature-${kind}" viewBox="0 0 240 220" fill="none" aria-hidden="true"><defs><linearGradient id="${id}body" x1="80" y1="60" x2="170" y2="210" gradientUnits="userSpaceOnUse"><stop stop-color="${color}"/><stop offset="1" stop-color="#334b43"/></linearGradient></defs><ellipse cx="123" cy="204" rx="77" ry="10" fill="#061917" opacity=".5"/>${body}</svg>`;
}
export function towerArt() {
  const id=`tower${++artSerial}`;
  let windows='';
  for(let row=0;row<8;row++)for(let col=0;col<3;col++){ const x=278+col*44,y=155+row*48; windows+=`<path d="M${x} ${y+17}v-12a7 7 0 0 1 14 0v12Z" fill="${(row+col)%3===0?'#d5b779':'#152f2d'}" opacity="${(row+col)%3===0?'.8':'.9'}"/>`; }
  return `<svg class="tower-art" viewBox="0 0 650 650" fill="none" aria-hidden="true"><defs><linearGradient id="${id}stone" x1="220" x2="420" y1="90" y2="580" gradientUnits="userSpaceOnUse"><stop stop-color="#557267"/><stop offset="1" stop-color="#1b3934"/></linearGradient><radialGradient id="${id}glow"><stop stop-color="#beaa6b" stop-opacity=".35"/><stop offset="1" stop-color="#779b80" stop-opacity="0"/></radialGradient></defs><circle cx="330" cy="285" r="250" fill="url(#${id}glow)"/><circle cx="330" cy="260" r="178" stroke="#9caa7d" stroke-opacity=".13"/><circle cx="330" cy="260" r="208" stroke="#9caa7d" stroke-opacity=".08" stroke-dasharray="3 13"/><path d="m66 565 93-86 54 21 65-104 50 38 67-33 52 86 51-1 89 79Z" fill="#152e2a"/><path d="M242 554V139h168v415Z" fill="url(#${id}stone)"/><path d="M231 150v-26l95-71 97 71v26Z" fill="#23453e"/><path d="m226 126 101-78 103 78-14 11-90-60-86 60Z" fill="#647a66"/><path d="m316 64 10-44 13 44" fill="#b09c63"/><path d="M260 546V186h12v360m116 0V186h12v360" stroke="#a5ae85" stroke-opacity=".2" stroke-width="5"/>${windows}<path d="M211 552V319h-48v233m275 0V272h48v280" fill="#355349"/><path d="m154 320 33-53 35 53m204-47 36-60 35 60" fill="#71816a"/><path d="M180 373v-24a7 7 0 0 1 14 0v24m261-46v-24a7 7 0 0 1 14 0v24" fill="#e0bf79" opacity=".6"/><path d="M298 555v-58a28 28 0 0 1 56 0v58Z" fill="#122d29" stroke="#7d8c6b" stroke-width="3"/><path d="m309 552 17-54 17 54" fill="#c6ae73" opacity=".5"/><path d="M230 556h193l18 17H212l18-17Zm-27 17h247l20 18H184l19-18Zm-25 18h299l22 20H156l22-20Z" fill="#4b6655"/><path d="M222 183h197m-180 98h174m-175 96h174m-175 62h174" stroke="#b3ba92" stroke-opacity=".1" stroke-width="5"/><path d="m243 220 33 15-14 58 17 33-18 68m144-52-35 35 17 38-20 37" stroke="#789b6f" stroke-width="8" opacity=".45"/><path d="M73 585q66-78 142-21m217-6q86-45 146 27M20 626q182-85 307-5 169-89 309 0" stroke="#203f34" stroke-width="36" stroke-linecap="round"/><path d="m92 580-5-42m0 21-20-16m20 6 21-21m441 52 8-53m-6 29 23-21" stroke="#49684a" stroke-width="6"/><circle cx="103" cy="225" r="3" fill="#bba875" opacity=".5"/><circle cx="518" cy="175" r="2" fill="#bba875" opacity=".5"/><circle cx="483" cy="376" r="3" fill="#bba875" opacity=".6"/></svg>`;
}
