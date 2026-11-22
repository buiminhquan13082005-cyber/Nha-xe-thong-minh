// Màu lấy từ nha_de_xe/frontend/src/styles.css (:root) để web và app cùng một bộ nhận diện.
// Đổi màu ở web thì nhớ đổi ở đây.

export const mau = {
  nen: '#fbf6ef',
  the: '#ffffff',
  the2: '#f4ede3',
  chu: '#2c4660',
  mo: '#53677a',
  nhanO: '#3a5b76',
  chuGoiY: '#8a97a4',
  vien: '#e6dccd',
  chinh: '#ee8a76',
  chinhDam: '#ea7f69',
  chinhChu: '#b0463a',
  chuTrenChinh: '#1e3042',
  phuBacHa: '#97d4c8',
  phuVang: '#f9dc9e',
  phuNgoc: '#6dbfbf',
  ok: '#256b50',
  okNen: '#e3f2ee',
  loi: '#a83a2d',
  loiNen: '#fbe4dd',
  canh: '#8f5d0c',
  canhNen: '#fbefd2',
  tin: '#2a6a96',
  tinNen: '#e1f1f1',
} as const;

/** --bo: 14px ở web. */
export const bo = { lon: 14, vua: 10, nho: 6 } as const;

export const khoang = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export const chu = { nho: 13, thuong: 15, vua: 17, lon: 22, rat_lon: 28 } as const;

/** --bong: 0 12px 28px rgba(44, 70, 96, .14) */
export const bong = {
  shadowColor: '#2c4660',
  shadowOpacity: 0.14,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;
